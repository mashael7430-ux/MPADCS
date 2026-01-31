
import React, { useState } from 'react';
import { Medication, PharmacyRequest } from '../types.ts';
import { translations } from '../translations.ts';
import { 
  Plus, CheckCircle2, Signature, X, 
  Trash2, Clock, CheckCircle, Store, 
  ArrowLeftRight, FileText, PackageCheck
} from 'lucide-react';

interface PharmacyModuleProps {
  medications: Medication[];
  requests: PharmacyRequest[];
  setRequests: React.Dispatch<React.SetStateAction<PharmacyRequest[]>>;
  onReceiveStock: (items: { medicationId: string; quantity: number }[]) => void;
  lang: 'en' | 'ar';
  showToast: (msg: string) => void;
}

const PharmacyModule: React.FC<PharmacyModuleProps> = ({ medications, requests, setRequests, onReceiveStock, lang, showToast }) => {
  const t = translations[lang] || translations['en'];
  const [isAdding, setIsAdding] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<PharmacyRequest | null>(null);
  
  const [formItems, setFormItems] = useState<{ medicationId: string; quantity: number }[]>([]);
  const [nurseSignature, setNurseSignature] = useState('');
  
  const [pharmaSignature, setPharmaSignature] = useState('');

  const handleAddItem = () => {
    setFormItems([...formItems, { medicationId: '', quantity: 1 }]);
  };

  const handleRemoveItem = (index: number) => {
    setFormItems(formItems.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...formItems];
    newItems[index] = { ...newItems[index], [field]: value };
    setFormItems(newItems);
  };

  const handleSubmitRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (formItems.length === 0 || !nurseSignature) return;

    const newRequest: PharmacyRequest = {
      id: `REQ-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      items: formItems.map(item => ({
        medicationId: item.medicationId,
        name: medications.find(m => m.id === item.medicationId)?.name || 'Unknown',
        quantity: item.quantity
      })),
      requestDate: new Date().toISOString(),
      nurseManagerSignature: nurseSignature,
      status: 'pending'
    };

    setRequests([newRequest, ...requests]);
    setIsAdding(false);
    setFormItems([]);
    setNurseSignature('');
    showToast(lang === 'ar' ? 'تم إنشاء كشف التوريد بنجاح' : 'Supply request created successfully');
  };

  const handleConfirmReceipt = (request: PharmacyRequest) => {
    if (!pharmaSignature) return;

    const updatedRequests = requests.map(r => 
      r.id === request.id 
        ? { ...r, status: 'received' as const, pharmacistSignature: pharmaSignature, receiveDate: new Date().toISOString() } 
        : r
    );

    setRequests(updatedRequests);
    onReceiveStock(request.items.map(i => ({ medicationId: i.medicationId, quantity: i.quantity })));
    setSelectedRequest(null);
    setPharmaSignature('');
    showToast(lang === 'ar' ? 'تم توثيق الاستلام وتحديث المخزون' : 'Handover documented and stock updated');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 text-start">
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-red-800 rounded-2xl shadow-lg shadow-red-900/20 text-slate-100">
            <Store className="w-8 h-8" />
          </div>
          <div className="text-start">
            <h3 className="text-2xl font-black text-slate-900">{t.pharmacyRequest}</h3>
            <p className="text-slate-600 text-sm font-medium">{lang === 'ar' ? 'نظام تسليم واستلام العهدة الدوائية' : 'Medication handover & supply system'}</p>
          </div>
        </div>
        <button 
          onClick={() => setIsAdding(true)} 
          className="flex items-center gap-3 px-8 py-4 bg-red-800 text-slate-100 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-red-900 transition-all active:scale-95"
        >
          <Plus className="w-5 h-5" /> {t.newPharmacyOrder}
        </button>
      </div>

      <div className="grid gap-6">
        {requests.length > 0 ? requests.map((req) => (
          <div key={req.id} className="bg-slate-300 p-8 rounded-[2.5rem] border border-slate-400 shadow-md flex flex-col md:flex-row gap-8 items-center hover:shadow-2xl transition-all group relative overflow-hidden">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 shadow-lg ${
              req.status === 'received' ? 'bg-slate-800 text-slate-100' : 'bg-red-800 text-slate-100'
            }`}>
              {req.status === 'received' ? <PackageCheck className="w-8 h-8" /> : <Clock className="w-8 h-8" />}
            </div>

            <div className="flex-1 text-start">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-[10px] font-black bg-slate-400 text-slate-100 px-3 py-1 rounded-full uppercase tracking-widest border border-slate-500">ID: {req.id}</span>
                <span className={`px-3 py-1 text-[10px] uppercase font-black rounded-full tracking-widest shadow-sm ${
                  req.status === 'received' ? 'bg-emerald-900/20 text-emerald-800 border border-emerald-900/30' : 'bg-amber-900/20 text-amber-800 border border-amber-900/30'
                }`}>
                  {req.status === 'received' ? t.receivedStock : t.pendingRequest}
                </span>
              </div>
              <h4 className="font-black text-slate-800 text-xl tracking-tight">
                {t.orderDate}: {new Date(req.requestDate).toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'en-US')}
              </h4>
              <div className="mt-3 flex items-center gap-2 text-slate-600 font-bold text-sm">
                 <ArrowLeftRight className="w-4 h-4 text-red-800" />
                 <span>{req.items.length} {t.items} {lang === 'ar' ? 'تم طلبها' : 'requested'}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button 
                onClick={() => setSelectedRequest(req)}
                className={`px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-md active:scale-95 whitespace-nowrap ${
                  req.status === 'received' ? 'bg-slate-800 text-slate-100 hover:bg-black' : 'bg-red-800 text-slate-100 hover:bg-red-900'
                }`}
              >
                {req.status === 'received' ? t.viewDetails : t.markReceived}
              </button>
            </div>
          </div>
        )) : (
          <div className="py-32 bg-slate-300 rounded-[3rem] border-2 border-dashed border-slate-400 text-center flex flex-col items-center">
             <div className="bg-red-900/10 w-24 h-24 rounded-full flex items-center justify-center mb-8 shadow-inner">
              <Store className="w-12 h-12 text-red-800/40" />
            </div>
            <h4 className="text-2xl font-black text-slate-800">{lang === 'ar' ? 'لا توجد كشوف استلام' : 'No Handover Notes'}</h4>
            <p className="text-slate-600 mt-2 max-w-sm font-bold">{lang === 'ar' ? 'سوف تظهر هنا كشوف تسليم واستلام الأدوية الواردة من الصيدلية المركزية.' : 'Delivery notes for medications from central pharmacy will appear here.'}</p>
          </div>
        )}
      </div>

      {isAdding && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-slate-300 w-full max-w-2xl rounded-[3.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-500 flex flex-col max-h-[90vh]">
            <div className="bg-red-800 p-10 text-slate-100 flex justify-between items-center shadow-lg shrink-0">
              <div className="flex items-center gap-5">
                <div className="p-3 bg-slate-100/10 rounded-2xl backdrop-blur-md border border-slate-100/20">
                   <Store className="w-8 h-8" />
                </div>
                <div className="text-start">
                  <h3 className="text-2xl font-black tracking-tight">{t.newPharmacyOrder}</h3>
                  <p className="text-slate-100/60 text-[10px] font-black uppercase tracking-widest">{lang === 'ar' ? 'طلب توريد واستلام رسمي' : 'Official Handover Request'}</p>
                </div>
              </div>
              <button onClick={() => setIsAdding(false)} className="p-4 hover:bg-slate-100/10 rounded-full transition-colors"><X className="w-8 h-8" /></button>
            </div>
            
            <form onSubmit={handleSubmitRequest} className="p-10 space-y-8 overflow-y-auto custom-scrollbar flex-1" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
               <div className="space-y-4">
                  <div className="flex justify-between items-center px-2">
                    <h4 className="text-[10px] font-black text-slate-700 uppercase tracking-widest">{t.itemsRequested}</h4>
                    <button type="button" onClick={handleAddItem} className="text-[9px] font-black bg-slate-400 text-slate-100 px-4 py-2 rounded-xl hover:bg-slate-500 transition-all border border-slate-500">+ {lang === 'ar' ? 'إضافة صنف' : 'Add Item'}</button>
                  </div>
                  {formItems.map((item, idx) => (
                    <div key={idx} className="flex flex-col md:flex-row gap-4 p-6 bg-slate-400 rounded-3xl border border-slate-500 shadow-inner relative animate-in slide-in-from-bottom-2">
                       <div className="flex-1 space-y-2 text-start">
                          <label className="text-[9px] font-black text-slate-100/60 uppercase tracking-widest px-2">{t.selectMed}</label>
                          <select 
                            className="w-full px-5 py-4 bg-slate-200 border-2 border-transparent rounded-2xl outline-none focus:border-red-800 text-sm font-black appearance-none cursor-pointer shadow-sm text-slate-900"
                            value={item.medicationId}
                            onChange={(e) => handleItemChange(idx, 'medicationId', e.target.value)}
                            required
                          >
                            <option value="">{t.chooseMed}</option>
                            {medications.map(m => <option key={m.id} value={m.id}>{m.name} • ({m.currentStock})</option>)}
                          </select>
                        </div>
                        <div className="w-full md:w-32 space-y-2 text-start">
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
                        <button type="button" onClick={() => handleRemoveItem(idx)} className="p-3 text-red-800 hover:bg-slate-200 rounded-xl transition-all self-end md:mb-1">
                          <Trash2 className="w-5 h-5" />
                        </button>
                    </div>
                  ))}
               </div>

               <div className="space-y-4 pt-6 border-t border-slate-400">
                  <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest px-2 flex items-center gap-2">
                    <Signature className="w-4 h-4 text-red-800" /> {t.nurseManagerSign}
                  </label>
                  <input 
                    type="text" 
                    placeholder={lang === 'ar' ? 'اسم مدير التمريض للمصادقة...' : 'Nurse manager name for approval...'}
                    className="w-full px-6 py-5 bg-slate-400 border border-slate-500 rounded-2xl outline-none focus:border-red-800 font-serif italic text-red-900 text-xl shadow-inner placeholder-slate-600"
                    value={nurseSignature}
                    onChange={(e) => setNurseSignature(e.target.value)}
                    required
                  />
               </div>

               <div className="flex gap-4">
                  <button type="button" onClick={() => setIsAdding(false)} className="flex-1 py-5 bg-slate-400 text-slate-100 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-500 transition-all border border-slate-500">{t.cancel}</button>
                  <button type="submit" disabled={formItems.length === 0} className="flex-[2] py-5 bg-red-800 text-slate-100 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-900 shadow-xl disabled:opacity-30 transition-all">
                    {lang === 'ar' ? 'اعتماد الطلب' : 'Finalize Request'}
                  </button>
               </div>
            </form>
          </div>
        </div>
      )}

      {selectedRequest && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/50 backdrop-blur-md animate-in fade-in duration-300">
           <div className="bg-slate-300 w-full max-w-xl rounded-[3.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 border border-slate-500">
              <div className={`${selectedRequest.status === 'received' ? 'bg-slate-800' : 'bg-red-800'} p-10 text-slate-100 flex justify-between items-center shadow-lg`}>
                <div className="flex items-center gap-5">
                   <div className="p-3 bg-slate-100/10 rounded-2xl backdrop-blur-md border border-slate-100/20">
                     <FileText className="w-8 h-8" />
                   </div>
                   <div className="text-start">
                     <h3 className="text-2xl font-black tracking-tight">{t.deliveryNote}</h3>
                     <p className="text-slate-100/60 text-[10px] font-black uppercase tracking-widest">{selectedRequest.id}</p>
                   </div>
                </div>
                <button onClick={() => setSelectedRequest(null)} className="p-4 hover:bg-slate-100/10 rounded-full transition-colors"><X className="w-8 h-8" /></button>
              </div>

              <div className="p-10 space-y-8" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
                <div className="space-y-3 max-h-48 overflow-y-auto custom-scrollbar pr-2">
                   {selectedRequest.items.map((item, i) => (
                     <div key={i} className="flex justify-between items-center p-5 bg-slate-400 rounded-2xl border border-slate-500 group shadow-sm">
                        <span className="font-black text-slate-900">{item.name}</span>
                        <span className="bg-red-800 text-slate-100 px-3 py-1 rounded-lg text-xs font-black shadow-lg">
                          {item.quantity} {t.items}
                        </span>
                     </div>
                   ))}
                </div>

                <div className="grid grid-cols-2 gap-8 border-t border-slate-400 pt-8">
                   <div className="space-y-2 text-start">
                      <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest px-2">{t.nurseManagerSign}</p>
                      <div className="p-5 bg-slate-400 rounded-2xl border border-slate-500 text-center italic font-serif text-slate-900 text-lg shadow-inner">
                        {selectedRequest.nurseManagerSignature}
                      </div>
                   </div>
                   <div className="space-y-2 text-start">
                      <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest px-2">{t.pharmacistSign}</p>
                      {selectedRequest.status === 'received' ? (
                        <div className="p-5 bg-emerald-900/20 rounded-2xl border border-emerald-900/30 text-center italic font-serif text-emerald-800 text-lg shadow-inner">
                          {selectedRequest.pharmacistSignature}
                        </div>
                      ) : (
                        <input 
                          type="text" 
                          placeholder={lang === 'ar' ? 'توقيع الصيدلي للمصادقة...' : 'Pharmacist sign to confirm...'}
                          className="w-full px-5 py-4 bg-slate-200 border-2 border-red-800/30 rounded-2xl outline-none focus:border-red-800 font-serif italic text-red-900 text-lg shadow-sm placeholder-slate-500"
                          value={pharmaSignature}
                          onChange={(e) => setPharmaSignature(e.target.value)}
                        />
                      )}
                   </div>
                </div>

                {selectedRequest.status === 'pending' ? (
                  <button 
                    onClick={() => handleConfirmReceipt(selectedRequest)}
                    disabled={!pharmaSignature}
                    className="w-full py-5 bg-red-800 text-slate-100 rounded-2xl font-black text-sm uppercase tracking-widest shadow-xl hover:bg-red-900 disabled:opacity-30 transition-all flex items-center justify-center gap-3"
                  >
                    <PackageCheck className="w-5 h-5" /> {t.markReceived}
                  </button>
                ) : (
                  <div className="p-6 bg-slate-800 rounded-3xl text-slate-100 flex flex-col items-center gap-2 shadow-2xl">
                     <CheckCircle className="w-10 h-10 text-emerald-500" />
                     <p className="font-black text-sm uppercase tracking-widest">{t.receivedStock}</p>
                     <p className="text-[9px] text-slate-400 font-bold">{new Date(selectedRequest.receiveDate!).toLocaleString(lang === 'ar' ? 'ar-SA' : 'en-US')}</p>
                  </div>
                )}
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default PharmacyModule;
