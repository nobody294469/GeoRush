import React from 'react';
import { Keyboard, X, Compass, MapPin, Navigation, BookOpen } from 'lucide-react';

interface ShortcutsLegendProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShortcutsLegend: React.FC<ShortcutsLegendProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const shortcuts = [
    {
      key: 'Space',
      description: 'Submit Guess (when pin placed) OR Advance to Next Round',
      category: 'Gameplay'
    },
    {
      key: 'C  /  R',
      description: 'Reset Camera Point of View (Return to start heading & pitch)',
      category: 'Camera'
    },
    {
      key: 'M  /  Tab',
      description: 'Toggle / Expand / Collapse Guess Map',
      category: 'Map'
    },
    {
      key: 'Esc',
      description: 'Clear placed pin / Close active modal overlays',
      category: 'General'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-5 text-left"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center">
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">Keyboard Shortcuts</h3>
              <p className="text-xs text-slate-500">Pro shortcuts for competitive speed</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
          {shortcuts.map((sc, idx) => (
            <div key={idx} className="p-3.5 flex items-center justify-between bg-white hover:bg-slate-50 transition-colors gap-3">
              <span className="text-xs font-medium text-slate-700">{sc.description}</span>
              <kbd className="px-2.5 py-1 rounded bg-slate-100 border border-slate-300 text-slate-900 font-mono font-bold text-xs shrink-0 shadow-2xs">
                {sc.key}
              </kbd>
            </div>
          ))}
        </div>

        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
        >
          Got It
        </button>
      </div>
    </div>
  );
};
