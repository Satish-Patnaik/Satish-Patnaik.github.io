import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, Dna } from 'lucide-react';
import ThemeToggle from './ThemeToggle';

export default function Navigation() {
  const location = useLocation();

  const navItems = [
    { name: 'Home', path: '/' },
    { name: 'About', path: '/about' },
    { name: 'Tools', path: '/tools' },
    { name: 'Help', path: '/bioinformatics-help' },
    { name: 'Contact', path: '/contact' },
  ];

  return (
    <nav className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800 sticky top-0 z-40">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <Dna className="h-8 w-8 text-blue-600" />
            <span className="text-xl font-bold text-gray-900 dark:text-gray-100">SatishBio</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`text-sm font-medium transition-colors hover:text-blue-600 ${
                  location.pathname === item.path
                    ? 'text-blue-600 border-b-2 border-blue-600 pb-4'
                    : 'text-gray-700 dark:text-gray-300'
                }`}
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* Right side: theme toggle + mobile menu */}
          <div className="flex items-center space-x-4">
            <ThemeToggle />

            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="md:hidden" aria-label="Open menu">
                  <Menu className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80">
                <div className="flex flex-col space-y-4 mt-8">
                  {navItems.map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`text-lg font-medium transition-colors hover:text-blue-600 ${
                        location.pathname === item.path
                          ? 'text-blue-600'
                          : 'text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {item.name}
                    </Link>
                  ))}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
}
