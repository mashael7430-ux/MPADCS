
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  LayoutDashboard, Pill, History, ClipboardCheck, 
  Users, LogOut, CheckCircle2, 
  Syringe, Baby, Database, RefreshCcw,
  Maximize, Minimize, Truck, ZoomIn, ZoomOut, Sparkles,
  ArchiveRestore, Menu, X as CloseIcon, PackageX, Store
} from 'lucide-react';
import { Medication, AdministrationLog, ViewState, PharmacyRequest, DisposalRecord } from './types.ts';
import { translations } from './translations.ts';
import Dashboard from './components/Dashboard.tsx';
import Inventory from './components/Inventory.tsx';
import AdministrationModule from './components/AdministrationModule.tsx';
import HistoryLogs from './components/HistoryLogs.tsx';
import PatientRecords from './components/PatientRecords.tsx';
import PharmacyModule from './components/PharmacyModule.tsx';
import DisposalModule from './components/DisposalModule.tsx';
import Login from './components/Login.tsx';

const DEFAULT_MEDS: Medication[] = [
  { id: 'n1', name: 'Lasix 40 mg TAB', dosage: '40 mg', refNumber: 'LSX-40-001', currentStock: 50, minThreshold: 10, category: 'Diuretics', expiryDate: '2028-05-01', lastUpdated: new Date().toISOString(), type: 'drug' },
  { id: 'n2', name: 'Captopril 25 mg TAB', dosage: '25 mg', refNumber: 'CPT-25-012', currentStock: 40, minThreshold: 10, category: 'Antihypertensives', expiryDate: '2026-05-01', lastUpdated: new Date().toISOString(), type: 'drug' },
  { id: 'n4', name: 'Paracetamol 500 mg TAB', dosage: '500 mg', refNumber: 'PCM-500-101', currentStock: 100, minThreshold: 20, category: 'Analgesics', expiryDate: '2028-05-01', lastUpdated: new Date().toISOString(), type: 'drug' },
  { id: 'va_flu', name: 'FLU Vaccine', dosage: 'Adult Dose', refNumber: 'VAC-FLU-S', currentStock: 67, minThreshold: 10, category: 'Adult Vaccine', expiryDate: '2026-06-01', lastUpdated: new Date().toISOString(), type: 'vaccine_adult' },
  { id: 'vc_hexa', name: 'HEXA Vaccine', dosage: 'Pediatric', refNumber: 'VAC-HEX-P', currentStock: 51, minThreshold: 8, category: 'Pediatric Vaccine', expiryDate: '2026-02-01', lastUpdated: new Date().toISOString(), type: 'vaccine_child' },
];

