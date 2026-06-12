/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  TrendingUp,
  RefreshCcw,
  Search,
  Sparkles,
  Info,
  SlidersHorizontal,
  Plus,
  Trash2,
  Check,
  AlertCircle
} from "lucide-react";
import { AssetPriceData } from "./types";

const INITIAL_SYMBOLS = ["DÓLAR", "BLOX", "HGLG11", "FVPQ11", "VISC11", "ITUSA", "SGOV"];

const ASSET_NAMES: Record<string, string> = {
  "DÓLAR": "Dólar Comercial (USD/BRL)",
  "BLOX": "Simplify Web3 ETF (BLOX)",
  "HGLG11": "CSHG Logística (HGLG11)",
  "FVPQ11": "FII Via Parque (FVPQ11)",
  "VISC11": "Vinci Shopping (VISC11)",
  "ITUSA": "Itaúsa S.A. (ITSA4)",
  "SGOV": "iShares 0-3 Mo Treasury ETF"
};

export default function App() {
  const [prices, setPrices] = useState<Record<string, AssetPriceData>>({});
  const [loading, setLoading] = useState(false);
  const [refreshSource, setRefreshSource] = useState<"simulator" | "gemini" | "">("");
  const [customTicker, setCustomTicker] = useState("");
  const [activeSymbols, setActiveSymbols] = useState<string[]>(() => {
    const saved = localStorage.getItem("activeSymbols");
    return saved ? JSON.parse(saved) : INITIAL_SYMBOLS;
  });
  const [tickerError, setTickerError] = useState("");

  useEffect(() => {
    triggerInitialSync();
  }, []);

  useEffect(() => {
    localStorage.setItem("activeSymbols", JSON.stringify(activeSymbols));
  }, [activeSymbols]);

  const fetchPrices = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/prices");
      const json = await res.json();
      if (json.success) {
        setPrices(json.data);
      }
    } catch (err) {
      console.error("Erro ao obter cotações do servidor:", err);
    } finally {
      setLoading(false);
    }
  };

  const triggerInitialSync = async () => {
    setLoading(true);
    try {
      const savedSymbols = localStorage.getItem("activeSymbols");
      const symbolsToSync = savedSymbols ? JSON.parse(savedSymbols) : INITIAL_SYMBOLS;

      const res = await fetch("/api/prices/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbols: symbolsToSync })
      });
      const json = await res.json();
      if (json.success) {
        setPrices(json.data);
      } else {
        fetchPrices();
      }
    } catch (err) {
      console.error("Erro na sincronização inicial de preços reais:", err);
      fetchPrices();
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/prices/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbols: activeSymbols })
      });
      const json = await res.json();
      if (json.success) {
        setPrices(json.data);
        setRefreshSource(json.source);
        setTimeout(() => setRefreshSource(""), 4000);
      }
    } catch (err) {
      console.error("Erro ao atualizar cotações:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCustomTicker = async (e: React.FormEvent) => {
    e.preventDefault();
    setTickerError("");
    const formatted = customTicker.trim().toUpperCase();
    
    if (!formatted) {
      setTickerError("Digite um código válido.");
      return;
    }
    
    if (activeSymbols.includes(formatted)) {
      setTickerError("Este ativo já está na lista.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/prices/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbols: [formatted] })
      });
      const json = await res.json();
      if (json.success) {
        setPrices(json.data);
        setActiveSymbols(prev => [...prev, formatted]);
        setCustomTicker("");
      }
    } catch (e) {
      setTickerError("Erro ao registrar papel.");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveTicker = (sym: string) => {
    setActiveSymbols(prev => prev.filter(s => s !== sym));
  };

  const handleResetDefaults = () => {
    setActiveSymbols(INITIAL_SYMBOLS);
    triggerInitialSync();
  };

  const renderAverageCell = (currentPrice: number | null | undefined, avgPrice: number | null | undefined, currency: 'BRL' | 'USD') => {
    if (currentPrice === null || currentPrice === undefined || avgPrice === null || avgPrice === undefined) {
      return <span className="text-gray-400 font-mono text-[11px]">-</span>;
    }
    const isUp = currentPrice >= avgPrice;
    const diffPercent = ((currentPrice - avgPrice) / avgPrice) * 100;
    const symbolSuffix = currency === "USD" ? "$" : "R$";

    return (
      <div className="flex flex-col items-center py-0.5">
        <span className={`font-mono font-bold text-[10.5px] px-1.5 py-0.5 rounded transition-all ${
          isUp 
            ? "text-emerald-700 bg-emerald-50/80 border border-emerald-100" 
            : "text-rose-700 bg-rose-50/80 border border-rose-100"
        }`}>
          {symbolSuffix} {avgPrice.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
        <span className={`text-[10px] sm:text-[10.5px] font-bold mt-0.5 flex items-center gap-0.5 ${
          isUp ? "text-emerald-600" : "text-rose-600"
        }`}>
          {isUp ? "▲ +" : "▼ "}{diffPercent.toFixed(1)}%
        </span>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50/60 text-gray-800 pb-4 antialiased flex flex-col justify-start">
      
      {/* Upper Navigation bar - Compact height */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-40 backdrop-blur-md bg-white/95">
        <div className="max-w-7xl mx-auto px-4 py-2 flex flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-gray-900 flex items-center justify-center text-white shrink-0">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-gray-900 tracking-tight flex items-center gap-1.5">
                Monitor de Ativos & Médias
                <span className="text-[9px] font-bold tracking-wider bg-emerald-500/10 text-emerald-600 uppercase px-1.5 py-0.2 rounded-md">
                  Google Real-time
                </span>
              </h1>
              <p className="text-[10.5px] text-gray-400 hidden sm:block">
                Comparativo real de preços atuais frente a médias históricas móveis.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleRefresh}
              disabled={loading}
              className={`px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-gray-700 hover:text-gray-900 hover:bg-gray-50 font-semibold text-[11px] flex items-center gap-1.5 transition-all cursor-pointer ${
                loading ? "opacity-60 cursor-not-allowed" : ""
              }`}
            >
              <RefreshCcw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
              {loading ? "Sincronizando..." : "Sincronizar via Google"}
            </button>
          </div>
        </div>
      </header>

      {/* Main dashboard element */}
      <main className="max-w-7xl mx-auto px-4 mt-2 flex-grow w-full space-y-2">
        
        {/* API Notification Bar for Gemini updates - Reduced padding */}
        <AnimatePresence>
          {refreshSource && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className={`p-2 rounded-xl border flex items-center justify-between text-[11px] font-semibold ${
                refreshSource === "gemini" 
                  ? "bg-indigo-50/90 border-indigo-100 text-indigo-800" 
                  : "bg-emerald-50/90 border-emerald-100 text-emerald-800"
              }`}
            >
              <div className="flex items-center gap-1.5">
                <Sparkles className={`w-3.5 h-3.5 shrink-0 ${refreshSource === "gemini" ? "text-indigo-600" : "text-emerald-600"}`} />
                <span>
                  {refreshSource === "gemini" 
                    ? "✨ Cotações reais obtidas em tempo real diretamente da pesquisa do Google via IA!" 
                    : "📈 Preços de mercado atualizados no simulador interno."}
                </span>
              </div>
              <button onClick={() => setRefreshSource("")} className="hover:underline text-[10px] ml-2 opacity-80 cursor-pointer text-gray-500">
                Fechar
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Real-Time Price Board Table Container */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[850px]">
              <thead>
                <tr className="bg-gray-50/70 border-b border-gray-100 text-gray-500 text-[10px] font-bold uppercase tracking-wider">
                  <th className="px-3 py-2">Papel / Ativo</th>
                  <th className="px-3 py-2 text-center bg-gray-50/70 w-32">Preço atual mercado</th>
                  <th className="px-3 py-2 text-center w-28">Méd. Semanal</th>
                  <th className="px-3 py-2 text-center w-28">Méd. Mensal</th>
                  <th className="px-3 py-2 text-center w-28">Méd. 3 Meses</th>
                  <th className="px-3 py-2 text-center w-28">Méd. 6 Meses</th>
                  <th className="px-3 py-2 text-center w-28">Méd. Anual (2026)</th>
                  <th className="px-3 py-2 text-right w-12"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {activeSymbols.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center">
                      <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                        <AlertCircle className="w-6 h-6 text-gray-300 mb-1" />
                        <h4 className="text-xs font-semibold text-gray-800">Nenhum papel no monitoramento</h4>
                        <p className="text-[11px] text-gray-400">
                          Utilize o campo de pesquisa no rodapé para adicionar um novo ativo.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  activeSymbols.map((sym) => {
                    const priceInfo = prices[sym.toUpperCase()];
                    const name = ASSET_NAMES[sym.toUpperCase()] || "Ativo sob Monitoramento Especial";
                    
                    const currencySymbol = priceInfo?.currency === "USD" ? "$" : "R$";
                    const hasValidPrice = priceInfo && priceInfo.currentPrice !== null && priceInfo.currentPrice !== undefined;

                    return (
                      <tr key={sym} className="hover:bg-gray-50/20 transition-colors">
                        
                        {/* Asset symbol details - Ultra compact padding */}
                        <td className="px-3 py-1">
                          <div className="flex items-center gap-2">
                            <div className="h-6.5 w-6.5 rounded-lg bg-gray-100 flex items-center justify-center font-mono text-[9px] font-bold text-gray-600 uppercase shrink-0">
                              {sym.slice(0, 4)}
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="font-bold text-gray-900 font-display text-xs uppercase leading-tight">
                                {sym}
                              </span>
                              <span className="text-[10px] text-gray-400 truncate max-w-[170px] leading-tight">
                                {name}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Current Market Price in Native Currency or empty if not found */}
                        <td className="px-3 py-1 text-center bg-gray-50/40 font-bold text-xs">
                          <span className="font-mono text-gray-900 block py-0.5">
                            {hasValidPrice 
                              ? `${currencySymbol} ${priceInfo.currentPrice?.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` 
                              : "-"
                            }
                          </span>
                        </td>

                        {/* Averages with requested Color Spec: Green if Current >= Average, else Red, or block if not found */}
                        <td className="px-3 py-1 text-center">
                          {renderAverageCell(priceInfo?.currentPrice, priceInfo?.avgWeek, priceInfo?.currency || 'BRL')}
                        </td>

                        <td className="px-3 py-1 text-center">
                          {renderAverageCell(priceInfo?.currentPrice, priceInfo?.avgMonth, priceInfo?.currency || 'BRL')}
                        </td>

                        <td className="px-3 py-1 text-center">
                          {renderAverageCell(priceInfo?.currentPrice, priceInfo?.avg3Months, priceInfo?.currency || 'BRL')}
                        </td>

                        <td className="px-3 py-1 text-center">
                          {renderAverageCell(priceInfo?.currentPrice, priceInfo?.avg6Months, priceInfo?.currency || 'BRL')}
                        </td>

                        <td className="px-3 py-1 text-center">
                          {renderAverageCell(priceInfo?.currentPrice, priceInfo?.avgYear, priceInfo?.currency || 'BRL')}
                        </td>

                        {/* Action controls */}
                        <td className="px-3 py-1 text-right">
                          <button
                            onClick={() => handleRemoveTicker(sym)}
                            className="p-1 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                            title="Remover papel"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>

                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add Ticker Section passed to the bottom of the page - Extremely Compact */}
        <div className="bg-white rounded-xl border border-gray-100 p-2 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
          <div className="text-[11px] text-gray-500 font-medium">
            <span>Adicione novos papéis para monitoramento com cotações em tempo real via Google.</span>
          </div>
          
          <form onSubmit={handleAddCustomTicker} className="flex items-center gap-1.5 w-full sm:w-auto shrink-0 justify-end">
            <div className="relative">
              <input
                type="text"
                placeholder="Ex de Ticket: PETR4"
                value={customTicker}
                onChange={(e) => setCustomTicker(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg bg-gray-50 border border-transparent focus:border-gray-200 focus:outline-hidden text-xs transition-all focus:bg-white uppercase font-mono tracking-wider w-36 text-gray-700"
              />
              {tickerError && (
                <span className="absolute left-0 -top-4 text-[9px] text-rose-500 font-semibold truncate bg-white px-1 leading-none shadow-xs border border-rose-50 rounded">
                  {tickerError}
                </span>
              )}
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="px-3 py-1.5 rounded-lg bg-gray-900 border border-transparent text-white hover:bg-gray-800 font-semibold text-xs flex items-center gap-1 transition-all cursor-pointer shrink-0"
            >
              <Plus className="w-3 h-3" />
              Adicionar Papel
            </button>

            <button
              type="button"
              onClick={handleResetDefaults}
              className="px-2 py-1.5 text-[11px] text-gray-400 hover:text-gray-900 font-semibold cursor-pointer shrink-0"
            >
              Resetar Padrão
            </button>
          </form>
        </div>

      </main>
    </div>
  );
}
