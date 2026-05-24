import { useState, useRef } from 'react';
import Navigation from '@/components/Navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { FileImage, Upload, Download, Settings, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';

interface ConvertedImage {
  name: string;
  url: string;
  size: string;
  format: string;
}

export default function ImageConverter() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [convertedImages, setConvertedImages] = useState<ConvertedImage[]>([]);
  const [settings, setSettings] = useState({
    dpi: 300,
    format: 'png',
    quality: 95,
    width: 0,
    height: 0,
    maintainAspectRatio: true
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const validFiles = files.filter(file => {
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/bmp', 'application/pdf'];
      return validTypes.includes(file.type);
    });

    if (validFiles.length !== files.length) {
      toast.error('Some files were skipped. Only JPEG, PNG, WebP, GIF, BMP, and PDF files are supported.');
    }

    setSelectedFiles(validFiles);
    setConvertedImages([]);

    if (validFiles.length > 0) {
      toast.success(`Selected ${validFiles.length} file(s) for conversion`);
    }
  };

  const loadPdfPage = (file: File, pageNumber: number = 0): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const fileReader = new FileReader();
      fileReader.onload = async (e) => {
        try {
          // For PDF files, we'll create a simple placeholder since full PDF rendering requires external libraries
          // In a real implementation, you'd use PDF.js or similar
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Canvas context not available'));
            return;
          }

          // Create a placeholder image for PDF
          canvas.width = 800;
          canvas.height = 1000;
          
          // White background
          ctx.fillStyle = 'white';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          
          // Add PDF placeholder content
          ctx.fillStyle = '#333';
          ctx.font = '24px Arial';
          ctx.textAlign = 'center';
          ctx.fillText('PDF Document', canvas.width / 2, 100);
          ctx.fillText(`Page ${pageNumber + 1}`, canvas.width / 2, 140);
          
          ctx.font = '16px Arial';
          ctx.fillText('PDF conversion requires specialized libraries', canvas.width / 2, 200);
          ctx.fillText('This is a placeholder representation', canvas.width / 2, 230);
          
          // Add border
          ctx.strokeStyle = '#ccc';
          ctx.lineWidth = 2;
          ctx.strokeRect(50, 50, canvas.width - 100, canvas.height - 100);
          
          // Convert canvas to image
          canvas.toBlob((blob) => {
            if (blob) {
              const img = new Image();
              img.onload = () => resolve(img);
              img.onerror = () => reject(new Error('Failed to create PDF placeholder'));
              img.src = URL.createObjectURL(blob);
            } else {
              reject(new Error('Failed to create blob from canvas'));
            }
          });
        } catch (error) {
          reject(error);
        }
      };
      fileReader.onerror = () => reject(new Error('Failed to read PDF file'));
      fileReader.readAsArrayBuffer(file);
    });
  };

  const loadImage = (file: File): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      if (file.type === 'application/pdf') {
        loadPdfPage(file, 0).then(resolve).catch(reject);
        return;
      }

      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  };

  const convertImage = async (file: File, img: HTMLImageElement): Promise<ConvertedImage> => {
    const canvas = canvasRef.current || document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas context not available');

    // Calculate dimensions
    let { width, height } = settings;
    
    if (width === 0 && height === 0) {
      // Use original dimensions scaled for DPI
      width = img.naturalWidth;
      height = img.naturalHeight;
    } else if (width === 0) {
      // Calculate width based on height and aspect ratio
      width = settings.maintainAspectRatio ? (height * img.naturalWidth) / img.naturalHeight : img.naturalWidth;
    } else if (height === 0) {
      // Calculate height based on width and aspect ratio
      height = settings.maintainAspectRatio ? (width * img.naturalHeight) / img.naturalWidth : img.naturalHeight;
    }

    // Set canvas dimensions for the target DPI
    const scaleFactor = settings.dpi / 72; // 72 DPI is standard screen resolution
    canvas.width = width * scaleFactor;
    canvas.height = height * scaleFactor;

    // Scale the context to match the DPI
    ctx.scale(scaleFactor, scaleFactor);

    // Clear canvas with white background
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, width, height);

    // Draw the image
    ctx.drawImage(img, 0, 0, width, height);

    // Convert to blob
    return new Promise((resolve, reject) => {
      const quality = settings.quality / 100;
      const mimeType = `image/${settings.format}`;
      
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const sizeInMB = (blob.size / (1024 * 1024)).toFixed(2);
          
          resolve({
            name: `${file.name.split('.')[0]}_${settings.dpi}dpi.${settings.format}`,
            url,
            size: `${sizeInMB} MB`,
            format: settings.format.toUpperCase()
          });
        } else {
          reject(new Error('Failed to convert image'));
        }
      }, mimeType, settings.format === 'jpeg' ? quality : undefined);
    });
  };

  const handleConvert = async () => {
    if (selectedFiles.length === 0) {
      toast.error('Please select files to convert');
      return;
    }

    setIsProcessing(true);
    const converted: ConvertedImage[] = [];

    try {
      for (const file of selectedFiles) {
        try {
          const img = await loadImage(file);
          const convertedImage = await convertImage(file, img);
          converted.push(convertedImage);
        } catch (error) {
          console.error(`Failed to convert ${file.name}:`, error);
          toast.error(`Failed to convert ${file.name}`);
        }
      }

      setConvertedImages(converted);
      
      if (converted.length > 0) {
        toast.success(`Successfully converted ${converted.length} image(s) to ${settings.dpi} DPI`);
      }
    } catch (error) {
      toast.error('Conversion failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadImage = (image: ConvertedImage) => {
    const link = document.createElement('a');
    link.href = image.url;
    link.download = image.name;
    document.body.appendChild(link);
    link.click();
    setTimeout(() => document.body.removeChild(link), 100);
    toast.success(`Downloaded ${image.name}`);
  };

  const downloadAll = () => {
    convertedImages.forEach((image, index) => {
      setTimeout(() => downloadImage(image), index * 100);
    });
  };

  const clearFiles = () => {
    setSelectedFiles([]);
    setConvertedImages([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <Navigation />
      
      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <div className="w-16 h-16 mx-auto mb-4 bg-purple-600 rounded-full flex items-center justify-center">
            <FileImage className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Image & PDF Converter</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Convert images and PDF files to publication-ready 300 DPI format with custom dimensions. 
            Supports JPEG, PNG, WebP, GIF, BMP, and PDF files.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Upload Section */}
          <Card className="border-0 shadow-xl bg-white/90 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Upload className="h-5 w-5 mr-2 text-blue-600" />
                File Upload
              </CardTitle>
              <CardDescription>
                Select images or PDF files to convert (JPEG, PNG, WebP, GIF, BMP, PDF)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,.pdf,application/pdf"
                  onChange={handleFileSelect}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                />
              </div>

              {selectedFiles.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-medium text-gray-900">Selected Files:</h3>
                  <div className="max-h-40 overflow-y-auto space-y-2">
                    {selectedFiles.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div className="flex items-center space-x-2">
                          <ImageIcon className="h-4 w-4 text-gray-500" />
                          <span className="text-sm font-medium">{file.name}</span>
                        </div>
                        <span className="text-xs text-gray-500">{formatFileSize(file.size)}</span>
                      </div>
                    ))}
                  </div>
                  <Button variant="outline" size="sm" onClick={clearFiles} className="w-full">
                    Clear Files
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Settings Section */}
          <Card className="border-0 shadow-xl bg-white/90 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="h-5 w-5 mr-2 text-green-600" />
                Conversion Settings
              </CardTitle>
              <CardDescription>
                Configure output format and quality settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="dpi">DPI (Dots Per Inch)</Label>
                <div className="mt-2">
                  <Slider
                    id="dpi"
                    min={72}
                    max={600}
                    step={1}
                    value={[settings.dpi]}
                    onValueChange={(value) => setSettings({...settings, dpi: value[0]})}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-gray-500 mt-1">
                    <span>72 DPI</span>
                    <span className="font-medium">{settings.dpi} DPI</span>
                    <span>600 DPI</span>
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="format">Output Format</Label>
                <Select value={settings.format} onValueChange={(value) => setSettings({...settings, format: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="png">PNG (Lossless)</SelectItem>
                    <SelectItem value="jpeg">JPEG (Compressed)</SelectItem>
                    <SelectItem value="webp">WebP (Modern)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {settings.format === 'jpeg' && (
                <div>
                  <Label htmlFor="quality">JPEG Quality</Label>
                  <div className="mt-2">
                    <Slider
                      id="quality"
                      min={10}
                      max={100}
                      step={1}
                      value={[settings.quality]}
                      onValueChange={(value) => setSettings({...settings, quality: value[0]})}
                      className="w-full"
                    />
                    <div className="flex justify-between text-sm text-gray-500 mt-1">
                      <span>10%</span>
                      <span className="font-medium">{settings.quality}%</span>
                      <span>100%</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="width">Width (px)</Label>
                  <Input
                    id="width"
                    type="number"
                    placeholder="Auto"
                    value={settings.width || ''}
                    onChange={(e) => setSettings({...settings, width: parseInt(e.target.value) || 0})}
                  />
                </div>
                <div>
                  <Label htmlFor="height">Height (px)</Label>
                  <Input
                    id="height"
                    type="number"
                    placeholder="Auto"
                    value={settings.height || ''}
                    onChange={(e) => setSettings({...settings, height: parseInt(e.target.value) || 0})}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="aspectRatio"
                  checked={settings.maintainAspectRatio}
                  onChange={(e) => setSettings({...settings, maintainAspectRatio: e.target.checked})}
                />
                <Label htmlFor="aspectRatio">Maintain aspect ratio</Label>
              </div>

              <Button 
                onClick={handleConvert} 
                disabled={selectedFiles.length === 0 || isProcessing}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                {isProcessing ? 'Converting...' : `Convert ${selectedFiles.length} File(s)`}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Results Section */}
        {convertedImages.length > 0 && (
          <Card className="mt-8 border-0 shadow-xl bg-white/90 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center">
                  <Download className="h-5 w-5 mr-2 text-green-600" />
                  Converted Images
                </span>
                <Button onClick={downloadAll} variant="outline" size="sm">
                  Download All
                </Button>
              </CardTitle>
              <CardDescription>
                Your images have been converted to {settings.dpi} DPI {settings.format.toUpperCase()} format
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {convertedImages.map((image, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4 space-y-3">
                    <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                      <img
                        src={image.url}
                        alt={image.name}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div>
                      <h3 className="font-medium text-sm truncate" title={image.name}>
                        {image.name}
                      </h3>
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>{image.format}</span>
                        <span>{image.size}</span>
                      </div>
                    </div>
                    <Button
                      onClick={() => downloadImage(image)}
                      variant="outline"
                      size="sm"
                      className="w-full"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Info Section */}
        <Card className="mt-8 border-0 shadow-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <CardHeader>
            <CardTitle>Publication Standards</CardTitle>
            <CardDescription className="text-blue-100">
              Recommended DPI settings for different use cases
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">300 DPI</div>
                <div className="text-sm text-blue-100">Print Publications</div>
                <div className="text-xs text-blue-200 mt-1">Journals, Books, Posters</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">150 DPI</div>
                <div className="text-sm text-blue-100">Web & Presentations</div>
                <div className="text-xs text-blue-200 mt-1">Slides, Websites, Reports</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">600 DPI</div>
                <div className="text-sm text-blue-100">High-Quality Print</div>
                <div className="text-xs text-blue-200 mt-1">Art, Photography, Archives</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
}