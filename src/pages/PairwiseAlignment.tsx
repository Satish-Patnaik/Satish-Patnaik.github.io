import { useMemo, useState } from 'react';
import Navigation from '@/components/Navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { GitCompare, Play, Info } from 'lucide-react';

// ---------------- Substitution matrices ----------------
// BLOSUM62 — standard 20-aa protein scoring matrix
const AA = 'ARNDCQEGHILKMFPSTWYVBZX*';
// Row-major values for BLOSUM62 in same order as AA above (24x24)
const BLOSUM62_FLAT = `
 4 -1 -2 -2  0 -1 -1  0 -2 -1 -1 -1 -1 -2 -1  1  0 -3 -2  0 -2 -1  0 -4
-1  5  0 -2 -3  1  0 -2  0 -3 -2  2 -1 -3 -2 -1 -1 -3 -2 -3 -1  0 -1 -4
-2  0  6  1 -3  0  0  0  1 -3 -3  0 -2 -3 -2  1  0 -4 -2 -3  3  0 -1 -4
-2 -2  1  6 -3  0  2 -1 -1 -3 -4 -1 -3 -3 -1  0 -1 -4 -3 -3  4  1 -1 -4
 0 -3 -3 -3  9 -3 -4 -3 -3 -1 -1 -3 -1 -2 -3 -1 -1 -2 -2 -1 -3 -3 -2 -4
-1  1  0  0 -3  5  2 -2  0 -3 -2  1  0 -3 -1  0 -1 -2 -1 -2  0  3 -1 -4
-1  0  0  2 -4  2  5 -2  0 -3 -3  1 -2 -3 -1  0 -1 -3 -2 -2  1  4 -1 -4
 0 -2  0 -1 -3 -2 -2  6 -2 -4 -4 -2 -3 -3 -2  0 -2 -2 -3 -3 -1 -2 -1 -4
-2  0  1 -1 -3  0  0 -2  8 -3 -3 -1 -2 -1 -2 -1 -2 -2  2 -3  0  0 -1 -4
-1 -3 -3 -3 -1 -3 -3 -4 -3  4  2 -3  1  0 -3 -2 -1 -3 -1  3 -3 -3 -1 -4
-1 -2 -3 -4 -1 -2 -3 -4 -3  2  4 -2  2  0 -3 -2 -1 -2 -1  1 -4 -3 -1 -4
-1  2  0 -1 -3  1  1 -2 -1 -3 -2  5 -1 -3 -1  0 -1 -3 -2 -2  0  1 -1 -4
-1 -1 -2 -3 -1  0 -2 -3 -2  1  2 -1  5  0 -2 -1 -1 -1 -1  1 -3 -1 -1 -4
-2 -3 -3 -3 -2 -3 -3 -3 -1  0  0 -3  0  6 -4 -2 -2  1  3 -1 -3 -3 -1 -4
-1 -2 -2 -1 -3 -1 -1 -2 -2 -3 -3 -1 -2 -4  7 -1 -1 -4 -3 -2 -2 -1 -2 -4
 1 -1  1  0 -1  0  0  0 -1 -2 -2  0 -1 -2 -1  4  1 -3 -2 -2  0  0  0 -4
 0 -1  0 -1 -1 -1 -1 -2 -2 -1 -1 -1 -1 -2 -1  1  5 -2 -2  0 -1 -1  0 -4
-3 -3 -4 -4 -2 -2 -3 -2 -2 -3 -2 -3 -1  1 -4 -3 -2 11  2 -3 -4 -3 -2 -4
-2 -2 -2 -3 -2 -1 -2 -3  2 -1 -1 -2 -1  3 -3 -2 -2  2  7 -1 -3 -2 -1 -4
 0 -3 -3 -3 -1 -2 -2 -3 -3  3  1 -2  1 -1 -2 -2  0 -3 -1  4 -3 -2 -1 -4
-2 -1  3  4 -3  0  1 -1  0 -3 -4  0 -3 -3 -2  0 -1 -4 -3 -3  4  1 -1 -4
-1  0  0  1 -3  3  4 -2  0 -3 -3  1 -1 -3 -1  0 -1 -3 -2 -2  1  4 -1 -4
 0 -1 -1 -1 -2 -1 -1 -1 -1 -1 -1 -1 -1 -1 -2  0  0 -2 -1 -1 -1 -1 -1 -4
-4 -4 -4 -4 -4 -4 -4 -4 -4 -4 -4 -4 -4 -4 -4 -4 -4 -4 -4 -4 -4 -4 -4  1
`;

