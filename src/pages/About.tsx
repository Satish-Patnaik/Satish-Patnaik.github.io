import Navigation from '@/components/Navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Microscope, BarChart3, Github, Linkedin, Mail, Eye, FlaskConical, Database, Dna, BookOpen, IdCard } from 'lucide-react';

export default function About() {
  const expertise = [
    {
      icon: <Eye className="h-8 w-8 text-blue-600" />,
      title: "Ocular Biology Research",
      description: "Multi-omics studies of retina, lens, and meibomian gland biology",
      skills: ["Meibomian gland dysfunction", "Lens cell heterogeneity", "Age-related eye disease", "Cohort-scale genomics"]
    },
    {
      icon: <Dna className="h-8 w-8 text-green-600" />,
      title: "Single-cell & Spatial Transcriptomics",
      description: "Advanced genomics techniques for cellular resolution analysis",
      skills: ["Single-cell RNA-seq", "Spatial transcriptomics", "Bulk RNA-seq", "Whole-exome sequencing"]
    },
    {
      icon: <FlaskConical className="h-8 w-8 text-purple-600" />,
      title: "Experimental Biology",
      description: "Comprehensive wet lab expertise across molecular biology techniques",
      skills: ["Cell culture", "Microscopy", "Immunoassays", "Biochemical assays", "Metabolomics"]
    },
    {
      icon: <Database className="h-8 w-8 text-orange-600" />,
      title: "Computational Analysis",
      description: "Reproducible pipelines for complex biological data analysis",
      skills: ["R/Python programming", "Statistical analysis", "Data visualization", "Pipeline development"]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Navigation />
      
      <div className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-blue-100 text-blue-800 hover:bg-blue-200">
            Project Scientist • UC Irvine
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Dr. Satish Patnaik Baggam
          </h1>
          <p className="text-xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
            Project Scientist at UC Irvine specializing in multi-omics studies of ocular biology. 
            Expert in single-cell transcriptomics, experimental design, and computational analysis 
            for complex biological systems.
          </p>
        </div>

        {/* Professional Background */}
        <Card className="mb-12 border-0 shadow-xl bg-white/90 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center">
              <Microscope className="h-6 w-6 mr-2 text-blue-600" />
              Professional Background
            </CardTitle>
          </CardHeader>
          <CardContent className="prose prose-lg max-w-none text-gray-700 leading-relaxed">
            <p className="mb-4">
              I'm a Project Scientist at the University of California, Irvine, studying the retina, lens, and meibomian gland through multi-omics. My work spans genetics and molecular biology across bulk and single-cell transcriptomics. Recent projects center on meibomian gland dysfunction and lens cell heterogeneity. I design experiments, analyze complex datasets, and turn results into publication-ready findings that teams can act on.
            </p>
            <p className="mb-4">
              Before UCI, I was a Postdoctoral Scholar at UCLA, working on single-cell and spatial transcriptomics of the ocular lens and cohort-scale genomics of age-related eye disease. I'm fluent at the bench and the keyboard: cell culture, microscopy, immuno/biochemical assays, bulk and single-cell RNA-seq, whole-exome sequencing, metabolomics, and downstream analysis in R/Python. I build reproducible pipelines for sequence analysis, visualization, and statistics, and I share practical tools so other labs can move faster.
            </p>
            <p className="font-medium text-blue-900">
              Working on a complex disease in any area of biology? I can help with study design, rigorous analysis, and publication-ready figures.
            </p>
          </CardContent>
        </Card>

        {/* Expertise Areas */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-center mb-8">Areas of Expertise</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {expertise.map((area, index) => (
              <Card key={index} className="border-0 shadow-xl bg-white/90 backdrop-blur hover:shadow-2xl transition-all duration-300">
                <CardHeader className="text-center">
                  <div className="mx-auto mb-4 p-3 bg-gray-50 rounded-full">
                    {area.icon}
                  </div>
                  <CardTitle className="text-xl">{area.title}</CardTitle>
                  <CardDescription className="text-base">{area.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {area.skills.map((skill, skillIndex) => (
                      <Badge key={skillIndex} variant="secondary" className="text-sm">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Technical Skills */}
        <Card className="mb-12 border-0 shadow-xl bg-white/90 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center">
              <BarChart3 className="h-6 w-6 mr-2 text-purple-600" />
              Technical Skills
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <h3 className="text-lg font-semibold mb-3 text-blue-900">Experimental Techniques</h3>
                <ul className="space-y-2 text-gray-700">
                  <li>• Cell culture & microscopy</li>
                  <li>• Immunoassays & biochemical assays</li>
                  <li>• RNA-seq library preparation</li>
                  <li>• Metabolomics sample prep</li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-3 text-green-900">Genomics & Omics</h3>
                <ul className="space-y-2 text-gray-700">
                  <li>• Single-cell RNA-seq</li>
                  <li>• Spatial transcriptomics</li>
                  <li>• Bulk RNA-seq</li>
                  <li>• Whole-exome sequencing</li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-3 text-purple-900">Computational Analysis</h3>
                <ul className="space-y-2 text-gray-700">
                  <li>• R & Python programming</li>
                  <li>• Statistical analysis & modeling</li>
                  <li>• Data visualization</li>
                  <li>• Reproducible pipeline development</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Connect Section */}
        <div className="text-center bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white">
          <h2 className="text-3xl font-bold mb-4">Let's Collaborate</h2>
          <p className="text-lg mb-6 opacity-90">
            Ready to advance your research with expert bioinformatics analysis and experimental design?
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" variant="secondary">
              <a href="mailto:satishbiochem1@gmail.com">
                <Mail className="h-5 w-5 mr-2" />
                Email Me
              </a>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-white bg-transparent text-white hover:bg-white hover:text-blue-600">
              <a href="https://www.linkedin.com/in/dr-satish-patnaik-baggam-ph-d-259b7ba9/" target="_blank" rel="noopener noreferrer">
                <Linkedin className="h-5 w-5 mr-2" />
                LinkedIn
              </a>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-white bg-transparent text-white hover:bg-white hover:text-blue-600">
              <a href="https://github.com/Satish-Patnaik" target="_blank" rel="noopener noreferrer">
                <Github className="h-5 w-5 mr-2" />
                GitHub
              </a>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-white bg-transparent text-white hover:bg-white hover:text-blue-600">
              <a href="https://orcid.org/0000-0001-8240-6191" target="_blank" rel="noopener noreferrer">
                <IdCard className="h-5 w-5 mr-2" />
                ORCID
              </a>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-white bg-transparent text-white hover:bg-white hover:text-blue-600">
              <a href="https://scholar.google.com/citations?user=Gc2_Oj8AAAAJ&hl=en" target="_blank" rel="noopener noreferrer">
                <BookOpen className="h-5 w-5 mr-2" />
                Google Scholar
              </a>
            </Button>
          </div>
        </div>
      </div>

    </div>
  );
}