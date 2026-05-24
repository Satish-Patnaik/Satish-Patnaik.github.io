import { useState } from 'react';
import Navigation from '@/components/Navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ErrorBar } from 'recharts';
import { Calculator, Upload, Download, RefreshCw, TrendingUp, FileText, BarChart3, AlertTriangle, Info, FileDown, Image, Palette } from 'lucide-react';
import { toast } from 'sonner';

interface PCRData {
  sample: string;
  group: string;
  gene: string;
  ct: number;
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

interface StatisticalSummary {
  gene: string;
  group: string;
  n: number;
  meanFoldChange: number;
  stdDev: number;
  stdError: number;
  meanDeltaCt: number;
  meanDeltaDeltaCt: number;
}

interface ValidationWarning {
  type: 'missing_reference' | 'missing_data' | 'inconsistent_groups';
  message: string;
  samples?: string[];
}

interface ChartDataItem {
  name: string;
  gene: string;
  group: string;
  meanFoldChange: number;
  stdError: number;
  n: number;
  fill: string;
}

interface GroupColor {
  group: string;
  color: string;
}

export default function RealTimePCR() {
  const [rawData, setRawData] = useState<PCRData[]>([]);
  const [results, setResults] = useState<AnalysisResult[]>([]);
  const [statistics, setStatistics] = useState<StatisticalSummary[]>([]);
  const [referenceGene, setReferenceGene] = useState('');
  const [controlGroup, setControlGroup] = useState('');
  const [csvInput, setCsvInput] = useState('');
  const [warnings, setWarnings] = useState<ValidationWarning[]>([]);
  const [showRawCtPlot, setShowRawCtPlot] = useState(false);
  const [groupColors, setGroupColors] = useState<GroupColor[]>([]);

  // Common housekeeping genes for auto-detection
  const commonHousekeepingGenes = [
    'GAPDH', 'ACTB', '18S', 'HPRT1', 'TBP', 'YWHAZ', 'B2M', 'RPLP0', 'GUSB', 'TFRC'
  ];

  // Predefined color palette
  const colorPalette = [
    '#3b82f6', // Blue
    '#ef4444', // Red
    '#10b981', // Green
    '#f59e0b', // Yellow
    '#8b5cf6', // Purple
    '#06b6d4', // Cyan
    '#f97316', // Orange
    '#84cc16', // Lime
    '#ec4899', // Pink
    '#6b7280', // Gray
    '#14b8a6', // Teal
    '#f43f5e'  // Rose
  ];

  const downloadTemplate = () => {
    const templateContent = `Sample,Group,Gene,Ct
Sample_1,Control,GAPDH,18.5
Sample_1,Control,IL6,25.2
Sample_1,Control,TNF,24.8
Sample_2,Control,GAPDH,18.7
Sample_2,Control,IL6,25.5
Sample_2,Control,TNF,24.9
Sample_3,Treatment,GAPDH,18.6
Sample_3,Treatment,IL6,22.1
Sample_3,Treatment,TNF,21.5
Sample_4,Treatment,GAPDH,18.9
Sample_4,Treatment,IL6,22.3
Sample_4,Treatment,TNF,21.8`;

    const blob = new Blob([templateContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'qpcr_template.csv';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Template downloaded successfully');
  };

  const autoDetectSettings = (data: PCRData[]) => {
    const genes = [...new Set(data.map(d => d.gene))];
    const groups = [...new Set(data.map(d => d.group))];

    // Auto-detect housekeeping gene
    const detectedHousekeeping = genes.find(gene => 
      commonHousekeepingGenes.includes(gene.toUpperCase())
    );
    if (detectedHousekeeping) {
      setReferenceGene(detectedHousekeeping);
    } else if (genes.length > 0) {
      setReferenceGene(genes[0]); // Default to first gene if no housekeeping found
    }

    // Auto-detect control group
    const detectedControl = groups.find(group => 
      group.toLowerCase().includes('control') || 
      group.toLowerCase().includes('ctrl') ||
      group.toLowerCase().includes('baseline')
    );
    if (detectedControl) {
      setControlGroup(detectedControl);
    } else if (groups.length > 0) {
      setControlGroup(groups[0]); // Default to first group
    }

    // Initialize group colors
    const initialColors: GroupColor[] = groups.map((group, index) => ({
      group,
      color: colorPalette[index % colorPalette.length]
    }));
    setGroupColors(initialColors);
  };

  const updateGroupColor = (group: string, color: string) => {
    setGroupColors(prev => 
      prev.map(gc => gc.group === group ? { ...gc, color } : gc)
    );
  };

  const getGroupColor = (group: string): string => {
    const groupColor = groupColors.find(gc => gc.group === group);
    return groupColor?.color || '#3b82f6';
  };

  const validateData = (data: PCRData[]): ValidationWarning[] => {
    const warnings: ValidationWarning[] = [];
    const samples = [...new Set(data.map(d => d.sample))];
    const genes = [...new Set(data.map(d => d.gene))];
    const groups = [...new Set(data.map(d => d.group))];

    // Check if reference gene exists for all samples
    const samplesWithoutRef: string[] = [];
    samples.forEach(sample => {
      const hasRef = data.some(d => d.sample === sample && d.gene === referenceGene);
      if (!hasRef) {
        samplesWithoutRef.push(sample);
      }
    });

    if (samplesWithoutRef.length > 0) {
      warnings.push({
        type: 'missing_reference',
        message: `Reference gene "${referenceGene}" missing in samples: ${samplesWithoutRef.join(', ')}`,
        samples: samplesWithoutRef
      });
    }

    // Check if control group exists
    if (!groups.includes(controlGroup)) {
      warnings.push({
        type: 'inconsistent_groups',
        message: `Control group "${controlGroup}" not found in data. Available groups: ${groups.join(', ')}`
      });
    }

    return warnings;
  };

  const parseCsvData = () => {
    if (!csvInput.trim()) {
      toast.error('Please enter CSV data');
      return;
    }

    try {
      const lines = csvInput.trim().split('\n');
      const headers = lines[0].toLowerCase().split(',').map(h => h.trim());
      
      const sampleIndex = headers.findIndex(h => h.includes('sample'));
      const groupIndex = headers.findIndex(h => h.includes('group') || h.includes('condition') || h.includes('treatment'));
      const geneIndex = headers.findIndex(h => h.includes('gene') || h.includes('target'));
      const ctIndex = headers.findIndex(h => h.includes('ct') || h.includes('cq'));

      if (sampleIndex === -1 || geneIndex === -1 || ctIndex === -1 || groupIndex === -1) {
        toast.error('CSV must contain columns: Sample, Group, Gene, Ct');
        return;
      }

      const parsedData: PCRData[] = [];
      
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        if (values.length >= 4) {
          const ct = parseFloat(values[ctIndex]);
          if (!isNaN(ct)) {
            parsedData.push({
              sample: values[sampleIndex],
              group: values[groupIndex],
              gene: values[geneIndex],
              ct: ct
            });
          }
        }
      }

      setRawData(parsedData);
      setCsvInput('');
      
      // Auto-detect settings
      autoDetectSettings(parsedData);
      
      toast.success(`Parsed ${parsedData.length} data points successfully`);
    } catch (error) {
      toast.error('Error parsing CSV data. Please check the format.');
    }
  };

  const calculateAnalysis = () => {
    if (rawData.length === 0) {
      toast.error('Please add PCR data first');
      return;
    }

    if (!referenceGene || !controlGroup) {
      toast.error('Please select reference gene and control group');
      return;
    }

    try {
      const analysisResults: AnalysisResult[] = [];
      const samples = [...new Set(rawData.map(d => d.sample))];
      const genes = [...new Set(rawData.map(d => d.gene))].filter(g => g !== referenceGene);
      
      // Calculate control group mean ΔCt for each gene
      const controlMeanDeltaCt: { [gene: string]: number } = {};
      
      for (const gene of genes) {
        const controlSamples = samples.filter(s => {
          const sampleGroup = rawData.find(d => d.sample === s)?.group;
          return sampleGroup === controlGroup;
        });
        
        let controlDeltaCtSum = 0;
        let controlCount = 0;
        
        for (const sample of controlSamples) {
          const targetData = rawData.filter(d => d.sample === sample && d.gene === gene);
          const refData = rawData.filter(d => d.sample === sample && d.gene === referenceGene);
          
          if (targetData.length > 0 && refData.length > 0) {
            const targetCt = targetData.reduce((sum, d) => sum + d.ct, 0) / targetData.length;
            const refCt = refData.reduce((sum, d) => sum + d.ct, 0) / refData.length;
            controlDeltaCtSum += (targetCt - refCt);
            controlCount++;
          }
        }
        
        controlMeanDeltaCt[gene] = controlCount > 0 ? controlDeltaCtSum / controlCount : 0;
      }

      // Process each sample and gene combination
      for (const sample of samples) {
        for (const gene of genes) {
          const targetData = rawData.filter(d => d.sample === sample && d.gene === gene);
          const refData = rawData.filter(d => d.sample === sample && d.gene === referenceGene);
          
          if (targetData.length > 0 && refData.length > 0) {
            const targetCt = targetData.reduce((sum, d) => sum + d.ct, 0) / targetData.length;
            const refCt = refData.reduce((sum, d) => sum + d.ct, 0) / refData.length;
            const group = targetData[0].group;
            
            // Calculate ΔCt = Ct(target) - Ct(reference)
            const deltaCt = targetCt - refCt;
            
            // Calculate ΔΔCt = ΔCt(sample) - ΔCt(control mean)
            const deltaDeltaCt = deltaCt - controlMeanDeltaCt[gene];
            
            // Calculate RQ = 2^(-ΔΔCt)
            const rq = Math.pow(2, -deltaDeltaCt);
            const foldChange = rq;
            
            analysisResults.push({
              sample,
              gene,
              group,
              ct: targetCt,
              deltaCt,
              deltaDeltaCt,
              rq,
              foldChange
            });
          }
        }
      }

      // Calculate statistics
      const statisticalResults: StatisticalSummary[] = [];
      const groups = [...new Set(analysisResults.map(r => r.group))];
      
      for (const gene of genes) {
        for (const group of groups) {
          const groupResults = analysisResults.filter(r => r.gene === gene && r.group === group);
          
          if (groupResults.length > 0) {
            const foldChanges = groupResults.map(r => r.foldChange);
            const deltaCts = groupResults.map(r => r.deltaCt);
            const deltaDeltaCts = groupResults.map(r => r.deltaDeltaCt);
            
            const meanFoldChange = foldChanges.reduce((sum, val) => sum + val, 0) / foldChanges.length;
            const meanDeltaCt = deltaCts.reduce((sum, val) => sum + val, 0) / deltaCts.length;
            const meanDeltaDeltaCt = deltaDeltaCts.reduce((sum, val) => sum + val, 0) / deltaDeltaCts.length;
            
            // Calculate standard deviation
            const variance = foldChanges.reduce((sum, val) => sum + Math.pow(val - meanFoldChange, 2), 0) / foldChanges.length;
            const stdDev = Math.sqrt(variance);
            const stdError = stdDev / Math.sqrt(foldChanges.length);
            
            statisticalResults.push({
              gene,
              group,
              n: foldChanges.length,
              meanFoldChange,
              stdDev,
              stdError,
              meanDeltaCt,
              meanDeltaDeltaCt
            });
          }
        }
      }

      setResults(analysisResults);
      setStatistics(statisticalResults);
      
      // Validate data after calculation
      const validationWarnings = validateData(rawData);
      setWarnings(validationWarnings);
      
      toast.success('Analysis completed successfully');
    } catch (error) {
      toast.error('Error during analysis. Please check your data.');
    }
  };

  const clearData = () => {
    setRawData([]);
    setResults([]);
    setStatistics([]);
    setCsvInput('');
    setWarnings([]);
    setReferenceGene('');
    setControlGroup('');
    setGroupColors([]);
    toast.success('All data cleared');
  };

  const exportResults = () => {
    if (statistics.length === 0) {
      toast.error('No results to export');
      return;
    }

    const csvContent = [
      'Gene,Group,N,Mean_Fold_Change,Std_Dev,Std_Error,Mean_Delta_Ct,Mean_Delta_Delta_Ct',
      ...statistics.map(s => 
        `${s.gene},${s.group},${s.n},${s.meanFoldChange.toFixed(3)},${s.stdDev.toFixed(3)},${s.stdError.toFixed(3)},${s.meanDeltaCt.toFixed(3)},${s.meanDeltaDeltaCt.toFixed(3)}`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'qpcr_statistical_results.csv';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Statistical results exported successfully');
  };

  const exportChart = (format: 'png' | 'jpeg' | 'pdf') => {
    toast.info(`Chart export as ${format.toUpperCase()} will be implemented with additional libraries`);
  };

  // Prepare chart data with statistics and custom colors
  const chartData: ChartDataItem[] = statistics.map(stat => ({
    name: `${stat.gene} (${stat.group})`,
    gene: stat.gene,
    group: stat.group,
    meanFoldChange: stat.meanFoldChange,
    stdError: stat.stdError,
    n: stat.n,
    fill: getGroupColor(stat.group)
  }));

  const uniqueGenes = [...new Set(rawData.map(d => d.gene))];
  const uniqueGroups = [...new Set(rawData.map(d => d.group))];

  // Custom error bar component
  const CustomErrorBar = (props: any) => {
    const { payload, x, y, width, height } = props;
    if (!payload) return null;

    const centerX = x + width / 2;
    const errorBarHeight = payload.stdError * height / payload.meanFoldChange;
    const topY = y - errorBarHeight;
    const bottomY = y + height + errorBarHeight;

    return (
      <g>
        {/* Top cap */}
        <line
          x1={centerX - 4}
          y1={topY}
          x2={centerX + 4}
          y2={topY}
          stroke="#000"
          strokeWidth={1}
        />
        {/* Bottom cap */}
        <line
          x1={centerX - 4}
          y1={bottomY}
          x2={centerX + 4}
          y2={bottomY}
          stroke="#000"
          strokeWidth={1}
        />
        {/* Vertical line */}
        <line
          x1={centerX}
          y1={topY}
          x2={centerX}
          y2={bottomY}
          stroke="#000"
          strokeWidth={1}
        />
      </g>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Navigation />
      
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <Badge className="mb-4 bg-blue-100 text-blue-800 hover:bg-blue-200">
            Free Tool
          </Badge>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Real-Time PCR Analysis
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Comprehensive qPCR analysis with ΔCt, ΔΔCt, and fold change calculations. 
            Auto-detects housekeeping genes and control groups with statistical analysis.
          </p>
        </div>

        <Tabs defaultValue="data-input" className="space-y-8">
          <TabsList className="grid w-full grid-cols-3 max-w-xl mx-auto">
            <TabsTrigger value="data-input" className="flex items-center">
              <Upload className="h-4 w-4 mr-2" />
              Data Input
            </TabsTrigger>
            <TabsTrigger value="results" className="flex items-center">
              <FileText className="h-4 w-4 mr-2" />
              Results
            </TabsTrigger>
            <TabsTrigger value="visualization" className="flex items-center">
              <BarChart3 className="h-4 w-4 mr-2" />
              Charts
            </TabsTrigger>
          </TabsList>

          {/* Data Input Tab */}
          <TabsContent value="data-input">
            <div className="space-y-8">
              {/* Template Download */}
              <Card className="border-0 shadow-xl bg-white/90 backdrop-blur">
                <CardHeader>
                  <CardTitle className="flex items-center text-xl">
                    <FileDown className="h-5 w-5 mr-2 text-green-600" />
                    CSV Template
                  </CardTitle>
                  <CardDescription>
                    Download a template file to ensure correct data format
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="bg-blue-50 p-4 rounded-lg mb-4">
                    <h4 className="font-semibold text-blue-900 mb-2">Required CSV Format:</h4>
                    <div className="text-sm text-blue-800 font-mono bg-white p-2 rounded">
                      Sample,Group,Gene,Ct<br/>
                      Sample_1,Control,GAPDH,18.5<br/>
                      Sample_1,Control,IL6,25.2<br/>
                      Sample_2,Treatment,GAPDH,18.7<br/>
                      Sample_2,Treatment,IL6,22.1
                    </div>
                  </div>
                  <Button onClick={downloadTemplate} className="w-full bg-green-600 hover:bg-green-700">
                    <Download className="h-4 w-4 mr-2" />
                    Download CSV Template
                  </Button>
                </CardContent>
              </Card>

              {/* CSV Import */}
              <Card className="border-0 shadow-xl bg-white/90 backdrop-blur">
                <CardHeader>
                  <CardTitle className="flex items-center text-xl">
                    <Upload className="h-5 w-5 mr-2 text-blue-600" />
                    CSV Data Import
                  </CardTitle>
                  <CardDescription>
                    Paste your CSV data - housekeeping genes and control groups will be auto-detected
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    value={csvInput}
                    onChange={(e) => setCsvInput(e.target.value)}
                    placeholder="Sample,Group,Gene,Ct
Sample_1,Control,GAPDH,18.5
Sample_1,Control,IL6,25.2
Sample_2,Treatment,GAPDH,18.7
Sample_2,Treatment,IL6,22.1"
                    className="min-h-[200px] font-mono text-sm"
                  />
                  
                  <Button onClick={parseCsvData} className="w-full bg-blue-600 hover:bg-blue-700">
                    <Upload className="h-4 w-4 mr-2" />
                    Parse CSV Data
                  </Button>
                </CardContent>
              </Card>

              {/* Settings and Data Preview */}
              {rawData.length > 0 && (
                <Card className="border-0 shadow-xl bg-white/90 backdrop-blur">
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle>Data Preview & Settings ({rawData.length} points)</CardTitle>
                        <CardDescription>
                          Auto-detected settings - modify if needed
                        </CardDescription>
                      </div>
                      <Button onClick={clearData} variant="outline" size="sm">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Clear All
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Settings */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-blue-50 rounded-lg">
                      <div>
                        <Label htmlFor="reference-gene">Reference Gene (Housekeeping)</Label>
                        <Select value={referenceGene} onValueChange={setReferenceGene}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select reference gene" />
                          </SelectTrigger>
                          <SelectContent>
                            {uniqueGenes.map(gene => (
                              <SelectItem key={gene} value={gene}>
                                {gene} {commonHousekeepingGenes.includes(gene.toUpperCase()) && '(HK)'}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="control-group">Control Group (Baseline)</Label>
                        <Select value={controlGroup} onValueChange={setControlGroup}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select control group" />
                          </SelectTrigger>
                          <SelectContent>
                            {uniqueGroups.map(group => (
                              <SelectItem key={group} value={group}>
                                {group}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Group Color Customization */}
                    {groupColors.length > 0 && (
                      <Card className="bg-purple-50">
                        <CardHeader>
                          <CardTitle className="flex items-center text-lg">
                            <Palette className="h-5 w-5 mr-2 text-purple-600" />
                            Group Colors
                          </CardTitle>
                          <CardDescription>
                            Customize colors for each group in the fold change plot
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {groupColors.map((gc, index) => (
                              <div key={gc.group} className="flex items-center space-x-3">
                                <div 
                                  className="w-6 h-6 rounded border-2 border-gray-300"
                                  style={{ backgroundColor: gc.color }}
                                ></div>
                                <Label className="flex-1">{gc.group}</Label>
                                <Select 
                                  value={gc.color} 
                                  onValueChange={(color) => updateGroupColor(gc.group, color)}
                                >
                                  <SelectTrigger className="w-24">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {colorPalette.map((color, colorIndex) => (
                                      <SelectItem key={colorIndex} value={color}>
                                        <div className="flex items-center space-x-2">
                                          <div 
                                            className="w-4 h-4 rounded border"
                                            style={{ backgroundColor: color }}
                                          ></div>
                                          <span>{color}</span>
                                        </div>
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Warnings */}
                    {warnings.length > 0 && (
                      <div className="space-y-2">
                        {warnings.map((warning, index) => (
                          <Alert key={index} variant={warning.type === 'missing_reference' ? 'destructive' : 'default'}>
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>{warning.message}</AlertDescription>
                          </Alert>
                        ))}
                      </div>
                    )}

                    {/* Data Table */}
                    <div className="max-h-64 overflow-y-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Sample</TableHead>
                            <TableHead>Group</TableHead>
                            <TableHead>Gene</TableHead>
                            <TableHead>Ct</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {rawData.slice(0, 20).map((data, index) => (
                            <TableRow key={index} className={data.gene === referenceGene ? 'bg-yellow-50' : ''}>
                              <TableCell>{data.sample}</TableCell>
                              <TableCell>
                                <div className="flex items-center space-x-2">
                                  <div 
                                    className="w-3 h-3 rounded"
                                    style={{ backgroundColor: getGroupColor(data.group) }}
                                  ></div>
                                  <span>{data.group}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                {data.gene}
                                {data.gene === referenceGene && (
                                  <Badge variant="secondary" className="ml-2 text-xs">REF</Badge>
                                )}
                              </TableCell>
                              <TableCell>{data.ct.toFixed(2)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                      {rawData.length > 20 && (
                        <p className="text-sm text-gray-500 mt-2 text-center">
                          ... and {rawData.length - 20} more rows
                        </p>
                      )}
                    </div>

                    <div className="bg-green-50 p-4 rounded-lg">
                      <div className="flex items-start space-x-2">
                        <Info className="h-5 w-5 text-green-600 mt-0.5" />
                        <div>
                          <h4 className="font-semibold text-green-900 mb-1">Analysis Formulas</h4>
                          <div className="text-sm text-green-800 space-y-1">
                            <div><strong>ΔCt</strong> = Ct(target gene) - Ct(reference gene)</div>
                            <div><strong>ΔΔCt</strong> = ΔCt(sample) - ΔCt(control group mean)</div>
                            <div><strong>Fold Change</strong> = 2^(-ΔΔCt)</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <Button 
                      onClick={calculateAnalysis} 
                      className="w-full bg-purple-600 hover:bg-purple-700"
                      disabled={!referenceGene || !controlGroup || rawData.length === 0}
                    >
                      <TrendingUp className="h-4 w-4 mr-2" />
                      Run qPCR Analysis
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Results Tab */}
          <TabsContent value="results">
            {statistics.length === 0 ? (
              <Card className="border-0 shadow-xl bg-white/90 backdrop-blur">
                <CardContent className="text-center py-12">
                  <FileText className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Results Yet</h3>
                  <p className="text-gray-600">
                    Add PCR data and run analysis to see statistical results here.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-0 shadow-xl bg-white/90 backdrop-blur">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>Statistical Results</CardTitle>
                      <CardDescription>
                        Mean fold changes with standard deviation, standard error, and sample size
                      </CardDescription>
                    </div>
                    <Button onClick={exportResults} variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      Export CSV
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="max-h-96 overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Gene</TableHead>
                          <TableHead>Group</TableHead>
                          <TableHead>N</TableHead>
                          <TableHead>Mean Fold Change</TableHead>
                          <TableHead>Std Dev</TableHead>
                          <TableHead>Std Error</TableHead>
                          <TableHead>Mean ΔCt</TableHead>
                          <TableHead>Mean ΔΔCt</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {statistics.map((stat, index) => (
                          <TableRow key={index}>
                            <TableCell>{stat.gene}</TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <div 
                                  className="w-3 h-3 rounded"
                                  style={{ backgroundColor: getGroupColor(stat.group) }}
                                ></div>
                                <span>{stat.group}</span>
                                {stat.group === controlGroup && (
                                  <Badge variant="secondary" className="ml-2 text-xs">CTRL</Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>{stat.n}</TableCell>
                            <TableCell className={
                              stat.meanFoldChange > 1.5 ? 'text-red-600 font-semibold' : 
                              stat.meanFoldChange < 0.67 ? 'text-blue-600 font-semibold' : 
                              'text-gray-900'
                            }>
                              {stat.meanFoldChange.toFixed(3)}
                              {stat.meanFoldChange > 1.5 && <span className="ml-1">↑</span>}
                              {stat.meanFoldChange < 0.67 && <span className="ml-1">↓</span>}
                            </TableCell>
                            <TableCell>{stat.stdDev.toFixed(3)}</TableCell>
                            <TableCell>{stat.stdError.toFixed(3)}</TableCell>
                            <TableCell>{stat.meanDeltaCt.toFixed(3)}</TableCell>
                            <TableCell>{stat.meanDeltaDeltaCt.toFixed(3)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Visualization Tab */}
          <TabsContent value="visualization">
            {statistics.length === 0 ? (
              <Card className="border-0 shadow-xl bg-white/90 backdrop-blur">
                <CardContent className="text-center py-12">
                  <BarChart3 className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Data to Visualize</h3>
                  <p className="text-gray-600">
                    Run analysis first to generate charts and visualizations.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-8">
                {/* Chart Export Options */}
                <Card className="border-0 shadow-xl bg-white/90 backdrop-blur">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Image className="h-5 w-5 mr-2 text-purple-600" />
                      Export Charts (300 DPI)
                    </CardTitle>
                    <CardDescription>
                      Download publication-ready charts in various formats
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex space-x-2">
                      <Button onClick={() => exportChart('png')} variant="outline" size="sm">
                        Export PNG
                      </Button>
                      <Button onClick={() => exportChart('jpeg')} variant="outline" size="sm">
                        Export JPEG
                      </Button>
                      <Button onClick={() => exportChart('pdf')} variant="outline" size="sm">
                        Export PDF
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Fold Change Chart with Error Bars */}
                <Card className="border-0 shadow-xl bg-white/90 backdrop-blur">
                  <CardHeader>
                    <CardTitle>Fold Change Analysis with Error Bars</CardTitle>
                    <CardDescription>
                      Mean fold changes ± standard error, with custom group colors
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-96">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="name" 
                            angle={-45}
                            textAnchor="end"
                            height={100}
                          />
                          <YAxis 
                            label={{ value: 'Fold Change', angle: -90, position: 'insideLeft' }}
                          />
                          <Tooltip 
                            formatter={(value: number, name: string, props: any) => [
                              `${value.toFixed(3)} ± ${props.payload.stdError.toFixed(3)}`,
                              `Mean Fold Change (n=${props.payload.n})`
                            ]}
                            labelFormatter={(label) => label}
                          />
                          <Legend />
                          <Bar 
                            dataKey="meanFoldChange" 
                            name="Mean Fold Change"
                          >
                            <ErrorBar dataKey="stdError" width={4} stroke="#000" />
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    
                    <div className="mt-4 text-sm text-gray-600 bg-gray-50 p-3 rounded">
                      <p><strong>Group Colors:</strong></p>
                      <div className="flex flex-wrap items-center gap-4 mt-2">
                        {groupColors.map((gc, index) => (
                          <div key={index} className="flex items-center space-x-2">
                            <div 
                              className="w-4 h-4 rounded border"
                              style={{ backgroundColor: gc.color }}
                            ></div>
                            <span>{gc.group}</span>
                            {gc.group === controlGroup && (
                              <Badge variant="secondary" className="text-xs">CTRL</Badge>
                            )}
                          </div>
                        ))}
                      </div>
                      <p className="mt-2"><strong>Interpretation:</strong> Fold Change &gt; 1 = upregulation, &lt; 1 = downregulation. Error bars show ± standard error.</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

    </div>
  );
}