const PAM250_FLAT = `
 2 -2  0  0 -2  0  0  1 -1 -1 -2 -1 -1 -3  1  1  1 -6 -3  0  0  0  0 -8
-2  6  0 -1 -4  1 -1 -3  2 -2 -3  3  0 -4  0  0 -1  2 -4 -2 -1  0 -1 -8
 0  0  2  2 -4  1  1  0  2 -2 -3  1 -2 -3  0  1  0 -4 -2 -2  2  1  0 -8
 0 -1  2  4 -5  2  3  1  1 -2 -4  0 -3 -6 -1  0  0 -7 -4 -2  3  3 -1 -8
-2 -4 -4 -5 12 -5 -5 -3 -3 -2 -6 -5 -5 -4 -3  0 -2 -8  0 -2 -4 -5 -3 -8
 0  1  1  2 -5  4  2 -1  3 -2 -2  1 -1 -5  0 -1 -1 -5 -4 -2  1  3 -1 -8
 0 -1  1  3 -5  2  4  0  1 -2 -3  0 -2 -5 -1  0  0 -7 -4 -2  3  3 -1 -8
 1 -3  0  1 -3 -1  0  5 -2 -3 -4 -2 -3 -5  0  1  0 -7 -5 -1  0  0 -1 -8
-1  2  2  1 -3  3  1 -2  6 -2 -2  0 -2 -2  0 -1 -1 -3  0 -2  1  2 -1 -8
-1 -2 -2 -2 -2 -2 -2 -3 -2  5  2 -2  2  1 -2 -1  0 -5 -1  4 -2 -2 -1 -8
-2 -3 -3 -4 -6 -2 -3 -4 -2  2  6 -3  4  2 -3 -3 -2 -2 -1  2 -3 -3 -1 -8
-1  3  1  0 -5  1  0 -2  0 -2 -3  5  0 -5 -1  0  0 -3 -4 -2  1  0 -1 -8
-1  0 -2 -3 -5 -1 -2 -3 -2  2  4  0  6  0 -2 -2 -1 -4 -2  2 -2 -2 -1 -8
-3 -4 -3 -6 -4 -5 -5 -5 -2  1  2 -5  0  9 -5 -3 -3  0  7 -1 -4 -5 -2 -8
 1  0  0 -1 -3  0 -1  0  0 -2 -3 -1 -2 -5  6  1  0 -6 -5 -1 -1  0 -1 -8
 1  0  1  0  0 -1  0  1 -1 -1 -3  0 -2 -3  1  2  1 -2 -3 -1  0  0  0 -8
 1 -1  0  0 -2 -1  0  0 -1  0 -2  0 -1 -3  0  1  3 -5 -3  0  0 -1  0 -8
-6  2 -4 -7 -8 -5 -7 -7 -3 -5 -2 -3 -4  0 -6 -2 -5 17  0 -6 -5 -6 -4 -8
-3 -4 -2 -4  0 -4 -4 -5  0 -1 -1 -4 -2  7 -5 -3 -3  0 10 -2 -3 -4 -2 -8
 0 -2 -2 -2 -2 -2 -2 -1 -2  4  2 -2  2 -1 -1 -1  0 -6 -2  4 -2 -2 -1 -8
 0 -1  2  3 -4  1  3  0  1 -2 -3  1 -2 -4 -1  0  0 -5 -3 -2  3  2 -1 -8
 0  0  1  3 -5  3  3  0  2 -2 -3  0 -2 -5  0  0 -1 -6 -4 -2  2  3 -1 -8
 0 -1  0 -1 -3 -1 -1 -1 -1 -1 -1 -1 -1 -2 -1  0  0 -4 -2 -1 -1 -1 -1 -8
-8 -8 -8 -8 -8 -8 -8 -8 -8 -8 -8 -8 -8 -8 -8 -8 -8 -8 -8 -8 -8 -8 -8  1
`;

function buildMatrix(flat: string): number[][] {
  const rows = flat.trim().split(/\r?\n/);
  return rows.map((r) => r.trim().split(/\s+/).map(Number));
}

const BLOSUM62 = buildMatrix(BLOSUM62_FLAT);
const PAM250 = buildMatrix(PAM250_FLAT);
const AA_INDEX: Record<string, number> = {};
for (let i = 0; i < AA.length; i++) AA_INDEX[AA[i]] = i;

