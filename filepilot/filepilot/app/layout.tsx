export const runtime = 'edge';

import type { Metadata } from 'next';
import { Syne } from 'next/font/google';
// @ts-ignore: allow side-effect CSS import without type declarations
import './globals.css';

// 1. Configure the font and create a CSS variable
const syne = Syne({ 
  subsets: ['latin'], 
  variable: '--font-syne',
  weight: ['400', '500', '600', '700'] 
});

// 2. Comprehensive Global SEO Metadata for norehq.com
export const metadata: Metadata = {
  metadataBase: new URL('https://norehq.com'),

  title: {
    default: 'NoreHQ — Custom Software Development, AI Automation & Web Platforms | Software Studio',
    template: '%s | NoreHQ',
  },

  description:
    'NoreHQ is a next-generation software studio founded by ALOK K L, DHANANJAY MOHAN, RAM MADHAV M, and KIRAN P MANOJ. We engineer bespoke web platforms, AI-powered automations, SaaS products, GPU-accelerated analytics, and full-stack business tools that eliminate operational friction and accelerate revenue growth for startups and enterprises worldwide.',

  keywords: [
    // — Brand & Identity —
    'NoreHQ', 'Nore HQ', 'nore hq', 'norehq', 'norehq.com', 'Nore Studio', 'Nore Agency', 'nore agency',
    'NoreHQ software studio', 'NoreHQ software development', 'NoreHQ web development',

    // — Team: ALOK K L —
    'ALOK K L', 'ALOK K L developer', 'ALOK K L software engineer', 'ALOK K L full stack developer',
    'ALOK K L portfolio', 'ALOK K L projects', 'ALOK K L NoreHQ', 'ALOK K L engineer',
    'ALOK K L web developer', 'ALOK K L AI developer', 'ALOK K L open source',
    'ALOK K L Trivandrum', 'ALOK K L India developer', 'ALOK K L startup',
    'ALOK K L software', 'ALOK K L technology',

    // — Team: DHANANJAY MOHAN —
    'DHANANJAY MOHAN', 'DHANANJAY MOHAN developer', 'DHANANJAY MOHAN software engineer',
    'DHANANJAY MOHAN portfolio', 'DHANANJAY MOHAN projects', 'DHANANJAY MOHAN NoreHQ',
    'DHANANJAY MOHAN full stack developer', 'DHANANJAY MOHAN open source',
    'DHANANJAY MOHAN Chrome extension developer', 'DHANANJAY MOHAN engineer',
    'DHANANJAY MOHAN web developer', 'DHANANJAY MOHAN India developer',

    // — Team: RAM MADHAV M —
    'RAM MADHAV M', 'RAM MADHAV M developer', 'RAM MADHAV M software engineer',
    'RAM MADHAV M portfolio', 'RAM MADHAV M projects', 'RAM MADHAV M NoreHQ',
    'RAM MADHAV M full stack developer', 'RAM MADHAV M open source',
    'RAM MADHAV M engineer', 'RAM MADHAV M web developer', 'RAM MADHAV M India developer',

    // — Team: KIRAN P MANOJ —
    'KIRAN P MANOJ', 'KIRAN P MANOJ developer', 'KIRAN P MANOJ software engineer',
    'KIRAN P MANOJ portfolio', 'KIRAN P MANOJ projects', 'KIRAN P MANOJ NoreHQ',
    'KIRAN P MANOJ full stack developer', 'KIRAN P MANOJ open source',
    'KIRAN P MANOJ engineer', 'KIRAN P MANOJ web developer', 'KIRAN P MANOJ India developer',

    // — Core Services —
    'custom software development', 'AI automation agency', 'web application development',
    'full stack development', 'SaaS development', 'enterprise software solutions',
    'bespoke web platforms', 'business process automation', 'workflow automation',
    'digital transformation services', 'MVP development', 'startup software development',
    'scalable web applications', 'cloud-native development', 'serverless architecture',

    // — AI & Machine Learning —
    'AI integration services', 'machine learning solutions', 'GPU-accelerated analytics',
    'computer vision applications', 'YOLO object detection', 'TensorRT inference',
    'Ollama AI integration', 'Llama 3 implementation', 'local AI deployment',
    'real-time video analytics', 'multi-stream GPU processing', 'AI-powered dashboards',
    'predictive analytics', 'natural language processing', 'AI chatbot development',

    // — Technology Stack —
    'React development', 'Next.js development', 'Node.js backend', 'PostgreSQL database',
    'Supabase development', 'Tailwind CSS', 'TypeScript development', 'Python development',
    'CUDA programming', 'Vite applications', 'Chrome extension development', 'Manifest V3',

    // — Products & Projects —
    'VAULT 5.0 business analytics', 'CIVIC EYE grievance system', 'FilePilot client portal',
    'GPU Allocator video analytics', 'Toolbox Extension productivity', 'open source software',
    'fleet management system', 'bus fee management system', 'public grievance platform',

    // — Industry & Budget —
    'affordable software development', 'budget friendly web development', 'cost effective tech solutions',
    'professional web development agency', 'best software agency India', 'top web developers India',
    'software development company Kerala', 'Trivandrum tech startup', 'Indian software engineers',
    'freelance full stack developers', 'hire AI developers',
  ],

  icons: {
    icon: '/favicon.png',
    apple: '/favicon.png',
  },

  authors: [
    { name: 'ALOK K L', url: 'https://norehq.com' },
    { name: 'DHANANJAY MOHAN', url: 'https://norehq.com' },
    { name: 'RAM MADHAV M', url: 'https://norehq.com' },
    { name: 'KIRAN P MANOJ', url: 'https://norehq.com' },
  ],
  creator: 'NoreHQ Team',
  publisher: 'NoreHQ',

  alternates: {
    canonical: 'https://norehq.com',
  },

  openGraph: {
    title: 'NoreHQ — Custom Software Development, AI Automation & Web Platforms',
    description:
      'NoreHQ is a next-generation software studio by ALOK K L, DHANANJAY MOHAN, RAM MADHAV M, and KIRAN P MANOJ. We build bespoke web platforms, AI automations, SaaS products, and GPU-accelerated analytics that drive real business growth.',
    url: 'https://norehq.com',
    siteName: 'NoreHQ',
    type: 'website',
    locale: 'en_US',
    images: [
      {
        url: 'https://norehq.com/opengraph-image.png',
        width: 1200,
        height: 630,
        alt: 'NoreHQ — Software Studio by ALOK K L, DHANANJAY MOHAN, RAM MADHAV M & KIRAN P MANOJ',
      },
    ],
  },

  twitter: {
    card: 'summary_large_image',
    site: '@norehq_',
    creator: '@norehq_',
    title: 'NoreHQ — Custom Software Development, AI Automation & Web Platforms',
    description:
      'Next-generation software studio by ALOK K L, DHANANJAY MOHAN, RAM MADHAV M & KIRAN P MANOJ. Bespoke web platforms, AI automations, SaaS products, and GPU analytics.',
    images: ['https://norehq.com/twitter-image.png'],
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },

  category: 'technology',
};


