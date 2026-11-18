import React, { useRef, useState } from 'react';
import {
  ClipboardList,
  Plus,
  Star,
  Printer,
  Trash2,
  X,
  Upload,
  PenTool,
  Eraser,
} from 'lucide-react';
import { useTodoservicio, formatOtCode } from '../../services/dataStore';
import type { WorkOrder, WorkOrderStatus } from '../../types/todoservicio';

interface WorkOrdersViewProps {
  activeSubTab: string;
  onChangeSubTab: (tab: string) => void;
}

export const WorkOrdersView: React.FC<WorkOrdersViewProps> = ({ activeSubTab, onChangeSubTab }) => {
  const { state, permissions, createWorkOrder, updateWorkOrder, deleteWorkOrder } = useTodoservicio();

  const currentTab = activeSubTab === 'calificaciones' ? 'calificaciones' : 'todas';
  const [statusFilter, setStatusFilter] = useState<'all' | WorkOrderStatus>('all');
  const [createOpen, setCreateOpen] = useState(false);
  const [activeOt, setActiveOt] = useState<WorkOrder | null>(null);
  const [printMode, setPrintMode] = useState(false);

  const [createForm, setCreateForm] = useState({
    companyId: state.companies[0]?.id ?? '',
    siteId: state.sites[0]?.id ?? '',
    staffId: state.staff[0]?.id ?? '',
    serviceId: state.services[0]?.id ?? '',
    title: '',
    description: '',
    status: 'pendiente' as WorkOrderStatus,
    scheduledDate: new Date().toISOString().slice(0, 10),
  });

  // Signature Canvas Ref
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const openCreateModal = () => {
    const compId = state.companies[0]?.id ?? '';
    const siteId = state.sites.find((s) => s.companyId === compId)?.id ?? state.sites[0]?.id ?? '';
    setCreateForm({
      companyId: compId,
      siteId,
      staffId: state.staff[0]?.id ?? '',
      serviceId: state.services[0]?.id ?? '',
      title: '',
      description: '',
      status: 'pendiente',
      scheduledDate: new Date().toISOString().slice(0, 10),
    });
    setCreateOpen(true);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.title.trim() || !createForm.companyId || !createForm.siteId) return;
    createWorkOrder({
      ...createForm,
      startedAt: createForm.status === 'en_curso' ? new Date().toISOString() : undefined,
    });
    setCreateOpen(false);
  };

  const handlePhotoUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: 'photoBeforeUrl' | 'photoAfterUrl'
  ) => {
    const file = e.target.files?.[0];
    if (!file || !activeOt) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      updateWorkOrder(activeOt.id, { [field]: dataUrl });
      setActiveOt({ ...activeOt, [field]: dataUrl });
    };
    reader.readAsDataURL(file);
  };

  // Signature pad events
  const startDraw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.lineWidth = 2.2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#0D284E';
    setIsDrawing(true);
  };

  const moveDraw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const endDraw = () => {
    setIsDrawing(false);
  };

  const clearSignatureCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const saveSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas || !activeOt) return;
    const dataUrl = canvas.toDataURL('image/png');
    updateWorkOrder(activeOt.id, { signatureDataUrl: dataUrl });
    setActiveOt({ ...activeOt, signatureDataUrl: dataUrl });
  };

  const handlePrintA4 = () => {
    setPrintMode(true);
    setTimeout(() => {
      window.print();
      setPrintMode(false);
    }, 150);
  };

  const visibleOrders = state.workOrders.filter((wo) => {
    if (currentTab === 'calificaciones' && wo.status !== 'completada') return false;
    if (statusFilter !== 'all' && wo.status !== statusFilter) return false;
    return true;
  });

  const canCreate = state.companies.length > 0 && state.sites.length > 0 && state.staff.length > 0 && state.services.length > 0;
  const nextCodePreview = formatOtCode(state.lastOtSequence + 1);

  return (
    <div className="space-y-6 pb-8">
      {/* Toolbar */}
      <div className="no-print bg-white rounded-2xl border border-slate-200/75 p-4 shadow-[0_2px_12px_-4px_rgba(13,40,78,0.06)] flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-1 p-1 bg-[#F4F7FA] rounded-xl">
          <button
            type="button"
            onClick={() => onChangeSubTab('todas')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer whitespace-nowrap ${
              currentTab === 'todas' ? 'bg-[#0D284E] text-white' : 'text-slate-600 hover:text-[#0D284E]'
            }`}
          >
            Repositorio OT ({state.workOrders.length})
          </button>
          <button
            type="button"
            onClick={() => onChangeSubTab('calificaciones')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer whitespace-nowrap ${
              currentTab === 'calificaciones'
                ? 'bg-[#0D284E] text-white'
                : 'text-slate-600 hover:text-[#0D284E]'
            }`}
          >
            Firmas y Calificaciones
          </button>
        </div>

        <div className="flex items-center gap-3">
          {currentTab === 'todas' && (
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'all' | WorkOrderStatus)}
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs text-[#0D284E] bg-white"
            >
              <option value="all">Todos los estados</option>
              <option value="pendiente">Pendiente</option>
              <option value="en_curso">En curso</option>
              <option value="completada">Completada</option>
            </select>
          )}

          {permissions.canManageWorkOrders && (
            <button
              type="button"
              onClick={openCreateModal}
              disabled={!canCreate}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0D284E] hover:bg-[#1E4B82] disabled:opacity-45 disabled:cursor-not-allowed text-white text-xs font-semibold cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              Nueva {nextCodePreview}
            </button>
          )}
        </div>
      </div>

      {/* Table / Empty State */}
      {visibleOrders.length === 0 ? (
        <div className="no-print bg-white rounded-2xl border border-slate-200/75 p-16 text-center shadow-[0_2px_12px_-4px_rgba(13,40,78,0.06)]">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <ClipboardList className="w-6 h-6" />
          </div>
          <h3 className="font-display text-base font-semibold text-[#0D284E]">
            No hay Órdenes de Trabajo registradas
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            Cada orden se numera correlativamente desde OT-0001 con respaldo fotográfico Antes/Después, firma digital del cliente y exportación en PDF A4.
          </p>
        </div>
      ) : (
        <div className="no-print bg-white rounded-2xl border border-slate-200/75 shadow-[0_2px_12px_-4px_rgba(13,40,78,0.06)] overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-[#F4F7FA]/60 text-[11px] font-semibold text-slate-500">
                <th className="py-3.5 px-5">Código</th>
                <th className="py-3.5 px-4">Trabajo / Rubro</th>
                <th className="py-3.5 px-4">Cliente y Sede</th>
                <th className="py-3.5 px-4">Responsable</th>
                <th className="py-3.5 px-4">Estado</th>
                <th className="py-3.5 px-4">Calificación</th>
                <th className="py-3.5 px-5 text-right">Gestión / PDF</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {visibleOrders.map((wo) => {
                const company = state.companies.find((c) => c.id === wo.companyId);
                const site = state.sites.find((s) => s.id === wo.siteId);
                const staffMember = state.staff.find((m) => m.id === wo.staffId);
                const service = state.services.find((s) => s.id === wo.serviceId);

                return (
                  <tr key={wo.id} className="hover:bg-slate-50/70">
                    <td className="py-3.5 px-5 font-mono-tabular font-bold text-[#0D284E]">
                      {wo.code}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-[#0D284E]">{wo.title}</div>
                      <div className="text-[11px] text-slate-500">{service?.name ?? 'Rubro'}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-700">{company?.name ?? 'Cliente'}</div>
                      <div className="text-[11px] text-slate-500">{site?.name ?? 'Sede'}</div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700">{staffMember?.fullName ?? '—'}</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`font-semibold capitalize ${
                          wo.status === 'completada'
                            ? 'text-emerald-600'
                            : wo.status === 'en_curso'
                            ? 'text-[#1E4B82]'
                            : 'text-amber-600'
                        }`}
                      >
                        {wo.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      {wo.rating ? (
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((st) => (
                            <Star
                              key={st}
                              className={`w-3.5 h-3.5 ${
                                st <= (wo.rating ?? 0)
                                  ? 'text-amber-400 fill-amber-400'
                                  : 'text-slate-200'
                              }`}
                            />
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-400">Sin calificar</span>
                      )}
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <div className="inline-flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setActiveOt(wo)}
                          className="px-3 py-1.5 rounded-lg bg-[#0D284E]/8 hover:bg-[#0D284E] hover:text-white text-[#0D284E] font-semibold transition-colors cursor-pointer"
                        >
                          Abrir / PDF A4
                        </button>
                        {permissions.canManageWorkOrders && (
                          <button
                            type="button"
                            onClick={() => deleteWorkOrder(wo.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Work Order Modal */}
      {createOpen && (
        <div className="no-print fixed inset-0 z-50 bg-[#0D284E]/45 backdrop-blur-xs flex items-center justify-center p-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-display text-base font-bold text-[#0D284E]">
                Emitir Orden de Trabajo ({nextCodePreview})
              </h3>
              <button
                type="button"
                onClick={() => setCreateOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Título del trabajo *</label>
                <input
                  required
                  value={createForm.title}
                  onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                  placeholder="Ej. Mantenimiento tablero eléctrico cocina"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Empresa *</label>
                  <select
                    required
                    value={createForm.companyId}
                    onChange={(e) => {
                      const cid = e.target.value;
                      const firstSite = state.sites.find((s) => s.companyId === cid)?.id ?? '';
                      setCreateForm({ ...createForm, companyId: cid, siteId: firstSite });
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
                    value={createForm.siteId}
                    onChange={(e) => setCreateForm({ ...createForm, siteId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white"
                  >
                    {state.sites
                      .filter((s) => !createForm.companyId || s.companyId === createForm.companyId)
                      .map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Responsable *</label>
                  <select
                    required
                    value={createForm.staffId}
                    onChange={(e) => setCreateForm({ ...createForm, staffId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white"
                  >
                    {state.staff.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.fullName}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Rubro *</label>
                  <select
                    required
                    value={createForm.serviceId}
                    onChange={(e) => setCreateForm({ ...createForm, serviceId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white"
                  >
                    {state.services.map((srv) => (
                      <option key={srv.id} value={srv.id}>
                        {srv.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Fecha programada</label>
                  <input
                    type="date"
                    value={createForm.scheduledDate}
                    onChange={(e) => setCreateForm({ ...createForm, scheduledDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono-tabular"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Estado inicial</label>
                  <select
                    value={createForm.status}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, status: e.target.value as WorkOrderStatus })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white"
                  >
                    <option value="pendiente">Pendiente</option>
                    <option value="en_curso">En curso</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Descripción técnica</label>
                <textarea
                  rows={3}
                  value={createForm.description}
                  onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCreateOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#0D284E] hover:bg-[#1E4B82] text-white text-xs font-semibold cursor-pointer"
                >
                  Crear {nextCodePreview}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Work Order Detail / Evidence / Signature / A4 Print Modal */}
      {activeOt && (
        <div
          className={`${
            printMode ? 'static bg-white p-0' : 'fixed inset-0 z-50 bg-[#0D284E]/45 backdrop-blur-xs flex items-center justify-center p-6'
          }`}
        >
          <div className="print-a4-sheet bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
            {/* Modal Top Bar (hidden on print) */}
            <div className="no-print px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="font-mono-tabular text-sm font-bold text-white bg-[#0D284E] px-3 py-1 rounded-lg">
                  {activeOt.code}
                </span>
                <h3 className="font-display text-base font-bold text-[#0D284E] truncate">
                  {activeOt.title}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrintA4}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#1E4B82] hover:bg-[#0D284E] text-white text-xs font-semibold cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Exportar PDF A4
                </button>
                <button
                  type="button"
                  onClick={() => setActiveOt(null)}
                  className="p-2 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Printable & Interactive Body */}
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Print A4 Brand Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                <div className="flex items-center gap-4">
                  <div className="bg-[#0D284E] rounded-lg p-1.5 w-40">
                    <img
                      src="/assets/aistudio/Todoservicio_Logo_HD_e9dd8432.png"
                      alt="Todoservicio"
                      referrerPolicy="no-referrer"
                      className="w-full h-8 object-contain"
                    />
                  </div>
                  <div className="text-xs text-slate-600">
                    <div className="font-bold text-[#0D284E]">Orden de Trabajo {activeOt.code}</div>
                    <div>Montevideo &amp; Canelones, Uruguay</div>
                  </div>
                </div>
                <div className="text-right text-xs">
                  <div className="font-semibold text-[#0D284E] capitalize">
                    Estado: {activeOt.status.replace('_', ' ')}
                  </div>
                  <div className="font-mono-tabular text-slate-500">
                    Fecha: {activeOt.scheduledDate}
                  </div>
                </div>
              </div>

              {/* Metadata Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs bg-[#F4F7FA] p-4 rounded-xl">
                <div>
                  <div className="text-slate-400">Cliente</div>
                  <div className="font-semibold text-[#0D284E] mt-0.5">
                    {state.companies.find((c) => c.id === activeOt.companyId)?.name ?? '—'}
                  </div>
                </div>
                <div>
                  <div className="text-slate-400">Sede</div>
                  <div className="font-semibold text-[#0D284E] mt-0.5">
                    {state.sites.find((s) => s.id === activeOt.siteId)?.name ?? '—'}
                  </div>
                </div>
                <div>
                  <div className="text-slate-400">Responsable</div>
                  <div className="font-semibold text-[#0D284E] mt-0.5">
                    {state.staff.find((m) => m.id === activeOt.staffId)?.fullName ?? '—'}
                  </div>
                </div>
                <div>
                  <div className="text-slate-400">Rubro</div>
                  <div className="font-semibold text-[#0D284E] mt-0.5">
                    {state.services.find((s) => s.id === activeOt.serviceId)?.name ?? '—'}
                  </div>
                </div>
              </div>

              {/* Status & Description */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Detalle Técnico del Trabajo
                  </label>
                  <textarea
                    rows={3}
                    value={activeOt.description}
                    onChange={(e) => {
                      const desc = e.target.value;
                      updateWorkOrder(activeOt.id, { description: desc });
                      setActiveOt({ ...activeOt, description: desc });
                    }}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
                <div className="no-print">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Actualizar Estado
                  </label>
                  <select
                    value={activeOt.status}
                    onChange={(e) => {
                      const st = e.target.value as WorkOrderStatus;
                      const patch: Partial<WorkOrder> = {
                        status: st,
                        startedAt:
                          st === 'en_curso' && !activeOt.startedAt
                            ? new Date().toISOString()
                            : activeOt.startedAt,
                        completedAt:
                          st === 'completada' ? new Date().toISOString() : activeOt.completedAt,
                      };
                      updateWorkOrder(activeOt.id, patch);
                      setActiveOt({ ...activeOt, ...patch });
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white font-semibold text-[#0D284E]"
                  >
                    <option value="pendiente">Pendiente</option>
                    <option value="en_curso">En curso</option>
                    <option value="completada">Completada / Firmada</option>
                  </select>
                </div>
              </div>

              {/* Before / After Photos */}
              <div>
                <h4 className="font-display text-xs font-bold text-[#0D284E] mb-3">
                  Evidencia Fotográfica (Antes / Después)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Antes */}
                  <div className="border border-slate-200 rounded-xl p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-slate-700">Foto Antes</span>
                      <label className="no-print inline-flex items-center gap-1 text-[11px] font-semibold text-[#1E4B82] cursor-pointer hover:underline">
                        <Upload className="w-3 h-3" />
                        Subir imagen
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handlePhotoUpload(e, 'photoBeforeUrl')}
                          className="hidden"
                        />
                      </label>
                    </div>
                    {activeOt.photoBeforeUrl ? (
                      <img
                        src={activeOt.photoBeforeUrl}
                        alt="Foto Antes"
                        referrerPolicy="no-referrer"
                        className="w-full h-44 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="h-44 rounded-lg bg-[#F4F7FA] flex items-center justify-center text-xs text-slate-400">
                        Sin foto previa cargada
                      </div>
                    )}
                  </div>

                  {/* Después */}
                  <div className="border border-slate-200 rounded-xl p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-slate-700">Foto Después</span>
                      <label className="no-print inline-flex items-center gap-1 text-[11px] font-semibold text-[#1E4B82] cursor-pointer hover:underline">
                        <Upload className="w-3 h-3" />
                        Subir imagen
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handlePhotoUpload(e, 'photoAfterUrl')}
                          className="hidden"
                        />
                      </label>
                    </div>
                    {activeOt.photoAfterUrl ? (
                      <img
                        src={activeOt.photoAfterUrl}
                        alt="Foto Después"
                        referrerPolicy="no-referrer"
                        className="w-full h-44 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="h-44 rounded-lg bg-[#F4F7FA] flex items-center justify-center text-xs text-slate-400">
                        Sin foto posterior cargada
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Digital Signature & 5-Star Rating */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2 border-t border-slate-100">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-display text-xs font-bold text-[#0D284E] flex items-center gap-1.5">
                      <PenTool className="w-3.5 h-3.5" />
                      Firma Digital de Conformidad
                    </h4>
                    <div className="no-print flex items-center gap-2">
                      <button
                        type="button"
                        onClick={clearSignatureCanvas}
                        className="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-800 cursor-pointer"
                      >
                        <Eraser className="w-3 h-3" /> Limpiar
                      </button>
                      <button
                        type="button"
                        onClick={saveSignature}
                        className="text-[11px] font-semibold text-[#1E4B82] hover:underline cursor-pointer"
                      >
                        Guardar firma
                      </button>
                    </div>
                  </div>

                  {activeOt.signatureDataUrl ? (
                    <div className="border border-slate-200 rounded-xl p-3 bg-white">
                      <img
                        src={activeOt.signatureDataUrl}
                        alt="Firma Cliente"
                        referrerPolicy="no-referrer"
                        className="h-24 mx-auto object-contain"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          updateWorkOrder(activeOt.id, { signatureDataUrl: undefined });
                          setActiveOt({ ...activeOt, signatureDataUrl: undefined });
                        }}
                        className="no-print mt-2 text-[11px] text-slate-500 hover:text-red-600 block mx-auto cursor-pointer"
                      >
                        Volver a firmar
                      </button>
                    </div>
                  ) : (
                    <canvas
                      ref={canvasRef}
                      width={360}
                      height={110}
                      onPointerDown={startDraw}
                      onPointerMove={moveDraw}
                      onPointerUp={endDraw}
                      onPointerLeave={endDraw}
                      className="no-print w-full h-[110px] border border-dashed border-slate-300 rounded-xl bg-[#F4F7FA] cursor-crosshair touch-none"
                    />
                  )}

                  <input
                    value={activeOt.signedByName ?? ''}
                    onChange={(e) => {
                      const name = e.target.value;
                      updateWorkOrder(activeOt.id, { signedByName: name });
                      setActiveOt({ ...activeOt, signedByName: name });
                    }}
                    placeholder="Aclaración de quien firma (Nombre y Cargo)"
                    className="mt-2 w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs"
                  />
                </div>

                <div className="space-y-3">
                  <h4 className="font-display text-xs font-bold text-[#0D284E]">
                    Calificación del Cliente (1 a 5 Estrellas)
                  </h4>
                  <div className="flex items-center gap-1.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => {
                          updateWorkOrder(activeOt.id, { rating: star });
                          setActiveOt({ ...activeOt, rating: star });
                        }}
                        className="p-1 cursor-pointer"
                      >
                        <Star
                          className={`w-6 h-6 transition-colors ${
                            star <= (activeOt.rating ?? 0)
                              ? 'text-amber-400 fill-amber-400'
                              : 'text-slate-200 hover:text-amber-200'
                          }`}
                        />
                      </button>
                    ))}
                    <span className="ml-2 font-mono-tabular text-xs font-semibold text-slate-600">
                      {activeOt.rating ? `${activeOt.rating}/5` : 'Sin calificar'}
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Comentario del Cliente
                    </label>
                    <textarea
                      rows={3}
                      value={activeOt.clientComment ?? ''}
                      onChange={(e) => {
                        const comment = e.target.value;
                        updateWorkOrder(activeOt.id, { clientComment: comment });
                        setActiveOt({ ...activeOt, clientComment: comment });
                      }}
                      placeholder="Observaciones de conformidad..."
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
