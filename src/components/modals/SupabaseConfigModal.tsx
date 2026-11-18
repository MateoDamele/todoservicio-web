import React, { useState } from 'react';
import { X, Copy, Check, Download, Database, ShieldCheck, Radio } from 'lucide-react';
import { SUPABASE_SQL_SCHEMA } from '../../services/supabaseSchema';
import { getSavedSupabaseConfig, saveSupabaseConfig } from '../../services/supabaseClient';
import { useTodoservicio } from '../../services/dataStore';

interface SupabaseConfigModalProps {
  open: boolean;
  onClose: () => void;
}

export const SupabaseConfigModal: React.FC<SupabaseConfigModalProps> = ({ open, onClose }) => {
  const { realtimeMode, lastSyncAt } = useTodoservicio();
  const initial = getSavedSupabaseConfig();

  const [url, setUrl] = useState(initial.url);
  const [anonKey, setAnonKey] = useState(initial.anonKey);
  const [enabled, setEnabled] = useState(initial.enabled);
  const [activeTab, setActiveTab] = useState<'conexion' | 'sql'>('conexion');
  const [copied, setCopied] = useState(false);
  const [savedFeedback, setSavedFeedback] = useState(false);

  if (!open) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveSupabaseConfig({ url: url.trim(), anonKey: anonKey.trim(), enabled: Boolean(enabled && url.trim() && anonKey.trim()) });
    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 2500);
  };

  const handleCopySql = async () => {
    await navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadSql = () => {
    const blob = new Blob([SUPABASE_SQL_SCHEMA], { type: 'text/sql;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'todoservicio_supabase_rls.sql';
    link.click();
    URL.revokeObjectURL(link.href);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0D284E]/45 backdrop-blur-xs flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-3xl max-h-[88vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#0D284E]/10 text-[#0D284E] flex items-center justify-center">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display text-base font-bold text-[#0D284E]">
                Arquitectura Compartida Supabase + RLS + Realtime
              </h2>
              <p className="text-xs text-slate-500">
                Sincronización instantánea entre Panel Web y Apps Móviles (Técnicos, Limpieza y Clientes)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="px-6 pt-3 border-b border-slate-100 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('conexion')}
            className={`px-4 py-2 text-xs font-semibold rounded-t-lg border-b-2 transition-colors cursor-pointer ${
              activeTab === 'conexion'
                ? 'border-[#0D284E] text-[#0D284E]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Credenciales y Estado Realtime
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('sql')}
            className={`px-4 py-2 text-xs font-semibold rounded-t-lg border-b-2 transition-colors cursor-pointer ${
              activeTab === 'sql'
                ? 'border-[#0D284E] text-[#0D284E]'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Esquema SQL + Políticas RLS
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {activeTab === 'conexion' ? (
            <form onSubmit={handleSave} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-xl bg-[#F4F7FA] border border-slate-200/70">
                <div className="flex items-start gap-3">
                  <Radio className="w-4 h-4 text-[#1E4B82] mt-0.5 shrink-0" />
                  <div>
                    <div className="text-xs font-semibold text-[#0D284E]">Modo de Sincronización</div>
                    <div className="text-xs text-slate-600 mt-0.5">
                      {realtimeMode === 'supabase'
                        ? 'Conectado a Supabase Realtime (PostgreSQL)'
                        : 'Canal Broadcast Reactivo Local (Multi-pestaña)'}
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                  <div>
                    <div className="text-xs font-semibold text-[#0D284E]">Última sincronización</div>
                    <div className="text-xs font-mono-tabular text-slate-600 mt-0.5">
                      {new Date(lastSyncAt).toLocaleTimeString('es-UY')}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Supabase Project URL (VITE_SUPABASE_URL)
                </label>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://tu-proyecto.supabase.co"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-mono-tabular text-[#0D284E] focus:outline-none focus:border-[#1E4B82]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Supabase Anon Public Key (VITE_SUPABASE_ANON_KEY)
                </label>
                <input
                  type="password"
                  value={anonKey}
                  onChange={(e) => setAnonKey(e.target.value)}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-mono-tabular text-[#0D284E] focus:outline-none focus:border-[#1E4B82]"
                />
              </div>

              <label className="flex items-center gap-2.5 text-xs font-medium text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={(e) => setEnabled(e.target.checked)}
                  className="rounded border-slate-300 text-[#0D284E]"
                />
                Activar cliente Supabase SDK en tiempo real cuando haya credenciales válidas
              </label>

              <div className="flex items-center justify-end gap-3 pt-2">
                {savedFeedback && (
                  <span className="text-xs font-medium text-emerald-600">
                    Configuración guardada correctamente
                  </span>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cerrar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#0D284E] hover:bg-[#1E4B82] text-white text-xs font-semibold transition-colors cursor-pointer"
                >
                  Guardar conexión
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-600">
                  Ejecutá este script en el SQL Editor de tu proyecto Supabase para habilitar tablas, secuencia OT-0001, RLS por rol y publicación Realtime.
                </p>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={handleCopySql}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-[#0D284E] hover:bg-slate-50 cursor-pointer"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'Copiado' : 'Copiar SQL'}
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadSql}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0D284E] text-white text-xs font-semibold hover:bg-[#1E4B82] cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Descargar .sql
                  </button>
                </div>
              </div>
              <pre className="p-4 rounded-xl bg-slate-950 text-slate-100 text-[11.5px] font-mono-tabular overflow-x-auto max-h-[380px] leading-relaxed">
                {SUPABASE_SQL_SCHEMA}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
