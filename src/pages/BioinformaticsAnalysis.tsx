import { useState } from 'react';
import Navigation from '@/components/Navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Beaker, Calculator, Dna, Copy, Download } from 'lucide-react';
import { toast } from 'sonner';

interface AnalysisResults {
  type: string;
  length?: number;
  composition?: { A: number; T: number; G: number; C: number };
  gcContent?: string;
  molecularWeight?: string;
  gcCount?: number;
  interpretation?: string;
  originalLength?: number;
  proteinSequence?: string;
  proteinLength?: number;
  stopCodons?: number;
  original?: string;
  reverseComplement?: string;
}

export default function BioinformaticsAnalysis() {
  const [sequence, setSequence] = useState('');
  const [analysisType, setAnalysisType] = useState('');
  const [results, setResults] = useState<AnalysisResults | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analyzeSequence = () => {
    if (!sequence.trim() || !analysisType) {
      toast.error('Please enter a sequence and select analysis type');
      return;
    }

    setIsAnalyzing(true);
    
    // Simulate analysis
    setTimeout(() => {
      const cleanSequence = sequence.replace(/\s/g, '').toUpperCase();
      let analysisResults: AnalysisResults = { type: 'Unknown' };

      switch (analysisType) {
        case 'basic':
          analysisResults = performBasicAnalysis(cleanSequence);
          break;
        case 'gc-content':
          analysisResults = calculateGCContent(cleanSequence);
          break;
        case 'translate':
          analysisResults = translateSequence(cleanSequence);
          break;
        case 'reverse-complement':
          analysisResults = getReverseComplement(cleanSequence);
          break;
        default:
          analysisResults = performBasicAnalysis(cleanSequence);
      }

      setResults(analysisResults);
      setIsAnalyzing(false);
      toast.success('Analysis completed successfully!');
    }, 1500);
  };

  const performBasicAnalysis = (seq: string): AnalysisResults => {
    const length = seq.length;
    const aCount = (seq.match(/A/g) || []).length;
    const tCount = (seq.match(/T/g) || []).length;
    const gCount = (seq.match(/G/g) || []).length;
    const cCount = (seq.match(/C/g) || []).length;
    const gcContent = ((gCount + cCount) / length * 100).toFixed(2);
    
    return {
      type: 'Basic Analysis',
      length,
      composition: { A: aCount, T: tCount, G: gCount, C: cCount },
      gcContent: `${gcContent}%`,
      molecularWeight: (length * 330).toFixed(0) + ' Da (approx)'
    };
  };

  const calculateGCContent = (seq: string): AnalysisResults => {
    const length = seq.length;
    const gCount = (seq.match(/G/g) || []).length;
    const cCount = (seq.match(/C/g) || []).length;
    const gcContent = ((gCount + cCount) / length * 100).toFixed(2);
    
    return {
      type: 'GC Content Analysis',
      length,
      gcCount: gCount + cCount,
      gcContent: `${gcContent}%`,
      interpretation: parseFloat(gcContent) > 50 ? 'GC-rich sequence' : 'AT-rich sequence'
    };
  };

  const translateSequence = (seq: string): AnalysisResults => {
    const codonTable: { [key: string]: string } = {
      'TTT': 'F', 'TTC': 'F', 'TTA': 'L', 'TTG': 'L',
      'TCT': 'S', 'TCC': 'S', 'TCA': 'S', 'TCG': 'S',
      'TAT': 'Y', 'TAC': 'Y', 'TAA': '*', 'TAG': '*',
      'TGT': 'C', 'TGC': 'C', 'TGA': '*', 'TGG': 'W',
      'CTT': 'L', 'CTC': 'L', 'CTA': 'L', 'CTG': 'L',
      'CCT': 'P', 'CCC': 'P', 'CCA': 'P', 'CCG': 'P',
      'CAT': 'H', 'CAC': 'H', 'CAA': 'Q', 'CAG': 'Q',
      'CGT': 'R', 'CGC': 'R', 'CGA': 'R', 'CGG': 'R',
      'ATT': 'I', 'ATC': 'I', 'ATA': 'I', 'ATG': 'M',
      'ACT': 'T', 'ACC': 'T', 'ACA': 'T', 'ACG': 'T',
      'AAT': 'N', 'AAC': 'N', 'AAA': 'K', 'AAG': 'K',
      'AGT': 'S', 'AGC': 'S', 'AGA': 'R', 'AGG': 'R',
      'GTT': 'V', 'GTC': 'V', 'GTA': 'V', 'GTG': 'V',
      'GCT': 'A', 'GCC': 'A', 'GCA': 'A', 'GCG': 'A',
      'GAT': 'D', 'GAC': 'D', 'GAA': 'E', 'GAG': 'E',
      'GGT': 'G', 'GGC': 'G', 'GGA': 'G', 'GGG': 'G'
    };

    let protein = '';
    for (let i = 0; i < seq.length - 2; i += 3) {
      const codon = seq.substr(i, 3);
      protein += codonTable[codon] || 'X';
    }

    return {
      type: 'Translation',
      originalLength: seq.length,
      proteinSequence: protein,
      proteinLength: protein.length,
      stopCodons: (protein.match(/\*/g) || []).length
    };
  };

  const getReverseComplement = (seq: string): AnalysisResults => {
    const complement: { [key: string]: string } = { 'A': 'T', 'T': 'A', 'G': 'C', 'C': 'G' };
    const reverseComp = seq.split('').reverse().map(base => complement[base] || 'N').join('');
    
    return {
      type: 'Reverse Complement',
      original: seq,
      reverseComplement: reverseComp,
      length: seq.length
    };
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Navigation />
      
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <div className="w-16 h-16 mx-auto mb-4 bg-blue-600 rounded-full flex items-center justify-center">
            <Beaker className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Bioinformatics Analysis</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Analyze DNA, RNA, and protein sequences with our comprehensive bioinformatics tools.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Section */}
          <Card className="border-0 shadow-xl bg-white/90 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Dna className="h-5 w-5 mr-2 text-blue-600" />
                Sequence Input
              </CardTitle>
              <CardDescription>
                Enter your DNA, RNA, or protein sequence for analysis
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Sequence (FASTA format or raw sequence)
                </label>
                <Textarea
                  placeholder="Enter your sequence here... (e.g., ATGCGATCGTAGC)"
                  value={sequence}
                  onChange={(e) => setSequence(e.target.value)}
                  className="min-h-[120px] font-mono text-sm"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">
                  Analysis Type
                </label>
                <Select value={analysisType} onValueChange={setAnalysisType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select analysis type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basic">Basic Analysis</SelectItem>
                    <SelectItem value="gc-content">GC Content</SelectItem>
                    <SelectItem value="translate">DNA Translation</SelectItem>
                    <SelectItem value="reverse-complement">Reverse Complement</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button 
                onClick={analyzeSequence} 
                className="w-full" 
                disabled={isAnalyzing}
              >
                <Calculator className="h-4 w-4 mr-2" />
                {isAnalyzing ? 'Analyzing...' : 'Analyze Sequence'}
              </Button>
            </CardContent>
          </Card>

          {/* Results Section */}
          <Card className="border-0 shadow-xl bg-white/90 backdrop-blur">
            <CardHeader>
              <CardTitle>Analysis Results</CardTitle>
              <CardDescription>
                {results ? 'Your sequence analysis is complete' : 'Results will appear here after analysis'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {results ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                      {results.type}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(JSON.stringify(results, null, 2))}
                    >
                      <Copy className="h-4 w-4 mr-1" />
                      Copy
                    </Button>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-3">
                    {Object.entries(results).map(([key, value]) => {
                      if (key === 'type') return null;
                      return (
                        <div key={key} className="flex justify-between items-start">
                          <span className="font-medium text-gray-700 capitalize">
                            {key.replace(/([A-Z])/g, ' $1').trim()}:
                          </span>
                          <span className="text-gray-900 text-right max-w-[60%] break-all font-mono text-sm">
                            {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <Beaker className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Enter a sequence and select analysis type to see results</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Info Section */}
        <Card className="mt-8 border-0 shadow-lg bg-blue-50/50">
          <CardHeader>
            <CardTitle className="text-blue-900">Supported Analysis Types</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold text-blue-800 mb-2">Basic Analysis</h4>
                <p className="text-sm text-blue-700">Sequence length, nucleotide composition, GC content, and molecular weight estimation.</p>
              </div>
              <div>
                <h4 className="font-semibold text-blue-800 mb-2">GC Content</h4>
                <p className="text-sm text-blue-700">Detailed GC content analysis with interpretation for sequence characteristics.</p>
              </div>
              <div>
                <h4 className="font-semibold text-blue-800 mb-2">DNA Translation</h4>
                <p className="text-sm text-blue-700">Translate DNA sequences to amino acid sequences using the standard genetic code.</p>
              </div>
              <div>
                <h4 className="font-semibold text-blue-800 mb-2">Reverse Complement</h4>
                <p className="text-sm text-blue-700">Generate the reverse complement of DNA sequences for primer design and analysis.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

    </div>
  );
}