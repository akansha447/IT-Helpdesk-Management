import { useEffect, useState } from 'react';
import { ClipboardPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

const INITIAL_FORM = { relatedTicket: '', changeType: 'Normal', priority: 'Medium', description: '', businessJustification: '', impactAnalysis: '', riskAssessment: '', riskMitigation: '', implementTeam: '', plannedDate: '', estimatedEffort: '', estimatedCost: '' };

const CabCreate = () => {
  const [form, setForm] = useState(INITIAL_FORM);
  const [tickets, setTickets] = useState([]);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  useEffect(() => { api.get('/tickets').then((response) => setTickets(response.data)).catch(() => setError('Could not load tickets.')); }, []);
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const field = (key, label, type = 'text', required = false) => <label className="block"><span className="mb-1 block text-xs font-medium text-slate-500">{label}</span><input required={required} type={type} value={form[key]} onChange={(event) => update(key, event.target.value)} className="focus-ring w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" /></label>;
  const submit = async (event) => { event.preventDefault(); setError(''); try { await api.post('/change-requests', { ...form, status: 'Pending CAB' }); navigate('/cab/authorization'); } catch (err) { setError(err.response?.data?.message || 'Could not create the CAB request.'); } };
  return <div><div className="mb-6 flex items-center gap-2"><ClipboardPlus size={22} className="text-teal-600" /><div><h1 className="text-2xl font-bold text-ink-950">Create CAB request</h1><p className="mt-1 text-sm text-slate-500">Submit a change for authorization and implementation planning.</p></div></div><form onSubmit={submit} className="grid grid-cols-1 gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-soft md:grid-cols-2 lg:grid-cols-3">{error && <p className="col-span-full text-sm text-coral-500">{error}</p>}<label className="block"><span className="mb-1 block text-xs font-medium text-slate-500">Related ticket</span><select required value={form.relatedTicket} onChange={(event) => update('relatedTicket', event.target.value)} className="focus-ring w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"><option value="">Select ticket</option>{tickets.map((ticket) => <option key={ticket._id} value={ticket._id}>{ticket.ticketNumber} - {ticket.title}</option>)}</select></label><label className="block"><span className="mb-1 block text-xs font-medium text-slate-500">Change type</span><select value={form.changeType} onChange={(event) => update('changeType', event.target.value)} className="focus-ring w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"><option>Standard</option><option>Normal</option><option>Emergency</option></select></label>{field('priority', 'Priority')}{field('plannedDate', 'Planned date', 'date')}{field('implementTeam', 'Implementation team')}{field('estimatedEffort', 'Estimated effort')}{field('estimatedCost', 'Estimated cost', 'number')}{field('description', 'Change description', 'text', true)}{field('businessJustification', 'Business justification', 'text', true)}{field('impactAnalysis', 'Impact analysis')}{field('riskAssessment', 'Risk assessment')}{field('riskMitigation', 'Risk mitigation')}<div className="col-span-full flex gap-2"><button type="submit" className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white">Submit to CAB</button><button type="button" onClick={() => navigate('/cab/authorization')} className="rounded-lg border border-slate-200 px-4 py-2 text-sm">Cancel</button></div></form></div>;
};

export default CabCreate;