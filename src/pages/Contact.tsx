import Navigation from '@/components/Navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Mail, MessageSquare, Linkedin, Github, BookOpen, IdCard } from 'lucide-react';

const RECIPIENT_EMAIL = 'satishbiochem1@gmail.com';

export default function Contact() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-slate-900">
      <Navigation />

      <div className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-blue-100 text-blue-800 hover:bg-blue-200">Open to Collaboration</Badge>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Get in touch
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Always happy to discuss research, share ideas, or collaborate on bioinformatics projects.
            Drop me an email and I'll get back to you.
          </p>
        </div>

        <div className="max-w-2xl mx-auto space-y-6">
          <Card className="border-0 shadow-xl bg-white/90 dark:bg-gray-900/80 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center">
                <MessageSquare className="h-6 w-6 mr-2 text-blue-600" />
                Let's connect
              </CardTitle>
              <CardDescription>
                For research collaborations, methodology discussions, or feedback on the tools on this site.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <a
                href={`mailto:${RECIPIENT_EMAIL}`}
                className="flex items-start space-x-4 group"
              >
                <Mail className="h-6 w-6 text-blue-600 mt-1" />
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">Email</h3>
                  <p className="text-blue-600 dark:text-blue-400 group-hover:underline">{RECIPIENT_EMAIL}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Best way to reach me</p>
                </div>
              </a>

              <Button asChild size="lg" className="w-full">
                <a href={`mailto:${RECIPIENT_EMAIL}?subject=Bioinformatics%20collaboration`}>
                  <Mail className="h-4 w-4 mr-2" />
                  Email me directly
                </a>
              </Button>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl bg-white/90 dark:bg-gray-900/80 backdrop-blur">
            <CardHeader>
              <CardTitle>Also on</CardTitle>
              <CardDescription>Profiles, code, and publications.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" asChild>
                  <a href="https://www.linkedin.com/in/dr-satish-patnaik-baggam-ph-d-259b7ba9/" target="_blank" rel="noopener noreferrer">
                    <Linkedin className="h-4 w-4 mr-2" />
                    LinkedIn
                  </a>
                </Button>
                <Button variant="outline" asChild>
                  <a href="https://github.com/Satish-Patnaik" target="_blank" rel="noopener noreferrer">
                    <Github className="h-4 w-4 mr-2" />
                    GitHub
                  </a>
                </Button>
                <Button variant="outline" asChild>
                  <a href="https://orcid.org/0000-0001-8240-6191" target="_blank" rel="noopener noreferrer">
                    <IdCard className="h-4 w-4 mr-2" />
                    ORCID
                  </a>
                </Button>
                <Button variant="outline" asChild>
                  <a href="https://scholar.google.com/citations?user=Gc2_Oj8AAAAJ&hl=en" target="_blank" rel="noopener noreferrer">
                    <BookOpen className="h-4 w-4 mr-2" />
                    Google Scholar
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-3">Topics I'm happy to discuss</h3>
              <ul className="space-y-1.5 text-sm">
                <li>• Bulk and single-cell RNA-seq analysis</li>
                <li>• Multi-omics data integration</li>
                <li>• Ocular biology, retina, lens, meibomian gland</li>
                <li>• Method choices for differential expression, clustering, plotting</li>
                <li>• Using or extending the free tools on this site</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
