import { useMemo, useState } from 'react';
import Navigation from '@/components/Navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { FlaskConical, Search, Download, Info } from 'lucide-react';

// ---------- Sequence helpers ----------
function cleanDna(raw: string): string {
  return raw
    .split(/\r?\n/)
    .filter((l) => !l.startsWith('>'))
    .join('')
    .replace(/\s+/g, '')
    .toUpperCase()
    .replace(/U/g, 'T')
    .replace(/[^ACGTN]/g, '');
}

function gcContent(seq: string): number {
  if (!seq.length) return 0;
  const n = (seq.match(/[GC]/g) || []).length;
  return (n / seq.length) * 100;
}

function reverseComplement(seq: string): string {
  const c: Record<string, string> = { A: 'T', T: 'A', G: 'C', C: 'G', N: 'N' };
  let out = '';
  for (let i = seq.length - 1; i >= 0; i--) out += c[seq[i]] ?? 'N';
  return out;
}

// ---------- Tm calculations ----------
// Wallace rule: 2*(A+T) + 4*(G+C). Best for primers < 14 nt.
function tmWallace(seq: string): number {
  let at = 0, gc = 0;
  for (const b of seq) {
    if (b === 'A' || b === 'T') at++;
    else if (b === 'G' || b === 'C') gc++;
  }
  return 2 * at + 4 * gc;
}

// %GC rule (Howley/Marmur-Schildkraut): 64.9 + 41 * (G+C - 16.4)/N
function tmGC(seq: string): number {
  const n = seq.length;
  if (n === 0) return 0;
  const gc = (seq.match(/[GC]/g) || []).length;
  return 64.9 + 41 * (gc - 16.4) / n;
}

// Nearest-neighbor (SantaLucia 1998) — simplified version using NN ΔH/ΔS table.
// Returns Tm in °C at 50 mM Na+ and 250 nM primer.
const NN_PARAMS: Record<string, { dH: number; dS: number }> = {
  // ΔH (kcal/mol), ΔS (cal/mol·K)  — SantaLucia 1998 unified table
  AA: { dH: -7.9, dS: -22.2 }, TT: { dH: -7.9, dS: -22.2 },
  AT: { dH: -7.2, dS: -20.4 }, TA: { dH: -7.2, dS: -21.3 },
  CA: { dH: -8.5, dS: -22.7 }, TG: { dH: -8.5, dS: -22.7 },
  GT: { dH: -8.4, dS: -22.4 }, AC: { dH: -8.4, dS: -22.4 },
  CT: { dH: -7.8, dS: -21.0 }, AG: { dH: -7.8, dS: -21.0 },
  GA: { dH: -8.2, dS: -22.2 }, TC: { dH: -8.2, dS: -22.2 },
  CG: { dH: -10.6, dS: -27.2 }, GC: { dH: -9.8, dS: -24.4 },
  GG: { dH: -8.0, dS: -19.9 }, CC: { dH: -8.0, dS: -19.9 },
};

function tmNearestNeighbor(seq: string, primerConcNM = 250, naConcMM = 50): number {
  if (seq.length < 2) return 0;
  let dH = 0;
  let dS = 0;
  // Initiation (SantaLucia): A·T terminal +2.3 / +4.1, G·C terminal +0.1 / -2.8
  const isAT = (b: string) => b === 'A' || b === 'T';
  // 5' end
  if (isAT(seq[0])) { dH += 2.3; dS += 4.1; } else { dH += 0.1; dS += -2.8; }
  // 3' end
  if (isAT(seq[seq.length - 1])) { dH += 2.3; dS += 4.1; } else { dH += 0.1; dS += -2.8; }
  for (let i = 0; i < seq.length - 1; i++) {
    const pair = seq.slice(i, i + 2);
    const p = NN_PARAMS[pair];
    if (p) { dH += p.dH; dS += p.dS; }
  }
  // Salt correction (SantaLucia): dS += 0.368 * (N-1) * ln([Na+])
  dS += 0.368 * (seq.length - 1) * Math.log(naConcMM / 1000);
  // ΔG and Tm: Tm = ΔH*1000 / (ΔS + R ln(C/4)) - 273.15
  const R = 1.987; // cal/(mol·K)
  const C = primerConcNM * 1e-9; // M
  const tmK = (dH * 1000) / (dS + R * Math.log(C / 4));
  return tmK - 273.15;
}

