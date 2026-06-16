"use client";

import { useState, useCallback, useRef } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import {
  Brain,
  Sparkles,
  ChevronLeft,
  Info,
  ArrowRight,
  Zap,
  AlertCircle,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Eye,
  Lightbulb,
  RefreshCw,
  Copy,
  Check,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useRouter } from "next/navigation";

// ─── NEURAL NETWORK ENGINE ─────────────────────────────────────────────────────
function extractFeatures(prompt: string): number[] {
  const lower = prompt.toLowerCase();
  const words = prompt.split(/\s+/);
  return [
    Math.min(1, Math.max(0, 1 - Math.abs(words.length - 20) / 20)),
    ["8k","hd","highly detailed","sharp focus","photorealistic","masterpiece","ultra","professional"].some(k=>lower.includes(k))?1:0,
    ["minimalist","elegant","bold","modern","vintage","futuristic","luxury","artistic","cinematic","dramatic"].some(k=>lower.includes(k))?1:0,
    ["lighting","light","shadow","glow","bright","dark","neon","sunlight","studio","backlit"].some(k=>lower.includes(k))?1:0,
    ["photography","illustration","render","watercolor","painting","digital art","sketch","3d","vector"].some(k=>lower.includes(k))?1:0,
    ["color","white","black","blue","red","gold","silver","gradient","monochrome","vibrant","muted","pastel"].some(k=>lower.includes(k))?1:0,
    ["composition","centered","angle","view","perspective","close-up","wide","macro","portrait","landscape"].some(k=>lower.includes(k))?1:0,
    words.length >= 3 ? 1 : 0,
    ["mood","atmosphere","feel","vibe","aesthetic","dreamy","mysterious","serene","energetic","calm"].some(k=>lower.includes(k))?1:0,
    ["product","brand","commercial","marketing","advertisement","campaign","catalog","packaging","logo"].some(k=>lower.includes(k))?1:0,
  ];
}

function nnForwardPass(features: number[]): number {
  const w1 = [
    [0.45,0.38,0.52,0.41,0.35,0.48,0.42,0.28,0.39,0.44],
    [0.32,0.55,0.28,0.60,0.48,0.22,0.55,0.35,0.42,0.30],
    [0.58,0.30,0.45,0.38,0.52,0.40,0.35,0.55,0.28,0.50],
    [0.40,0.48,0.35,0.28,0.42,0.58,0.48,0.40,0.55,0.38],
    [0.35,0.42,0.58,0.52,0.30,0.45,0.40,0.48,0.35,0.42],
    [0.50,0.28,0.40,0.45,0.55,0.35,0.28,0.42,0.50,0.35],
  ];
  const b1=[0.1,0.05,0.08,0.06,0.09,0.07];
  const w2=[0.55,0.48,0.62,0.52,0.45,0.58];
  const b2=0.15;
  const relu=(x:number)=>Math.max(0,x);
  const sigmoid=(x:number)=>1/(1+Math.exp(-x));
  const hidden=w1.map((weights,j)=>relu(weights.reduce((s,w,i)=>s+w*features[i],0)+b1[j]));
  const z2=w2.reduce((s,w,j)=>s+w*hidden[j],0)+b2;
  return Math.round(sigmoid(z2)*100);
}

function getFeatureImportance(features:number[]):{name:string;score:number;active:boolean}[]{
  const names=["Prompt Length","Quality Keywords","Style Descriptor","Lighting Info","Medium/Material","Color Description","Composition Info","Subject Clarity","Mood/Atmosphere","Brand Context"];
  const weights=[0.12,0.18,0.14,0.12,0.10,0.08,0.10,0.06,0.06,0.04];
  return names.map((name,i)=>({name,score:Math.round(features[i]*weights[i]*100),active:features[i]>0}));
}

