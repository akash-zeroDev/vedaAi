import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      <header className="flex items-center justify-between p-6 max-w-7xl mx-auto w-full">
        <div className="text-2xl font-bold tracking-tighter">Graphite</div>
        <div className="flex gap-4">
          <Link href="/auth?mode=login" className="px-4 py-2 rounded-md hover:bg-slate-800 transition-colors">
            Sign In
          </Link>
          <Link href="/auth?mode=register" className="px-4 py-2 bg-white text-black rounded-md font-medium hover:bg-slate-200 transition-colors">
            Sign Up
          </Link>
        </div>
      </header>
      
      <main className="flex-1 flex flex-col items-center justify-center px-4 text-center">
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 max-w-4xl">
          The ultimate toolkit for modern educators.
        </h1>
        <p className="text-xl md:text-2xl text-slate-400 mb-10 max-w-2xl">
          Generate assignments, manage your classroom, and save hours of prep time with Graphite AI.
        </p>
        <div className="flex gap-4">
          <Link href="/auth?mode=register" className="px-8 py-4 bg-white text-black rounded-lg font-semibold text-lg hover:bg-slate-200 transition-colors">
            Get Started for Free
          </Link>
        </div>
      </main>
    </div>
  );
}
