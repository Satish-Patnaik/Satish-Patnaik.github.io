import { useState } from 'react';
import Navigation from '@/components/Navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calculator, ArrowRight, RefreshCw, Download, Beaker, Droplet } from 'lucide-react';
import { toast } from 'sonner';

interface ConversionResult {
  value: number;
  unit: string;
  formula: string;
}

interface DilutionResult {
  stockVolume: number;
  diluentVolume: number;
  totalVolume: number;
  dilutionFactor: number;
  formula: string;
}

export default function ConcentrationConverter() {
  // Conversion states
  const [inputValue, setInputValue] = useState('');
  const [inputUnit, setInputUnit] = useState('');
  const [outputUnit, setOutputUnit] = useState('');
  const [molecularWeight, setMolecularWeight] = useState('');
  const [results, setResults] = useState<ConversionResult[]>([]);

  // Dilution states
  const [stockConcentration, setStockConcentration] = useState('');
  const [stockUnit, setStockUnit] = useState('');
  const [targetConcentration, setTargetConcentration] = useState('');
  const [targetUnit, setTargetUnit] = useState('');
  const [finalVolume, setFinalVolume] = useState('');
  const [volumeUnit, setVolumeUnit] = useState('mL');
  const [dilutionResults, setDilutionResults] = useState<DilutionResult[]>([]);

  const units = [
    { value: 'M', label: 'Molar (M)', type: 'molar' },
    { value: 'mM', label: 'Millimolar (mM)', type: 'molar' },
    { value: 'μM', label: 'Micromolar (μM)', type: 'molar' },
    { value: 'nM', label: 'Nanomolar (nM)', type: 'molar' },
    { value: 'pM', label: 'Picomolar (pM)', type: 'molar' },
    { value: 'g/L', label: 'Grams per Liter (g/L)', type: 'mass' },
    { value: 'mg/L', label: 'Milligrams per Liter (mg/L)', type: 'mass' },
    { value: 'μg/L', label: 'Micrograms per Liter (μg/L)', type: 'mass' },
    { value: 'ng/L', label: 'Nanograms per Liter (ng/L)', type: 'mass' },
    { value: 'mg/mL', label: 'Milligrams per mL (mg/mL)', type: 'mass' },
    { value: 'μg/mL', label: 'Micrograms per mL (μg/mL)', type: 'mass' },
    { value: 'ng/mL', label: 'Nanograms per mL (ng/mL)', type: 'mass' },
    { value: '%w/v', label: 'Percent weight/volume (%w/v)', type: 'percent' },
    { value: '%w/w', label: 'Percent weight/weight (%w/w)', type: 'percent' },
    { value: 'ppm', label: 'Parts per million (ppm)', type: 'ratio' },
    { value: 'ppb', label: 'Parts per billion (ppb)', type: 'ratio' }
  ];

  const volumeUnits = [
    { value: 'mL', label: 'Milliliters (mL)' },
    { value: 'μL', label: 'Microliters (μL)' },
    { value: 'L', label: 'Liters (L)' }
  ];

  const conversionFactors: { [key: string]: number } = {
    'M': 1,
    'mM': 1e-3,
    'μM': 1e-6,
    'nM': 1e-9,
    'pM': 1e-12,
    'g/L': 1,
    'mg/L': 1e-3,
    'μg/L': 1e-6,
    'ng/L': 1e-9,
    'mg/mL': 1,
    'μg/mL': 1e-3,
    'ng/mL': 1e-6,
    '%w/v': 10,
    '%w/w': 10,
    'ppm': 1e-3,
    'ppb': 1e-6
  };

  const convertConcentration = () => {
    if (!inputValue || !inputUnit || !outputUnit) {
      toast.error('Please fill in all required fields');
      return;
    }

    const inputVal = parseFloat(inputValue);
    const mw = parseFloat(molecularWeight);

    if (isNaN(inputVal)) {
      toast.error('Please enter a valid concentration value');
      return;
    }

    const inputUnitData = units.find(u => u.value === inputUnit);
    const outputUnitData = units.find(u => u.value === outputUnit);

    if (!inputUnitData || !outputUnitData) {
      toast.error('Invalid unit selection');
      return;
    }

    let result: number;
    let formula: string;

    // Convert between molar units
    if (inputUnitData.type === 'molar' && outputUnitData.type === 'molar') {
      result = inputVal * (conversionFactors[inputUnit] / conversionFactors[outputUnit]);
      formula = `${inputVal} ${inputUnit} × (${conversionFactors[inputUnit]} / ${conversionFactors[outputUnit]}) = ${result.toExponential(3)} ${outputUnit}`;
    }
    // Convert between mass units
    else if (inputUnitData.type === 'mass' && outputUnitData.type === 'mass') {
      const inputFactor = conversionFactors[inputUnit];
      const outputFactor = conversionFactors[outputUnit];
      
      let volumeFactor = 1;
      if (inputUnit.includes('mL') && outputUnit.includes('L')) volumeFactor = 1000;
      if (inputUnit.includes('L') && outputUnit.includes('mL')) volumeFactor = 0.001;
      
      result = inputVal * (inputFactor / outputFactor) * volumeFactor;
      formula = `${inputVal} ${inputUnit} × (${inputFactor} / ${outputFactor}) = ${result.toExponential(3)} ${outputUnit}`;
    }
    // Convert molar to mass (requires MW)
    else if (inputUnitData.type === 'molar' && outputUnitData.type === 'mass') {
      if (!mw || isNaN(mw)) {
        toast.error('Molecular weight is required for molar to mass conversion');
        return;
      }
      
      const molarInM = inputVal * conversionFactors[inputUnit];
      const massInGPerL = molarInM * mw;
      result = massInGPerL / conversionFactors[outputUnit];
      
      if (outputUnit.includes('mL')) result *= 0.001;
      
      formula = `${inputVal} ${inputUnit} × ${mw} g/mol × conversion factor = ${result.toExponential(3)} ${outputUnit}`;
    }
    // Convert mass to molar (requires MW)
    else if (inputUnitData.type === 'mass' && outputUnitData.type === 'molar') {
      if (!mw || isNaN(mw)) {
        toast.error('Molecular weight is required for mass to molar conversion');
        return;
      }
      
      let massInGPerL = inputVal * conversionFactors[inputUnit];
      if (inputUnit.includes('mL')) massInGPerL *= 1000;
      
      const molarInM = massInGPerL / mw;
      result = molarInM / conversionFactors[outputUnit];
      
      formula = `${inputVal} ${inputUnit} ÷ ${mw} g/mol × conversion factor = ${result.toExponential(3)} ${outputUnit}`;
    }
    else {
      toast.error('This conversion type is not yet supported');
      return;
    }

    const newResult: ConversionResult = {
      value: result,
      unit: outputUnit,
      formula: formula
    };

    setResults(prev => [newResult, ...prev.slice(0, 9)]);
    toast.success('Conversion completed successfully!');
  };

  const calculateDilution = () => {
    if (!stockConcentration || !stockUnit || !targetConcentration || !targetUnit || !finalVolume) {
      toast.error('Please fill in all required fields for dilution calculation');
      return;
    }

    const stockConc = parseFloat(stockConcentration);
    const targetConc = parseFloat(targetConcentration);
    const finalVol = parseFloat(finalVolume);

    if (isNaN(stockConc) || isNaN(targetConc) || isNaN(finalVol)) {
      toast.error('Please enter valid numeric values');
      return;
    }

    if (finalVol <= 0) {
      toast.error('Final volume must be greater than 0');
      return;
    }

    // Convert concentrations to same unit for calculation
    const stockUnitData = units.find(u => u.value === stockUnit);
    const targetUnitData = units.find(u => u.value === targetUnit);

    if (!stockUnitData || !targetUnitData) {
      toast.error('Invalid unit selection');
      return;
    }

    // Check if units are compatible
    if (stockUnitData.type !== targetUnitData.type) {
      toast.error('Stock and target concentrations must use compatible units (both molar, both mass-based, etc.)');
      return;
    }

    // Convert both to base units for comparison
    const stockInBase = stockConc * conversionFactors[stockUnit];
    const targetInBase = targetConc * conversionFactors[targetUnit];

    // Check if this is actually a dilution (stock should be more concentrated)
    if (stockInBase <= targetInBase) {
      toast.error(`Stock concentration (${stockConc} ${stockUnit}) must be higher than target concentration (${targetConc} ${targetUnit}) for dilution`);
      return;
    }

    // Calculate dilution using C1V1 = C2V2
    // V1 = (C2 × V2) / C1
    const stockVolumeInFinalUnits = (targetInBase * finalVol) / stockInBase;
    const diluentVolume = finalVol - stockVolumeInFinalUnits;
    const dilutionFactor = stockInBase / targetInBase;

    // Convert volumes to appropriate display units
    let displayStockVolume = stockVolumeInFinalUnits;
    let displayDiluentVolume = diluentVolume;
    let displayUnit = volumeUnit;

    // Auto-convert to μL if volume is very small and we're working in mL
    if (volumeUnit === 'mL' && stockVolumeInFinalUnits < 0.1) {
      displayStockVolume = stockVolumeInFinalUnits * 1000;
      displayDiluentVolume = diluentVolume * 1000;
      displayUnit = 'μL';
    }

    const formula = `C₁V₁ = C₂V₂ → V₁ = (${targetConc} ${targetUnit} × ${finalVol} ${volumeUnit}) / ${stockConc} ${stockUnit} = ${displayStockVolume.toFixed(1)} ${displayUnit}`;

    const newDilutionResult: DilutionResult = {
      stockVolume: displayStockVolume,
      diluentVolume: displayDiluentVolume,
      totalVolume: finalVol,
      dilutionFactor: dilutionFactor,
      formula: formula
    };

    setDilutionResults(prev => [newDilutionResult, ...prev.slice(0, 9)]);
    toast.success('Dilution calculated successfully!');
  };

  const clearConversion = () => {
    setInputValue('');
    setInputUnit('');
    setOutputUnit('');
    setMolecularWeight('');
    setResults([]);
    toast.success('Conversion fields cleared');
  };

  const clearDilution = () => {
    setStockConcentration('');
    setStockUnit('');
    setTargetConcentration('');
    setTargetUnit('');
    setFinalVolume('');
    setVolumeUnit('mL');
    setDilutionResults([]);
    toast.success('Dilution fields cleared');
  };

  const exportResults = (type: 'conversion' | 'dilution') => {
    if (type === 'conversion') {
      if (results.length === 0) {
        toast.error('No conversion results to export');
        return;
      }

      const csvContent = [
        'Input Value,Input Unit,Output Value,Output Unit,Formula',
        ...results.map(r => `${inputValue},${inputUnit},${r.value.toExponential(3)},${r.unit},"${r.formula}"`)
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'concentration_conversions.csv';
      a.click();
      URL.revokeObjectURL(url);
    } else {
      if (dilutionResults.length === 0) {
        toast.error('No dilution results to export');
        return;
      }

      const csvContent = [
        'Stock Volume,Diluent Volume,Total Volume,Dilution Factor,Formula',
        ...dilutionResults.map(r => `${r.stockVolume.toFixed(1)},${r.diluentVolume.toFixed(1)},${r.totalVolume},${r.dilutionFactor.toFixed(2)},"${r.formula}"`)
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'dilution_calculations.csv';
      a.click();
      URL.revokeObjectURL(url);
    }
    
    toast.success('Results exported successfully!');
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
            Concentration Converter & Dilution Calculator
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Convert between concentration units and calculate dilutions for solution preparation. 
            Perfect for lab work and converting literature values.
          </p>
        </div>

        <Tabs defaultValue="converter" className="space-y-8">
          <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto">
            <TabsTrigger value="converter" className="flex items-center">
              <Calculator className="h-4 w-4 mr-2" />
              Unit Converter
            </TabsTrigger>
            <TabsTrigger value="dilution" className="flex items-center">
              <Beaker className="h-4 w-4 mr-2" />
              Dilution Calculator
            </TabsTrigger>
          </TabsList>

          {/* Unit Converter Tab */}
          <TabsContent value="converter">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Conversion Input Panel */}
              <Card className="border-0 shadow-xl bg-white/90 backdrop-blur">
                <CardHeader>
                  <CardTitle className="flex items-center text-xl">
                    <Calculator className="h-5 w-5 mr-2 text-blue-600" />
                    Unit Converter
                  </CardTitle>
                  <CardDescription>
                    Convert between different concentration units
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="input-value">Concentration Value *</Label>
                      <Input
                        id="input-value"
                        type="number"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder="e.g., 100"
                        step="any"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="input-unit">From Unit *</Label>
                      <Select value={inputUnit} onValueChange={setInputUnit}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select input unit" />
                        </SelectTrigger>
                        <SelectContent>
                          {units.map(unit => (
                            <SelectItem key={unit.value} value={unit.value}>
                              {unit.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="output-unit">To Unit *</Label>
                    <Select value={outputUnit} onValueChange={setOutputUnit}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select output unit" />
                      </SelectTrigger>
                      <SelectContent>
                        {units.map(unit => (
                          <SelectItem key={unit.value} value={unit.value}>
                            {unit.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="molecular-weight">Molecular Weight (g/mol)</Label>
                    <Input
                      id="molecular-weight"
                      type="number"
                      value={molecularWeight}
                      onChange={(e) => setMolecularWeight(e.target.value)}
                      placeholder="Required for molar ↔ mass conversions"
                      step="any"
                    />
                  </div>

                  <Separator />

                  <div className="flex space-x-4">
                    <Button onClick={convertConcentration} className="flex-1 bg-blue-600 hover:bg-blue-700">
                      <ArrowRight className="h-4 w-4 mr-2" />
                      Convert
                    </Button>
                    <Button onClick={clearConversion} variant="outline">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Clear
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Conversion Results Panel */}
              <Card className="border-0 shadow-xl bg-white/90 backdrop-blur">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="text-xl">Conversion Results</CardTitle>
                      <CardDescription>Recent conversion calculations</CardDescription>
                    </div>
                    {results.length > 0 && (
                      <Button onClick={() => exportResults('conversion')} variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Export CSV
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {results.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Calculator className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No conversions yet. Enter values above to get started.</p>
                    </div>
                  ) : (
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      {results.map((result, index) => (
                        <div key={index} className="p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-lg font-semibold text-blue-600">
                              {result.value.toExponential(3)} {result.unit}
                            </span>
                            <Badge variant="secondary">#{results.length - index}</Badge>
                          </div>
                          <p className="text-sm text-gray-600 font-mono bg-white p-2 rounded border">
                            {result.formula}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Dilution Calculator Tab */}
          <TabsContent value="dilution">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Dilution Input Panel */}
              <Card className="border-0 shadow-xl bg-white/90 backdrop-blur">
                <CardHeader>
                  <CardTitle className="flex items-center text-xl">
                    <Beaker className="h-5 w-5 mr-2 text-green-600" />
                    Dilution Calculator
                  </CardTitle>
                  <CardDescription>
                    Calculate volumes needed for solution dilutions
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="stock-conc">Stock Concentration *</Label>
                      <Input
                        id="stock-conc"
                        type="number"
                        value={stockConcentration}
                        onChange={(e) => setStockConcentration(e.target.value)}
                        placeholder="e.g., 1"
                        step="any"
                      />
                    </div>
                    <div>
                      <Label htmlFor="stock-unit">Stock Unit *</Label>
                      <Select value={stockUnit} onValueChange={setStockUnit}>
                        <SelectTrigger>
                          <SelectValue placeholder="Unit" />
                        </SelectTrigger>
                        <SelectContent>
                          {units.map(unit => (
                            <SelectItem key={unit.value} value={unit.value}>
                              {unit.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="target-conc">Target Concentration *</Label>
                      <Input
                        id="target-conc"
                        type="number"
                        value={targetConcentration}
                        onChange={(e) => setTargetConcentration(e.target.value)}
                        placeholder="e.g., 100"
                        step="any"
                      />
                    </div>
                    <div>
                      <Label htmlFor="target-unit">Target Unit *</Label>
                      <Select value={targetUnit} onValueChange={setTargetUnit}>
                        <SelectTrigger>
                          <SelectValue placeholder="Unit" />
                        </SelectTrigger>
                        <SelectContent>
                          {units.map(unit => (
                            <SelectItem key={unit.value} value={unit.value}>
                              {unit.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="final-volume">Final Volume *</Label>
                      <Input
                        id="final-volume"
                        type="number"
                        value={finalVolume}
                        onChange={(e) => setFinalVolume(e.target.value)}
                        placeholder="e.g., 1"
                        step="any"
                      />
                    </div>
                    <div>
                      <Label htmlFor="volume-unit">Volume Unit *</Label>
                      <Select value={volumeUnit} onValueChange={setVolumeUnit}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {volumeUnits.map(unit => (
                            <SelectItem key={unit.value} value={unit.value}>
                              {unit.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Example:</strong> To make 1 mL of 100 mM from 1 M stock:<br/>
                      Stock: 1 M, Target: 100 mM, Final Volume: 1 mL<br/>
                      Result: Take 100 μL stock + 900 μL water
                    </p>
                  </div>

                  <Separator />

                  <div className="flex space-x-4">
                    <Button onClick={calculateDilution} className="flex-1 bg-green-600 hover:bg-green-700">
                      <Droplet className="h-4 w-4 mr-2" />
                      Calculate Dilution
                    </Button>
                    <Button onClick={clearDilution} variant="outline">
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Clear
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Dilution Results Panel */}
              <Card className="border-0 shadow-xl bg-white/90 backdrop-blur">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="text-xl">Dilution Results</CardTitle>
                      <CardDescription>Recent dilution calculations</CardDescription>
                    </div>
                    {dilutionResults.length > 0 && (
                      <Button onClick={() => exportResults('dilution')} variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Export CSV
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {dilutionResults.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Beaker className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No dilutions calculated yet. Enter values above to get started.</p>
                    </div>
                  ) : (
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      {dilutionResults.map((result, index) => (
                        <div key={index} className="p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-center justify-between mb-3">
                            <Badge variant="secondary">Dilution #{dilutionResults.length - index}</Badge>
                            <span className="text-sm text-gray-600">
                              {result.dilutionFactor.toFixed(1)}× dilution
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 mb-3">
                            <div className="bg-blue-50 p-3 rounded">
                              <p className="text-sm font-medium text-blue-900">Stock Volume</p>
                              <p className="text-lg font-bold text-blue-700">
                                {result.stockVolume.toFixed(1)} {result.stockVolume < 1 && volumeUnit === 'mL' ? 'μL' : volumeUnit}
                              </p>
                            </div>
                            <div className="bg-green-50 p-3 rounded">
                              <p className="text-sm font-medium text-green-900">Diluent Volume</p>
                              <p className="text-lg font-bold text-green-700">
                                {result.diluentVolume.toFixed(1)} {result.diluentVolume < 1 && volumeUnit === 'mL' ? 'μL' : volumeUnit}
                              </p>
                            </div>
                          </div>
                          
                          <p className="text-sm text-gray-600 font-mono bg-white p-2 rounded border">
                            {result.formula}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Reference Section */}
        <Card className="mt-8 border-0 shadow-xl bg-white/90 backdrop-blur">
          <CardHeader>
            <CardTitle>Quick Reference</CardTitle>
            <CardDescription>Common conversions and dilution formulas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Molar Units</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>1 M = 1000 mM</li>
                  <li>1 mM = 1000 μM</li>
                  <li>1 μM = 1000 nM</li>
                  <li>1 nM = 1000 pM</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Dilution Formula</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li><strong>C₁V₁ = C₂V₂</strong></li>
                  <li>C₁ = Stock concentration</li>
                  <li>V₁ = Stock volume needed</li>
                  <li>C₂ = Target concentration</li>
                  <li>V₂ = Final volume</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Common Examples</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>1:10 dilution = 10× dilution</li>
                  <li>1 M → 100 mM = 10× dilution</li>
                  <li>10 mg/mL → 1 mg/mL = 10× dilution</li>
                  <li>Serial dilutions: 1:2, 1:5, 1:10</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

    </div>
  );
}