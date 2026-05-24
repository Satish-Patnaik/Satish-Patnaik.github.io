import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Send, Bot, User, X, Minimize2, Maximize2, Dna, FlaskConical, Calculator, ExternalLink } from 'lucide-react';

interface Message {
  id: string;
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
}

export default function AIChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'bot',
      content: "👋 Hello! I'm your AI bioinformatics assistant. I can help with:\n\n🧬 Sequence analysis & alignment\n🔬 Molecular biology protocols\n📊 Statistical analysis\n🧮 Laboratory calculations\n📈 Data interpretation\n📚 Step-by-step tutorials\n\nJust type 'hello' or ask any question to get started!",
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Enhanced AI response system
  const getAIResponse = (userMessage: string): string => {
    const message = userMessage.toLowerCase().trim();
    
    // Greeting responses
    if (message === 'hello' || message === 'hi' || message === 'hey') {
      return "Hello! 👋 Great to meet you! I'm here to help with all your bioinformatics and molecular biology questions.\n\n🎯 **What would you like to explore today?**\n\n• **RNA-seq Analysis** - Complete workflows from FASTQ to results\n• **PCR & Primer Design** - Optimization and troubleshooting\n• **Statistical Analysis** - Choosing the right tests\n• **Protocol Help** - Step-by-step laboratory procedures\n• **Data Visualization** - Creating publication-ready plots\n\nJust ask me anything or try: 'Show me RNA-seq tutorial' or 'Help with PCR primers'";
    }

    // Tutorial requests
    if (message.includes('tutorial') || message.includes('step by step') || message.includes('guide')) {
      if (message.includes('rna-seq') || message.includes('rnaseq')) {
        return "📚 **RNA-seq Analysis Tutorial**\n\n**Step-by-Step Workflow:**\n\n1️⃣ **Quality Control**\n   • FastQC for read quality assessment\n   • MultiQC for summary reports\n   📖 [FastQC Tutorial](https://github.com/s-andrews/FastQC)\n\n2️⃣ **Read Trimming**\n   • Trim Galore for adapter removal\n   • Cutadapt for quality trimming\n   📖 [Trim Galore Guide](https://github.com/FelixKrueger/TrimGalore)\n\n3️⃣ **Alignment**\n   • STAR for spliced alignment\n   • HISAT2 as alternative\n   📖 [STAR Manual](https://github.com/alexdobin/STAR)\n\n4️⃣ **Quantification**\n   • featureCounts for gene counting\n   • Salmon for transcript quantification\n   📖 [Subread Package](https://github.com/ShiLab-Bioinformatics/subread)\n\n5️⃣ **Differential Expression**\n   • DESeq2 in R for DE analysis\n   • edgeR as alternative\n   📖 [DESeq2 Workflow](https://github.com/thelovelab/DESeq2)\n\nWould you like me to explain any specific step in detail?";
      }
      
      if (message.includes('single cell') || message.includes('scrna')) {
        return "📚 **Single-Cell RNA-seq Tutorial**\n\n**Complete scRNA-seq Pipeline:**\n\n1️⃣ **Data Preprocessing**\n   • Cell Ranger for 10X data processing\n   • Quality control metrics\n   📖 [Cell Ranger](https://github.com/10XGenomics/cellranger)\n\n2️⃣ **Quality Control**\n   • Filter low-quality cells\n   • Remove doublets\n   📖 [Seurat QC Guide](https://github.com/satijalab/seurat)\n\n3️⃣ **Normalization**\n   • Log-normalization\n   • SCTransform for variance stabilization\n   📖 [SCTransform](https://github.com/ChristophH/sctransform)\n\n4️⃣ **Dimensionality Reduction**\n   • PCA for initial reduction\n   • UMAP/t-SNE for visualization\n   📖 [UMAP Python](https://github.com/lmcinnes/umap)\n\n5️⃣ **Clustering & Annotation**\n   • Leiden clustering\n   • Cell type identification\n   📖 [Scanpy Tutorial](https://github.com/scverse/scanpy)\n\nNeed help with a specific analysis step?";
      }
      
      if (message.includes('pcr') || message.includes('primer')) {
        return "📚 **PCR & Primer Design Tutorial**\n\n**Step-by-Step PCR Optimization:**\n\n1️⃣ **Primer Design**\n   • Length: 18-25 nucleotides\n   • Tm: 55-65°C\n   • GC content: 40-60%\n   📖 [Primer3 Tool](https://github.com/primer3-org/primer3)\n\n2️⃣ **PCR Setup**\n   • Template: 10-100 ng\n   • Primers: 0.1-1 μM each\n   • dNTPs: 200 μM each\n   📖 [PCR Protocols](https://github.com/openwetware/protocols)\n\n3️⃣ **Thermal Cycling**\n   • Denaturation: 95°C, 30 sec\n   • Annealing: Tm-5°C, 30 sec\n   • Extension: 72°C, 1 min/kb\n   📖 [PCR Optimization](https://github.com/molecular-biology/pcr-optimization)\n\n4️⃣ **Troubleshooting**\n   • No product: Check primers, template\n   • Multiple bands: Optimize annealing temp\n   • Smearing: Reduce cycles, check template\n\nTry our free primer design tool on the website!";
      }
      
      return "📚 **Available Tutorials:**\n\n🧬 **Bioinformatics:**\n• RNA-seq analysis workflow\n• Single-cell RNA-seq pipeline\n• Sequence alignment methods\n• Pathway enrichment analysis\n\n🔬 **Molecular Biology:**\n• PCR optimization guide\n• qPCR data analysis\n• Protein expression protocols\n• Western blot quantification\n\n📊 **Statistics:**\n• Choosing statistical tests\n• Multiple testing correction\n• Power analysis for experiments\n\nWhich tutorial interests you? Just ask: 'Show me [topic] tutorial'";
    }

    // Specific technique questions
    if (message.includes('blast') || message.includes('alignment')) {
      return "🔍 **BLAST & Sequence Alignment**\n\n**BLAST Search Strategy:**\n• **blastn**: DNA vs DNA database\n• **blastp**: Protein vs protein database\n• **blastx**: DNA vs protein database\n• **tblastn**: Protein vs translated DNA\n\n**Key Parameters:**\n• E-value < 1e-5 for significance\n• Word size: 11 (DNA), 3 (protein)\n• Gap penalties: -11,-1 (DNA)\n\n**Multiple Alignment Tools:**\n📖 [MUSCLE](https://github.com/rcedgar/muscle) - Fast, accurate alignment\n📖 [MAFFT](https://github.com/GSLBiotech/mafft) - Large dataset alignment\n📖 [ClustalW](https://github.com/GSLBiotech/clustalw2) - Classic alignment tool\n\nNeed help interpreting BLAST results?";
    }

    if (message.includes('statistics') || message.includes('p-value') || message.includes('statistical test')) {
      return "📊 **Statistical Analysis Guide**\n\n**Choosing the Right Test:**\n\n🔢 **Continuous Data:**\n• 2 groups: t-test (parametric) or Mann-Whitney U (non-parametric)\n• >2 groups: ANOVA or Kruskal-Wallis\n• Paired data: Paired t-test or Wilcoxon signed-rank\n\n🧮 **Count Data (RNA-seq):**\n• DESeq2: Negative binomial model\n• edgeR: Quasi-likelihood F-test\n• limma-voom: Linear modeling\n\n**Multiple Testing Correction:**\n• Bonferroni: Conservative (FWER control)\n• FDR (Benjamini-Hochberg): Less conservative\n• q-value: Similar to FDR\n\n📖 **R Resources:**\n• [Statistical Tests in R](https://github.com/rstudio/cheatsheets)\n• [Bioconductor Workflows](https://github.com/Bioconductor/bioconductor.org)\n\nWhat type of data are you analyzing?";
    }

    if (message.includes('concentration') || message.includes('molarity') || message.includes('dilution')) {
      return "🧮 **Laboratory Calculations**\n\n**Molarity Formula:**\nM = moles / volume (L)\nM = (mass in g) / (MW × volume in L)\n\n**Common Conversions:**\n• 1 M = 1000 mM = 1,000,000 μM\n• 1 mg/mL = 1000 μg/mL\n• For DNA: 1 μg/μL ≈ 1.5 μM (assuming 330 bp average)\n\n**Dilution Formula:**\nC₁V₁ = C₂V₂\n\n**Serial Dilutions:**\n• 1:10 series: 1, 0.1, 0.01, 0.001 M\n• 1:2 series: 1, 0.5, 0.25, 0.125 M\n\n📖 [Lab Math Guide](https://github.com/laboratory-calculations/lab-math)\n\nTry our free concentration converter tool!";
    }

    if (message.includes('qpcr') || message.includes('real-time pcr') || message.includes('ct value')) {
      return "🔬 **qPCR Analysis Guide**\n\n**Data Processing:**\n• ΔCt = Ct(target) - Ct(reference)\n• ΔΔCt = ΔCt(sample) - ΔCt(control)\n• Fold Change = 2^(-ΔΔCt)\n\n**Quality Control:**\n• Ct values < 35 (preferably < 30)\n• Efficiency: 90-110% (slope: -3.1 to -3.6)\n• R² > 0.99 for standard curves\n\n**Reference Genes:**\n• GAPDH, ACTB, 18S rRNA\n• Validate stability with geNorm/NormFinder\n• Use multiple reference genes when possible\n\n**Statistical Analysis:**\n• Minimum 3 biological replicates\n• Use appropriate tests (t-test, ANOVA)\n• Apply multiple testing correction\n\n📖 [qPCR Guidelines](https://github.com/qpcr-analysis/guidelines)\n\nTry our free qPCR analysis tool!";
    }

    // Default helpful response
    return "I'm here to help! 🤖 Here are some things you can ask me:\n\n🔬 **Techniques:**\n• 'How do I design PCR primers?'\n• 'Explain RNA-seq workflow'\n• 'Help with statistical tests'\n• 'Calculate molarity'\n\n📚 **Tutorials:**\n• 'Show me RNA-seq tutorial'\n• 'Single-cell analysis guide'\n• 'PCR troubleshooting steps'\n\n🧮 **Calculations:**\n• 'Convert mg/mL to molarity'\n• 'Serial dilution calculator'\n• 'qPCR fold change formula'\n\n💡 **Quick Tips:**\n• Ask specific questions for detailed help\n• Mention your organism/system for targeted advice\n• Request step-by-step protocols\n\nWhat would you like to know?";
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputValue;
    setInputValue('');
    setIsTyping(true);

    // Simulate AI thinking time
    setTimeout(() => {
      const aiResponse = getAIResponse(currentInput);
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content: aiResponse,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
      setIsTyping(false);
    }, 800 + Math.random() * 1200); // 0.8-2 second delay
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const quickQuestions = [
    { icon: <Dna className="h-4 w-4" />, text: "hello", category: "Start Here" },
    { icon: <FlaskConical className="h-4 w-4" />, text: "Show me RNA-seq tutorial", category: "Tutorial" },
    { icon: <Calculator className="h-4 w-4" />, text: "Help with PCR primers", category: "Protocol" }
  ];

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg animate-pulse"
          size="lg"
        >
          <MessageCircle className="h-6 w-6 mr-2" />
          AI Help
        </Button>
      </div>
    );
  }

  return (
    <div className={`fixed bottom-6 right-6 z-50 transition-all duration-300 ${isMinimized ? 'w-80' : 'w-96'}`}>
      <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <Bot className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-lg">AI Bioinformatics Assistant</CardTitle>
                <Badge variant="secondary" className="text-xs">Free • Instant Help</Badge>
              </div>
            </div>
            <div className="flex items-center space-x-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMinimized(!isMinimized)}
              >
                {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        {!isMinimized && (
          <CardContent className="p-0">
            {/* Quick Questions */}
            <div className="p-4 border-b bg-blue-50">
              <p className="text-sm font-medium text-blue-900 mb-2">Quick start:</p>
              <div className="space-y-2">
                {quickQuestions.map((q, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    className="w-full justify-start text-left h-auto p-2"
                    onClick={() => {
                      setInputValue(q.text);
                      setTimeout(() => handleSendMessage(), 100);
                    }}
                  >
                    <div className="flex items-center space-x-2">
                      {q.icon}
                      <div>
                        <div className="text-sm">{q.text}</div>
                        <div className="text-xs text-gray-500">{q.category}</div>
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            </div>

            {/* Messages */}
            <div className="h-80 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-lg p-3 ${
                      message.type === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <div className="flex items-start space-x-2">
                      {message.type === 'bot' && (
                        <Bot className="h-4 w-4 mt-0.5 text-blue-600 flex-shrink-0" />
                      )}
                      {message.type === 'user' && (
                        <User className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      )}
                      <div className="flex-1">
                        <div className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</div>
                        <div className={`text-xs mt-1 ${
                          message.type === 'user' ? 'text-blue-100' : 'text-gray-500'
                        }`}>
                          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 rounded-lg p-3 max-w-[80%]">
                    <div className="flex items-center space-x-2">
                      <Bot className="h-4 w-4 text-blue-600" />
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t">
              <div className="flex space-x-2">
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type 'hello' to start or ask any question..."
                  className="flex-1"
                  disabled={isTyping}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || isTyping}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                💡 Try: 'hello', 'RNA-seq tutorial', 'PCR help', 'statistics guide'
              </p>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}