const App: React.FC = () => {
  const [lang, setLang] = useState<'en' | 'ar'>(() => {
    const l = localStorage.getItem('mpadcs_lang');
    return (l === 'ar' || l === 'en') ? l : 'ar';
  });
  
  const [activeView, setActiveView] = useState<ViewState>(() => {
    const auth = localStorage.getItem('mpadcs_auth');
    return auth === 'true' ? 'dashboard' : 'login';
  });

  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const [uiZoom, setUiZoom] = useState(1);
  const [isSidebarOpen, setSidebarOpen] = useState(true);

  const [medications, setMedications] = useState<Medication[]>(() => {
    try {
      const saved = localStorage.getItem('mpadcs_medications');
      return saved ? JSON.parse(saved) : DEFAULT_MEDS;
    } catch { return DEFAULT_MEDS; }
  });

  const [logs, setLogs] = useState<AdministrationLog[]>(() => {
    try {
      const saved = localStorage.getItem('mpadcs_logs');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const [pharmacyRequests, setPharmacyRequests] = useState<PharmacyRequest[]>(() => {
    try {
      const saved = localStorage.getItem('mpadcs_pharmacy');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  const [disposalRecords, setDisposalRecords] = useState<DisposalRecord[]>(() => {
    try {
      const saved = localStorage.getItem('mpadcs_disposals');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  useEffect(() => {
    localStorage.setItem('mpadcs_medications', JSON.stringify(medications));
    localStorage.setItem('mpadcs_logs', JSON.stringify(logs));
    localStorage.setItem('mpadcs_pharmacy', JSON.stringify(pharmacyRequests));
    localStorage.setItem('mpadcs_disposals', JSON.stringify(disposalRecords));
    localStorage.setItem('mpadcs_lang', lang);
  }, [medications, logs, pharmacyRequests, disposalRecords, lang]);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('mpadcs_auth');
    setActiveView('login');
  }, []);

  const t = useMemo(() => translations[lang] || translations['en'], [lang]);

  const addLog = (newLog: AdministrationLog) => {
    setLogs(prev => [newLog, ...prev]);
    setMedications(prev => prev.map(m => 
      m.id === newLog.medicationId ? { ...m, currentStock: newLog.postCount, lastUpdated: new Date().toISOString() } : m
    ));
    setToast({ message: lang === 'ar' ? 'تمت العملية بنجاح ✨' : 'Operation successful ✨', type: 'success' });
    setTimeout(() => setToast(null), 3000);
  };

  const navItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: t.dashboard },
    { id: 'administer', icon: ClipboardCheck, label: t.administer },
    { id: 'inventory', icon: Pill, label: t.medications },
    { id: 'vaccinations_adult', icon: Syringe, label: t.vaccinationsAdult },
    { id: 'vaccinations_child', icon: Baby, label: t.vaccinationsChild },
    { id: 'pharmacy_request', icon: Store, label: t.pharmacyRequest },
    { id: 'disposal', icon: PackageX, label: t.disposal },
    { id: 'patients', icon: Users, label: t.patients },
    { id: 'history', icon: History, label: t.history },
  ];

  if (activeView === 'login') {
    return <Login lang={lang} setLang={setLang} onLogin={() => setActiveView('dashboard')} />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-400 text-slate-900 font-['Inter']" dir={lang === 'ar' ? 'rtl' : 'ltr'} style={{ zoom: uiZoom }}>
      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[200] animate-bounce">
          <div className="bg-red-800 text-slate-100 px-6 py-3 rounded-2xl shadow-xl flex items-center gap-3">
            <CheckCircle2 className="w-4 h-4" />
            <span className="font-bold text-sm">{toast.message}</span>
          </div>
        </div>
      )}

      <aside className={`bg-slate-300 border-e border-slate-400 flex flex-col transition-all duration-300 relative z-50 ${isSidebarOpen ? 'w-72' : 'w-20'}`}>
        <div className="p-8 flex items-center justify-between">
          <div className={`flex items-center gap-3 ${isSidebarOpen ? 'opacity-100' : 'opacity-0 overflow-hidden w-0'}`}>
            <div className="w-10 h-10 bg-red-800 rounded-xl flex items-center justify-center shadow-lg">
              <Pill className="w-5 h-5 text-slate-100" />
            </div>
            <h1 className="text-xl font-black text-slate-800">MPADCS</h1>
          </div>
          <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-slate-400 rounded-xl text-slate-500 transition-colors">
            <Menu className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id as ViewState)}
              className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all ${
                activeView === item.id 
                ? 'bg-red-800 text-slate-100 shadow-lg' 
                : 'text-slate-500 hover:bg-slate-400 hover:text-slate-700'
              }`}
            >
              <item.icon className="w-5 h-5 shrink-0" />
              <span className={`font-bold text-sm ${isSidebarOpen ? 'opacity-100' : 'opacity-0 overflow-hidden'}`}>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-6 border-t border-slate-400">
           <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 text-slate-500 hover:text-red-800 transition-colors">
              <LogOut className="w-5 h-5" />
              <span className={`font-bold text-xs uppercase ${isSidebarOpen ? 'block' : 'hidden'}`}>{t.signOut}</span>
           </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto flex flex-col">
        <header className="h-20 bg-slate-300/90 backdrop-blur-md border-b border-slate-400 flex items-center justify-between px-10 sticky top-0 z-40">
          <h2 className="text-xl font-black text-slate-800 uppercase">
            {navItems.find(n => n.id === activeView)?.label || t.dashboard}
          </h2>
          
          <div className="flex items-center gap-4">
             <button onClick={() => setLang(lang === 'en' ? 'ar' : 'en')} className="w-10 h-10 bg-slate-400 border border-slate-500 rounded-xl text-[10px] font-black text-slate-100">
               {lang === 'en' ? 'AR' : 'EN'}
             </button>
             <button onClick={() => document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen()} className="p-2 text-slate-600 hover:text-red-800">
               <Maximize className="w-5 h-5" />
             </button>
          </div>
        </header>

        <div className="p-10 max-w-6xl mx-auto w-full pb-32">
          {activeView === 'dashboard' && <Dashboard medications={medications} logs={logs} lang={lang} onNavigate={setActiveView} />}
          {(activeView === 'inventory' || activeView === 'vaccinations_adult' || activeView === 'vaccinations_child') && (
            <Inventory medications={medications} setMedications={setMedications} lang={lang} showToast={(m) => setToast({message: m, type: 'success'})} filterType={activeView === 'inventory' ? 'drug' : activeView === 'vaccinations_adult' ? 'vaccine_adult' : 'vaccine_child'} />
          )}
          {activeView === 'administer' && <AdministrationModule medications={medications} onLog={addLog} lang={lang} />}
          {activeView === 'history' && <HistoryLogs logs={logs} lang={lang} showToast={(m) => setToast({message: m, type: 'success'})} />}
          {activeView === 'patients' && <PatientRecords logs={logs} lang={lang} onNavigate={setActiveView} />}
          {activeView === 'pharmacy_request' && (
            <PharmacyModule medications={medications} requests={pharmacyRequests} setRequests={setPharmacyRequests} onReceiveStock={(items) => {
              setMedications(prev => prev.map(m => {
                const update = items.find(i => i.medicationId === m.id);
                return update ? { ...m, currentStock: m.currentStock + update.quantity, lastUpdated: new Date().toISOString() } : m;
              }));
            }} lang={lang} showToast={(m) => setToast({message: m, type: 'success'})} />
          )}
          {activeView === 'disposal' && (
            <DisposalModule medications={medications} records={disposalRecords} setRecords={setDisposalRecords} onCompleteDisposal={(items) => {
              setMedications(prev => prev.map(m => {
                const deduction = items.find(i => i.medicationId === m.id);
                return deduction ? { ...m, currentStock: Math.max(0, m.currentStock - deduction.quantity), lastUpdated: new Date().toISOString() } : m;
              }));
            }} lang={lang} showToast={(m) => setToast({message: m, type: 'success'})} />
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
