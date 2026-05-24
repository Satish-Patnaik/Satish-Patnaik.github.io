import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Navigation from '@/components/Navigation';
import { Beaker, FileImage, Dna, TrendingUp, BarChart3, ArrowRight, Info } from 'lucide-react';

export default function Services() {
  const services = [
    {
      icon: <Beaker className="h-12 w-12 text-blue-600" />,
      title: "Bioinformatics Analysis",
      description: "Comprehensive sequence analysis tools including GC content calculation, sequence translation, and alignment utilities.",
      features: ["DNA/RNA/Protein sequence analysis", "GC content calculation", "Sequence translation", "Basic alignment tools"],
      href: "/bioinformatics",
      color: "blue"
    },
    {
      icon: <TrendingUp className="h-12 w-12 text-red-600" />,
      title: "Volcano Plot Generator",
      description: "Create publication-ready volcano plots with customizable colors, gene labels, and high-DPI export options.",
      features: ["Top N gene labeling (10, 20, 50)", "Separate up/down-regulated gene lists", "Custom color schemes", "300+ DPI export (PNG, JPEG, TIFF)"],
      href: "/volcano-plot",
      color: "red"
    },
    {
      icon: <BarChart3 className="h-12 w-12 text-green-600" />,
      title: "Box & Violin Plot Generator",
      description: "Generate statistical plots for multi-group comparisons with customizable visualizations and export options.",
      features: ["Toggle between Box/Violin plots", "Multiple color palettes", "Statistical testing options", "300 DPI export (PNG, JPEG, TIFF, PDF)"],
      href: "/box-plot",
      color: "green"
    },
    {
      icon: <FileImage className="h-12 w-12 text-purple-600" />,
      title: "Image Converter",
      description: "Convert raw images to publication-ready 300 DPI format with custom dimensions for journals and presentations.",
      features: ["300 DPI conversion", "Custom dimensions", "Multiple format support", "Batch processing"],
      href: "/image-converter",
      color: "purple"
    },
    {
      icon: <Dna className="h-12 w-12 text-orange-600" />,
      title: "Sequence Massager",
      description: "Advanced DNA, RNA, and protein sequence manipulation tools for research and analysis workflows.",
      features: ["Sequence formatting", "Find & replace operations", "Case conversion", "Sequence validation"],
      href: "/sequence-massager",
      color: "orange"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Navigation />
      
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-6">
            Free Bioinformatics Tools
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Access professional-grade bioinformatics tools completely free. Perfect for researchers, students, and professionals 
            working in computational biology, genomics, and data analysis.
          </p>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 max-w-4xl mx-auto mb-8">
            <div className="flex items-start space-x-3">
              <Info className="h-6 w-6 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-left">
                <h3 className="font-semibold text-blue-900 mb-2">Enhanced Features Available</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• <strong>Volcano Plot:</strong> Top N gene labeling, separate gene lists, high-DPI export</li>
                  <li>• <strong>Box/Violin Plot:</strong> Toggle plot types, color palettes, statistical testing</li>
                  <li>• <strong>All Tools:</strong> 300+ DPI export options for publication-ready figures</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
          {services.map((service, index) => (
            <Card key={index} className="group hover:shadow-2xl transition-all duration-300 border-0 bg-white/90 backdrop-blur overflow-hidden">
              <CardHeader className="text-center pb-4">
                <div className={`mx-auto mb-4 p-4 bg-${service.color}-50 rounded-full group-hover:scale-110 transition-transform duration-300`}>
                  {service.icon}
                </div>
                <CardTitle className="text-2xl font-bold text-gray-900">{service.title}</CardTitle>
                <CardDescription className="text-gray-600 text-base">
                  {service.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Key Features:</h4>
                  <ul className="space-y-2">
                    {service.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-start text-sm text-gray-600">
                        <div className={`w-2 h-2 bg-${service.color}-500 rounded-full mr-3 mt-2 flex-shrink-0`}></div>
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div className="pt-4">
                  <Button asChild className={`w-full bg-${service.color}-600 hover:bg-${service.color}-700 group-hover:shadow-lg transition-all duration-300`}>
                    <Link to={service.href}>
                      Try {service.title}
                      <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Citation and Usage Info */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card className="border-0 shadow-xl bg-gradient-to-br from-blue-600 to-blue-700 text-white">
            <CardHeader>
              <CardTitle className="text-2xl">Citing these tools</CardTitle>
              <CardDescription className="text-blue-100">
                If they help your research, please cite us.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-blue-800/50 p-4 rounded-lg">
                <p className="text-sm text-blue-100 mb-2">Suggested citation:</p>
                <p className="font-mono text-white bg-blue-900/50 p-3 rounded text-sm">
                  Patnaik Baggam, S. SatishBio bioinformatics tools (2026). https://github.com/Satish-Patnaik
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl bg-gradient-to-br from-purple-600 to-purple-700 text-white">
            <CardHeader>
              <CardTitle className="text-2xl">Open to collaboration</CardTitle>
              <CardDescription className="text-purple-100">
                Research conversations welcome.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-purple-100">
                Want to discuss methodology, share data, or co-author? Drop me an email.
              </p>
              <Button asChild variant="secondary" size="lg" className="w-full">
                <Link to="/contact">
                  Get in touch
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

    </div>
  );
}