import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { 
  Sparkles, 
  MapPin, 
  Activity, 
  Pill, 
  AlertOctagon, 
  RefreshCw, 
  TrendingUp, 
  ShieldAlert,
  ChevronRight,
  BookOpen
} from 'lucide-react';

interface OutbreakAlert {
  disease: string;
  severity: 'high' | 'medium' | 'low';
  region: string;
  description: string;
}

interface RecommendedMed {
  category: string;
  medicines: string;
  rationale: string;
}

interface ForecastAIResponse {
  isCachedFallback?: boolean;
  outbreakAlerts: OutbreakAlert[];
  forecastingSuggestions: string[];
  recommendedMeds: RecommendedMed[];
}

interface AIEpidemiologicalAlertPanelProps {
  user: UserProfile;
}

export default function AIEpidemiologicalAlertPanel({ user }: AIEpidemiologicalAlertPanelProps) {
  const [data, setData] = useState<ForecastAIResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const country = user.country || 'Ethiopia';

  const fetchAIForecast = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/gemini/forecast', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ country }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to retrieve AI recommendations.');
      }

      const jsonData = await res.json();
      setData(jsonData);
    } catch (err: any) {
      console.error('[AIEpidemicAlert] Error fetching forecast:', err);
      setError(err?.message || 'Could not load outbreak forecast. Verify server connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAIForecast();
  }, [country]);

  return (
    <div className="bg-slate-50 dark:bg-slate-950/40 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 space-y-6">
      {/* Panel Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30">
            <Sparkles size={11} className={loading ? 'animate-spin' : ''} />
            {data?.isCachedFallback ? 'Offline Expert Simulation Mode' : 'Live Gemini Flash Forecast'}
          </div>
          <h2 className="text-lg font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            Country Epidemic Risk & Smart Stock Forecaster
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Dynamic health insights and preventative clinical stocking guidelines curated specifically for{' '}
            <span className="font-bold text-slate-700 dark:text-slate-300 inline-flex items-center gap-1">
              <MapPin size={12} className="text-red-500" /> {country}
            </span>.
          </p>
        </div>
        <button
          onClick={fetchAIForecast}
          disabled={loading}
          className="self-start sm:self-center inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 transition-all cursor-pointer disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          {loading ? 'Consulting Gemini...' : 'Analyze Country Data'}
        </button>
      </div>

      {loading && (
        <div className="py-12 flex flex-col items-center justify-center space-y-3">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <div className="text-center">
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Synthesizing local seasonal data...</p>
            <p className="text-[10px] text-slate-400">Querying disease tracking metrics for {country}</p>
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertOctagon className="text-red-500 shrink-0" size={20} />
            <div>
              <p className="text-xs font-bold text-red-600 dark:text-red-400">Failed to consult AI forecaster</p>
              <p className="text-[10px] text-red-500/80 dark:text-red-400/80">{error}</p>
            </div>
          </div>
          <button
            onClick={fetchAIForecast}
            className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-[11px] font-bold transition-all cursor-pointer"
          >
            Retry Call
          </button>
        </div>
      )}

      {!loading && !error && data && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Section 1: Active Outbreak Threats (5 columns) */}
          <div className="lg:col-span-5 space-y-4">
            <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
              <ShieldAlert size={14} className="text-red-500" /> Active Outbreak Alerts
            </h3>
            <div className="space-y-3">
              {data.outbreakAlerts?.map((alert, idx) => (
                <div 
                  key={idx} 
                  className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 p-4 rounded-2xl shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-all space-y-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Activity size={13} className="text-indigo-500" /> {alert.disease}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                      alert.severity === 'high' 
                        ? 'bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400' 
                        : alert.severity === 'medium'
                        ? 'bg-amber-50 text-amber-600 dark:bg-amber-955/20 dark:text-amber-400'
                        : 'bg-blue-50 text-blue-600 dark:bg-blue-955/20 dark:text-blue-400'
                    }`}>
                      {alert.severity} Risk
                    </span>
                  </div>
                  <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold flex items-center gap-1">
                    <MapPin size={10} /> Zone: {alert.region}
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                    {alert.description}
                  </p>
                </div>
              ))}
              {(!data.outbreakAlerts || data.outbreakAlerts.length === 0) && (
                <p className="text-[11px] text-slate-400 italic">No critical outbreaks tracked currently.</p>
              )}
            </div>
          </div>

          {/* Section 2: Stocking Recommendations (7 columns) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Recommended Medications */}
            <div className="space-y-3">
              <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                <Pill size={14} className="text-emerald-500" /> Recommended Preventative Supply Stocking
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {data.recommendedMeds?.map((med, idx) => (
                  <div 
                    key={idx} 
                    className="bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 p-4 rounded-2xl shadow-sm space-y-2"
                  >
                    <div>
                      <h4 className="font-bold text-xs text-slate-800 dark:text-slate-200">{med.category}</h4>
                      <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold mt-0.5">
                        {med.medicines}
                      </p>
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                      {med.rationale}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Smart Daily Logistics Strategy */}
            <div className="space-y-3 bg-white dark:bg-slate-900 p-4 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl">
              <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                <TrendingUp size={14} className="text-indigo-500" /> Operational Daily Advisory
              </h3>
              <ul className="space-y-2.5">
                {data.forecastingSuggestions?.map((tip, idx) => (
                  <li key={idx} className="flex gap-2.5 text-[10px] text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
                    <ChevronRight size={14} className="text-indigo-500 shrink-0 mt-0.5" />
                    <span>{tip}</span>
                  </li>
                ))}
                {(!data.forecastingSuggestions || data.forecastingSuggestions.length === 0) && (
                  <p className="text-[11px] text-slate-400 italic">No additional advisories recorded for today.</p>
                )}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
