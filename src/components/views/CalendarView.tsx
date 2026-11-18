import React, { useMemo, useState } from 'react';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Plus,
  GripVertical,
  Trash2,
  X,
} from 'lucide-react';
import { useTodoservicio } from '../../services/dataStore';
import type { AssignmentStatus } from '../../types/todoservicio';

const WEEKDAYS_ES = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

function toIsoDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export const CalendarView: React.FC = () => {
  const { state, permissions, addAssignment, updateAssignment, deleteAssignment } = useTodoservicio();

  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
  const [anchorDate, setAnchorDate] = useState<Date>(() => new Date());
  const [filterServiceId, setFilterServiceId] = useState<string>('all');
  const [dragHoverDate, setDragHoverDate] = useState<string | null>(null);

  // Create Assignment Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    date: toIsoDate(new Date()),
    startTime: '09:00',
    endTime: '12:00',
    companyId: state.companies[0]?.id ?? '',
    siteId: state.sites[0]?.id ?? '',
    staffId: state.staff[0]?.id ?? '',
    serviceId: state.services[0]?.id ?? '',
    notes: '',
  });

  const openModalForDate = (dateIso: string, presetStaffId?: string) => {
    const firstCompany = state.companies[0]?.id ?? '';
    const firstSite = state.sites.find((s) => s.companyId === firstCompany)?.id ?? state.sites[0]?.id ?? '';
    setForm({
      date: dateIso,
      startTime: '09:00',
      endTime: '12:00',
      companyId: firstCompany,
      siteId: firstSite,
      staffId: presetStaffId ?? state.staff[0]?.id ?? '',
      serviceId: state.services[0]?.id ?? '',
      notes: '',
    });
    setModalOpen(true);
  };

  // Build visible day cells
  const calendarDays = useMemo(() => {
    if (viewMode === 'week') {
      const curr = new Date(anchorDate);
      const dayOfWeek = (curr.getDay() + 6) % 7; // Monday = 0
      const monday = new Date(curr);
      monday.setDate(curr.getDate() - dayOfWeek);
      return Array.from({ length: 7 }, (_, i) => {
        const d = new Date(monday);
        d.setDate(monday.getDate() + i);
        return { date: d, iso: toIsoDate(d), inCurrentMonth: true };
      });
    }

    const year = anchorDate.getFullYear();
    const month = anchorDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const startOffset = (firstDay.getDay() + 6) % 7;
    const gridStart = new Date(year, month, 1 - startOffset);

    return Array.from({ length: 35 }, (_, i) => {
      const d = new Date(gridStart);
      d.setDate(gridStart.getDate() + i);
      return {
        date: d,
        iso: toIsoDate(d),
        inCurrentMonth: d.getMonth() === month,
      };
    });
  }, [anchorDate, viewMode]);

  const shiftPeriod = (dir: -1 | 1) => {
    const next = new Date(anchorDate);
    if (viewMode === 'week') {
      next.setDate(next.getDate() + dir * 7);
    } else {
      next.setMonth(next.getMonth() + dir);
    }
    setAnchorDate(next);
  };

  // Drag & Drop handlers: supports dragging existing assignments across days OR dragging staff from pool onto a day
  const handleDropOnDay = (e: React.DragEvent, targetDateIso: string) => {
    e.preventDefault();
    setDragHoverDate(null);
    if (!permissions.canManageCalendar) return;

    const assignmentId = e.dataTransfer.getData('application/x-assignment-id');
    const staffId = e.dataTransfer.getData('application/x-staff-id');

    if (assignmentId) {
      updateAssignment(assignmentId, { date: targetDateIso });
    } else if (staffId) {
      openModalForDate(targetDateIso, staffId);
    }
  };

  const handleCreateAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.companyId || !form.siteId || !form.staffId || !form.serviceId) return;
    addAssignment({
      ...form,
      status: 'programada',
    });
    setModalOpen(false);
  };

  const todayIso = toIsoDate(new Date());
  const monthLabel = anchorDate.toLocaleDateString('es-UY', { month: 'long', year: 'numeric' });
  const canCreate = state.companies.length > 0 && state.sites.length > 0 && state.staff.length > 0 && state.services.length > 0;

  return (
    <div className="space-y-6 pb-8">
      {/* Top Toolbar */}
      <div className="bg-white rounded-2xl border border-slate-200/75 p-4 shadow-[0_2px_12px_-4px_rgba(13,40,78,0.06)] flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 p-1 bg-[#F4F7FA] rounded-xl">
            <button
              type="button"
              onClick={() => setViewMode('month')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                viewMode === 'month' ? 'bg-[#0D284E] text-white' : 'text-slate-600 hover:text-[#0D284E]'
              }`}
            >
              Mensual
            </button>
            <button
              type="button"
              onClick={() => setViewMode('week')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                viewMode === 'week' ? 'bg-[#0D284E] text-white' : 'text-slate-600 hover:text-[#0D284E]'
              }`}
            >
              Semanal
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => shiftPeriod(-1)}
              className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-[#0D284E] cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-display text-sm font-bold text-[#0D284E] capitalize min-w-[155px] text-center">
              {monthLabel}
            </span>
            <button
              type="button"
              onClick={() => shiftPeriod(1)}
              className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-[#0D284E] cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setAnchorDate(new Date())}
              className="ml-1 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-[#1E4B82] hover:bg-slate-50 cursor-pointer"
            >
              Hoy
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={filterServiceId}
            onChange={(e) => setFilterServiceId(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs text-[#0D284E] bg-white"
          >
            <option value="all">Todos los rubros</option>
            {state.services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          {permissions.canManageCalendar && (
            <button
              type="button"
              onClick={() => openModalForDate(todayIso)}
              disabled={!canCreate}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0D284E] hover:bg-[#1E4B82] disabled:opacity-45 disabled:cursor-not-allowed text-white text-xs font-semibold cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              Nueva Asignación
            </button>
          )}
        </div>
      </div>

      {/* Main Split: Calendar Grid + Draggable Staff Pool */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        <div className="xl:col-span-9 bg-white rounded-2xl border border-slate-200/75 shadow-[0_2px_12px_-4px_rgba(13,40,78,0.06)] overflow-hidden">
          <div className="grid grid-cols-7 border-b border-slate-100 bg-[#F4F7FA]/70">
            {WEEKDAYS_ES.map((day) => (
              <div key={day} className="py-2.5 px-3 text-[11px] font-semibold text-slate-500 text-center">
                {day}
              </div>
            ))}
          </div>

          <div className={`grid grid-cols-7 divide-x divide-y divide-slate-100`}>
            {calendarDays.map((cell) => {
              const dayItems = state.assignments.filter(
                (a) =>
                  a.date === cell.iso &&
                  (filterServiceId === 'all' || a.serviceId === filterServiceId)
              );
              const isToday = cell.iso === todayIso;
              const isDragHover = dragHoverDate === cell.iso;

              return (
                <div
                  key={cell.iso}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragHoverDate(cell.iso);
                  }}
                  onDragLeave={() => setDragHoverDate(null)}
                  onDrop={(e) => handleDropOnDay(e, cell.iso)}
                  className={`${
                    viewMode === 'week' ? 'min-h-[340px]' : 'min-h-[126px]'
                  } p-2 transition-colors flex flex-col ${
                    !cell.inCurrentMonth ? 'bg-slate-50/70 text-slate-400' : 'bg-white'
                  } ${isDragHover ? 'bg-[#1E4B82]/10 ring-2 ring-inset ring-[#1E4B82]/40' : ''}`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono-tabular font-semibold ${
                        isToday ? 'bg-[#0D284E] text-white' : 'text-slate-700'
                      }`}
                    >
                      {cell.date.getDate()}
                    </span>
                    {permissions.canManageCalendar && canCreate && (
                      <button
                        type="button"
                        onClick={() => openModalForDate(cell.iso)}
                        className="opacity-0 hover:opacity-100 focus:opacity-100 text-slate-400 hover:text-[#0D284E] p-0.5 rounded cursor-pointer"
                        title="Asignar en esta fecha"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="space-y-1.5 flex-1">
                    {dayItems.map((item) => {
                      const staffMember = state.staff.find((s) => s.id === item.staffId);
                      const site = state.sites.find((s) => s.id === item.siteId);
                      const service = state.services.find((s) => s.id === item.serviceId);

                      return (
                        <div
                          key={item.id}
                          draggable={permissions.canManageCalendar}
                          onDragStart={(e) => {
                            e.dataTransfer.setData('application/x-assignment-id', item.id);
                          }}
                          className="group rounded-lg p-1.5 bg-[#F4F7FA] border border-slate-200/80 hover:border-[#1E4B82]/50 text-[11px] cursor-grab active:cursor-grabbing"
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span
                              className="font-mono-tabular font-semibold text-[#0D284E] truncate"
                              style={{ color: service?.colorHex || '#0D284E' }}
                            >
                              {item.startTime}
                            </span>
                            {permissions.canManageCalendar && (
                              <button
                                type="button"
                                onClick={() => deleteAssignment(item.id)}
                                className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-600 cursor-pointer"
                                title="Eliminar asignación"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                          <div className="font-semibold text-[#0D284E] truncate">
                            {site?.name ?? 'Sede'}
                          </div>
                          <div className="text-slate-500 truncate">
                            {staffMember?.fullName ?? 'Personal'}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side: Draggable Staff Pool */}
        <div className="xl:col-span-3 bg-white rounded-2xl border border-slate-200/75 p-5 shadow-[0_2px_12px_-4px_rgba(13,40,78,0.06)]">
          <div className="flex items-center gap-2 mb-3">
            <CalendarDays className="w-4 h-4 text-[#0D284E]" />
            <h3 className="font-display text-sm font-bold text-[#0D284E]">
              Asignación Drag &amp; Drop
            </h3>
          </div>
          <p className="text-xs text-slate-500 mb-4">
            Arrastrá un técnico o funcionaria sobre cualquier día del calendario para programar una visita, o mové turnos existentes entre fechas.
          </p>

          {state.staff.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
              Sin personal cargado todavía. Agregá técnicos o limpiadoras en &ldquo;Personal y Legajo Digital&rdquo;.
            </div>
          ) : (
            <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
              {state.staff
                .filter((m) => m.active)
                .map((member) => (
                  <div
                    key={member.id}
                    draggable={permissions.canManageCalendar && canCreate}
                    onDragStart={(e) => {
                      e.dataTransfer.setData('application/x-staff-id', member.id);
                    }}
                    className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-[#F4F7FA] border border-slate-200/70 hover:border-[#1E4B82]/50 cursor-grab active:cursor-grabbing"
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-[#0D284E] truncate">{member.fullName}</div>
                      <div className="text-[11px] text-slate-500 capitalize">
                        {member.category} · {member.assignedZone}
                      </div>
                    </div>
                    <GripVertical className="w-4 h-4 text-slate-400 shrink-0" />
                  </div>
                ))}
            </div>
          )}

          {!canCreate && (
            <p className="mt-4 text-[11px] text-amber-700 bg-amber-50 p-2.5 rounded-xl">
              Para programar turnos necesitás al menos 1 empresa, 1 sede, 1 miembro del personal y 1 rubro de servicio.
            </p>
          )}
        </div>
      </div>

      {/* Create Assignment Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-[#0D284E]/45 backdrop-blur-xs flex items-center justify-center p-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-display text-base font-bold text-[#0D284E]">
                Programar Visita Operativa
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateAssignment} className="p-6 space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Fecha *</label>
                  <input
                    type="date"
                    required
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono-tabular"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Inicio</label>
                  <input
                    type="time"
                    required
                    value={form.startTime}
                    onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono-tabular"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Fin</label>
                  <input
                    type="time"
                    required
                    value={form.endTime}
                    onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono-tabular"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Empresa *</label>
                  <select
                    required
                    value={form.companyId}
                    onChange={(e) => {
                      const cid = e.target.value;
                      const matchingSite = state.sites.find((s) => s.companyId === cid)?.id ?? '';
                      setForm({ ...form, companyId: cid, siteId: matchingSite });
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white"
                  >
                    {state.companies.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Sede *</label>
                  <select
                    required
                    value={form.siteId}
                    onChange={(e) => setForm({ ...form, siteId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white"
                  >
                    {state.sites
                      .filter((s) => !form.companyId || s.companyId === form.companyId)
                      .map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Personal Asignado *</label>
                  <select
                    required
                    value={form.staffId}
                    onChange={(e) => setForm({ ...form, staffId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white"
                  >
                    {state.staff.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.fullName} ({m.category})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Rubro / Servicio *</label>
                  <select
                    required
                    value={form.serviceId}
                    onChange={(e) => setForm({ ...form, serviceId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white"
                  >
                    {state.services.map((srv) => (
                      <option key={srv.id} value={srv.id}>
                        {srv.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Instrucciones / Notas</label>
                <textarea
                  rows={2}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs"
                  placeholder="Detalles operativos para el técnico o funcionaria..."
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#0D284E] hover:bg-[#1E4B82] text-white text-xs font-semibold cursor-pointer"
                >
                  Confirmar Turno
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
