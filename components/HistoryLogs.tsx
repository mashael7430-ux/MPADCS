
import React, { useState, useMemo } from 'react';
import { AdministrationLog } from '../types.ts';
import { translations } from '../translations.ts';
import { CheckCircle, Search, ShieldAlert, History as HistoryIcon } from 'lucide-react';

interface HistoryLogsProps {
  logs: AdministrationLog[];
  lang: 'en' | 'ar';
  showToast: (msg: string) => void;
}

const HistoryLogs: React.FC<HistoryLogsProps> = ({ logs = [], lang, showToast }) => {
  const t = translations[lang] || translations['en'];
  const [searchTerm, setSearchTerm] = useState('');

  const filteredLogs = useMemo(() => {
    return logs.filter(log => 
      log.medicationName.toLowerCase().includes(searchTerm.toLowerCase()) || 
      log.patientId.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [logs, searchTerm]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 text-start">
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="text-start">
          <h3 className="text-2xl font-black text-slate-900">{t.auditTrail}</h3>
          <p className="text-slate-600 text-sm">{lang === 'ar' ? 'سجل زمني لكافة عمليات إعطاء الأدوية' : 'Chronological record of all medication events'}</p>
        </div>
        <div className="relative w-full md:w-72 group">
          <Search className={`${lang === 'ar' ? 'right-4' : 'left-4'} absolute top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600 group-focus-within:text-red-800 transition-colors`} />
          <input 
            type="text"
            placeholder={lang === 'ar' ? 'بحث في السجلات...' : 'Search logs...'}
            className={`w-full ${lang === 'ar' ? 'pr-12 pl-4' : 'pl-12 pr-4'} py-3.5 rounded-2xl bg-slate-300 border border-slate-500 outline-none text-sm font-bold text-slate-900 focus:border-red-800 transition-all shadow-lg placeholder-slate-600`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-4">
        {filteredLogs.map((log) => (
          <div key={log.id} className="bg-slate-300 p-6 rounded-[2rem] border border-slate-400 shadow-md flex flex-col md:flex-row items-center gap-6 hover:border-red-400 transition-all text-start">
            <div className={`p-4 rounded-2xl ${log.verified ? 'bg-emerald-900/20 text-emerald-600' : 'bg-red-900/20 text-red-800'}`}>
              {log.verified ? <CheckCircle className="w-8 h-8" /> : <ShieldAlert className="w-8 h-8" />}
            </div>
            <div className="flex-1">
              <h4 className="font-black text-slate-900 text-lg">{log.medicationName}</h4>
              <div className="flex gap-3 items-center mt-1">
                <span className="text-[10px] font-black bg-slate-400 text-slate-100 px-2 py-0.5 rounded border border-slate-500 uppercase tracking-widest">PATIENT: {log.patientId}</span>
                <span className="text-[10px] font-bold text-slate-600">{new Date(log.timestamp).toLocaleString(lang === 'ar' ? 'ar-SA' : 'en-US')}</span>
              </div>
            </div>
            <div className="flex gap-4 items-center px-6 border-x border-slate-400">
               <div className="text-center">
                  <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1">Pre</p>
                  <p className="font-bold text-slate-700">{log.preCount}</p>
               </div>
               <div className="text-center">
                  <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1">Qty</p>
                  <p className="font-bold text-red-800">-{log.quantityGiven}</p>
               </div>
               <div className="text-center">
                  <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1">Post</p>
                  <p className={`font-black ${log.verified ? 'text-emerald-600' : 'text-slate-900'}`}>{log.postCount}</p>
               </div>
            </div>
            <button 
              onClick={() => showToast(lang === 'ar' ? 'جاري تحميل الدليل الرقمي...' : 'Loading digital proof...')}
              className="px-5 py-3 bg-slate-400 text-slate-100 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-red-800 hover:text-slate-100 transition-all shadow-md"
            >
              {lang === 'ar' ? 'عرض الدليل' : 'View Proof'}
            </button>
          </div>
        ))}

        {filteredLogs.length === 0 && (
          <div className="py-24 bg-slate-300 rounded-[3rem] border border-dashed border-slate-400 text-center">
             <div className="bg-slate-400 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <HistoryIcon className="w-10 h-10 text-slate-500" />
            </div>
            <h4 className="text-xl font-bold text-slate-600">{lang === 'ar' ? 'سجل التدقيق فارغ' : 'Log Archive Empty'}</h4>
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoryLogs;
