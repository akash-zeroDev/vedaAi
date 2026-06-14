'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Loader2, FileText, CheckCircle2, Sparkles, ChevronRight, Settings, ArrowLeft } from 'lucide-react';
import { ICriteria, IRubric } from '@/lib/models/Rubric';
import { useLocalStorage } from '@/hooks/useLocalStorage';

export default function RubricGeneratorPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const viewId = searchParams.get('id');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'IDLE' | 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'>('IDLE');
  // Persisted across refreshes — stored in localStorage
  const [rubricId, setRubricId, clearRubricId] = useLocalStorage<string | null>('veda:rubricId', null);
  const [rubricData, setRubricData, clearRubricData] = useLocalStorage<IRubric | null>('veda:rubricData', null);
  const [error, setError] = useState('');

  // On mount: if ?id= present load that specific rubric; else restore from localStorage
  useEffect(() => {
    if (!viewId) {
      if (rubricData?.status === 'COMPLETED') setStatus('COMPLETED');
      else if (rubricId && !rubricData) setStatus('PENDING');
      return;
    }
    setStatus('PENDING');
    fetch(`/api/rubric/${viewId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.rubric) {
          setRubricData(data.rubric);
          setRubricId(data.rubric._id);
          setStatus(data.rubric.status === 'COMPLETED' ? 'COMPLETED' : 'FAILED');
        } else {
          setError('Could not load this rubric.');
          setStatus('FAILED');
        }
      })
      .catch(() => { setError('Failed to fetch rubric.'); setStatus('FAILED'); });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewId]);

  // Polling mechanism
  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    const pollStatus = async () => {
      if (!rubricId || status === 'COMPLETED' || status === 'FAILED') return;

      try {
        const res = await fetch(`/api/rubric/${rubricId}`);
        if (!res.ok) throw new Error('Failed to fetch status');
        
        const data = await res.json();
        const currentRubric: IRubric = data.rubric;
        
        setStatus(currentRubric.status);
        if (currentRubric.status === 'COMPLETED') {
          setRubricData(currentRubric);
        } else if (currentRubric.status === 'FAILED') {
          setError('Background generation failed. Please try again.');
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    };

    if (status === 'PENDING' || status === 'PROCESSING') {
      intervalId = setInterval(pollStatus, 2000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [rubricId, status]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description) return;

    setStatus('PENDING');
    setError('');
    clearRubricData();
    clearRubricId();
    setRubricId(null);

    try {
      const res = await fetch('/api/rubric/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to submit job');
      }

      const data = await res.json();
      setRubricId(data.rubricId);
    } catch (err: any) {
      setError(err.message);
      setStatus('FAILED');
    }
  };

  const getScoreColor = (label: string) => {
    const l = label.toLowerCase();
    if (l.includes('excellent') || l.includes('high')) return 'bg-emerald-50/80 text-emerald-700 border-emerald-100/50';
    if (l.includes('average') || l.includes('medium')) return 'bg-amber-50/80 text-amber-700 border-amber-100/50';
    if (l.includes('poor') || l.includes('low')) return 'bg-red-50/80 text-red-700 border-red-100/50';
    return 'bg-slate-50 text-slate-700 border-slate-100/50';
  };

  const renderTable = (criteria: ICriteria[]) => {
    if (!criteria || criteria.length === 0) return null;

    const headers = criteria[0].levels.map(l => l.label);

    return (
      <div className="w-full mt-6 overflow-hidden rounded-3xl bg-white border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.02)] ring-1 ring-slate-900/5">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50 backdrop-blur-xl">
                <th className="py-5 px-6 font-semibold text-slate-700 text-sm w-[20%] uppercase tracking-wider">Criteria</th>
                <th className="py-5 px-6 font-semibold text-slate-700 text-sm w-[10%] uppercase tracking-wider text-center">Weight</th>
                {headers.map((h, i) => (
                  <th key={i} className="py-5 px-6 font-semibold text-slate-700 text-sm uppercase tracking-wider w-[23%]">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/80">
              {criteria.map((c, idx) => (
                <tr key={idx} className="group hover:bg-slate-50/30 transition-colors duration-200">
                  <td className="py-6 px-6 align-top">
                    <div className="font-semibold text-slate-900 mb-1 leading-snug">{c.title}</div>
                  </td>
                  <td className="py-6 px-6 align-top text-center">
                    <div className="inline-flex items-center justify-center px-3 py-1.5 rounded-full bg-slate-100/80 text-slate-600 font-mono text-sm font-semibold">
                      {c.weight}%
                    </div>
                  </td>
                  {c.levels.map((level, lIdx) => (
                     <td key={lIdx} className="py-6 px-6 align-top">
                      <div className={`h-full p-4 rounded-2xl border transition-all duration-200 group-hover:shadow-sm ${getScoreColor(level.label)}`}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-bold opacity-90 text-sm">Score: {level.score}</span>
                        </div>
                        <p className="text-sm leading-relaxed opacity-90">{level.description}</p>
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="relative z-10 flex flex-col w-full h-full max-w-[1400px] mx-auto gap-8 pb-16 px-4 xl:px-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          {viewId && (
            <button
              onClick={() => router.push('/dashboard')}
              className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 mb-2 w-fit transition-colors"
            >
              <ArrowLeft size={14} /> Back to Dashboard
            </button>
          )}
          <div className="flex items-center gap-2 text-indigo-600 font-medium text-sm mb-2">
            <Sparkles size={16} /> AI Assistant
          </div>
          <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Rubric Generator</h1>
          {viewId ? (
            <p className="mt-1 text-sm text-indigo-700 bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-2 w-fit">
              Viewing saved result — <strong>{rubricData?.title ?? 'Loading...'}</strong>
            </p>
          ) : (
            <p className="mt-1 text-slate-500 text-lg max-w-3xl">
              Instantly generate a highly-detailed, objective grading matrix for any assignment using advanced AI context analysis.
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-8 w-full">
        {/* Form Section - Horizontal Layout */}
        <form onSubmit={handleSubmit} className="w-full bg-white rounded-[2rem] p-6 lg:p-8 border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-slate-900/5 relative overflow-hidden group">
          {/* Soft decorative blur */}
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-50/80 rounded-full blur-3xl opacity-50 group-hover:opacity-70 transition-opacity duration-700 pointer-events-none"></div>
          
          <div className="relative z-10 flex flex-col gap-6 max-w-4xl">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                <Settings size={16} className="text-slate-600" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Configuration</h2>
            </div>
            
            <div className="flex flex-col gap-2.5">
              <label htmlFor="title" className="text-sm font-semibold text-slate-700">Assignment Title</label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Roman Empire Essay"
                className="w-full px-5 py-3.5 bg-slate-50/50 border border-slate-200/80 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 transition-all text-slate-900 placeholder:text-slate-400 font-medium"
                required
                disabled={status === 'PENDING' || status === 'PROCESSING'}
              />
            </div>

            <div className="flex flex-col gap-2.5">
              <label htmlFor="description" className="text-sm font-semibold text-slate-700">Context & Requirements</label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide details about the assignment requirements, topics to cover, and formatting..."
                className="w-full min-h-[160px] px-5 py-4 bg-slate-50/50 border border-slate-200/80 rounded-2xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 transition-all text-slate-900 placeholder:text-slate-400 resize-y leading-relaxed"
                required
                disabled={status === 'PENDING' || status === 'PROCESSING'}
              />
            </div>

            {error && (
              <div className="p-4 bg-red-50 text-red-700 rounded-2xl text-sm font-medium border border-red-100/50 flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0"></div>
                {error}
              </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={status === 'PENDING' || status === 'PROCESSING'}
                className="flex items-center justify-between px-8 py-4 bg-slate-900 hover:bg-black text-white font-semibold rounded-2xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-slate-900/20 active:scale-[0.98] w-full sm:w-auto min-w-[260px]"
              >
                {(status === 'PENDING' || status === 'PROCESSING') ? (
                  <span className="flex items-center gap-3">
                    <Loader2 size={18} className="animate-spin text-indigo-400" />
                    Generating...
                  </span>
                ) : (
                  <span className="flex items-center gap-3">
                    <Sparkles size={18} className="text-indigo-400" />
                    Generate Rubric
                  </span>
                )}
                {!(status === 'PENDING' || status === 'PROCESSING') && <ChevronRight size={18} className="text-slate-400" />}
              </button>
            </div>
          </div>
        </form>

        {/* Output Section - Full Width */}
        <div className="w-full flex flex-col min-h-[400px]">
          {(status === 'PENDING' || status === 'PROCESSING') && (
            <div className="w-full h-full min-h-[400px] bg-white rounded-[2rem] border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.02)] ring-1 ring-slate-900/5 flex flex-col items-center justify-center gap-6 p-8 relative overflow-hidden mt-4">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 to-transparent opacity-50"></div>
              
              <div className="relative flex items-center justify-center w-24 h-24 mb-2">
                <div className="absolute inset-0 bg-indigo-500/10 rounded-[2rem] rotate-12 animate-pulse"></div>
                <div className="absolute inset-2 bg-indigo-500/10 rounded-[2rem] -rotate-12 animate-pulse delay-150"></div>
                <div className="relative flex items-center justify-center w-14 h-14 bg-white rounded-2xl shadow-sm border border-slate-100 z-10">
                  <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
                </div>
              </div>
              <div className="text-center relative z-10">
                <h3 className="text-xl font-bold text-slate-900 mb-2">Synthesizing Context...</h3>
                <p className="text-slate-500 max-w-sm text-center leading-relaxed">
                  Our AI is analyzing the semantic requirements of your assignment and mapping out objective evaluation criteria.
                </p>
              </div>
            </div>
          )}

          {status === 'COMPLETED' && rubricData && (
            <div className="flex flex-col animate-in fade-in slide-in-from-bottom-8 duration-700 fill-mode-both">
              <div className="flex items-center gap-4 bg-white p-6 rounded-[2rem] border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.02)] ring-1 ring-slate-900/5">
                <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100/50 flex items-center justify-center shrink-0 shadow-inner">
                  <CheckCircle2 size={24} className="text-emerald-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-2xl font-bold text-slate-900 leading-tight">{rubricData.title}</h2>
                  <p className="text-slate-500 text-sm font-medium mt-1 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    Evaluation matrix compiled successfully
                  </p>
                </div>
              </div>

              {renderTable(rubricData.criteria || [])}
            </div>
          )}

          {status === 'IDLE' && !rubricData && (
            <div className="w-full h-[300px] border-2 border-dashed border-slate-200/80 rounded-[2rem] flex flex-col items-center justify-center gap-5 text-slate-400 p-8 bg-slate-50/30">
              <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center shadow-sm border border-slate-100">
                <FileText size={28} className="text-slate-300" strokeWidth={1.5} />
              </div>
              <div className="text-center">
                <h3 className="text-lg font-semibold text-slate-700 mb-1">Ready for Generation</h3>
                <p className="font-medium text-slate-500 max-w-sm leading-relaxed">
                  Fill out the configuration above to generate your custom grading matrix.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
