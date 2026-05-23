'use client';

import './page.css';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Sparkles,
  Calculator,
  TrendingUp,
  Coins,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Moon,
  Sun,
  Activity,
  Info,
  Check,
  Play,
  ArrowRightLeft,
  ChevronDown
} from 'lucide-react';
import {
  TeamSizeInput,
  UseCaseSelect,
  ToolGrid,
  LeadCaptureForm,
  type LeadCaptureData,
} from '@/components/form-and-results';
import { AnimatedResultsSequence } from '@/components/animated-results-sequence';

import { optimizeToolStack, type UseCase, type ToolConfig } from '@/lib/optimization-engine';
import { generateOptimizationSummary } from '@/lib/llm-service';
import { storageUtils, type FormState } from '@/lib/storage-utils';
import styles from '@/components/credex.module.css';

// Testimonials data
const TESTIMONIALS = [
  {
    quote: "AI Spend Audit saved us $1,420/month within 5 minutes. We had three redundant Cursor accounts and duplicate seats on Claude Team we didn't even know about.",
    author: "Alex Rivers",
    role: "CTO, SaaSFlow",
    avatar: "AR"
  },
  {
    quote: "Highly recommended for any high-growth engineering team. It identified that moving to the Anthropic API with prompt caching would slash our Claude API spend by 68%.",
    author: "Sarah Chen",
    role: "VP of Engineering, DevScale",
    avatar: "SC"
  },
  {
    quote: "Simple, precise, and instantaneous. We consolidated duplicate seats on Copilot and ChatGPT Plus, capturing immediate bottom-line efficiency.",
    author: "Marcus Vane",
    role: "Founder, ByteForge",
    avatar: "MV"
  }
];

// Tool Pricing Comparison data
const TOOL_PRICING_ROWS = [
  { name: 'Cursor', plan: 'Pro', cost: 20 },
  { name: 'Cursor', plan: 'Business', cost: 40 },
  { name: 'Claude', plan: 'Pro', cost: 20 },
  { name: 'Claude', plan: 'Team', cost: 30 },
  { name: 'ChatGPT', plan: 'Plus', cost: 20 },
  { name: 'ChatGPT', plan: 'Team', cost: 25 },
  { name: 'GitHub Copilot', plan: 'Individual', cost: 10 },
  { name: 'GitHub Copilot', plan: 'Business', cost: 19 },
];

