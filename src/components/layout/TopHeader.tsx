import React, { useState, useRef, useEffect } from 'react';
import {
  User,
  Database,
  LogOut,
  ShieldCheck,
  Sparkles,
  Trash2,
  ChevronDown,
} from 'lucide-react';
import type { NavModuleId, UserRole } from '../../types/todoservicio';
import { useTodoservicio } from '../../services/dataStore';

interface TopHeaderProps {
  activeModule: NavModuleId;
  onOpenSupabaseModal: () => void;
  onNavigate: (module: NavModuleId, subTab?: string) => void;
}

const MODULE_TITLES: Record<NavModuleId, string> = {
  dashboard: 'Panel de Control',
  clients: 'Clientes y Sedes',
  calendar: 'Calendario Operativo',
  gps: 'Control de Limpieza & GPS',
  'work-orders': 'Órdenes de Trabajo (OT)',
  staff: 'Personal y Legajo Digital',
  bulletin: 'Cartelera Digital',
  catalog: 'Catálogo de Servicios',
  reports: 'Reportes y Exportación',
};

const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrador General',
  supervisor: 'Supervisor Operativo',
  tecnico: 'Técnico de Campo',
  limpieza: 'Funcionaria de Limpieza',
  cliente: 'Portal Cliente',
};

export const TopHeader: React.FC<TopHeaderProps> = ({
  activeModule,
  onOpenSupabaseModal,
  onNavigate,
}) => {
  const {
    state,
    session,
    realtimeMode,
    logout,
    switchRolePreview,
    loadUruguayDemoData,
    clearAllData,
  } = useTodoservicio();

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const pendingApprovalsCount = state.approvals.filter((a) => a.status === 'pendiente').length;
  const isEmptyDatabase =
    state.companies.length === 0 &&
    state.staff.length === 0 &&
    state.workOrders.length === 0 &&
    state.assignments.length === 0;

  useEffect(() => {
    const handleClickOutside = (ev: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(ev.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="no-print h-[68px] px-7 bg-transparent flex items-center justify-between gap-6 shrink-0">
      {/* Left: Page Title */}
      <div className="min-w-0 flex items-center gap-4">
        <h1 className="font-display text-[22px] font-bold text-[#0D284E] tracking-tight truncate">
          {MODULE_TITLES[activeModule]}
        </h1>
      </div>

      {/* Right: Operational Controls & Profile */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Optional Quick Test Data Toggle so empty-by-default DB can be populated/cleared on demand */}
        {isEmptyDatabase ? (
          <button
            type="button"
            onClick={loadUruguayDemoData}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium text-[#1E4B82] bg-white border border-slate-200 hover:border-[#1E4B82]/40 hover:bg-[#1E4B82]/5 transition-colors whitespace-nowrap shrink-0 cursor-pointer shadow-2xs"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Cargar escenario Uruguay
          </button>
        ) : (
          <button
            type="button"
            onClick={clearAllData}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-500 bg-white border border-slate-200 hover:text-red-600 hover:border-red-200 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            title="Restablecer todas las tablas vacías"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Vaciar registros
          </button>
        )}

        {/* Supabase / Realtime Config Trigger */}
        <button
          type="button"
          onClick={onOpenSupabaseModal}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium text-[#0D284E] bg-white border border-slate-200 hover:border-[#1E4B82]/40 transition-colors whitespace-nowrap shrink-0 cursor-pointer shadow-2xs"
        >
          <Database className="w-3.5 h-3.5 text-[#1E4B82]" />
          <span>{realtimeMode === 'supabase' ? 'Supabase Activo' : 'Backend & RLS'}</span>
        </button>

        {/* User Profile Avatar & Menu (Matches reference top-right avatar) */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            className="relative flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-full bg-white border border-slate-200/90 hover:border-[#1E4B82]/40 shadow-2xs transition-colors cursor-pointer"
          >
            <div className="relative w-8 h-8 rounded-full bg-[#0D284E]/10 text-[#0D284E] flex items-center justify-center font-display font-bold text-xs">
              <User className="w-4 h-4" />
              {pendingApprovalsCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-red-500 ring-2 ring-white" />
              )}
            </div>
            <div className="text-left hidden xl:block leading-tight">
              <div className="text-xs font-semibold text-[#0D284E] whitespace-nowrap">
                {session?.username ?? 'MateoD'}
              </div>
              <div className="text-[11px] text-slate-500 whitespace-nowrap">
                {ROLE_LABELS[session?.role ?? 'admin']}
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl border border-slate-200 shadow-xl py-2 z-50">
              <div className="px-4 py-2.5 border-b border-slate-100">
                <p className="text-sm font-semibold text-[#0D284E]">{session?.fullName ?? 'Mateo Dámele'}</p>
                <p className="text-xs text-slate-500 truncate">{session?.email}</p>
              </div>

              {/* RBAC Role Switcher */}
              <div className="px-4 py-2.5 border-b border-slate-100">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 mb-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#1E4B82]" />
                  <span>Vista RBAC (Control de Rol)</span>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {(['admin', 'supervisor', 'tecnico', 'limpieza', 'cliente'] as UserRole[]).map((role) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => switchRolePreview(role)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-medium text-left transition-colors cursor-pointer ${
                        session?.role === role
                          ? 'bg-[#0D284E] text-white'
                          : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {role.charAt(0).toUpperCase() + role.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {pendingApprovalsCount > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onNavigate('gps', 'marcas');
                  }}
                  className="w-full px-4 py-2 text-left text-xs text-amber-700 hover:bg-amber-50 flex items-center justify-between cursor-pointer"
                >
                  <span>Solicitudes pendientes</span>
                  <span className="font-mono-tabular font-semibold">{pendingApprovalsCount}</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onOpenSupabaseModal();
                }}
                className="w-full px-4 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-2 cursor-pointer"
              >
                <Database className="w-3.5 h-3.5 text-[#1E4B82]" />
                Configuración Supabase y SQL RLS
              </button>

              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  logout();
                }}
                className="w-full px-4 py-2 text-left text-xs text-red-600 hover:bg-red-50 flex items-center gap-2 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
