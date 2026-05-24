import { useMemo, useState } from 'react';
import Navigation from '@/components/Navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Dna, Search, Download, Info, FileDown } from 'lucide-react';

// ---------------- Codon tables (NCBI translation tables) ----------------
// Each table maps codon -> single-letter amino acid; '*' = stop.
const STANDARD: Record<string, string> = {
  TTT: 'F', TTC: 'F', TTA: 'L', TTG: 'L',
  CTT: 'L', CTC: 'L', CTA: 'L', CTG: 'L',
  ATT: 'I', ATC: 'I', ATA: 'I', ATG: 'M',
  GTT: 'V', GTC: 'V', GTA: 'V', GTG: 'V',
  TCT: 'S', TCC: 'S', TCA: 'S', TCG: 'S',
  CCT: 'P', CCC: 'P', CCA: 'P', CCG: 'P',
  ACT: 'T', ACC: 'T', ACA: 'T', ACG: 'T',
  GCT: 'A', GCC: 'A', GCA: 'A', GCG: 'A',
  TAT: 'Y', TAC: 'Y', TAA: '*', TAG: '*',
  CAT: 'H', CAC: 'H', CAA: 'Q', CAG: 'Q',
  AAT: 'N', AAC: 'N', AAA: 'K', AAG: 'K',
  GAT: 'D', GAC: 'D', GAA: 'E', GAG: 'E',
  TGT: 'C', TGC: 'C', TGA: '*', TGG: 'W',
  CGT: 'R', CGC: 'R', CGA: 'R', CGG: 'R',
  AGT: 'S', AGC: 'S', AGA: 'R', AGG: 'R',
  GGT: 'G', GGC: 'G', GGA: 'G', GGG: 'G',
};

// Vertebrate mitochondrial differs in a few codons
const VERT_MITO: Record<string, string> = {
  ...STANDARD,
  AGA: '*', AGG: '*', ATA: 'M', TGA: 'W',
};

// Bacterial/plant plastid — same as standard for amino acids; alt start codons handled separately
const BACTERIAL: Record<string, string> = { ...STANDARD };

const CODON_TABLES: Record<string, { name: string; table: Record<string, string>; alt_starts: string[] }> = {
  standard: { name: 'Standard (NCBI table 1)', table: STANDARD, alt_starts: ['ATG', 'CTG', 'TTG'] },
  vertebrate_mito: { name: 'Vertebrate Mitochondrial (table 2)', table: VERT_MITO, alt_starts: ['ATG', 'ATA', 'ATT', 'GTG'] },
  bacterial: { name: 'Bacterial / Plant Plastid (table 11)', table: BACTERIAL, alt_starts: ['ATG', 'GTG', 'TTG', 'ATT', 'CTG'] },
};

// ---------------- Helpers ----------------
function cleanSeq(raw: string): string {
  return raw
    .split(/\r?\n/)
    .filter((l) => !l.startsWith('>'))
    .join('')
    .replace(/\s+/g, '')
    .toUpperCase()
    .replace(/U/g, 'T'); // RNA -> DNA
}

function parseFastaHeader(raw: string): string {
  const m = raw.match(/^>([^\n\r]*)/);
  return m ? m[1].trim() : 'sequence';
}

function reverseComplement(seq: string): string {
  const comp: Record<string, string> = { A: 'T', T: 'A', G: 'C', C: 'G', N: 'N' };
  let out = '';
  for (let i = seq.length - 1; i >= 0; i--) {
    out += comp[seq[i]] ?? 'N';
  }
  return out;
}

function translate(seq: string, table: Record<string, string>): string {
  let prot = '';
  for (let i = 0; i + 3 <= seq.length; i += 3) {
    const codon = seq.slice(i, i + 3);
    prot += table[codon] ?? 'X';
  }
  return prot;
}

interface ORF {
  frame: number; // +1,+2,+3,-1,-2,-3
  strand: '+' | '-';
  start: number; // 1-based on original sense strand
  end: number;   // 1-based, inclusive
  lengthNt: number;
  lengthAa: number;
  startCodon: string;
  protein: string;
}

