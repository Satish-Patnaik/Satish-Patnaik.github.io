import { Github, Linkedin, Mail } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-xl font-bold mb-4">Dr. Satish Patnaik, Ph.D</h3>
            <p className="text-gray-300 mb-4">
              Project Scientist specializing in bioinformatics, computational biology, and data analysis.
            </p>
            <div className="flex space-x-4">
              <a
                href="https://www.linkedin.com/in/dr-satish-patnaik-baggam-ph-d-259b7ba9/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-300 hover:text-white transition-colors"
              >
                <Linkedin className="h-5 w-5" />
              </a>
              <a
                href="https://github.com/Satish-Patnaik"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-300 hover:text-white transition-colors"
              >
                <Github className="h-5 w-5" />
              </a>
              <a
                href="mailto:satishbiochem1@gmail.com"
                className="text-gray-300 hover:text-white transition-colors"
              >
                <Mail className="h-5 w-5" />
              </a>
            </div>
          </div>
          
          <div>
            <h4 className="text-lg font-semibold mb-4">Free Tools</h4>
            <ul className="space-y-2 text-gray-300">
              <li><a href="/bioinformatics" className="hover:text-white transition-colors">Sequence Analysis</a></li>
              <li><a href="/volcano-plot" className="hover:text-white transition-colors">Volcano Plot</a></li>
              <li><a href="/box-plot" className="hover:text-white transition-colors">Box & Violin Plot</a></li>
              <li><a href="/image-converter" className="hover:text-white transition-colors">Image Converter</a></li>
              <li><a href="/sequence-massager" className="hover:text-white transition-colors">Sequence Tools</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-lg font-semibold mb-4">Connect</h4>
            <ul className="space-y-2 text-gray-300">
              <li><a href="/about" className="hover:text-white transition-colors">About Dr. Satish</a></li>
              <li><a href="/contact" className="hover:text-white transition-colors">Contact</a></li>
              <li><a href="https://orcid.org/0000-0001-8240-6191" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">ORCID</a></li>
              <li><a href="https://scholar.google.com/citations?user=Gc2_Oj8AAAAJ&amp;hl=en" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Google Scholar</a></li>
              <li><a href="https://github.com/Satish-Patnaik" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">GitHub</a></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-700 mt-8 pt-8">
          <div className="text-center">
            <h4 className="text-lg font-semibold mb-4 text-yellow-400">Disclaimer</h4>
            <div className="text-gray-300 text-sm space-y-2 max-w-4xl mx-auto">
              <p>These tools are provided free of charge for educational and research purposes only.</p>
              <p>Results are automatically generated and should be independently validated before being used in publications, clinical work, regulatory submissions, or any critical decision-making.</p>
              <p>The developer is not responsible for misuse, errors, omissions, or misinterpretation of results.</p>
              <p>No data is stored. All processing happens locally in your browser.</p>
            </div>
          </div>
        </div>
        
        <div className="border-t border-gray-700 mt-8 pt-8 text-center">
          <p className="text-gray-400 text-sm">
            © 2024 Dr. Satish Patnaik, Ph.D. All rights reserved. | 
            <a href="mailto:satishbiochem1@gmail.com" className="text-blue-400 hover:text-blue-300 ml-1">
              Contact for collaboration
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;