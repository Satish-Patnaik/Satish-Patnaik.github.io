# Dr. Satish Patnaik Baggam - Portfolio Website with Bioinformatics Tools

## MVP Implementation Plan

### Core Files to Create/Modify:

1. **src/pages/Index.tsx** - Main homepage with hero section and navigation
2. **src/pages/About.tsx** - About page with professional background
3. **src/pages/Services.tsx** - Free bioinformatics services overview
4. **src/pages/BioinformaticsAnalysis.tsx** - Bioinformatics analysis tool
5. **src/pages/ImageConverter.tsx** - Image conversion tool (raw to 300 DPI)
6. **src/pages/SequenceMassager.tsx** - DNA/RNA/Protein sequence manipulation tool
7. **src/components/Navigation.tsx** - Main navigation component
8. **src/components/Footer.tsx** - Footer with social links

### Key Features:
- Professional hero section with Dr. Satish's credentials
- Navigation to different tools and services
- Bioinformatics analysis tool (basic sequence analysis)
- Image converter (file upload, resize, DPI conversion)
- Sequence massager (DNA/RNA/Protein sequence tools)
- Links to LinkedIn and GitHub profiles
- Responsive design with modern UI

### Tech Stack:
- React + TypeScript
- Shadcn/UI components
- Tailwind CSS for styling
- File handling for image conversion
- Basic bioinformatics algorithms

### File Relationships:
- App.tsx routes to all pages
- Navigation.tsx used across all pages
- Each tool page is self-contained with its own logic
- Footer.tsx provides consistent social links