'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { UploadCloud, File as FileIcon, Loader2, CheckCircle2, RotateCcw, ArrowLeft } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { ISummary } from '@/lib/models/Summary';
import { useLocalStorage } from '@/hooks/useLocalStorage';

function LessonSummaryPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const viewId = searchParams.get('id');

  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  
  // Persisted across refreshes — stored in localStorage
  const [summaryId, setSummaryId, clearSummaryId] = useLocalStorage<string | null>('veda:summaryId', null);
  const [summaryData, setSummaryData, clearSummaryData] = useLocalStorage<ISummary | null>('veda:summaryData', null);
  const [status, setStatus] = useState<'IDLE' | 'UPLOADING' | 'PENDING' | 'PARSING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'>('IDLE');
  const [error, setError] = useState('');

  // On mount: if ?id= present, load that specific summary; else restore from localStorage
  useEffect(() => {
    if (!viewId) {
      if ((summaryData as any)?.status === 'COMPLETED') setStatus('COMPLETED');
      else if (summaryId && !summaryData) setStatus('PENDING');
      return;
    }
    setStatus('PENDING');
    fetch(`/api/summary/${viewId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.summary) {
          setSummaryData(data.summary);
          setSummaryId(data.summary._id);
          setStatus(data.summary.status === 'COMPLETED' ? 'COMPLETED' : 'FAILED');
        } else {
          setError('Could not load this summary.');
          setStatus('FAILED');
        }
      })
      .catch(() => { setError('Failed to fetch summary.'); setStatus('FAILED'); });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewId]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Polling mechanism
  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    const pollStatus = async () => {
      if (!summaryId || status === 'COMPLETED' || status === 'FAILED' || status === 'UPLOADING') return;

      try {
        const res = await fetch(`/api/summary/${summaryId}`);
        if (!res.ok) throw new Error('Failed to fetch status');
        
        const data = await res.json();
        const currentSummary: ISummary = data.summary;
        
        setStatus(currentSummary.status as any);
        if (currentSummary.status === 'COMPLETED') {
          setSummaryData(currentSummary);
        } else if (currentSummary.status === 'FAILED') {
          setError('Background generation failed. Please try again.');
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    };

    if (['PENDING', 'PARSING', 'PROCESSING'].includes(status)) {
      intervalId = setInterval(pollStatus, 2000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [summaryId, status]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === 'application/pdf') {
        setFile(droppedFile);
        if (!title) setTitle(droppedFile.name.replace('.pdf', ''));
      } else {
        setError('Please upload a valid PDF file.');
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type === 'application/pdf') {
        setFile(selectedFile);
        if (!title) setTitle(selectedFile.name.replace('.pdf', ''));
        setError('');
      } else {
        setError('Please upload a valid PDF file.');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !title) return;

    setStatus('UPLOADING');
    setError('');
    clearSummaryData();
    clearSummaryId();
    setSummaryId(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title);

    try {
      const res = await fetch('/api/summary/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to submit document');
      }

      const data = await res.json();
      setSummaryId(data.summaryId);
      setStatus('PENDING');
    } catch (err: any) {
      setError(err.message);
      setStatus('FAILED');
    }
  };

  const handleReset = () => {
    setFile(null);
    setTitle('');
    setStatus('IDLE');
    clearSummaryId();
    clearSummaryData();
    setSummaryId(null);
    setError('');
  };

  const getStatusText = () => {
    switch(status) {
      case 'UPLOADING': return "Uploading file...";
      case 'PENDING': return "Waiting in queue...";
      case 'PARSING': return "Parsing document...";
      case 'PROCESSING': return "AI is compiling summary...";
      default: return "Processing...";
    }
  };

  return (
    <div className="relative z-10 flex flex-col w-full h-full max-w-4xl mx-auto gap-8 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          {viewId && (
            <button
              onClick={() => router.push('/dashboard')}
              className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-900 mb-2 w-fit transition-colors"
            >
              <ArrowLeft size={14} /> Back to Dashboard
            </button>
          )}
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Lesson Summary Generator</h1>
          {viewId ? (
            <p className="mt-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-2 w-fit">
              Viewing saved result — <strong>{summaryData?.title ?? 'Loading...'}</strong>
            </p>
          ) : (
            <p className="mt-2 text-slate-500">
              Upload a PDF document and let AI instantly extract core themes, key vocabulary, and an executive summary.
            </p>
          )}
        </div>
        {status === 'COMPLETED' && (
          <button 
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
          >
            <RotateCcw size={16} />
            Upload Another Document
          </button>
        )}
      </div>

      <div className="w-full">
        {status === 'IDLE' || status === 'FAILED' ? (
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <label htmlFor="title" className="text-sm font-medium text-slate-700">Document Title</label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Chapter 4: The Roman Empire"
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 transition-all text-slate-900 placeholder:text-slate-400"
                required
              />
            </div>

            <div 
              className={`relative flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-2xl transition-all cursor-pointer ${
                isDragging ? 'border-slate-400 bg-slate-50/50' : 'border-slate-200 bg-white hover:bg-slate-50/50'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept="application/pdf" 
                className="hidden" 
              />
              
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                {file ? (
                  <>
                    <FileIcon size={48} className="text-indigo-500 mb-3" />
                    <p className="mb-2 text-sm text-slate-700 font-semibold">{file.name}</p>
                    <p className="text-xs text-slate-500">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                  </>
                ) : (
                  <>
                    <UploadCloud size={48} className="text-slate-300 mb-3" />
                    <p className="mb-2 text-sm text-slate-500">
                      <span className="font-semibold text-slate-700">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-slate-400">PDF documents only (max 10MB)</p>
                  </>
                )}
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={!file || !title}
              className="mt-2 w-full flex items-center justify-center gap-2 px-6 py-3 bg-[#0B132B] hover:bg-black text-white font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Generate Summary
            </button>
          </form>
        ) : (status === 'COMPLETED' && summaryData) ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-3 mb-8 pb-6 border-b border-slate-100">
              <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                <CheckCircle2 size={20} className="text-emerald-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">{summaryData.title}</h2>
                <p className="text-slate-500 text-sm flex items-center gap-2">
                  <FileIcon size={14} /> {summaryData.fileName}
                </p>
              </div>
            </div>
            
            <article className="prose prose-slate prose-headings:font-semibold prose-a:text-indigo-600 max-w-none">
              <ReactMarkdown>{summaryData.summaryMarkdown || ''}</ReactMarkdown>
            </article>
          </div>
        ) : (
          <div className="w-full h-80 bg-white rounded-3xl border border-slate-100 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] flex flex-col items-center justify-center gap-4 p-8">
            <div className="relative flex items-center justify-center w-20 h-20 mb-2">
              <div className="absolute inset-0 bg-indigo-500/10 rounded-full animate-ping"></div>
              <div className="absolute inset-2 bg-indigo-500/20 rounded-full animate-pulse"></div>
              <div className="relative flex items-center justify-center w-12 h-12 bg-white rounded-full shadow-sm border border-slate-100 z-10">
                <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-slate-900">{getStatusText()}</h3>
            <p className="text-slate-500 text-center max-w-sm text-sm">
              Please wait while our system processes your document. This may take a few moments depending on the file size.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}


export default function LessonSummaryPage() {
  return (
    <Suspense>
      <LessonSummaryPageContent />
    </Suspense>
  );
}
