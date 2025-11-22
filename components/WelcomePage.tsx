
import React from 'react';
import { Sparkles, LayoutGrid } from 'lucide-react';

interface WelcomePageProps {
  onStartConfig: () => void;
}

const WelcomePage: React.FC<WelcomePageProps> = ({ onStartConfig }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-160px)] text-center px-4">
      <div className="bg-blue-600 p-4 rounded-full mb-6 shadow-xl animate-scale-in">
        <LayoutGrid className="w-16 h-16 text-white" />
      </div>
      <h2 className="text-5xl font-extrabold text-white mb-4 animate-fade-in-up">
        Welcome to BoothGen AI
      </h2>
      <p className="text-xl text-slate-300 max-w-2xl mb-8 animate-fade-in-up delay-100">
        Generate professional and innovative exhibition booth concepts instantly with the power of Gemini AI.
        From detailed layouts to aesthetic visualizations, bring your trade show vision to life.
      </p>
      <button
        onClick={onStartConfig}
        className="flex items-center space-x-3 px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-lg font-bold rounded-full shadow-lg hover:from-blue-500 hover:to-indigo-500 hover:shadow-blue-500/50 transition-all duration-300 ease-in-out transform hover:scale-105 animate-bounce-once delay-200"
      >
        <Sparkles className="w-6 h-6" />
        <span>Start Designing Your Booth</span>
      </button>

      <div className="mt-12 text-slate-500 text-sm animate-fade-in-up delay-300">
        <p>Your creative journey begins here.</p>
      </div>
    </div>
  );
};

export default WelcomePage;