function scoreMatrix(matrix: 'blosum62' | 'pam250' | 'identity', dna: boolean) {
  if (matrix === 'identity' || dna) {
    return (a: string, b: string) => (a === b && a !== '-' && a !== 'N' ? 1 : -1);
  }
  const m = matrix === 'blosum62' ? BLOSUM62 : PAM250;
  return (a: string, b: string) => {
    const ia = AA_INDEX[a] ?? AA_INDEX['X'];
    const ib = AA_INDEX[b] ?? AA_INDEX['X'];
    return m[ia]?.[ib] ?? -4;
  };
}

interface AlignmentResult {
  alignedA: string;
  alignedB: string;
  matchLine: string;
  score: number;
  identity: number; // %
  similarity: number; // % (positive scores)
  length: number;
  startA?: number;
  startB?: number;
}

function needlemanWunsch(a: string, b: string, score: (x: string, y: string) => number, gapOpen: number, gapExt: number): AlignmentResult {
  const m = a.length, n = b.length;
  // Affine gap (Gotoh) — three matrices
  const M = Array.from({ length: m + 1 }, () => new Float32Array(n + 1));
  const Ix = Array.from({ length: m + 1 }, () => new Float32Array(n + 1));
  const Iy = Array.from({ length: m + 1 }, () => new Float32Array(n + 1));
  const NINF = -1e9;
  for (let i = 0; i <= m; i++) { M[i][0] = NINF; Ix[i][0] = NINF; Iy[i][0] = NINF; }
  for (let j = 0; j <= n; j++) { M[0][j] = NINF; Ix[0][j] = NINF; Iy[0][j] = NINF; }
  M[0][0] = 0;
  for (let i = 1; i <= m; i++) Ix[i][0] = gapOpen + (i - 1) * gapExt;
  for (let j = 1; j <= n; j++) Iy[0][j] = gapOpen + (j - 1) * gapExt;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const s = score(a[i - 1], b[j - 1]);
      M[i][j] = Math.max(M[i - 1][j - 1], Ix[i - 1][j - 1], Iy[i - 1][j - 1]) + s;
      Ix[i][j] = Math.max(M[i - 1][j] + gapOpen, Ix[i - 1][j] + gapExt);
      Iy[i][j] = Math.max(M[i][j - 1] + gapOpen, Iy[i][j - 1] + gapExt);
    }
  }

  // Traceback
  let i = m, j = n;
  let aa = '', bb = '';
  let state = M[m][n] >= Ix[m][n] && M[m][n] >= Iy[m][n] ? 'M' : Ix[m][n] >= Iy[m][n] ? 'X' : 'Y';
  const finalScore = Math.max(M[m][n], Ix[m][n], Iy[m][n]);
  while (i > 0 || j > 0) {
    if (state === 'M' && i > 0 && j > 0) {
      aa = a[i - 1] + aa; bb = b[j - 1] + bb;
      const s = score(a[i - 1], b[j - 1]);
      const cur = M[i][j];
      i--; j--;
      // pick next state — whichever predecessor matches
      if (Math.abs(cur - (M[i][j] + s)) < 1e-6) state = 'M';
      else if (Math.abs(cur - (Ix[i][j] + s)) < 1e-6) state = 'X';
      else state = 'Y';
    } else if (state === 'X' && i > 0) {
      aa = a[i - 1] + aa; bb = '-' + bb;
      const cur = Ix[i][j];
      i--;
      if (Math.abs(cur - (M[i][j] + gapOpen)) < 1e-6) state = 'M';
      else state = 'X';
    } else if (state === 'Y' && j > 0) {
      aa = '-' + aa; bb = b[j - 1] + bb;
      const cur = Iy[i][j];
      j--;
      if (Math.abs(cur - (M[i][j] + gapOpen)) < 1e-6) state = 'M';
      else state = 'Y';
    } else if (i > 0) {
      aa = a[i - 1] + aa; bb = '-' + bb; i--;
      state = 'X';
    } else {
      aa = '-' + aa; bb = b[j - 1] + bb; j--;
      state = 'Y';
    }
  }

  return finalizeAlignment(aa, bb, finalScore, score);
}

