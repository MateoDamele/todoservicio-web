import React, { useMemo, useState } from 'react';
import {
  UserCheck,
  UserX,
  AlertTriangle,
  Wrench,
  CheckCircle2,
  MapPin,
  Calendar,
  Award,
  Star,
  ArrowRight,
  Check,
  X,
} from 'lucide-react';
import { useTodoservicio } from '../../services/dataStore';
import type { NavModuleId } from '../../types/todoservicio';

interface DashboardViewProps {
  onNavigate: (module: NavModuleId, subTab?: string) => void;
}

interface CircularRingProps {
  percent: number;
}

const CircularRing: React.FC<CircularRingProps> = ({ percent }) => {
  const clamped = Math.max(0, Math.min(100, Math.round(percent)));
  const size = 62;
  const strokeWidth = 5;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div className="relative w-[62px] h-[62px] shrink-0 flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="rgba(255, 255, 255, 0.28)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="#FFFFFF"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-500 ease-out"
        />
      </svg>
      <span className="absolute text-[13px] font-bold text-white tabular-nums">{clamped}%</span>
    </div>
  );
};

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate }) => {
  const { state, permissions, resolveApproval } = useTodoservicio();
  const [agendaDays, setAgendaDays] = useState<7 | 15 | 30>(15);

  const todayIso = new Date().toISOString().slice(0, 10);

  const kpis = useMemo(() => {
    const activeStaff = state.staff.filter((m) => m.active);
    const totalActiveStaff = activeStaff.length;

    const todayLogs = state.gpsLogs.filter((g) => g.timestamp.slice(0, 10) === todayIso);

    // Determine who is currently checked-in (last log today is 'entrada' and not rejected)
    const latestLogByStaff = new Map<string, (typeof todayLogs)[number]>();
    for (const log of [...todayLogs].sort((a, b) => a.timestamp.localeCompare(b.timestamp))) {
      if (log.approvalStatus !== 'rechazada') {
        latestLogByStaff.set(log.staffId, log);
      }
    }

    let onSiteCount = 0;
    latestLogByStaff.forEach((log) => {
      if (log.type === 'entrada') onSiteCount += 1;
    });

    const onSitePct = totalActiveStaff > 0 ? Math.round((onSiteCount / totalActiveStaff) * 100) : 0;

    // Scheduled today without check-in
    const scheduledTodayIds = new Set(
      state.assignments
        .filter((a) => a.date === todayIso && a.status !== 'cancelada')
        .map((a) => a.staffId)
    );
    let unmarkedCount = 0;
    scheduledTodayIds.forEach((staffId) => {
      if (!latestLogByStaff.has(staffId)) unmarkedCount += 1;
    });
    const unmarkedBase = scheduledTodayIds.size > 0 ? scheduledTodayIds.size : totalActiveStaff;
    const unmarkedPct = unmarkedBase > 0 ? Math.round((unmarkedCount / unmarkedBase) * 100) : 0;

    // Out of range / Late marks today
    const outOfRangeCount = todayLogs.filter((g) => g.outOfRange).length;
    const outOfRangePct = todayLogs.length > 0 ? Math.round((outOfRangeCount / todayLogs.length) * 100) : 0;

    // Work orders in progress today
    const inProgressOts = state.workOrders.filter((w) => w.status === 'en_curso').length;
    const activeOtPool = state.workOrders.filter((w) => w.status !== 'completada' || w.scheduledDate === todayIso).length;
    const inProgressPct = activeOtPool > 0 ? Math.round((inProgressOts / activeOtPool) * 100) : 0;

    return {
      onSiteCount,
      onSitePct,
      unmarkedCount,
      unmarkedPct,
      outOfRangeCount,
      outOfRangePct,
      inProgressOts,
      inProgressPct,
      latestLogByStaff,
    };
  }, [state.staff, state.gpsLogs, state.assignments, state.workOrders, todayIso]);

  const pendingApprovals = useMemo(
    () => state.approvals.filter((a) => a.status === 'pendiente'),
    [state.approvals]
  );

  const upcomingAssignments = useMemo(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const limit = new Date(start);
    limit.setDate(limit.getDate() + agendaDays);
    const startStr = start.toISOString().slice(0, 10);
    const limitStr = limit.toISOString().slice(0, 10);

    return state.assignments
      .filter((a) => a.date >= startStr && a.date <= limitStr && a.status !== 'cancelada')
      .sort((a, b) => `${a.date} ${a.startTime}`.localeCompare(`${b.date} ${b.startTime}`));
  }, [state.assignments, agendaDays]);

  const recentClosedOts = useMemo(
    () =>
      state.workOrders
        .filter((w) => w.status === 'completada')
        .sort((a, b) => (b.completedAt ?? b.createdAt).localeCompare(a.completedAt ?? a.createdAt))
        .slice(0, 6),
    [state.workOrders]
  );

  const fleetLogsToday = useMemo(
    () => Array.from(kpis.latestLogByStaff.values()),
    [kpis.latestLogByStaff]
  );

  const formatShortDate = (isoDate: string) => {
    const [y, m, d] = isoDate.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    return dt.toLocaleDateString('es-UY', { weekday: 'short', day: '2-digit', month: '2-digit' });
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Top Row: 4 Horizontal KPI Cards with Circular Progress Rings */}
      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        {/* KPI 1: Emerald */}
        <button
          type="button"
          onClick={() => onNavigate('gps', 'mapa')}
          className="text-left rounded-2xl bg-gradient-to-br from-[#10B981] to-[#059669] p-5 text-white shadow-[0_6px_18px_-6px_rgba(16,185,129,0.42)] hover:brightness-105 transition-all flex items-center justify-between gap-4 cursor-pointer"
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center shrink-0">
              <UserCheck className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <div className="text-[12.5px] font-medium text-white/90 truncate">
                Personal Activo / En Sitio
              </div>
              <div className="font-display text-[28px] font-bold leading-tight tabular-nums mt-0.5">
                {kpis.onSiteCount}
              </div>
            </div>
          </div>
          <CircularRing percent={kpis.onSitePct} />
        </button>

        {/* KPI 2: Soft Coral Red */}
        <button
          type="button"
          onClick={() => onNavigate('gps', 'marcas')}
          className="text-left rounded-2xl bg-gradient-to-br from-[#EF4444] to-[#DC2626] p-5 text-white shadow-[0_6px_18px_-6px_rgba(239,68,68,0.4)] hover:brightness-105 transition-all flex items-center justify-between gap-4 cursor-pointer"
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center shrink-0">
              <UserX className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <div className="text-[12.5px] font-medium text-white/90 truncate">
                Ausencias / Sin Marcar
              </div>
              <div className="font-display text-[28px] font-bold leading-tight tabular-nums mt-0.5">
                {kpis.unmarkedCount}
              </div>
            </div>
          </div>
          <CircularRing percent={kpis.unmarkedPct} />
        </button>

        {/* KPI 3: Amber */}
        <button
          type="button"
          onClick={() => onNavigate('gps', 'marcas')}
          className="text-left rounded-2xl bg-gradient-to-br from-[#F59E0B] to-[#D97706] p-5 text-white shadow-[0_6px_18px_-6px_rgba(245,158,11,0.42)] hover:brightness-105 transition-all flex items-center justify-between gap-4 cursor-pointer"
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <div className="text-[12.5px] font-medium text-white/90 truncate">
                Llegadas Tarde / Fuera de Rango
              </div>
              <div className="font-display text-[28px] font-bold leading-tight tabular-nums mt-0.5">
                {kpis.outOfRangeCount}
              </div>
            </div>
          </div>
          <CircularRing percent={kpis.outOfRangePct} />
        </button>

        {/* KPI 4: Indigo / Corporate Blue */}
        <button
          type="button"
          onClick={() => onNavigate('work-orders', 'todas')}
          className="text-left rounded-2xl bg-gradient-to-br from-[#3B82F6] to-[#1E4B82] p-5 text-white shadow-[0_6px_18px_-6px_rgba(30,75,130,0.42)] hover:brightness-105 transition-all flex items-center justify-between gap-4 cursor-pointer"
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center shrink-0">
              <Wrench className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <div className="text-[12.5px] font-medium text-white/90 truncate">
                Órdenes en Curso Hoy
              </div>
              <div className="font-display text-[28px] font-bold leading-tight tabular-nums mt-0.5">
                {kpis.inProgressOts}
              </div>
            </div>
          </div>
          <CircularRing percent={kpis.inProgressPct} />
        </button>
      </section>

      {/* Middle Operational Grid (2 Columns) */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Pendientes de Aprobación / Solicitudes */}
        <div className="bg-white rounded-2xl border border-slate-200/75 shadow-[0_2px_12px_-4px_rgba(13,40,78,0.06)] flex flex-col min-h-[290px]">
          <div className="px-6 py-4 flex items-center justify-between border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-[18px] h-[18px] text-[#0D284E]" />
              <h2 className="font-display text-[15px] font-semibold text-[#0D284E]">
                Pendientes de Aprobación / Solicitudes
              </h2>
            </div>
            {pendingApprovals.length > 0 && (
              <span className="text-xs font-mono-tabular font-semibold text-[#1E4B82]">
                {pendingApprovals.length} pendientes
              </span>
            )}
          </div>

          <div className="flex-1 px-6 py-5 flex flex-col justify-center">
            {pendingApprovals.length === 0 ? (
              <div className="py-10 flex flex-col items-center justify-center text-center">
                <div className="w-11 h-11 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <p className="text-sm font-medium text-slate-600">No hay solicitudes pendientes</p>
                <p className="text-xs text-slate-400 mt-1 max-w-xs">
                  Las solicitudes de clientes y marcas GPS manuales o fuera de rango aparecerán aquí para revisión.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {pendingApprovals.slice(0, 4).map((req) => (
                  <div key={req.id} className="py-3 first:pt-0 last:pb-0 flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#0D284E] truncate">{req.title}</p>
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{req.description}</p>
                      <p className="text-[11px] text-slate-400 mt-1">
                        {req.requestedBy} · {new Date(req.createdAt).toLocaleTimeString('es-UY', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    {permissions.canApproveGpsAndRequests && (
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => resolveApproval(req.id, 'aprobada')}
                          title="Aprobar"
                          className="p-2 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors cursor-pointer"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => resolveApproval(req.id, 'rechazada')}
                          title="Rechazar"
                          className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="px-6 py-3.5 border-t border-slate-100 flex justify-end">
            <button
              type="button"
              onClick={() => onNavigate('calendar')}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1E4B82] hover:text-[#0D284E] transition-colors cursor-pointer"
            >
              <span>Ver planificación</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right: Estado de Flota y Geocercas Hoy */}
        <div className="bg-white rounded-2xl border border-slate-200/75 shadow-[0_2px_12px_-4px_rgba(13,40,78,0.06)] flex flex-col min-h-[290px]">
          <div className="px-6 py-4 flex items-center justify-between border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <MapPin className="w-[18px] h-[18px] text-[#0D284E]" />
              <h2 className="font-display text-[15px] font-semibold text-[#0D284E]">
                Estado de Flota y Geocercas Hoy
              </h2>
            </div>
            {fleetLogsToday.length > 0 && (
              <span className="text-xs font-mono-tabular text-slate-500">
                {fleetLogsToday.length} activos hoy
              </span>
            )}
          </div>

          <div className="flex-1 px-6 py-5 flex flex-col justify-center">
            {fleetLogsToday.length === 0 ? (
              <div className="py-10 flex flex-col items-center justify-center text-center">
                <div className="w-11 h-11 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
                  <MapPin className="w-5 h-5" />
                </div>
                <p className="text-sm font-medium text-slate-600">
                  Sin marcas GPS registradas hoy
                </p>
                <p className="text-xs text-slate-400 mt-1 max-w-xs">
                  El resumen en vivo de técnicos en ruta y funcionarias en edificio aparecerá cuando registren entrada.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {fleetLogsToday.slice(0, 4).map((log) => {
                  const staffMember = state.staff.find((s) => s.id === log.staffId);
                  const site = state.sites.find((s) => s.id === log.siteId);
                  return (
                    <div key={log.id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-[#0D284E] truncate">
                            {staffMember?.fullName ?? 'Personal'}
                          </span>
                          <span className="text-xs text-slate-400">·</span>
                          <span className="text-xs text-slate-500 capitalize">
                            {staffMember?.category === 'limpieza' ? 'Limpieza en edificio' : 'Técnico en sitio'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 truncate mt-0.5">
                          {site?.name ?? 'Sede'} ({site?.department ?? 'UY'})
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <div
                          className={`text-xs font-semibold ${
                            log.outOfRange
                              ? 'text-amber-600'
                              : log.type === 'entrada'
                              ? 'text-emerald-600'
                              : 'text-slate-500'
                          }`}
                        >
                          {log.outOfRange
                            ? `⚠️ Fuera de rango (${log.distanceMeters}m)`
                            : log.type === 'entrada'
                            ? 'En geocerca'
                            : 'Salida marcada'}
                        </div>
                        <div className="text-[11px] font-mono-tabular text-slate-400 mt-0.5">
                          {new Date(log.timestamp).toLocaleTimeString('es-UY', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="px-6 py-3.5 border-t border-slate-100 flex justify-end">
            <button
              type="button"
              onClick={() => onNavigate('gps', 'mapa')}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#1E4B82] hover:text-[#0D284E] transition-colors cursor-pointer"
            >
              <span>Ver mapa en vivo</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* Bottom Tracking Grid (2 Columns) */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Agenda Próximos 15 Días */}
        <div className="bg-white rounded-2xl border border-slate-200/75 shadow-[0_2px_12px_-4px_rgba(13,40,78,0.06)] flex flex-col min-h-[260px]">
          <div className="px-6 py-4 flex items-center justify-between gap-4 border-b border-slate-100">
            <div className="flex items-center gap-2.5 min-w-0">
              <Calendar className="w-[18px] h-[18px] text-[#0D284E] shrink-0" />
              <div className="min-w-0">
                <h2 className="font-display text-[15px] font-semibold text-[#0D284E] truncate">
                  Agenda
                </h2>
                <p className="text-[11px] text-slate-400">Próximos {agendaDays} días</p>
              </div>
            </div>

            <select
              value={agendaDays}
              onChange={(e) => setAgendaDays(Number(e.target.value) as 7 | 15 | 30)}
              aria-label="Rango de días de agenda"
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-medium text-[#0D284E] bg-white focus:outline-none focus:border-[#1E4B82] cursor-pointer"
            >
              <option value={7}>7 días</option>
              <option value={15}>15 días</option>
              <option value={30}>30 días</option>
            </select>
          </div>

          <div className="flex-1 px-6 py-5 flex flex-col justify-center">
            {upcomingAssignments.length === 0 ? (
              <div className="py-8 flex flex-col items-center justify-center text-center">
                <div className="w-11 h-11 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
                  <Calendar className="w-5 h-5" />
                </div>
                <p className="text-sm font-medium text-slate-600">
                  No hay visitas programadas en los próximos {agendaDays} días
                </p>
                <button
                  type="button"
                  onClick={() => onNavigate('calendar')}
                  className="mt-3 text-xs font-semibold text-[#1E4B82] hover:text-[#0D284E] cursor-pointer"
                >
                  Programar visita en Calendario →
                </button>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {upcomingAssignments.slice(0, 5).map((item) => {
                  const company = state.companies.find((c) => c.id === item.companyId);
                  const site = state.sites.find((s) => s.id === item.siteId);
                  const staffMember = state.staff.find((s) => s.id === item.staffId);
                  const service = state.services.find((s) => s.id === item.serviceId);

                  return (
                    <div key={item.id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-16 shrink-0 text-left">
                          <div className="text-[11px] font-semibold text-[#1E4B82] capitalize">
                            {formatShortDate(item.date)}
                          </div>
                          <div className="text-[11px] font-mono-tabular text-slate-400">
                            {item.startTime}
                          </div>
                        </div>
                        <div className="min-w-0">
                          <div className="text-sm font-semibold text-[#0D284E] truncate">
                            {company?.name ?? 'Cliente'} — {site?.name ?? 'Sede'}
                          </div>
                          <div className="text-xs text-slate-500 truncate">
                            {staffMember?.fullName ?? 'Sin asignar'} · {service?.name ?? 'Servicio'}
                          </div>
                        </div>
                      </div>
                      <span className="text-[11px] font-medium text-slate-500 shrink-0 capitalize">
                        {item.status.replace('_', ' ')}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right: Últimas Órdenes Cerradas y Calificaciones */}
        <div className="bg-white rounded-2xl border border-slate-200/75 shadow-[0_2px_12px_-4px_rgba(13,40,78,0.06)] flex flex-col min-h-[260px]">
          <div className="px-6 py-4 flex items-center justify-between gap-4 border-b border-slate-100">
            <div className="flex items-center gap-2.5 min-w-0">
              <Award className="w-[18px] h-[18px] text-[#0D284E] shrink-0" />
              <div className="min-w-0">
                <h2 className="font-display text-[15px] font-semibold text-[#0D284E] truncate">
                  Últimas Órdenes Cerradas y Calificaciones
                </h2>
                <p className="text-[11px] text-slate-400">Órdenes firmadas y puntuadas</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onNavigate('work-orders', 'calificaciones')}
              className="text-xs font-semibold text-[#1E4B82] hover:text-[#0D284E] whitespace-nowrap cursor-pointer"
            >
              Ver todas →
            </button>
          </div>

          <div className="flex-1 px-6 py-5 flex flex-col justify-center">
            {recentClosedOts.length === 0 ? (
              <div className="py-8 flex flex-col items-center justify-center text-center">
                <div className="w-11 h-11 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
                  <Award className="w-5 h-5" />
                </div>
                <p className="text-sm font-medium text-slate-600">
                  Aún no hay órdenes cerradas y firmadas
                </p>
                <button
                  type="button"
                  onClick={() => onNavigate('work-orders', 'todas')}
                  className="mt-3 text-xs font-semibold text-[#1E4B82] hover:text-[#0D284E] cursor-pointer"
                >
                  Gestionar Órdenes de Trabajo →
                </button>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {recentClosedOts.map((ot) => {
                  const company = state.companies.find((c) => c.id === ot.companyId);
                  const site = state.sites.find((s) => s.id === ot.siteId);
                  const staffMember = state.staff.find((s) => s.id === ot.staffId);
                  const rating = ot.rating ?? 0;

                  return (
                    <div key={ot.id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono-tabular text-xs font-bold text-[#0D284E]">
                            {ot.code}
                          </span>
                          <span className="text-slate-300">·</span>
                          <span className="text-sm font-semibold text-slate-800 truncate">
                            {company?.name ?? 'Cliente'} ({site?.neighborhood ?? site?.name ?? 'Sede'})
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 truncate mt-0.5">
                          {ot.title} · {staffMember?.fullName ?? 'Técnico'}
                        </div>
                      </div>
                      <div className="flex items-center gap-0.5 shrink-0" title={`Calificación: ${rating}/5`}>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-3.5 h-3.5 ${
                              star <= rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};