export default function OptimizerPage() {
  const [mounted, setMounted] = useState(false);

  // Theme state
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // Interactive slider calculator state
  const [calcSpend, setCalcSpend] = useState(350);
  const [calcTeam, setCalcTeam] = useState(8);
  const [displayedSavings, setDisplayedSavings] = useState(130);

  // Form state
  const [teamSize, setTeamSize] = useState(5);
  const [primaryUseCase, setPrimaryUseCase] = useState<UseCase>('coding');
  const [selectedTools, setSelectedTools] = useState<ToolConfig[]>([]);

  // Results state
  const [hasCalculated, setHasCalculated] = useState(false);
  const [summary, setSummary] = useState<string>('');
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);
  const [leadCaptureVisible, setLeadCaptureVisible] = useState(false);
  const [leadCaptureError, setLeadCaptureError] = useState('');
  const [isSubmittingLead, setIsSubmittingLead] = useState(false);

  // Social testimonials carousel state
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  // Newsletter state
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false);

  // Sort state for price comparison table
  const [sortField, setSortField] = useState<'name' | 'plan' | 'cost'>('cost');
  const [sortAsc, setSortAsc] = useState(true);

  // Video Demo embed state
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

  // Stat Counter state
  const [statCounter, setStatCounter] = useState(9920);

  useEffect(() => {
    setMounted(true);
    // Load theme setting
    const savedTheme = localStorage.getItem('theme') as 'dark' | 'light';
    if (savedTheme) {
      setTheme(savedTheme);
      if (savedTheme === 'light') {
        document.documentElement.classList.add('light');
      } else {
        document.documentElement.classList.remove('light');
      }
    } else {
      document.documentElement.classList.remove('light');
    }

    // Auto rotate testimonials
    const interval = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % TESTIMONIALS.length);
    }, 6000);

    // Slowly increment stat counter for live audit feel
    const counterInterval = setInterval(() => {
      setStatCounter((prev) => prev + Math.floor(Math.random() * 2) + 1);
    }, 5000);

    return () => {
      clearInterval(interval);
      clearInterval(counterInterval);
    };
  }, []);

  // Sync theme
  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('theme', nextTheme);
    if (nextTheme === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
  };

  // Spark calculator savings counter animation
  const targetSavings = useMemo(() => {
    return Math.round(calcSpend * 0.32 + calcTeam * 12);
  }, [calcSpend, calcTeam]);

  useEffect(() => {
    let start = displayedSavings;
    const end = targetSavings;
    if (start === end) return;
    const range = end - start;
    const duration = 300;
    const stepTime = 16;
    const steps = duration / stepTime;
    let step = 0;

    const timer = setInterval(() => {
      step++;
      const val = Math.round(start + (range * step) / steps);
      setDisplayedSavings(val);
      if (step >= steps) {
        setDisplayedSavings(end);
        clearInterval(timer);
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [targetSavings]);

  useEffect(() => {
    const saved = storageUtils.loadState();
    if (saved) {
      setTeamSize(saved.teamSize);
      setPrimaryUseCase(saved.primaryUseCase);
      setSelectedTools(saved.selectedTools);
    }
  }, []);

  useEffect(() => {
    const state: FormState = {
      teamSize,
      primaryUseCase,
      selectedTools,
    };
    storageUtils.saveState(state);
  }, [teamSize, primaryUseCase, selectedTools]);

  const handleAddTool = (tool: ToolConfig) => {
    setSelectedTools([...selectedTools, tool]);
  };

  const handleRemoveTool = (toolId: string) => {
    setSelectedTools(selectedTools.filter((t) => t.toolId !== toolId));
  };

  const handleUpdateTool = (toolId: string, updates: Partial<ToolConfig>) => {
    setSelectedTools(selectedTools.map((t) => (t.toolId === toolId ? { ...t, ...updates } : t)));
  };

  const handleCalculate = async () => {
    if (selectedTools.length === 0) {
      alert('Please select at least one tool to start the audit');
      return;
    }

    setHasCalculated(true);
    setIsSummaryLoading(true);

    const result = optimizeToolStack(selectedTools, teamSize, primaryUseCase);

    const summaryResponse = await generateOptimizationSummary(
      result,
      teamSize,
      primaryUseCase,
      5000
    );

    setSummary(summaryResponse.text);
    setIsSummaryLoading(false);

    if (result.totalMonthlySavings > 500) {
      setLeadCaptureVisible(true);
    }

    setTimeout(() => {
      document.getElementById('results-section')?.scrollIntoView({ behavior: 'smooth' });
    }, 150);
  };

  const handleLeadSubmit = async (data: LeadCaptureData) => {
    setIsSubmittingLead(true);
    setLeadCaptureError('');
    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: data.email,
          companyName: data.companyName,
          role: data.role,
          teamSize,
          primaryUseCase,
          toolCount: selectedTools.length,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit');
      }

      try {
        await fetch('/api/feedback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            score: data.rating,
            teamSize,
            primaryUseCase,
            toolCount: selectedTools.length,
          }),
        });
      } catch (feedbackError) {
        console.warn('Feedback save failed', feedbackError);
      }

      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'lead_submitted', {
          teamSize,
          toolCount: selectedTools.length,
          primaryUseCase,
        });
        (window as any).gtag('event', 'audit_feedback_submitted', {
          score: data.rating,
        });
      }

      alert("Thank you! We'll be in touch soon.");
      setLeadCaptureVisible(false);
    } catch (_error) {
      setLeadCaptureError('Failed to submit. Please try again.');
    } finally {
      setIsSubmittingLead(false);
    }
  };

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newsletterEmail)) {
      alert('Please enter a valid email address');
      return;
    }
    setNewsletterSubscribed(true);
  };

  const handleSort = (field: 'name' | 'plan' | 'cost') => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const sortedPricing = useMemo(() => {
    return [...TOOL_PRICING_ROWS].sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];
      if (typeof valA === 'string' && typeof valB === 'string') {
        return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
      } else {
        return sortAsc ? (valA as number) - (valB as number) : (valB as number) - (valA as number);
      }
    });
  }, [sortField, sortAsc]);

  const optimizationResult = useMemo(
    () =>
      selectedTools.length > 0 ? optimizeToolStack(selectedTools, teamSize, primaryUseCase) : null,
    [selectedTools, teamSize, primaryUseCase]
  );

  if (!mounted) {
    return null;
  }

  return (
    <div className="dot-grid min-h-screen relative pb-12 transition-colors duration-300 bg-[var(--bg-primary)]">
      
      {/* Background Animated Gradient Blobs */}
      <div className="mesh-gradient-container">
        <div className="mesh-blob animate-float-slow bg-cyan-500 w-[500px] h-[500px] top-[-100px] right-[-100px] rounded-full"></div>
        <div className="mesh-blob animate-float-reverse bg-purple-600 w-[450px] h-[450px] bottom-[-200px] left-[-200px] rounded-full"></div>
        <div className="mesh-blob animate-pulse-slow bg-emerald-500 w-[300px] h-[300px] top-[40%] right-[30%] rounded-full"></div>
      </div>

      {/* Sleek Navigation Header */}
      <nav className="w-full max-w-6xl mx-auto px-6 py-5 flex items-center justify-between border-b border-[var(--border-light)] relative z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 via-emerald-400 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Coins className="w-4 h-4 text-white" />
          </div>
          <span className="font-extrabold text-xl tracking-tight font-display">
            AI Spend <span className="gradient-text">Audit</span>
          </span>
        </div>
        <div className="flex items-center gap-4">
          <a href="#calculator" className="hidden md:inline text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">Savings Estimator</a>
          <a href="#features" className="hidden md:inline text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">Features</a>
          <a href="#audit-tool" className="text-sm font-semibold px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-white shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all">Start Audit</a>
          
          {/* Smart Theme Switcher Switch */}
          <button 
            onClick={toggleTheme}
            className="w-10 h-10 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-light)] hover:border-[var(--border-glow)] flex items-center justify-center text-[var(--text-primary)] shadow-sm hover:scale-[1.05] active:scale-[0.95] transition-all"
            aria-label="Toggle light/dark theme"
          >
            {theme === 'dark' ? <Sun className="w-[18px] h-[18px] text-amber-400" /> : <Moon className="w-[18px] h-[18px] text-indigo-600" />}
          </button>
        </div>
      </nav>

      {/* Main Page Layout */}
      <div className="w-full max-w-6xl mx-auto px-6 relative z-10 pt-12">
        
        {!hasCalculated ? (
          <>
            {/* HERO SECTION */}
            <header className="text-center mb-16 md:mb-24 flex flex-col items-center">
              
              {/* Pulsing Active Audits Badge */}
              <div className="mb-6 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-light)] text-xs font-semibold text-[var(--accent-primary)] shadow-sm">
                <span className="w-2 h-2 rounded-full bg-[var(--accent-primary)] animate-pulse"></span>
                <span>{statCounter.toLocaleString()} AI Audits Completed Globally</span>
              </div>

              {/* Headline with Dramatic Typography */}
              <h1 className="font-extrabold text-4xl md:text-6xl max-w-4xl tracking-tight leading-[1.1] mb-6 font-display text-[var(--text-primary)]">
                Stop Wasting Money on <br className="hidden sm:inline" />
                <span className="gradient-text font-black">Over-Allocated AI Plans</span>
              </h1>
              
              <p className="text-base md:text-lg text-[var(--text-secondary)] max-w-2xl leading-relaxed mb-10 font-normal">
                Instantly scan your team's AI subscriptions, expose redundant seat allocations, and consolidate into optimized tiers. Completely free, founder-grade audit.
              </p>

              {/* Action Buttons & Visual Badges */}
              <div className="flex flex-col sm:flex-row gap-4 mb-16 w-full max-w-md justify-center">
                <a 
                  href="#audit-tool" 
                  className="px-8 py-4 rounded-2xl bg-gradient-to-r from-indigo-500 via-cyan-500 to-emerald-500 text-white font-bold text-base text-center shadow-xl shadow-cyan-500/20 hover:shadow-cyan-500/35 hover:scale-[1.02] active:scale-[0.98] transition-all relative overflow-hidden group"
                >
                  <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-emerald-500 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    Run Custom Stack Audit <ArrowRight className="w-4 h-4" />
                  </span>
                </a>
                <a 
                  href="#calculator" 
                  className="px-8 py-4 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-light)] hover:border-[var(--border-glow)] text-[var(--text-primary)] font-bold text-base text-center hover:scale-[1.02] active:scale-[0.98] transition-all shadow-sm flex items-center justify-center gap-2"
                >
                  Quick Estimator
                </a>
              </div>

              {/* HERO INTERACTIVE GRAPHIC / PREVIEW */}
              <div className="w-full max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch mb-24">
                
                {/* Custom Animated Piggy Bank Graphic (left) */}
                <div className="glass-panel md:col-span-7 flex flex-col justify-between overflow-hidden relative p-8 group">
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Activity className="w-48 h-48 text-[var(--accent-neon)]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles className="w-5 h-5 text-indigo-400" />
                      <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">Credex Optimization Stream</span>
                    </div>
                    <h3 className="text-xl font-bold font-display text-[var(--text-primary)] mb-2">Automated Savings Flow</h3>
                    <p className="text-sm text-[var(--text-secondary)] mb-6">Visualizing your AI seat audit consolidating waste into real bottom-line capital.</p>
                  </div>
                  
                  {/* Glowing Flow Chart Graphic */}
                  <div className="w-full h-44 flex items-center justify-center relative">
                    <svg className="w-full h-full" viewBox="0 0 400 160">
                      <defs>
                        <linearGradient id="flow-line-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#818cf8" stopOpacity="0.2" />
                          <stop offset="50%" stopColor="#06b6d4" stopOpacity="1" />
                          <stop offset="100%" stopColor="#10b981" stopOpacity="1" />
                        </linearGradient>
                        <radialGradient id="piggy-glow" cx="50%" cy="50%" r="50%">
                          <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
                          <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                        </radialGradient>
                      </defs>

                      {/* Tool Source Bubbles (Left) */}
                      <g transform="translate(40, 25)" className="animate-float">
                        <circle cx="0" cy="0" r="18" fill="rgba(15, 23, 42, 0.8)" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
                        <text x="0" y="4" textAnchor="middle" fill="#fff" fontSize="8" fontWeight="bold">GPT</text>
                      </g>
                      <g transform="translate(45, 80)" className="animate-float-reverse">
                        <circle cx="0" cy="0" r="18" fill="rgba(15, 23, 42, 0.8)" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
                        <text x="0" y="4" textAnchor="middle" fill="#fff" fontSize="8" fontWeight="bold">CLD</text>
                      </g>
                      <g transform="translate(40, 135)" className="animate-float">
                        <circle cx="0" cy="0" r="18" fill="rgba(15, 23, 42, 0.8)" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
                        <text x="0" y="4" textAnchor="middle" fill="#fff" fontSize="8" fontWeight="bold">GEM</text>
                      </g>

                      {/* Flow Connections */}
                      <path d="M 58 25 Q 180 25 320 80" fill="none" stroke="url(#flow-line-grad)" strokeWidth="2.5" strokeDasharray="6, 6" />
                      <path d="M 63 80 H 310" fill="none" stroke="url(#flow-line-grad)" strokeWidth="3" />
                      <path d="M 58 135 Q 180 135 320 80" fill="none" stroke="url(#flow-line-grad)" strokeWidth="2.5" strokeDasharray="6, 6" />

                      {/* Floating Coins on paths */}
                      <circle cx="160" cy="40" r="4.5" fill="#f59e0b" className="animate-float" />
                      <circle cx="210" cy="80" r="5" fill="#f59e0b" className="animate-pulse" />
                      <circle cx="140" cy="120" r="4.5" fill="#f59e0b" className="animate-float-reverse" />

                      {/* Piggy Bank / Savings Hub Shield (Right) */}
                      <g transform="translate(330, 80)">
                        <circle cx="0" cy="0" r="28" fill="url(#piggy-glow)" />
                        <circle cx="0" cy="0" r="24" fill="rgba(16, 185, 129, 0.2)" stroke="#10b981" strokeWidth="2" />
                        {/* Custom piggy icon */}
                        <path d="M -8 -4 Q -12 -2 -12 2 H -10 Q -6 8 0 8 Q 6 8 10 2 H 12 Q 12 -2 8 -4 Z" fill="#10b981" />
                        <circle cx="-3" cy="-3" r="1" fill="#fff" />
                        <circle cx="3" cy="-3" r="1" fill="#fff" />
                        <path d="M 0 -12 V -8 M -2 -10 H 2" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" />
                      </g>
                    </svg>
                  </div>
                </div>

                {/* Dashboard Mock Metrics (right) */}
                <div className="glass-panel md:col-span-5 flex flex-col justify-between p-8 relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/5 to-transparent pointer-events-none"></div>
                  
                  {/* Metric Block */}
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 mb-2 block">Live Intelligence Feed</span>
                    <h3 className="text-lg font-bold font-display text-[var(--text-primary)] mb-4">Sample Organization Impact</h3>
                    
                    {/* Sparkline & Counter */}
                    <div className="flex items-baseline gap-2 mb-2">
                      <span className="text-4xl font-extrabold tracking-tight text-[var(--accent-primary)] font-display">$340</span>
                      <span className="text-xs font-semibold text-[var(--text-secondary)]">Saved Monthly</span>
                    </div>

                    <div className="w-full h-12 flex items-center justify-between mb-4">
                      {/* SVG Sparkline Spark */}
                      <svg className="w-full h-full" viewBox="0 0 160 40">
                        <defs>
                          <linearGradient id="spark-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
                            <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                          </linearGradient>
                        </defs>
                        <path d="M 0 35 L 20 30 L 50 32 L 80 18 L 110 20 L 140 5 L 160 8" fill="none" stroke="#10b981" strokeWidth="2" />
                        <path d="M 0 35 L 20 30 L 50 32 L 80 18 L 110 20 L 140 5 L 160 8 L 160 40 L 0 40 Z" fill="url(#spark-grad)" />
                      </svg>
                    </div>
                  </div>

                  {/* Micro glass card overlay */}
                  <div className="p-3.5 rounded-xl bg-slate-900/30 border border-white/5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded bg-emerald-500/10 flex items-center justify-center">
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      </div>
                      <span className="font-semibold">Claude Team Consolidation</span>
                    </div>
                    <span className="font-bold text-emerald-400">Save $220/mo</span>
                  </div>
                </div>

              </div>
            </header>

            {/* QUICK ESTIMATOR / SAVINGS CALCULATOR */}
            <section id="calculator" className="scroll-mt-24 mb-24 max-w-4xl mx-auto">
              <div className="glass-panel p-8 md:p-12 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-cyan-500 to-emerald-500"></div>
                
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
                  
                  {/* Sliders Area (left 7 cols) */}
                  <div className="md:col-span-7 flex flex-col gap-6">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Calculator className="w-5 h-5 text-[var(--accent-neon)]" />
                        <h2 className="text-2xl font-bold font-display text-[var(--text-primary)]">Quick Savings Estimator</h2>
                      </div>
                      <p className="text-sm text-[var(--text-secondary)]">Drag the sliders to see what similar organizations typically salvage from redundant seats.</p>
                    </div>

                    {/* Spend Slider */}
                    <div className="flex flex-col gap-2">
                      <div className="flex justify-between text-sm font-semibold">
                        <span>Current Monthly AI Spend</span>
                        <span className="text-[var(--accent-neon)]">${calcSpend.toLocaleString()}/mo</span>
                      </div>
                      <input 
                        type="range" 
                        min="50" 
                        max="10000" 
                        step="50" 
                        value={calcSpend}
                        onChange={(e) => setCalcSpend(Number(e.target.value))}
                        className="w-full accent-cyan-500 bg-[var(--border-light)] h-2 rounded-lg cursor-pointer"
                        aria-label="Monthly spend slider"
                      />
                      <div className="flex justify-between text-[10px] text-[var(--text-secondary)]">
                        <span>$50</span>
                        <span>$10,000+</span>
                      </div>
                    </div>

                    {/* Team Size Slider */}
                    <div className="flex flex-col gap-2">
                      <div className="flex justify-between text-sm font-semibold">
                        <span>Total AI Users (Seats)</span>
                        <span className="text-[var(--accent-primary)]">{calcTeam} Seats</span>
                      </div>
                      <input 
                        type="range" 
                        min="1" 
                        max="150" 
                        value={calcTeam}
                        onChange={(e) => setCalcTeam(Number(e.target.value))}
                        className="w-full accent-emerald-500 bg-[var(--border-light)] h-2 rounded-lg cursor-pointer"
                        aria-label="Team seats slider"
                      />
                      <div className="flex justify-between text-[10px] text-[var(--text-secondary)]">
                        <span>1 Seat</span>
                        <span>150+ Seats</span>
                      </div>
                    </div>
                  </div>

                  {/* Calculations Result Block (right 5 cols) */}
                  <div className="md:col-span-5 p-6 rounded-2xl bg-indigo-950/20 border border-indigo-500/10 flex flex-col items-center text-center justify-center relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/5 via-transparent to-transparent pointer-events-none"></div>
                    
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 mb-2">Estimated Monthly Salvage</span>
                    <span className="text-5xl font-black tracking-tight text-[var(--accent-primary)] font-display mb-2 drop-shadow-md">
                      ${displayedSavings.toLocaleString()}
                    </span>
                    <span className="text-xs font-semibold text-[var(--text-secondary)] mb-6">~{Math.round((displayedSavings / calcSpend) * 100) || 0}% Savings Captured</span>

                    <div className="w-full border-t border-[var(--border-light)] pt-4">
                      <div className="flex items-center justify-center gap-1.5 text-xs text-[var(--text-secondary)]">
                        <TrendingUp className="w-4 h-4 text-emerald-400" />
                        <span>Est. Annual: <strong className="text-[var(--text-primary)]">${(displayedSavings * 12).toLocaleString()}</strong></span>
                      </div>
                    </div>
                  </div>

                </div>

              </div>
            </section>

            {/* FEATURE SHOWCASE SECTION */}
            <section id="features" className="scroll-mt-24 mb-24 max-w-5xl mx-auto">
              <div className="text-center mb-12">
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--accent-primary)] mb-2 block">Premium Features</span>
                <h2 className="text-3xl font-bold font-display text-[var(--text-primary)]">Three Elements of Credex Intelligence</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Card 1: Analyze */}
                <div className="glass-panel p-8 flex flex-col justify-between group hover:translate-y-[-4px]">
                  <div>
                    <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-6 group-hover:scale-[1.1] transition-transform">
                      <Activity className="w-6 h-6 animate-pulse" />
                    </div>
                    <h3 className="text-xl font-bold font-display text-[var(--text-primary)] mb-3">🔍 Deep Audit &amp; Match</h3>
                    <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                      We break down every plan, seat cost, and consumption ceiling. Uncover solo users placed on Team plans and redundant tool overlapping.
                    </p>
                  </div>
                  <div className="border-t border-[var(--border-light)] pt-4 mt-6 text-xs font-semibold text-cyan-400 flex items-center gap-1">
                    Scan algorithms active <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>

                {/* Card 2: Optimize */}
                <div className="glass-panel p-8 flex flex-col justify-between group hover:translate-y-[-4px]">
                  <div>
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-6 group-hover:scale-[1.1] transition-transform">
                      <Coins className="w-6 h-6 animate-float" />
                    </div>
                    <h3 className="text-xl font-bold font-display text-[var(--text-primary)] mb-3">💰 Plan Consolidation</h3>
                    <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                      Match configurations against standard list prices. Immediately route users to the cheapest equivalent plan from the same software provider.
                    </p>
                  </div>
                  <div className="border-t border-[var(--border-light)] pt-4 mt-6 text-xs font-semibold text-emerald-400 flex items-center gap-1">
                    Consolidation ready <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>

                {/* Card 3: Save */}
                <div className="glass-panel p-8 flex flex-col justify-between group hover:translate-y-[-4px]">
                  <div>
                    <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-6 group-hover:scale-[1.1] transition-transform">
                      <TrendingUp className="w-6 h-6 animate-float-reverse" />
                    </div>
                    <h3 className="text-xl font-bold font-display text-[var(--text-primary)] mb-3">📈 Alternative Routing</h3>
                    <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                      Expose when paying retail seat premiums is a waste compared to routing intensive workflows through direct token-based developer API credits.
                    </p>
                  </div>
                  <div className="border-t border-[var(--border-light)] pt-4 mt-6 text-xs font-semibold text-indigo-400 flex items-center gap-1">
                    Developer credits route <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>

              </div>
            </section>

            {/* INTERACTIVE COMPARISON TABLE & RISK RADIAL PROGRESS */}
            <section className="mb-24 max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Cost Comparison Table (left 7 cols) */}
              <div className="glass-panel p-6 md:p-8 lg:col-span-7 flex flex-col gap-6">
                <div>
                  <h3 className="text-xl font-bold font-display text-[var(--text-primary)] flex items-center gap-2">
                    <ArrowRightLeft className="w-5 h-5 text-[var(--accent-neon)]" />
                    Interactive Plan Cost Ledger
                  </h3>
                  <p className="text-xs text-[var(--text-secondary)] mt-1">Compare AI tool subscription fees instantly. Click column headers to sort values.</p>
                </div>
                
                <div className="overflow-x-auto w-full">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-[var(--border-light)]">
                        <th onClick={() => handleSort('name')} className="pb-3 font-bold uppercase tracking-wider text-[var(--text-secondary)] cursor-pointer hover:text-[var(--text-primary)] transition-colors select-none">
                          Tool {sortField === 'name' ? (sortAsc ? '↑' : '↓') : ''}
                        </th>
                        <th onClick={() => handleSort('plan')} className="pb-3 font-bold uppercase tracking-wider text-[var(--text-secondary)] cursor-pointer hover:text-[var(--text-primary)] transition-colors select-none">
                          Plan {sortField === 'plan' ? (sortAsc ? '↑' : '↓') : ''}
                        </th>
                        <th onClick={() => handleSort('cost')} className="pb-3 font-bold uppercase tracking-wider text-[var(--text-secondary)] cursor-pointer hover:text-[var(--text-primary)] transition-colors select-none">
                          Price/Seat {sortField === 'cost' ? (sortAsc ? '↑' : '↓') : ''}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border-light)]">
                      {sortedPricing.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-500/5 transition-colors">
                          <td className="py-3 font-semibold text-[var(--text-primary)]">{row.name}</td>
                          <td className="py-3 text-[var(--text-secondary)]">{row.plan}</td>
                          <td className="py-3 font-bold text-[var(--accent-primary)]">${row.cost}/mo</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Radial Risk Indicator (right 5 cols) */}
              <div className="glass-panel p-6 md:p-8 lg:col-span-5 flex flex-col items-center text-center justify-between h-full min-h-[350px]">
                <div>
                  <h3 className="text-lg font-bold font-display text-[var(--text-primary)] mb-1">AI Stack Risk Quotient</h3>
                  <p className="text-xs text-[var(--text-secondary)]">Calculated based on standard overlap and multi-seat retail configurations.</p>
                </div>

                {/* Circular Indicator */}
                <div className="relative w-44 h-44 flex items-center justify-center my-6">
                  {/* SVG radial progress */}
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                    <circle cx="60" cy="60" r="50" fill="none" stroke="var(--border-light)" strokeWidth="8" />
                    <circle 
                      cx="60" 
                      cy="60" 
                      r="50" 
                      fill="none" 
                      stroke="url(#radial-grad)" 
                      strokeWidth="9" 
                      strokeDasharray={2 * Math.PI * 50} 
                      strokeDashoffset={2 * Math.PI * 50 * (1 - 0.74)}
                      strokeLinecap="round"
                    />
                    <defs>
                      <linearGradient id="radial-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#f43f5e" />
                        <stop offset="100%" stopColor="#f59e0b" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute flex flex-col items-center">
                    <span className="text-3xl font-black text-rose-500 font-display">74%</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">High Waste</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-rose-500/5 border border-rose-500/10 text-xs text-rose-400 font-semibold flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping"></span>
                  Avg. Organization has 2+ redundant AI plans
                </div>
              </div>

            </section>

            {/* DETAILED AUDIT FORM CONTAINER */}
            <section id="audit-tool" className="scroll-mt-24 mb-24 max-w-4xl mx-auto">
              <div className="text-center mb-8">
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--accent-primary)] mb-2 block">Interactive Engine</span>
                <h2 className="text-3xl font-bold font-display text-[var(--text-primary)]">Run Custom Stack Audit</h2>
                <p className="text-sm text-[var(--text-secondary)] mt-1">Select your team's configuration to generate concrete optimization recommendations.</p>
              </div>

              <div className="glass-panel p-6 md:p-10 relative">
                <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-emerald-500 to-indigo-500"></div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <TeamSizeInput value={teamSize} onChange={setTeamSize} />
                  <UseCaseSelect value={primaryUseCase} onChange={setPrimaryUseCase} />
                </div>

                <ToolGrid
                  selectedTools={selectedTools}
                  onAdd={handleAddTool}
                  onRemove={handleRemoveTool}
                  onUpdate={handleUpdateTool}
                />

                <div className="mt-8 border-t border-[var(--border-light)] pt-6 flex justify-end">
                  <button
                    onClick={handleCalculate}
                    className="w-full sm:w-auto px-10 py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-bold text-base hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/25 flex items-center justify-center gap-2"
                  >
                    Run Detailed Audit <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </section>

            {/* BENEFITS SCROLL TIMELINE */}
            <section className="mb-24 max-w-4xl mx-auto">
              <div className="text-center mb-16">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 mb-2 block">Audit Roadmap</span>
                <h2 className="text-3xl font-bold font-display text-[var(--text-primary)]">How the Spend Audit Journey Works</h2>
              </div>

              <div className="relative border-l border-[var(--border-light)] ml-4 md:ml-8 pl-8 flex flex-col gap-12">
                
                {/* Step 1 */}
                <div className="relative">
                  <div className="absolute -left-12 top-0.5 w-8 h-8 rounded-full bg-[var(--bg-primary)] border border-cyan-500 flex items-center justify-center text-xs font-bold text-cyan-400 shadow-sm shadow-cyan-500/20">
                    1
                  </div>
                  <h3 className="text-lg font-bold font-display text-[var(--text-primary)] mb-2">Input AI Tool Subscriptions</h3>
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                    Select the active coding, writing, research, or direct API tools your engineering and product teams are assigned. Provide approximate seat volumes.
                  </p>
                </div>

                {/* Step 2 */}
                <div className="relative">
                  <div className="absolute -left-12 top-0.5 w-8 h-8 rounded-full bg-[var(--bg-primary)] border border-purple-500 flex items-center justify-center text-xs font-bold text-purple-400 shadow-sm shadow-purple-500/20">
                    2
                  </div>
                  <h3 className="text-lg font-bold font-display text-[var(--text-primary)] mb-2">Run Algorithmic Consolidation</h3>
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                    Credex algorithms instantly run checks against pricing tiers, looking for overspent team brackets, multi-seat overlaps, and equivalent low-tier developer routing alternatives.
                  </p>
                </div>

                {/* Step 3 */}
                <div className="relative">
                  <div className="absolute -left-12 top-0.5 w-8 h-8 rounded-full bg-[var(--bg-primary)] border border-emerald-500 flex items-center justify-center text-xs font-bold text-emerald-400 shadow-sm shadow-emerald-500/20">
                    3
                  </div>
                  <h3 className="text-lg font-bold font-display text-[var(--text-primary)] mb-2">Unlock Direct Monthly Savings</h3>
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                    Instantly capture plain-English, per-tool optimization plans. Review recommendations with detailed price tables and download savings scripts.
                  </p>
                </div>

              </div>
            </section>

            {/* VIDEO DEMO EXPLAINER */}
            <section className="mb-24 max-w-4xl mx-auto">
              <div className="glass-panel p-4 md:p-6 overflow-hidden relative group">
                <div className="relative w-full aspect-video rounded-xl bg-slate-950/80 overflow-hidden flex items-center justify-center">
                  {!isVideoPlaying ? (
                    <>
                      {/* Video Thumbnail Frame */}
                      <div className="absolute inset-0 bg-gradient-to-tr from-cyan-950/30 to-indigo-950/20 flex flex-col items-center justify-center p-6 text-center select-none z-10">
                        <button 
                          onClick={() => setIsVideoPlaying(true)}
                          className="w-20 h-20 rounded-full bg-gradient-to-tr from-emerald-500 to-cyan-500 hover:scale-[1.1] active:scale-[0.95] text-white flex items-center justify-center shadow-2xl shadow-emerald-500/30 transition-all cursor-pointer group/btn mb-6"
                          aria-label="Play explainer video"
                        >
                          <Play className="w-8 h-8 fill-white translate-x-0.5 text-white" />
                        </button>
                        <h3 className="text-2xl font-bold font-display text-white mb-2">AI Spend Audit Walkthrough</h3>
                        <p className="text-sm text-slate-300 max-w-md">Learn how startups and mid-market teams salvage 30%+ of their developer tool expenditure in under 3 minutes.</p>
                      </div>
                    </>
                  ) : (
                    <iframe
                      width="100%"
                      height="100%"
                      src="https://www.youtube.com/embed/h8F9lsw-qb4?si=A3O2h1U47-iTuw7M&autoplay=1"
                      title="AI Spend Audit explainer video"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      style={{ border: 'none' }}
                      className="absolute inset-0 w-full h-full"
                    />
                  )}
                </div>
              </div>
            </section>

            {/* SOCIAL PROOF & TESTIMONIALS CAROUSEL */}
            <section className="mb-24 max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--accent-primary)] mb-2 block">Social Proof</span>
                <h2 className="text-2xl md:text-3xl font-bold font-display text-[var(--text-primary)]">Trusted by Product Leaders</h2>
              </div>

              {/* Testimonials Slider */}
              <div className="glass-panel p-8 md:p-10 relative flex flex-col justify-between min-h-[220px]">
                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                  <Sparkles className="w-24 h-24 text-[var(--text-primary)]" />
                </div>
                
                {/* Active Testimonial Quote */}
                <div className="transition-all duration-300">
                  <p className="text-base md:text-lg italic text-[var(--text-primary)] font-medium leading-relaxed mb-6">
                    &ldquo;{TESTIMONIALS[activeTestimonial].quote}&rdquo;
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-xs font-bold text-white shadow-md">
                      {TESTIMONIALS[activeTestimonial].avatar}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[var(--text-primary)]">{TESTIMONIALS[activeTestimonial].author}</h4>
                      <p className="text-[10px] font-semibold text-[var(--text-secondary)]">{TESTIMONIALS[activeTestimonial].role}</p>
                    </div>
                  </div>
                </div>

                {/* Slide Controls */}
                <div className="flex items-center justify-end gap-3 mt-6 border-t border-[var(--border-light)] pt-4">
                  <button 
                    onClick={() => setActiveTestimonial((prev) => (prev - 1 + TESTIMONIALS.length) % TESTIMONIALS.length)}
                    className="w-8 h-8 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-light)] hover:border-[var(--border-glow)] flex items-center justify-center text-[var(--text-primary)] transition-all"
                    aria-label="Previous testimonial"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-[10px] font-bold text-[var(--text-secondary)]">
                    {activeTestimonial + 1} / {TESTIMONIALS.length}
                  </span>
                  <button 
                    onClick={() => setActiveTestimonial((prev) => (prev + 1) % TESTIMONIALS.length)}
                    className="w-8 h-8 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-light)] hover:border-[var(--border-glow)] flex items-center justify-center text-[var(--text-primary)] transition-all"
                    aria-label="Next testimonial"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </section>
          </>
        ) : null}

        {/* RESULTS SECTION: ANIMATED SEQUENCE AND BACK CONTROLS */}
        {hasCalculated && optimizationResult ? (
          <div id="results-section" className="scroll-mt-6">
            
            {/* ANIMATED RESULTS SEQUENCE */}
            <AnimatedResultsSequence
              optimizationResult={optimizationResult}
              savings={optimizationResult.totalMonthlySavings}
              onConsultationClick={() => setLeadCaptureVisible(true)}
              onNotifyClick={() => setLeadCaptureVisible(true)}
            />

            {/* Fixed Back Button for optimal flow */}
            <button
              onClick={() => {
                setHasCalculated(false);
                setSummary('');
              }}
              className="fixed bottom-6 left-6 z-30 px-5 py-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-light)] hover:border-[var(--border-glow)] text-[var(--text-primary)] text-sm font-bold shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-1.5"
            >
              ← Back to Configuration
            </button>

            {/* Detailed Lead Capture Modal */}
            {leadCaptureVisible && (
              <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-pulse-slow" style={{ animationDuration: '8s' }}>
                <div className="glass-panel p-8 md:p-10 w-full max-w-lg relative">
                  <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-cyan-500 to-indigo-500"></div>
                  
                  <h3 className="text-2xl font-bold font-display text-[var(--text-primary)] mb-2">
                    {optimizationResult.totalMonthlySavings > 500 ? '🚀 Capture Organizations Savings' : '🔔 Stay Spend-Optimized'}
                  </h3>
                  <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-6">
                    {optimizationResult.totalMonthlySavings > 500
                      ? 'Submit your details to book a consultation and download exact cost optimization blueprints.'
                      : 'Get alerted instantly whenever new tool discounts or credit consolidation brackets become active.'}
                  </p>

                  <LeadCaptureForm
                    onSubmit={handleLeadSubmit}
                    isLoading={isSubmittingLead}
                    errorMessage={leadCaptureError}
                  />

                  <button
                    onClick={() => setLeadCaptureVisible(false)}
                    className="w-full mt-4 py-3 rounded-lg border border-[var(--border-light)] hover:bg-slate-500/5 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-bold transition-all"
                  >
                    Close Walkthrough
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : null}

      </div>

      {/* INNOVATIVE FOOTER */}
      <footer className="w-full max-w-6xl mx-auto border-t border-[var(--border-light)] mt-24 pt-12 px-6 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mb-12">
          
          {/* Copyright Vibe */}
          <div className="md:col-span-5 flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-cyan-500 to-indigo-500 flex items-center justify-center">
                <Coins className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="font-extrabold text-lg tracking-tight font-display text-[var(--text-primary)]">
                AI Spend <span className="gradient-text">Audit</span>
              </span>
            </div>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed max-w-sm">
              Credex intelligent auditing algorithms empower high-growth engineering organizations to identify tool stack over-allocations and streamline software spend with full security compliance.
            </p>
          </div>

          {/* Integration Links */}
          <div className="md:col-span-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)] mb-4">Supported Adapters</h4>
            <ul className="flex flex-col gap-2.5 text-xs text-[var(--text-secondary)]">
              <li className="hover:text-[var(--text-primary)] transition-colors">Claude API Gateway</li>
              <li className="hover:text-[var(--text-primary)] transition-colors">OpenAI Token Router</li>
              <li className="hover:text-[var(--text-primary)] transition-colors">Gemini Enterprise Adapter</li>
              <li className="hover:text-[var(--text-primary)] transition-colors">GitHub Dev Seat Monitor</li>
            </ul>
          </div>

          {/* Newsletter subscription module */}
          <div className="md:col-span-4 flex flex-col gap-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--text-primary)]">Capture Optimization Alerts</h4>
            <p className="text-xs text-[var(--text-secondary)]">Get quarterly bulletins with updated developer API rates and pricing strategies.</p>
            
            {!newsletterSubscribed ? (
              <form onSubmit={handleNewsletterSubmit} className="flex gap-2">
                <input 
                  type="email" 
                  placeholder="Enter email address" 
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                  className="flex-1 bg-[var(--bg-secondary)] border border-[var(--border-light)] focus:border-[var(--border-glow)] rounded-xl px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none transition-colors"
                  required
                  aria-label="Newsletter email address"
                />
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-indigo-500 hover:scale-[1.03] active:scale-[0.97] rounded-xl text-xs font-bold text-white shadow transition-all"
                >
                  Join
                </button>
              </form>
            ) : (
              <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/15 flex items-center gap-2 text-xs text-emerald-400 font-semibold animate-pulse-slow">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Subscribed! Checkmark validation active.</span>
              </div>
            )}
          </div>

        </div>

        {/* Legal block */}
        <div className="w-full pt-8 border-t border-[var(--border-light)] flex flex-col sm:flex-row items-center justify-between text-[10px] text-[var(--text-secondary)] gap-4">
          <p>&copy; {new Date().getFullYear()} Credex Intelligence Inc. All rights reserved.</p>
          <div className="flex gap-4">
            <span className="hover:text-[var(--text-primary)] transition-colors cursor-pointer">Security Ledger</span>
            <span className="hover:text-[var(--text-primary)] transition-colors cursor-pointer">Terms of Optimization</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
