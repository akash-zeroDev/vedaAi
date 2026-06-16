'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { 
  CheckCircle2, 
  BarChart3, 
  Target, 
  Sparkles, 
  UploadCloud,
  Wand2,
  ListTodo,
  Bot,
  Brain,
  ShieldCheck,
  Zap,
  Server,
  Database,
  Cpu,
  Activity,
  Network,
  ArrowRight,
  FileText,
  BrainCircuit,
  Settings,
  BookOpen
} from 'lucide-react';

export default function LandingPage() {
  const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const floatAnimation = {
    animate: {
      y: [0, -10, 0],
      transition: {
        duration: 5,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-300 font-sans overflow-x-hidden selection:bg-indigo-500/30">
      
      {/* Navbar */}
      <nav className="fixed top-0 left-0 w-full z-50 bg-[#0B0F19]/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center">
              <img src="/graphite_modern_logo.png" alt="Graphite" className="w-5 h-5 object-contain" />
            </div>
            <span className="text-lg font-bold tracking-tight text-white">Graphite</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8 text-[14px] font-medium text-slate-400">
            <a href="#home" className="hover:text-white transition-colors">Home</a>
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-white transition-colors">How it works</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/auth?mode=login" className="hidden md:block text-[14px] font-medium text-slate-400 hover:text-white transition-colors">
              Log in
            </Link>
            <Link href="/auth?mode=register" className="bg-indigo-600 text-white px-5 py-2 rounded-lg font-medium text-[14px] hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-500/20">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      <main className="relative z-10 pt-24 pb-20">
        
        {/* Subtle Background Elements */}
        <div className="absolute top-[-10%] left-[20%] w-[60%] h-[500px] bg-indigo-600/10 blur-[120px] rounded-full pointer-events-none z-0" />
        <div className="absolute top-0 left-0 w-full h-[600px] bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none z-0" />

        {/* ── Hero Section ── */}
        <section id="home" className="max-w-7xl mx-auto px-6 pt-16 lg:pt-24 pb-24 border-b border-white/5 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            
            {/* Hero Left Content */}
            <motion.div 
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
              className="flex-1 text-center lg:text-left"
            >
              <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold uppercase tracking-wider mb-8">
                <Sparkles size={14} className="text-indigo-400" />
                Enterprise Infrastructure
              </motion.div>
              
              <motion.h1 variants={fadeUp} className="text-5xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.05] mb-6">
                The Intelligence <br className="hidden md:block"/> Engine for <br className="hidden md:block"/> 
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-violet-400">
                  Modern Education.
                </span>
              </motion.h1>
              
              <motion.p variants={fadeUp} className="text-[18px] text-slate-400 mb-10 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                Empowering educators with a robust, AI-integrated ecosystem. Streamline assignments, automate rubrics, and scale your teaching workflow with zero latency.
              </motion.p>
              
              <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                <Link href="/auth?mode=register" className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium text-[15px] hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-500/20 flex items-center gap-2 w-full sm:w-auto justify-center">
                  Start Building Free
                  <ArrowRight size={16} />
                </Link>
              </motion.div>

              {/* Stats Row */}
              <motion.div variants={fadeUp} className="flex items-center justify-center lg:justify-start gap-10 mt-12 pt-8 border-t border-white/5">
                <div>
                  <h4 className="text-2xl font-bold text-white">50k+</h4>
                  <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mt-1">Assessments</p>
                </div>
                <div>
                  <h4 className="text-2xl font-bold text-white">10k+</h4>
                  <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mt-1">Educators</p>
                </div>
                <div>
                  <h4 className="text-2xl font-bold text-white">99.9%</h4>
                  <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mt-1">Uptime</p>
                </div>
              </motion.div>
            </motion.div>

            {/* Hero Right Composition (Colorful Dark Dashboard) */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="flex-1 relative w-full h-[500px] hidden lg:block"
            >
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[360px] bg-[#0F1523] rounded-2xl shadow-2xl border border-white/10 overflow-hidden flex flex-col z-10">
                <div className="h-10 bg-[#161E31] border-b border-white/5 flex items-center px-4 gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                </div>
                <div className="p-6 flex-1 flex gap-6">
                  {/* Sidebar */}
                  <div className="w-32 flex flex-col gap-3">
                    <div className="h-6 bg-white/5 rounded w-full" />
                    <div className="h-6 bg-white/5 rounded w-5/6" />
                    <div className="h-6 bg-white/5 rounded w-4/6" />
                  </div>
                  {/* Content */}
                  <div className="flex-1 flex flex-col gap-4">
                    <div className="h-24 bg-gradient-to-r from-indigo-600/10 to-violet-600/10 border border-indigo-500/20 rounded-xl" />
                    <div className="flex gap-4">
                      <div className="h-32 flex-1 bg-white/5 border border-white/5 rounded-xl" />
                      <div className="h-32 flex-1 bg-white/5 border border-white/5 rounded-xl" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Colorful Floating Widget */}
              <motion.div 
                variants={floatAnimation}
                animate="animate"
                className="absolute top-[10%] left-[0%] bg-[#0F1523] p-4 rounded-xl shadow-2xl border border-white/10 z-20 flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400 border border-emerald-500/20">
                  <Activity size={20} />
                </div>
                <div>
                  <p className="font-bold text-white text-sm">System Status</p>
                  <p className="text-xs text-slate-400 font-medium">All systems operational</p>
                </div>
              </motion.div>

              <motion.div 
                variants={floatAnimation}
                animate="animate"
                style={{ animationDelay: '1s' }}
                className="absolute bottom-[20%] right-[0%] bg-[#0F1523] p-4 rounded-xl shadow-2xl border border-white/10 z-20 flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400 border border-amber-500/20">
                  <Cpu size={20} />
                </div>
                <div>
                  <p className="font-bold text-white text-sm">Latency</p>
                  <p className="text-xs text-slate-400 font-medium">12ms response time</p>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* ── Problem vs Solution Section ── */}
        <section className="py-24 bg-[#080B12] border-b border-white/5">
          <div className="max-w-7xl mx-auto px-6">
            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={fadeUp}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 tracking-tight">
                Streamline Your Workflow.
              </h2>
              <p className="text-[17px] text-slate-400 max-w-2xl mx-auto">
                Replace manual curriculum generation with automated, highly accurate models.
              </p>
            </motion.div>

            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={staggerContainer}
              className="grid grid-cols-1 md:grid-cols-3 gap-6 px-4"
            >
              {[
                { title: 'Instant Generation', desc: 'Generate assignments in seconds instead of hours.', icon: <FileText />, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
                { title: 'Unified Hub', desc: 'All your tools, rubrics, and analysis in one dashboard.', icon: <Settings />, color: 'text-violet-400', bg: 'bg-violet-500/10' },
                { title: 'Personalized Growth', desc: 'Targeted rubrics to measure exact student progress.', icon: <BarChart3 />, color: 'text-emerald-400', bg: 'bg-emerald-500/10' }
              ].map((card, i) => (
                <motion.div key={i} variants={fadeUp} className="bg-[#0B0F19] p-6 rounded-2xl border border-white/5 hover:border-white/10 transition-colors">
                  <div className={`w-12 h-12 rounded-xl border border-white/5 flex items-center justify-center mb-4 ${card.bg} ${card.color}`}>
                    {React.cloneElement(card.icon as React.ReactElement, { size: 20 })}
                  </div>
                  <h4 className="font-bold text-white mb-2">{card.title}</h4>
                  <p className="text-sm text-slate-400 leading-relaxed">{card.desc}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ── Features Highlights ── */}
        <section id="features" className="py-24 max-w-7xl mx-auto px-6 border-b border-white/5">
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeUp}
            className="mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 tracking-tight">
              Powerful Capabilities.
            </h2>
            <p className="text-[17px] text-slate-400 max-w-2xl">
              Built specifically for the demands of modern education.
            </p>
          </motion.div>

          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            {[
              { title: 'Smart Assignment Generation', desc: 'Automatically generate comprehensive, structured assessments complete with LaTeX math rendering and print-ready formatting.', icon: <FileText/>, color: 'text-indigo-400', bg: 'bg-indigo-500/10 border-indigo-500/20' },
              { title: 'Cognitive Difficulty Analysis', desc: 'Visually map the cognitive load of a text or question set to ensure your materials are perfectly leveled for your students.', icon: <BrainCircuit/>, color: 'text-violet-400', bg: 'bg-violet-500/10 border-violet-500/20' },
              { title: 'Instant Rubric Crafting', desc: 'Instantly create comprehensive, structured grading matrices and rubrics tailored to specific essay prompts.', icon: <Target/>, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
              { title: 'Lesson Summarization', desc: 'Upload massive PDFs or curriculum documents and instantly extract key themes, vocabulary, and executive summaries.', icon: <BookOpen/>, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' }
            ].map((f, i) => (
              <motion.div key={i} variants={fadeUp} className="bg-[#0B0F19] rounded-2xl p-8 border border-white/5 hover:border-white/10 transition-colors flex gap-6">
                <div className={`w-12 h-12 shrink-0 rounded-xl border flex items-center justify-center ${f.bg} ${f.color}`}>
                  {React.cloneElement(f.icon as React.ReactElement, { size: 24 })}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">{f.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    {f.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* ── How It Works & Architecture ── */}
        <section id="how-it-works" className="py-24 bg-[#080B12] border-b border-white/5">
          <div className="max-w-7xl mx-auto px-6">
            
            {/* Simple Steps */}
            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={fadeUp}
              className="mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 tracking-tight">
                How It Works
              </h2>
              <p className="text-[17px] text-slate-400 max-w-2xl">
                Transform your curriculum in three easy steps.
              </p>
            </motion.div>

            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={staggerContainer}
              className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-24"
            >
              {[
                { step: '01', title: 'Upload Content', desc: 'Upload PDFs, plans, or prompts.', icon: <UploadCloud/>, color: 'text-indigo-400' },
                { step: '02', title: 'AI Processes', desc: 'Extract context and measure difficulty.', icon: <Wand2/>, color: 'text-violet-400' },
                { step: '03', title: 'Get Results', desc: 'Export print-ready assignments.', icon: <ListTodo/>, color: 'text-emerald-400' }
              ].map((f, i) => (
                <motion.div key={i} variants={fadeUp} className="p-6 bg-[#0B0F19] border border-white/5 rounded-2xl relative">
                  <div className={`text-xs font-bold mb-4 uppercase tracking-widest ${f.color}`}>Step {f.step}</div>
                  <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
                    {React.cloneElement(f.icon as React.ReactElement, { size: 18, className: "text-slate-400" })}
                    {f.title}
                  </h3>
                  <p className="text-slate-400 text-sm">{f.desc}</p>
                </motion.div>
              ))}
            </motion.div>

            {/* Architecture */}
            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={fadeUp}
              className="mb-12"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-slate-300 text-xs font-semibold uppercase tracking-wider mb-4">
                <Network size={14} className="text-indigo-400" />
                Under the Hood
              </div>
              <h2 className="text-2xl font-bold text-white mb-3 tracking-tight">
                Enterprise Architecture
              </h2>
              <p className="text-[15px] text-slate-400 max-w-3xl">
                Powered by a heavily distributed, asynchronous micro-architecture designed to handle massive processing payloads with zero timeouts.
              </p>
            </motion.div>

            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={staggerContainer}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-10"
            >
              {[
                { title: 'Edge Client', desc: 'Next.js App Router providing lightning-fast static delivery.', icon: <Activity/>, color: 'text-sky-400', bg: 'bg-sky-500/10' },
                { title: 'Node.js Gateway', desc: 'Express backend handling authentication and routing.', icon: <Server/>, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                { title: 'Redis Datastore', desc: 'In-memory caching and persistent state management.', icon: <Database/>, color: 'text-rose-400', bg: 'bg-rose-500/10' },
                { title: 'BullMQ Workers', desc: 'Distributed background job processing for heavy tasks.', icon: <Cpu/>, color: 'text-indigo-400', bg: 'bg-indigo-500/10' }
              ].map((f, i) => (
                <motion.div key={i} variants={fadeUp} className="bg-[#0B0F19] border border-white/5 hover:border-white/10 transition-colors rounded-2xl p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center border border-white/5 ${f.bg} ${f.color}`}>
                      {React.cloneElement(f.icon as React.ReactElement, { size: 16 })}
                    </div>
                    <h3 className="font-bold text-white text-sm">{f.title}</h3>
                  </div>
                  <p className="text-slate-400 text-[13px] leading-relaxed">{f.desc}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ── Pricing ── */}
        <section id="pricing" className="py-32 bg-[#0B0F19]">
          <div className="max-w-3xl mx-auto text-center px-6">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
            >
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 tracking-tight">
                Simple, transparent pricing.
              </h2>
              <p className="text-[17px] text-slate-400 mb-12">
                Accessible to educators everywhere. 
              </p>

              <div className="p-10 rounded-3xl bg-[#080B12] border border-white/5 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-50" />
                <span className="inline-block px-3 py-1 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-bold uppercase tracking-widest text-[10px] mb-6">
                  Pricing Plans
                </span>
                <h3 className="text-4xl md:text-5xl font-extrabold text-white mb-6 tracking-tight">
                  To Be Announced
                </h3>
                <p className="text-[15px] text-slate-400 max-w-lg mx-auto mb-8 leading-relaxed">
                  Graphite is currently in a free early-access preview phase. We will be announcing our official pricing tiers soon.
                </p>
                <Link href="/dashboard/upgrade" className="inline-flex items-center justify-center px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium text-[15px] hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-500/20">
                  Support Us
                </Link>
              </div>
            </motion.div>
          </div>
        </section>

      </main>

      {/* ── Footer ── */}
      <footer className="bg-[#080B12] border-t border-white/5 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center">
              <img src="/graphite_modern_logo.png" alt="Graphite" className="w-5 h-5 object-contain" />
            </div>
            <span className="font-bold text-white text-lg tracking-tight">Graphite AI</span>
          </div>
          
          <div className="flex gap-6">
            <a href="#" className="text-slate-500 hover:text-white transition-colors text-sm font-medium">Home</a>
            <a href="#features" className="text-slate-500 hover:text-white transition-colors text-sm font-medium">Features</a>
            <a href="#pricing" className="text-slate-500 hover:text-white transition-colors text-sm font-medium">Pricing</a>
            <a href="#" className="text-slate-500 hover:text-white transition-colors text-sm font-medium">Contact</a>
          </div>
          
          <p className="text-sm text-slate-500">
            &copy; {new Date().getFullYear()} Graphite Education Inc.
          </p>
        </div>
      </footer>
    </div>
  );
}
