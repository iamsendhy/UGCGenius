
import React, { useState } from 'react';
import { AppState, AspectRatio, VoiceStyle, CampaignGoal, TargetPlatform, VideoDuration } from './types';
import { analyzeProduct, generateUGCPrompt, generateCoverImage, testConnection } from './services/geminiService';

const App: React.FC = () => {
  // Helper to format any error into a readable string
  const formatError = (err: any): string => {
    if (!err) return 'Unknown error';
    if (typeof err === 'string') return err;
    if (err instanceof Error) {
      return `${err.name}: ${err.message}\n${err.stack || ''}`;
    }
    try {
      const stringified = JSON.stringify(err, null, 2);
      if (stringified === '{}') {
        return `Error object details: ${err.message || 'No message'} (Keys: ${Object.keys(err).join(', ')})`;
      }
      return stringified;
    } catch {
      return String(err);
    }
  };

  const [state, setState] = useState<AppState>({
    step: 'input',
    url: '',
    apiKey: localStorage.getItem('gemini_api_key') || '',
    campaignGoal: 'unboxing',
    platform: 'tiktok',
    duration: '30s',
    voiceStyle: 'casual',
    scriptStyle: 'pain_killer',
    language: 'id',
    loading: false
  });

  const [copied, setCopied] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>(AspectRatio.RATIO_9_16);
  const [apiError, setApiError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'testing' | 'success' | 'failed'>('idle');
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error' | 'info'} | null>(null);

  // Show toast notification
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Save API Key to localStorage
  const saveApiKey = (key: string) => {
    localStorage.setItem('gemini_api_key', key);
    console.log('✅ API Key saved to localStorage:', key.substring(0, 8) + '...');
  };

  React.useEffect(() => {
    const savedKey = localStorage.getItem('gemini_api_key');
    if (savedKey) {
      console.log('📝 Loaded API Key from localStorage:', savedKey.substring(0, 8) + '...');
    }
  }, []);

  const testApiKey = async () => {
    if (!state.apiKey) {
      setApiError('API Key is empty. Please enter your Gemini API Key.');
      return;
    }
    
    const trimmedApiKey = state.apiKey.trim();
    setConnectionStatus('testing');
    setApiError(null);
    
    try {
      console.log('Testing connection...');
      const result = await testConnection(trimmedApiKey);
      setConnectionStatus(result ? 'success' : 'failed');
      if (!result) {
        setApiError('Connection failed. Key might be invalid or model not available.');
      }
    } catch (err: any) {
      console.error('Connection Test Failed:', err);
      setConnectionStatus('failed');
      setApiError(formatError(err));
    }
  };

  const startAnalysis = async () => {
    if (!state.url) {
      setState(prev => ({ ...prev, error: 'Silakan masukkan URL produk.' }));
      return;
    }
    if (!state.apiKey) {
      setState(prev => ({ ...prev, error: 'Silakan masukkan Gemini API Key.' }));
      return;
    }
    
    const trimmedApiKey = state.apiKey.trim();
    setApiError(null);
    setState(prev => ({ ...prev, loading: true, error: undefined }));
    
    try {
      const analysis = await analyzeProduct(state.url, trimmedApiKey);
      setState(prev => ({ ...prev, analysis, step: 'analysis', loading: false }));
    } catch (err: any) {
      console.error('Analysis failed:', err);
      const errorDetail = formatError(err);
      setApiError(errorDetail);
      setState(prev => ({ ...prev, error: `Analisis gagal: ${err.message || 'Lihat Debug Info'}`, loading: false }));
    }
  };

  const createUGCPrompt = async () => {
    if (!state.analysis) {
      console.error('❌ No analysis data!');
      return;
    }
    
    console.log('🚀 Starting createUGCPrompt...');
    console.log('📊 Analysis:', state.analysis);
    console.log('🎭 Script Style:', state.scriptStyle);
    console.log('🔑 API Key:', state.apiKey.substring(0, 8) + '...');
    
    setState(prev => ({ ...prev, loading: true, error: undefined }));
    
    try {
      console.log('📡 Calling generateUGCPrompt...');
      const ugcPrompt = await generateUGCPrompt(
        state.analysis,
        state.language,
        state.voiceStyle,
        state.scriptStyle,
        state.campaignGoal,
        state.platform,
        state.duration,
        state.apiKey
      );
      
      console.log('✅ UGC Prompt generated:', ugcPrompt);
      console.log('🎬 Setting state to prompt step...');
      
      setState(prev => ({ ...prev, ugcPrompt, step: 'prompt', loading: false }));
      
      console.log('✅ State updated successfully');
    } catch (err: any) {
      console.error('❌ createUGCPrompt error:', err);
      setApiError(formatError(err));
      setState(prev => ({ ...prev, error: `Script gagal: ${err.message}`, loading: false }));
    }
  };

  const createCover = async () => {
    if (!state.ugcPrompt || !state.analysis) {
      showToast('❌ Missing script data!', 'error');
      return;
    }
    
    console.log('🎨 Starting createCover...');
    setState(prev => ({ ...prev, loading: true, error: undefined }));
    
    try {
      // generateCoverImage akan throw error dengan image prompt
      await generateCoverImage(
        state.ugcPrompt,
        state.analysis,
        aspectRatio,
        state.referenceImage,
        state.characterImage,
        state.coverInstruction,
        state.apiKey
      );
    } catch (err: any) {
      // Extract image prompt dari error message
      const errorMessage = err.message;
      const promptMatch = errorMessage.match(/Use this prompt with.*?:\n\n([\s\S]+)/);
      
      if (promptMatch) {
        const imagePrompt = promptMatch[1];
        // Copy prompt ke clipboard
        navigator.clipboard.writeText(imagePrompt);
        showToast('📋 Image prompt copied! Use with Midjourney/DALL-E', 'success');
        
        // Set prompt sebagai "cover image" untuk ditampilkan
        setState(prev => ({ 
          ...prev, 
          coverImage: null,
          coverInstruction: imagePrompt, // Store prompt
          loading: false 
        }));
      } else {
        console.error('❌ createCover error:', err);
        showToast(`❌ ${err.message}`, 'error');
        setState(prev => ({ ...prev, loading: false, error: err.message }));
      }
    }
  };

  const reset = () => {
    setState({
      step: 'input',
      url: '',
      apiKey: localStorage.getItem('gemini_api_key') || '',
      campaignGoal: 'unboxing',
      platform: 'tiktok',
      duration: '30s',
      voiceStyle: 'casual',
      scriptStyle: 'pain_killer',
      language: 'id',
      loading: false,
      analysis: undefined,
      ugcPrompt: undefined,
      coverImage: undefined,
      coverInstruction: undefined,
      referenceImage: undefined,
      characterImage: undefined
    });
    setApiError(null);
    setConnectionStatus('idle');
    setToast(null);
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
    <div className="min-h-screen pb-20 bg-slate-950 text-slate-100 selection:bg-indigo-500/30 font-sans">
      <nav className="p-4 border-b border-white/5 glass sticky top-0 z-50 flex justify-between items-center backdrop-blur-xl">
        <div className="flex items-center gap-3 cursor-pointer group" onClick={reset}>
          <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
            <i className="fas fa-bolt text-white"></i>
          </div>
          <h1 className="text-lg font-black tracking-tighter gradient-text">UGC GENIUS 2.0</h1>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 pt-10">
        {state.error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 flex items-start gap-3 text-sm animate-shake">
            <i className="fas fa-circle-exclamation mt-0.5"></i>
            <span className="flex-1 whitespace-pre-line">{state.error}</span>
          </div>
        )}

        {apiError && (
          <div className="mb-6 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="p-5 bg-slate-900 border border-red-500/30 rounded-2xl shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-red-500">TECHNICAL DEBUG INFO</h3>
                <button onClick={() => setApiError(null)} className="text-slate-500 hover:text-white transition-colors">
                  <i className="fas fa-times"></i>
                </button>
              </div>
              <pre className="text-xs font-mono text-red-400/90 whitespace-pre-wrap leading-relaxed max-h-[300px] overflow-y-auto custom-scrollbar bg-black/20 p-4 rounded-xl">
                {apiError}
              </pre>
              <div className="mt-4 pt-4 border-t border-white/5 flex gap-4">
                 <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-[10px] font-bold text-indigo-400 hover:underline">GET API KEY</a>
                 <button onClick={testApiKey} className="text-[10px] font-bold text-slate-400 hover:text-white underline">RE-TEST CONNECTION</button>
              </div>
            </div>
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
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Gemini API Key</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-4 flex items-center text-slate-500 group-focus-within:text-indigo-400 transition-colors">
                    <i className="fas fa-key"></i>
                  </div>
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    value={state.apiKey}
                    onChange={(e) => {
                      const newKey = e.target.value;
                      setState(prev => ({ ...prev, apiKey: newKey }));
                      // Auto-save to localStorage when user types valid key
                      if (newKey.length > 20 && newKey.startsWith('AIza')) {
                        saveApiKey(newKey);
                      }
                    }}
                    placeholder="Enter your Gemini API Key..."
                    className="w-full bg-slate-900/50 border border-white/10 rounded-2xl pl-12 pr-12 py-5 focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all placeholder:text-slate-600 font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute inset-y-0 right-4 flex items-center text-slate-500 hover:text-indigo-400 transition-colors"
                  >
                    <i className={`fas ${showApiKey ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                  </button>
                </div>
                
                <div className="flex flex-wrap items-center justify-between gap-4 text-xs ml-1">
                  <p className="text-slate-500">
                    Get your key at{' '}
                    <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline">
                      Google AI Studio
                    </a>
                  </p>
                  
                  {state.apiKey && (
                    <div className="flex items-center gap-3">
                      <span className={`font-mono px-2 py-1 rounded bg-white/5 ${state.apiKey.trim().startsWith('AIza') ? 'text-green-500' : 'text-red-400'}`}>
                        {state.apiKey.substring(0, 8)}...{state.apiKey.substring(state.apiKey.length - 4)}
                      </span>
                      <span className="text-xs text-green-400 flex items-center gap-1">
                        <i className="fas fa-check-circle"></i> Saved locally
                      </span>
                      <button
                        onClick={testApiKey}
                        disabled={connectionStatus === 'testing'}
                        className={`font-bold flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all ${
                          connectionStatus === 'success' ? 'bg-green-500/10 border-green-500/20 text-green-400' :
                          connectionStatus === 'failed' ? 'bg-red-500/10 border-red-500/20 text-red-400' :
                          'bg-indigo-500/10 border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/20'
                        }`}
                      >
                        <i className={`fas ${
                          connectionStatus === 'testing' ? 'fa-spinner fa-spin' :
                          connectionStatus === 'success' ? 'fa-check-circle' :
                          connectionStatus === 'failed' ? 'fa-circle-xmark' :
                          'fa-plug'
                        }`}></i>
                        {connectionStatus === 'testing' ? 'Testing...' :
                         connectionStatus === 'success' ? 'Connected!' :
                         connectionStatus === 'failed' ? 'Failed' :
                         'Test Connection'}
                      </button>
                    </div>
                  )}
                </div>
              </div>

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

              <button 
                onClick={startAnalysis}
                disabled={state.loading}
                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold py-5 rounded-2xl transition-all shadow-xl shadow-indigo-600/20 flex items-center justify-center gap-3 text-lg"
              >
                {state.loading ? <><i className="fas fa-atom fa-spin"></i> Researching...</> : <><i className="fas fa-wand-magic-sparkles"></i> Generate AI Insight</>}
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

            {/* Script Style Selector */}
            <div className="glass p-8 rounded-3xl space-y-6">
              <div>
                <h3 className="text-xl font-bold flex items-center gap-3 mb-2">
                  <span className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 text-sm">2</span>
                  Choose Script Style
                </h3>
                <p className="text-sm text-slate-400 ml-11">Select the storytelling approach for your UGC script</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* The Pain Killer */}
                <button
                  onClick={() => setState(prev => ({ ...prev, scriptStyle: 'pain_killer' }))}
                  className={`p-5 rounded-2xl border-2 text-left transition-all hover:scale-[1.02] ${
                    state.scriptStyle === 'pain_killer'
                      ? 'bg-indigo-600/20 border-indigo-500 shadow-lg shadow-indigo-500/20'
                      : 'bg-slate-900/50 border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">💊</span>
                    <span className="text-sm font-bold">The Pain Killer</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    "Masalah [A] membuat saya stres, tapi [Produk] menyelamatkan saya."
                  </p>
                </button>

                {/* The Skeptic Disarmer */}
                <button
                  onClick={() => setState(prev => ({ ...prev, scriptStyle: 'skeptic_disarmer' }))}
                  className={`p-5 rounded-2xl border-2 text-left transition-all hover:scale-[1.02] ${
                    state.scriptStyle === 'skeptic_disarmer'
                      ? 'bg-indigo-600/20 border-indigo-500 shadow-lg shadow-indigo-500/20'
                      : 'bg-slate-900/50 border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">🤔</span>
                    <span className="text-sm font-bold">The Skeptic Disarmer</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    "Saya belum pernah coba ini sebelumnya, percaya atau tidak..."
                  </p>
                </button>

                {/* The Social Proof */}
                <button
                  onClick={() => setState(prev => ({ ...prev, scriptStyle: 'social_proof' }))}
                  className={`p-5 rounded-2xl border-2 text-left transition-all hover:scale-[1.02] ${
                    state.scriptStyle === 'social_proof'
                      ? 'bg-indigo-600/20 border-indigo-500 shadow-lg shadow-indigo-500/20'
                      : 'bg-slate-900/50 border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">👥</span>
                    <span className="text-sm font-bold">The Social Proof</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    "[Orang terdekat] saya baru pakai ini [X hari], dan hasilnya..."
                  </p>
                </button>

                {/* The Bold Promise */}
                <button
                  onClick={() => setState(prev => ({ ...prev, scriptStyle: 'bold_promise' }))}
                  className={`p-5 rounded-2xl border-2 text-left transition-all hover:scale-[1.02] ${
                    state.scriptStyle === 'bold_promise'
                      ? 'bg-indigo-600/20 border-indigo-500 shadow-lg shadow-indigo-500/20'
                      : 'bg-slate-900/50 border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">🎯</span>
                    <span className="text-sm font-bold">The Bold Promise</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    "Bagaimana jika saya katakan Anda bisa [Hasil Besar]? Ini buktinya."
                  </p>
                </button>

                {/* The Redemption Story */}
                <button
                  onClick={() => setState(prev => ({ ...prev, scriptStyle: 'redemption_story' }))}
                  className={`p-5 rounded-2xl border-2 text-left transition-all hover:scale-[1.02] md:col-span-2 lg:col-span-2 ${
                    state.scriptStyle === 'redemption_story'
                      ? 'bg-indigo-600/20 border-indigo-500 shadow-lg shadow-indigo-500/20'
                      : 'bg-slate-900/50 border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">✨</span>
                    <span className="text-sm font-bold">The Redemption Story</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    "Saya sudah coba semua cara [Daftar Kegagalan], sampai saya temukan ini."
                  </p>
                </button>
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
        )}

        {state.step === 'prompt' && state.ugcPrompt && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
              <h2 className="text-3xl font-black tracking-tight">Your Video Blueprint</h2>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(JSON.stringify(state.ugcPrompt, null, 2));
                  showToast('📋 Script copied to clipboard!', 'success');
                }}
                className="px-5 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 bg-white/5 border border-white/10 hover:bg-white/10 transition-all hover:scale-105"
              >
                <i className="fas fa-copy"></i> Copy JSON
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

            <div className="flex gap-4">
              <button
                onClick={() => setState(prev => ({ ...prev, step: 'analysis' }))}
                className="px-8 py-4 bg-white/5 hover:bg-white/10 text-white font-bold border border-white/10 rounded-2xl transition-all flex items-center justify-center gap-2"
              >
                <i className="fas fa-arrow-left"></i> Back to Analysis
              </button>
              <button
                onClick={() => setState(prev => ({ ...prev, step: 'image' }))}
                className="flex-1 px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl transition-all shadow-xl shadow-indigo-600/20 flex items-center justify-center gap-2"
              >
                <i className="fas fa-image"></i> Generate Cover Image
              </button>
            </div>
          </div>
        )}

        {state.step === 'image' && state.ugcPrompt && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
              <h2 className="text-3xl font-black tracking-tight">Generate Cover Image</h2>
              <button
                onClick={() => setState(prev => ({ ...prev, step: 'prompt' }))}
                className="text-slate-500 hover:text-white text-xs font-bold uppercase tracking-widest transition-colors flex items-center gap-2"
              >
                <i className="fas fa-arrow-left"></i> Back to Script
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left: Settings */}
              <div className="space-y-6">
                {/* Reference Images */}
                <div className="space-y-4">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Reference Images (Optional)</label>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Mood/Style</label>
                      <div className="relative aspect-square bg-slate-900 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center overflow-hidden group hover:border-indigo-500/50 transition-colors">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileUpload(e, 'referenceImage')}
                          className="absolute inset-0 opacity-0 cursor-pointer z-10"
                        />
                        {state.referenceImage ? (
                          <img src={`data:image/jpeg;base64,${state.referenceImage}`} className="w-full h-full object-cover" />
                        ) : (
                          <div className="text-center p-4">
                            <i className="fas fa-plus text-slate-700 text-2xl mb-2"></i>
                            <p className="text-xs text-slate-600">Upload</p>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-2">Character</label>
                      <div className="relative aspect-square bg-slate-900 border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center overflow-hidden group hover:border-indigo-500/50 transition-colors">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileUpload(e, 'characterImage')}
                          className="absolute inset-0 opacity-0 cursor-pointer z-10"
                        />
                        {state.characterImage ? (
                          <img src={`data:image/jpeg;base64,${state.characterImage}`} className="w-full h-full object-cover" />
                        ) : (
                          <div className="text-center p-4">
                            <i className="fas fa-user text-slate-700 text-2xl mb-2"></i>
                            <p className="text-xs text-slate-600">Upload</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Aspect Ratio */}
                <div className="space-y-3">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Aspect Ratio</label>
                  <div className="flex gap-2 p-1 bg-slate-900 border border-white/10 rounded-2xl">
                    {[AspectRatio.RATIO_9_16, AspectRatio.RATIO_1_1, AspectRatio.RATIO_16_9].map((ratio) => (
                      <button
                        key={ratio}
                        onClick={() => setAspectRatio(ratio)}
                        className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all ${
                          aspectRatio === ratio
                            ? 'bg-indigo-600 text-white shadow-lg'
                            : 'text-slate-500 hover:text-slate-300'
                        }`}
                      >
                        {ratio}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Prompt */}
                <div className="space-y-3">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Additional Prompt</label>
                  <textarea
                    value={state.coverInstruction || ''}
                    onChange={(e) => setState(prev => ({ ...prev, coverInstruction: e.target.value }))}
                    placeholder="Example: Give it a purple neon glow, focus on happy facial expression, cinematic lighting..."
                    className="w-full h-32 bg-slate-900 border border-white/10 rounded-2xl p-4 text-sm focus:ring-2 focus:ring-indigo-500/50 outline-none resize-none"
                  />
                </div>

                {/* Generate Button */}
                <button
                  onClick={createCover}
                  disabled={state.loading}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold py-5 rounded-2xl transition-all shadow-xl shadow-indigo-600/20 flex items-center justify-center gap-3"
                >
                  {state.loading ? (
                    <><i className="fas fa-wand-magic-sparkles fa-spin"></i> Generating...</>
                  ) : (
                    <><i className="fas fa-image"></i> Generate Cover</>
                  )}
                </button>
              </div>

              {/* Right: Preview */}
              <div className="space-y-4">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Preview</label>
                
                {state.coverInstruction && state.coverInstruction.length > 200 ? (
                  <div className="w-full bg-slate-900 border border-white/10 rounded-3xl p-6 space-y-4">
                    <div className="flex items-center gap-2 text-green-400">
                      <i className="fas fa-circle-check"></i>
                      <span className="text-sm font-bold">Image Prompt Generated!</span>
                    </div>
                    <div className="bg-slate-950 rounded-xl p-4 border border-white/5">
                      <p className="text-xs text-slate-400 font-mono leading-relaxed">
                        {state.coverInstruction}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(state.coverInstruction);
                        showToast('📋 Prompt copied!', 'success');
                      }}
                      className="w-full px-4 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all"
                    >
                      <i className="fas fa-copy"></i> Copy Prompt
                    </button>
                    <p className="text-xs text-slate-500 text-center">
                      Use this prompt with Midjourney, DALL-E 3, or Stable Diffusion
                    </p>
                  </div>
                ) : state.coverImage ? (
                  <div className="relative group">
                    <img
                      src={state.coverImage}
                      alt="Generated cover"
                      className="w-full rounded-3xl shadow-2xl border border-white/10"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl flex items-center justify-center gap-4">
                      <button
                        onClick={() => {
                          const a = document.createElement('a');
                          a.href = state.coverImage!;
                          a.download = `ugc-cover-${Date.now()}.png`;
                          a.click();
                          showToast('📥 Image downloaded!', 'success');
                        }}
                        className="px-6 py-3 bg-white text-slate-900 rounded-xl font-bold flex items-center gap-2 hover:scale-105 transition-transform"
                      >
                        <i className="fas fa-download"></i> Download
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="w-full aspect-[9/16] bg-slate-900 border-2 border-dashed border-white/10 rounded-3xl flex flex-col items-center justify-center text-slate-600">
                    <i className="fas fa-image text-6xl mb-4"></i>
                    <p className="text-sm">Generated image will appear here</p>
                  </div>
                )}

                {/* Info */}
                <div className="glass p-4 rounded-2xl space-y-2">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Tips</p>
                  <ul className="text-xs text-slate-400 space-y-1">
                    <li>• Upload reference images for better results</li>
                    <li>• Use 9:16 for TikTok/Reels</li>
                    <li>• Add specific prompts for style</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className={`px-6 py-4 rounded-2xl shadow-2xl backdrop-blur-xl border flex items-center gap-3 ${
            toast.type === 'success' ? 'bg-green-500/90 border-green-400/30 text-white' :
            toast.type === 'error' ? 'bg-red-500/90 border-red-400/30 text-white' :
            'bg-indigo-500/90 border-indigo-400/30 text-white'
          }`}>
            <i className={`fas ${
              toast.type === 'success' ? 'fa-circle-check' :
              toast.type === 'error' ? 'fa-circle-exclamation' :
              'fa-circle-info'
            } text-lg`}></i>
            <span className="font-bold text-sm">{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
