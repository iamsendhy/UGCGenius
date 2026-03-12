
import React, { useState } from 'react';
import { AppState, AspectRatio, VoiceStyle, CampaignGoal, TargetPlatform, VideoDuration } from './types';
import { analyzeProduct, generateUGCPrompt, generateCoverImage } from './services/geminiService';

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    step: 'input',
    url: '',
    campaignGoal: 'unboxing',
    platform: 'tiktok',
    duration: '30s',
    voiceStyle: 'casual',
    language: 'id',
    loading: false
  });

  const [copied, setCopied] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>(AspectRatio.RATIO_9_16);

  const startAnalysis = async () => {
    if (!state.url) {
      setState(prev => ({ ...prev, error: 'Silakan masukkan URL produk.' }));
      return;
    }
    setState(prev => ({ ...prev, loading: true, error: undefined }));
    try {
      const analysis = await analyzeProduct(state.url);
      setState(prev => ({ ...prev, analysis, step: 'analysis', loading: false }));
    } catch (err: any) {
      setState(prev => ({ ...prev, error: `Analisis gagal: ${err.message}`, loading: false }));
    }
  };

  const createUGCPrompt = async () => {
    if (!state.analysis) return;
    setState(prev => ({ ...prev, loading: true, error: undefined }));
    try {
      const ugcPrompt = await generateUGCPrompt(
        state.analysis, 
        state.language, 
        state.voiceStyle,
        state.campaignGoal,
        state.platform,
        state.duration
      );
      setState(prev => ({ ...prev, ugcPrompt, step: 'prompt', loading: false }));
    } catch (err: any) {
      setState(prev => ({ ...prev, error: `Gagal membuat script: ${err.message}`, loading: false }));
    }
  };

  const createCover = async () => {
    if (!state.ugcPrompt || !state.analysis) return;
    setState(prev => ({ ...prev, loading: true, error: undefined }));
    try {
      const coverImage = await generateCoverImage(
        state.ugcPrompt, 
        state.analysis, 
        aspectRatio, 
        state.referenceImage, 
        state.characterImage,
        state.coverInstruction
      );
      setState(prev => ({ ...prev, coverImage, step: 'image', loading: false }));
    } catch (err: any) {
      setState(prev => ({ ...prev, error: `Gagal membuat gambar: ${err.message}`, loading: false }));
    }
  };

  const reset = () => {
    setState({
      step: 'input',
      url: '',
      campaignGoal: 'unboxing',
      platform: 'tiktok',
      duration: '30s',
      voiceStyle: 'casual',
      language: 'id',
      loading: false
    });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, key: 'referenceImage' | 'characterImage') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = (reader.result as string).split(',')[1];
        setState(prev => ({ ...prev, [key]: base64String }));
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="min-h-screen pb-20 bg-slate-950 text-slate-100 selection:bg-indigo-500/30">
      {/* Navigation */}
      <nav className="p-4 border-b border-white/5 glass sticky top-0 z-50 flex justify-between items-center backdrop-blur-xl">
        <div className="flex items-center gap-3 cursor-pointer group" onClick={reset}>
          <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
            <i className="fas fa-bolt text-white"></i>
          </div>
          <h1 className="text-lg font-black tracking-tighter gradient-text">UGC GENIUS 2.0</h1>
        </div>
        
        <div className="hidden sm:flex items-center gap-2">
          {['input', 'analysis', 'prompt', 'image'].map((s, idx) => (
            <React.Fragment key={s}>
              <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${state.step === s ? 'bg-indigo-600 border-indigo-400 text-white' : 'border-white/10 text-slate-500'}`}>
                {idx + 1}. {s}
              </div>
              {idx < 3 && <div className="w-4 h-px bg-white/10"></div>}
            </React.Fragment>
          ))}
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 pt-10">
        {state.error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 flex items-center gap-3 text-sm animate-shake">
            <i className="fas fa-circle-exclamation"></i>
            {state.error}
          </div>
        )}

        {state.step === 'input' && (
          <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="text-center space-y-4">
              <h2 className="text-4xl sm:text-5xl font-black leading-tight tracking-tight">
                Turn URLs into <span className="gradient-text">Viral Content</span>
              </h2>
              <p className="text-slate-400 text-lg">Platform all-in-one untuk UGC Creator pro.</p>
            </div>

            <div className="glass p-8 rounded-3xl space-y-8 shadow-2xl shadow-indigo-500/5 border-white/10">
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Marketplace Link</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-4 flex items-center text-slate-500 group-focus-within:text-indigo-400 transition-colors">
                    <i className="fas fa-link"></i>
                  </div>
                  <input 
                    type="text" 
                    value={state.url}
                    onChange={(e) => setState(prev => ({ ...prev, url: e.target.value }))}
                    placeholder="Paste Tokopedia, Shopee, or Amazon URL..."
                    className="w-full bg-slate-900/50 border border-white/10 rounded-2xl pl-12 pr-6 py-5 focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all placeholder:text-slate-600 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Campaign Goal</label>
                  <select 
                    value={state.campaignGoal}
                    onChange={(e) => setState(prev => ({ ...prev, campaignGoal: e.target.value as CampaignGoal }))}
                    className="w-full bg-slate-900 border border-white/10 rounded-2xl px-5 py-4 outline-none focus:ring-2 focus:ring-indigo-500/50 appearance-none font-medium"
                  >
                    <option value="unboxing">Unboxing Experience</option>
                    <option value="problem_solution">Problem & Solution</option>
                    <option value="lifestyle">Aesthetic Lifestyle</option>
                    <option value="hard_sell">Hard Sell / Promo</option>
                  </select>
                </div>

                <div className="space-y-3">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Target Platform</label>
                  <div className="flex gap-2 p-1 bg-slate-900 border border-white/10 rounded-2xl">
                    {(['tiktok', 'reels', 'shorts'] as TargetPlatform[]).map(p => (
                      <button 
                        key={p}
                        onClick={() => setState(prev => ({ ...prev, platform: p }))}
                        className={`flex-1 py-3 rounded-xl text-xs font-bold uppercase transition-all ${state.platform === p ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <button 
                onClick={startAnalysis}
                disabled={state.loading}
                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold py-5 rounded-2xl transition-all shadow-xl shadow-indigo-600/20 flex items-center justify-center gap-3 text-lg"
              >
                {state.loading ? <><i className="fas fa-atom fa-spin"></i> Researching Product...</> : <><i className="fas fa-wand-magic-sparkles"></i> Generate AI Insight</>}
              </button>
            </div>
          </div>
        )}

        {state.step === 'analysis' && state.analysis && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 border-b border-white/10 pb-6">
              <div>
                <h2 className="text-4xl font-black tracking-tight">{state.analysis.name}</h2>
                <p className="text-indigo-400 font-bold uppercase tracking-widest text-xs mt-1">Brand: {state.analysis.brand}</p>
              </div>
              <button onClick={reset} className="text-slate-500 hover:text-white text-xs font-bold uppercase tracking-widest transition-colors flex items-center gap-2">
                <i className="fas fa-rotate-left"></i> Change Product
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="glass p-6 rounded-3xl border-l-4 border-indigo-500">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Viral Angle</p>
                <p className="text-sm font-semibold leading-relaxed text-indigo-100">{state.analysis.viralAngle}</p>
              </div>
              <div className="glass p-6 rounded-3xl">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Target Audience</p>
                <p className="text-sm leading-relaxed">{state.analysis.targetAudience}</p>
              </div>
              <div className="glass p-6 rounded-3xl">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2">Selling Points</p>
                <ul className="text-sm space-y-1">
                  {state.analysis.sellingPoints.slice(0, 3).map((s, i) => <li key={i} className="flex items-center gap-2"><i className="fas fa-check text-indigo-500 text-[10px]"></i> {s}</li>)}
                </ul>
              </div>
            </div>

            <div className="glass p-8 rounded-3xl space-y-8">
              <h3 className="text-xl font-bold flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 text-sm">2</span>
                Finalize Script Settings
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Script Language</label>
                  <div className="flex gap-2">
                    <button onClick={() => setState(prev => ({ ...prev, language: 'id' }))} className={`flex-1 py-3 rounded-xl border text-xs font-bold transition-all ${state.language === 'id' ? 'bg-indigo-600 border-indigo-400' : 'border-white/10 text-slate-500'}`}>ID</button>
                    <button onClick={() => setState(prev => ({ ...prev, language: 'en' }))} className={`flex-1 py-3 rounded-xl border text-xs font-bold transition-all ${state.language === 'en' ? 'bg-indigo-600 border-indigo-400' : 'border-white/10 text-slate-500'}`}>EN</button>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Voice Tone</label>
                  <select 
                    value={state.voiceStyle}
                    onChange={(e) => setState(prev => ({ ...prev, voiceStyle: e.target.value as VoiceStyle }))}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-xs font-bold outline-none"
                  >
                    <option value="casual">Casual & Chill</option>
                    <option value="excited">Hyper Excited</option>
                    <option value="professional">Serious / Pro</option>
                    <option value="humorous">Funny / Wit</option>
                  </select>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Video Duration</label>
                  <select 
                    value={state.duration}
                    onChange={(e) => setState(prev => ({ ...prev, duration: e.target.value as VideoDuration }))}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-xs font-bold outline-none"
                  >
                    <option value="15s">15 Seconds (Fast)</option>
                    <option value="30s">30 Seconds (Standard)</option>
                    <option value="60s">60 Seconds (Detailed)</option>
                  </select>
                </div>
              </div>

              <button 
                onClick={createUGCPrompt}
                disabled={state.loading}
                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold py-5 rounded-2xl transition-all shadow-xl shadow-indigo-600/20 flex items-center justify-center gap-3"
              >
                {state.loading ? <><i className="fas fa-pen-nib fa-spin"></i> Writing Script...</> : <><i className="fas fa-clapperboard"></i> Generate Final Script</>}
              </button>
            </div>
          </div>
        )}

        {state.step === 'prompt' && state.ugcPrompt && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
              <h2 className="text-3xl font-black tracking-tight">Your Video Blueprint</h2>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(JSON.stringify(state.ugcPrompt, null, 2));
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className={`px-5 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all ${copied ? 'bg-green-600 text-white' : 'bg-white/5 border border-white/10 hover:bg-white/10 text-slate-400'}`}
              >
                <i className={`fas ${copied ? 'fa-check' : 'fa-copy'}`}></i>
                {copied ? 'Copied' : 'Copy JSON'}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="glass p-6 rounded-3xl border-b-4 border-red-500">
                <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-red-500 block mb-2">The Hook</span>
                <p className="text-sm font-medium italic">"{state.ugcPrompt.hook}"</p>
              </div>
              <div className="glass p-6 rounded-3xl border-b-4 border-indigo-500">
                <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-indigo-500 block mb-2">The Body</span>
                <p className="text-sm font-medium italic">"{state.ugcPrompt.body}"</p>
              </div>
              <div className="glass p-6 rounded-3xl border-b-4 border-green-500">
                <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-green-500 block mb-2">The CTA</span>
                <p className="text-sm font-medium italic">"{state.ugcPrompt.cta}"</p>
              </div>
            </div>

            <div className="glass rounded-3xl overflow-hidden border border-white/10">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-white/5 text-slate-500 text-[9px] uppercase tracking-widest font-bold">
                    <tr>
                      <th className="px-6 py-4">Visual Action</th>
                      <th className="px-6 py-4">Voice Over</th>
                      <th className="px-6 py-4">Settings</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {state.ugcPrompt.scenes.map((scene, i) => (
                      <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-6 py-5 align-top">
                          <p className="font-bold text-indigo-400 mb-1">Scene {i+1}</p>
                          <p className="text-xs text-slate-300 leading-relaxed">{scene.visual_action}</p>
                        </td>
                        <td className="px-6 py-5 align-top italic text-slate-400 leading-relaxed min-w-[240px]">
                          "{scene.voice_over}"
                        </td>
                        <td className="px-6 py-5 align-top">
                          <div className="flex flex-col gap-2">
                             <span className="px-2 py-1 bg-white/5 rounded text-[10px] font-mono text-slate-500">{scene.tempo}</span>
                             <span className="px-2 py-1 bg-white/5 rounded text-[10px] font-mono text-slate-500">{scene.camera_settings}</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Image Customization */}
            <div className="glass p-8 rounded-3xl space-y-8">
               <h3 className="text-xl font-bold flex items-center gap-3">
                <i className="fas fa-camera-retro text-indigo-400"></i>
                Create Visual Cover
               </h3>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Ref. Mood</label>
                        <div className="relative aspect-video bg-slate-900 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center overflow-hidden group">
                           <input type="file" onChange={(e) => handleFileUpload(e, 'referenceImage')} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                           {state.referenceImage ? <img src={`data:image/jpeg;base64,${state.referenceImage}`} className="w-full h-full object-cover" /> : <i className="fas fa-plus text-slate-700 group-hover:text-indigo-500 transition-colors"></i>}
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Ref. Person</label>
                        <div className="relative aspect-video bg-slate-900 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center overflow-hidden group">
                           <input type="file" onChange={(e) => handleFileUpload(e, 'characterImage')} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                           {state.characterImage ? <img src={`data:image/jpeg;base64,${state.characterImage}`} className="w-full h-full object-cover" /> : <i className="fas fa-plus text-slate-700 group-hover:text-indigo-500 transition-colors"></i>}
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Aspect Ratio</label>
                      <select value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value as AspectRatio)} className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-xs font-bold">
                        {Object.values(AspectRatio).map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Additional AI Prompt</label>
                    <textarea 
                      value={state.coverInstruction || ''}
                      onChange={(e) => setState(prev => ({ ...prev, coverInstruction: e.target.value }))}
                      placeholder="Contoh: Berikan pencahayaan neon ungu kebiruan, fokus pada ekspresi wajah bahagia..."
                      className="w-full h-28 bg-slate-900 border border-white/10 rounded-2xl p-4 text-sm focus:ring-2 focus:ring-indigo-500/50 outline-none resize-none"
                    />
                    <button 
                      onClick={createCover}
                      disabled={state.loading}
                      className="w-full bg-white text-slate-950 hover:bg-indigo-100 disabled:opacity-50 font-black py-4 rounded-2xl transition-all flex items-center justify-center gap-2"
                    >
                      {state.loading ? <i className="fas fa-cog fa-spin"></i> : <><i className="fas fa-magic"></i> Generate Cover</>}
                    </button>
                  </div>
               </div>
            </div>
          </div>
        )}

        {state.step === 'image' && state.coverImage && (
          <div className="space-y-10 animate-in fade-in zoom-in duration-700 text-center py-10">
            <div className="space-y-2">
              <h2 className="text-4xl font-black">Your UGC Kit is Ready!</h2>
              <p className="text-slate-400">Download the visual and start recording your content.</p>
            </div>

            <div className="relative group inline-block">
               <div className="absolute -inset-4 bg-indigo-500/20 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
               <img src={state.coverImage} alt="UGC Cover" className="relative w-full max-w-sm mx-auto rounded-3xl shadow-2xl border border-white/10" />
            </div>

            <div className="flex flex-col sm:flex-row justify-center gap-4">
               <button 
                onClick={() => {
                  const a = document.createElement('a');
                  a.href = state.coverImage!;
                  a.download = `ugc-cover-${Date.now()}.png`;
                  a.click();
                }}
                className="px-10 py-5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl transition-all shadow-xl shadow-indigo-600/20 flex items-center justify-center gap-2"
               >
                 <i className="fas fa-download"></i> Save Cover
               </button>
               <button 
                onClick={() => setState(prev => ({ ...prev, step: 'prompt' }))}
                className="px-10 py-5 bg-white/5 hover:bg-white/10 text-white font-bold border border-white/10 rounded-2xl transition-all flex items-center justify-center gap-2"
               >
                 <i className="fas fa-pencil"></i> Adjust Script
               </button>
            </div>

            <button onClick={reset} className="text-slate-500 hover:text-white text-xs font-bold uppercase tracking-widest mt-10">
              Create New Project
            </button>
          </div>
        )}
      </main>

      {/* Progress Footer */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
        <div className="bg-slate-900/80 backdrop-blur-2xl border border-white/10 px-6 py-4 rounded-full flex items-center gap-6 shadow-2xl">
          <div className="flex items-center gap-3">
             <div className={`w-2.5 h-2.5 rounded-full ${state.loading ? 'bg-amber-500 animate-pulse' : 'bg-green-500'}`}></div>
             <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
               {state.loading ? 'AI Processing...' : 'Ready to work'}
             </span>
          </div>
          <div className="h-4 w-px bg-white/10"></div>
          <div className="flex gap-4 text-slate-500 text-xs">
             <i className="fab fa-tiktok"></i>
             <i className="fab fa-instagram"></i>
             <i className="fab fa-youtube"></i>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
