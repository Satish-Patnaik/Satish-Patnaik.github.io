import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Navigation from '@/components/Navigation';
import { Microscope, Github, Linkedin, ArrowRight, Beaker, FileImage, Dna, TrendingUp, BarChart3, BookOpen, IdCard } from 'lucide-react';

export default function Index() {
  const freeServices = [
    {
      icon: <Beaker className="h-8 w-8 text-blue-600" />,
      title: "Bioinformatics Analysis",
      description: "Free sequence analysis, alignment, and computational biology tools",
      href: "/bioinformatics",
    },
    {
      icon: <TrendingUp className="h-8 w-8 text-red-600" />,
      title: "Volcano Plot",
      description: "Publication-ready volcano plots with manual colors and gene labels",
      href: "/volcano-plot",
    },
    {
      icon: <BarChart3 className="h-8 w-8 text-blue-600" />,
      title: "Box Plot Generator",
      description: "Multi-group box plots with statistical analysis for any sample counts",
      href: "/box-plot",
    },
    {
      icon: <FileImage className="h-8 w-8 text-green-600" />,
      title: "Image Converter",
      description: "Convert raw images to 300 DPI with custom dimensions",
      href: "/image-converter",
    },
    {
      icon: <Dna className="h-8 w-8 text-purple-600" />,
      title: "Sequence Massager",
      description: "DNA, RNA, and protein sequence manipulation tools",
      href: "/sequence-massager",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-slate-900">
      <Navigation />

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <div className="max-w-4xl mx-auto">
            <div className="mb-8">
              <div className="w-32 h-32 mx-auto mb-6 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                <Microscope className="h-16 w-16 text-white" />
              </div>
              <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent mb-6">
                Dr. Satish Patnaik, Ph.D
              </h1>
              <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-4">
                Project Scientist | Bioinformatics Specialist
              </p>
              <p className="text-lg text-gray-500 dark:text-gray-400 mb-8 max-w-2xl mx-auto">
                Free in-browser bioinformatics tools for the research community, built and shared openly.
                Always open to research collaboration on computational biology, sequence analysis, and data visualization.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700">
                <Link to="/tools">
                  Explore the tools
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" className="bg-purple-600 hover:bg-purple-700">
                <Link to="/contact">
                  Collaborate with me
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/about">About me</Link>
              </Button>
            </div>

            <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
              <Button variant="ghost" size="lg" asChild className="text-blue-600 hover:text-blue-700">
                <a href="https://linkedin.com/in/dr-satish-patnaik-baggam-259b7ba9" target="_blank" rel="noopener noreferrer">
                  <Linkedin className="h-6 w-6 mr-2" />
                  LinkedIn
                </a>
              </Button>
              <Button variant="ghost" size="lg" asChild className="text-gray-700 hover:text-gray-900 dark:text-gray-300 dark:hover:text-gray-100">
                <a href="https://github.com/Satish-Patnaik" target="_blank" rel="noopener noreferrer">
                  <Github className="h-6 w-6 mr-2" />
                  GitHub
                </a>
              </Button>
              <Button variant="ghost" size="lg" asChild className="text-green-700 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300">
                <a href="https://orcid.org/0000-0001-8240-6191" target="_blank" rel="noopener noreferrer">
                  <IdCard className="h-6 w-6 mr-2" />
                  ORCID
                </a>
              </Button>
              <Button variant="ghost" size="lg" asChild className="text-purple-700 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300">
                <a href="https://scholar.google.com/citations?user=Gc2_Oj8AAAAJ&hl=en" target="_blank" rel="noopener noreferrer">
                  <BookOpen className="h-6 w-6 mr-2" />
                  Scholar
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Free Services Section */}
      <section className="py-16 px-4 bg-white/50 dark:bg-gray-900/30">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              Free Bioinformatics Tools
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Open-source, in-browser tools for sequence analysis, plotting, and lab calculations. No accounts, no data leaves your computer.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {freeServices.map((service, index) => (
              <Card key={index} className="group hover:shadow-xl transition-all duration-300 border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur">
                <CardHeader className="text-center">
                  <div className="mx-auto mb-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-full group-hover:scale-110 transition-transform duration-300">
                    {service.icon}
                  </div>
                  <CardTitle className="text-lg font-semibold">{service.title}</CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-300 text-sm">
                    {service.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <Button asChild variant="outline" className="group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <Link to={service.href}>
                      Try Now
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-white/50 dark:bg-gray-900/30">
        <div className="container mx-auto text-center">
          <div className="max-w-3xl mx-auto bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white">
            <h2 className="text-3xl font-bold mb-4">
              Open to research collaboration
            </h2>
            <p className="text-lg mb-6 opacity-90">
              All the tools on this site are free and run entirely in your browser. If you'd like to discuss research, share data ideas, or co-author on a project, send me a note.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" variant="secondary">
                <Link to="/tools">
                  Browse the tools
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-blue-600">
                <a href="mailto:satishbiochem1@gmail.com">
                  Email me
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
