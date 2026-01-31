
import React, { useState, useEffect } from 'react';
import htm from 'htm';
import { 
  LayoutDashboard, Pill, History, ClipboardCheck, Users, LogOut, 
  CheckCircle2, Syringe, Baby, FileText, PackageX, AlertTriangle, 
  ArrowUpRight, ArrowDownRight, RefreshCw, BarChart3, ShieldCheck, Menu, UserCircle
} from 'lucide-react';
import { translations } from './translations.js';

const html = htm.bind(React.createElement);

const INITIAL_MEDS = [
  { id: 'm1', name: 'Lasix 40 mg TAB', dosage: '40 mg', refNumber: 'LSX-40', currentStock: 45, category: 'Drugs', type: 'drug', expiryDate: '2028-05-01' },
  { id: 'm2', name: 'Captopril 25 mg TAB', dosage: '25 mg', refNumber: 'CPT-25', currentStock: 12, category: 'Drugs', type: 'drug', expiryDate: '2024-03-01' },
  { id: 'vc_hexa', name: 'HEXA Vaccine', dosage: 'Pediatric', refNumber: 'VAC-HEX', currentStock: 51, category: 'Pediatric Vaccines', type: 'vacc_child', expiryDate: '2026-02-01' },
  { id: 'va_flu', name: 'FLU Vaccine', dosage: 'Adult Dose', refNumber: 'VAC-FLU', currentStock: 67, category: 'Adult Vaccines', type: 'vacc_adult', expiryDate: '2026-06-01' }
];