// ---------- Primer quality checks ----------
function selfComplementScore(seq: string): number {
  // Number of complementary base pairs when seq is aligned with its reverse complement at best offset
  const rc = reverseComplement(seq);
  let best = 0;
  for (let offset = -seq.length + 1; offset < seq.length; offset++) {
    let count = 0;
    for (let i = 0; i < seq.length; i++) {
      const j = i + offset;
      if (j >= 0 && j < seq.length) {
        if (seq[i] === rc[j]) count++;
      }
    }
    if (count > best) best = count;
  }
  return best;
}

function threePrimeStability(seq: string): number {
  // Sum |ΔG| of last 5 nt nearest-neighbor pairs (rough indicator)
  const tail = seq.slice(-5);
  let dG = 0;
  for (let i = 0; i < tail.length - 1; i++) {
    const p = NN_PARAMS[tail.slice(i, i + 2)];
    if (p) {
      // ΔG = ΔH - T·ΔS, use 37°C
      const dg = p.dH - (310.15 * p.dS) / 1000;
      dG += Math.abs(dg);
    }
  }
  return dG;
}

interface PrimerCandidate {
  seq: string;
  start: number; // 1-based
  end: number;
  length: number;
  gcPct: number;
  tmNN: number;
  tmGC: number;
  tmWallace: number;
  selfComp: number;
  threePrimeDG: number;
  gcClamp: boolean;
  warnings: string[];
}

function scorePrimer(seq: string, start: number): PrimerCandidate {
  const tmNN = tmNearestNeighbor(seq);
  const tmGCVal = tmGC(seq);
  const tmW = tmWallace(seq);
  const gc = gcContent(seq);
  const sc = selfComplementScore(seq);
  const dG = threePrimeStability(seq);
  const last = seq[seq.length - 1];
  const gcClamp = last === 'G' || last === 'C';
  const warnings: string[] = [];
  if (gc < 40 || gc > 60) warnings.push('GC% outside 40–60');
  if (sc > seq.length * 0.6) warnings.push('Self-complementarity high');
  if (!gcClamp) warnings.push('No 3′ GC clamp');
  if (/AAAA|TTTT|GGGG|CCCC/.test(seq)) warnings.push('Runs ≥4');
  if (tmNN < 55 || tmNN > 65) warnings.push('Tm outside 55–65 °C');
  return {
    seq, start, end: start + seq.length - 1, length: seq.length,
    gcPct: gc, tmNN, tmGC: tmGCVal, tmWallace: tmW,
    selfComp: sc, threePrimeDG: dG, gcClamp, warnings,
  };
}

function scanCandidates(template: string, minLen = 18, maxLen = 24): PrimerCandidate[] {
  const cands: PrimerCandidate[] = [];
  for (let len = minLen; len <= maxLen; len++) {
    for (let i = 0; i + len <= template.length; i++) {
      const s = template.slice(i, i + len);
      if (s.includes('N')) continue;
      cands.push(scorePrimer(s, i + 1));
    }
  }
  return cands;
}

function rankPrimers(c: PrimerCandidate[], targetTm: number): PrimerCandidate[] {
  return [...c]
    .map((p) => ({
      ...p,
      _score:
        Math.abs(p.tmNN - targetTm) * 2 +
        (p.warnings.length * 5) +
        (p.gcClamp ? 0 : 5) +
        Math.max(0, p.selfComp - p.length * 0.4),
    }))
    .sort((a, b) => (a as any)._score - (b as any)._score) as PrimerCandidate[];
}

