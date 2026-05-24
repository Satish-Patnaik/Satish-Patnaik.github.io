import { useState } from 'react';
import Navigation from '@/components/Navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Dna, Copy, Download, Search, Scissors, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

export default function SequenceMassager() {
  const [inputSequence, setInputSequence] = useState('');
  const [outputSequence, setOutputSequence] = useState('');
  const [operation, setOperation] = useState('');
  const [searchPattern, setSearchPattern] = useState('');
  const [replacePattern, setReplacePattern] = useState('');
  const [searchResults, setSearchResults] = useState<number[]>([]);

  const processSequence = () => {
    if (!inputSequence.trim()) {
      toast.error('Please enter a sequence');
      return;
    }

    const cleanSeq = inputSequence.replace(/\s/g, '').toUpperCase();
    let result = '';

    switch (operation) {
      case 'clean':
        result = cleanSequence(cleanSeq);
        break;
      case 'reverse':
        result = cleanSeq.split('').reverse().join('');
        break;
      case 'complement':
        result = getComplement(cleanSeq);
        break;
      case 'reverse-complement':
        result = getComplement(cleanSeq.split('').reverse().join(''));
        break;
      case 'translate':
        result = translateToProtein(cleanSeq);
        break;
      case 'format-fasta':
        result = formatAsFasta(cleanSeq);
        break;
      case 'remove-gaps':
        result = cleanSeq.replace(/[-\s]/g, '');
        break;
      case 'to-rna':
        result = cleanSeq.replace(/T/g, 'U');
        break;
      case 'to-dna':
        result = cleanSeq.replace(/U/g, 'T');
        break;
      default:
        result = cleanSeq;
    }

    setOutputSequence(result);
    toast.success('Sequence processed successfully!');
  };

  const cleanSequence = (seq: string) => {
    // Remove non-nucleotide characters and format
    return seq.replace(/[^ATGCURYSWKMBDHVN]/g, '');
  };

  const getComplement = (seq: string) => {
    const complementMap: { [key: string]: string } = {
      'A': 'T', 'T': 'A', 'G': 'C', 'C': 'G',
      'U': 'A', 'R': 'Y', 'Y': 'R', 'S': 'S',
      'W': 'W', 'K': 'M', 'M': 'K', 'B': 'V',
      'D': 'H', 'H': 'D', 'V': 'B', 'N': 'N'
    };
    
    return seq.split('').map(base => complementMap[base] || 'N').join('');
  };

  const translateToProtein = (seq: string) => {
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
    return protein;
  };

  const formatAsFasta = (seq: string) => {
    const header = '>Sequence_' + Date.now();
    const formattedSeq = seq.match(/.{1,80}/g)?.join('\n') || seq;
    return `${header}\n${formattedSeq}`;
  };

  const searchInSequence = () => {
    if (!inputSequence.trim() || !searchPattern.trim()) {
      toast.error('Please enter both sequence and search pattern');
      return;
    }

    const cleanSeq = inputSequence.replace(/\s/g, '').toUpperCase();
    const pattern = searchPattern.toUpperCase();
    const results: number[] = [];
    
    let index = cleanSeq.indexOf(pattern);
    while (index !== -1) {
      results.push(index);
      index = cleanSeq.indexOf(pattern, index + 1);
    }

    setSearchResults(results);
    toast.success(`Found ${results.length} matches`);
  };

  const replaceInSequence = () => {
    if (!inputSequence.trim() || !searchPattern.trim()) {
      toast.error('Please enter sequence and search pattern');
      return;
    }

    const cleanSeq = inputSequence.replace(/\s/g, '').toUpperCase();
    const pattern = searchPattern.toUpperCase();
    const replacement = replacePattern.toUpperCase();
    
    const result = cleanSeq.replace(new RegExp(pattern, 'g'), replacement);
    setOutputSequence(result);
    toast.success('Pattern replaced successfully!');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const downloadSequence = () => {
    if (!outputSequence) {
      toast.error('No sequence to download');
      return;
    }

    const blob = new Blob([outputSequence], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `processed_sequence_${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Download started!');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <Navigation />
      
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <div className="w-16 h-16 mx-auto mb-4 bg-purple-600 rounded-full flex items-center justify-center">
            <Dna className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Sequence Massager</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Advanced tools for DNA, RNA, and protein sequence manipulation, formatting, and analysis.
          </p>
        </div>

        <Tabs defaultValue="process" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="process">Process Sequences</TabsTrigger>
            <TabsTrigger value="search">Search & Replace</TabsTrigger>
            <TabsTrigger value="format">Format & Convert</TabsTrigger>
          </TabsList>

          <TabsContent value="process" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Input Section */}
              <Card className="border-0 shadow-xl bg-white/90 backdrop-blur">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Dna className="h-5 w-5 mr-2 text-purple-600" />
                    Input Sequence
                  </CardTitle>
                  <CardDescription>
                    Enter your DNA, RNA, or protein sequence
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    placeholder="Enter your sequence here... (e.g., ATGCGATCGTAGC)"
                    value={inputSequence}
                    onChange={(e) => setInputSequence(e.target.value)}
                    className="min-h-[150px] font-mono text-sm"
                  />
                  
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">
                      Processing Operation
                    </label>
                    <Select value={operation} onValueChange={setOperation}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select operation" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="clean">Clean Sequence</SelectItem>
                        <SelectItem value="reverse">Reverse</SelectItem>
                        <SelectItem value="complement">Complement</SelectItem>
                        <SelectItem value="reverse-complement">Reverse Complement</SelectItem>
                        <SelectItem value="translate">Translate to Protein</SelectItem>
                        <SelectItem value="to-rna">DNA to RNA</SelectItem>
                        <SelectItem value="to-dna">RNA to DNA</SelectItem>
                        <SelectItem value="remove-gaps">Remove Gaps</SelectItem>
                        <SelectItem value="format-fasta">Format as FASTA</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button onClick={processSequence} className="w-full bg-purple-600 hover:bg-purple-700">
                    <Scissors className="h-4 w-4 mr-2" />
                    Process Sequence
                  </Button>
                </CardContent>
              </Card>

              {/* Output Section */}
              <Card className="border-0 shadow-xl bg-white/90 backdrop-blur">
                <CardHeader>
                  <CardTitle>Processed Sequence</CardTitle>
                  <CardDescription>
                    {outputSequence ? 'Your processed sequence is ready' : 'Results will appear here'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    value={outputSequence}
                    readOnly
                    className="min-h-[150px] font-mono text-sm bg-gray-50"
                    placeholder="Processed sequence will appear here..."
                  />
                  
                  {outputSequence && (
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        onClick={() => copyToClipboard(outputSequence)}
                        className="flex-1"
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Copy
                      </Button>
                      <Button
                        variant="outline"
                        onClick={downloadSequence}
                        className="flex-1"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  )}
                  
                  {outputSequence && (
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>Length: {outputSequence.length} characters</p>
                      {operation === 'translate' && (
                        <p>Amino acids: {outputSequence.replace(/\*/g, '').length}</p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="search" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="border-0 shadow-xl bg-white/90 backdrop-blur">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Search className="h-5 w-5 mr-2 text-blue-600" />
                    Search & Replace
                  </CardTitle>
                  <CardDescription>
                    Find and replace patterns in your sequence
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    placeholder="Enter sequence to search in..."
                    value={inputSequence}
                    onChange={(e) => setInputSequence(e.target.value)}
                    className="min-h-[100px] font-mono text-sm"
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 block">
                        Search Pattern
                      </label>
                      <Input
                        placeholder="e.g., ATG"
                        value={searchPattern}
                        onChange={(e) => setSearchPattern(e.target.value)}
                        className="font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700 mb-1 block">
                        Replace With
                      </label>
                      <Input
                        placeholder="e.g., GTA"
                        value={replacePattern}
                        onChange={(e) => setReplacePattern(e.target.value)}
                        className="font-mono"
                      />
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button onClick={searchInSequence} variant="outline" className="flex-1">
                      <Search className="h-4 w-4 mr-2" />
                      Search
                    </Button>
                    <Button onClick={replaceInSequence} className="flex-1 bg-blue-600 hover:bg-blue-700">
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Replace
                    </Button>
                  </div>
                  
                  {searchResults.length > 0 && (
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm font-medium text-blue-800 mb-2">
                        Found {searchResults.length} matches at positions:
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {searchResults.map((pos, index) => (
                          <Badge key={index} variant="secondary" className="bg-blue-100 text-blue-800">
                            {pos + 1}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-0 shadow-xl bg-white/90 backdrop-blur">
                <CardHeader>
                  <CardTitle>Result</CardTitle>
                  <CardDescription>
                    Modified sequence will appear here
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={outputSequence}
                    readOnly
                    className="min-h-[200px] font-mono text-sm bg-gray-50"
                    placeholder="Modified sequence will appear here..."
                  />
                  
                  {outputSequence && (
                    <div className="flex space-x-2 mt-4">
                      <Button
                        variant="outline"
                        onClick={() => copyToClipboard(outputSequence)}
                        className="flex-1"
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Copy
                      </Button>
                      <Button
                        variant="outline"
                        onClick={downloadSequence}
                        className="flex-1"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="format" className="space-y-6">
            <Card className="border-0 shadow-xl bg-white/90 backdrop-blur">
              <CardHeader>
                <CardTitle>Quick Format Tools</CardTitle>
                <CardDescription>
                  Common sequence formatting and conversion operations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Button
                    variant="outline"
                    onClick={() => { setOperation('format-fasta'); processSequence(); }}
                    className="h-20 flex flex-col items-center justify-center"
                  >
                    <span className="font-medium">FASTA Format</span>
                    <span className="text-xs text-gray-500">Add header & line breaks</span>
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={() => { setOperation('remove-gaps'); processSequence(); }}
                    className="h-20 flex flex-col items-center justify-center"
                  >
                    <span className="font-medium">Remove Gaps</span>
                    <span className="text-xs text-gray-500">Clean alignment gaps</span>
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={() => { setOperation('to-rna'); processSequence(); }}
                    className="h-20 flex flex-col items-center justify-center"
                  >
                    <span className="font-medium">DNA → RNA</span>
                    <span className="text-xs text-gray-500">Convert T to U</span>
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={() => { setOperation('to-dna'); processSequence(); }}
                    className="h-20 flex flex-col items-center justify-center"
                  >
                    <span className="font-medium">RNA → DNA</span>
                    <span className="text-xs text-gray-500">Convert U to T</span>
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={() => { setOperation('reverse-complement'); processSequence(); }}
                    className="h-20 flex flex-col items-center justify-center"
                  >
                    <span className="font-medium">Rev Complement</span>
                    <span className="text-xs text-gray-500">Reverse & complement</span>
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={() => { setOperation('translate'); processSequence(); }}
                    className="h-20 flex flex-col items-center justify-center"
                  >
                    <span className="font-medium">Translate</span>
                    <span className="text-xs text-gray-500">DNA to protein</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Info Section */}
        <Card className="mt-8 border-0 shadow-lg bg-purple-50/50">
          <CardHeader>
            <CardTitle className="text-purple-900">Supported Operations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <h4 className="font-semibold text-purple-800 mb-2">Sequence Processing</h4>
                <ul className="text-sm text-purple-700 space-y-1">
                  <li>• Clean and validate sequences</li>
                  <li>• Reverse and complement</li>
                  <li>• DNA/RNA conversion</li>
                  <li>• Protein translation</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-purple-800 mb-2">Search & Replace</h4>
                <ul className="text-sm text-purple-700 space-y-1">
                  <li>• Pattern searching</li>
                  <li>• Multiple match finding</li>
                  <li>• Global replacement</li>
                  <li>• Position reporting</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-purple-800 mb-2">Format Tools</h4>
                <ul className="text-sm text-purple-700 space-y-1">
                  <li>• FASTA formatting</li>
                  <li>• Gap removal</li>
                  <li>• Line breaking</li>
                  <li>• Header addition</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

    </div>
  );
}