const App = () => {
  const [lang, setLang] = useState(localStorage.getItem('mpadcs_lang') || 'ar');
  const [userRole, setUserRole] = useState(localStorage.getItem('mpadcs_role') || 'nurse');
  const [activeView, setActiveView] = useState(localStorage.getItem('mpadcs_auth') === 'true' ? 'dashboard' : 'login');
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [toast, setToast] = useState(null);

  const [medications, setMedications] = useState(() => {
    const saved = localStorage.getItem('mpadcs_meds');
    return saved ? JSON.parse(saved) : INITIAL_MEDS;
  });

  const [logs, setLogs] = useState(() => JSON.parse(localStorage.getItem('mpadcs_logs') || '[]'));
  const [requests, setRequests] = useState(() => JSON.parse(localStorage.getItem('mpadcs_requests') || '[]'));
  const [returns, setReturns] = useState(() => JSON.parse(localStorage.getItem('mpadcs_returns') || '[]'));

  useEffect(() => {
    localStorage.setItem('mpadcs_meds', JSON.stringify(medications));
    localStorage.setItem('mpadcs_logs', JSON.stringify(logs));
    localStorage.setItem('mpadcs_requests', JSON.stringify(requests));
    localStorage.setItem('mpadcs_returns', JSON.stringify(returns));
    localStorage.setItem('mpadcs_lang', lang);
    localStorage.setItem('mpadcs_role', userRole);
  }, [medications, logs, requests, returns, lang, userRole]);

  const t = translations[lang];

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const isExpired = (date) => date !== '—' && new Date(date) < new Date();

  const handleAdminister = (e) => {
    e.preventDefault();
    const data = new FormData(e.target);
    const medId = data.get('medId');
    const qty = parseInt(data.get('qty'));
    const pName = data.get('pName');
    const pFile = data.get('pFile');

    const med = medications.find(m => m.id === medId);
    if (!med || med.currentStock < qty) return showToast(lang === 'ar' ? 'عفواً، الكمية غير متوفرة' : 'Insufficient stock');

    const pre = med.currentStock;
    const post = pre - qty;

    const newLog = { 
      id: Date.now(), medName: med.name, pName, pFile, qty, pre, post, 
      type: 'admin', time: new Date().toISOString() 
    };

    setMedications(prev => prev.map(m => m.id === medId ? { ...m, currentStock: post } : m));
    setLogs(prev => [newLog, ...prev]);
    showToast(lang === 'ar' ? 'تم توثيق الصرف بنجاح' : 'Dispensed successfully');
    e.target.reset();
  };

  const handleSupply = (reqId) => {
    const req = requests.find(r => r.id === reqId);
    const med = medications.find(m => m.id === req.medId);
    const pre = med.currentStock;
    const post = pre + req.qty;

    setMedications(prev => prev.map(m => m.id === req.medId ? { ...m, currentStock: post } : m));
    setRequests(prev => prev.map(r => r.id === reqId ? { ...r, status: 'delivered' } : r));
    setLogs(prev => [{ id: Date.now(), medName: med.name, pName: 'SUPPLY IN', pFile: '-', qty: req.qty, pre, post, type: 'supply', time: new Date().toISOString() }, ...prev]);
    showToast(lang === 'ar' ? 'تم تحديث المخزون' : 'Stock updated');
  };

  const menuItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: t.dashboard, roles: ['nurse', 'pharmacist', 'supervisor'] },
    { id: 'drug', icon: Pill, label: t.inventory, roles: ['nurse', 'pharmacist', 'supervisor'] },
    { id: 'vacc_child', icon: Baby, label: t.vacc_child, roles: ['nurse', 'pharmacist', 'supervisor'] },
    { id: 'vacc_adult', icon: Syringe, label: t.vacc_adult, roles: ['nurse', 'pharmacist', 'supervisor'] },
    { id: 'administer', icon: ClipboardCheck, label: t.administer, roles: ['nurse', 'supervisor'] },
    { id: 'requests', icon: FileText, label: t.requests, roles: ['nurse', 'pharmacist', 'supervisor'] },
    { id: 'returns', icon: PackageX, label: t.returns, roles: ['pharmacist', 'supervisor'] },
    { id: 'audit', icon: History, label: t.audit, roles: ['pharmacist', 'supervisor'] }
  ].filter(i => i.roles.includes(userRole));

  if (activeView === 'login') {
    return html`
      <div className="h-screen bg-slate-400 flex items-center justify-center p-6" dir=${lang === 'ar' ? 'rtl' : 'ltr'}>
        <div className="w-full max-w-sm bg-slate-300 rounded-[2.5rem] p-10 shadow-2xl border border-slate-500 text-center animate-fade-in">
          <div className="w-16 h-16 bg-red-800 rounded-2xl flex items-center justify-center text-white mx-auto mb-6 shadow-xl"><${ShieldCheck} /></div>
          <h1 className="text-2xl font-black mb-2">${t.loginTitle}</h1>
          <p className="text-[10px] text-slate-500 font-black uppercase mb-8 tracking-widest">${t.appFullName}</p>
          <div className="space-y-4">
             <div className="text-start">
                <label className="text-[10px] font-black text-slate-600 px-1 uppercase">${t.role}</label>
                <select onChange=${(e) => setUserRole(e.target.value)} value=${userRole} className="w-full p-4 bg-slate-400 border border-slate-500 rounded-2xl font-bold cursor-pointer">
                   <option value="nurse">🏥 ${t.nurse}</option>
                   <option value="pharmacist">💊 ${t.pharmacist}</option>
                   <option value="supervisor">⚖️ ${t.supervisor}</option>
                </select>
             </div>
             <button onClick=${() => { localStorage.setItem('mpadcs_auth', 'true'); setActiveView('dashboard'); }} className="w-full py-5 bg-red-800 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl hover:bg-red-900 transition-all">${t.enter}</button>
             <button onClick=${() => setLang(lang === 'ar' ? 'en' : 'ar')} className="text-xs font-bold text-slate-500 uppercase">${lang === 'ar' ? 'Switch to English' : 'تحويل للعربية'}</button>
          </div>
        </div>
      </div>
    `;
  }

  const renderInventory = (type) => html`
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
      ${medications.filter(m => m.type === type).map(m => html`
        <div key=${m.id} className=${`bg-slate-300 p-6 rounded-[2rem] border shadow-md relative overflow-hidden ${isExpired(m.expiryDate) ? 'border-red-800' : 'border-slate-500'}`}>
          ${isExpired(m.expiryDate) && html`<div className="absolute top-0 right-0 bg-red-800 text-white text-[8px] font-black px-4 py-1 rotate-45 translate-x-4 -translate-y-1 uppercase">${t.expired}</div>`}
          <div className="flex justify-between items-start mb-4">
             <div className="w-10 h-10 bg-red-800/10 text-red-800 rounded-xl flex items-center justify-center">
                <${m.type === 'vacc_child' ? Baby : (m.type === 'drug' ? Pill : Syringe)} size=${20} />
             </div>
             <span className="text-[10px] font-black bg-slate-800 text-white px-2 py-1 rounded tracking-widest">${m.refNumber}</span>
          </div>
          <h4 className="font-black text-xl text-slate-900 mb-1">${m.name}</h4>
          <p className="text-[10px] text-slate-500 font-black uppercase">${m.dosage}</p>
          <div className="flex justify-between items-end pt-4 border-t border-slate-400 mt-4">
             <div><p className="text-[8px] font-black uppercase text-slate-500">${t.onHand}</p><p className=${`text-3xl font-black ${m.currentStock <= 10 ? 'text-red-800' : 'text-slate-800'}`}>${m.currentStock}</p></div>
             <p className=${`text-[9px] font-bold ${isExpired(m.expiryDate) ? 'text-red-800' : 'text-slate-600'}`}>EXP: ${m.expiryDate}</p>
          </div>
        </div>
      `)}
    </div>
  `;

  return html`
    <div className="flex h-screen bg-slate-400 text-slate-900" dir=${lang === 'ar' ? 'rtl' : 'ltr'}>
      ${toast && html`<div className="fixed top-8 left-1/2 -translate-x-1/2 z-[100] bg-slate-800 text-white px-8 py-3 rounded-2xl shadow-2xl font-black animate-bounce text-sm">${toast}</div>`}

      <aside className=${`bg-slate-300 border-e border-slate-500 flex flex-col transition-all duration-300 ${isSidebarOpen ? 'w-64' : 'w-20'}`}>
        <div className="p-6 flex flex-col items-center border-b border-slate-400">
          <div className="w-10 h-10 bg-red-800 rounded-xl flex items-center justify-center text-white shadow-lg mb-2"><${Pill} size=${20} /></div>
          ${isSidebarOpen && html`<span className="font-black text-xs text-red-800 uppercase tracking-widest">MPADCS</span>`}
          ${isSidebarOpen && html`<span className="text-[8px] font-black text-slate-500 uppercase tracking-tighter">${t[userRole]}</span>`}
        </div>
        <nav className="flex-1 px-4 py-8 space-y-2 overflow-y-auto custom-scrollbar">
           ${menuItems.map(item => html`
             <button onClick=${() => setActiveView(item.id)} className=${`w-full flex items-center gap-3 p-3.5 rounded-2xl font-bold text-[10px] uppercase tracking-widest transition-all ${activeView === item.id ? 'bg-red-800 text-white shadow-xl' : 'text-slate-500 hover:bg-slate-400'}`}>
                <${item.icon} size=${18} className="shrink-0" /> ${isSidebarOpen && item.label}
             </button>
           `)}
        </nav>
        <div className="p-4 border-t border-slate-400">
           <button onClick=${() => { localStorage.removeItem('mpadcs_auth'); setActiveView('login'); }} className="w-full flex items-center gap-3 p-3 text-slate-500 hover:text-red-800 transition-colors">
              <${LogOut} size=${18} /> ${isSidebarOpen && t.signOut}
           </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-slate-300/80 backdrop-blur-md border-b border-slate-500 flex items-center justify-between px-8 z-40 shrink-0">
           <div className="flex items-center gap-4">
              <button onClick=${() => setSidebarOpen(!isSidebarOpen)} className="p-2 text-slate-800 bg-slate-400/50 rounded-lg"><${Menu} size=${20} /></button>
              <h2 className="font-black text-lg uppercase tracking-tight">${t[activeView] || activeView}</h2>
           </div>
           <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-2 bg-slate-400/50 px-4 py-1.5 rounded-full border border-slate-500">
                <${UserCircle} size=${14} className="text-red-800" />
                <span className="text-[9px] font-black uppercase text-slate-800">${t[userRole]}</span>
              </div>
              <button onClick=${() => setLang(lang === 'ar' ? 'en' : 'ar')} className="px-4 py-1.5 bg-slate-800 text-white rounded-lg text-[10px] font-black border border-slate-600">${lang.toUpperCase()}</button>
           </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="max-w-6xl mx-auto">
            ${activeView === 'dashboard' && html`
              <div className="space-y-8 text-start animate-fade-in">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                   <div className="bg-slate-300 p-6 rounded-3xl border border-slate-500 shadow-md">
                      <p className="text-[10px] font-black text-slate-500 uppercase mb-1">${t.totalItems}</p>
                      <p className="text-3xl font-black">${medications.length}</p>
                   </div>
                   <div className="bg-slate-300 p-6 rounded-3xl border border-slate-500 shadow-md">
                      <p className="text-[10px] font-black text-slate-500 uppercase mb-1">${t.totalQty}</p>
                      <p className="text-3xl font-black">${medications.reduce((a, b) => a + b.currentStock, 0)}</p>
                   </div>
                   <div className="bg-red-800 text-white p-6 rounded-3xl shadow-xl">
                      <p className="text-[10px] font-black text-red-200 uppercase mb-1">${t.alerts}</p>
                      <p className="text-3xl font-black">${medications.filter(m => m.currentStock <= 15).length}</p>
                   </div>
                   <div className="bg-slate-800 text-white p-6 rounded-3xl shadow-xl">
                      <p className="text-[10px] font-black text-slate-400 uppercase mb-1">${t.expired}</p>
                      <p className="text-3xl font-black text-red-500">${medications.filter(m => isExpired(m.expiryDate)).length}</p>
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div className="bg-slate-300 p-8 rounded-[2.5rem] border border-slate-500 shadow-lg">
                      <h4 className="font-black text-lg mb-6 flex items-center gap-3"><${BarChart3} className="text-red-800" /> العمليات الأخيرة</h4>
                      <div className="space-y-4">
                        ${logs.slice(0, 5).map(l => html`
                          <div className="flex items-center justify-between p-3 bg-slate-400 rounded-xl">
                            <span className="font-bold text-sm text-slate-800">${l.medName}</span>
                            <span className=${`font-black ${l.type === 'supply' ? 'text-emerald-800' : 'text-red-800'}`}>${l.type === 'supply' ? '+' : '-'}${l.qty}</span>
                          </div>
                        `)}
                      </div>
                   </div>
                   <div className="bg-slate-800 p-8 rounded-[2.5rem] border border-slate-500 shadow-lg text-white relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-red-800 blur-3xl opacity-20 -mr-10 -mt-10"></div>
                      <h4 className="font-black text-lg mb-6 flex items-center gap-3 text-red-500"><${AlertTriangle} /> تنبيهات هامة</h4>
                      <div className="space-y-4">
                        ${medications.filter(m => m.currentStock <= 15 || isExpired(m.expiryDate)).slice(0, 3).map(m => html`
                          <div className="p-3 bg-slate-700/50 rounded-xl border border-slate-600">
                             <p className="font-bold text-xs">${m.name}</p>
                             <p className="text-[9px] text-red-400 font-black uppercase mt-1">${m.currentStock <= 15 ? 'Low Stock' : 'Expired Item'}</p>
                          </div>
                        `)}
                      </div>
                   </div>
                </div>
              </div>
            `}

            ${['drug', 'vacc_child', 'vacc_adult'].includes(activeView) && renderInventory(activeView)}

            ${activeView === 'administer' && html`
              <div className="max-w-2xl mx-auto bg-slate-300 p-10 rounded-[2.5rem] border border-slate-500 shadow-2xl animate-fade-in text-start">
                 <h3 className="text-2xl font-black border-b border-slate-400 pb-4 mb-8">نموذج الإعطاء للمريض</h3>
                 <form onSubmit=${handleAdminister} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase text-slate-600 px-1">${t.pName}</label>
                       <input name="pName" required className="w-full p-4 bg-slate-400 border border-slate-500 rounded-2xl font-bold" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase text-slate-600 px-1">${t.pFile}</label>
                       <input name="pFile" required className="w-full p-4 bg-slate-400 border border-slate-500 rounded-2xl font-bold" />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                       <label className="text-[10px] font-black uppercase text-slate-600 px-1">${t.med}</label>
                       <select name="medId" required className="w-full p-4 bg-slate-400 border border-slate-500 rounded-2xl font-bold appearance-none cursor-pointer">
                          <option value="">-- اختر من المخزون --</option>
                          ${medications.filter(m => m.currentStock > 0 && !isExpired(m.expiryDate)).map(m => html`<option value=${m.id}>${m.name} (${m.currentStock})</option>`)}
                       </select>
                    </div>
                    <div className="md:col-span-2 space-y-2">
                       <label className="text-[10px] font-black uppercase text-slate-600 px-1">${t.qty}</label>
                       <input type="number" name="qty" defaultValue="1" min="1" required className="w-full p-4 bg-slate-400 border border-slate-500 rounded-2xl font-bold" />
                    </div>
                    <button type="submit" className="md:col-span-2 py-5 bg-red-800 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl hover:bg-red-900 transition-all">توثيق الصرف</button>
                 </form>
              </div>
            `}

            ${activeView === 'requests' && html`
              <div className="space-y-8 text-start animate-fade-in">
                ${(userRole === 'nurse' || userRole === 'supervisor') && html`
                  <div className="bg-slate-300 p-8 rounded-[2.5rem] border border-slate-500 shadow-lg">
                    <h3 className="text-xl font-black mb-6">${t.addReq}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <select id="rMed" className="p-4 bg-slate-400 border border-slate-500 rounded-xl font-bold">
                        ${medications.map(m => html`<option value=${m.id}>${m.name}</option>`)}
                      </select>
                      <input type="number" id="rQty" placeholder="0" className="p-4 bg-slate-400 border border-slate-500 rounded-xl font-bold" />
                      <select id="rReason" className="p-4 bg-slate-400 border border-slate-500 rounded-xl font-bold">
                        <option value="outOfStock">${t.outOfStock}</option>
                        <option value="expiringSoon">${t.expiringSoon}</option>
                        <option value="highUsage">${t.highUsage}</option>
                      </select>
                      <button onClick=${() => {
                        const mId = document.getElementById('rMed').value;
                        const qty = parseInt(document.getElementById('rQty').value);
                        if(qty > 0) {
                          setRequests(prev => [{ id: Date.now(), medId: mId, medName: medications.find(m => m.id === mId).name, qty, reason: document.getElementById('rReason').value, status: 'pending' }, ...prev]);
                          showToast(lang === 'ar' ? 'تم إرسال الطلب' : 'Request Sent');
                        }
                      }} className="bg-red-800 text-white font-black rounded-xl uppercase">إرسال</button>
                    </div>
                  </div>
                `}

                <div className="grid gap-4">
                  ${requests.map(req => html`
                    <div key=${req.id} className="bg-slate-300 p-6 rounded-2xl border border-slate-500 flex justify-between items-center">
                      <div><h4 className="font-black">${req.medName}</h4><p className="text-[10px] font-bold text-slate-500 uppercase">${t.reason}: ${t[req.reason]} | QTY: ${req.qty}</p></div>
                      <div className="flex items-center gap-4">
                        <span className=${`px-4 py-2 rounded-full text-[10px] font-black uppercase ${req.status === 'delivered' ? 'bg-emerald-800 text-white' : 'bg-slate-800 text-white'}`}>${t[req.status]}</span>
                        ${(userRole === 'pharmacist' || userRole === 'supervisor') && req.status === 'pending' && html`<button onClick=${() => setRequests(prev => prev.map(r => r.id === req.id ? { ...r, status: 'approved' } : r))} className="p-2 bg-slate-400 rounded-lg"><${CheckCircle2} size=${18} /></button>`}
                        ${(userRole === 'pharmacist' || userRole === 'supervisor') && req.status === 'approved' && html`<button onClick=${() => handleSupply(req.id)} className="p-2 bg-emerald-800 text-white rounded-lg"><${RefreshCw} size=${18} /></button>`}
                      </div>
                    </div>
                  `)}
                </div>
              </div>
            `}

            ${activeView === 'audit' && html`
              <div className="space-y-4 text-start animate-fade-in">
                 <h3 className="text-2xl font-black mb-6">${t.audit}</h3>
                 ${logs.map(l => html`
                   <div key=${l.id} className="bg-slate-300 p-4 rounded-2xl border border-slate-500 flex justify-between items-center">
                      <div className="flex items-center gap-4">
                         <div className=${`w-12 h-12 rounded-xl flex items-center justify-center text-white ${l.type === 'supply' ? 'bg-emerald-800' : 'bg-red-800'}`}>
                           <${l.type === 'supply' ? ArrowUpRight : ArrowDownRight} size=${20} />
                         </div>
                         <div>
                            <p className="font-black text-slate-900 leading-tight">${l.medName}</p>
                            <p className="text-[10px] font-bold text-slate-500">${l.pName} | ${t.onHand}: ${l.pre} ➔ ${l.post}</p>
                         </div>
                      </div>
                      <div className="text-end">
                         <p className=${`font-black ${l.type === 'supply' ? 'text-emerald-800' : 'text-red-800'}`}>${l.type === 'supply' ? '+' : '-'}${l.qty}</p>
                         <p className="text-[9px] font-bold text-slate-500">${new Date(l.time).toLocaleTimeString()}</p>
                      </div>
                   </div>
                 `)}
              </div>
            `}
          </div>
        </div>
      </main>
    </div>
  `;
};

export default App;
