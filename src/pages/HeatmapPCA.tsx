import { useMemo, useState } from 'react';
import Navigation from '@/components/Navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { BarChart3, Upload, Info, Download } from 'lucide-react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

// ---------------- CSV parsing ----------------
interface ParsedMatrix {
  geneIds: string[];
  sampleIds: string[];
  values: number[][]; // values[gene][sample]
  errors: string[];
}

function parseCsv(raw: string): ParsedMatrix {
  const errors: string[] = [];
  const lines = raw.split(/\r?\n/).filter((l) => l.trim().length);
  if (lines.length < 2) {
    return { geneIds: [], sampleIds: [], values: [], errors: ['Need at least 2 lines (header + one row of data).'] };
  }
  // detect delimiter
  const delim = lines[0].includes('\t') ? '\t' : ',';
  const header = lines[0].split(delim).map((s) => s.trim());
  const sampleIds = header.slice(1);
  const geneIds: string[] = [];
  const values: number[][] = [];
  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(delim);
    if (parts.length < 2) continue;
    geneIds.push(parts[0].trim());
    const row = parts.slice(1).map((v) => {
      const num = parseFloat(v);
      return isFinite(num) ? num : 0;
    });
    if (row.length !== sampleIds.length) {
      errors.push(`Row ${i + 1} has ${row.length} values but expected ${sampleIds.length}.`);
    }
    while (row.length < sampleIds.length) row.push(0);
    values.push(row.slice(0, sampleIds.length));
  }
  return { geneIds, sampleIds, values, errors };
}

// ---------------- Z-score per gene ----------------
function zScoreRows(values: number[][]): number[][] {
  return values.map((row) => {
    const mean = row.reduce((a, b) => a + b, 0) / row.length;
    const variance = row.reduce((a, b) => a + (b - mean) ** 2, 0) / row.length;
    const sd = Math.sqrt(variance) || 1;
    return row.map((v) => (v - mean) / sd);
  });
}

// ---------------- PCA via power iteration on covariance matrix ----------------
// We treat samples as observations (n=samples), genes as variables.
// Project samples onto top 2 PCs.
function computePCA(values: number[][]): { pc1: number[]; pc2: number[]; varExplained: [number, number]; } {
  const nGenes = values.length;
  const nSamples = values[0]?.length || 0;
  if (nGenes === 0 || nSamples === 0) return { pc1: [], pc2: [], varExplained: [0, 0] };

  // Build sample-by-gene matrix X (rows = samples, cols = genes)
  const X: number[][] = [];
  for (let s = 0; s < nSamples; s++) {
    const row: number[] = [];
    for (let g = 0; g < nGenes; g++) row.push(values[g][s]);
    X.push(row);
  }
  // Center columns (mean-center each gene)
  for (let g = 0; g < nGenes; g++) {
    let mean = 0;
    for (let s = 0; s < nSamples; s++) mean += X[s][g];
    mean /= nSamples;
    for (let s = 0; s < nSamples; s++) X[s][g] -= mean;
  }
  // Covariance of samples in gene-space = X * X^T / (nGenes-1)  — nSamples x nSamples
  const C: number[][] = Array.from({ length: nSamples }, () => new Array(nSamples).fill(0));
  for (let i = 0; i < nSamples; i++) {
    for (let j = i; j < nSamples; j++) {
      let s = 0;
      for (let g = 0; g < nGenes; g++) s += X[i][g] * X[j][g];
      s /= Math.max(1, nGenes - 1);
      C[i][j] = s;
      C[j][i] = s;
    }
  }
  // Power iteration for top eigenvector v1
  const v1 = powerIteration(C, 200);
  const lambda1 = rayleighQuotient(C, v1);
  // Deflate: C - lambda1 * v1 v1^T
  for (let i = 0; i < nSamples; i++) {
    for (let j = 0; j < nSamples; j++) {
      C[i][j] -= lambda1 * v1[i] * v1[j];
    }
  }
  const v2 = powerIteration(C, 200);
  const lambda2 = rayleighQuotient(C, v2);
  // Sample projections — since C is sample-sample, eigenvectors ARE sample coords (up to scale)
  // Use sqrt(eigenvalue) * eigenvector for projection
  const pc1 = v1.map((v) => v * Math.sqrt(Math.max(0, lambda1)));
  const pc2 = v2.map((v) => v * Math.sqrt(Math.max(0, lambda2)));

  // Total variance ≈ sum of original diagonal (already deflated; reuse trace estimate)
  let trace = 0;
  for (let s = 0; s < nSamples; s++) {
    let row = 0;
    for (let g = 0; g < nGenes; g++) row += X[s][g] * X[s][g];
    trace += row / Math.max(1, nGenes - 1);
  }
  const varExp1 = trace > 0 ? lambda1 / trace : 0;
  const varExp2 = trace > 0 ? lambda2 / trace : 0;
  return { pc1, pc2, varExplained: [varExp1 * 100, varExp2 * 100] };
}

