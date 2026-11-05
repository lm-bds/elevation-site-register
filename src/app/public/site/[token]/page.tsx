'use client';

import { FormEvent, useState } from 'react';
import { useParams } from 'next/navigation';

export default function SiteRegisterPage() {
  const params = useParams<{ token: string }>();
  const [form, setForm] = useState({ fullName: '', phone: '', company: '' });
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>, action: 'on' | 'off') {
    event.preventDefault(); setBusy(true); setMessage('');
    const response = await fetch('/api/site-register/scan', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, token: params.token, action }) });
    const result = await response.json(); setBusy(false);
    setMessage(result.message || result.error || 'Unable to record attendance.');
  }

  return <main className="min-h-screen bg-[#060608] px-5 py-10 text-[#ededf2]">
    <section className="mx-auto max-w-md rounded-2xl border border-white/10 bg-[#111118] p-7 shadow-2xl">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#b48fff]">Elevation Built</p>
      <h1 className="mt-2 text-3xl font-bold">Site sign-on</h1>
      <p className="mt-2 text-sm text-[#b8b8c8]">Enter your details, then choose sign on or sign off. Your recorded hours are checked against contractor invoices.</p>
      <form className="mt-7 space-y-4" onSubmit={(event) => submit(event, 'on')}>
        {(['fullName', 'phone', 'company'] as const).map((field) => <label className="block text-sm font-medium" key={field}>{field === 'fullName' ? 'Full name' : field === 'phone' ? 'Mobile number' : 'Company'}<input required value={form[field]} onChange={(e) => setForm({ ...form, [field]: e.target.value })} className="mt-1 block w-full rounded-lg border border-white/15 bg-[#0d0d11] px-3 py-3 text-white" /></label>)}
        <div className="grid grid-cols-2 gap-3"><button disabled={busy} className="rounded-lg bg-[#8C52FF] px-4 py-3 font-bold text-white disabled:opacity-60">Sign on</button><button type="button" disabled={busy} onClick={(event) => submit(event as unknown as FormEvent<HTMLFormElement>, 'off')} className="rounded-lg border border-[#8C52FF] px-4 py-3 font-bold text-[#ededf2] disabled:opacity-60">Sign off</button></div>
      </form>
      {message && <p role="status" className="mt-5 rounded-lg bg-white/5 p-3 text-sm">{message}</p>}
    </section>
  </main>;
}
