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
import { Activity, Upload, Download, Calculator, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';

interface QPCRData {
  sample: string;
  gene: string;
  ct: number;
  group: string;
}

interface AnalysisResult {
  sample: string;
  gene: string;
  group: string;
  ct: number;
  deltaCt: number;
  deltaDeltaCt: number;
  rq: number;
  foldChange: number;
}

export default function QPCRAnalysis() {
  const [data, setData] = useState<QPCRData[]>([]);
  const [rawInput, setRawInput] = useState('');
  const [referenceGene, setReferenceGene] = useState('');
  const [controlGroup, setControlGroup] = useState('');
  const [availableGenes, setAvailableGenes] = useState<string[]>([]);
  const [availableGroups, setAvailableGroups] = useState<string[]>([]);
  const [results, setResults] = useState<AnalysisResult[]>([]);
  const [settings, setSettings] = useState({
    method: 'deltadeltact',
    errorBars: true,
    logScale: false,
    showStats: true
  });
  const [plotGenerated, setPlotGenerated] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const parseData = () => {
    try {
      let parsedData: QPCRData[] = [];
      
      if (rawInput.trim().startsWith('[') || rawInput.trim().startsWith('{')) {
        // JSON format
        const jsonData = JSON.parse(rawInput);
        parsedData = Array.isArray(jsonData) ? jsonData : [jsonData];
      } else {
        // CSV format
        const lines = rawInput.trim().split('\n');
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        
        const sampleIdx = headers.findIndex(h => h.includes('sample'));
        const geneIdx = headers.findIndex(h => h.includes('gene'));
        const ctIdx = headers.findIndex(h => h.includes('ct') || h.includes('cycle'));
        const groupIdx = headers.findIndex(h => h.includes('group') || h.includes('condition'));
        
        if (sampleIdx === -1 || geneIdx === -1 || ctIdx === -1 || groupIdx === -1) {
          throw new Error('Required columns not found. Need: sample, gene, ct, group');
        }
        
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(',');
          if (values.length >= 4) {
            parsedData.push({
              sample: values[sampleIdx].trim(),
              gene: values[geneIdx].trim(),
              ct: parseFloat(values[ctIdx]),
              group: values[groupIdx].trim()
            });
          }
        }
      }
      
      setData(parsedData);
      
      // Extract unique genes and groups
      const genes = [...new Set(parsedData.map(d => d.gene))];
      const groups = [...new Set(parsedData.map(d => d.group))];
      
      setAvailableGenes(genes);
      setAvailableGroups(groups);
      
      // Auto-select reference gene and control group if not set
      if (!referenceGene && genes.length > 0) {
        const housekeepingGenes = ['GAPDH', 'ACTB', 'B2M', 'HPRT1', 'TBP', 'YWHAZ'];
        const foundHousekeeper = genes.find(g => housekeepingGenes.includes(g.toUpperCase()));
        setReferenceGene(foundHousekeeper || genes[0]);
      }
      
      if (!controlGroup && groups.length > 0) {
        const controlNames = ['control', 'ctrl', 'untreated', 'baseline', 'mock'];
        const foundControl = groups.find(g => controlNames.some(c => g.toLowerCase().includes(c)));
        setControlGroup(foundControl || groups[0]);
      }
      
      toast.success(`Loaded ${parsedData.length} qPCR measurements for ${genes.length} genes and ${groups.length} groups`);
    } catch (error) {
      toast.error('Error parsing data. Please check format.');
    }
  };

  const calculateAnalysis = () => {
    if (data.length === 0 || !referenceGene || !controlGroup) {
      toast.error('Please load data and select reference gene and control group');
      return;
    }

    const analysisResults: AnalysisResult[] = [];

    // Group data by sample and gene
    const groupedData = data.reduce((acc, d) => {
      const key = `${d.sample}_${d.gene}`;
      if (!acc[key]) acc[key] = [];
      acc[key].push(d);
      return acc;
    }, {} as Record<string, QPCRData[]>);

    // Calculate mean Ct for each sample-gene combination
    const meanCtData = Object.entries(groupedData).map(([key, values]) => {
      const meanCt = values.reduce((sum, v) => sum + v.ct, 0) / values.length;
      return {
        sample: values[0].sample,
        gene: values[0].gene,
        group: values[0].group,
        ct: meanCt
      };
    });

    // Calculate ΔCt for each sample
    const samples = [...new Set(meanCtData.map(d => d.sample))];
    
    samples.forEach(sample => {
      const sampleData = meanCtData.filter(d => d.sample === sample);
      const referenceCtData = sampleData.find(d => d.gene === referenceGene);
      
      if (!referenceCtData) return;
      
      sampleData.forEach(d => {
        if (d.gene !== referenceGene) {
          const deltaCt = d.ct - referenceCtData.ct;
          
          // Find control group mean ΔCt for this gene
          const controlSamples = meanCtData.filter(cd => cd.group === controlGroup && cd.gene === d.gene);
          const controlRefSamples = meanCtData.filter(cd => cd.group === controlGroup && cd.gene === referenceGene);
          
          let controlMeanDeltaCt = 0;
          if (controlSamples.length > 0 && controlRefSamples.length > 0) {
            const controlMeanCt = controlSamples.reduce((sum, cs) => sum + cs.ct, 0) / controlSamples.length;
            const controlRefMeanCt = controlRefSamples.reduce((sum, cs) => sum + cs.ct, 0) / controlRefSamples.length;
            controlMeanDeltaCt = controlMeanCt - controlRefMeanCt;
          }
          
          const deltaDeltaCt = deltaCt - controlMeanDeltaCt;
          const rq = Math.pow(2, -deltaDeltaCt);
          const foldChange = d.group === controlGroup ? 1 : rq;
          
          analysisResults.push({
            sample: d.sample,
            gene: d.gene,
            group: d.group,
            ct: d.ct,
            deltaCt,
            deltaDeltaCt,
            rq,
            foldChange
          });
        }
      });
    });

    setResults(analysisResults);
    toast.success(`Analysis completed for ${analysisResults.length} measurements`);
  };

  const generatePlot = () => {
    if (results.length === 0) {
      toast.error('Please run analysis first');
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
    const margin = { top: 50, right: 50, bottom: 100, left: 80 };
    const plotWidth = 800 - margin.left - margin.right;
    const plotHeight = 600 - margin.top - margin.bottom;

    // Group results by gene and group for plotting
    const genes = [...new Set(results.map(r => r.gene))];
    const groups = [...new Set(results.map(r => r.group))];
    
    // Calculate group means and standard errors
    const groupStats = genes.map(gene => {
      return groups.map(group => {
        const groupData = results.filter(r => r.gene === gene && r.group === group);
        if (groupData.length === 0) return null;
        
        const values = groupData.map(d => settings.logScale ? Math.log2(d.foldChange) : d.foldChange);
        const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
        const std = Math.sqrt(values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length);
        const sem = std / Math.sqrt(values.length);
        
        return {
          gene,
          group,
          mean,
          sem,
          n: values.length
        };
      }).filter(Boolean);
    }).flat().filter(Boolean);

    // Calculate scales
    const allValues = groupStats.map(s => s!.mean);
    const yMin = Math.min(...allValues, 0);
    const yMax = Math.max(...allValues);
    const yPadding = (yMax - yMin) * 0.1;

    const yScale = (y: number) => margin.top + plotHeight - ((y - yMin + yPadding) / (yMax - yMin + 2 * yPadding)) * plotHeight;

    // Colors for groups
    const colors = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];

    // Draw axes
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(margin.left, margin.top + plotHeight);
    ctx.lineTo(margin.left + plotWidth, margin.top + plotHeight);
    ctx.moveTo(margin.left, margin.top);
    ctx.lineTo(margin.left, margin.top + plotHeight);
    ctx.stroke();

    // Draw reference line at y=1 (or y=0 for log scale)
    const refValue = settings.logScale ? 0 : 1;
    ctx.strokeStyle = '#ddd';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(margin.left, yScale(refValue));
    ctx.lineTo(margin.left + plotWidth, yScale(refValue));
    ctx.stroke();
    ctx.setLineDash([]);

    // Calculate bar positions
    const barWidth = plotWidth / (genes.length * groups.length + genes.length + 1);
    const groupSpacing = plotWidth / genes.length;

    // Draw bars
    genes.forEach((gene, geneIdx) => {
      groups.forEach((group, groupIdx) => {
        const stat = groupStats.find(s => s!.gene === gene && s!.group === group);
        if (!stat) return;

        const barX = margin.left + geneIdx * groupSpacing + groupIdx * barWidth + barWidth * 0.1;
        const barHeight = Math.abs(yScale(stat.mean) - yScale(0));
        const barY = stat.mean >= 0 ? yScale(stat.mean) : yScale(0);

        // Draw bar
        ctx.fillStyle = colors[groupIdx % colors.length] + '80';
        ctx.strokeStyle = colors[groupIdx % colors.length];
        ctx.lineWidth = 2;
        ctx.fillRect(barX, barY, barWidth * 0.8, barHeight);
        ctx.strokeRect(barX, barY, barWidth * 0.8, barHeight);

        // Draw error bars if enabled
        if (settings.errorBars) {
          const errorTop = yScale(stat.mean + stat.sem);
          const errorBottom = yScale(stat.mean - stat.sem);
          const centerX = barX + barWidth * 0.4;

          ctx.strokeStyle = '#000';
          ctx.lineWidth = 1;
          ctx.beginPath();
          // Vertical line
          ctx.moveTo(centerX, errorTop);
          ctx.lineTo(centerX, errorBottom);
          // Top cap
          ctx.moveTo(centerX - 5, errorTop);
          ctx.lineTo(centerX + 5, errorTop);
          // Bottom cap
          ctx.moveTo(centerX - 5, errorBottom);
          ctx.lineTo(centerX + 5, errorBottom);
          ctx.stroke();
        }
      });
    });

    // Add gene labels
    ctx.fillStyle = '#000';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    genes.forEach((gene, idx) => {
      const x = margin.left + idx * groupSpacing + groupSpacing / 2;
      ctx.fillText(gene, x, 580);
    });

    // Add axis labels
    ctx.font = '14px Arial';
    ctx.fillText('Genes', 400, 595);
    
    ctx.save();
    ctx.translate(20, 300);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(settings.logScale ? 'log2(Fold Change)' : 'Fold Change (RQ)', 0, 0);
    ctx.restore();

    // Add legend
    groups.forEach((group, idx) => {
      const legendX = 650;
      const legendY = 50 + idx * 25;
      
      ctx.fillStyle = colors[idx % colors.length];
      ctx.fillRect(legendX, legendY, 15, 15);
      
      ctx.fillStyle = '#000';
      ctx.font = '12px Arial';
      ctx.textAlign = 'left';
      ctx.fillText(group, legendX + 20, legendY + 12);
    });

    setPlotGenerated(true);
    toast.success('qPCR analysis plot generated successfully!');
  };

  const downloadResults = () => {
    if (results.length === 0) return;
    
    const csv = [
      'sample,gene,group,ct,deltaCt,deltaDeltaCt,rq,foldChange',
      ...results.map(r => 
        `${r.sample},${r.gene},${r.group},${r.ct.toFixed(3)},${r.deltaCt.toFixed(3)},${r.deltaDeltaCt.toFixed(3)},${r.rq.toFixed(3)},${r.foldChange.toFixed(3)}`
      )
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'qpcr_analysis_results.csv';
    link.click();
    
    toast.success('Analysis results downloaded');
  };

  const downloadPlot = (format: 'png' | 'jpeg', dpi: number = 300) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Create high DPI version
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;

    const scaleFactor = dpi / 72;
    tempCanvas.width = canvas.width * scaleFactor;
    tempCanvas.height = canvas.height * scaleFactor;
    tempCtx.imageSmoothingEnabled = true;
    tempCtx.imageSmoothingQuality = 'high';
    tempCtx.fillStyle = '#ffffff';
    tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
    tempCtx.drawImage(canvas, 0, 0, tempCanvas.width, tempCanvas.height);

    const link = document.createElement('a');
    link.download = `qpcr_plot_${dpi}dpi.${format}`;
    link.href = tempCanvas.toDataURL(`image/${format}`);
    link.click();
    
    toast.success(`Plot downloaded as ${format.toUpperCase()} at ${dpi} DPI`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Navigation />
      
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <div className="w-16 h-16 mx-auto mb-4 bg-blue-600 rounded-full flex items-center justify-center">
            <Activity className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">qPCR Analysis Tool</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Perform ΔCt, ΔΔCt, and relative quantification (RQ) analysis for qPCR data with statistical visualization and publication-ready plots.
          </p>
        </div>

        <Tabs defaultValue="data" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="data">Data Input</TabsTrigger>
            <TabsTrigger value="analysis">Analysis</TabsTrigger>
            <TabsTrigger value="plot">Visualization</TabsTrigger>
          </TabsList>

          <TabsContent value="data">
            <Card className="border-0 shadow-xl bg-white/90 backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Upload className="h-5 w-5 mr-2 text-blue-600" />
                  Data Input
                </CardTitle>
                <CardDescription>
                  Upload qPCR data with columns: sample, gene, ct, group
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="data-input">Paste your qPCR data (CSV or JSON format)</Label>
                  <Textarea
                    id="data-input"
                    placeholder="sample,gene,ct,group&#10;S1,GAPDH,18.5,Control&#10;S1,GENE1,22.3,Control&#10;S2,GAPDH,18.7,Treatment&#10;S2,GENE1,20.1,Treatment&#10;..."
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
                  <div className="space-y-4">
                    <div className="p-4 bg-green-50 rounded-lg">
                      <p className="text-green-800 font-medium">
                        ✅ Loaded {data.length} qPCR measurements
                      </p>
                      <p className="text-sm text-green-600 mt-1">
                        {availableGenes.length} genes, {availableGroups.length} groups
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Reference Gene (Housekeeping)</Label>
                        <Select value={referenceGene} onValueChange={setReferenceGene}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select reference gene" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableGenes.map(gene => (
                              <SelectItem key={gene} value={gene}>{gene}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label>Control Group</Label>
                        <Select value={controlGroup} onValueChange={setControlGroup}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select control group" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableGroups.map(group => (
                              <SelectItem key={group} value={group}>{group}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analysis">
            <Card className="border-0 shadow-xl bg-white/90 backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calculator className="h-5 w-5 mr-2 text-purple-600" />
                  qPCR Analysis
                </CardTitle>
                <CardDescription>
                  Configure analysis parameters and run calculations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Analysis Method</Label>
                  <Select value={settings.method} onValueChange={(value) => setSettings({...settings, method: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="deltadeltact">ΔΔCt Method (Relative Quantification)</SelectItem>
                      <SelectItem value="deltact">ΔCt Method (Normalized Expression)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={settings.errorBars}
                      onCheckedChange={(checked) => setSettings({...settings, errorBars: checked})}
                    />
                    <Label>Show error bars (SEM)</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={settings.logScale}
                      onCheckedChange={(checked) => setSettings({...settings, logScale: checked})}
                    />
                    <Label>Log2 scale for fold change</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={settings.showStats}
                      onCheckedChange={(checked) => setSettings({...settings, showStats: checked})}
                    />
                    <Label>Show statistical summary</Label>
                  </div>
                </div>

                <Button 
                  onClick={calculateAnalysis} 
                  className="w-full bg-purple-600 hover:bg-purple-700"
                  disabled={data.length === 0 || !referenceGene || !controlGroup}
                >
                  <Calculator className="h-4 w-4 mr-2" />
                  Run Analysis
                </Button>

                {results.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold mb-4">Analysis Results Preview</h3>
                    <div className="overflow-x-auto">
                      <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-2 text-left">Sample</th>
                            <th className="px-4 py-2 text-left">Gene</th>
                            <th className="px-4 py-2 text-left">Group</th>
                            <th className="px-4 py-2 text-left">Ct</th>
                            <th className="px-4 py-2 text-left">ΔCt</th>
                            <th className="px-4 py-2 text-left">ΔΔCt</th>
                            <th className="px-4 py-2 text-left">RQ</th>
                            <th className="px-4 py-2 text-left">Fold Change</th>
                          </tr>
                        </thead>
                        <tbody>
                          {results.slice(0, 10).map((result, idx) => (
                            <tr key={idx} className="border-t">
                              <td className="px-4 py-2">{result.sample}</td>
                              <td className="px-4 py-2 font-medium">{result.gene}</td>
                              <td className="px-4 py-2">{result.group}</td>
                              <td className="px-4 py-2">{result.ct.toFixed(2)}</td>
                              <td className="px-4 py-2">{result.deltaCt.toFixed(2)}</td>
                              <td className="px-4 py-2">{result.deltaDeltaCt.toFixed(2)}</td>
                              <td className="px-4 py-2">{result.rq.toFixed(3)}</td>
                              <td className="px-4 py-2">{result.foldChange.toFixed(3)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {results.length > 10 && (
                        <p className="text-sm text-gray-500 mt-2 text-center">
                          Showing first 10 of {results.length} results
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="plot">
            <Card className="border-0 shadow-xl bg-white/90 backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2 text-green-600" />
                  Visualization
                </CardTitle>
                <CardDescription>
                  {plotGenerated ? 'Your qPCR analysis plot is ready' : 'Generate plot to see visualization'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  onClick={generatePlot} 
                  className="w-full bg-green-600 hover:bg-green-700"
                  disabled={results.length === 0}
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Generate Plot
                </Button>
                
                <div className="flex justify-center">
                  <canvas
                    ref={canvasRef}
                    className="border border-gray-200 rounded-lg max-w-full"
                    style={{ maxHeight: '600px' }}
                  />
                </div>

                {results.length > 0 && (
                  <div className="space-y-3 pt-4 border-t">
                    <h4 className="font-semibold text-sm text-gray-700">Download</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <Button onClick={() => downloadPlot('png', 300)} variant="outline" size="sm" disabled={!plotGenerated}>
                        PNG (300 DPI)
                      </Button>
                      <Button onClick={() => downloadPlot('jpeg', 300)} variant="outline" size="sm" disabled={!plotGenerated}>
                        JPEG (300 DPI)
                      </Button>
                    </div>
                    <Button onClick={downloadResults} variant="outline" size="sm" className="w-full">
                      <Download className="h-4 w-4 mr-2" />
                      Download Results CSV
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}