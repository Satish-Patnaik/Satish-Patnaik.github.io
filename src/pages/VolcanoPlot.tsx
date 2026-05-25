import { useState, useRef } from 'react';
import Navigation from '@/components/Navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { TrendingUp, Upload, Settings, Palette, Database } from 'lucide-react';
import { toast } from 'sonner';

interface GeneData {
  gene: string;
  log2FC: number;
  pvalue: number;
  padj?: number;
}

export default function VolcanoPlot() {
  const [data, setData] = useState<GeneData[]>([]);
  const [rawInput, setRawInput] = useState('');
  const [thresholds, setThresholds] = useState({
    log2FC: 1.0,
    pvalue: 0.05
  });
  const [colors, setColors] = useState({
    upregulated: '#8B0000',
    downregulated: '#006400',
    nonsignificant: '#808080'
  });
  const [labelStrategy, setLabelStrategy] = useState('none');
  const [topN, setTopN] = useState(10);
  const [topNBy, setTopNBy] = useState('significance');
  const [topNDirection, setTopNDirection] = useState('both'); // New option for direction
  const [customLabels, setCustomLabels] = useState('');
  const [usePadj, setUsePadj] = useState(false);
  const [plotGenerated, setPlotGenerated] = useState(false);
  const [significantGenes, setSignificantGenes] = useState<{
    upregulated: GeneData[];
    downregulated: GeneData[];
    all: GeneData[];
  }>({ upregulated: [], downregulated: [], all: [] });
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const loadDemoData = async () => {
    try {
      const response = await fetch('/data/volcano_demo.csv');
      const csvText = await response.text();
      setRawInput(csvText);
      toast.success('Demo data loaded! Click "Parse Data" to process it.');
    } catch (error) {
      toast.error('Failed to load demo data');
    }
  };

  const parseData = () => {
    try {
      let parsedData: GeneData[] = [];
      
      if (rawInput.trim().startsWith('[') || rawInput.trim().startsWith('{')) {
        // JSON format
        const jsonData = JSON.parse(rawInput);
        parsedData = Array.isArray(jsonData) ? jsonData : [jsonData];
      } else {
        // CSV format
        const lines = rawInput.trim().split('\n');
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        
        const geneIdx = headers.findIndex(h => h.includes('gene'));
        const log2FCIdx = headers.findIndex(h => h.includes('log2fc') || h.includes('logfc') || h.includes('log2foldchange'));
        const pvalueIdx = headers.findIndex(h => h.includes('pvalue') || h.includes('pval'));
        const padjIdx = headers.findIndex(h => h.includes('padj') || h.includes('adj'));
        
        if (geneIdx === -1 || log2FCIdx === -1 || pvalueIdx === -1) {
          throw new Error('Required columns not found. Need: gene, log2FC, pvalue');
        }
        
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',');
          if (values.length >= 3) {
            const gene: GeneData = {
              gene: values[geneIdx].trim(),
              log2FC: parseFloat(values[log2FCIdx]),
              pvalue: parseFloat(values[pvalueIdx])
            };
            if (padjIdx !== -1 && values[padjIdx]) {
              gene.padj = parseFloat(values[padjIdx]);
            }
            parsedData.push(gene);
          }
        }
      }
      
      setData(parsedData);
      toast.success(`Loaded ${parsedData.length} genes successfully!`);
    } catch (error) {
      toast.error('Error parsing data. Please check format.');
    }
  };

  const generatePlot = () => {
    if (data.length === 0) {
      toast.error('Please load data first');
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size for high DPI
    const scale = window.devicePixelRatio || 1;
    canvas.width = 800 * scale;
    canvas.height = 600 * scale;
    canvas.style.width = '800px';
    canvas.style.height = '600px';
    ctx.scale(scale, scale);

    // Clear canvas
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, 800, 600);

    // Calculate plot dimensions
    const margin = { top: 50, right: 50, bottom: 80, left: 80 };
    const plotWidth = 800 - margin.left - margin.right;
    const plotHeight = 600 - margin.top - margin.bottom;

    // Process data for plotting
    const processedData = data.map(d => ({
      ...d,
      x: d.log2FC,
      y: -Math.log10(usePadj && d.padj ? d.padj : d.pvalue),
      significant: Math.abs(d.log2FC) >= thresholds.log2FC && 
                  (usePadj && d.padj ? d.padj : d.pvalue) <= thresholds.pvalue,
      upregulated: d.log2FC >= thresholds.log2FC && 
                  (usePadj && d.padj ? d.padj : d.pvalue) <= thresholds.pvalue,
      downregulated: d.log2FC <= -thresholds.log2FC && 
                    (usePadj && d.padj ? d.padj : d.pvalue) <= thresholds.pvalue
    }));

    // Separate significant genes
    const upregulated = processedData.filter(d => d.upregulated);
    const downregulated = processedData.filter(d => d.downregulated);
    const allSignificant = processedData.filter(d => d.significant);
    
    setSignificantGenes({ upregulated, downregulated, all: allSignificant });

    // Calculate scales
    const xExtent = processedData.reduce((acc, d) => [
      Math.min(acc[0], d.x),
      Math.max(acc[1], d.x)
    ], [0, 0]);
    const yExtent = processedData.reduce((acc, d) => [
      Math.min(acc[0], d.y),
      Math.max(acc[1], d.y)
    ], [0, 0]);

    const xPadding = Math.abs(xExtent[1] - xExtent[0]) * 0.1;
    const yPadding = Math.abs(yExtent[1] - yExtent[0]) * 0.1;

    const xScale = (x: number) => margin.left + ((x - xExtent[0] + xPadding) / (xExtent[1] - xExtent[0] + 2 * xPadding)) * plotWidth;
    const yScale = (y: number) => margin.top + plotHeight - ((y - yExtent[0] + yPadding) / (yExtent[1] - yExtent[0] + 2 * yPadding)) * plotHeight;

    // Draw axes
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(margin.left, margin.top + plotHeight);
    ctx.lineTo(margin.left + plotWidth, margin.top + plotHeight);
    ctx.moveTo(margin.left, margin.top);
    ctx.lineTo(margin.left, margin.top + plotHeight);
    ctx.stroke();

    // Draw threshold lines
    ctx.strokeStyle = '#ddd';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    
    // Vertical threshold lines
    ctx.beginPath();
    ctx.moveTo(xScale(thresholds.log2FC), margin.top);
    ctx.lineTo(xScale(thresholds.log2FC), margin.top + plotHeight);
    ctx.moveTo(xScale(-thresholds.log2FC), margin.top);
    ctx.lineTo(xScale(-thresholds.log2FC), margin.top + plotHeight);
    ctx.stroke();
    
    // Horizontal threshold line
    const pThreshold = -Math.log10(thresholds.pvalue);
    ctx.beginPath();
    ctx.moveTo(margin.left, yScale(pThreshold));
    ctx.lineTo(margin.left + plotWidth, yScale(pThreshold));
    ctx.stroke();
    
    ctx.setLineDash([]);

    // Draw points
    processedData.forEach(d => {
      const x = xScale(d.x);
      const y = yScale(d.y);
      
      ctx.fillStyle = d.upregulated ? colors.upregulated :
                     d.downregulated ? colors.downregulated :
                     colors.nonsignificant;
      
      ctx.beginPath();
      ctx.arc(x, y, d.significant ? 4 : 3, 0, 2 * Math.PI);
      ctx.fill();
    });

    // Add labels based on strategy
    if (labelStrategy !== 'none') {
      ctx.fillStyle = '#000';
      ctx.font = '10px Arial';
      
      let genesToLabel: typeof processedData = [];
      
      if (labelStrategy === 'top-n') {
        if (topNDirection === 'both') {
          // Original behavior - top N from all significant genes
          if (topNBy === 'significance') {
            genesToLabel = processedData
              .filter(d => d.significant)
              .sort((a, b) => b.y - a.y)
              .slice(0, topN);
          } else if (topNBy === 'log2fc') {
            genesToLabel = processedData
              .filter(d => d.significant)
              .sort((a, b) => Math.abs(b.log2FC) - Math.abs(a.log2FC))
              .slice(0, topN);
          }
        } else if (topNDirection === 'upregulated') {
          // Top N upregulated genes only
          if (topNBy === 'significance') {
            genesToLabel = processedData
              .filter(d => d.upregulated)
              .sort((a, b) => b.y - a.y)
              .slice(0, topN);
          } else if (topNBy === 'log2fc') {
            genesToLabel = processedData
              .filter(d => d.upregulated)
              .sort((a, b) => b.log2FC - a.log2FC)
              .slice(0, topN);
          }
        } else if (topNDirection === 'downregulated') {
          // Top N downregulated genes only
          if (topNBy === 'significance') {
            genesToLabel = processedData
              .filter(d => d.downregulated)
              .sort((a, b) => b.y - a.y)
              .slice(0, topN);
          } else if (topNBy === 'log2fc') {
            genesToLabel = processedData
              .filter(d => d.downregulated)
              .sort((a, b) => Math.abs(a.log2FC) - Math.abs(b.log2FC))
              .slice(0, topN);
          }
        }
      } else if (labelStrategy === 'custom') {
        const customGenes = customLabels.split(',').map(g => g.trim());
        genesToLabel = processedData.filter(d => customGenes.includes(d.gene));
      }
      
      genesToLabel.forEach(d => {
        const x = xScale(d.x);
        const y = yScale(d.y);
        ctx.fillText(d.gene, x + 5, y - 5);
      });
    }

    // Add axis labels
    ctx.fillStyle = '#000';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('log2(Fold Change)', 400, 580);
    
    ctx.save();
    ctx.translate(20, 300);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(`-log10(${usePadj ? 'padj' : 'pvalue'})`, 0, 0);
    ctx.restore();

    setPlotGenerated(true);
    toast.success('Volcano plot generated successfully!');
  };

  const downloadPlot = (format: 'png' | 'svg' | 'jpeg' | 'tiff', dpi: number = 300) => {
    if (data.length === 0) {
      toast.error('Load data first');
      return;
    }

    // Auto-generate the plot if it hasn't been drawn yet
    if (!plotGenerated) {
      generatePlot();
    }

    const canvas = canvasRef.current;
    if (!canvas) {
      toast.error('Could not access plot canvas — please go to the Generate Plot tab and click "Generate Plot" first');
      return;
    }

    if (format !== 'png' && format !== 'jpeg' && format !== 'tiff') return;

    // Create high-DPI version
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) {
      toast.error('Browser does not support canvas export');
      return;
    }

    const scaleFactor = dpi / 72;
    tempCanvas.width = canvas.width * scaleFactor;
    tempCanvas.height = canvas.height * scaleFactor;
    tempCtx.imageSmoothingEnabled = true;
    tempCtx.imageSmoothingQuality = 'high';
    tempCtx.drawImage(canvas, 0, 0, tempCanvas.width, tempCanvas.height);

    const mime = format === 'jpeg' ? 'image/jpeg' : 'image/png';
    const ext = format === 'tiff' ? 'png' : format; // browsers can't natively encode TIFF; save as PNG with .png ext
    const filename = `volcano_plot_${dpi}dpi.${ext}`;

    tempCanvas.toBlob(
      (blob) => {
        if (!blob) {
          toast.error('Failed to generate image');
          return;
        }
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        setTimeout(() => {
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        }, 100);
        toast.success(`Saved ${filename} at ${dpi} DPI`);
      },
      mime,
      format === 'jpeg' ? 0.95 : undefined
    );
  };

  const downloadGeneList = (type: 'all' | 'upregulated' | 'downregulated') => {
    let genes: GeneData[] = [];
    let filename = '';
    
    switch (type) {
      case 'upregulated':
        genes = significantGenes.upregulated;
        filename = 'upregulated_genes.csv';
        break;
      case 'downregulated':
        genes = significantGenes.downregulated;
        filename = 'downregulated_genes.csv';
        break;
      default:
        genes = significantGenes.all;
        filename = 'significant_genes.csv';
    }
    
    const csv = [
      'gene,log2FC,pvalue' + (usePadj ? ',padj' : ''),
      ...genes.map(d => 
        `${d.gene},${d.log2FC},${d.pvalue}` + (usePadj && d.padj ? `,${d.padj}` : '')
      )
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 100);
    toast.success(`Downloaded ${genes.length} ${type} genes`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-green-50">
      <Navigation />
      
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-600 rounded-full flex items-center justify-center">
            <TrendingUp className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Volcano Plot Generator</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Create publication-ready volcano plots for differential gene expression analysis with customizable colors, labels, and high-DPI export options.
          </p>
        </div>

        <Tabs defaultValue="data" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="data">Data Input</TabsTrigger>
            <TabsTrigger value="settings">Plot Settings</TabsTrigger>
            <TabsTrigger value="plot">Generate Plot</TabsTrigger>
            <TabsTrigger value="results">Gene Lists</TabsTrigger>
          </TabsList>

          <TabsContent value="data">
            <Card className="border-0 shadow-xl bg-white/90 backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Upload className="h-5 w-5 mr-2 text-blue-600" />
                  Data Input
                </CardTitle>
                <CardDescription>
                  Upload CSV or JSON data with required columns: gene, log2FC, pvalue (optional: padj)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-4 mb-4">
                  <Button onClick={loadDemoData} variant="outline" className="flex-1">
                    <Database className="h-4 w-4 mr-2" />
                    Load Demo Data
                  </Button>
                </div>
                
                <div>
                  <Label htmlFor="data-input">Paste your data (CSV or JSON format)</Label>
                  <Textarea
                    id="data-input"
                    placeholder="gene,log2FoldChange,pvalue,padj&#10;GENE1,2.5,0.001,0.01&#10;GENE2,-1.8,0.03,0.05&#10;..."
                    value={rawInput}
                    onChange={(e) => setRawInput(e.target.value)}
                    className="min-h-[200px] font-mono text-sm mt-2"
                  />
                </div>
                
                <Button onClick={parseData} className="w-full">
                  <Upload className="h-4 w-4 mr-2" />
                  Parse Data
                </Button>
                
                {data.length > 0 && (
                  <div className="p-4 bg-green-50 rounded-lg">
                    <p className="text-green-800 font-medium">
                      ✅ Loaded {data.length} genes successfully
                    </p>
                    <p className="text-sm text-green-600 mt-1">
                      Sample: {data[0].gene} (log2FC: {data[0].log2FC}, p: {data[0].pvalue})
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-0 shadow-xl bg-white/90 backdrop-blur">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Settings className="h-5 w-5 mr-2 text-purple-600" />
                    Thresholds
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="log2fc-threshold">|log2FC| threshold</Label>
                    <Input
                      id="log2fc-threshold"
                      type="number"
                      step="0.1"
                      value={thresholds.log2FC}
                      onChange={(e) => setThresholds({...thresholds, log2FC: parseFloat(e.target.value)})}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="pvalue-threshold">P-value threshold</Label>
                    <Input
                      id="pvalue-threshold"
                      type="number"
                      step="0.001"
                      value={thresholds.pvalue}
                      onChange={(e) => setThresholds({...thresholds, pvalue: parseFloat(e.target.value)})}
                    />
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="use-padj"
                      checked={usePadj}
                      onCheckedChange={setUsePadj}
                    />
                    <Label htmlFor="use-padj">Use adjusted p-values (padj) if available</Label>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-xl bg-white/90 backdrop-blur">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Palette className="h-5 w-5 mr-2 text-pink-600" />
                    Colors & Labels
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="up-color">Upregulated</Label>
                      <Input
                        id="up-color"
                        type="color"
                        value={colors.upregulated}
                        onChange={(e) => setColors({...colors, upregulated: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="down-color">Downregulated</Label>
                      <Input
                        id="down-color"
                        type="color"
                        value={colors.downregulated}
                        onChange={(e) => setColors({...colors, downregulated: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="ns-color">Non-significant</Label>
                      <Input
                        id="ns-color"
                        type="color"
                        value={colors.nonsignificant}
                        onChange={(e) => setColors({...colors, nonsignificant: e.target.value})}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="label-strategy">Label Strategy</Label>
                    <Select value={labelStrategy} onValueChange={setLabelStrategy}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No Labels</SelectItem>
                        <SelectItem value="top-n">Top N Genes</SelectItem>
                        <SelectItem value="custom">Custom Gene List</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {labelStrategy === 'top-n' && (
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="top-n">Number of genes to label</Label>
                        <Select value={topN.toString()} onValueChange={(value) => setTopN(parseInt(value))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="10">Top 10</SelectItem>
                            <SelectItem value="20">Top 20</SelectItem>
                            <SelectItem value="50">Top 50</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label htmlFor="top-n-direction">Gene Direction</Label>
                        <Select value={topNDirection} onValueChange={setTopNDirection}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="both">Both Up & Down</SelectItem>
                            <SelectItem value="upregulated">Upregulated Only</SelectItem>
                            <SelectItem value="downregulated">Downregulated Only</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label htmlFor="top-n-by">Sort by</Label>
                        <Select value={topNBy} onValueChange={setTopNBy}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="significance">Significance (p-value)</SelectItem>
                            <SelectItem value="log2fc">Fold Change (|log2FC|)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                  
                  {labelStrategy === 'custom' && (
                    <div>
                      <Label htmlFor="custom-labels">Custom gene list (comma-separated)</Label>
                      <Textarea
                        id="custom-labels"
                        placeholder="GENE1, GENE2, GENE3"
                        value={customLabels}
                        onChange={(e) => setCustomLabels(e.target.value)}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="plot">
            <Card className="border-0 shadow-xl bg-white/90 backdrop-blur">
              <CardHeader>
                <CardTitle>Volcano Plot</CardTitle>
                <CardDescription>
                  {plotGenerated ? 'Your volcano plot is ready — download options below' : 'Generate plot to see visualization'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button onClick={generatePlot} className="w-full bg-red-600 hover:bg-red-700" disabled={data.length === 0}>
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Generate Volcano Plot
                </Button>

                <div className="flex justify-center">
                  <canvas
                    ref={canvasRef}
                    className="border border-gray-200 rounded-lg max-w-full"
                    style={{ maxHeight: '600px' }}
                  />
                </div>

                {plotGenerated && (
                  <div className="space-y-4 pt-4 border-t">
                    <div>
                      <h4 className="font-semibold mb-3 text-sm text-gray-700">Download plot</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        <Button onClick={() => downloadPlot('png', 300)} variant="outline" size="sm">
                          PNG 300 DPI
                        </Button>
                        <Button onClick={() => downloadPlot('jpeg', 300)} variant="outline" size="sm">
                          JPEG 300 DPI
                        </Button>
                        <Button onClick={() => downloadPlot('tiff', 300)} variant="outline" size="sm">
                          TIFF 300 DPI
                        </Button>
                        <Button onClick={() => downloadPlot('png', 600)} variant="outline" size="sm">
                          PNG 600 DPI
                        </Button>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-3 text-sm text-gray-700">Download gene lists (CSV)</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        <Button
                          onClick={() => downloadGeneList('upregulated')}
                          variant="outline"
                          size="sm"
                          disabled={significantGenes.upregulated.length === 0}
                          className="text-red-600 border-red-200 hover:bg-red-50"
                        >
                          Upregulated ({significantGenes.upregulated.length})
                        </Button>
                        <Button
                          onClick={() => downloadGeneList('downregulated')}
                          variant="outline"
                          size="sm"
                          disabled={significantGenes.downregulated.length === 0}
                          className="text-green-600 border-green-200 hover:bg-green-50"
                        >
                          Downregulated ({significantGenes.downregulated.length})
                        </Button>
                        <Button
                          onClick={() => downloadGeneList('all')}
                          variant="outline"
                          size="sm"
                          disabled={significantGenes.all.length === 0}
                        >
                          All Significant ({significantGenes.all.length})
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="results">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="border-0 shadow-xl bg-white/90 backdrop-blur">
                <CardHeader>
                  <CardTitle className="text-red-600">Upregulated Genes</CardTitle>
                  <CardDescription>
                    {significantGenes.upregulated.length} genes
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {significantGenes.upregulated.slice(0, 10).map((gene, idx) => (
                      <div key={idx} className="text-sm">
                        <span className="font-medium">{gene.gene}</span>
                        <span className="text-gray-500 ml-2">({gene.log2FC.toFixed(2)})</span>
                      </div>
                    ))}
                    {significantGenes.upregulated.length > 10 && (
                      <p className="text-sm text-gray-500">...and {significantGenes.upregulated.length - 10} more</p>
                    )}
                  </div>
                  <Button 
                    onClick={() => downloadGeneList('upregulated')} 
                    className="w-full mt-4" 
                    variant="outline"
                    disabled={significantGenes.upregulated.length === 0}
                  >
                    Download List
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-xl bg-white/90 backdrop-blur">
                <CardHeader>
                  <CardTitle className="text-green-600">Downregulated Genes</CardTitle>
                  <CardDescription>
                    {significantGenes.downregulated.length} genes
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {significantGenes.downregulated.slice(0, 10).map((gene, idx) => (
                      <div key={idx} className="text-sm">
                        <span className="font-medium">{gene.gene}</span>
                        <span className="text-gray-500 ml-2">({gene.log2FC.toFixed(2)})</span>
                      </div>
                    ))}
                    {significantGenes.downregulated.length > 10 && (
                      <p className="text-sm text-gray-500">...and {significantGenes.downregulated.length - 10} more</p>
                    )}
                  </div>
                  <Button 
                    onClick={() => downloadGeneList('downregulated')} 
                    className="w-full mt-4" 
                    variant="outline"
                    disabled={significantGenes.downregulated.length === 0}
                  >
                    Download List
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-xl bg-white/90 backdrop-blur">
                <CardHeader>
                  <CardTitle className="text-blue-600">All Significant</CardTitle>
                  <CardDescription>
                    {significantGenes.all.length} genes total
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Upregulated:</span>
                      <Badge variant="destructive">{significantGenes.upregulated.length}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Downregulated:</span>
                      <Badge variant="secondary" className="bg-green-100 text-green-800">{significantGenes.downregulated.length}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Total significant:</span>
                      <Badge variant="outline">{significantGenes.all.length}</Badge>
                    </div>
                  </div>
                  <Button 
                    onClick={() => downloadGeneList('all')} 
                    className="w-full mt-4" 
                    variant="outline"
                    disabled={significantGenes.all.length === 0}
                  >
                    Download All
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

    </div>
  );
}