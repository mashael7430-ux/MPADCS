
import React, { useState } from 'react';
import { Pill, ShieldCheck, Lock, User, AlertCircle, Sparkles } from 'lucide-react';
import { translations } from '../translations.ts';

interface LoginProps {
  lang: 'en' | 'ar';
  setLang: (l: 'en' | 'ar') => void;
  onLogin: () => void;
}

const Login: React.FC<LoginProps> = ({ lang, setLang, onLogin }) => {
  const t = translations[lang] || translations['en'];
  const [staffId, setStaffId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(false);

    const validUsers = ['admin', '1234', 'mashael', 'مشاعل', '367763'];
    const validPass = ['admin', '1234', 'mashael', 'مشاعل'];

    setTimeout(() => {
      if (validUsers.includes(staffId.toLowerCase()) && validPass.includes(password.toLowerCase())) {
        localStorage.setItem('mpadcs_auth', 'true');
        onLogin();
      } else {
        setError(true);
        setIsLoading(false);
      }
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-slate-400 flex items-center justify-center p-6 relative overflow-hidden" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      {/* Red Accents */}
      <div className="absolute top-0 right-0 w-[60vw] h-[60vw] bg-red-900 rounded-full blur-[120px] -mr-[30vw] -mt-[30vw] opacity-30"></div>
      <div className="absolute bottom-0 left-0 w-[50vw] h-[50vw] bg-slate-300 rounded-full blur-[120px] -ml-[25vw] -mb-[25vw] opacity-40"></div>

      <div className="w-full max-w-[400px] relative z-10 animate-in fade-in zoom-in-95 duration-1000">
        <div className="flex flex-col items-center mb-10 text-center">
          <div className="w-16 h-16 bg-red-800 rounded-3xl shadow-2xl shadow-red-900 flex items-center justify-center mb-6">
            <Pill className="w-8 h-8 text-slate-100" />
          </div>
          <h1 className="text-4xl font-black text-slate-100 tracking-tighter mb-2">{t.appName}</h1>
          <p className="text-slate-200 font-bold text-[10px] uppercase tracking-[0.3em] opacity-80">{t.appFullName}</p>
        </div>

        <div className="bg-slate-300 rounded-[2.5rem] p-10 border border-slate-500 shadow-2xl">
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2 text-start">
              <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest px-2">{t.staffId}</label>
              <div className="relative group">
                <User className={`absolute top-1/2 -translate-y-1/2 ${lang === 'ar' ? 'right-4' : 'left-4'} w-4 h-4 text-slate-500 group-focus-within:text-red-800 transition-colors`} />
                <input 
                  type="text" 
                  className={`w-full ${lang === 'ar' ? 'pr-12 pl-4' : 'pl-12 pr-4'} py-4 bg-slate-400 border border-slate-500 rounded-2xl outline-none focus:bg-slate-200 focus:border-red-800 transition-all font-bold text-slate-900 shadow-sm placeholder-slate-600`}
                  value={staffId}
                  onChange={(e) => setStaffId(e.target.value)}
                  placeholder="ID"
                  required
                />
              </div>
            </div>
            
            <div className="space-y-2 text-start">
              <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest px-2">{t.password}</label>
              <div className="relative group">
                <Lock className={`absolute top-1/2 -translate-y-1/2 ${lang === 'ar' ? 'right-4' : 'left-4'} w-4 h-4 text-slate-500 group-focus-within:text-red-800 transition-colors`} />
                <input 
                  type="password" 
                  className={`w-full ${lang === 'ar' ? 'pr-12 pl-4' : 'pl-12 pr-4'} py-4 bg-slate-400 border border-slate-500 rounded-2xl outline-none focus:bg-slate-200 focus:border-red-800 transition-all font-bold text-slate-900 shadow-sm placeholder-slate-600`}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-900 text-slate-100 rounded-2xl text-[10px] font-bold flex items-center gap-3 animate-shake border border-red-700">
                <AlertCircle className="w-4 h-4" /> {t.loginError}
              </div>
            )}

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full py-5 bg-red-800 text-slate-100 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-red-900 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-3 shadow-xl"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-slate-100/30 border-t-slate-100 rounded-full animate-spin"></div>
              ) : (
                <>{t.signIn}</>
              )}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-slate-400 flex justify-between items-center">
            <div className="flex gap-1">
              {['en', 'ar'].map(l => (
                <button 
                  key={l}
                  onClick={() => setLang(l as 'en' | 'ar')} 
                  className={`px-3 py-1.5 rounded-lg text-[9px] font-black transition-all ${lang === l ? 'bg-red-800 text-slate-100' : 'bg-slate-400 text-slate-200 hover:bg-slate-500'}`}
                >
                  {l.toUpperCase()}
                </button>
              ))}
            </div>
            <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Protocol v5.3 Medium Gray</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
