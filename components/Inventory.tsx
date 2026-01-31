
import React, { useState, useRef } from 'react';
import { Medication, PillCountResult } from '../types.ts';
import { translations } from '../translations.ts';
import { analyzePillCount } from '../services/geminiService.ts';
import { 
  Search, Plus, Edit3, Trash2, Camera, 
  RefreshCcw, Loader2, X, ShieldCheck, AlertTriangle, 
  Pill, Hash, Save
} from 'lucide-react';

interface InventoryProps {
  medications: Medication[];
  setMedications: React.Dispatch<React.SetStateAction<Medication[]>>;
  lang: 'en' | 'ar';
  showToast: (msg: string) => void;
  filterType: 'drug' | 'vaccine_adult' | 'vaccine_child';
}

const Inventory: React.FC<InventoryProps> = ({ medications = [], setMedications, lang, showToast, filterType }) => {
  const t = translations[lang] || translations['en'];
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingMed, setEditingMed] = useState<Partial<Medication> | null>(null);
  const [auditingMed, setAuditingMed] = useState<Medication | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [scanResult, setScanResult] = useState<PillCountResult | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const filteredMeds = medications.filter(m => {
    const term = searchTerm.toLowerCase();
    return m.type === filterType && (
      m.name.toLowerCase().includes(term) || 
      m.refNumber.toLowerCase().includes(term) ||
      m.category.toLowerCase().includes(term)
    );
  });

  const handleOpenAdd = () => {
    setEditingMed({
      id: Math.random().toString(36).substr(2, 9),
      name: '',
      dosage: '',
      refNumber: '',
      currentStock: 0,
      minThreshold: 5,
      category: '',
      expiryDate: '',
      lastUpdated: new Date().toISOString(),
      type: filterType
    });
    setIsEditModalOpen(true);
  };

  const handleOpenEdit = (med: Medication) => {
    setEditingMed({ ...med });
    setIsEditModalOpen(true);
  };

  const handleSaveMedication = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMed) return;
    setMedications(prev => {
      const exists = prev.find(m => m.id === editingMed.id);
      if (exists) return prev.map(m => m.id === editingMed.id ? { ...m, ...editingMed } as Medication : m);
      return [...prev, editingMed as Medication];
    });
    setIsEditModalOpen(false);
    showToast(lang === 'ar' ? 'تم حفظ بيانات الدواء' : 'Medication saved');
  };

  const startAudit = async (med: Medication) => {
    setAuditingMed(med);
    setIsCameraActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch (err) { showToast(lang === 'ar' ? "فشل الوصول للكاميرا" : "Camera failed"); }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
      context?.drawImage(videoRef.current, 0, 0);
      const dataUrl = canvasRef.current.toDataURL('image/jpeg');
      setCapturedImage(dataUrl);
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(t => t.stop());
      setIsCameraActive(false);
      processAI(dataUrl);
    }
  };

  const processAI = async (image: string) => {
    setIsAnalyzing(true);
    try {
      const base64 = image.split(',')[1];
      const result = await analyzePillCount(base64, auditingMed?.name || '');
      setScanResult(result);
    } catch (err) { showToast(lang === 'ar' ? "فشل التحليل" : "AI analysis failed"); }
    finally { setIsAnalyzing(false); }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 text-start">
      <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
        <div className="relative w-full lg:max-w-md group">
          <Search className={`${lang === 'ar' ? 'right-4' : 'left-4'} absolute top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600`} />
          <input 
            type="text" 
            placeholder={t.searchPlaceholder} 
            className={`w-full ${lang === 'ar' ? 'pr-12 pl-4' : 'pl-12 pr-4'} py-4 rounded-2xl bg-slate-300 border border-slate-500 outline-none font-bold text-sm text-slate-900 shadow-lg focus:border-red-800 placeholder-slate-600`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button onClick={handleOpenAdd} className="flex items-center gap-2 px-8 py-4 bg-red-800 text-slate-100 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl">
          <Plus className="w-4 h-4" /> {t.addMedication}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMeds.map(m => (
          <div key={m.id} className="bg-slate-300 rounded-[2rem] border border-slate-400 p-6 shadow-lg hover:border-red-800 transition-all text-start relative overflow-hidden group">
            <div className="flex justify-between items-start mb-6">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-red-900 text-slate-100">
                <Pill className="w-6 h-6" />
              </div>
              <div className="flex gap-1">
                <button onClick={() => startAudit(m)} className="p-2 bg-slate-400 text-slate-100 rounded-xl hover:bg-red-800 transition-all"><Camera className="w-4 h-4" /></button>
                <button onClick={() => handleOpenEdit(m)} className="p-2 bg-slate-400 text-slate-100 rounded-xl hover:bg-slate-500 transition-all"><Edit3 className="w-4 h-4" /></button>
              </div>
            </div>
            <div className="space-y-1 mb-6">
              <div className="flex items-center gap-2 mb-1">
                 <span className="bg-slate-800 text-slate-100 px-2 py-0.5 rounded text-[8px] font-black flex items-center gap-1 uppercase tracking-tighter">
                    <Hash className="w-2.5 h-2.5" /> {m.refNumber || 'NO REF'}
                 </span>
              </div>
              <h4 className="text-lg font-black text-slate-900 leading-tight">{m.name}</h4>
              <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">{m.dosage}</p>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-6 border-t border-slate-400">
               <div>
                  <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1">{t.tableStock}</p>
                  <p className="text-xl font-black text-slate-900">{m.currentStock}</p>
               </div>
               <div>
                  <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1">{t.tableExpiry}</p>
                  <p className="text-xs font-bold text-slate-600">{m.expiryDate || 'N/A'}</p>
               </div>
            </div>
          </div>
        ))}
      </div>

      {isEditModalOpen && editingMed && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in">
          <div className="bg-slate-300 w-full max-w-xl rounded-[3rem] shadow-2xl overflow-hidden border border-slate-500 flex flex-col">
            <div className="bg-red-800 p-8 text-slate-100 flex justify-between items-center">
              <h3 className="text-2xl font-black tracking-tight">{t.editMedication}</h3>
              <button onClick={() => setIsEditModalOpen(false)}><X /></button>
            </div>
            <form onSubmit={handleSaveMedication} className="p-8 space-y-6" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2 md:col-span-2">
                  <label className="text-[10px] font-black text-slate-700 uppercase px-2">{t.medName}</label>
                  <input type="text" className="w-full px-5 py-4 bg-slate-400 border border-slate-500 rounded-2xl font-bold" value={editingMed.name} onChange={(e) => setEditingMed({ ...editingMed, name: e.target.value })} required />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-[10px] font-black text-red-800 uppercase px-2 flex items-center gap-2"><Hash className="w-3 h-3" /> {t.refNumber}</label>
                  <input type="text" className="w-full px-5 py-4 bg-slate-200 border-2 border-red-800/20 rounded-2xl font-black text-red-900" value={editingMed.refNumber} onChange={(e) => setEditingMed({ ...editingMed, refNumber: e.target.value })} required />
                </div>
                <div className="space-y-2"><label className="text-[10px] font-black text-slate-700 uppercase px-2">{t.dosage}</label><input type="text" className="w-full px-5 py-4 bg-slate-400 border border-slate-500 rounded-2xl font-bold" value={editingMed.dosage} onChange={(e) => setEditingMed({ ...editingMed, dosage: e.target.value })} required /></div>
                <div className="space-y-2"><label className="text-[10px] font-black text-slate-700 uppercase px-2">{t.tableStock}</label><input type="number" className="w-full px-5 py-4 bg-slate-400 border border-slate-500 rounded-2xl font-bold" value={editingMed.currentStock} onChange={(e) => setEditingMed({ ...editingMed, currentStock: parseInt(e.target.value) || 0 })} required /></div>
              </div>
              <button type="submit" className="w-full py-5 bg-red-800 text-slate-100 rounded-2xl font-black uppercase shadow-xl hover:bg-red-900 transition-all flex items-center justify-center gap-3"><Save className="w-5 h-5" /> {t.saveMed}</button>
            </form>
          </div>
        </div>
      )}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default Inventory;
