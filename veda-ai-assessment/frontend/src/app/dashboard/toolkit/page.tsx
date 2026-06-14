'use client';

import React from 'react';
import Link from 'next/link';
import { LayoutList, FileText, ChevronRight, BarChart2, BrainCircuit, Lock } from 'lucide-react';

export default function ToolkitPage() {
  const tools = [
    {
      id: 'rubric-generator',
      title: 'Rubric Generator',
      description: 'Instantly generate highly-detailed, objective grading rubrics for any assignment using AI.',
      icon: <LayoutList size={24} className="text-indigo-600" />,
      href: '/dashboard/toolkit/rubric-generator',
      color: 'bg-indigo-50 border-indigo-100',
      comingSoon: false,
    },
    {
      id: 'lesson-summary',
      title: 'Lesson Summary Generator',
      description: 'Upload a PDF document and let AI extract core themes, key vocabulary, and an executive summary.',
      icon: <FileText size={24} className="text-emerald-600" />,
      href: '/dashboard/toolkit/lesson-summary',
      color: 'bg-emerald-50 border-emerald-100',
      comingSoon: false,
    },
    {
      id: 'difficulty-analyzer',
      title: 'Question Difficulty Analyzer',
      description: 'Analyze the cognitive load of raw exam questions and distribute them into a visual difficulty matrix.',
      icon: <BarChart2 size={24} className="text-amber-600" />,
      href: '/dashboard/toolkit/difficulty-analyzer',
      color: 'bg-amber-50 border-amber-100',
      comingSoon: false,
    },
    {
      id: 'bloom-classifier',
      title: "Bloom's Taxonomy Classifier",
      description: "Automatically classify questions and learning objectives across Bloom's six cognitive levels — from Remember to Create — to ensure balanced assessments.",
      icon: <BrainCircuit size={24} className="text-violet-500" />,
      href: '#',
      color: 'bg-violet-50 border-violet-100',
      comingSoon: true,
    },
  ];

  return (
    <div className="relative z-10 flex flex-col w-full max-w-6xl mx-auto gap-8 pb-12">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">AI Teacher's Toolkit</h1>
        <p className="mt-2 text-slate-500 max-w-2xl">
          Supercharge your workflow with our suite of AI-powered tools. Select a tool below to get started.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
        {tools.map((tool) =>
          tool.comingSoon ? (
            /* Coming Soon card — not a link, not clickable */
            <div
              key={tool.id}
              className="relative flex flex-col bg-white border border-dashed border-slate-200 rounded-3xl p-6 overflow-hidden select-none opacity-80"
            >
              {/* Subtle gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-violet-50/60 via-transparent to-transparent pointer-events-none" />

              {/* Coming Soon badge */}
              <div className="absolute top-4 right-4 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-violet-100 border border-violet-200">
                <Lock size={10} className="text-violet-500" />
                <span className="text-[10px] font-bold text-violet-600 uppercase tracking-widest">Coming Soon</span>
              </div>

              <div className={`relative w-12 h-12 rounded-xl flex items-center justify-center mb-6 border ${tool.color}`}>
                {tool.icon}
              </div>

              <h3 className="text-xl font-bold text-slate-700 mb-2">{tool.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-6 flex-grow">
                {tool.description}
              </p>

              <div className="flex items-center gap-2 text-sm font-semibold text-slate-400 mt-auto">
                <Lock size={13} />
                Locked — Available Soon
              </div>
            </div>
          ) : (
            <Link
              key={tool.id}
              href={tool.href}
              className="group flex flex-col bg-white border border-slate-200 rounded-3xl p-6 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:border-slate-300 transition-all cursor-pointer"
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 border ${tool.color}`}>
                {tool.icon}
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">{tool.title}</h3>
              <p className="text-slate-500 text-sm leading-relaxed mb-6 flex-grow">
                {tool.description}
              </p>
              <div className="flex items-center text-sm font-semibold text-[#0B132B] group-hover:text-indigo-600 transition-colors mt-auto">
                Open Tool
                <ChevronRight size={16} className="ml-1 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          )
        )}
      </div>
    </div>
  );
}
