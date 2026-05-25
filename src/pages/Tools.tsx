import { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

import Navigation from '@/components/Navigation';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';

import {
  ArrowRight,
  ArrowUp,
  ArrowDown,
  BarChart3,
  Calculator,
  Dna,
  FileDown,
  FileText,
  Files,
  FlaskConical,
  GitCompare,
  Image,
  Info,
  Search,
  Trash2,
  TrendingUp,
  Upload,
  Zap,
} from 'lucide-react';

import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import mammoth from 'mammoth';
import { PDFDocument } from 'pdf-lib';

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function formatBytes(bytes: number) {
  const units = ['B', 'KB', 'MB', 'GB'];
  let v = bytes;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i += 1;
  }
  return `${v.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

function safeFileBaseName(name: string) {
  return name.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9._-]+/g, '_').slice(0, 80) || 'file';
}

function parseFasta(text: string) {
  // very forgiving FASTA parser
  const lines = text.replace(/\r/g, '').split('\n');
  const records: { header: string; seq: string }[] = [];
  let header = '';
  let seqParts: string[] = [];

  const push = () => {
    const seq = seqParts.join('').replace(/\s+/g, '').toUpperCase();
    if (header || seq) records.push({ header: header || 'untitled', seq });
  };

  for (const line of lines) {
    if (line.startsWith('>')) {
      if (header || seqParts.length) push();
      header = line.slice(1).trim();
      seqParts = [];
    } else {
      if (line.trim().length) seqParts.push(line.trim());
    }
  }
  if (header || seqParts.length) push();

  // Handle plain sequence file (no headers)
  if (records.length === 0) {
    const seq = lines.join('').replace(/\s+/g, '').toUpperCase();
    if (seq) records.push({ header: 'sequence', seq });
  }

  return records;
}

function computeFastaStats(records: { header: string; seq: string }[]) {
  const n = records.length;
  const totalLength = records.reduce((acc, r) => acc + r.seq.length, 0);
  const gcCount = records.reduce((acc, r) => {
    const m = r.seq.match(/[GC]/g);
    return acc + (m ? m.length : 0);
  }, 0);
  const gcPercent = totalLength === 0 ? 0 : (gcCount / totalLength) * 100;

  const perSequence = records.map((r) => {
    const len = r.seq.length;
    const gc = (r.seq.match(/[GC]/g) || []).length;
    return {
      header: r.header,
      length: len,
      gc_percent: len === 0 ? 0 : (gc / len) * 100,
    };
  });

  return { n, totalLength, gcPercent, perSequence };
}

async function docxToPdf(docxFile: File, onProgress?: (p: number) => void) {
  onProgress?.(5);
  const buf = await docxFile.arrayBuffer();
  onProgress?.(15);

  const { value: html } = await mammoth.convertToHtml({ arrayBuffer: buf }, {
    styleMap: [],
    includeDefaultStyleMap: true,
  });

  onProgress?.(35);

  // Render HTML into a hidden container, then snapshot with html2canvas
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-100000px';
  container.style.top = '0';
  container.style.width = '800px';
  container.style.padding = '24px';
  container.style.background = '#ffffff';
  container.innerHTML = html || '<p>(Empty document)</p>';
  document.body.appendChild(container);

  try {
    onProgress?.(55);
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
    });

    onProgress?.(75);

    const pdf = new jsPDF('p', 'pt', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    const imgData = canvas.toDataURL('image/png');
    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    // Multi-page if needed
    let y = 0;
    let remaining = imgHeight;

    while (remaining > 0) {
      pdf.addImage(imgData, 'PNG', 0, y, imgWidth, imgHeight);
      remaining -= pageHeight;
      if (remaining > 0) {
        pdf.addPage();
        y -= pageHeight;
      }
    }

    onProgress?.(95);
    const out = pdf.output('blob');
    onProgress?.(100);
    return out;
  } finally {
    document.body.removeChild(container);
  }
}

async function mergePdfs(files: File[], onProgress?: (p: number) => void) {
  if (!files.length) throw new Error('Please add at least one PDF.');
  onProgress?.(5);

  const merged = await PDFDocument.create();

  for (let i = 0; i < files.length; i++) {
    const f = files[i];
    const bytes = await f.arrayBuffer();
    const doc = await PDFDocument.load(bytes);
    const pages = await merged.copyPages(doc, doc.getPageIndices());
    pages.forEach((p) => merged.addPage(p));
    onProgress?.(5 + Math.floor((90 * (i + 1)) / files.length));
  }

  const outBytes = await merged.save();
  onProgress?.(100);
  return new Blob([outBytes], { type: 'application/pdf' });
}

export default function Tools() {
  // Existing tool catalogue (kept)
  const tools = useMemo(
    () => [
      {
        icon: <TrendingUp className="h-12 w-12 text-red-600" />,
        title: 'Volcano Plot Generator',
        description: 'Create publication-ready volcano plots for differential expression analysis',
        path: '/volcano-plot',
        category: 'Visualization',
        difficulty: 'Beginner',
        features: ['Interactive plot generation', 'Customizable thresholds', 'Export high-resolution images', 'Demo data available'],
      },
      {
        icon: <BarChart3 className="h-12 w-12 text-blue-600" />,
        title: 'Box Plot Generator',
        description: 'Generate statistical box plots for group comparisons and data distribution analysis',
        path: '/box-plot',
        category: 'Visualization',
        difficulty: 'Beginner',
        features: ['Multiple group comparisons', 'Statistical significance testing', 'Customizable styling', 'CSV data import'],
      },
      {
        icon: <Image className="h-12 w-12 text-green-600" />,
        title: 'Image Format Converter',
        description: 'Convert images between different formats (PNG, JPG, WebP, etc.)',
        path: '/image-converter',
        category: 'Utility',
        difficulty: 'Beginner',
        features: ['Multiple format support', 'Batch processing', 'Quality adjustment', 'Instant preview'],
      },
      {
        icon: <Dna className="h-12 w-12 text-purple-600" />,
        title: 'Sequence Massager',
        description: 'Format and manipulate DNA/RNA/protein sequences for analysis',
        path: '/sequence-massager',
        category: 'Sequence Analysis',
        difficulty: 'Intermediate',
        features: ['FASTA formatting', 'Sequence cleaning', 'Reverse complement', 'Translation tools'],
      },
      {
        icon: <Calculator className="h-12 w-12 text-orange-600" />,
        title: 'Concentration Converter',
        description: 'Convert between different concentration units (mM, µM, ng/µL, etc.)',
        path: '/concentration-converter',
        category: 'Calculator',
        difficulty: 'Beginner',
        features: ['Multiple unit support', 'Molecular weight calculator', 'Dilution calculator', 'Save calculations'],
      },
      {
        icon: <FlaskConical className="h-12 w-12 text-teal-600" />,
        title: 'Real-Time PCR Calculator',
        description: 'Calculate PCR efficiency, fold changes, and analyze qPCR data',
        path: '/realtime-pcr',
        category: 'PCR Analysis',
        difficulty: 'Intermediate',
        features: ['ΔΔCt calculations', 'Efficiency analysis', 'Statistical testing', 'Result visualization'],
      },
      {
        icon: <Search className="h-12 w-12 text-purple-600" />,
        title: 'ORF Finder',
        description: 'Scan all 6 reading frames for open reading frames using NCBI codon tables',
        path: '/orf-finder',
        category: 'Sequence Analysis',
        difficulty: 'Beginner',
        features: ['6-frame scan', 'Standard / Mitochondrial / Bacterial codes', 'CSV export', 'Alternative start codon support'],
      },
      {
        icon: <FlaskConical className="h-12 w-12 text-teal-600" />,
        title: 'Primer Designer + Tm',
        description: 'Generate forward + reverse primer candidates with Tm by 3 methods and quality scoring',
        path: '/primer-designer',
        category: 'PCR Analysis',
        difficulty: 'Intermediate',
        features: ['Nearest-Neighbor Tm (SantaLucia)', 'GC% and Wallace Tm', 'Self-complementarity / GC clamp checks', 'CSV export'],
      },
      {
        icon: <GitCompare className="h-12 w-12 text-indigo-600" />,
        title: 'Pairwise Alignment',
        description: 'Global (Needleman–Wunsch) and local (Smith–Waterman) alignment with BLOSUM/PAM matrices',
        path: '/pairwise-alignment',
        category: 'Sequence Analysis',
        difficulty: 'Advanced',
        features: ['BLOSUM62 / PAM250 / Identity', 'Affine gap (Gotoh)', 'Identity + similarity %', 'DNA & protein'],
      },
      {
        icon: <BarChart3 className="h-12 w-12 text-blue-600" />,
        title: 'Heatmap + PCA',
        description: 'Z-score heatmap and sample PCA scatter from an expression matrix CSV',
        path: '/heatmap-pca',
        category: 'Visualization',
        difficulty: 'Intermediate',
        features: ['Row-wise Z-score', 'Hierarchical row ordering', 'PCA via power iteration', 'CSV / TSV upload'],
      },
    ],
    []
  );

  const categories = useMemo(
    () => [
      { name: 'Visualization', count: tools.filter((t) => t.category === 'Visualization').length, color: 'bg-blue-100 text-blue-800' },
      { name: 'Sequence Analysis', count: tools.filter((t) => t.category === 'Sequence Analysis').length, color: 'bg-purple-100 text-purple-800' },
      { name: 'Calculator', count: tools.filter((t) => t.category === 'Calculator').length, color: 'bg-orange-100 text-orange-800' },
      { name: 'PCR Analysis', count: tools.filter((t) => t.category === 'PCR Analysis').length, color: 'bg-teal-100 text-teal-800' },
      { name: 'Utility', count: tools.filter((t) => t.category === 'Utility').length, color: 'bg-green-100 text-green-800' },
    ],
    [tools]
  );

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner':
        return 'bg-green-100 text-green-800';
      case 'Intermediate':
        return 'bg-yellow-100 text-yellow-800';
      case 'Advanced':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Bioinformatics: FASTA upload
  const [fastaFile, setFastaFile] = useState<File | null>(null);
  const [fastaText, setFastaText] = useState('');
  const [fastaError, setFastaError] = useState<string | null>(null);

  const fastaRecords = useMemo(() => {
    if (!fastaText) return [];
    try {
      return parseFasta(fastaText);
    } catch {
      return [];
    }
  }, [fastaText]);

  const fastaStats = useMemo(() => {
    if (!fastaRecords.length) return null;
    return computeFastaStats(fastaRecords);
  }, [fastaRecords]);

  async function handleFastaUpload(file: File) {
    setFastaError(null);
    setFastaFile(file);
    try {
      const text = await file.text();
      setFastaText(text);
      const recs = parseFasta(text);
      if (!recs.length) setFastaError('No sequences found. Is this a valid FASTA file?');
    } catch {
      setFastaError('Failed to read file.');
      setFastaText('');
    }
  }

  function downloadFastaReport() {
    if (!fastaStats) return;
    const report = {
      filename: fastaFile?.name || null,
      sequences: fastaStats.n,
      total_length: fastaStats.totalLength,
      gc_percent: Number(fastaStats.gcPercent.toFixed(2)),
      per_sequence: fastaStats.perSequence.map((s) => ({
        header: s.header,
        length: s.length,
        gc_percent: Number(s.gc_percent.toFixed(2)),
      })),
      generated_at: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    downloadBlob(blob, `${safeFileBaseName(fastaFile?.name || 'fasta')}_report.json`);
  }

  // Document tools state
  const [docxFile, setDocxFile] = useState<File | null>(null);
  const [docxProgress, setDocxProgress] = useState(0);
  const [docxBusy, setDocxBusy] = useState(false);
  const [docxError, setDocxError] = useState<string | null>(null);

  const [mergeFiles, setMergeFiles] = useState<File[]>([]);
  const [mergeProgress, setMergeProgress] = useState(0);
  const [mergeBusy, setMergeBusy] = useState(false);
  const [mergeError, setMergeError] = useState<string | null>(null);

  const mergeInputRef = useRef<HTMLInputElement | null>(null);

  async function runDocxToPdf() {
    if (!docxFile) return;
    setDocxBusy(true);
    setDocxError(null);
    setDocxProgress(0);

    try {
      const blob = await docxToPdf(docxFile, setDocxProgress);
      downloadBlob(blob, `${safeFileBaseName(docxFile.name)}.pdf`);
    } catch (e: any) {
      setDocxError(e?.message || 'Conversion failed.');
    } finally {
      setDocxBusy(false);
    }
  }

  async function runMerge() {
    setMergeBusy(true);
    setMergeError(null);
    setMergeProgress(0);
    try {
      const blob = await mergePdfs(mergeFiles, setMergeProgress);
      downloadBlob(blob, 'merged.pdf');
    } catch (e: any) {
      setMergeError(e?.message || 'Merge failed.');
    } finally {
      setMergeBusy(false);
    }
  }

  function moveMergeFile(index: number, dir: -1 | 1) {
    const next = index + dir;
    if (next < 0 || next >= mergeFiles.length) return;
    const copy = [...mergeFiles];
    const tmp = copy[index];
    copy[index] = copy[next];
    copy[next] = tmp;
    setMergeFiles(copy);
  }

  function removeMergeFile(index: number) {
    setMergeFiles((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Navigation />

      <div className="container mx-auto px-4 py-12">
        {/* Hero */}
        <div className="text-center mb-10">
          <Badge className="mb-4 bg-blue-100 text-blue-800 hover:bg-blue-200">
            <Zap className="h-4 w-4 mr-1" />
            Tools
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Free Online Tools</h1>
          <p className="text-lg md:text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
            Bioinformatics analysis runs directly in your browser. No signup required.
          </p>
        </div>

        <Tabs defaultValue="bio" className="w-full">
          <TabsList className="grid w-full max-w-xl mx-auto grid-cols-2">
            <TabsTrigger value="bio">Bioinformatics</TabsTrigger>
            <TabsTrigger value="docs">Document Tools</TabsTrigger>
          </TabsList>

          {/* BIOINFORMATICS */}
          <TabsContent value="bio" className="mt-10 space-y-10">
            {/* FASTA quick tool */}
            <Card className="border-0 shadow-xl bg-white/90 backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Dna className="h-5 w-5" /> FASTA Quick Stats
                </CardTitle>
                <CardDescription>
                  Upload a .fasta/.fa file, get basic stats and download a JSON report.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col md:flex-row gap-3 md:items-center">
                  <div className="flex-1">
                    <Input
                      type="file"
                      accept=".fasta,.fa,.fna,.faa,.txt"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) void handleFastaUpload(f);
                      }}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={!fastaStats}
                    onClick={downloadFastaReport}
                    className="md:w-auto"
                  >
                    <FileDown className="h-4 w-4 mr-2" /> Download JSON
                  </Button>
                </div>

                {fastaError && (
                  <Alert variant="destructive">
                    <AlertTitle>FASTA issue</AlertTitle>
                    <AlertDescription>{fastaError}</AlertDescription>
                  </Alert>
                )}

                {fastaStats && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="border shadow-sm">
                      <CardContent className="p-4">
                        <p className="text-sm text-gray-600">Sequences</p>
                        <p className="text-2xl font-bold text-gray-900">{fastaStats.n}</p>
                      </CardContent>
                    </Card>
                    <Card className="border shadow-sm">
                      <CardContent className="p-4">
                        <p className="text-sm text-gray-600">Total length</p>
                        <p className="text-2xl font-bold text-gray-900">{fastaStats.totalLength.toLocaleString()}</p>
                      </CardContent>
                    </Card>
                    <Card className="border shadow-sm">
                      <CardContent className="p-4">
                        <p className="text-sm text-gray-600">GC%</p>
                        <p className="text-2xl font-bold text-gray-900">{fastaStats.gcPercent.toFixed(2)}%</p>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {!fastaStats && !fastaError && (
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertTitle>Tip</AlertTitle>
                    <AlertDescription>
                      For best results, use a standard FASTA with headers starting with &gt;.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Categories Overview */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {categories.map((category, index) => (
                <Card key={index} className="text-center border-0 shadow-lg bg-white/90 backdrop-blur">
                  <CardContent className="p-4">
                    <Badge className={`${category.color} mb-2`}>{category.name}</Badge>
                    <p className="text-2xl font-bold text-gray-900">{category.count}</p>
                    <p className="text-sm text-gray-600">Tools</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Tools Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {tools.map((tool, index) => (
                <Card
                  key={index}
                  className="border-0 shadow-xl bg-white/90 backdrop-blur hover:shadow-2xl transition-all duration-300 group"
                >
                  <CardHeader className="text-center pb-4">
                    <div className="mx-auto mb-4 p-4 bg-gray-50 rounded-full group-hover:scale-110 transition-transform">
                      {tool.icon}
                    </div>
                    <CardTitle className="text-xl mb-2">{tool.title}</CardTitle>
                    <CardDescription className="text-base">{tool.description}</CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center">
                      <Badge variant="outline">{tool.category}</Badge>
                      <Badge className={getDifficultyColor(tool.difficulty)}>{tool.difficulty}</Badge>
                    </div>

                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Features:</h4>
                      <ul className="space-y-1">
                        {tool.features.slice(0, 3).map((feature, featureIndex) => (
                          <li key={featureIndex} className="flex items-start text-sm text-gray-700">
                            <div className="h-1.5 w-1.5 bg-blue-600 rounded-full mt-2 mr-2 flex-shrink-0" />
                            {feature}
                          </li>
                        ))}
                        {tool.features.length > 3 && (
                          <li className="text-sm text-gray-500 italic">+{tool.features.length - 3} more features</li>
                        )}
                      </ul>
                    </div>

                    <Button asChild className="w-full mt-4 group">
                      <Link to={tool.path}>
                        Launch Tool
                        <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="mt-4 text-center">
              <Card className="border-0 shadow-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                <CardContent className="p-8">
                  <h3 className="text-2xl font-bold mb-4">Want to discuss a workflow?</h3>
                  <p className="text-lg mb-6 opacity-90">
                    Open to research collaborations and method conversations. Drop a note.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button asChild size="lg" variant="secondary">
                      <Link to="/contact">Get in touch</Link>
                    </Button>
                    <Button asChild size="lg" variant="outline" className="border-white bg-transparent text-white hover:bg-white hover:text-blue-600">
                      <Link to="/bioinformatics-help">Learning resources</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* DOCUMENT TOOLS */}
          <TabsContent value="docs" className="mt-10 space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* DOCX -> PDF */}
              <Card className="border-0 shadow-xl bg-white/90 backdrop-blur">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" /> Word → PDF
                  </CardTitle>
                  <CardDescription>Upload a .docx and download a PDF.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Input
                    type="file"
                    accept=".docx"
                    onChange={(e) => {
                      setDocxError(null);
                      setDocxProgress(0);
                      setDocxFile(e.target.files?.[0] || null);
                    }}
                  />

                  {docxError && (
                    <Alert variant="destructive">
                      <AlertTitle>Conversion failed</AlertTitle>
                      <AlertDescription>{docxError}</AlertDescription>
                    </Alert>
                  )}

                  {docxBusy && <Progress value={docxProgress} />}

                  <Button className="w-full" onClick={runDocxToPdf} disabled={!docxFile || docxBusy}>
                    <Upload className="h-4 w-4 mr-2" /> Convert & Download
                  </Button>
                </CardContent>
              </Card>

              {/* PDF Merge */}
              <Card className="border-0 shadow-xl bg-white/90 backdrop-blur">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Files className="h-5 w-5" /> Merge PDFs
                  </CardTitle>
                  <CardDescription>Add multiple PDFs, reorder, then merge.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <input
                    ref={mergeInputRef}
                    type="file"
                    accept="application/pdf"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      setMergeError(null);
                      const files = Array.from(e.target.files || []).filter((f) => f.type === 'application/pdf');
                      if (files.length) setMergeFiles((prev) => [...prev, ...files]);
                      if (mergeInputRef.current) mergeInputRef.current.value = '';
                    }}
                  />

                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => mergeInputRef.current?.click()}
                    disabled={mergeBusy}
                    className="w-full"
                  >
                    <Upload className="h-4 w-4 mr-2" /> Add PDFs
                  </Button>

                  {mergeFiles.length > 0 && (
                    <div className="space-y-2">
                      {mergeFiles.map((f, idx) => (
                        <div key={`${f.name}-${idx}`} className="flex items-center gap-2 rounded-md border bg-white p-2">
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-gray-900">{f.name}</p>
                            <p className="text-xs text-gray-500">{formatBytes(f.size)}</p>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={() => moveMergeFile(idx, -1)}
                              disabled={mergeBusy || idx === 0}
                              aria-label="Move up"
                            >
                              <ArrowUp className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={() => moveMergeFile(idx, 1)}
                              disabled={mergeBusy || idx === mergeFiles.length - 1}
                              aria-label="Move down"
                            >
                              <ArrowDown className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="destructive"
                              size="icon"
                              onClick={() => removeMergeFile(idx)}
                              disabled={mergeBusy}
                              aria-label="Remove"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {mergeError && (
                    <Alert variant="destructive">
                      <AlertTitle>Merge failed</AlertTitle>
                      <AlertDescription>{mergeError}</AlertDescription>
                    </Alert>
                  )}

                  {mergeBusy && <Progress value={mergeProgress} />}

                  <Button
                    className="w-full"
                    onClick={runMerge}
                    disabled={mergeFiles.length < 2 || mergeBusy}
                  >
                    <FileDown className="h-4 w-4 mr-2" /> Merge & download
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Collaboration CTA */}
            <div className="mt-12">
              <Card className="border-0 shadow-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                <CardContent className="p-8">
                  <h3 className="text-2xl font-bold mb-4">Want to discuss a workflow?</h3>
                  <p className="text-lg mb-6 opacity-90">
                    Open to research collaborations and method conversations. Drop a note.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button asChild size="lg" variant="secondary">
                      <Link to="/contact">Get in touch</Link>
                    </Button>
                    <Button asChild size="lg" variant="outline" className="border-white bg-transparent text-white hover:bg-white hover:text-blue-600">
                      <Link to="/bioinformatics-help">Learning resources</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
