
import React, { useState, useMemo } from 'react';
import { Medication, DisposalRecord } from '../types.ts';
import { translations } from '../translations.ts';
import { 
  PackageX, Plus, Trash2, Signature, 
  X, CheckCircle, Clock, FileText, 
  AlertCircle, Boxes, CalendarX,
  History, Layers, Undo2
} from 'lucide-react';

interface DisposalModuleProps {
  medications: Medication[];
  records: DisposalRecord[];
  setRecords: React.Dispatch<React.SetStateAction<DisposalRecord[]>>;
  onCompleteDisposal: (items: { medicationId: string; quantity: number }[]) => void;
  lang: 'en' | 'ar';
  showToast: (msg: string) => void;
}

const DisposalModule: React.FC<DisposalModuleProps> = ({ medications, records, setRecords, onCompleteDisposal, lang, showToast }) => {
  const t = translations[lang] || translations['en'];
  const [isAdding, setIsAdding] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<DisposalRecord | null>(null);
  
  // New Disposal Form State
  const [formItems, setFormItems] = useState<{ medicationId: string; quantity: number; reason: 'expired' | 'surplus' }[]>([]);
  const [nurseSignature, setNurseSignature] = useState('');
  
  // Finalize Confirmation State
  const [supervisorSignature, setSupervisorSignature] = useState('');

  const expiredMeds = useMemo(() => medications.filter(m => new Date(m.expiryDate) < new Date()), [medications]);
  const surplusMeds = useMemo(() => medications.filter(m => m.currentStock > 0), [medications]);

  const handleAddItem = (medId?: string, reason: 'expired' | 'surplus' = 'surplus') => {
    setFormItems([...formItems, { medicationId: medId || '', quantity: 1, reason }]);
  };

  const handleAddAll = (type: 'expired' | 'surplus') => {
    const medsToAdd = type === 'expired' ? expiredMeds : surplusMeds;
    const newItems = medsToAdd.map(m => ({
      medicationId: m.id,
      quantity: m.currentStock,
      reason: type
    }));
    
    // Merge with existing items, avoiding duplicates
    const existingIds = new Set(formItems.map(i => i.medicationId));
    const uniqueNewItems = newItems.filter(i => !existingIds.has(i.medicationId));
    
    setFormItems([...formItems, ...uniqueNewItems]);
    showToast(lang === 'ar' ? `تمت إضافة جميع الأصناف (${type === 'expired' ? 'المنتهية' : 'الفائضة'})` : `Added all ${type} items`);
  };

  const handleRemoveItem = (index: number) => {
    setFormItems(formItems.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...formItems];
    newItems[index] = { ...newItems[index], [field]: value };
    setFormItems(newItems);
  };

  const handleSubmitDisposal = (e: React.FormEvent) => {
    e.preventDefault();
    if (formItems.length === 0 || !nurseSignature) return;

    const newRecord: DisposalRecord = {
      id: `DISP-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      items: formItems.map(item => ({
        ...item,
        name: medications.find(m => m.id === item.medicationId)?.name || 'Unknown'
      })),
      requestDate: new Date().toISOString(),
      nurseSignature,
      status: 'pending'
    };

    setRecords([newRecord, ...records]);
    setIsAdding(false);
    setFormItems([]);
    setNurseSignature('');
    showToast(lang === 'ar' ? 'تم إنشاء كشف التسليم بنجاح' : 'Disposal record created successfully');
  };

  const handleFinalizeDisposal = (record: DisposalRecord) => {
    if (!supervisorSignature) return;

    const updatedRecords = records.map(r => 
      r.id === record.id 
        ? { ...r, status: 'completed' as const, supervisorSignature, completionDate: new Date().toISOString() } 
        : r
    );

    setRecords(updatedRecords);
    onCompleteDisposal(record.items.map(i => ({ medicationId: i.medicationId, quantity: i.quantity })));
    setSelectedRecord(null);
    setSupervisorSignature('');
    showToast(lang === 'ar' ? 'تم توثيق الاسترجاع وخصم المخزون' : 'Return documented and stock adjusted');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 text-start">
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="text-start">
          <div className="flex items-center gap-3 mb-1">
            <PackageX className="w-8 h-8 text-red-800" />
            <h3 className="text-2xl font-black text-slate-900">{t.disposalTitle}</h3>
          </div>
          <p className="text-slate-600 max-w-2xl font-medium">{t.disposalDesc}</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)} 
          className="flex items-center gap-2 px-8 py-4 bg-red-800 text-slate-100 rounded-2xl font-black shadow-xl shadow-red-900/20 hover:bg-red-900 transition-all active:scale-95"
        >
          <Plus className="w-5 h-5" /> {t.newDisposal}
        </button>
      </div>

      <div className="grid gap-6">
        {records.length > 0 ? records.map((rec) => (
          <div key={rec.id} className="bg-slate-300 p-8 rounded-[2.5rem] border border-slate-400 shadow-md flex flex-col md:flex-row gap-8 items-center hover:shadow-2xl transition-all group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-red-400/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
            
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${
              rec.status === 'completed' ? 'bg-slate-800 text-slate-100' : 'bg-red-800 text-slate-100'
            }`}>
              {rec.status === 'completed' ? <CheckCircle className="w-8 h-8" /> : <Clock className="w-8 h-8" />}
            </div>

            <div className="flex-1 text-start">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-[10px] font-black bg-slate-400 text-slate-100 px-3 py-1 rounded-full uppercase tracking-widest border border-slate-500">ID: {rec.id}</span>
                <span className={`px-3 py-1 text-[10px] uppercase font-black rounded-full tracking-widest shadow-sm ${
                  rec.status === 'completed' ? 'bg-emerald-900/20 text-emerald-800 border border-emerald-900/30' : 'bg-amber-900/20 text-amber-800 border border-amber-900/30'
                }`}>
                  {rec.status === 'completed' ? t.completedDisposal : t.pendingDisposal}
                </span>
              </div>
              <h4 className="font-black text-slate-800 text-xl tracking-tight">
                {/* Fixed typo: changed req.requestDate to rec.requestDate */}
                {t.orderDate}: {new Date(rec.requestDate).toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US')}
              </h4>
              <div className="mt-3 flex flex-wrap gap-2">
                {rec.items.slice(0, 4).map((item, idx) => (
                  <span key={idx} className={`px-3 py-1.5 rounded-xl text-[10px] font-black border flex items-center gap-2 shadow-sm ${
                    item.reason === 'expired' ? 'bg-red-900/20 border-red-900/30 text-red-900' : 'bg-slate-400 border-slate-500 text-slate-100'
                  }`}>
                    {item.reason === 'expired' ? <CalendarX className="w-3 h-3" /> : <Boxes className="w-3 h-3" />}
                    {item.name} <span className="opacity-60">({item.quantity})</span>
                  </span>
                ))}
                {rec.items.length > 4 && <span className="text-[10px] font-black text-slate-600">+{rec.items.length - 4}</span>}
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-10 items-center px-6 border-x border-slate-400">
              <div className="text-center">
                <p className="text-[9px] uppercase font-black text-slate-600 tracking-widest mb-2">{t.nurseSign}</p>
                <p className="font-serif italic text-slate-800 text-base">{rec.nurseSignature}</p>
              </div>
              {rec.status === 'completed' && (
                <div className="text-center">
                  <p className="text-[9px] uppercase font-black text-slate-600 tracking-widest mb-2">{t.supervisorSign}</p>
                  <p className="font-serif italic text-red-800 text-base">{rec.supervisorSignature}</p>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => setSelectedRecord(rec)}
                className={`px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-md active:scale-95 whitespace-nowrap ${
                  rec.status === 'completed' ? 'bg-slate-800 text-slate-100 hover:bg-black' : 'bg-red-800 text-slate-100 hover:bg-red-900'
                }`}
              >
                {rec.status === 'completed' ? t.viewDetails : t.finalizeDisposal}
              </button>
            </div>
          </div>
        )) : (
          <div className="py-32 bg-slate-300 rounded-[3rem] border-2 border-dashed border-slate-400 text-center flex flex-col items-center">
             <div className="bg-red-900/10 w-24 h-24 rounded-full flex items-center justify-center mb-8 shadow-inner">
              <PackageX className="w-12 h-12 text-red-800/40" />
            </div>
            <h4 className="text-2xl font-black text-slate-800">{lang === 'ar' ? 'سجل الإرجاع فارغ' : 'Return record is empty'}</h4>
            <p className="text-slate-600 mt-2 max-w-sm font-bold">{lang === 'ar' ? 'يمكنك إنشاء كشوف إرجاع للأدوية منتهية الصلاحية أو الفائضة لتوثيقها رسمياً.' : 'Create return notes for expired or surplus medications to officially document them.'}</p>
          </div>
        )}
      </div>

      {/* New Request Modal */}
      {isAdding && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-slate-300 w-full max-w-3xl rounded-[3.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh] border border-slate-500">
            <div className="bg-red-800 p-10 text-slate-100 flex justify-between items-center shrink-0 shadow-lg">
              <div className="flex items-center gap-5">
                <div className="p-3 bg-slate-100/10 rounded-2xl backdrop-blur-md border border-slate-100/20">
                   <Undo2 className="w-8 h-8" />
                </div>
                <div className="text-start">
                  <h3 className="text-3xl font-black tracking-tight">{t.newDisposal}</h3>
                  <p className="text-slate-100/60 text-[10px] font-black uppercase tracking-[0.2em]">{lang === 'ar' ? 'كشف إرجاع رسمي' : 'Official Return Note'}</p>
                </div>
              </div>
              <button onClick={() => setIsAdding(false)} className="p-4 hover:bg-slate-100/10 rounded-full transition-colors"><X className="w-8 h-8" /></button>
            </div>
            
            <form onSubmit={handleSubmitDisposal} className="p-10 space-y-10 overflow-y-auto custom-scrollbar flex-1" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-red-900/10 border border-red-900/20 p-6 rounded-3xl text-start flex flex-col gap-4 shadow-sm group hover:border-red-800 transition-all">
                   <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-800 rounded-lg shadow-md">
                      <CalendarX className="w-5 h-5 text-slate-100" />
                    </div>
                    <p className="text-red-900 font-black text-sm">{lang === 'ar' ? 'الأدوية منتهية الصلاحية' : 'Expired items detected'}</p>
                   </div>
                   <button 
                      type="button" 
                      onClick={() => handleAddAll('expired')}
                      disabled={expiredMeds.length === 0}
                      className="w-full py-3 bg-red-800 text-slate-100 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-900 transition-all shadow-lg shadow-red-900/20 disabled:opacity-30 active:scale-95"
                    >
                       {lang === 'ar' ? `إضافة جميع المنتهي (${expiredMeds.length})` : `Add all expired (${expiredMeds.length})`}
                    </button>
                </div>

                <div className="bg-slate-400 border border-slate-500 p-6 rounded-3xl text-start flex flex-col gap-4 shadow-sm group hover:border-slate-600 transition-all">
                   <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-800 rounded-lg shadow-md">
                      <Boxes className="w-5 h-5 text-slate-100" />
                    </div>
                    <p className="text-slate-900 font-black text-sm">{lang === 'ar' ? 'إرجاع كافة المخزن (فائض)' : 'Return All Stock (Surplus)'}</p>
                   </div>
                   <button 
                      type="button" 
                      onClick={() => handleAddAll('surplus')}
                      disabled={surplusMeds.length === 0}
                      className="w-full py-3 bg-slate-800 text-slate-100 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg shadow-slate-900/20 disabled:opacity-30 active:scale-95"
                    >
                       {lang === 'ar' ? `استرجاع كافة الأدوية (${surplusMeds.length})` : `Add all surplus (${surplusMeds.length})`}
                    </button>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h4 className="font-black text-slate-600 uppercase tracking-[0.2em] text-[11px] px-2">{t.itemsRequested}</h4>
                  <button type="button" onClick={() => handleAddItem()} className="text-[10px] font-black text-red-800 bg-red-900/10 px-4 py-2 rounded-xl hover:bg-red-900/20 transition-all uppercase tracking-widest border border-red-900/20">+ {lang === 'ar' ? 'إضافة صنف إضافي' : 'Add Extra Item'}</button>
                </div>
                
                <div className="space-y-4">
                  {formItems.map((item, idx) => (
                    <div key={idx} className="flex flex-col md:flex-row gap-4 p-6 bg-slate-400 rounded-[2rem] border border-slate-500 relative animate-in slide-in-from-bottom-2 shadow-inner">
                      <div className="flex-1 space-y-2 text-start">
                        <label className="text-[9px] font-black text-slate-100/60 uppercase tracking-widest px-2">{t.selectMed}</label>
                        <select 
                          className="w-full px-5 py-4 bg-slate-200 border-2 border-transparent rounded-2xl outline-none focus:border-red-800 text-sm font-black appearance-none cursor-pointer shadow-sm text-slate-900"
                          value={item.medicationId}
                          onChange={(e) => handleItemChange(idx, 'medicationId', e.target.value)}
                          required
                        >
                          <option value="">{t.chooseMed}</option>
                          {medications.map(m => (
                            <option key={m.id} value={m.id}>{m.name} ({m.dosage}) • {m.currentStock}</option>
                          ))}
                        </select>
                      </div>
                      <div className="w-32 space-y-2 text-start">
                        <label className="text-[9px] font-black text-slate-100/60 uppercase tracking-widest px-2">{t.quantity}</label>
                        <input 
                          type="number" 
                          className="w-full px-5 py-4 bg-slate-200 border-2 border-transparent rounded-2xl outline-none focus:border-red-800 text-sm font-black text-center shadow-sm text-slate-900"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(idx, 'quantity', parseInt(e.target.value) || 0)}
                          min="1"
                          required
                        />
                      </div>
                      <div className="w-40 space-y-2 text-start">
                        <label className="text-[9px] font-black text-slate-100/60 uppercase tracking-widest px-2">{t.reason}</label>
                        <select 
                          className="w-full px-5 py-4 bg-slate-200 border-2 border-transparent rounded-2xl outline-none focus:border-red-800 text-[11px] font-black appearance-none cursor-pointer shadow-sm text-slate-900"
                          value={item.reason}
                          onChange={(e) => handleItemChange(idx, 'reason', e.target.value)}
                        >
                          <option value="surplus">{t.surplus}</option>
                          <option value="expired">{t.expiredReason}</option>
                        </select>
                      </div>
                      <button type="button" onClick={() => handleRemoveItem(idx)} className="p-3 text-red-800 hover:text-red-900 hover:bg-slate-200 rounded-xl transition-all self-end md:mb-1">
                        <Trash2 className="w-6 h-6" />
                      </button>
                    </div>
                  ))}
                  
                  {formItems.length === 0 && (
                    <div className="py-12 text-center text-slate-500 border-2 border-dashed border-slate-400 rounded-3xl bg-slate-400/20 shadow-inner">
                      <p className="font-bold">{lang === 'ar' ? 'لم يتم إضافة أصناف بعد' : 'No items added yet'}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4 pt-10 border-t border-slate-400 text-start">
                <label className="text-[10px] font-black text-slate-700 uppercase tracking-[0.3em] px-2 flex items-center gap-3">
                  <Signature className="w-4 h-4 text-red-800" /> {t.nurseSign}
                </label>
                <input 
                  type="text" 
                  placeholder={lang === 'ar' ? 'اكتب اسمك للمصادقة على التسليم...' : 'Type name to authorize return...'}
                  className="w-full px-8 py-6 bg-slate-400 border-2 border-transparent rounded-3xl outline-none focus:border-red-800 text-2xl font-serif italic text-red-900 shadow-inner placeholder-slate-600"
                  value={nurseSignature}
                  onChange={(e) => setNurseSignature(e.target.value)}
                  required
                />
              </div>

              <div className="flex gap-6 pt-6">
                <button type="button" onClick={() => setIsAdding(false)} className="flex-1 py-6 bg-slate-400 text-slate-200 rounded-3xl font-black text-sm uppercase tracking-widest hover:bg-slate-500 transition-all border border-slate-500">{t.cancel}</button>
                <button type="submit" disabled={formItems.length === 0} className="flex-[2] py-6 bg-red-800 text-slate-100 rounded-3xl font-black text-lg hover:bg-red-900 shadow-2xl shadow-red-900/20 disabled:opacity-30 active:scale-95 transition-all uppercase tracking-widest">
                  {lang === 'ar' ? 'اعتماد كشف التسليم' : 'Approve Disposal List'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedRecord && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/50 backdrop-blur-md animate-in fade-in duration-300">
           <div className="bg-slate-300 w-full max-w-2xl rounded-[3.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-500">
              <div className={`${selectedRecord.status === 'completed' ? 'bg-slate-800' : 'bg-red-800'} p-10 text-slate-100 flex justify-between items-center shadow-lg`}>
                <div className="flex items-center gap-5">
                   <div className="p-3 bg-slate-100/10 rounded-2xl backdrop-blur-md border border-slate-100/20">
                     <FileText className="w-8 h-8" />
                   </div>
                   <div className="text-start">
                     <h3 className="text-2xl font-black tracking-tight">{t.disposalTitle}</h3>
                     <p className="text-slate-100/60 text-[10px] font-black uppercase tracking-widest">{selectedRecord.id}</p>
                   </div>
                </div>
                <button onClick={() => setSelectedRecord(null)} className="p-4 hover:bg-slate-100/10 rounded-full transition-colors"><X className="w-8 h-8" /></button>
              </div>

              <div className="p-10 space-y-10" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
                <div className="grid grid-cols-1 gap-4 max-h-60 overflow-y-auto custom-scrollbar pr-2">
                  {selectedRecord.items.map((item, i) => (
                    <div key={i} className="flex justify-between items-center p-6 bg-slate-400 rounded-3xl border border-slate-500 group shadow-sm">
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-lg shadow-inner ${item.reason === 'expired' ? 'bg-red-800 text-slate-100' : 'bg-slate-800 text-slate-100'}`}>
                          {item.reason === 'expired' ? <CalendarX className="w-4 h-4" /> : <Boxes className="w-4 h-4" />}
                        </div>
                        <div className="text-start">
                          <p className="font-black text-slate-900 text-base">{item.name}</p>
                          <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{item.reason === 'expired' ? t.expiredReason : t.surplus}</p>
                        </div>
                      </div>
                      <span className={`${item.reason === 'expired' ? 'bg-red-800' : 'bg-slate-800'} text-slate-100 px-4 py-2 rounded-xl text-xs font-black shadow-lg border border-transparent`}>
                        {item.quantity} {t.items}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-10 border-t border-slate-400 pt-10">
                  <div className="space-y-3 text-start">
                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest px-2">{t.nurseSign}</p>
                    <div className="p-6 bg-slate-400 rounded-3xl border border-slate-500 text-center italic font-serif text-slate-900 text-xl shadow-inner">
                      {selectedRecord.nurseSignature}
                    </div>
                  </div>
                  <div className="space-y-3 text-start">
                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest px-2">{t.supervisorSign}</p>
                    {selectedRecord.status === 'completed' ? (
                      <div className="p-6 bg-emerald-900/20 rounded-3xl border border-emerald-900/30 text-center italic font-serif text-emerald-800 text-xl shadow-inner">
                        {selectedRecord.supervisorSignature}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <input 
                          type="text" 
                          placeholder={lang === 'ar' ? 'توقيع المستلم...' : 'Receiver sign...'}
                          className="w-full px-5 py-5 bg-slate-200 border-2 border-red-800/30 rounded-2xl outline-none focus:border-red-800 font-serif italic text-red-900 text-xl shadow-sm placeholder-slate-500"
                          value={supervisorSignature}
                          onChange={(e) => setSupervisorSignature(e.target.value)}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {selectedRecord.status === 'pending' ? (
                  <button 
                    onClick={() => handleFinalizeDisposal(selectedRecord)}
                    disabled={!supervisorSignature}
                    className="w-full py-6 bg-red-800 text-slate-100 rounded-3xl font-black text-xl shadow-2xl shadow-red-900/20 hover:bg-red-900 disabled:opacity-30 active:scale-95 transition-all uppercase tracking-widest"
                  >
                    {t.finalizeDisposal}
                  </button>
                ) : (
                  <div className="flex flex-col items-center gap-4 p-8 bg-slate-800 rounded-[2.5rem] text-slate-100 shadow-2xl">
                    <div className="w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center text-slate-100 shadow-lg">
                       <CheckCircle className="w-10 h-10" />
                    </div>
                    <div className="text-center">
                      <p className="font-black text-lg">{lang === 'ar' ? 'اكتملت عملية الإرجاع للمخزن المركزي' : 'Return to central store completed'}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.3em] mt-2">
                        RECORDED ON: {new Date(selectedRecord.completionDate!).toLocaleString(lang === 'ar' ? 'ar-SA' : 'en-US')}
                      </p>
                    </div>
                  </div>
                )}
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default DisposalModule;