function smithWaterman(a: string, b: string, score: (x: string, y: string) => number, gapOpen: number, gapExt: number): AlignmentResult {
  const m = a.length, n = b.length;
  const M = Array.from({ length: m + 1 }, () => new Float32Array(n + 1));
  const Ix = Array.from({ length: m + 1 }, () => new Float32Array(n + 1));
  const Iy = Array.from({ length: m + 1 }, () => new Float32Array(n + 1));
  let best = 0, bi = 0, bj = 0;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const s = score(a[i - 1], b[j - 1]);
      Ix[i][j] = Math.max(0, M[i - 1][j] + gapOpen, Ix[i - 1][j] + gapExt);
      Iy[i][j] = Math.max(0, M[i][j - 1] + gapOpen, Iy[i][j - 1] + gapExt);
      M[i][j] = Math.max(0, M[i - 1][j - 1] + s, Ix[i - 1][j - 1] + s, Iy[i - 1][j - 1] + s);
      const cell = Math.max(M[i][j], Ix[i][j], Iy[i][j]);
      if (cell > best) { best = cell; bi = i; bj = j; }
    }
  }
  // Traceback from best
  let i = bi, j = bj;
  let aa = '', bb = '';
  let state: 'M' | 'X' | 'Y' = 'M';
  while (i > 0 && j > 0) {
    if (state === 'M') {
      if (M[i][j] === 0) break;
      const s = score(a[i - 1], b[j - 1]);
      aa = a[i - 1] + aa; bb = b[j - 1] + bb;
      const cur = M[i][j];
      i--; j--;
      if (Math.abs(cur - (M[i][j] + s)) < 1e-6) state = 'M';
      else if (Math.abs(cur - (Ix[i][j] + s)) < 1e-6) state = 'X';
      else if (Math.abs(cur - (Iy[i][j] + s)) < 1e-6) state = 'Y';
      else break;
    } else if (state === 'X') {
      aa = a[i - 1] + aa; bb = '-' + bb;
      const cur = Ix[i][j];
      i--;
      if (Math.abs(cur - (M[i][j] + gapOpen)) < 1e-6) state = 'M';
      else state = 'X';
    } else {
      aa = '-' + aa; bb = b[j - 1] + bb;
      const cur = Iy[i][j];
      j--;
      if (Math.abs(cur - (M[i][j] + gapOpen)) < 1e-6) state = 'M';
      else state = 'Y';
    }
  }
  const result = finalizeAlignment(aa, bb, best, score);
  result.startA = i + 1;
  result.startB = j + 1;
  return result;
}

function finalizeAlignment(aa: string, bb: string, scoreVal: number, score: (x: string, y: string) => number): AlignmentResult {
  let matchLine = '';
  let ident = 0, sim = 0;
  for (let k = 0; k < aa.length; k++) {
    if (aa[k] === '-' || bb[k] === '-') matchLine += ' ';
    else if (aa[k] === bb[k]) { matchLine += '|'; ident++; sim++; }
    else if (score(aa[k], bb[k]) > 0) { matchLine += ':'; sim++; }
    else matchLine += '.';
  }
  return {
    alignedA: aa,
    alignedB: bb,
    matchLine,
    score: scoreVal,
    identity: (ident / aa.length) * 100,
    similarity: (sim / aa.length) * 100,
    length: aa.length,
  };
}

function clean(raw: string, isDna: boolean): string {
  const stripped = raw.split(/\r?\n/).filter((l) => !l.startsWith('>')).join('').replace(/\s+/g, '').toUpperCase();
  if (isDna) return stripped.replace(/U/g, 'T').replace(/[^ACGTN]/g, '');
  return stripped.replace(/[^A-Z*]/g, '');
}

function chunkAlignment(a: AlignmentResult, width = 60): string {
  const lines: string[] = [];
  for (let k = 0; k < a.length; k += width) {
    lines.push(`Query  ${a.alignedA.slice(k, k + width)}`);
    lines.push(`       ${a.matchLine.slice(k, k + width)}`);
    lines.push(`Sbjct  ${a.alignedB.slice(k, k + width)}`);
    lines.push('');
  }
  return lines.join('\n');
}

const DEMO_A = `>seq_a_protein
MVHLTPEEKSAVTALWGKVNVDEVGGEALGRLLVVYPWTQRFFESFGDLSTPDAVMGNPKVKAHGKKVLGAFSDGLAHLDNLKGTFATLSELHCDKLHVDPENFRLLGNVLVCVLAHHFGKEFTPPVQAAYQKVVAGVANALAHKYH`;
const DEMO_B = `>seq_b_protein
MVHLTSEEKAAVTSLWAKVNVDEVGGEALGRLLVVYPWTQRFFEHFGDLSTPDAVMGNPKVKAHGKKVLAAFGEAVKHLDNLKGTFAALSELHCDKLHVDPENFRLLGNAIIIVLAHHFGKDFTPAVHASLDKFLASVSTVLTSKYR`;