function powerIteration(M: number[][], iters: number): number[] {
  const n = M.length;
  let v = new Array(n).fill(0).map(() => Math.random());
  let norm = Math.sqrt(v.reduce((a, b) => a + b * b, 0)) || 1;
  v = v.map((x) => x / norm);
  for (let k = 0; k < iters; k++) {
    const next = new Array(n).fill(0);
    for (let i = 0; i < n; i++) {
      let s = 0;
      for (let j = 0; j < n; j++) s += M[i][j] * v[j];
      next[i] = s;
    }
    norm = Math.sqrt(next.reduce((a, b) => a + b * b, 0)) || 1;
    v = next.map((x) => x / norm);
  }
  return v;
}

function rayleighQuotient(M: number[][], v: number[]): number {
  const n = M.length;
  let num = 0;
  for (let i = 0; i < n; i++) {
    let s = 0;
    for (let j = 0; j < n; j++) s += M[i][j] * v[j];
    num += v[i] * s;
  }
  return num;
}

// ---------------- Simple hierarchical clustering (single linkage) for heatmap row ordering ----------------
function hierarchicalOrder(data: number[][]): number[] {
  const n = data.length;
  if (n <= 1) return data.map((_, i) => i);
  // Compute pairwise Euclidean distance
  const dist: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      let d = 0;
      for (let k = 0; k < data[i].length; k++) d += (data[i][k] - data[j][k]) ** 2;
      d = Math.sqrt(d);
      dist[i][j] = d;
      dist[j][i] = d;
    }
  }
  // Simple greedy ordering: start from row 0, always go to nearest unvisited
  const order: number[] = [0];
  const visited = new Set([0]);
  while (order.length < n) {
    const last = order[order.length - 1];
    let bestJ = -1, bestD = Infinity;
    for (let j = 0; j < n; j++) {
      if (visited.has(j)) continue;
      if (dist[last][j] < bestD) { bestD = dist[last][j]; bestJ = j; }
    }
    if (bestJ === -1) break;
    order.push(bestJ);
    visited.add(bestJ);
  }
  return order;
}

// ---------------- Color mapping ----------------
function zColor(z: number): string {
  // Diverging blue → white → red, clamp at ±3
  const clamped = Math.max(-3, Math.min(3, z));
  const t = (clamped + 3) / 6; // 0..1
  // Interpolate: 0 = #2b6cb0 (blue), 0.5 = #f7fafc (near white), 1 = #c53030 (red)
  if (t < 0.5) {
    const u = t * 2;
    return interpolateColor([43, 108, 176], [247, 250, 252], u);
  } else {
    const u = (t - 0.5) * 2;
    return interpolateColor([247, 250, 252], [197, 48, 48], u);
  }
}
function interpolateColor(a: number[], b: number[], t: number): string {
  const r = Math.round(a[0] + (b[0] - a[0]) * t);
  const g = Math.round(a[1] + (b[1] - a[1]) * t);
  const bl = Math.round(a[2] + (b[2] - a[2]) * t);
  return `rgb(${r},${g},${bl})`;
}

