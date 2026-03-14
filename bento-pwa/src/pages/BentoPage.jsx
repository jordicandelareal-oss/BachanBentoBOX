import React from 'react';
import BentoMaker from '../components/BentoMaker/BentoMaker';
import { ChefHat } from 'lucide-react';

export default function BentoPage() {
  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 fade-in">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center">
            <ChefHat size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Bento Maker</h1>
            <p className="text-slate-500 text-sm">Calcula costos y diseña nuevos menús</p>
          </div>
        </div>
      </div>

      <BentoMaker />
      
      <p className="mt-8 text-center text-xs text-slate-400 font-medium">
        Recuerda añadir todos los ingredientes para un cálculo preciso del margen bruto (Objetivo: &gt;70%)
      </p>
    </div>
  );
}