function downloadCsv(filename: string, rows: string[][]) {
  const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const DEMO = `>GAPDH_human_partial
ATGGGGAAGGTGAAGGTCGGAGTCAACGGATTTGGTCGTATTGGGCGCCTGGTCACCAGGGCTGCTTTTAACTCTGGTAAAGTGGATATTGTTGCCATCAATGACCCCTTCATTGACCTCAACTACATGGTTTACATGTTCCAATATGATTCCACCCATGGCAAATTCCATGGCACCGTCAAGGCTGAGAACGGGAAGCTTGTCATCAATGGAAATCCCATCACCATCTTCCAGGAGCGAGATCCCTCCAAAATCAAGTGGGGCGATGCTGGCGCTGAGTACGTCGTGGAGTCCACTGGCGTCTTCACCACCATGGAGAAGGCTGGGGCTCATTTGCAGGGGGGAGCCAAAAGGGTCATCATCTCTGCCCCCTCTGCTGATGCCCCCATGTTCGTCATGGGTGTGAACCATGAGAAGTATGACAACAGCCTCAAGATCATCAGCAATGCCTCCTGCACCACCAACTGCTTAGCACCCCTGGCCAAGGTCATCCATGACAACTTTGGTATCGTGGAAGGACTCATGACCACAGTCCATGCCATCACTGCCACCCAGAAGACTGTGGATGGCCCCTCCGGGAAACTGTGGCGTGATGGCCGCGGGGCTCTCCAGAACATCATCCCTGCCTCTACTGGCGCTGCCAAGGCTGTGGGCAAGGTCATCCCTGAGCTGAACGGGAAGCTCACTGGCATGGCCTTCCGTGTCCCCACTGCCAACGTGTCAGTGGTGGACCTGACCTGCCGTCTAGAAAAACCTGCCAAATATGATGACATCAAGAAGGTGGTGAAGCAGGCGTCGGAGGGCCCCCTCAAGGGCATCCTGGGCTACACTGAGCACCAGGTGGTCTCCTCTGACTTCAACAGCGACACCCACTCCTCCACCTTTGACGCTGGGGCTGGCATTGCCCTCAACGACCACTTTGTCAAGCTCATTTCCTGGTATGACAACGAATTTGGCTACAGCAACAGGGTGGTGGACCTCATGGCCCACATGGCCTCCAAGGAGTAA`;

export default function PrimerDesigner() {
  const [rawInput, setRawInput] = useState<string>(DEMO);
  const [minLen, setMinLen] = useState<number>(18);
  const [maxLen, setMaxLen] = useState<number>(24);
  const [targetTm, setTargetTm] = useState<number>(60);
  const [hasRun, setHasRun] = useState<boolean>(false);

  const template = useMemo(() => cleanDna(rawInput), [rawInput]);

  const candidates = useMemo(() => {
    if (!hasRun || !template) return [];
    return scanCandidates(template, minLen, maxLen);
  }, [template, minLen, maxLen, hasRun]);

  const forward = useMemo(() => rankPrimers(candidates, targetTm).slice(0, 15), [candidates, targetTm]);

  // Reverse primers: scan reverse-complement of template
  const reverseTemplate = useMemo(() => reverseComplement(template), [template]);
  const reverseCandidates = useMemo(() => {
    if (!hasRun || !reverseTemplate) return [];
    return scanCandidates(reverseTemplate, minLen, maxLen);
  }, [reverseTemplate, minLen, maxLen, hasRun]);
  const reverse = useMemo(() => rankPrimers(reverseCandidates, targetTm).slice(0, 15), [reverseCandidates, targetTm]);

  const handleRun = () => setHasRun(true);

  const handleExport = () => {
    const rows: string[][] = [
      ['Direction', 'Sequence (5\'→3\')', 'Start', 'End', 'Length', 'GC%', 'Tm_NN', 'Tm_GC%', 'Tm_Wallace', 'SelfComp', '3prime_dG', 'GCclamp', 'Warnings'],
      ...forward.map((p) => [
        'Forward', p.seq, String(p.start), String(p.end), String(p.length),
        p.gcPct.toFixed(1), p.tmNN.toFixed(1), p.tmGC.toFixed(1), p.tmWallace.toFixed(1),
        String(p.selfComp), p.threePrimeDG.toFixed(2),
        p.gcClamp ? 'Y' : 'N', p.warnings.join('; ')
      ]),
      ...reverse.map((p) => [
        'Reverse', p.seq, String(p.start), String(p.end), String(p.length),
        p.gcPct.toFixed(1), p.tmNN.toFixed(1), p.tmGC.toFixed(1), p.tmWallace.toFixed(1),
        String(p.selfComp), p.threePrimeDG.toFixed(2),
        p.gcClamp ? 'Y' : 'N', p.warnings.join('; ')
      ]),
    ];
    downloadCsv('primer_candidates.csv', rows);
  };

  const renderPrimerTable = (rows: PrimerCandidate[], dir: 'F' | 'R') => (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>#</TableHead>
            <TableHead>Sequence (5'→3')</TableHead>
            <TableHead>Pos</TableHead>
            <TableHead>Len</TableHead>
            <TableHead>GC%</TableHead>
            <TableHead>Tm NN (°C)</TableHead>
            <TableHead>Tm GC% (°C)</TableHead>
            <TableHead>Tm Wallace (°C)</TableHead>
            <TableHead>3' clamp</TableHead>
            <TableHead>Notes</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((p, i) => (
            <TableRow key={`${dir}-${i}`}>
              <TableCell>{i + 1}</TableCell>
              <TableCell className="font-mono text-xs">{p.seq}</TableCell>
              <TableCell className="text-xs">{p.start}-{p.end}</TableCell>
              <TableCell>{p.length}</TableCell>
              <TableCell>{p.gcPct.toFixed(1)}</TableCell>
              <TableCell className="font-medium">{p.tmNN.toFixed(1)}</TableCell>
              <TableCell>{p.tmGC.toFixed(1)}</TableCell>
              <TableCell>{p.tmWallace.toFixed(1)}</TableCell>
              <TableCell>
                {p.gcClamp ? <Badge variant="default">Yes</Badge> : <Badge variant="outline">No</Badge>}
              </TableCell>
              <TableCell className="text-xs text-amber-700 dark:text-amber-400">
                {p.warnings.length ? p.warnings.join('; ') : '—'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-slate-900">
      <Navigation />
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <Badge className="mb-3 bg-teal-100 text-teal-800 hover:bg-teal-200">PCR / Cloning</Badge>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-3 flex items-center justify-center gap-2">
            <FlaskConical className="h-8 w-8 text-teal-600" /> Primer Designer + Tm Calculator
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Generate candidate forward + reverse primers and rank them by Tm match, GC%, 3' clamp, and self-complementarity. Tm computed by Nearest-Neighbor (SantaLucia 1998), GC%, and Wallace rules.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Template</CardTitle>
              <CardDescription>Paste DNA sequence (FASTA or raw).</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea value={rawInput} onChange={(e) => setRawInput(e.target.value)} rows={10} className="font-mono text-xs" />
              <div className="text-xs text-gray-500 dark:text-gray-400">Template length: {template.length} nt</div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Min length (nt)</Label>
                  <Input type="number" min={10} max={40} value={minLen} onChange={(e) => setMinLen(parseInt(e.target.value) || 18)} />
                </div>
                <div>
                  <Label>Max length (nt)</Label>
                  <Input type="number" min={10} max={40} value={maxLen} onChange={(e) => setMaxLen(parseInt(e.target.value) || 24)} />
                </div>
              </div>

              <div>
                <Label>Target Tm (°C)</Label>
                <Input type="number" step="0.1" value={targetTm} onChange={(e) => setTargetTm(parseFloat(e.target.value) || 60)} />
              </div>

              <Button className="w-full" onClick={handleRun}>
                <Search className="h-4 w-4 mr-2" /> Design primers
              </Button>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Candidate primers</CardTitle>
                <CardDescription>
                  {hasRun
                    ? `Showing top 15 forward + 15 reverse primers, ranked by Tm match and quality.`
                    : 'Configure and click "Design primers".'}
                </CardDescription>
              </div>
              {hasRun && (forward.length > 0 || reverse.length > 0) && (
                <Button variant="outline" size="sm" onClick={handleExport}>
                  <Download className="h-4 w-4 mr-2" /> Export CSV
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {!hasRun && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertTitle>About the methods</AlertTitle>
                  <AlertDescription className="text-sm space-y-1 mt-2">
                    <p><strong>Tm NN</strong> — Nearest-neighbor (SantaLucia 1998), most accurate. Computed at 50 mM Na⁺ and 250 nM primer.</p>
                    <p><strong>Tm GC%</strong> — 64.9 + 41·(GC − 16.4)/N. Good for primers 14–30 nt.</p>
                    <p><strong>Tm Wallace</strong> — 2(A+T) + 4(G+C). Best for primers under 14 nt.</p>
                    <p>Warnings flag GC outside 40–60%, runs ≥4, missing 3' GC clamp, Tm outside 55–65 °C, and high self-complementarity.</p>
                  </AlertDescription>
                </Alert>
              )}

              {hasRun && (
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold mb-2 text-gray-900 dark:text-gray-100">Forward primers</h3>
                    {forward.length ? renderPrimerTable(forward, 'F') : <p className="text-sm text-gray-500">None found.</p>}
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2 text-gray-900 dark:text-gray-100">Reverse primers (reverse-complement of template)</h3>
                    {reverse.length ? renderPrimerTable(reverse, 'R') : <p className="text-sm text-gray-500">None found.</p>}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
