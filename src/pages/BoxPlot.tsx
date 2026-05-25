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
import { BarChart3, Upload, Settings, Palette, Plus, Trash2, Database } from 'lucide-react';
import { toast } from 'sonner';

interface ExpressionData {
  sample: string;
  group: string;
  gene: string;
  value: number;
}

interface GroupStats {
  group: string;
  n: number;
  median: number;
  q1: number;
  q3: number;
  min: number;
  max: number;
  mean: number;
}

interface GroupColor {
  group: string;
  color: string;
}

export default function BoxPlot() {
  const [data, setData] = useState<ExpressionData[]>([]);
  const [rawInput, setRawInput] = useState('');
  const [selectedGenes, setSelectedGenes] = useState<string[]>([]);
  const [availableGenes, setAvailableGenes] = useState<string[]>([]);
  const [availableGroups, setAvailableGroups] = useState<string[]>([]);
  const [plotSettings, setPlotSettings] = useState({
    showPoints: true,
    showMean: false,
    logScale: false,
    showOutliers: true,
    statisticalTest: 'auto',
    plotType: 'box' as 'box' | 'violin'
  });
  const [colorPalette, setColorPalette] = useState('default');
  const [customColors, setCustomColors] = useState<string[]>(['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6']);
  const [groupColors, setGroupColors] = useState<GroupColor[]>([]);
  const [plotGenerated, setPlotGenerated] = useState(false);
  const [stats, setStats] = useState<GroupStats[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const colorPalettes = {
    default: ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'],
    viridis: ['#440154', '#482777', '#3F4A8A', '#31678E', '#26838F', '#1F9D8A', '#6CCE5A', '#B6DE2B'],
    plasma: ['#0D0887', '#5B02A3', '#9A179B', '#CB4678', '#EB7852', '#FBB32F', '#F0F921'],
    warm: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'],
    cool: ['#74B9FF', '#0984E3', '#00B894', '#00CEC9', '#6C5CE7', '#A29BFE', '#FD79A8']
  };

  const loadDemoData = async () => {
    try {
      const response = await fetch('/data/boxplot_demo.csv');
      const csvText = await response.text();
      setRawInput(csvText);
      toast.success('Demo data loaded! Click "Parse Data" to process it.');
    } catch (error) {
      toast.error('Failed to load demo data');
    }
  };

  const parseData = () => {
    try {
      let parsedData: ExpressionData[] = [];
      
      if (rawInput.trim().startsWith('[') || rawInput.trim().startsWith('{')) {
        // JSON format
        const jsonData = JSON.parse(rawInput);
        parsedData = Array.isArray(jsonData) ? jsonData : [jsonData];
      } else {
        // CSV format
        const lines = rawInput.trim().split('\n');
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        
        const sampleIdx = headers.findIndex(h => h.includes('sample'));
        const groupIdx = headers.findIndex(h => h.includes('group'));
        const geneIdx = headers.findIndex(h => h.includes('gene'));
        const valueIdx = headers.findIndex(h => h.includes('value') || h.includes('expression'));
        
        if (sampleIdx === -1 || groupIdx === -1 || valueIdx === -1) {
          // Try simplified format with just Group, Value, Sample
          const groupIdx2 = headers.findIndex(h => h.includes('group'));
          const valueIdx2 = headers.findIndex(h => h.includes('value'));
          const sampleIdx2 = headers.findIndex(h => h.includes('sample'));
          
          if (groupIdx2 !== -1 && valueIdx2 !== -1 && sampleIdx2 !== -1) {
            for (let i = 1; i < lines.length; i++) {
              const values = lines[i].split(',');
              if (values.length >= 3) {
                parsedData.push({
                  sample: values[sampleIdx2].trim(),
                  group: values[groupIdx2].trim(),
                  gene: 'Expression', // Default gene name
                  value: parseFloat(values[valueIdx2])
                });
              }
            }
          } else {
            throw new Error('Required columns not found. Need: group, value, sample (or sample, group, gene, value)');
          }
        } else {
          for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',');
            if (values.length >= 3) {
              parsedData.push({
                sample: values[sampleIdx].trim(),
                group: values[groupIdx].trim(),
                gene: geneIdx !== -1 ? values[geneIdx].trim() : 'Expression',
                value: parseFloat(values[valueIdx])
              });
            }
          }
        }
      }
      
      setData(parsedData);
      
      // Extract unique genes and groups
      const genes = [...new Set(parsedData.map(d => d.gene))];
      const groups = [...new Set(parsedData.map(d => d.group))];
      
      setAvailableGenes(genes);
      setAvailableGroups(groups);
      setSelectedGenes(genes.slice(0, 1)); // Select first gene by default
      
      // Initialize group colors with default palette
      const defaultPalette = colorPalettes.default;
      const initialGroupColors = groups.map((group, index) => ({
        group,
        color: defaultPalette[index % defaultPalette.length]
      }));
      setGroupColors(initialGroupColors);
      
      toast.success(`Loaded ${parsedData.length} data points for ${genes.length} genes and ${groups.length} groups`);
    } catch (error) {
      toast.error('Error parsing data. Please check format.');
    }
  };

  const updateGroupColor = (groupName: string, newColor: string) => {
    setGroupColors(prev => 
      prev.map(gc => gc.group === groupName ? { ...gc, color: newColor } : gc)
    );
  };

  const addCustomColor = () => {
    setCustomColors([...customColors, '#000000']);
  };

  const removeCustomColor = (index: number) => {
    if (customColors.length > 1) {
      setCustomColors(customColors.filter((_, i) => i !== index));
    }
  };

  const applyPaletteToGroups = (palette: string) => {
    const colors = palette === 'custom' ? customColors : colorPalettes[palette as keyof typeof colorPalettes];
    const updatedGroupColors = groupColors.map((gc, index) => ({
      ...gc,
      color: colors[index % colors.length]
    }));
    setGroupColors(updatedGroupColors);
  };

  const calculateStats = (geneData: ExpressionData[]): GroupStats[] => {
    const groupedData = availableGroups.map(group => {
      const groupValues = geneData
        .filter(d => d.group === group)
        .map(d => d.value)
        .sort((a, b) => a - b);
      
      if (groupValues.length === 0) {
        return {
          group,
          n: 0,
          median: 0,
          q1: 0,
          q3: 0,
          min: 0,
          max: 0,
          mean: 0
        };
      }
      
      const n = groupValues.length;
      const median = n % 2 === 0 
        ? (groupValues[n/2 - 1] + groupValues[n/2]) / 2
        : groupValues[Math.floor(n/2)];
      
      const q1 = n >= 4 ? groupValues[Math.floor(n * 0.25)] : groupValues[0];
      const q3 = n >= 4 ? groupValues[Math.floor(n * 0.75)] : groupValues[n-1];
      const mean = groupValues.reduce((sum, val) => sum + val, 0) / n;
      
      return {
        group,
        n,
        median,
        q1,
        q3,
        min: groupValues[0],
        max: groupValues[n-1],
        mean
      };
    });
    
    return groupedData;
  };

  const generatePlot = () => {
    if (data.length === 0 || selectedGenes.length === 0) {
      toast.error('Please load data and select genes first');
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

    // Filter data for selected genes
    const plotData = data.filter(d => selectedGenes.includes(d.gene));
    
    // Calculate statistics
    const geneStats = selectedGenes.map(gene => {
      const geneData = plotData.filter(d => d.gene === gene);
      return {
        gene,
        stats: calculateStats(geneData)
      };
    });
    
    setStats(geneStats[0]?.stats || []);

    // Calculate scales
    const allValues = plotData.map(d => plotSettings.logScale ? Math.log10(d.value + 1) : d.value);
    const yMin = Math.min(...allValues);
    const yMax = Math.max(...allValues);
    const yPadding = (yMax - yMin) * 0.1;

    const yScale = (y: number) => margin.top + plotHeight - ((y - yMin + yPadding) / (yMax - yMin + 2 * yPadding)) * plotHeight;

    // Calculate box positions
    const boxWidth = plotWidth / (availableGroups.length * selectedGenes.length + 1);
    const groupSpacing = plotWidth / availableGroups.length;

    // Get colors from group colors mapping
    const getGroupColor = (group: string) => {
      const groupColor = groupColors.find(gc => gc.group === group);
      return groupColor ? groupColor.color : '#3B82F6';
    };

    // Draw axes
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(margin.left, margin.top + plotHeight);
    ctx.lineTo(margin.left + plotWidth, margin.top + plotHeight);
    ctx.moveTo(margin.left, margin.top);
    ctx.lineTo(margin.left, margin.top + plotHeight);
    ctx.stroke();

    // Draw plots for each gene and group
    selectedGenes.forEach((gene, geneIdx) => {
      const geneData = plotData.filter(d => d.gene === gene);
      
      availableGroups.forEach((group, groupIdx) => {
        const groupData = geneData
          .filter(d => d.group === group)
          .map(d => plotSettings.logScale ? Math.log10(d.value + 1) : d.value)
          .sort((a, b) => a - b);
        
        if (groupData.length === 0) return;
        
        const boxX = margin.left + groupIdx * groupSpacing + geneIdx * (boxWidth * 0.8) + boxWidth * 0.1;
        const boxWidthActual = boxWidth * 0.6;
        const groupColor = getGroupColor(group);
        
        if (plotSettings.plotType === 'box') {
          // Draw box plot
          const n = groupData.length;
          const q1 = n >= 4 ? groupData[Math.floor(n * 0.25)] : groupData[0];
          const median = n % 2 === 0 
            ? (groupData[n/2 - 1] + groupData[n/2]) / 2
            : groupData[Math.floor(n/2)];
          const q3 = n >= 4 ? groupData[Math.floor(n * 0.75)] : groupData[n-1];
          
          // Draw box
          ctx.fillStyle = groupColor + '40';
          ctx.strokeStyle = groupColor;
          ctx.lineWidth = 2;
          
          const boxTop = yScale(q3);
          const boxBottom = yScale(q1);
          const boxHeight = boxBottom - boxTop;
          
          ctx.fillRect(boxX, boxTop, boxWidthActual, boxHeight);
          ctx.strokeRect(boxX, boxTop, boxWidthActual, boxHeight);
          
          // Draw median line
          ctx.beginPath();
          ctx.moveTo(boxX, yScale(median));
          ctx.lineTo(boxX + boxWidthActual, yScale(median));
          ctx.stroke();
          
          // Draw whiskers
          const iqr = q3 - q1;
          const lowerWhisker = Math.max(groupData[0], q1 - 1.5 * iqr);
          const upperWhisker = Math.min(groupData[n-1], q3 + 1.5 * iqr);
          
          ctx.setLineDash([]);
          ctx.beginPath();
          // Lower whisker
          ctx.moveTo(boxX + boxWidthActual/2, yScale(q1));
          ctx.lineTo(boxX + boxWidthActual/2, yScale(lowerWhisker));
          ctx.moveTo(boxX + boxWidthActual*0.25, yScale(lowerWhisker));
          ctx.lineTo(boxX + boxWidthActual*0.75, yScale(lowerWhisker));
          // Upper whisker
          ctx.moveTo(boxX + boxWidthActual/2, yScale(q3));
          ctx.lineTo(boxX + boxWidthActual/2, yScale(upperWhisker));
          ctx.moveTo(boxX + boxWidthActual*0.25, yScale(upperWhisker));
          ctx.lineTo(boxX + boxWidthActual*0.75, yScale(upperWhisker));
          ctx.stroke();
        } else {
          // Draw violin plot (simplified)
          const density = new Array(50).fill(0);
          const step = (Math.max(...groupData) - Math.min(...groupData)) / 49;
          
          groupData.forEach(value => {
            const bin = Math.floor((value - Math.min(...groupData)) / step);
            if (bin >= 0 && bin < 50) density[bin]++;
          });
          
          const maxDensity = Math.max(...density);
          ctx.fillStyle = groupColor + '60';
          ctx.strokeStyle = groupColor;
          ctx.lineWidth = 1;
          
          ctx.beginPath();
          for (let i = 0; i < density.length; i++) {
            const y = yScale(Math.min(...groupData) + i * step);
            const width = (density[i] / maxDensity) * boxWidthActual / 2;
            
            if (i === 0) {
              ctx.moveTo(boxX + boxWidthActual/2 - width, y);
            } else {
              ctx.lineTo(boxX + boxWidthActual/2 - width, y);
            }
          }
          for (let i = density.length - 1; i >= 0; i--) {
            const y = yScale(Math.min(...groupData) + i * step);
            const width = (density[i] / maxDensity) * boxWidthActual / 2;
            ctx.lineTo(boxX + boxWidthActual/2 + width, y);
          }
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        }
        
        // Draw data points if enabled
        if (plotSettings.showPoints) {
          ctx.fillStyle = groupColor;
          groupData.forEach(value => {
            const jitter = (Math.random() - 0.5) * boxWidthActual * 0.6;
            ctx.beginPath();
            ctx.arc(boxX + boxWidthActual/2 + jitter, yScale(value), 2, 0, 2 * Math.PI);
            ctx.fill();
          });
        }
        
        // Draw mean if enabled
        if (plotSettings.showMean) {
          const mean = groupData.reduce((sum, val) => sum + val, 0) / groupData.length;
          ctx.fillStyle = '#ff0000';
          ctx.beginPath();
          ctx.arc(boxX + boxWidthActual/2, yScale(mean), 4, 0, 2 * Math.PI);
          ctx.fill();
        }
      });
    });

    // Add group labels
    ctx.fillStyle = '#000';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    availableGroups.forEach((group, idx) => {
      const x = margin.left + idx * groupSpacing + groupSpacing/2;
      ctx.fillText(group, x, 580);
    });

    // Add axis labels
    ctx.font = '14px Arial';
    ctx.fillText('Groups', 400, 595);
    
    ctx.save();
    ctx.translate(20, 300);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(`Expression ${plotSettings.logScale ? '(log10)' : ''}`, 0, 0);
    ctx.restore();

    // Add gene legend if multiple genes
    if (selectedGenes.length > 1) {
      selectedGenes.forEach((gene, idx) => {
        const color = getGroupColor(availableGroups[0]); // Use first group color as example
        ctx.fillStyle = color;
        ctx.fillRect(650, 20 + idx * 20, 15, 15);
        ctx.fillStyle = '#000';
        ctx.font = '12px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(gene, 670, 32 + idx * 20);
      });
    }

    setPlotGenerated(true);
    toast.success(`${plotSettings.plotType === 'box' ? 'Box' : 'Violin'} plot generated successfully!`);
  };

  const downloadPlot = (format: 'png' | 'jpeg' | 'tiff', dpi: number = 300) => {
    if (stats.length === 0) {
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

    // High-DPI offscreen canvas
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
    // Browsers don't natively encode TIFF or PDF here — fall back to PNG
    const ext = format === 'png' || format === 'jpeg' ? format : 'png';
    const filename = `${plotSettings.plotType}_plot_${dpi}dpi.${ext}`;

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

  const downloadStats = () => {
    if (stats.length === 0) return;
    
    const csv = [
      'group,n,median,q1,q3,min,max,mean',
      ...stats.map(s => 
        `${s.group},${s.n},${s.median},${s.q1},${s.q3},${s.min},${s.max},${s.mean}`
      )
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'plot_statistics.csv';
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 100);
    toast.success('Statistics downloaded');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <Navigation />
      
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <div className="w-16 h-16 mx-auto mb-4 bg-blue-600 rounded-full flex items-center justify-center">
            <BarChart3 className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Box & Violin Plot Generator</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Create publication-ready box plots or violin plots for gene expression analysis with customizable group colors, statistical summaries, and high-DPI export options.
          </p>
        </div>

        <Tabs defaultValue="data" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="data">Data Input</TabsTrigger>
            <TabsTrigger value="settings">Plot Settings</TabsTrigger>
            <TabsTrigger value="plot">Generate Plot</TabsTrigger>
          </TabsList>

          <TabsContent value="data">
            <Card className="border-0 shadow-xl bg-white/90 backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Upload className="h-5 w-5 mr-2 text-blue-600" />
                  Data Input
                </CardTitle>
                <CardDescription>
                  Upload tidy data with columns: group, value, sample (or sample, group, gene, value)
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
                    placeholder="group,value,sample_id&#10;Control,5.2,C1&#10;Control,4.8,C2&#10;Treatment,7.1,T1&#10;..."
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
                        ✅ Loaded {data.length} data points
                      </p>
                      <p className="text-sm text-green-600 mt-1">
                        {availableGenes.length} genes, {availableGroups.length} groups
                      </p>
                    </div>
                    
                    <div>
                      <Label>Select genes to plot</Label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                        {availableGenes.map(gene => (
                          <label key={gene} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              checked={selectedGenes.includes(gene)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedGenes([...selectedGenes, gene]);
                                } else {
                                  setSelectedGenes(selectedGenes.filter(g => g !== gene));
                                }
                              }}
                            />
                            <span className="text-sm">{gene}</span>
                          </label>
                        ))}
                      </div>
                    </div>
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
                    Plot Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Plot Type</Label>
                    <div className="flex space-x-4 mt-2">
                      <label className="flex items-center space-x-2">
                        <input
                          type="radio"
                          name="plotType"
                          value="box"
                          checked={plotSettings.plotType === 'box'}
                          onChange={(e) => setPlotSettings({...plotSettings, plotType: e.target.value as 'box' | 'violin'})}
                        />
                        <span>Box Plot</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input
                          type="radio"
                          name="plotType"
                          value="violin"
                          checked={plotSettings.plotType === 'violin'}
                          onChange={(e) => setPlotSettings({...plotSettings, plotType: e.target.value as 'box' | 'violin'})}
                        />
                        <span>Violin Plot</span>
                      </label>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={plotSettings.showPoints}
                        onCheckedChange={(checked) => setPlotSettings({...plotSettings, showPoints: checked})}
                      />
                      <Label>Show data points (jitter)</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={plotSettings.showMean}
                        onCheckedChange={(checked) => setPlotSettings({...plotSettings, showMean: checked})}
                      />
                      <Label>Show mean marker</Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={plotSettings.logScale}
                        onCheckedChange={(checked) => setPlotSettings({...plotSettings, logScale: checked})}
                      />
                      <Label>Log scale Y-axis</Label>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-xl bg-white/90 backdrop-blur">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Palette className="h-5 w-5 mr-2 text-pink-600" />
                    Color Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Color Palette</Label>
                    <Select 
                      value={colorPalette} 
                      onValueChange={(value) => {
                        setColorPalette(value);
                        applyPaletteToGroups(value);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="default">Default</SelectItem>
                        <SelectItem value="viridis">Viridis</SelectItem>
                        <SelectItem value="plasma">Plasma</SelectItem>
                        <SelectItem value="warm">Warm</SelectItem>
                        <SelectItem value="cool">Cool</SelectItem>
                        <SelectItem value="custom">Custom</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {colorPalette === 'custom' && (
                    <div>
                      <Label>Custom Colors</Label>
                      <div className="space-y-2 mt-2">
                        {customColors.map((color, idx) => (
                          <div key={idx} className="flex items-center space-x-2">
                            <Input
                              type="color"
                              value={color}
                              onChange={(e) => {
                                const newColors = [...customColors];
                                newColors[idx] = e.target.value;
                                setCustomColors(newColors);
                                applyPaletteToGroups('custom');
                              }}
                              className="w-16 h-10"
                            />
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => removeCustomColor(idx)}
                              disabled={customColors.length <= 1}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={addCustomColor}
                          className="w-full"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Color
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Individual Group Color Settings */}
                  {groupColors.length > 0 && (
                    <div>
                      <Label>Individual Group Colors</Label>
                      <div className="space-y-3 mt-2">
                        {groupColors.map((gc, idx) => (
                          <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <span className="font-medium text-sm">{gc.group}</span>
                            <Input
                              type="color"
                              value={gc.color}
                              onChange={(e) => updateGroupColor(gc.group, e.target.value)}
                              className="w-16 h-8"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <Label>Statistical Test</Label>
                    <Select 
                      value={plotSettings.statisticalTest} 
                      onValueChange={(value) => setPlotSettings({...plotSettings, statisticalTest: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="auto">Auto-detect</SelectItem>
                        <SelectItem value="ttest">T-test (2 groups)</SelectItem>
                        <SelectItem value="mann-whitney">Mann-Whitney (2 groups)</SelectItem>
                        <SelectItem value="anova">ANOVA (&gt;2 groups)</SelectItem>
                        <SelectItem value="kruskal">Kruskal-Wallis (&gt;2 groups)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="plot">
            <Card className="border-0 shadow-xl bg-white/90 backdrop-blur">
              <CardHeader>
                <CardTitle>{plotSettings.plotType === 'box' ? 'Box' : 'Violin'} Plot</CardTitle>
                <CardDescription>
                  {plotGenerated ? `Your ${plotSettings.plotType} plot is ready` : 'Generate plot to see visualization'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button 
                  onClick={generatePlot} 
                  className="w-full bg-blue-600 hover:bg-blue-700" 
                  disabled={data.length === 0 || selectedGenes.length === 0}
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Generate {plotSettings.plotType === 'box' ? 'Box' : 'Violin'} Plot
                </Button>
                
                <div className="flex justify-center">
                  <canvas
                    ref={canvasRef}
                    className="border border-gray-200 rounded-lg max-w-full"
                    style={{ maxHeight: '600px' }}
                  />
                </div>

                {plotGenerated && (
                  <div className="space-y-3 pt-4 border-t">
                    <h4 className="font-semibold text-sm text-gray-700">Download plot (300 DPI)</h4>
                    <div className="grid grid-cols-3 gap-2">
                      <Button onClick={() => downloadPlot('png', 300)} variant="outline" size="sm">PNG</Button>
                      <Button onClick={() => downloadPlot('jpeg', 300)} variant="outline" size="sm">JPEG</Button>
                      <Button onClick={() => downloadPlot('tiff', 300)} variant="outline" size="sm">TIFF</Button>
                    </div>
                    <Button onClick={downloadStats} variant="outline" size="sm" className="w-full" disabled={stats.length === 0}>
                      Download Statistics CSV
                    </Button>
                  </div>
                )}

                {stats.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-lg font-semibold mb-4">Group Statistics</h3>
                    <div className="overflow-x-auto">
                      <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-2 text-left">Group</th>
                            <th className="px-4 py-2 text-left">N</th>
                            <th className="px-4 py-2 text-left">Median</th>
                            <th className="px-4 py-2 text-left">Q1</th>
                            <th className="px-4 py-2 text-left">Q3</th>
                            <th className="px-4 py-2 text-left">Mean</th>
                            <th className="px-4 py-2 text-left">Color</th>
                          </tr>
                        </thead>
                        <tbody>
                          {stats.map((stat, idx) => {
                            const groupColor = groupColors.find(gc => gc.group === stat.group);
                            return (
                              <tr key={idx} className="border-t">
                                <td className="px-4 py-2 font-medium">{stat.group}</td>
                                <td className="px-4 py-2">{stat.n}</td>
                                <td className="px-4 py-2">{stat.median.toFixed(3)}</td>
                                <td className="px-4 py-2">{stat.q1.toFixed(3)}</td>
                                <td className="px-4 py-2">{stat.q3.toFixed(3)}</td>
                                <td className="px-4 py-2">{stat.mean.toFixed(3)}</td>
                                <td className="px-4 py-2">
                                  <div 
                                    className="w-6 h-6 rounded border border-gray-300"
                                    style={{ backgroundColor: groupColor?.color || '#3B82F6' }}
                                  ></div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
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