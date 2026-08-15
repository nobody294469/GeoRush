import React, { useState, useMemo } from 'react';
import { Search, Check } from 'lucide-react';
import { getCountryList, CountryOption } from '../../data/countryList';

interface CountrySelectorProps {
  onSelectCountry: (code: string, name: string) => void;
  selectedCountryCode?: string | null;
  disabled?: boolean;
}

export const CountrySelector: React.FC<CountrySelectorProps> = ({
  onSelectCountry,
  selectedCountryCode,
  disabled = false
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const countries = useMemo(() => getCountryList(), []);

  const filteredCountries = useMemo(() => {
    if (!searchTerm.trim()) return countries;
    const lower = searchTerm.trim().toLowerCase();
    return countries.filter(
      c => c.name.toLowerCase().includes(lower) || c.code.toLowerCase().includes(lower)
    );
  }, [countries, searchTerm]);

  return (
    <div className="w-full max-w-md bg-slate-900/90 border border-slate-700/80 rounded-xl p-3 shadow-2xl backdrop-blur-md text-white">
      <div className="relative mb-2">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search country..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          disabled={disabled}
          className="w-full bg-slate-800/90 border border-slate-700 text-white text-sm rounded-lg pl-9 pr-3 py-2 focus:outline-none focus:border-indigo-500 placeholder-slate-400 transition-colors"
        />
      </div>

      <div className="max-h-56 overflow-y-auto space-y-1 custom-scrollbar pr-1">
        {filteredCountries.length === 0 ? (
          <div className="text-center py-4 text-sm text-slate-400">
            No countries found matching "{searchTerm}"
          </div>
        ) : (
          filteredCountries.map(country => {
            const isSelected = selectedCountryCode === country.code;
            return (
              <button
                key={country.code}
                type="button"
                onClick={() => onSelectCountry(country.code, country.name)}
                disabled={disabled}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm text-left transition-colors ${
                  isSelected
                    ? 'bg-indigo-600 text-white font-medium shadow-sm'
                    : 'bg-slate-800/40 hover:bg-slate-800 text-slate-200'
                }`}
              >
                <div className="flex items-center space-x-2.5 truncate">
                  <span className="text-base leading-none">{country.flagEmoji}</span>
                  <span className="truncate">{country.name}</span>
                  <span className="text-xs text-slate-400 font-mono">({country.code})</span>
                </div>
                {isSelected && <Check className="w-4 h-4 text-white flex-shrink-0" />}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};
