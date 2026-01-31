
import React from 'react';
import { Medication, AdministrationLog, ViewState } from '../types.ts';
import { translations } from '../translations.ts';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { AlertCircle, Package, ShieldCheck, Database, TrendingUp, ChevronRight, Activity } from 'lucide-react';

interface DashboardProps {
  medications: Medication[];
  logs: AdministrationLog[];
  lang: 'en' | 'ar';
  onNavigate: (view: ViewState) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ medications = [], logs = [], lang, onNavigate }) => {
  const t = translations[lang] || translations['en'];

  const stats = [
    { label: t.totalUnits, val: medications.reduce((a, b) => a + (Number(b.currentStock) || 0), 0), icon: Database, color: 'text-slate-800', bg: 'bg-slate-300' },
    { label: t.totalInventory, val: medications.length, icon: Package, color: 'text-slate-600', bg: 'bg-slate-300' },
    { label: t.lowStockAlerts, val: medications.filter(m => (Number(m.currentStock) || 0) <= (Number(m.minThreshold) || 5)).length, icon: AlertCircle, color: 'text-red-800', bg: 'bg-red-100' },
    { label: t.verifiedActions, val: logs.filter(l => l.verified).length, icon: ShieldCheck, color: 'text-slate-700', bg: 'bg-slate-300' }
  ];

  const categoryStats = medications.reduce((acc: any, curr) => {
    const cat = curr.category || t.other;
    acc[cat] = (acc[cat] || 0) + (Number(curr.currentStock) || 0);
    return acc;
  }, {});

  const categoryData = Object.keys(categoryStats).map(key => ({
    name: key,
    value: categoryStats[key]
  })).sort((a, b) => b.value - a.value).slice(0, 5);

  const COLORS = ['#991b1b', '#1e293b', '#475569', '#64748b', '#334155'];

  return (
    <div className="space-y-8 animate-in fade-in duration-700 text-start">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-slate-300 p-8 rounded-[2rem] border border-slate-400 shadow-lg hover:border-red-400 transition-all group text-start">
            <div className={`w-10 h-10 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
              <stat.icon className="w-5 h-5" />
            </div>
            <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-1">{stat.label}</p>
            <p className="text-3xl font-black text-slate-900 tracking-tighter">{stat.val}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-slate-300 p-8 rounded-[2.5rem] border border-slate-400 shadow-lg">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h4 className="text-lg font-black text-slate-800 tracking-tight flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-red-800" />
                {t.categoryBreakdown}
              </h4>
              <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest mt-1">{t.realTimeLevels}</p>
            </div>
            <button onClick={() => onNavigate('inventory')} className="px-4 py-2 bg-slate-400 text-slate-100 rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 hover:bg-red-800 hover:text-slate-100 transition-all">
              {t.viewDetails} <ChevronRight className={`w-3 h-3 ${lang === 'ar' ? 'rotate-180' : ''}`} />
            </button>
          </div>
          
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} layout="vertical" margin={{ left: 10, right: 30 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#94a3b8" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 9, fontWeight: 700, fill: '#334155'}} orientation={lang === 'ar' ? 'right' : 'left'} axisLine={false} tickLine={false} />
                <Tooltip cursor={{fill: '#94a3b8'}} contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)', fontWeight: 'bold', fontSize: '11px', backgroundColor: '#e2e8f0'}} />
                <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={20}>
                  {categoryData.map((_, i) => <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-slate-300 p-8 rounded-[2.5rem] border-2 border-red-800 shadow-2xl flex flex-col justify-between overflow-hidden relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-red-400 rounded-full blur-3xl -mr-16 -mt-16 opacity-20"></div>
          
          <div>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 bg-red-800 rounded-xl flex items-center justify-center text-slate-100">
                <Activity className="w-5 h-5" />
              </div>
              <h4 className="text-xl font-black tracking-tight text-slate-900">{t.liveMonitor}</h4>
            </div>
            
            <div className="space-y-8">
               <div>
                  <div className="flex justify-between items-end mb-2">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-600">{t.stockAvailability}</p>
                    <span className="text-lg font-black text-red-800">96.4%</span>
                  </div>
                  <div className="h-1.5 bg-slate-400 rounded-full overflow-hidden">
                    <div className="h-full bg-red-800 w-[96.4%] rounded-full shadow-[0_0_10px_rgba(153,27,27,0.4)]"></div>
                  </div>
               </div>
               <div className="pt-4 border-t border-slate-400">
                  <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest mb-4">{t.adminToday}</p>
                  <div className="flex gap-1 items-end h-16">
                     {[30, 60, 45, 80, 50, 90, 40].map((h, i) => (
                       <div key={i} className="flex-1 bg-slate-400 rounded-t-md hover:bg-red-800 transition-colors" style={{ height: `${h}%` }}></div>
                     ))}
                  </div>
               </div>
            </div>
          </div>

          <button onClick={() => onNavigate('administer')} className="mt-8 w-full py-4 bg-red-800 text-slate-100 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg hover:bg-red-900 transition-all active:scale-95">
            {t.newAdminTask}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
