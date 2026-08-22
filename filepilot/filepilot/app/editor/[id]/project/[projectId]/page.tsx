'use client';
import dynamic from 'next/dynamic';
export const runtime = 'edge';

const ClientPage = dynamic(() => import('./ClientPage'), { ssr: false });

export default function Page() {
  return <ClientPage />;
}
