
import React, { useState, useRef } from 'react';
import { Medication, AdministrationLog, PillCountResult } from '../types.ts';
import { translations } from '../translations.ts';
import { analyzePillCount } from '../services/geminiService.ts';
import { 
  CheckCircle, AlertTriangle, ArrowRight, 
  Syringe, Pill, Baby, UserCircle, 
  ShieldCheck, ChevronLeft,
  Hash, Sparkles, Camera, RefreshCcw, Loader2
} from 'lucide-react';

interface AdministrationModuleProps {
  medications: Medication[];
  onLog: (log: AdministrationLog) => void;
  lang: 'en' | 'ar';
}

const AdministrationModule: React.FC<AdministrationModuleProps> = ({ medications = [], onLog, lang }) => {
  const t = translations[lang] || translations['en'];
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedMedId, setSelectedMedId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [patientId, setPatientId] = useState('');
  
  // AI Scanning State
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [scanResult, setScanResult] = useState<PillCountResult | null>(null);
  const [manualObservedCount, setManualObservedCount] = useState<number | ''>('');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const selectedMed = medications.find(m => m.id === selectedMedId);
  const expectedPostCount = selectedMed ? selectedMed.currentStock - quantity : 0;

  const startCamera = async () => {
    setIsCameraActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera error:", err);
      alert(lang === 'ar' ? "تعذر الوصول للكاميرا" : "Camera access denied");
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
      context?.drawImage(videoRef.current, 0, 0);
      const dataUrl = canvasRef.current.toDataURL('image/jpeg');
      setCapturedImage(dataUrl);
      
      // Stop camera
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      setIsCameraActive(false);
      
      handleAIScan(dataUrl);
    }
  };

  const handleAIScan = async (image: string) => {
    setIsAnalyzing(true);
    try {
      const base64 = image.split(',')[1];
      const result = await analyzePillCount(base64, selectedMed?.name || '');
      setScanResult(result);
      setManualObservedCount(result.count);
    } catch (err) {
      console.error("AI Scan failed:", err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const finishAdmin = () => {
    if (!selectedMed || manualObservedCount === '') return;
    onLog({
      id: Math.random().toString(36).substr(2, 9),
      medicationId: selectedMed.id,
      medicationName: selectedMed.name,
      quantityGiven: quantity,
      preCount: selectedMed.currentStock,
      postCount: Number(manualObservedCount),
      adminBy: "Sarah Chen",
      patientId,
      timestamp: new Date().toISOString(),
      verified: Number(manualObservedCount) === expectedPostCount,
    });
    setStep(1); setSelectedMedId(''); setQuantity(1); setPatientId(''); setManualObservedCount(''); setScanResult(null); setCapturedImage(null);
  };

  return (
    <div className="max-w-2xl mx-auto bg-slate-300 rounded-[2.5rem] border border-slate-500 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500">
      <div className={`bg-red-800 p-8 text-slate-100 transition-all duration-500 text-start`}>
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="bg-slate-100/10 p-2.5 rounded-xl">
              <Sparkles className="w-5 h-5 text-red-100" />
            </div>
            <div>
              <h3 className="text-xl font-black tracking-tight">{t.newAdminTask}</h3>
              <p className="text-slate-100/60 text-[9px] font-bold uppercase tracking-widest">{lang === 'ar' ? 'تدقيق ضوئي ذكي' : 'Smart Optical Audit'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {[1, 2, 3].map(s => (
              <div key={s} className={`h-1.5 rounded-full transition-all duration-500 ${step === s ? 'w-8 bg-slate-100' : 'w-2 bg-slate-100/20'}`} />
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between bg-black/20 rounded-2xl p-6 border border-slate-100/10 shadow-inner">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center font-black text-2xl bg-slate-100 text-red-800 shadow-lg">
              {step}
            </div>
            <div>
              <p className="text-[9px] text-slate-100/50 font-black uppercase tracking-widest mb-0.5">{lang === 'ar' ? 'المرحلة' : 'Stage'}</p>
              <p className="text-lg font-black tracking-tight">
                {step === 1 && t.step1}
                {step === 2 && t.aiVerification}
                {step === 3 && t.step3}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-8 space-y-8 text-start">
        {step === 1 && (
          <div className="space-y-8 animate-in slide-in-from-bottom-6 duration-500">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest px-2">{t.patientId}</label>
              <input 
                type="text" 
                placeholder={t.patientPlaceholder} 
                className={`w-full py-4 px-6 rounded-xl bg-slate-400 border border-slate-500 focus:border-red-800 focus:bg-slate-200 outline-none transition-all font-bold text-lg text-slate-900 shadow-sm placeholder-slate-600`}
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-700 uppercase tracking-widest px-2">{t.selectMed}</label>
              <select 
                className="w-full px-6 py-4 rounded-xl bg-slate-400 border border-slate-500 focus:border-red-800 focus:bg-slate-200 outline-none transition-all font-bold text-base appearance-none cursor-pointer shadow-sm text-slate-900"
                value={selectedMedId}
                onChange={(e) => setSelectedMedId(e.target.value)}
              >
                <option value="">{t.chooseMed}</option>
                {medications.map(m => (
                  <option key={m.id} value={m.id}>{m.name} • (Ref: {m.refNumber}) • ({m.currentStock})</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-4 p-6 bg-red-900/10 rounded-2xl border border-red-900/20">
              <div className="flex-1 text-start">
                <p className="text-[9px] font-black text-red-800 uppercase tracking-widest mb-2">{t.qtyToAdmin}</p>
                <div className="flex items-center gap-3">
                   <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="w-10 h-10 rounded-lg bg-slate-200 font-black text-xl text-red-800">-</button>
                   <span className="w-8 text-center font-black text-2xl text-slate-900">{quantity}</span>
                   <button onClick={() => setQuantity(q => q + 1)} className="w-10 h-10 rounded-lg bg-red-800 text-slate-100 font-black text-xl">+</button>
                </div>
              </div>
            </div>
            <button 
              disabled={!selectedMedId || !patientId}
              onClick={() => setStep(2)}
              className="w-full py-4.5 bg-red-800 text-slate-100 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-red-900 shadow-2xl transition-all disabled:opacity-30"
            >
              {lang === 'ar' ? 'تفعيل التدقيق البصري' : 'Activate Visual Audit'}
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-in zoom-in-95 duration-500">
            {!isCameraActive && !capturedImage && (
              <div className="flex flex-col items-center gap-6 py-12">
                <div className="w-24 h-24 bg-red-900/10 rounded-full flex items-center justify-center">
                  <Camera className="w-12 h-12 text-red-800" />
                </div>
                <p className="text-slate-700 font-bold text-center max-w-xs">{lang === 'ar' ? "استخدم الكاميرا لعد الأقراص المتبقية تلقائياً." : "Use camera to count remaining pills automatically."}</p>
                <button onClick={startCamera} className="px-10 py-4 bg-red-800 text-slate-100 rounded-2xl font-black flex items-center gap-3 shadow-xl">
                   <Camera className="w-5 h-5" /> {t.activateCamera}
                </button>
              </div>
            )}

            {isCameraActive && (
              <div className="relative rounded-[2rem] overflow-hidden border-4 border-red-800 shadow-2xl aspect-video bg-black">
                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                <div className="absolute inset-0 border-[40px] border-black/40 pointer-events-none">
                   <div className="w-full h-full border-2 border-red-500/50 dashed-anim"></div>
                </div>
                <button onClick={capturePhoto} className="absolute bottom-6 left-1/2 -translate-x-1/2 w-16 h-16 bg-red-100 border-4 border-red-800 rounded-full shadow-2xl flex items-center justify-center">
                   <div className="w-10 h-10 bg-red-800 rounded-full"></div>
                </button>
              </div>
            )}

            {capturedImage && (
              <div className="space-y-6">
                 <div className="relative rounded-[2rem] overflow-hidden border-4 border-slate-500 shadow-xl">
                    <img src={capturedImage} className="w-full aspect-video object-cover" />
                    {isAnalyzing && (
                      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center text-slate-100 gap-4">
                        <Loader2 className="w-10 h-10 animate-spin text-red-500" />
                        <p className="font-black text-sm uppercase tracking-widest">{t.scanning}</p>
                      </div>
                    )}
                 </div>

                 {scanResult && (
                   <div className="bg-slate-400 p-6 rounded-3xl border border-slate-500 space-y-4">
                      <div className="flex justify-between items-center">
                         <div>
                            <p className="text-[9px] font-black text-slate-700 uppercase tracking-widest">{t.pillsFound}</p>
                            <p className="text-4xl font-black text-red-800">{scanResult.count}</p>
                         </div>
                         <div className="text-end">
                            <p className="text-[9px] font-black text-slate-700 uppercase tracking-widest">{t.confidence}</p>
                            <p className="text-lg font-black text-slate-800">{Math.round(scanResult.confidence * 100)}%</p>
                         </div>
                      </div>
                      <div className="h-2 bg-slate-300 rounded-full overflow-hidden">
                        <div className="h-full bg-red-800 transition-all duration-1000" style={{ width: `${scanResult.confidence * 100}%` }}></div>
                      </div>
                   </div>
                 )}

                 <div className="flex gap-4">
                    <button onClick={() => { setCapturedImage(null); setScanResult(null); startCamera(); }} className="flex-1 py-4 bg-slate-400 text-slate-100 rounded-2xl font-black text-xs flex items-center justify-center gap-2">
                      <RefreshCcw className="w-4 h-4" /> {t.retake}
                    </button>
                    <button onClick={() => setStep(3)} disabled={!scanResult} className="flex-[2] py-4 bg-red-800 text-slate-100 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl">
                      {lang === 'ar' ? 'اعتماد النتيجة' : 'Accept Scan'}
                    </button>
                 </div>
              </div>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-8 animate-in slide-in-from-right-6 duration-500">
             <div className={`p-8 rounded-[2rem] border-2 flex flex-col items-center text-center gap-4 ${Number(manualObservedCount) === expectedPostCount ? 'bg-emerald-900/10 border-emerald-900/20' : 'bg-red-900/10 border-red-900/20'}`}>
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-slate-100 shadow-2xl ${Number(manualObservedCount) === expectedPostCount ? 'bg-emerald-600' : 'bg-red-800'}`}>
                  {Number(manualObservedCount) === expectedPostCount ? <ShieldCheck className="w-8 h-8" /> : <AlertTriangle className="w-8 h-8" />}
                </div>
                <h4 className="text-2xl font-black text-slate-900 tracking-tight">
                    {Number(manualObservedCount) === expectedPostCount ? t.scanMatch : t.scanMismatch}
                </h4>
                <div className="grid grid-cols-2 gap-4 w-full">
                   <div className="bg-slate-400 p-4 rounded-xl text-start border border-slate-500">
                      <p className="text-[8px] font-black text-slate-200 uppercase mb-1">Expected</p>
                      <p className="text-xl font-black text-slate-900">{expectedPostCount}</p>
                   </div>
                   <div className="bg-slate-400 p-4 rounded-xl text-start border border-slate-500">
                      <p className="text-[8px] font-black text-slate-200 uppercase mb-1">AI Count</p>
                      <p className={`text-xl font-black ${Number(manualObservedCount) === expectedPostCount ? 'text-emerald-600' : 'text-red-800'}`}>{manualObservedCount}</p>
                   </div>
                </div>
             </div>
             <button onClick={finishAdmin} className="w-full py-5 bg-red-800 text-slate-100 rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl">
               {t.completeSign}
             </button>
          </div>
        )}
      </div>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default AdministrationModule;
