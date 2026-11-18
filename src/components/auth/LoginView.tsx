import React, { useState } from 'react';
import { Lock, User, ShieldCheck, ArrowRight } from 'lucide-react';
import { useTodoservicio } from '../../services/dataStore';
import type { UserRole } from '../../types/todoservicio';

export const LoginView: React.FC = () => {
  const { login } = useTodoservicio();
  const [username, setUsername] = useState('MateoD');
  const [password, setPassword] = useState('••••••••••••');
  const [role, setRole] = useState<UserRole>('admin');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setError('Ingresá tu usuario corporativo.');
      return;
    }
    login(username, role);
  };

  return (
    <div className="min-h-screen bg-[#F4F7FA] flex items-center justify-center p-8">
      <div className="w-full max-w-[980px] bg-white rounded-2xl border border-slate-200/80 shadow-[0_12px_40px_-12px_rgba(13,40,78,0.12)] overflow-hidden grid grid-cols-1 lg:grid-cols-12">
        {/* Left Brand Panel */}
        <div className="lg:col-span-5 bg-[#0D284E] p-10 text-white flex flex-col justify-between">
          <div>
            <div className="w-full max-w-[230px] mb-10">
              <img
                src="/assets/aistudio/Todoservicio_Logo_HD_e9dd8432.png"
                alt="Todoservicio"
                referrerPolicy="no-referrer"
                className="w-full h-auto object-contain"
              />
            </div>
            <h2 className="font-display text-2xl font-bold leading-snug text-white">
              Gestión Operativa y RR.HH. Centralizada
            </h2>
            <p className="mt-3 text-sm text-white/75 leading-relaxed">
              Control de cuadrillas técnicas, servicios de limpieza, geocercas en vivo y órdenes de trabajo correlativas para Montevideo y Canelones.
            </p>
          </div>

          <div className="pt-8 border-t border-white/15 space-y-2 text-xs text-white/75">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Autenticación RBAC · Supabase RLS Ready</span>
            </div>
            <div>Cobertura operativa: Montevideo &amp; Canelones, Uruguay</div>
          </div>
        </div>

        {/* Right Form Panel */}
        <div className="lg:col-span-7 p-10 flex flex-col justify-center">
          <div className="mb-8">
            <h1 className="font-display text-2xl font-bold text-[#0D284E]">Iniciar sesión</h1>
            <p className="text-sm text-slate-500 mt-1">
              Ingresá con tus credenciales institucionales para acceder al panel web.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Usuario / Identificador
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setError('');
                  }}
                  placeholder="MateoD"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm text-[#0D284E] focus:outline-none focus:border-[#1E4B82] focus:ring-2 focus:ring-[#1E4B82]/15"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm text-[#0D284E] focus:outline-none focus:border-[#1E4B82] focus:ring-2 focus:ring-[#1E4B82]/15"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Perfil de Acceso (RBAC)
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-[#0D284E] bg-white focus:outline-none focus:border-[#1E4B82]"
              >
                <option value="admin">Administrador General (MateoD)</option>
                <option value="supervisor">Supervisor Operativo</option>
                <option value="tecnico">Técnico de Mantenimiento</option>
                <option value="limpieza">Funcionaria de Limpieza</option>
                <option value="cliente">Cliente Corporativo</option>
              </select>
            </div>

            {error && <p className="text-xs text-red-600 font-medium">{error}</p>}

            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#0D284E] hover:bg-[#1E4B82] text-white text-sm font-semibold transition-colors cursor-pointer shadow-sm"
            >
              <span>Acceder al Panel Central</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