export default function PairwiseAlignment() {
  const [seqA, setSeqA] = useState<string>(DEMO_A);
  const [seqB, setSeqB] = useState<string>(DEMO_B);
  const [molecule, setMolecule] = useState<'protein' | 'dna'>('protein');
  const [matrix, setMatrix] = useState<'blosum62' | 'pam250' | 'identity'>('blosum62');
  const [algorithm, setAlgorithm] = useState<'global' | 'local'>('global');
  const [gapOpen, setGapOpen] = useState<number>(-10);
  const [gapExt, setGapExt] = useState<number>(-1);
  const [result, setResult] = useState<AlignmentResult | null>(null);

  const a = useMemo(() => clean(seqA, molecule === 'dna'), [seqA, molecule]);
  const b = useMemo(() => clean(seqB, molecule === 'dna'), [seqB, molecule]);

  const run = () => {
    if (!a || !b) return;
    const sc = scoreMatrix(matrix, molecule === 'dna');
    const r = algorithm === 'global'
      ? needlemanWunsch(a, b, sc, gapOpen, gapExt)
      : smithWaterman(a, b, sc, gapOpen, gapExt);
    setResult(r);
  };

  const formatted = result ? chunkAlignment(result) : '';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-slate-900">
      <Navigation />
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <Badge className="mb-3 bg-indigo-100 text-indigo-800 hover:bg-indigo-200">Sequence Analysis</Badge>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-3 flex items-center justify-center gap-2">
            <GitCompare className="h-8 w-8 text-indigo-600" /> Pairwise Sequence Alignment
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Global (Needleman–Wunsch) and local (Smith–Waterman) alignment with affine gaps. Choose BLOSUM62, PAM250, or identity scoring.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Settings</CardTitle>
              <CardDescription>Affine-gap model (Gotoh).</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Molecule type</Label>
                <Select value={molecule} onValueChange={(v: any) => { setMolecule(v); if (v === 'dna') setMatrix('identity'); else setMatrix('blosum62'); }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="protein">Protein</SelectItem>
                    <SelectItem value="dna">DNA</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Algorithm</Label>
                <Select value={algorithm} onValueChange={(v: any) => setAlgorithm(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="global">Global (Needleman–Wunsch)</SelectItem>
                    <SelectItem value="local">Local (Smith–Waterman)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Scoring matrix</Label>
                <Select value={matrix} onValueChange={(v: any) => setMatrix(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="blosum62" disabled={molecule === 'dna'}>BLOSUM62 (protein)</SelectItem>
                    <SelectItem value="pam250" disabled={molecule === 'dna'}>PAM250 (protein)</SelectItem>
                    <SelectItem value="identity">Identity (±1)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Gap open</Label>
                  <Input type="number" value={gapOpen} onChange={(e) => setGapOpen(parseInt(e.target.value) || -10)} />
                </div>
                <div>
                  <Label>Gap extend</Label>
                  <Input type="number" value={gapExt} onChange={(e) => setGapExt(parseInt(e.target.value) || -1)} />
                </div>
              </div>

              <Button className="w-full" onClick={run}>
                <Play className="h-4 w-4 mr-2" /> Run alignment
              </Button>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Sequences</CardTitle>
              <CardDescription>FASTA or raw. {a.length} and {b.length} characters after cleanup.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Tabs defaultValue="a">
                <TabsList>
                  <TabsTrigger value="a">Sequence A</TabsTrigger>
                  <TabsTrigger value="b">Sequence B</TabsTrigger>
                </TabsList>
                <TabsContent value="a">
                  <Textarea value={seqA} onChange={(e) => setSeqA(e.target.value)} rows={6} className="font-mono text-xs" />
                </TabsContent>
                <TabsContent value="b">
                  <Textarea value={seqB} onChange={(e) => setSeqB(e.target.value)} rows={6} className="font-mono text-xs" />
                </TabsContent>
              </Tabs>

              {!result && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertTitle>Run an alignment to see results</AlertTitle>
                  <AlertDescription>
                    Demo sequences are loaded (human β-globin partial vs. variant). Click "Run alignment".
                  </AlertDescription>
                </Alert>
              )}

              {result && (
                <Card className="bg-gray-50 dark:bg-gray-800/50">
                  <CardHeader className="pb-3">
                    <div className="flex flex-wrap gap-3 items-center text-sm">
                      <Badge variant="default">Score: {result.score.toFixed(0)}</Badge>
                      <Badge variant="secondary">Identity: {result.identity.toFixed(1)}%</Badge>
                      <Badge variant="secondary">Similarity: {result.similarity.toFixed(1)}%</Badge>
                      <Badge variant="outline">Length: {result.length}</Badge>
                      {algorithm === 'local' && result.startA != null && (
                        <Badge variant="outline">Start: A@{result.startA}, B@{result.startB}</Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <pre className="font-mono text-xs whitespace-pre overflow-x-auto">
                      {formatted}
                    </pre>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