// 3. Root Layout Structure with JSON-LD Structured Data
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {

  // JSON-LD: Organization Schema
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'NoreHQ',
    alternateName: ['Nore Studio', 'Nore Agency', 'Nore HQ'],
    url: 'https://norehq.com',
    logo: 'https://norehq.com/favicon.png',
    description:
      'NoreHQ is a next-generation software studio founded by ALOK K L, DHANANJAY MOHAN, RAM MADHAV M, and KIRAN P MANOJ. We engineer bespoke web platforms, AI-powered automations, and full-stack business tools.',
    foundingDate: '2024',
    founders: [
      {
        '@type': 'Person',
        name: 'ALOK K L',
        jobTitle: 'Founder & Lead Engineer',
        url: 'https://norehq.com',
        sameAs: [
          'https://github.com/ALOK-K-L',
          'https://www.linkedin.com/in/nore-hq-529aa2412/',
        ],
        knowsAbout: [
          'Full Stack Development', 'AI Automation', 'React', 'Next.js', 'Node.js',
          'PostgreSQL', 'Python', 'CUDA', 'YOLO', 'TensorRT', 'GPU Programming',
          'Machine Learning', 'Supabase', 'SaaS Development',
        ],
      },
      {
        '@type': 'Person',
        name: 'DHANANJAY MOHAN',
        jobTitle: 'Co-Founder & Software Engineer',
        url: 'https://norehq.com',
        sameAs: [
          'https://github.com/djvu2k6',
        ],
        knowsAbout: [
          'Chrome Extension Development', 'Manifest V3', 'JavaScript', 'Web Development',
          'Productivity Tools', 'Browser APIs', 'DOM Manipulation', 'UI/UX Design',
        ],
      },
      {
        '@type': 'Person',
        name: 'RAM MADHAV M',
        jobTitle: 'Co-Founder & Software Engineer',
        url: 'https://norehq.com',
        knowsAbout: [
          'Full Stack Development', 'Web Development', 'JavaScript', 'React',
          'Node.js', 'Software Engineering',
        ],
      },
      {
        '@type': 'Person',
        name: 'KIRAN P MANOJ',
        jobTitle: 'Co-Founder & Software Engineer',
        url: 'https://norehq.com',
        knowsAbout: [
          'Full Stack Development', 'Web Development', 'JavaScript', 'React',
          'Node.js', 'Software Engineering',
        ],
      },
    ],
    sameAs: [
      'https://x.com/norehq_',
      'https://github.com/nore-hq',
      'https://www.linkedin.com/in/nore-hq-529aa2412/',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'business inquiries',
      url: 'https://norehq.com/#contact',
    },
    knowsAbout: [
      'Custom Software Development', 'AI Automation', 'Web Application Development',
      'GPU-Accelerated Analytics', 'SaaS Products', 'Full Stack Engineering',
      'Client Portal Systems', 'Business Intelligence Dashboards',
    ],
  };

  // JSON-LD: Website Schema (for sitelinks search box)
  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'NoreHQ',
    alternateName: 'Nore HQ',
    url: 'https://norehq.com',
    description: 'Next-generation software studio by ALOK K L, DHANANJAY MOHAN, RAM MADHAV M, and KIRAN P MANOJ.',
    publisher: {
      '@type': 'Organization',
      name: 'NoreHQ',
    },
  };

  // JSON-LD: Professional Service Schema
  const serviceSchema = {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    name: 'NoreHQ Software Studio',
    url: 'https://norehq.com',
    description:
      'Custom software development, AI automation, and web platform engineering by ALOK K L, DHANANJAY MOHAN, RAM MADHAV M, and KIRAN P MANOJ.',
    priceRange: '$$',
    areaServed: {
      '@type': 'Place',
      name: 'Worldwide',
    },
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Software Development Services',
      itemListElement: [
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Custom Web Application Development',
            description: 'Bespoke full-stack web applications built with React, Next.js, Node.js, and PostgreSQL.',
          },
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'AI & Machine Learning Integration',
            description: 'AI-powered automations, GPU-accelerated video analytics, and intelligent dashboards using YOLO, TensorRT, and Ollama.',
          },
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'SaaS Product Development',
            description: 'End-to-end SaaS platform development including multi-tenant architecture, real-time sync, and role-based access control.',
          },
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Chrome Extension Development',
            description: 'Manifest V3 browser extensions for productivity and workflow optimization.',
          },
        },
      ],
    },
  };

  return (
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <head>
        {/* JSON-LD Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }}
        />
      </head>
      <body className={`bg-parchment antialiased ${syne.variable} relative`}>
        {children}
      </body>
    </html>
  );
}