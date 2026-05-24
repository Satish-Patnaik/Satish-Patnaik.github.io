import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { BookOpen, Calculator, Dna, BarChart3, Microscope, FlaskConical, ArrowRight, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function BioinformaticsHelp() {
  const quickHelp = [
    {
      icon: <Dna className="h-6 w-6 text-blue-600" />,
      title: "Sequence Analysis",
      description: "DNA, RNA, protein sequence tools and tutorials",
      topics: ["FASTA formatting", "Sequence alignment", "Primer design", "ORF finding"],
      link: "/sequence-massager"
    },
    {
      icon: <BarChart3 className="h-6 w-6 text-green-600" />,
      title: "Data Visualization",
      description: "Create publication-ready plots and figures",
      topics: ["Volcano plots", "Box plots", "Heatmaps", "Statistical charts"],
      link: "/volcano-plot"
    },
    {
      icon: <Calculator className="h-6 w-6 text-purple-600" />,
      title: "Statistical Analysis",
      description: "Statistical methods and calculations",
      topics: ["t-tests", "ANOVA", "Multiple testing", "Effect sizes"],
      link: "/concentration-converter"
    },
    {
      icon: <Microscope className="h-6 w-6 text-orange-600" />,
      title: "qPCR Analysis",
      description: "Real-time PCR data analysis and interpretation",
      topics: ["ΔCt calculations", "Fold change", "Statistical testing", "Primer efficiency"],
      link: "/realtime-pcr"
    }
  ];

  const tutorials = [
    {
      category: "RNA-seq Analysis",
      items: [
        {
          title: "Bulk RNA-seq: From FASTQ to Results",
          description: "Complete workflow for differential gene expression analysis",
          level: "Intermediate",
          time: "45 min read"
        },
        {
          title: "Single-cell RNA-seq Best Practices",
          description: "Quality control, normalization, and clustering",
          level: "Advanced",
          time: "60 min read"
        },
        {
          title: "Pathway Enrichment Analysis",
          description: "GO terms, KEGG pathways, and interpretation",
          level: "Beginner",
          time: "30 min read"
        }
      ]
    },
    {
      category: "Statistical Methods",
      items: [
        {
          title: "Choosing the Right Statistical Test",
          description: "Decision tree for common bioinformatics scenarios",
          level: "Beginner",
          time: "20 min read"
        },
        {
          title: "Multiple Testing Correction",
          description: "FDR, Bonferroni, and when to use each",
          level: "Intermediate",
          time: "25 min read"
        },
        {
          title: "Power Analysis for Experimental Design",
          description: "Sample size calculations and study planning",
          level: "Intermediate",
          time: "35 min read"
        }
      ]
    },
    {
      category: "Molecular Biology",
      items: [
        {
          title: "qPCR Experimental Design",
          description: "Controls, replicates, and data analysis",
          level: "Beginner",
          time: "25 min read"
        },
        {
          title: "Primer Design Guidelines",
          description: "PCR and qPCR primer optimization",
          level: "Beginner",
          time: "20 min read"
        },
        {
          title: "Western Blot Quantification",
          description: "Normalization and statistical analysis",
          level: "Intermediate",
          time: "30 min read"
        }
      ]
    }
  ];

  const faqs = [
    {
      question: "How do I choose between bulk and single-cell RNA-seq?",
      answer: "Bulk RNA-seq gives you average expression across all cells in a sample, making it ideal for comparing conditions or treatments. Single-cell RNA-seq reveals cell-to-cell variability and can identify rare cell types, but is more expensive and complex to analyze. Choose bulk for straightforward comparisons, single-cell for heterogeneity studies."
    },
    {
      question: "What's the minimum sample size for RNA-seq experiments?",
      answer: "For bulk RNA-seq, use at least 3 biological replicates per condition, though 6+ is better for detecting smaller effect sizes. For single-cell RNA-seq, aim for 500-5000 cells per condition depending on expected heterogeneity. Always perform power analysis during experimental design."
    },
    {
      question: "How do I interpret a volcano plot?",
      answer: "Volcano plots show statistical significance (y-axis, -log10 p-value) vs biological significance (x-axis, log2 fold change). Points in the upper corners represent genes that are both statistically significant and have large fold changes. Use thresholds like |log2FC| > 1 and p < 0.05."
    },
    {
      question: "What's the difference between raw and adjusted p-values?",
      answer: "Raw p-values are from individual statistical tests. Adjusted p-values (like FDR or q-values) correct for multiple testing to control false discoveries. Always report adjusted p-values in genomics studies where you test thousands of genes simultaneously."
    },
    {
      question: "How do I choose a reference gene for qPCR?",
      answer: "Reference genes should be stably expressed across your experimental conditions. Common choices include GAPDH, ACTB, and 18S rRNA. Validate stability using tools like geNorm or NormFinder. Use multiple reference genes when possible and avoid genes affected by your treatment."
    },
    {
      question: "What file formats should I use for different analyses?",
      answer: "FASTQ for raw sequencing data, BAM/SAM for aligned reads, VCF for variants, GFF/GTF for annotations, CSV/TSV for count matrices. For sharing: use standard formats and include metadata. Our tools accept most common formats automatically."
    }
  ];

  return (
    <div className="space-y-8">
      {/* Quick Help Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {quickHelp.map((item, index) => (
          <Card key={index} className="border-0 shadow-lg bg-white/80 backdrop-blur hover:shadow-xl transition-all duration-300">
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-3 p-3 bg-gray-50 rounded-full">
                {item.icon}
              </div>
              <CardTitle className="text-lg">{item.title}</CardTitle>
              <CardDescription className="text-sm">
                {item.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                {item.topics.map((topic, topicIndex) => (
                  <Badge key={topicIndex} variant="outline" className="text-xs">
                    {topic}
                  </Badge>
                ))}
              </div>
              <Button asChild variant="outline" className="w-full">
                <Link to={item.link}>
                  Try Tool
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Detailed Help Sections */}
      <Tabs defaultValue="tutorials" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 max-w-md mx-auto">
          <TabsTrigger value="tutorials">Tutorials</TabsTrigger>
          <TabsTrigger value="faqs">FAQs</TabsTrigger>
          <TabsTrigger value="protocols">Protocols</TabsTrigger>
        </TabsList>

        <TabsContent value="tutorials">
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">Step-by-Step Tutorials</h2>
              <p className="text-gray-600">Comprehensive guides for common bioinformatics workflows</p>
            </div>
            
            {tutorials.map((category, categoryIndex) => (
              <Card key={categoryIndex} className="border-0 shadow-lg bg-white/90 backdrop-blur">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BookOpen className="h-5 w-5 mr-2 text-blue-600" />
                    {category.category}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {category.items.map((tutorial, tutorialIndex) => (
                      <div key={tutorialIndex} className="p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                        <h4 className="font-semibold mb-2">{tutorial.title}</h4>
                        <p className="text-sm text-gray-600 mb-3">{tutorial.description}</p>
                        <div className="flex items-center justify-between text-xs">
                          <Badge variant={tutorial.level === 'Beginner' ? 'default' : tutorial.level === 'Intermediate' ? 'secondary' : 'destructive'}>
                            {tutorial.level}
                          </Badge>
                          <span className="text-gray-500">{tutorial.time}</span>
                        </div>
                        <Button variant="ghost" size="sm" className="w-full mt-2">
                          Read Tutorial
                          <ExternalLink className="ml-2 h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="faqs">
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">Frequently Asked Questions</h2>
              <p className="text-gray-600">Quick answers to common bioinformatics questions</p>
            </div>
            
            <Card className="border-0 shadow-lg bg-white/90 backdrop-blur">
              <CardContent className="p-6">
                <Accordion type="single" collapsible className="space-y-2">
                  {faqs.map((faq, index) => (
                    <AccordionItem key={index} value={`item-${index}`} className="border rounded-lg px-4">
                      <AccordionTrigger className="text-left hover:no-underline">
                        {faq.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-gray-700 pb-4">
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="protocols">
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-2">Laboratory Protocols</h2>
              <p className="text-gray-600">Wet lab protocols with computational analysis steps</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border-0 shadow-lg bg-white/90 backdrop-blur">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FlaskConical className="h-5 w-5 mr-2 text-green-600" />
                    RNA Extraction & QC
                  </CardTitle>
                  <CardDescription>
                    From tissue to high-quality RNA with computational QC
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Sample preparation</span>
                      <Badge variant="outline">Wet lab</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">RNA extraction</span>
                      <Badge variant="outline">Wet lab</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Quality assessment</span>
                      <Badge variant="secondary">Computational</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Library preparation QC</span>
                      <Badge variant="secondary">Computational</Badge>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full mt-4">
                    View Protocol
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-white/90 backdrop-blur">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Microscope className="h-5 w-5 mr-2 text-orange-600" />
                    qPCR Setup & Analysis
                  </CardTitle>
                  <CardDescription>
                    Complete qPCR workflow with statistical analysis
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Primer design & validation</span>
                      <Badge variant="secondary">Computational</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Reaction setup</span>
                      <Badge variant="outline">Wet lab</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Data analysis</span>
                      <Badge variant="secondary">Computational</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Statistical testing</span>
                      <Badge variant="secondary">Computational</Badge>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full mt-4">
                    View Protocol
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}