function generateSuggestions(features:number[],prompt:string):string[]{
  const suggestions:string[]=[];
  const words=prompt.split(/\s+/).length;
  if(features[0]<0.5){if(words<10)suggestions.push('Add more detail — prompt is too short (ideal: 15-25 words)');else suggestions.push('Shorten the prompt — too long may confuse the model');}
  if(!features[1])suggestions.push('Add quality keywords: "highly detailed", "8K", "sharp focus", "masterpiece"');
  if(!features[2])suggestions.push('Add a style descriptor: "minimalist", "cinematic", "elegant", "futuristic"');
  if(!features[3])suggestions.push('Specify lighting: "soft studio lighting", "golden hour", "neon glow"');
  if(!features[4])suggestions.push('Mention the medium: "photography", "3D render", "digital illustration"');
  if(!features[5])suggestions.push('Add color description: "gold and black", "pastel tones", "monochrome"');
  if(!features[6])suggestions.push('Specify composition: "centered", "rule of thirds", "close-up shot"');
  if(!features[8])suggestions.push('Add mood: "elegant", "mysterious", "vibrant", "serene atmosphere"');
  return suggestions.slice(0,5);
}

// ─── HELPER ───────────────────────────────────────────────────
function hexToRgb(hex:string){
  const r=/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return r?{r:parseInt(r[1],16),g:parseInt(r[2],16),b:parseInt(r[3],16)}:{r:59,g:130,b:246};
}

// ─── GLOW CARD ────────────────────────────────────────────────
function GlowCard({children,color,className=""}:{children:React.ReactNode;color:string;className?:string}){
  const ref=useRef<HTMLDivElement>(null);
  const [mouse,setMouse]=useState({x:0,y:0,op:0});
  const [hovered,setHovered]=useState(false);
  const {r,g,b}=hexToRgb(color);
  const rgba=(a:number)=>`rgba(${r},${g},${b},${a})`;
  const onMove=(e:ReactMouseEvent<HTMLDivElement>)=>{
    if(!ref.current)return;
    const rect=ref.current.getBoundingClientRect();
    setMouse({x:e.clientX-rect.left,y:e.clientY-rect.top,op:1});
  };
  return(
    <div ref={ref} onMouseMove={onMove}
      onMouseEnter={()=>setHovered(true)}
      onMouseLeave={()=>{setHovered(false);setMouse(p=>({...p,op:0}));}}
      className={`relative overflow-hidden rounded-2xl ${className}`}
      style={{
        background:hovered?`linear-gradient(145deg,${rgba(0.10)} 0%,var(--bg-card) 50%,${rgba(0.05)} 100%)`:"var(--bg-card)",
        border:hovered?`2px solid ${rgba(0.68)}`:"1.5px solid var(--border)",
        transform:hovered?"translateY(-5px) scale(1.015)":"translateY(0) scale(1)",
        transition:"all 0.35s cubic-bezier(0.16,1,0.3,1)",
        boxShadow:hovered?`0 0 0 1px ${rgba(0.25)},0 8px 24px rgba(0,0,0,0.35),0 20px 60px ${rgba(0.22)},0 0 80px ${rgba(0.10)}`:"0 1px 4px rgba(0,0,0,0.2)",
      }}>
      <div className="pointer-events-none absolute inset-0" style={{opacity:mouse.op,transition:"opacity 0.15s ease",background:`radial-gradient(300px circle at ${mouse.x}px ${mouse.y}px,${rgba(0.22)},${rgba(0.05)} 50%,transparent 70%)`}}/>
      <div className="pointer-events-none absolute top-0 left-0 right-0 transition-all duration-300" style={{height:hovered?"3px":"0px",opacity:hovered?1:0,background:`linear-gradient(90deg,transparent,${rgba(1)} 30%,${rgba(0.8)} 70%,transparent)`,boxShadow:hovered?`0 0 14px ${rgba(0.9)},0 0 28px ${rgba(0.5)}`:"none"}}/>
      <div className="pointer-events-none absolute top-0 left-0 bottom-0 transition-all duration-300" style={{width:hovered?"3px":"0px",opacity:hovered?0.9:0,background:`linear-gradient(180deg,${rgba(1)},${rgba(0.5)} 60%,transparent)`}}/>
      <div className="pointer-events-none absolute top-0 left-0 w-36 h-36 transition-opacity" style={{opacity:hovered?0.85:0,background:`radial-gradient(circle at 0% 0%,${rgba(0.38)},transparent 65%)`}}/>
      <div className="pointer-events-none absolute bottom-0 right-0 w-36 h-36 transition-opacity" style={{opacity:hovered?0.65:0,background:`radial-gradient(circle at 100% 100%,${rgba(0.28)},transparent 65%)`}}/>
      <div className="relative z-10">{children}</div>
    </div>
  );
}

