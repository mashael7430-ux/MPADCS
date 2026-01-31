
import React, { useMemo } from 'react';
import { AdministrationLog, ViewState } from '../types.ts';
import { translations } from '../translations.ts';
import { User, Pill, Calendar, ChevronRight, History } from 'lucide-react';

interface PatientRecordsProps {
  logs: AdministrationLog[];
  lang: 'en' | 'ar';
  onNavigate: (view: ViewState) => void;
}

interface PatientSummary {
  patientId: string;
  meds: Set<string>;
  lastDate: string;
  totalDoses: number;
}

const PatientRecords: React.FC<PatientRecordsProps> = ({ logs, lang, onNavigate }) => {
  const t = translations[lang] || translations['en'];

  const patientSummaries = useMemo(() => {
    const summaryMap: Record<string, PatientSummary> = {};

    logs.forEach(log => {
      if (!summaryMap[log.patientId]) {
        summaryMap[log.patientId] = {
          patientId: log.patientId,
          meds: new Set(),
          lastDate: log.timestamp,
          totalDoses: 0
        };
      }

      const p = summaryMap[log.patientId];
      p.meds.add(log.medicationName);
      p.totalDoses += log.quantityGiven;
      
      if (new Date(log.timestamp) > new Date(p.lastDate)) {
        p.lastDate = log.timestamp;
      }
    });

    return Object.values(summaryMap).sort((a, b) => 
      new Date(b.lastDate).getTime() - new Date(a.lastDate).getTime()
    );
  }, [logs]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="text-start">
          <h3 className="text-2xl font-black text-slate-900">{t.patients}</h3>
          <p className="text-slate-700">{lang === 'ar' ? 'نظرة عامة على المرضى والأدوية التي تم صرفها لهم' : 'Overview of patients and medications dispensed to them'}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {patientSummaries.length > 0 ? patientSummaries.map((p) => (
          <div key={p.patientId} className="bg-slate-300 rounded-3xl border border-slate-400 shadow-xl hover:shadow-2xl transition-all group overflow-hidden">
            <div className="p-6">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-slate-400 flex items-center justify-center text-red-800 shadow-inner">
                    <User className="w-6 h-6" />
                  </div>
                  <div className="text-start">
                    <p className="text-xs font-bold text-slate-600 uppercase tracking-widest">{t.patientId}</p>
                    <p className="text-lg font-bold text-slate-800">{p.patientId}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="text-start">
                  <p className="text-xs font-bold text-slate-600 uppercase tracking-widest mb-2 flex items-center gap-2">
                    <Pill className="w-3 h-3 text-red-800" /> {t.medsReceived}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {Array.from(p.meds).map((med, idx) => (
                      <span key={idx} className="px-3 py-1 bg-slate-400 text-slate-100 text-[10px] font-bold rounded-lg border border-slate-500 uppercase tracking-tight shadow-sm">
                        {med}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-400">
                  <div className="text-start">
                    <p className="text-xs font-bold text-slate-600 uppercase tracking-widest mb-1 flex items-center gap-2">
                      <Calendar className="w-3 h-3 text-red-800" /> {t.lastAdmin}
                    </p>
                    <p className="text-sm font-bold text-slate-800">
                      {new Date(p.lastDate).toLocaleDateString(lang === 'en' ? 'en-US' : 'ar-SA')}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-bold text-slate-600 uppercase tracking-widest mb-1">{t.totalDoses}</p>
                    <p className="text-lg font-black text-red-800">{p.totalDoses}</p>
                  </div>
                </div>
              </div>
            </div>
            
            <button onClick={() => onNavigate('history')} className="w-full py-4 bg-slate-400 hover:bg-red-800 hover:text-white transition-all text-slate-100 text-sm font-bold flex items-center justify-center gap-2 border-t border-slate-500 group shadow-inner">
              {t.viewFullHistory}
              <ChevronRight className={`w-4 h-4 transition-transform group-hover:translate-x-1 ${lang === 'ar' ? 'rotate-180 group-hover:-translate-x-1' : ''}`} />
            </button>
          </div>
        )) : (
          <div className="col-span-full py-24 bg-slate-300 rounded-3xl border border-dashed border-slate-500 text-center shadow-inner">
             <div className="bg-slate-400 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <History className="w-10 h-10 text-slate-500" />
            </div>
            <h4 className="text-xl font-bold text-slate-600">{t.noPatients}</h4>
            <p className="text-slate-500 mt-2 max-w-sm mx-auto">{t.startAdmin}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientRecords;
