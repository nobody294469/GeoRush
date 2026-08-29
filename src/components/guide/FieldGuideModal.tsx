import React, { useState, useMemo } from 'react';
import { 
  FIELD_GUIDE_ENTRIES, 
  DRIVING_SIDE_INFO, 
  GuideEntry 
} from '../../data/fieldGuideData';
import { 
  BookOpen, 
  X, 
  Search, 
  Navigation, 
  Car, 
  ShieldAlert, 
  FileText, 
  Tag 
} from 'lucide-react';

interface FieldGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type GuideTab = 'all' | 'driving' | 'bollards' | 'scripts' | 'plates' | 'camera_meta' | 'landscapes';

export const FieldGuideModal: React.FC<FieldGuideModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<GuideTab>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredEntries = useMemo(() => {
    return FIELD_GUIDE_ENTRIES.filter(entry => {
      const matchesTab = activeTab === 'all' || entry.category === activeTab;
      if (!matchesTab) return false;

      if (!searchQuery.trim()) return true;
      const query = searchQuery.toLowerCase();
      return (
        entry.title.toLowerCase().includes(query) ||
        entry.subtitle.toLowerCase().includes(query) ||
        entry.countryOrRegion.toLowerCase().includes(query) ||
        entry.keyRule.toLowerCase().includes(query) ||
        entry.visualClue.toLowerCase().includes(query) ||
        entry.tags.some(tag => tag.toLowerCase().includes(query))
      );
    });
  }, [activeTab, searchQuery]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-150">
      <div 
        className="bg-white border border-slate-200 rounded-3xl w-full max-w-4xl max-h-[90vh] shadow-2xl flex flex-col overflow-hidden text-left text-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 border border-emerald-200 flex items-center justify-center shadow-xs">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <span>Explorer Field Guide</span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                  META ALMANAC
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Essential road meta, driving sides, bollards, scripts, and camera clues to pinpoint locations.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-2xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            title="Close (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Tabs Controls */}
        <div className="p-4 sm:p-6 border-b border-slate-100 bg-white space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search clues, countries, scripts, bollards (e.g. 'Japan', 'Cyrillic', 'Yellow plate', 'Kenya')..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-12 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 text-xs focus:outline-none focus:ring-1 focus:ring-emerald-600 focus:border-emerald-600 transition-all font-medium"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500 hover:text-slate-900 cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-bold scrollbar-none">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-xl transition-all shrink-0 cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              All Clues ({FIELD_GUIDE_ENTRIES.length})
            </button>
            <button
              onClick={() => setActiveTab('driving')}
              className={`px-3 py-1.5 rounded-xl transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'driving'
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              <Navigation className="w-3.5 h-3.5 text-emerald-700" /> Driving Sides
            </button>
            <button
              onClick={() => setActiveTab('bollards')}
              className={`px-3 py-1.5 rounded-xl transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'bollards'
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5 text-amber-600" /> Bollards & Posts
            </button>
            <button
              onClick={() => setActiveTab('scripts')}
              className={`px-3 py-1.5 rounded-xl transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'scripts'
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-sky-600" /> Alphabets & Scripts
            </button>
            <button
              onClick={() => setActiveTab('plates')}
              className={`px-3 py-1.5 rounded-xl transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'plates'
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              <Tag className="w-3.5 h-3.5 text-indigo-600" /> License Plates
            </button>
            <button
              onClick={() => setActiveTab('camera_meta')}
              className={`px-3 py-1.5 rounded-xl transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'camera_meta'
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200 border border-slate-200'
              }`}
            >
              <Car className="w-3.5 h-3.5 text-teal-600" /> Car & Camera Meta
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          
          {/* Special Section: Driving Sides Overview */}
          {(activeTab === 'driving' || (activeTab === 'all' && !searchQuery)) && (
            <div className="space-y-4">
              <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 text-slate-800 space-y-3 shadow-xs">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 border border-amber-200 font-bold text-xs">
                    RULE OF THUMB
                  </span>
                  <h4 className="text-sm font-black text-amber-900">Left-Hand Traffic (Drive on LEFT)</h4>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Only ~75 countries drive on the left side of the road. If oncoming traffic is on the right or you see driver seats on the right, you are in one of these key clusters:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  {DRIVING_SIDE_INFO.leftDriving.map((item, idx) => (
                    <div key={idx} className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900">{item.country}</span>
                        <span className="text-sm">{item.flag}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-relaxed">{item.note}</p>
                    </div>
                  ))}
                </div>

                <div className="pt-2 text-[11px] text-amber-800 italic">
                  💡 {DRIVING_SIDE_INFO.rightDrivingNote}
                </div>
              </div>
            </div>
          )}

          {/* Clues Card Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredEntries.map((entry) => (
              <div 
                key={entry.id}
                className="p-5 rounded-2xl border border-slate-200 bg-slate-50 hover:border-emerald-300 shadow-xs transition-all space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-600">{entry.countryOrRegion}</span>
                        {entry.flag && <span className="text-sm">{entry.flag}</span>}
                      </div>
                      <h4 className="text-base font-black text-emerald-700">{entry.title}</h4>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-white text-slate-500 border border-slate-200 shadow-xs">
                      {entry.category.replace('_', ' ')}
                    </span>
                  </div>

                  <p className="text-xs font-medium text-slate-500 italic">{entry.subtitle}</p>

                  <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-1.5 text-xs text-slate-700 shadow-xs">
                    <div className="font-bold text-slate-900 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                      <span>Identification Rule:</span>
                    </div>
                    <p className="leading-relaxed whitespace-pre-line pl-3 text-slate-600 font-normal">
                      {entry.keyRule}
                    </p>
                  </div>

                  <div className="text-xs text-slate-600 pl-1">
                    <span className="font-bold text-slate-800">Visual Context: </span>
                    <span>{entry.visualClue}</span>
                  </div>
                </div>

                {/* Tags Footer */}
                <div className="pt-2 border-t border-slate-200 flex items-center gap-1.5 flex-wrap">
                  {entry.tags.map((tag, tIdx) => (
                    <span 
                      key={tIdx} 
                      className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-500 text-[10px] font-mono font-medium shadow-xs"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {filteredEntries.length === 0 && (
            <div className="p-12 text-center space-y-2 bg-slate-50 rounded-2xl border border-slate-200">
              <Search className="w-8 h-8 text-slate-400 mx-auto" />
              <h4 className="text-sm font-bold text-slate-800">No matching clues found</h4>
              <p className="text-xs text-slate-500">
                Try searching for a different country, script name, or keyword.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span>Explorer Field Guide • Geography Reference & Meta Almanac</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider transition-colors cursor-pointer shadow-md shadow-emerald-600/20"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
