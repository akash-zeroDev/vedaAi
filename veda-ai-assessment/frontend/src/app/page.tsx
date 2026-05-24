import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <div className="flex flex-col items-center text-center space-y-6 max-w-2xl">
        <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 tracking-tight">
          VedaAI Assessment Creator
        </h1>
        
        <p className="text-lg md:text-xl text-gray-500 font-medium max-w-xl">
          AI-powered question paper generation for educators.
        </p>
        
        <div className="pt-4">
          <Link 
            href="/dashboard"
            className="inline-flex items-center justify-center px-8 py-3.5 text-base font-semibold text-white bg-gray-900 hover:bg-gray-800 rounded-full transition-all duration-200 shadow-sm hover:shadow-md hover:-translate-y-0.5"
          >
            Open Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
