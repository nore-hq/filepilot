export const runtime = 'edge';
import type { Metadata } from 'next';

// ─── Comprehensive SEO for FilePilot (filepilot.norehq.com) ───
export const metadata: Metadata = {
  title: 'FilePilot — Free Secure Client Portal for Editors & Creators | Built at NoreHQ',
  description:
    'FilePilot is a free, professional-grade client portal built by the NoreHQ team — ALOK K L, DHANANJAY MOHAN, RAM MADHAV M, and KIRAN P MANOJ. Designed for video editors, freelancers, and creative agencies — securely share files, manage projects, communicate via real-time chat, and send direct download links. No subscription required.',

  keywords: [
    // — Product Brand —
    'FilePilot', 'FilePilot NoreHQ', 'FilePilot by ALOK K L', 'filepilot.norehq.com',
    'FilePilot client portal', 'FilePilot free', 'FilePilot web service',
    'FilePilot file sharing', 'FilePilot project management',

    // — Team: ALOK K L —
    'ALOK K L', 'ALOK K L developer', 'ALOK K L software engineer', 'ALOK K L full stack developer',
    'ALOK K L portfolio', 'ALOK K L projects', 'ALOK K L NoreHQ', 'ALOK K L FilePilot',
    'ALOK K L web developer', 'ALOK K L SaaS developer', 'ALOK K L open source developer',
    'ALOK K L startup', 'ALOK K L India developer', 'ALOK K L Trivandrum',

    // — Team: DHANANJAY MOHAN —
    'DHANANJAY MOHAN', 'DHANANJAY MOHAN developer', 'DHANANJAY MOHAN NoreHQ',
    'DHANANJAY MOHAN software engineer', 'DHANANJAY MOHAN projects',

    // — Team: RAM MADHAV M —
    'RAM MADHAV M', 'RAM MADHAV M developer', 'RAM MADHAV M NoreHQ',
    'RAM MADHAV M software engineer', 'RAM MADHAV M projects',

    // — Team: KIRAN P MANOJ —
    'KIRAN P MANOJ', 'KIRAN P MANOJ developer', 'KIRAN P MANOJ NoreHQ',
    'KIRAN P MANOJ software engineer', 'KIRAN P MANOJ projects',

    // — Core Features & Use Cases —
    'free client portal', 'free file sharing portal', 'client management portal',
    'video editor client portal', 'freelancer client portal', 'agency client portal',
    'secure file sharing', 'encrypted file delivery', 'large file transfer free',
    'project management for editors', 'real-time chat portal', 'direct download links',
    'white-label client portal', 'multi-tenant portal', 'custom subdomain portal',

    // — Industry Targeting —
    'video editor tools', 'freelancer tools', 'creative agency software',
    'content creator management', 'media delivery platform', 'video transfer service',
    'post-production file delivery', 'wedding videographer portal',
    'YouTube creator management', 'social media manager tools',

    // — Technology —
    'Next.js client portal', 'Supabase real-time', 'PostgreSQL web app',
    'Tailwind CSS application', 'role-based access control', 'real-time database sync',

    // — Competitive & Comparison —
    'Wetransfer alternative free', 'Dropbox alternative for clients',
    'client portal software free', 'best free file sharing for freelancers',
    'SuiteDash alternative', 'Dubsado alternative free', 'HoneyBook alternative',
    'free project management tool', 'best client portal 2026',
  ],

  authors: [
    { name: 'ALOK K L', url: 'https://norehq.com' },
    { name: 'DHANANJAY MOHAN', url: 'https://norehq.com' },
    { name: 'RAM MADHAV M', url: 'https://norehq.com' },
    { name: 'KIRAN P MANOJ', url: 'https://norehq.com' },
  ],
  creator: 'NoreHQ Team',
  publisher: 'NoreHQ',

  alternates: {
    canonical: 'https://filepilot.norehq.com',
  },

  openGraph: {
    title: 'FilePilot — Free Secure Client Portal for Editors & Creators',
    description:
      'Built by ALOK K L, DHANANJAY MOHAN, RAM MADHAV M, and KIRAN P MANOJ at NoreHQ. FilePilot is a free, professional client portal for video editors, freelancers, and agencies. Securely share files, manage projects, chat in real-time, and send direct links — no subscription needed.',
    url: 'https://filepilot.norehq.com',
    siteName: 'FilePilot by NoreHQ',
    type: 'website',
    locale: 'en_US',
  },

  twitter: {
    card: 'summary_large_image',
    site: '@norehq_',
    creator: '@norehq_',
    title: 'FilePilot — Free Client Portal for Editors & Creators | NoreHQ',
    description:
      'Free client portal by ALOK K L, DHANANJAY MOHAN, RAM MADHAV M & KIRAN P MANOJ. Secure file sharing, real-time chat, project management for freelancers and agencies.',
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
};

// JSON-LD Structured Data for FilePilot
const filePilotSchema = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'FilePilot',
  alternateName: 'FilePilot by NoreHQ',
  url: 'https://filepilot.norehq.com',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web Browser',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
    description: 'Free to use — no subscription required.',
  },
  description:
    'FilePilot is a free, professional-grade client portal built by ALOK K L, DHANANJAY MOHAN, RAM MADHAV M, and KIRAN P MANOJ at NoreHQ. Designed for video editors, freelancers, and creative agencies to securely share files, manage projects, and communicate via real-time chat.',
  author: {
    '@type': 'Person',
    name: 'ALOK K L',
    url: 'https://norehq.com',
    jobTitle: 'Founder & Lead Engineer',
    affiliation: {
      '@type': 'Organization',
      name: 'NoreHQ',
      url: 'https://norehq.com',
    },
  },
  provider: {
    '@type': 'Organization',
    name: 'NoreHQ',
    url: 'https://norehq.com',
  },
  featureList: [
    'Secure file sharing & delivery',
    'Real-time chat messaging',
    'Project progress tracking',
    'Role-based access control (Editor & Client)',
    'Custom subdomain white-labeling',
    'Direct download links',
    'Multi-tenant architecture',
  ],
  screenshot: 'https://norehq.com/filepilot.png',
  softwareVersion: '1.0',
  datePublished: '2026-01-01',
};

const creatorSchema = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: 'ALOK K L',
  url: 'https://norehq.com',
  jobTitle: 'Founder & Lead Software Engineer',
  description:
    'ALOK K L is a full-stack developer and startup founder who builds AI-powered platforms, GPU-accelerated analytics systems, and open-source software at NoreHQ alongside DHANANJAY MOHAN, RAM MADHAV M, and KIRAN P MANOJ.',
  affiliation: {
    '@type': 'Organization',
    name: 'NoreHQ',
    url: 'https://norehq.com',
  },
  sameAs: [
    'https://github.com/ALOK-K-L',
    'https://norehq.com',
    'https://x.com/norehq_',
    'https://www.linkedin.com/in/nore-hq-529aa2412/',
  ],
  knowsAbout: [
    'Full Stack Development', 'AI Automation', 'React', 'Next.js', 'Node.js',
    'PostgreSQL', 'Python', 'CUDA', 'YOLO', 'TensorRT', 'GPU Programming',
    'Machine Learning', 'Supabase', 'SaaS Development', 'Open Source',
  ],
};

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(filePilotSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(creatorSchema) }}
      />
      {children}
    </>
  );
}