function findORFs(
  seq: string,
  table: Record<string, string>,
  altStarts: string[],
  minAa: number,
  requireMet: boolean
): ORF[] {
  const orfs: ORF[] = [];
  const rev = reverseComplement(seq);
  const startSet = new Set(requireMet ? ['ATG'] : altStarts);

  const scan = (s: string, strand: '+' | '-', frameOffset: number) => {
    const len = s.length;
    for (let frame = 0; frame < 3; frame++) {
      let i = frame;
      while (i + 3 <= len) {
        const codon = s.slice(i, i + 3);
        if (startSet.has(codon)) {
          // extend until stop or end
          let j = i;
          while (j + 3 <= len) {
            const c = s.slice(j, j + 3);
            const aa = table[c] ?? 'X';
            if (aa === '*') break;
            j += 3;
          }
          const orfNt = s.slice(i, j); // exclusive of stop
          const aaLen = orfNt.length / 3;
          if (aaLen >= minAa) {
            const protein = translate(orfNt, table);
            // map back to original (sense) coordinates
            let start1: number;
            let end1: number;
            if (strand === '+') {
              start1 = i + 1;
              end1 = j; // last nt before stop
            } else {
              // reverse-strand coords on the original (sense) strand
              start1 = len - i;
              end1 = len - j + 1;
            }
            orfs.push({
              frame: strand === '+' ? frame + 1 : -(frame + 1),
              strand,
              start: Math.min(start1, end1),
              end: Math.max(start1, end1),
              lengthNt: orfNt.length,
              lengthAa: aaLen,
              startCodon: codon,
              protein,
            });
          }
          i = j + 3; // skip past stop
        } else {
          i += 3;
        }
      }
    }
  };

  scan(seq, '+', 0);
  scan(rev, '-', 0);

  return orfs.sort((a, b) => b.lengthAa - a.lengthAa);
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

const DEMO_SEQ = `>example_demo_sequence
ATGGCCATTGTAATGGGCCGCTGAAAGGGTGCCCGATAG
AAGGCATGAATTCCGGATCCAACCATGAGCTACAAGCGT
TATGCAATCCCATGAAACTAAGTACCTGAGGGCATGTAA`;

export default function OrfFinder() {
  const [rawInput, setRawInput] = useState<string>(DEMO_SEQ);
  const [tableKey, setTableKey] = useState<string>('standard');
  const [minAa, setMinAa] = useState<number>(50);
  const [requireMet, setRequireMet] = useState<boolean>(true);
  const [hasRun, setHasRun] = useState<boolean>(false);

  const seq = useMemo(() => cleanSeq(rawInput), [rawInput]);
  const header = useMemo(() => parseFastaHeader(rawInput), [rawInput]);

  const orfs = useMemo<ORF[]>(() => {
    if (!hasRun) return [];
    if (!seq) return [];
    const tbl = CODON_TABLES[tableKey];
    return findORFs(seq, tbl.table, tbl.alt_starts, minAa, requireMet);
  }, [seq, tableKey, minAa, requireMet, hasRun]);

  const handleRun = () => setHasRun(true);

  const handleExportCsv = () => {
    const rows: string[][] = [
      ['#', 'Frame', 'Strand', 'Start', 'End', 'Length_nt', 'Length_aa', 'Start_codon', 'Protein'],
      ...orfs.map((o, i) => [
        String(i + 1),
        String(o.frame),
        o.strand,
        String(o.start),
        String(o.end),
        String(o.lengthNt),
        String(o.lengthAa),
        o.startCodon,
        o.protein,
      ]),
    ];
    downloadCsv(`${header.split(/\s+/)[0] || 'orfs'}_ORFs.csv`, rows);
  };

  const handleLoadDemo = () => {
    setRawInput(DEMO_SEQ);
    setHasRun(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-slate-900">
      <Navigation />

      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <Badge className="mb-3 bg-purple-100 text-purple-800 hover:bg-purple-200">Sequence Analysis</Badge>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-3 flex items-center justify-center gap-2">
            <Dna className="h-8 w-8 text-purple-600" /> ORF Finder
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Scan all 6 reading frames of a DNA sequence for open reading frames using your chosen codon table.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Input panel */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Input</CardTitle>
              <CardDescription>Paste DNA (FASTA or raw). U is converted to T automatically.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={rawInput}
                onChange={(e) => setRawInput(e.target.value)}
                rows={10}
                className="font-mono text-xs"
                placeholder=">my_seq&#10;ATGCGT..."
              />
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Cleaned length: <span className="font-medium">{seq.length}</span> nt
              </div>

              <div className="space-y-2">
                <Label>Genetic code</Label>
                <Select value={tableKey} onValueChange={setTableKey}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(CODON_TABLES).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Minimum ORF length (amino acids)</Label>
                <Input
                  type="number"
                  min={10}
                  value={minAa}
                  onChange={(e) => setMinAa(Math.max(1, parseInt(e.target.value) || 50))}
                />
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  id="require-met"
                  type="checkbox"
                  checked={requireMet}
                  onChange={(e) => setRequireMet(e.target.checked)}
                  className="h-4 w-4"
                />
                <Label htmlFor="require-met" className="cursor-pointer">
                  Require ATG start (uncheck to allow alternative starts)
                </Label>
              </div>

              <div className="flex gap-2 pt-2">
                <Button className="flex-1" onClick={handleRun}>
                  <Search className="h-4 w-4 mr-2" /> Find ORFs
                </Button>
                <Button variant="outline" onClick={handleLoadDemo}>Demo</Button>
              </div>
            </CardContent>
          </Card>

          {/* Results panel */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Results</CardTitle>
                <CardDescription>
                  {hasRun ? `${orfs.length} ORF${orfs.length === 1 ? '' : 's'} found (≥ ${minAa} aa)` : 'Click "Find ORFs" to scan.'}
                </CardDescription>
              </div>
              {hasRun && orfs.length > 0 && (
                <Button variant="outline" size="sm" onClick={handleExportCsv}>
                  <Download className="h-4 w-4 mr-2" /> Export CSV
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {!hasRun && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertTitle>How it works</AlertTitle>
                  <AlertDescription className="text-sm">
                    The tool scans all 6 frames (3 forward, 3 reverse), starts at every chosen start codon, extends until the next stop, and reports ORFs at or above your minimum amino-acid length. Stop codons are <strong>not</strong> included in the reported protein sequence.
                  </AlertDescription>
                </Alert>
              )}

              {hasRun && orfs.length === 0 && (
                <Alert variant="destructive">
                  <AlertTitle>No ORFs found</AlertTitle>
                  <AlertDescription>
                    Try lowering the minimum length, allowing alternative starts, or check that your input contains DNA.
                  </AlertDescription>
                </Alert>
              )}

              {hasRun && orfs.length > 0 && (
                <div className="space-y-4">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>#</TableHead>
                          <TableHead>Frame</TableHead>
                          <TableHead>Start</TableHead>
                          <TableHead>End</TableHead>
                          <TableHead>Length (aa)</TableHead>
                          <TableHead>Start codon</TableHead>
                          <TableHead>Protein (first 50)</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {orfs.slice(0, 50).map((o, i) => (
                          <TableRow key={i}>
                            <TableCell>{i + 1}</TableCell>
                            <TableCell>
                              <Badge variant={o.strand === '+' ? 'default' : 'secondary'}>
                                {o.frame > 0 ? `+${o.frame}` : o.frame}
                              </Badge>
                            </TableCell>
                            <TableCell>{o.start}</TableCell>
                            <TableCell>{o.end}</TableCell>
                            <TableCell className="font-medium">{o.lengthAa}</TableCell>
                            <TableCell className="font-mono">{o.startCodon}</TableCell>
                            <TableCell className="font-mono text-xs">
                              {o.protein.slice(0, 50)}{o.protein.length > 50 ? '…' : ''}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    {orfs.length > 50 && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                        Showing 50 of {orfs.length}. Export CSV for the full list.
                      </p>
                    )}
                  </div>

                  {/* Top ORF preview */}
                  <Card className="bg-gray-50 dark:bg-gray-800/50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2">
                        <FileDown className="h-4 w-4" /> Top ORF protein (frame {orfs[0].frame > 0 ? `+${orfs[0].frame}` : orfs[0].frame})
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <pre className="font-mono text-xs whitespace-pre-wrap break-all">
                        {orfs[0].protein.match(/.{1,60}/g)?.join('\n')}
                      </pre>
                    </CardContent>
                  </Card>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

    </div>
  );
}
