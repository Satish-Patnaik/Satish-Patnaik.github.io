import Navigation from '@/components/Navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { BookOpen, MessageCircle, Users, Zap, ExternalLink } from 'lucide-react';

export default function BioinformaticsHelpPage() {
  const basicInfo = [
    {
      icon: <BookOpen className="h-8 w-8 text-blue-600" />,
      title: 'Bulk RNA-seq Analysis',
      description: 'Differential gene expression analysis from raw FASTQ files',
      basics: [
        'Quality control with FastQC',
        'Read alignment using STAR/HISAT2',
        'Gene quantification with featureCounts',
        'Statistical analysis using DESeq2/edgeR',
        'Pathway enrichment analysis',
      ],
      tutorialLink: 'https://bioconductor.org/packages/release/bioc/vignettes/DESeq2/inst/doc/DESeq2.html#standard-workflow',
      tutorialTitle: 'DESeq2 Standard Workflow Tutorial',
    },
    {
      icon: <Zap className="h-8 w-8 text-green-600" />,
      title: 'Single-cell RNA-seq',
      description: 'Cell-level transcriptome analysis and clustering',
      basics: [
        'Quality control and cell filtering',
        'Normalization and scaling',
        'Dimensionality reduction (PCA, UMAP)',
        'Cell clustering and annotation',
        'Trajectory analysis',
      ],
      tutorialLink: 'https://satijalab.org/seurat/articles/get_started_v5_new',
      tutorialTitle: 'Seurat v5 Getting Started Tutorial',
    },
    {
      icon: <Users className="h-8 w-8 text-purple-600" />,
      title: 'PCR & qPCR Analysis',
      description: 'Primer design and quantitative PCR data analysis',
      basics: [
        'Primer design guidelines (18-25 bp, Tm 55-65 °C)',
        'ΔCt and ΔΔCt calculations',
        'Fold change analysis (2^-ΔΔCt)',
        'Statistical significance testing',
        'Reference gene validation',
      ],
    },
    {
      icon: <MessageCircle className="h-8 w-8 text-orange-600" />,
      title: 'Statistical Methods',
      description: 'Choosing appropriate tests for biological data',
      basics: [
        't-test for 2-group comparisons',
        'ANOVA for multiple groups',
        'Non-parametric alternatives',
        'Multiple testing correction (FDR)',
        'Effect size interpretation',
      ],
    },
  ];

  const quickFAQs = [
    {
      question: "What's the minimum sample size for RNA-seq?",
      answer: 'At least 3 biological replicates per condition. For detecting smaller effects, use 6+ replicates.',
    },
    {
      question: 'How do I choose between bulk and single-cell RNA-seq?',
      answer: 'Bulk RNA-seq for average expression changes; single-cell for cell heterogeneity and rare cell types.',
    },
    {
      question: 'What p-value threshold should I use?',
      answer: 'Use adjusted p-value (FDR) < 0.05 for genomics studies. Always correct for multiple testing.',
    },
    {
      question: 'How do I design good PCR primers?',
      answer: '18-25 bp length, Tm 55-65 °C, 40-60% GC content, avoid secondary structures and primer dimers.',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-slate-900">
      <Navigation />

      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-green-100 text-green-800 hover:bg-green-200">Free Learning Resources</Badge>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Bioinformatics &amp; Molecular Biology Help
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Background on common bioinformatics techniques, with curated tutorial links and quick FAQs.
            Want to discuss something specific? <a href="/contact" className="text-blue-600 dark:text-blue-400 hover:underline">Get in touch</a>.
          </p>
        </div>

        <Tabs defaultValue="basics" className="space-y-8">
          <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto">
            <TabsTrigger value="basics">Basic Info</TabsTrigger>
            <TabsTrigger value="faqs">Quick FAQs</TabsTrigger>
          </TabsList>

          <TabsContent value="basics">
            <div className="space-y-8">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-gray-100">Basic Bioinformatics Information</h2>
                <p className="text-gray-600 dark:text-gray-400">Essential knowledge for common analysis workflows</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {basicInfo.map((item, index) => (
                  <Card key={index} className="border-0 shadow-xl bg-white/90 dark:bg-gray-900/80 backdrop-blur">
                    <CardHeader className="text-center">
                      <div className="mx-auto mb-4 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-full">{item.icon}</div>
                      <CardTitle className="text-xl">{item.title}</CardTitle>
                      <CardDescription>{item.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Key steps:</h4>
                          {item.basics.map((step, stepIndex) => (
                            <div key={stepIndex} className="flex items-start space-x-2 mb-2">
                              <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                              <span className="text-sm text-gray-700 dark:text-gray-300">{step}</span>
                            </div>
                          ))}
                        </div>

                        {item.tutorialLink && (
                          <div className="pt-4 border-t dark:border-gray-700">
                            <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">📚 Detailed Tutorial:</h4>
                            <Button asChild variant="outline" className="w-full">
                              <a href={item.tutorialLink} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center">
                                <ExternalLink className="h-4 w-4 mr-2" />
                                {item.tutorialTitle}
                              </a>
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="faqs">
            <div className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-gray-100">Frequently Asked Questions</h2>
                <p className="text-gray-600 dark:text-gray-400">Quick answers to common questions</p>
              </div>

              <Card className="border-0 shadow-xl bg-white/90 dark:bg-gray-900/80 backdrop-blur max-w-4xl mx-auto">
                <CardContent className="p-6">
                  <Accordion type="single" collapsible className="space-y-2">
                    {quickFAQs.map((faq, index) => (
                      <AccordionItem key={index} value={`item-${index}`} className="border rounded-lg px-4">
                        <AccordionTrigger className="text-left hover:no-underline">{faq.question}</AccordionTrigger>
                        <AccordionContent className="text-gray-700 dark:text-gray-300 pb-4">{faq.answer}</AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        <div className="mt-16 text-center bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white">
          <h2 className="text-3xl font-bold mb-4">Want to discuss something specific?</h2>
          <p className="text-lg mb-6 opacity-90">
            Drop me a note for research-related questions, methodology discussions, or collaboration ideas.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" variant="secondary">
              <a href="mailto:satishbiochem1@gmail.com">Email Dr. Satish</a>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-blue-600">
              <a href="/tools">Browse All Tools</a>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
