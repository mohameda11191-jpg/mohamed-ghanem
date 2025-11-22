
import React from 'react';
import { LayoutGrid, Sparkles, History } from 'lucide-react';
import { PageName } from '../types';

interface HeaderProps {
  currentPage: PageName;
  onNavigate: (page: PageName) => void;
}

const Header: React.FC<HeaderProps> = ({ currentPage, onNavigate }) => {
  const navItemClass = (page: PageName) => 
    `flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
      currentPage === page
        ? 'bg-blue-600 text-white shadow-md'
        : 'text-slate-400 hover:text-white hover:bg-slate-700'
    }`;

  return (
    <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-blue-600 p-2 rounded-lg">
            <LayoutGrid className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">BoothGen AI</h1>
            <p className="text-xs text-slate-400">Powered by Gemini 2.5</p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => onNavigate(PageName.CONFIG)} 
            className={navItemClass(PageName.CONFIG)}
          >
            <Sparkles className="w-4 h-4" />
            <span>Configure New Design</span>
          </button>
          <button 
            onClick={() => onNavigate(PageName.HISTORY)} 
            className={navItemClass(PageName.HISTORY)}
          >
            <History className="w-4 h-4" />
            <span>Design History</span>
          </button>
          {/* <a href="#" className="text-sm text-slate-400 hover:text-white transition-colors">Documentation</a> */}
          {/* <button className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-full text-sm font-medium transition-colors border border-slate-700">
            <Sparkles className="w-4 h-4 text-yellow-400" />
            <span>Pro Features</span>
          </button> */}
        </div>
      </div>
    </header>
  );
};

export default Header;