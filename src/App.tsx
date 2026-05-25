import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ThemeProvider from '@/components/ThemeProvider';
import Footer from '@/components/Footer';
import Index from './pages/Index';
import About from './pages/About';
import Tools from './pages/Tools';
import Services from './pages/Services';
import BioinformaticsAnalysis from './pages/BioinformaticsAnalysis';
import VolcanoPlot from './pages/VolcanoPlot';
import BoxPlot from './pages/BoxPlot';
import ImageConverter from './pages/ImageConverter';
import SequenceMassager from './pages/SequenceMassager';
import ConcentrationConverter from './pages/ConcentrationConverter';
import RealTimePCR from './pages/RealTimePCR';
import BioinformaticsHelpPage from './pages/BioinformaticsHelp';
import Contact from './pages/Contact';
import OrfFinder from './pages/OrfFinder';
import PrimerDesigner from './pages/PrimerDesigner';
import PairwiseAlignment from './pages/PairwiseAlignment';
import HeatmapPCA from './pages/HeatmapPCA';

const queryClient = new QueryClient();

const App = () => {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/about" element={<About />} />
              <Route path="/tools" element={<Tools />} />
              <Route path="/services" element={<Services />} />
              <Route path="/bioinformatics-analysis" element={<BioinformaticsAnalysis />} />
              <Route path="/bioinformatics" element={<BioinformaticsAnalysis />} />
              <Route path="/volcano-plot" element={<VolcanoPlot />} />
              <Route path="/box-plot" element={<BoxPlot />} />
              <Route path="/image-converter" element={<ImageConverter />} />
              <Route path="/sequence-massager" element={<SequenceMassager />} />
              <Route path="/concentration-converter" element={<ConcentrationConverter />} />
              <Route path="/realtime-pcr" element={<RealTimePCR />} />
              <Route path="/bioinformatics-help" element={<BioinformaticsHelpPage />} />
              <Route path="/help" element={<BioinformaticsHelpPage />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/orf-finder" element={<OrfFinder />} />
              <Route path="/primer-designer" element={<PrimerDesigner />} />
              <Route path="/pairwise-alignment" element={<PairwiseAlignment />} />
              <Route path="/heatmap-pca" element={<HeatmapPCA />} />
              <Route
                path="*"
                element={
                  <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-slate-900 text-center px-4">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-3">Page not found</h1>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">That route doesn't exist on this site.</p>
                    <a href="/" className="text-blue-600 dark:text-blue-400 hover:underline">← Back to home</a>
                  </div>
                }
              />
            </Routes>
            <Footer />
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
};

export default App;
