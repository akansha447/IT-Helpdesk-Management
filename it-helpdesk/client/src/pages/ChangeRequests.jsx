import { useEffect, useState } from 'react';
import { Eye, PlusCircle, X } from 'lucide-react';
import api from '../api/axios';
import StatCard from '../components/StatCard';

const EMPTY = { relatedTicket: '', changeType: 'Normal', description: '', businessJustification: '', knowledgeBase: '', impactAnalysis: '', riskAssessment: '', riskMitigation: '', estimatedEffort: '', estimatedCost: '', priority: 'Medium', implementDate: '', implementTeam: '', changeManager: '', systemImpacted: '', dependencies: '', attachmentName: '', plannedDate: '', plannedClosedDate: '' };
const STATUSES = ['Draft', 'Pending CAB', 'Approved', 'Closed'];

const ChangeRequests = () => {
  const [records, setRecords] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [error, setError] = useState('');

  const load = async () => {
    const [changeResponse, ticketResponse] = await Promise.all([api.get('/change-requests'), api.get('/tickets')]);
    setRecords(changeResponse.data);
    setTickets(ticketResponse.data);
  };
  useEffect(() => { load(); }, []);

  const update = (key, value) => setForm({ ...form, [key]: value });
  const countByStatus = (status) => records.filter((record) => record.status === status).length;
  const visibleRecords = statusFilter ? records.filter((record) => record.status === statusFilter) : records;
  const submit = async (event) => {
    event.preventDefault(); setError('');
    try { await api.post('/change-requests', form); setForm(EMPTY); setOpen(false); await load(); }
    catch (err) { setError(err.response?.data?.message || 'Could not create change request.'); }
  };
  const field = (key, label, type = 'text', required = false) => <label className="block"><span className="mb-1 block text-xs font-medium text-slate-500">{label}</span><input required={required} type={type} value={form[key]} onChange={(event) => update(key, event.target.value)} className="focus-ring w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></label>;

  return <div>
    <div className="mb-6 flex items-center justify-between"><div><h1 className="text-2xl font-bold text-ink-950">Change requests</h1><p className="mt-1 text-sm text-slate-500">Track CAB review, implementation planning, and closure.</p></div><button onClick={() => setOpen(!open)} className="focus-ring flex items-center gap-2 rounded-lg bg-teal-500 px-4 py-2.5 text-sm font-semibold text-white"><PlusCircle size={17} /> New change request</button></div>
    <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5"><button onClick={() => setStatusFilter('')} className="text-left focus-ring"><StatCard label="All requests" value={records.length} className="h-full transition-transform hover:-translate-y-0.5" /></button>{STATUSES.map((status) => <button key={status} onClick={() => setStatusFilter(status)} className="text-left focus-ring"><StatCard label={status} value={countByStatus(status)} accent={status === 'Approved' ? 'teal' : status === 'Pending CAB' ? 'amber' : status === 'Closed' ? 'coral' : 'ink'} className="h-full transition-transform hover:-translate-y-0.5" /></button>)}</div>
    {open && <form onSubmit={submit} className="mb-6 grid grid-cols-1 gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-soft md:grid-cols-2 lg:grid-cols-3"><div className="col-span-full flex items-center justify-between"><h2 className="font-semibold text-ink-900">Create change request</h2><button type="button" onClick={() => setOpen(false)}><X size={18} /></button></div>{error && <p className="col-span-full text-sm text-coral-500">{error}</p>}<label className="block"><span className="mb-1 block text-xs font-medium text-slate-500">Related ticket</span><select required value={form.relatedTicket} onChange={(event) => update('relatedTicket', event.target.value)} className="focus-ring w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"><option value="">Select ticket</option>{tickets.map((ticket) => <option key={ticket._id} value={ticket._id}>{ticket.ticketNumber} - {ticket.title}</option>)}</select></label><label className="block"><span className="mb-1 block text-xs font-medium text-slate-500">Change type</span><select value={form.changeType} onChange={(event) => update('changeType', event.target.value)} className="focus-ring w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"><option>Standard</option><option>Normal</option><option>Emergency</option></select></label>{field('priority', 'Priority type')}{field('description', 'Change request description', 'text', true)}{field('businessJustification', 'Business justification', 'text', true)}{field('knowledgeBase', 'Knowledge Base')}{field('impactAnalysis', 'Impact analysis')}{field('riskAssessment', 'Risk assessment')}{field('riskMitigation', 'Risk mitigation')}{field('estimatedEffort', 'Estimated effort')}{field('estimatedCost', 'Estimated cost', 'number')}{field('implementDate', 'Implement date', 'date')}{field('implementTeam', 'Implement team')}{field('changeManager', 'Change manager')}{field('systemImpacted', 'System/application impacted')}{field('dependencies', 'Dependencies')}{field('plannedDate', 'Planned date', 'date')}{field('plannedClosedDate', 'Planned closed date', 'date')}<label className="block"><span className="mb-1 block text-xs font-medium text-slate-500">Attachment</span><input type="file" onChange={(event) => update('attachmentName', event.target.files[0]?.name || '')} className="w-full text-sm" /></label><div className="col-span-full flex justify-end"><button className="focus-ring rounded-lg bg-ink-950 px-5 py-2.5 text-sm font-semibold text-white">Create request</button></div></form>}
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-soft"><table className="w-full min-w-[1050px] text-sm"><thead><tr className="border-b border-slate-100 bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-400"><th className="px-4 py-3">CR number</th><th className="px-4 py-3">Related ticket</th><th className="px-4 py-3">CAB authority</th><th className="px-4 py-3">Effort</th><th className="px-4 py-3">Cost</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Remark</th><th className="px-4 py-3">Created by</th><th className="px-4 py-3">Action</th></tr></thead><tbody className="divide-y divide-slate-100">{visibleRecords.map((record) => <tr key={record._id}><td className="px-4 py-3 font-mono text-xs">{record.crNumber}</td><td className="px-4 py-3">{record.relatedTicket?.ticketNumber}</td><td className="px-4 py-3">{record.changeManager || 'Pending'}</td><td className="px-4 py-3">{record.estimatedEffort || '—'}</td><td className="px-4 py-3">{record.estimatedCost || '—'}</td><td className="px-4 py-3">{record.status}</td><td className="max-w-[180px] truncate px-4 py-3">{record.remark || '—'}</td><td className="px-4 py-3">{record.createdBy?.name}</td><td className="px-4 py-3"><button onClick={() => setSelected(record)} title="View" className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100"><Eye size={16} /></button></td></tr>)}</tbody></table>{visibleRecords.length === 0 && <p className="px-5 py-10 text-center text-sm text-slate-400">No change requests match this view.</p>}</div>
    {selected && <div className="mt-4 rounded-xl border border-teal-200 bg-teal-50 p-5 text-sm"><div className="mb-2 flex justify-between"><h2 className="font-semibold">{selected.crNumber} details</h2><button onClick={() => setSelected(null)}><X size={17} /></button></div><p className="text-ink-800">{selected.description}</p><p className="mt-2 text-slate-600">Business justification: {selected.businessJustification}</p><p className="mt-2 text-slate-600">Knowledge Base: {selected.knowledgeBase || '—'}</p></div>}
  </div>;
};
export default ChangeRequests;