// ---------------- Heatmap SVG ----------------
function Heatmap({ geneIds, sampleIds, zMatrix, rowOrder }: { geneIds: string[]; sampleIds: string[]; zMatrix: number[][]; rowOrder: number[]; }) {
  const cellW = 30;
  const cellH = Math.max(8, Math.min(20, Math.floor(400 / rowOrder.length)));
  const labelW = 100;
  const headerH = 60;
  const width = labelW + sampleIds.length * cellW + 20;
  const height = headerH + rowOrder.length * cellH + 20;
  return (
    <div className="overflow-auto">
      <svg width={width} height={height} className="select-none">
        {sampleIds.map((s, i) => (
          <text
            key={`col-${i}`}
            x={labelW + i * cellW + cellW / 2}
            y={headerH - 6}
            transform={`rotate(-45 ${labelW + i * cellW + cellW / 2} ${headerH - 6})`}
            fontSize={10}
            textAnchor="end"
            className="fill-gray-700 dark:fill-gray-300"
          >
            {s}
          </text>
        ))}
        {rowOrder.map((rowIdx, displayIdx) => (
          <g key={`row-${displayIdx}`}>
            <text
              x={labelW - 4}
              y={headerH + displayIdx * cellH + cellH / 2 + 3}
              fontSize={9}
              textAnchor="end"
              className="fill-gray-700 dark:fill-gray-300"
            >
              {geneIds[rowIdx]}
            </text>
            {zMatrix[rowIdx].map((z, c) => (
              <rect
                key={`cell-${displayIdx}-${c}`}
                x={labelW + c * cellW}
                y={headerH + displayIdx * cellH}
                width={cellW - 1}
                height={cellH - 1}
                fill={zColor(z)}
              >
                <title>{`${geneIds[rowIdx]} / ${sampleIds[c]}: z = ${z.toFixed(2)}`}</title>
              </rect>
            ))}
          </g>
        ))}
      </svg>
    </div>
  );
}

// ---------------- Demo CSV ----------------
const DEMO_CSV = `gene,Ctrl_1,Ctrl_2,Ctrl_3,Treat_1,Treat_2,Treat_3
GAPDH,98,102,100,99,101,97
TP53,12,14,11,42,45,48
MYC,85,87,82,30,28,25
CDKN1A,15,17,14,55,57,52
BAX,22,21,20,65,67,69
BCL2,70,72,68,25,23,22
ACTB,95,98,96,97,99,94
HSPA1A,40,42,38,80,82,79
MKI67,60,62,58,30,28,25
CCND1,75,77,73,32,30,28`;

