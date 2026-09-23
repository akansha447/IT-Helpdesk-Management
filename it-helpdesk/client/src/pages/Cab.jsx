import { useEffect, useState } from 'react';
import { ClipboardCheck, Eye, X } from 'lucide-react';
import api from '../api/axios';
import StatCard from '../components/StatCard';

const REVIEW_STATUSES = ['Pending CAB', 'Draft'];

const Cab = () => {
  const [records, setRecords] = useState([]);
  const [selected, setSelected] = useState(null);
  const [remark, setRemark] = useState('');
  const [filter, setFilter] = useState('Pending CAB');
  const [error, setError] = useState('');

  const load = async () => {
    const response = await api.get('/change-requests');
    setRecords(response.data);
  };

  useEffect(() => { load(); }, []);

  const decide = async (decision) => {
    setError('');
    try {
      await api.put(`/change-requests/${selected._id}/decision`, { decision, remark });
      setSelected(null);
      setRemark('');
      await load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save the CAB decision.');
    }
  };

  const visible = records.filter((record) => record.status === filter);
  const count = (status) => records.filter((record) => record.status === status).length;

  return (
    <div>
      <div className="mb-6 flex items-start justify-between"><div><div className="flex items-center gap-2"><ClipboardCheck size={22} className="text-teal-600" /><h1 className="text-2xl font-bold text-ink-950">CAB review</h1></div><p className="mt-1 text-sm text-slate-500">Review proposed changes and record the board decision.</p></div></div>
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">{REVIEW_STATUSES.map((status) => <button key={status} onClick={() => setFilter(status)} className="text-left focus-ring"><StatCard label={status} value={count(status)} accent={status === 'Pending CAB' ? 'amber' : 'ink'} className={`h-full transition-transform hover:-translate-y-0.5 ${filter === status ? 'ring-2 ring-teal-400' : ''}`} /></button>)}</div>
      {error && <p className="mb-4 rounded-lg border border-coral-200 bg-coral-50 px-4 py-3 text-sm text-coral-600">{error}</p>}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-soft"><table className="w-full min-w-[850px] text-sm"><thead><tr className="border-b border-slate-100 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-400"><th className="px-4 py-3">CR number</th><th className="px-4 py-3">Change</th><th className="px-4 py-3">Type</th><th className="px-4 py-3">Priority</th><th className="px-4 py-3">Requester</th><th className="px-4 py-3">Planned date</th><th className="px-4 py-3">Action</th></tr></thead><tbody className="divide-y divide-slate-100">{visible.map((record) => <tr key={record._id}><td className="px-4 py-3 font-mono text-xs">{record.crNumber}</td><td className="max-w-[280px] truncate px-4 py-3">{record.description}</td><td className="px-4 py-3">{record.changeType}</td><td className="px-4 py-3">{record.priority}</td><td className="px-4 py-3">{record.requesterName}</td><td className="px-4 py-3">{record.plannedDate ? new Date(record.plannedDate).toLocaleDateString() : '—'}</td><td className="px-4 py-3"><button onClick={() => { setSelected(record); setRemark(record.remark || ''); }} title="Review change" className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100"><Eye size={16} /></button></td></tr>)}</tbody></table>{visible.length === 0 && <p className="px-5 py-10 text-center text-sm text-slate-400">No changes are waiting for this review stage.</p>}</div>
      {selected && <div className="mt-4 rounded-xl border border-teal-200 bg-teal-50 p-5 text-sm"><div className="mb-4 flex items-center justify-between"><div><h2 className="font-semibold text-ink-900">{selected.crNumber} review</h2><p className="text-xs text-slate-500">{selected.relatedTicket?.ticketNumber} - {selected.relatedTicket?.title}</p></div><button onClick={() => setSelected(null)} title="Close review"><X size={17} /></button></div><div className="grid gap-4 md:grid-cols-2"><div><p className="font-medium text-ink-800">Description</p><p className="mt-1 text-slate-600">{selected.description}</p><p className="mt-3 font-medium text-ink-800">Business justification</p><p className="mt-1 text-slate-600">{selected.businessJustification}</p></div><div><p className="font-medium text-ink-800">Impact and risk</p><p className="mt-1 text-slate-600">{selected.impactAnalysis || 'No impact analysis provided.'}</p><p className="mt-3 text-slate-600">{selected.riskAssessment || 'No risk assessment provided.'}</p><p className="mt-3 font-medium text-ink-800">Mitigation</p><p className="mt-1 text-slate-600">{selected.riskMitigation || 'No mitigation provided.'}</p></div></div><label className="mt-4 block"><span className="mb-1 block text-xs font-medium text-slate-600">Decision remark</span><textarea value={remark} onChange={(event) => setRemark(event.target.value)} rows="2" className="focus-ring w-full rounded-lg border border-teal-200 bg-white px-3 py-2 text-sm" placeholder="Add context for the requester" /></label><div className="mt-4 flex gap-2"><button onClick={() => decide('Approved')} className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white">Approve change</button><button onClick={() => decide('Rejected')} className="rounded-lg bg-coral-500 px-4 py-2 text-sm font-semibold text-white">Reject change</button></div></div>}
    </div>
  );
};

export default Cab;