'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Loader2, Activity, BarChart2, CheckCircle2, AlertCircle, UploadCloud, Type, File as FileIcon, X, ArrowLeft } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { MathText } from '@/components/MathText';
import { useLocalStorage } from '@/hooks/useLocalStorage';

interface IAnalyzedQuestion {
  questionText: string;
  calculatedScore: number;
  category: 'Easy' | 'Medium' | 'Hard';
  aiJustification: string;
}

interface IAnalysis {
  _id: string;
  title: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  overallStats?: {
    averageScore: number;
    easyCount: number;
    mediumCount: number;
    hardCount: number;
  };
  analyzedQuestions?: IAnalyzedQuestion[];
}

export default function DifficultyAnalyzerPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const viewId = searchParams.get('id'); // set when navigating from dashboard history

  const [title, setTitle] = useState('');
  const [questionsRaw, setQuestionsRaw] = useState('');
  const [inputMode, setInputMode] = useState<'text' | 'file'>('text');
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [status, setStatus] = useState<'IDLE' | 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'>('IDLE');
  // Persisted across refreshes — stored in localStorage
  const [analysisId, setAnalysisId, clearAnalysisId] = useLocalStorage<string | null>('veda:analysisId', null);
  const [analysisData, setAnalysisData, clearAnalysisData] = useLocalStorage<IAnalysis | null>('veda:analysisData', null);
  const [error, setError] = useState('');

  // If ?id= is in the URL (coming from dashboard history), load that specific result
  useEffect(() => {
    if (!viewId) {
      // Normal page load — restore from localStorage if available
      if (analysisData?.status === 'COMPLETED') setStatus('COMPLETED');
      else if (analysisId && !analysisData) setStatus('PENDING');
      return;
    }
    // Fetch the specific historical analysis by ID
    setStatus('PENDING');
    fetch(`/api/analyze/difficulty/${viewId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.analysis) {
          setAnalysisData(data.analysis);
          setAnalysisId(data.analysis._id);
          setStatus(data.analysis.status === 'COMPLETED' ? 'COMPLETED' : 'FAILED');
        } else {
          setError('Could not load this analysis.');
          setStatus('FAILED');
        }
      })
      .catch(() => { setError('Failed to fetch analysis.'); setStatus('FAILED'); });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewId]);

  // Polling mechanism
  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    const pollStatus = async () => {
      if (!analysisId || status === 'COMPLETED' || status === 'FAILED') return;

      try {
        const res = await fetch(`/api/analyze/difficulty/${analysisId}`);
        if (!res.ok) throw new Error('Failed to fetch status');
        
        const data = await res.json();
        const currentAnalysis: IAnalysis = data.analysis;
        
        setStatus(currentAnalysis.status);
        if (currentAnalysis.status === 'COMPLETED') {
          setAnalysisData(currentAnalysis);  // auto-persisted to localStorage
        } else if (currentAnalysis.status === 'FAILED') {
          setError('Background analysis failed. Please try again.');
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
  }, [analysisId, status]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;
    
    if (inputMode === 'text' && !questionsRaw.trim()) {
      setError('Please provide at least one valid question.');
      return;
    }
    
    if (inputMode === 'file' && !file) {
      setError('Please select a file to upload.');
      return;
    }

    let questions: string[] = [];
    let s3Key: string | null = null;

    if (inputMode === 'text') {
      questions = questionsRaw.split('\n').map(q => q.trim()).filter(q => q.length > 0);
      if (questions.length === 0) {
        setError('Please provide at least one valid question.');
        return;
      }
    }

    setStatus('PENDING');
    setError('');
    clearAnalysisData();  // clear previous result from localStorage
    clearAnalysisId();
    setAnalysisId(null);

    try {
      if (inputMode === 'file' && file) {
        setIsUploading(true);
        // 1. Get Presigned URL
        const presignedRes = await fetch('/api/upload/presigned-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileName: file.name, fileType: file.type }),
        });

        if (!presignedRes.ok) throw new Error('Failed to negotiate secure upload URL.');
        const presignedData = await presignedRes.json();
        const { signedUrl, objectKey } = presignedData;

        // 2. Upload file directly to S3
        const uploadRes = await fetch(signedUrl, {
          method: 'PUT',
          headers: { 'Content-Type': file.type },
          body: file,
        });

        if (!uploadRes.ok) throw new Error('Failed to upload document to secure storage.');
        s3Key = objectKey;
        setIsUploading(false);
      }

      // 3. Trigger Analysis
      const res = await fetch('/api/analyze/difficulty', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, questions, s3Key }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to submit job');
      }

      const data = await res.json();
      setAnalysisId(data.analysisId);
    } catch (err: any) {
      setError(err.message);
      setStatus('FAILED');
      setIsUploading(false);
    }
  };

  const getChartData = () => {
    if (!analysisData?.overallStats) return [];
    return [
      { name: 'Easy', count: analysisData.overallStats.easyCount, fill: '#cbd5e1' }, // slate-300
      { name: 'Medium', count: analysisData.overallStats.mediumCount, fill: '#64748b' }, // slate-500
      { name: 'Hard', count: analysisData.overallStats.hardCount, fill: '#1e293b' }, // slate-800
    ];
  };

  const renderBadge = (category: string) => {
    switch (category) {
      case 'Easy':
        return <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">Easy</span>;
      case 'Medium':
        return <span className="text-xs px-2 py-0.5 rounded bg-slate-200 text-slate-700 border border-slate-300">Medium</span>;
      case 'Hard':
        return <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-100 border border-slate-900">Hard</span>;
      default:
        return null;
    }
  };

  return (
    <div className="relative z-10 flex flex-col w-full h-full max-w-[1400px] mx-auto gap-10 pb-16 px-4 lg:px-8 pt-8">
      {/* Header */}
      <div className="flex flex-col gap-1">
        {viewId && (
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 mb-2 w-fit transition-colors"
          >
            <ArrowLeft size={14} /> Back to Dashboard
          </button>
        )}
        <div className="flex items-center gap-2 text-amber-600 font-semibold text-sm mb-2 uppercase tracking-wider">
          <Activity size={16} /> Data Analysis
        </div>
        <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Question Difficulty Analyzer</h1>
        {viewId ? (
          <p className="mt-1 text-sm text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-4 py-2 w-fit">
            Viewing saved result — <strong>{analysisData?.title ?? 'Loading...'}</strong>
          </p>
        ) : (
          <p className="mt-1 text-slate-500 text-lg max-w-3xl">
            Paste your raw exam or quiz questions below. Our AI will analyze the cognitive load of each question and distribute them into a visual difficulty matrix.
          </p>
        )}
      </div>


      <div className="flex flex-col gap-8 w-full">
        {/* Input Form */}
        <form onSubmit={handleSubmit} className="w-full bg-white rounded-[2rem] p-6 lg:p-8 border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] ring-1 ring-slate-900/5 relative overflow-hidden group">
          {/* Soft decorative blur */}
          <div className="absolute -top-24 -right-24 w-64 h-64 bg-amber-50/80 rounded-full blur-3xl opacity-50 group-hover:opacity-70 transition-opacity duration-700 pointer-events-none"></div>

          <div className="relative z-10 flex flex-col gap-6 max-w-4xl">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                <BarChart2 size={16} className="text-slate-600" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Configuration</h2>
            </div>

            <div className="flex flex-col gap-2.5">
              <label htmlFor="title" className="text-sm font-semibold text-slate-700">Analysis Title</label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Midterm Exam Analysis"
                className="w-full px-5 py-3.5 bg-slate-50/50 border border-slate-200/80 rounded-2xl focus:outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500/50 transition-all text-slate-900 placeholder:text-slate-400 font-medium"
                required
                disabled={status === 'PENDING' || status === 'PROCESSING'}
              />
            </div>

            <div className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-slate-700">Source Material</label>
                <div className="flex bg-slate-100 p-1 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setInputMode('text')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${inputMode === 'text' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    <Type size={14} /> Paste Text
                  </button>
                  <button
                    type="button"
                    onClick={() => setInputMode('file')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${inputMode === 'file' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    <UploadCloud size={14} /> Upload Document
                  </button>
                </div>
              </div>

              {inputMode === 'text' ? (
                <textarea
                  id="questions"
                  value={questionsRaw}
                  onChange={(e) => setQuestionsRaw(e.target.value)}
                  placeholder="1. What is the powerhouse of the cell?&#10;2. Explain the theory of relativity...&#10;3. Solve for X..."
                  className="w-full min-h-[160px] px-5 py-4 bg-slate-50/50 border border-slate-200/80 rounded-2xl focus:outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500/50 transition-all text-slate-900 placeholder:text-slate-400 resize-y leading-relaxed font-mono text-sm"
                  required={inputMode === 'text'}
                  disabled={status === 'PENDING' || status === 'PROCESSING'}
                />
              ) : (
                <div className="w-full">
                  {!file ? (
                    <label className="w-full min-h-[160px] flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-2xl bg-slate-50/50 hover:bg-slate-50 transition-colors cursor-pointer group">
                      <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-slate-200 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                        <UploadCloud className="text-amber-500" size={24} />
                      </div>
                      <span className="text-sm font-semibold text-slate-700">Click to upload or drag and drop</span>
                      <span className="text-xs text-slate-400 mt-1">PDF documents only (Max 20MB)</span>
                      <input 
                        type="file" 
                        accept="application/pdf"
                        className="hidden" 
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            setFile(e.target.files[0]);
                            setError('');
                          }
                        }}
                      />
                    </label>
                  ) : (
                    <div className="w-full p-4 border border-slate-200 rounded-2xl bg-slate-50 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-lg border border-slate-200 flex items-center justify-center shrink-0">
                          <FileIcon size={20} className="text-amber-600" />
                        </div>
                        <div className="flex flex-col overflow-hidden min-w-0 w-full">
                          <span className="text-sm font-semibold text-slate-800 truncate block w-full">{file.name}</span>
                          <span className="text-xs text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setFile(null)}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {error && (
              <div className="p-4 bg-red-50 text-red-700 rounded-2xl text-sm font-medium border border-red-100/50 flex items-start gap-3">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                {error}
              </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={status === 'PENDING' || status === 'PROCESSING'}
                className="flex items-center justify-between px-8 py-4 bg-slate-900 hover:bg-black text-white font-semibold rounded-2xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-slate-900/20 active:scale-[0.98] w-full sm:w-auto min-w-[260px]"
              >
                {(status === 'PENDING' || status === 'PROCESSING' || isUploading) ? (
                  <span className="flex items-center gap-3">
                    <Loader2 size={18} className="animate-spin text-amber-400" />
                    {isUploading ? 'Uploading to S3...' : 'Analyzing Matrix...'}
                  </span>
                ) : (
                  <span className="flex items-center gap-3">
                    <BarChart2 size={18} className="text-amber-400" />
                    Run Analysis
                  </span>
                )}
                {!(status === 'PENDING' || status === 'PROCESSING') && <Activity size={18} className="text-slate-400" />}
              </button>
            </div>
          </div>
        </form>

        {/* Output Section */}
        <div className="w-full flex flex-col min-h-[400px]">
          {status === 'IDLE' && !analysisData && (
            <div className="w-full h-[300px] border-2 border-dashed border-slate-200/80 rounded-[2rem] flex flex-col items-center justify-center gap-5 text-slate-400 p-8 bg-slate-50/30">
              <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center shadow-sm border border-slate-100">
                <BarChart2 size={28} className="text-slate-300" strokeWidth={1.5} />
              </div>
              <div className="text-center">
                <h3 className="text-lg font-semibold text-slate-700 mb-1">Ready for Analysis</h3>
                <p className="font-medium text-slate-500 max-w-sm leading-relaxed">
                  Paste your questions above and click Run Analysis to view the distribution matrix.
                </p>
              </div>
            </div>
          )}

          {(status === 'PENDING' || status === 'PROCESSING') && (
            <div className="w-full h-full min-h-[400px] bg-white rounded-[2rem] border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.02)] ring-1 ring-slate-900/5 flex flex-col items-center justify-center gap-6 p-8 relative overflow-hidden mt-4">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-50/50 to-transparent opacity-50"></div>
              
              <div className="relative flex items-center justify-center w-24 h-24 mb-2">
                <div className="absolute inset-0 bg-amber-500/10 rounded-[2rem] rotate-12 animate-pulse"></div>
                <div className="absolute inset-2 bg-amber-500/10 rounded-[2rem] -rotate-12 animate-pulse delay-150"></div>
                <div className="relative flex items-center justify-center w-14 h-14 bg-white rounded-2xl shadow-sm border border-slate-100 z-10">
                  <Loader2 className="w-6 h-6 text-amber-600 animate-spin" />
                </div>
              </div>
              <div className="text-center relative z-10">
                <h3 className="text-xl font-bold text-slate-900 mb-2">Processing Dataset...</h3>
                <p className="text-slate-500 max-w-sm text-center leading-relaxed">
                  Running NLP models against provided questions to analyze semantic difficulty.
                </p>
              </div>
            </div>
          )}

          {status === 'COMPLETED' && analysisData && analysisData.overallStats && (
            <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Top Stats & Chart */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-md border border-slate-200 shadow-sm flex flex-col justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 leading-tight">{analysisData.title}</h2>
                    <p className="text-slate-500 text-sm mt-1 flex items-center gap-1.5">
                      <CheckCircle2 size={14} className="text-emerald-500" />
                      Analysis complete
                    </p>
                  </div>
                  <div className="mt-6 flex items-baseline gap-2">
                    <span className="text-4xl font-bold text-slate-900 tracking-tighter">
                      {analysisData.overallStats.averageScore}
                    </span>
                    <span className="text-slate-500 text-sm font-medium">/ 10 Avg. Difficulty</span>
                  </div>
                </div>

                {/* Recharts Bar Chart */}
                <div className="bg-white p-6 rounded-md border border-slate-200 shadow-sm h-[200px] flex flex-col">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4">Distribution</h3>
                  <div className="flex-1 w-full h-full min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={getChartData()} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                        <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '6px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                          {getChartData().map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Data Table */}
              <div className="w-full bg-white border border-slate-200 rounded-md shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-200 bg-slate-50">
                  <h3 className="text-sm font-bold text-slate-900">Analyzed Dataset</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50/50">
                        <th className="py-3 px-5 font-semibold text-slate-600 w-[50%]">Question</th>
                        <th className="py-3 px-5 font-semibold text-slate-600">Category</th>
                        <th className="py-3 px-5 font-semibold text-slate-600 text-center">Score</th>
                        <th className="py-3 px-5 font-semibold text-slate-600">Justification</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {analysisData.analyzedQuestions?.map((q, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3 px-5 font-medium text-slate-900 align-top">
                            <MathText text={q.questionText} />
                          </td>
                          <td className="py-3 px-5 align-top whitespace-nowrap">
                            {renderBadge(q.category)}
                          </td>
                          <td className="py-3 px-5 align-top text-center">
                            <span className="font-mono font-semibold text-slate-700">{q.calculatedScore}</span>
                          </td>
                          <td className="py-3 px-5 text-slate-600 align-top leading-relaxed">
                            {q.aiJustification}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