export default function HeatmapPCA() {
  const [csv, setCsv] = useState<string>(DEMO_CSV);

  const parsed = useMemo(() => parseCsv(csv), [csv]);
  const zMatrix = useMemo(() => zScoreRows(parsed.values), [parsed.values]);
  const rowOrder = useMemo(() => hierarchicalOrder(zMatrix), [zMatrix]);
  const pca = useMemo(() => computePCA(parsed.values), [parsed.values]);

  const pcaData = useMemo(() => {
    if (pca.pc1.length !== parsed.sampleIds.length) return [];
    return parsed.sampleIds.map((s, i) => ({ name: s, pc1: pca.pc1[i], pc2: pca.pc2[i] }));
  }, [pca, parsed.sampleIds]);

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => setCsv(String(reader.result || ''));
    reader.readAsText(f);
  };

  const downloadZ = () => {
    const header = ['gene', ...parsed.sampleIds].join(',');
    const rows = parsed.geneIds.map((g, i) => [g, ...zMatrix[i].map((v) => v.toFixed(4))].join(','));
    const blob = new Blob([[header, ...rows].join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'zscore_matrix.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Color samples for PCA — odd palette
  const colors = ['#3182ce', '#e53e3e', '#38a169', '#d69e2e', '#805ad5', '#dd6b20', '#319795', '#d53f8c'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-slate-900">
      <Navigation />
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <Badge className="mb-3 bg-blue-100 text-blue-800 hover:bg-blue-200">Visualization</Badge>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-3 flex items-center justify-center gap-2">
            <BarChart3 className="h-8 w-8 text-blue-600" /> Heatmap + PCA
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Upload a gene × sample expression matrix. Get a Z-score heatmap (rows ordered by similarity) and a sample PCA scatter.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Input</CardTitle>
              <CardDescription>CSV or TSV. First column = gene IDs, header row = sample IDs.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="csv-upload" className="cursor-pointer">
                  <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded p-4 text-center hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                    <Upload className="h-6 w-6 mx-auto mb-2 text-gray-500" />
                    <p className="text-sm">Click to upload CSV/TSV</p>
                  </div>
                  <Input id="csv-upload" type="file" accept=".csv,.tsv,.txt" className="hidden" onChange={onFile} />
                </Label>
              </div>

              <div>
                <Label>Or paste data</Label>
                <Textarea value={csv} onChange={(e) => setCsv(e.target.value)} rows={10} className="font-mono text-xs" />
              </div>

              <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                <div>Genes detected: <strong>{parsed.geneIds.length}</strong></div>
                <div>Samples detected: <strong>{parsed.sampleIds.length}</strong></div>
                {parsed.errors.length > 0 && (
                  <Alert variant="destructive" className="mt-2">
                    <AlertTitle>Parse warnings</AlertTitle>
                    <AlertDescription>
                      <ul className="list-disc pl-4">
                        {parsed.errors.slice(0, 3).map((e, i) => <li key={i}>{e}</li>)}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              <Button variant="outline" size="sm" onClick={downloadZ} className="w-full" disabled={!parsed.geneIds.length}>
                <Download className="h-4 w-4 mr-2" /> Download Z-score CSV
              </Button>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Visualization</CardTitle>
              <CardDescription>Switch between heatmap and PCA below.</CardDescription>
            </CardHeader>
            <CardContent>
              {parsed.geneIds.length === 0 ? (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertTitle>No data</AlertTitle>
                  <AlertDescription>Paste or upload a gene × sample matrix to render.</AlertDescription>
                </Alert>
              ) : (
                <Tabs defaultValue="heatmap">
                  <TabsList>
                    <TabsTrigger value="heatmap">Heatmap</TabsTrigger>
                    <TabsTrigger value="pca">PCA</TabsTrigger>
                  </TabsList>
                  <TabsContent value="heatmap" className="pt-4">
                    <Heatmap
                      geneIds={parsed.geneIds}
                      sampleIds={parsed.sampleIds}
                      zMatrix={zMatrix}
                      rowOrder={rowOrder}
                    />
                    <div className="flex items-center gap-2 mt-3 text-xs text-gray-600 dark:text-gray-400">
                      <span>Z-score:</span>
                      <span style={{ background: zColor(-3), color: '#fff' }} className="px-2 py-0.5 rounded">−3</span>
                      <span style={{ background: zColor(0), color: '#333' }} className="px-2 py-0.5 rounded">0</span>
                      <span style={{ background: zColor(3), color: '#fff' }} className="px-2 py-0.5 rounded">+3</span>
                      <span className="ml-3">Rows ordered by similarity (greedy nearest-neighbor on z-vectors).</span>
                    </div>
                  </TabsContent>
                  <TabsContent value="pca" className="pt-4">
                    <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                      Variance explained — PC1: {pca.varExplained[0].toFixed(1)}% &nbsp;|&nbsp; PC2: {pca.varExplained[1].toFixed(1)}%
                    </div>
                    <ResponsiveContainer width="100%" height={420}>
                      <ScatterChart margin={{ top: 20, right: 30, bottom: 30, left: 30 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e0" />
                        <XAxis type="number" dataKey="pc1" name="PC1" label={{ value: `PC1 (${pca.varExplained[0].toFixed(1)}%)`, position: 'bottom', offset: 10 }} />
                        <YAxis type="number" dataKey="pc2" name="PC2" label={{ value: `PC2 (${pca.varExplained[1].toFixed(1)}%)`, angle: -90, position: 'left' }} />
                        <Tooltip cursor={{ strokeDasharray: '3 3' }} formatter={(v: any, n: any) => [Number(v).toFixed(2), n]} />
                        <Scatter data={pcaData} fill="#3182ce">
                          {pcaData.map((d, i) => (
                            <Cell key={`pca-${i}`} fill={colors[i % colors.length]} />
                          ))}
                        </Scatter>
                      </ScatterChart>
                    </ResponsiveContainer>
                    <div className="flex flex-wrap gap-3 mt-3 text-xs">
                      {pcaData.map((d, i) => (
                        <div key={i} className="flex items-center gap-1">
                          <span className="inline-block w-3 h-3 rounded" style={{ background: colors[i % colors.length] }} />
                          <span className="text-gray-700 dark:text-gray-300">{d.name}: ({d.pc1.toFixed(2)}, {d.pc2.toFixed(2)})</span>
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                </Tabs>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
