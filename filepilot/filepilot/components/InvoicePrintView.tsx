'use client';
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

type LineItem = { id: string; desc: string; qty: number; rate: number };
type Invoice = {
  id: string;
  total_amount: number;
  currency_symbol: string;
  items: LineItem[];
  status: string;
  created_at: string;
};

export default function InvoicePrintView({ 
  invoice, 
  clientName,
  onClose 
}: { 
  invoice: Invoice, 
  clientName: string,
  onClose: () => void 
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const handlePrint = () => {
    window.print();
  };

  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm overflow-y-auto custom-scrollbar no-print-bg">
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-invoice, #printable-invoice * {
            visibility: visible;
          }
          #printable-invoice {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 2rem !important;
            background: white !important;
            color: black !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}} />

      {/* Controls - Fixed to viewport */}
      <div className="fixed top-4 right-4 md:top-8 md:right-8 z-50 flex gap-4 no-print shadow-xl">
        <button onClick={handlePrint} className="bg-tarantino text-white px-4 py-3 text-xs font-bold uppercase tracking-widest hover:bg-noir transition-colors shadow-lg">
          Print / Save PDF
        </button>
        <button onClick={onClose} className="bg-white text-noir px-4 py-3 text-xs font-bold uppercase tracking-widest hover:bg-noir/10 transition-colors shadow-lg">
          Close
        </button>
      </div>

      <div className="flex flex-col items-center justify-start min-h-screen p-4 md:p-8 pt-24 md:pt-24">
        {/* Invoice Container */}
        <div id="printable-invoice" className="relative w-full max-w-3xl bg-white text-noir p-10 md:p-16 shadow-2xl">
          
          <div className="flex justify-between items-start border-b-4 border-noir pb-8 mb-10">
            <div>
              <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter mb-2">INVOICE</h1>
              <p className="text-xs font-bold uppercase tracking-widest text-noir/50">ID: {invoice.id.split('-')[0].toUpperCase()}</p>
              <p className="text-xs font-bold uppercase tracking-widest text-noir/50 mt-1">DATE: {new Date(invoice.created_at).toLocaleDateString()}</p>
            </div>
            <div className="text-right">
              <h2 className="text-2xl font-black uppercase tracking-tighter">FilePilot Agency</h2>
              <p className="text-xs font-bold uppercase tracking-widest text-noir/50 mt-1">Billed To:</p>
              <p className="text-sm font-bold uppercase tracking-widest text-tarantino">{clientName}</p>
            </div>
          </div>

          <table className="w-full mb-10">
            <thead>
              <tr className="border-b-2 border-noir">
                <th className="py-3 text-left text-[10px] font-black uppercase tracking-widest">Description</th>
                <th className="py-3 text-center text-[10px] font-black uppercase tracking-widest">Qty</th>
                <th className="py-3 text-right text-[10px] font-black uppercase tracking-widest">Rate</th>
                <th className="py-3 text-right text-[10px] font-black uppercase tracking-widest">Amount</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item, i) => (
                <tr key={i} className="border-b border-noir/10">
                  <td className="py-4 text-sm font-medium">{item.desc}</td>
                  <td className="py-4 text-sm font-medium text-center">{item.qty}</td>
                  <td className="py-4 text-sm font-medium text-right">{invoice.currency_symbol}{item.rate.toLocaleString()}</td>
                  <td className="py-4 text-sm font-black text-right">{invoice.currency_symbol}{(item.qty * item.rate).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex justify-end border-t-4 border-noir pt-6">
            <div className="w-1/2 md:w-1/3">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-noir/50">Total Due</span>
                <span className="text-2xl font-black text-tarantino">{invoice.currency_symbol}{invoice.total_amount.toLocaleString()}</span>
              </div>
            </div>
          </div>
          
          <div className="mt-16 text-center text-[10px] font-bold uppercase tracking-widest text-noir/30">
            Thank you for your business.
          </div>

        </div>
      </div>
    </div>,
    document.body
  );
}
