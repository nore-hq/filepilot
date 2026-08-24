'use client';
import dynamic from 'next/dynamic';
export const runtime = 'edge';

const ClientDetailsPage = dynamic(() => import('./ClientDetailsPage'), { ssr: false });

export default function Page() {
  return <ClientDetailsPage />;
}
