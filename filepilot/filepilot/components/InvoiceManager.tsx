'use client';
import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

const CPS = 'polygon(0 4px, 4px 0, calc(100% - 4px) 0, 100% 4px, 100% calc(100% - 4px), calc(100% - 4px) 100%, 4px 100%, 0 calc(100% - 4px))';

type LineItem = { id: string; desc: string; qty: number; rate: number };
type Preset = { id: string; preset_name: string; items_json: LineItem[] };

export default function InvoiceManager({ 
  projectId, 
  adminId, 
  role,
  clientName,
  videoTitle
}: { 
  projectId: string, 
  adminId: string, 
  role: 'admin' | 'editor',
  clientName: string,
  videoTitle: string
}) {
  const [items, setItems] = useState<LineItem[]>([{ id: Date.now().toString(), desc: '', qty: 1, rate: 0 }]);
  const [currency, setCurrency] = useState('₹');
  const [presets, setPresets] = useState<Preset[]>([]);
  const [presetName, setPresetName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    fetchPresets();
  }, []);

  const fetchPresets = async () => {
    const { data } = await supabase.from('invoice_presets').select('*').eq('admin_id', adminId).order('created_at', { ascending: false });
    if (data) setPresets(data);
  };

  const addItem = () => setItems([...items, { id: Date.now().toString(), desc: '', qty: 1, rate: 0 }]);
  const removeItem = (id: string) => setItems(items.filter(i => i.id !== id));
  
  const updateItem = (id: string, field: keyof LineItem, value: any) => {
    setItems(items.map(i => i.id === id ? { ...i, [field]: value } : i));
  };

  const totalAmount = items.reduce((acc, curr) => acc + (curr.qty * curr.rate), 0);

  const savePreset = async () => {
    if (!presetName.trim()) return alert('Please enter a preset name');
    setIsSaving(true);
    const { error } = await supabase.from('invoice_presets').insert([{
      admin_id: adminId,
      preset_name: presetName,
      items_json: items
    }]);
    setIsSaving(false);
    if (error) {
      alert('Failed to save preset: ' + error.message);
    } else {
      setPresetName('');
      fetchPresets();
    }
  };

  const loadPreset = (presetId: string) => {
    if (!presetId) return;
    const p = presets.find(x => x.id === presetId);
    if (p) setItems(p.items_json);
  };

  const sendInvoice = async () => {
    if (items.some(i => !i.desc.trim())) return alert('All items must have a description');
    if (totalAmount <= 0) return alert('Total amount must be greater than 0');
    
    setIsSending(true);
    const { error } = await supabase.from('invoices').insert([{
      project_id: projectId,
      created_by_role: role,
      total_amount: totalAmount,
      currency_symbol: currency,
      status: 'pending',
      items: items
    }]);
    setIsSending(false);
    
    if (error) {
      alert('Failed to send invoice: ' + error.message);
    } else {
      alert('Invoice sent successfully to the client!');
      setItems([{ id: Date.now().toString(), desc: '', qty: 1, rate: 0 }]);
    }
  };

  return (
    <div className="flex flex-col h-full bg-parchment p-4 md:p-6 overflow-y-auto custom-scrollbar">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-black text-noir uppercase tracking-tight">Generate Invoice</h2>
          <p className="text-[10px] font-bold uppercase tracking-widest text-noir/50">For {clientName}</p>
        </div>
        
        <div className="flex gap-4 items-end">
          <div className="flex flex-col">
            <label className="text-[9px] uppercase font-bold text-noir/60 mb-1">Currency</label>
            <select value={currency} onChange={e => setCurrency(e.target.value)} className="bg-white border border-noir/10 text-noir text-xs font-bold px-2 py-1.5 outline-none focus:border-tarantino">
              <option value="₹">₹ (INR)</option>
              <option value="$">$ (USD)</option>
              <option value="£">£ (GBP)</option>
              <option value="€">€ (EUR)</option>
            </select>
          </div>
          <div className="flex flex-col">
            <label className="text-[9px] uppercase font-bold text-noir/60 mb-1">Load Preset</label>
            <select onChange={e => loadPreset(e.target.value)} className="bg-white border border-noir/10 text-noir text-xs font-bold px-2 py-1.5 outline-none focus:border-tarantino w-32">
              <option value="">-- Select --</option>
              {presets.map(p => <option key={p.id} value={p.id}>{p.preset_name}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 bg-white border-2 border-noir/10 p-4 relative" style={{ clipPath: CPS }}>
        
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-2 pb-2 border-b-2 border-noir/10 mb-4">
          <div className="col-span-6 text-[10px] font-bold uppercase tracking-widest text-noir/60">Description</div>
          <div className="col-span-2 text-[10px] font-bold uppercase tracking-widest text-noir/60 text-center">Qty</div>
          <div className="col-span-2 text-[10px] font-bold uppercase tracking-widest text-noir/60 text-right">Rate</div>
          <div className="col-span-2 text-[10px] font-bold uppercase tracking-widest text-noir/60 text-right pr-4">Total</div>
        </div>

        {/* Line Items */}
        <div className="flex flex-col gap-3">
          {items.map((item) => (
            <div key={item.id} className="grid grid-cols-12 gap-2 items-center group">
              <div className="col-span-6">
                <input type="text" placeholder="Item description..." value={item.desc} onChange={e => updateItem(item.id, 'desc', e.target.value)} className="w-full bg-noir/5 px-3 py-2 text-sm font-medium text-noir outline-none focus:bg-tarantino/10 transition-colors" style={{ clipPath: CPS }} />
              </div>
              <div className="col-span-2">
                <input type="number" min="1" value={item.qty} onChange={e => updateItem(item.id, 'qty', parseFloat(e.target.value) || 0)} className="w-full bg-noir/5 px-2 py-2 text-sm font-medium text-noir outline-none text-center focus:bg-tarantino/10 transition-colors" style={{ clipPath: CPS }} />
              </div>
              <div className="col-span-2 relative">
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-noir/40 text-xs">{currency}</span>
                <input type="number" min="0" value={item.rate} onChange={e => updateItem(item.id, 'rate', parseFloat(e.target.value) || 0)} className="w-full bg-noir/5 pl-6 pr-2 py-2 text-sm font-medium text-noir outline-none text-right focus:bg-tarantino/10 transition-colors" style={{ clipPath: CPS }} />
              </div>
              <div className="col-span-2 text-right font-bold text-noir flex justify-between items-center pl-2">
                <span>{currency}{(item.qty * item.rate).toLocaleString()}</span>
                {items.length > 1 && (
                  <button onClick={() => removeItem(item.id)} className="text-red-500 opacity-0 group-hover:opacity-100 hover:text-red-700 transition-opacity p-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <button onClick={addItem} className="mt-4 text-[10px] font-bold uppercase tracking-widest text-tarantino hover:text-noir transition-colors flex items-center gap-1">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
          Add Item
        </button>

      </div>

      {/* Footer Controls */}
      <div className="mt-6 flex flex-col md:flex-row justify-between items-end md:items-center gap-4 shrink-0">
        
        {/* Preset Save */}
        {role === 'admin' ? (
          <div className="flex items-center gap-2 w-full md:w-auto bg-white border border-noir/10 p-2" style={{ clipPath: CPS }}>
            <input type="text" placeholder="Preset Name..." value={presetName} onChange={e => setPresetName(e.target.value)} className="bg-transparent text-xs font-bold uppercase outline-none px-2 text-noir placeholder:text-noir/30 w-32" />
            <button onClick={savePreset} disabled={isSaving || !presetName.trim()} className="bg-noir text-parchment px-3 py-1.5 text-[9px] font-bold uppercase tracking-widest hover:bg-tarantino transition-colors disabled:opacity-50">
              {isSaving ? 'Saving...' : 'Save Preset'}
            </button>
          </div>
        ) : (
          <div className="text-[10px] font-bold uppercase text-noir/40">Only Admins can save presets</div>
        )}

        {/* Total & Send */}
        <div className="flex items-center gap-6 w-full md:w-auto justify-between md:justify-end">
          <div className="text-right">
            <div className="text-[10px] font-bold uppercase tracking-widest text-noir/50">Total Amount</div>
            <div className="text-2xl font-black text-noir">{currency}{totalAmount.toLocaleString()}</div>
          </div>
          <button onClick={sendInvoice} disabled={isSending || totalAmount <= 0} className="bg-tarantino text-white px-8 py-3 text-sm font-bold uppercase tracking-widest hover:bg-noir transition-colors disabled:opacity-50" style={{ clipPath: CPS }}>
            {isSending ? 'Sending...' : 'Send Invoice'}
          </button>
        </div>
        
      </div>
    </div>
  );
}