// ─── SCORE GAUGE ──────────────────────────────────────────────
function ScoreGauge({score}:{score:number}){
  const getColor=(s:number)=>s>=80?"#10b981":s>=65?"#6366f1":s>=50?"#f59e0b":s>=35?"#f97316":"#ef4444";
  const getLabel=(s:number)=>s>=80?"Excellent":s>=65?"Good":s>=50?"Fair":s>=35?"Poor":"Very Poor";
  const color=getColor(score);
  const label=getLabel(score);
  const circumference=2*Math.PI*54;
  const offset=circumference-(score/100)*circumference;
  return(
    <div className="flex flex-col items-center">
      <div className="relative w-36 h-36">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="54" fill="none" stroke="var(--border)" strokeWidth="8"/>
          <circle cx="60" cy="60" r="54" fill="none" stroke={color} strokeWidth="8" strokeLinecap="round"
            strokeDasharray={circumference} strokeDashoffset={offset}
            style={{transition:"stroke-dashoffset 1s ease",filter:`drop-shadow(0 0 6px ${color}88)`}}/>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-extrabold" style={{color}}>{score}</span>
          <span className="text-xs text-[var(--text-dim)]">/ 100</span>
        </div>
      </div>
      <span className="mt-2 text-sm font-bold px-3 py-1 rounded-full"
        style={{color,background:`${color}15`,border:`1px solid ${color}30`}}>{label}</span>
    </div>
  );
}

// ─── EXAMPLE PROMPT CARD ──────────────────────────────────────
function ExampleCard({text,onClick}:{text:string;onClick:()=>void}){
  const ref=useRef<HTMLButtonElement>(null);
  const [mouse,setMouse]=useState({x:0,y:0,op:0});
  const [hovered,setHovered]=useState(false);
  const color="#3b82f6";
  const {r,g,b}=hexToRgb(color);
  const rgba=(a:number)=>`rgba(${r},${g},${b},${a})`;
  const onMove=(e:ReactMouseEvent<HTMLButtonElement>)=>{
    if(!ref.current)return;
    const rect=ref.current.getBoundingClientRect();
    setMouse({x:e.clientX-rect.left,y:e.clientY-rect.top,op:1});
  };
  return(
    <button ref={ref} onClick={onClick} onMouseMove={onMove}
      onMouseEnter={()=>setHovered(true)}
      onMouseLeave={()=>{setHovered(false);setMouse(p=>({...p,op:0}));}}
      className="relative overflow-hidden w-full text-left px-3 py-2.5 rounded-xl group"
      style={{
        background:hovered?`linear-gradient(135deg,${rgba(0.08)},var(--bg-card))`:"var(--bg-card)",
        border:hovered?`2px solid ${rgba(0.55)}`:"1.5px solid var(--border)",
        transform:hovered?"translateY(-2px)":"translateY(0)",
        transition:"all 0.25s cubic-bezier(0.16,1,0.3,1)",
        boxShadow:hovered?`0 4px 12px rgba(0,0,0,0.2),0 0 30px ${rgba(0.1)}`:"none",
      }}>
      <div className="pointer-events-none absolute inset-0" style={{opacity:mouse.op,transition:"opacity 0.15s ease",background:`radial-gradient(180px circle at ${mouse.x}px ${mouse.y}px,${rgba(0.15)},transparent 70%)`}}/>
      <div className="pointer-events-none absolute top-0 left-0 right-0 transition-all duration-200" style={{height:hovered?"2px":"0px",opacity:hovered?1:0,background:`linear-gradient(90deg,transparent,${rgba(0.9)} 40%,${rgba(0.7)} 60%,transparent)`}}/>
      <p className="relative z-10 text-xs text-[var(--text-muted)] leading-relaxed line-clamp-2 transition-colors duration-200"
        style={{color:hovered?"var(--text-primary)":"var(--text-muted)"}}>
        {text}
      </p>
    </button>
  );
}

