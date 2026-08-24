'use client';
import dynamic from 'next/dynamic';
export const runtime = 'edge';

const EditorProjectPage = dynamic(() => import('./EditorProjectPage'), { ssr: false });

export default function Page() {
  return <EditorProjectPage />;
}
