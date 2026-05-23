import React from 'react';
import { Hammer, HardHat, Pickaxe } from 'lucide-react';

interface UnderConstructionProps {
  title: string;
}

const UnderConstruction: React.FC<UnderConstructionProps> = ({ title }) => {
  return (
    <div className="flex flex-col items-center justify-center w-full h-full min-h-[500px] p-6 text-center animate-in fade-in duration-500">
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-[#F97316]/20 blur-2xl rounded-full scale-150"></div>
        <div className="relative w-24 h-24 bg-white border border-[#E5E7EB] shadow-xl rounded-2xl flex items-center justify-center transform -rotate-6 transition-transform hover:rotate-0 duration-300">
          <HardHat size={48} className="text-[#F97316]" />
        </div>
        <div className="absolute -bottom-3 -right-3 w-12 h-12 bg-white border border-[#E5E7EB] shadow-lg rounded-xl flex items-center justify-center transform rotate-12">
          <Hammer size={24} className="text-[#4B5563]" />
        </div>
      </div>
      
      <h1 className="text-3xl font-bold text-[#111827] tracking-tight mb-3">
        {title}
      </h1>
      <p className="text-[#6B7280] max-w-md mx-auto text-base leading-relaxed">
        We're actively building this section to bring you the best possible experience. Check back soon for exciting new updates!
      </p>
    </div>
  );
};

export default UnderConstruction;