// ─── MAIN PAGE ─────────────────────────────────────────────────────────────────
export default function RatingPredictorPage(){
  const router=useRouter();
  const [prompt,setPrompt]=useState("");
  const [result,setResult]=useState<{score:number;features:number[];importance:ReturnType<typeof getFeatureImportance>;suggestions:string[]}|null>(null);
  const [isAnalyzing,setIsAnalyzing]=useState(false);
  const [copied,setCopied]=useState(false);

  const analyze=useCallback(()=>{
    if(!prompt.trim())return;
    setIsAnalyzing(true);
    setResult(null);
    setTimeout(()=>{
      const features=extractFeatures(prompt);
      const score=nnForwardPass(features);
      const importance=getFeatureImportance(features);
      const suggestions=generateSuggestions(features,prompt);
      setResult({score,features,importance,suggestions});
      setIsAnalyzing(false);
    },900);
  },[prompt]);

  const applyOptimized=()=>{
    if(!result)return;
    const extras:string[]=[];
    if(!result.features[1])extras.push("highly detailed, sharp focus, 8K");
    if(!result.features[2])extras.push("cinematic style");
    if(!result.features[3])extras.push("soft studio lighting");
    if(!result.features[4])extras.push("professional photography");
    setPrompt([prompt.trim(),...extras].join(", "));
  };

  const copyEnhanced=()=>{
    if(!result)return;
    const extras:string[]=[];
    if(!result.features[1])extras.push("highly detailed, sharp focus, 8K");
    if(!result.features[2])extras.push("cinematic style");
    if(!result.features[3])extras.push("soft studio lighting");
    if(!result.features[4])extras.push("professional photography");
    navigator.clipboard.writeText([prompt.trim(),...extras].join(", "));
    setCopied(true);
    setTimeout(()=>setCopied(false),2000);
  };

  const useInGenerator=()=>router.push(`/generate?q=${encodeURIComponent(prompt.trim())}`);

  const EXAMPLE_PROMPTS=[
    "Minimalist coffee brand logo",
    "Luxury perfume bottle product photography, gold and black, soft studio lighting, 8K, highly detailed, sharp focus, cinematic style, professional quality",
    "Futuristic tech startup packaging, neon glow, dark background, 3D render, modern minimalist",
    "red shoe",
  ];

  return(
    <main className="min-h-screen bg-[var(--bg-primary)]">
      <Navbar hideCenterNav/>

      <div className="pt-24 pb-16 px-6 md:px-12 max-w-7xl mx-auto">
        <button onClick={()=>router.push("/smart-prompt")}
          className="flex items-center gap-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors mb-8 group">
          <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform"/>
          Smart Prompt Optimizer
        </button>

        <div className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-11 h-11 rounded-xl bg-blue-500/10 border border-blue-500/25 flex items-center justify-center">
              <Brain size={20} className="text-blue-400"/>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-blue-400">Neural Network</p>
              <h1 className="text-2xl md:text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">Rating Predictor</h1>
            </div>
          </div>
          <p className="text-[var(--text-muted)] text-sm md:text-base leading-relaxed max-w-2xl">
            Predict how good the generated design will be before generating it.
            A simple neural network analyzes 10 features from your prompt and gives
            a quality score along with specific improvement recommendations.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* ── LEFT: Input ── */}
          <div className="space-y-4">
            <GlowCard color="#3b82f6" className="p-5">
              <h2 className="text-sm font-bold text-[var(--text-primary)] mb-3">Enter Your Prompt</h2>
              <div className="prompt-input rounded-xl p-3 mb-3">
                <textarea value={prompt} onChange={e=>setPrompt(e.target.value)}
                  placeholder="Write your design prompt here..."
                  rows={5}
                  className="w-full bg-transparent outline-none border-none resize-none text-sm text-[var(--text-primary)] placeholder:text-[var(--text-dim)] leading-relaxed"
                  style={{caretColor:"var(--accent)"}}/>
              </div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] text-[var(--text-dim)]">{prompt.split(/\s+/).filter(Boolean).length} words</span>
                <button onClick={()=>{setPrompt("");setResult(null);}}
                  className="text-[10px] text-[var(--text-muted)] hover:text-red-400 transition-colors">Clear</button>
              </div>
              <button onClick={analyze} disabled={!prompt.trim()||isAnalyzing}
                className="btn-shimmer w-full flex items-center justify-center gap-3 py-4 rounded-xl text-sm font-bold text-white disabled:opacity-50 disabled:cursor-not-allowed mb-3">
                {isAnalyzing?(<><Brain size={16} className="animate-pulse"/> Analyzing with Neural Network...</>):(<><Brain size={16}/> Predict Rating</>)}
              </button>
              {result&&(
                <div className="flex gap-2">
                  <button onClick={applyOptimized}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold border border-blue-500/30 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-all">
                    <Zap size={12}/> Auto-Optimize
                  </button>
                  <button onClick={copyEnhanced}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-all">
                    {copied?<Check size={12} className="text-emerald-400"/>:<Copy size={12}/>}
                    {copied?"Copied!":"Copy Optimized"}
                  </button>
                  <button onClick={useInGenerator}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold btn-shimmer text-white">
                    <Sparkles size={12}/> Generate <ArrowRight size={11}/>
                  </button>
                </div>
              )}
            </GlowCard>

            {/* Example Prompts */}
            <GlowCard color="#3b82f6" className="p-5">
              <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--text-dim)] mb-3">Try Example Prompts</h3>
              <div className="space-y-2">
                {EXAMPLE_PROMPTS.map((ex,i)=>(
                  <ExampleCard key={i} text={ex} onClick={()=>{setPrompt(ex);setResult(null);}}/>
                ))}
              </div>
            </GlowCard>

            <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-blue-500/5 border border-blue-500/15">
              <Info size={14} className="text-blue-400 shrink-0 mt-0.5"/>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                This neural network analyzes 10 linguistic features from your prompt
                using a 10→6→1 architecture with ReLU and Sigmoid activation functions
                to predict the design output quality.
              </p>
            </div>
          </div>

          {/* ── RIGHT: Result ── */}
          <div className="space-y-4">
            <h2 className="text-base font-bold text-[var(--text-primary)] mb-2">Analysis Result</h2>

            <GlowCard color="#3b82f6" className="p-6">
              {isAnalyzing?(
                <div className="flex flex-col items-center gap-4 py-8">
                  <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                    <Brain size={28} className="text-blue-400 animate-pulse"/>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-[var(--text-primary)] mb-1">Neural network analyzing...</p>
                    <p className="text-xs text-[var(--text-muted)]">Forward pass through 3 layers</p>
                  </div>
                  <div className="w-48 space-y-2">
                    {["Feature extraction","Layer 1 (ReLU)","Layer 2 (Sigmoid)"].map((step,i)=>(
                      <div key={i} className="flex items-center gap-2">
                        <span className="text-[10px] text-[var(--text-dim)] w-28 shrink-0">{step}</span>
                        <div className="flex-1 h-1.5 rounded-full bg-[var(--border)] overflow-hidden">
                          <div className="h-full rounded-full" style={{animation:`shimmer 1.5s ease ${i*0.3}s infinite`,background:"linear-gradient(90deg,#3b82f6 0%,#60a5fa 50%,#3b82f6 100%)",backgroundSize:"200% auto"}}/>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ):result?(
                <div>
                  <div className="flex justify-center mb-6"><ScoreGauge score={result.score}/></div>
                  <div className="divider-glow mb-5"/>
                  <div className="mb-4">
                    <p className="text-xs font-bold uppercase tracking-widest text-[var(--text-dim)] mb-3">Neuron Activation (Feature Importance)</p>
                    <div className="space-y-2">
                      {result.importance.map((feat,i)=>(
                        <div key={i} className="flex items-center gap-2">
                          {feat.active?<CheckCircle2 size={12} className="text-emerald-400 shrink-0"/>:<XCircle size={12} className="text-red-400/60 shrink-0"/>}
                          <span className={`text-[11px] w-36 shrink-0 ${feat.active?"text-[var(--text-muted)]":"text-[var(--text-dim)]"}`}>{feat.name}</span>
                          <div className="flex-1 h-1.5 rounded-full bg-[var(--border)] overflow-hidden">
                            <div className="h-full rounded-full transition-all duration-700" style={{width:`${(feat.score/18)*100}%`,background:feat.active?"#3b82f6":"#374151"}}/>
                          </div>
                          <span className={`text-[10px] font-bold w-6 text-right ${feat.active?"text-blue-400":"text-[var(--text-dim)]"}`}>{feat.active?"✓":"✗"}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ):(
                <div className="flex flex-col items-center gap-4 py-12 text-center">
                  <div className="w-20 h-20 rounded-3xl bg-blue-500/8 border border-blue-500/15 flex items-center justify-center">
                    <Eye size={36} className="text-blue-400 opacity-50"/>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[var(--text-muted)] mb-1">Prediction will appear here</p>
                    <p className="text-xs text-[var(--text-dim)]">Enter a prompt and click "Predict Rating"</p>
                  </div>
                </div>
              )}
            </GlowCard>

            {result&&result.suggestions.length>0&&(
              <GlowCard color="#f59e0b" className="p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Lightbulb size={14} className="text-amber-400"/>
                  <h3 className="text-sm font-bold text-[var(--text-primary)]">Improvement Recommendations</h3>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold">{result.suggestions.length} tips</span>
                </div>
                <div className="space-y-3">
                  {result.suggestions.map((sug,i)=>(
                    <div key={i} className="flex items-start gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-[9px] font-extrabold text-amber-400">{i+1}</span>
                      </div>
                      <p className="text-xs text-[var(--text-muted)] leading-relaxed">{sug}</p>
                    </div>
                  ))}
                </div>
              </GlowCard>
            )}

            {result&&result.score>=80&&(
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-500/8 border border-emerald-500/20">
                <CheckCircle2 size={16} className="text-emerald-400 shrink-0"/>
                <p className="text-xs text-emerald-400 font-semibold">Your prompt is excellent! The neural network predicts a high-quality output.</p>
              </div>
            )}
          </div>
        </div>

        {/* ─── EXPLANATION SECTION ── */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-5">
          <GlowCard color="#3b82f6" className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{background:"#3b82f615",border:"2px solid #3b82f640"}}>
                <AlertCircle size={16} className="text-blue-400"/>
              </div>
              <h3 className="text-sm font-bold text-[var(--text-primary)]">Neural Network Architecture</h3>
            </div>
            <div className="space-y-4">
              {[
                {layer:"Input Layer",nodes:"10 neurons",desc:"Receives 10 features extracted from the prompt: length, quality keywords, style, lighting, medium, color, composition, clarity, mood, and brand context.",color:"#3b82f6"},
                {layer:"Hidden Layer",nodes:"6 neurons (ReLU)",desc:"Six hidden neurons with ReLU activation to capture non-linear interactions between prompt features.",color:"#8b5cf6"},
                {layer:"Output Layer",nodes:"1 neuron (Sigmoid)",desc:"One output neuron with Sigmoid produces a 0-1 value scaled to 0-100 as the quality prediction score.",color:"#10b981"},
              ].map((layer,i)=>(
                <div key={i} className="flex items-start gap-3 px-3 py-2.5 rounded-xl" style={{background:`${layer.color}08`,border:`1px solid ${layer.color}20`}}>
                  <div className="w-2 h-2 rounded-full shrink-0 mt-1.5" style={{background:layer.color,boxShadow:`0 0 6px ${layer.color}80`}}/>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-[var(--text-primary)]">{layer.layer}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold" style={{background:`${layer.color}15`,color:layer.color}}>{layer.nodes}</span>
                    </div>
                    <p className="text-xs text-[var(--text-muted)] leading-relaxed">{layer.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </GlowCard>

          <GlowCard color="#6366f1" className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{background:"#6366f115",border:"2px solid #6366f140"}}>
                <TrendingUp size={16} className="text-blue-400"/>
              </div>
              <h3 className="text-sm font-bold text-[var(--text-primary)]">Score Interpretation</h3>
            </div>
            <div className="space-y-2.5">
              {[
                {range:"80-100",label:"Excellent",color:"#10b981",desc:"Prompt is very detailed & comprehensive. Output will be high quality."},
                {range:"65-79",label:"Good",color:"#6366f1",desc:"Prompt is solid with some strong features. Results will be satisfying."},
                {range:"50-64",label:"Fair",color:"#f59e0b",desc:"Basic prompt. Add more detail for better results."},
                {range:"35-49",label:"Poor",color:"#f97316",desc:"Prompt lacks detail. Significant improvements needed."},
                {range:"0-34",label:"Very Poor",color:"#ef4444",desc:"Prompt is too short or vague. Add much more detail."},
              ].map((item,i)=>(
                <div key={i} className="flex items-start gap-3 px-3 py-2 rounded-xl" style={{background:`${item.color}08`,border:`1px solid ${item.color}20`}}>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-lg shrink-0" style={{background:`${item.color}15`,color:item.color,border:`1px solid ${item.color}30`}}>{item.range}</span>
                  <div>
                    <span className="text-xs font-bold text-[var(--text-primary)]">{item.label}: </span>
                    <span className="text-xs text-[var(--text-muted)]">{item.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </GlowCard>
        </div>

        <GlowCard color="#3b82f6" className="p-6 mt-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{background:"#3b82f615",border:"2px solid #3b82f640"}}>
              <RefreshCw size={16} className="text-blue-400"/>
            </div>
            <h3 className="text-sm font-bold text-[var(--text-primary)]">Recommended Workflow</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              {step:"1",title:"Input Prompt",desc:"Write your initial design idea",color:"#3b82f6"},
              {step:"2",title:"Predict Rating",desc:"Analyze with Neural Network",color:"#8b5cf6"},
              {step:"3",title:"Apply Suggestions",desc:"Follow the improvement tips",color:"#f59e0b"},
              {step:"4",title:"Generate!",desc:"Send to AI Image Generator",color:"#10b981"},
            ].map((item,i)=>(
              <div key={i} className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0" style={{background:`${item.color}15`,border:`2px solid ${item.color}35`,boxShadow:`0 0 8px ${item.color}30`}}>
                  <span className="text-xs font-extrabold" style={{color:item.color}}>{item.step}</span>
                </div>
                <div>
                  <p className="text-xs font-bold text-[var(--text-primary)] mb-0.5">{item.title}</p>
                  <p className="text-[10px] text-[var(--text-muted)]">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </GlowCard>
      </div>
      <Footer />
    </main>
  );
}
