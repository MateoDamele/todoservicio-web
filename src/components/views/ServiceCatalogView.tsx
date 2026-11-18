import React, { useState } from 'react';
import { Wrench, Plus, Trash2, Edit3, X } from 'lucide-react';
import { useTodoservicio } from '../../services/dataStore';
import type { ServiceCategory } from '../../types/todoservicio';

const PRESET_COLORS = ['#0D284E', '#1E4B82', '#10B981', '#3B82F6', '#F59E0B', '#EF4444'];

export const ServiceCatalogView: React.FC = () => {
  const { state, permissions, addService, updateService, deleteService } = useTodoservicio();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ServiceCategory | null>(null);
  const [form, setForm] = useState({
    name: '',
    description: '',
    defaultSlaHours: 8,
    colorHex: '#1E4B82',
    active: true,
  });

  const openNew = () => {
    setEditing(null);
    setForm({ name: '', description: '', defaultSlaHours: 8, colorHex: '#1E4B82', active: true });
    setModalOpen(true);
  };

  const openEdit = (srv: ServiceCategory) => {
    setEditing(srv);
    setForm({
      name: srv.name,
      description: srv.description,
      defaultSlaHours: srv.defaultSlaHours,
      colorHex: srv.colorHex,
      active: srv.active,
    });
    setModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    if (editing) {
      updateService(editing.id, form);
    } else {
      addService(form);
    }
    setModalOpen(false);
  };

  return (
    <div className="space-y-6 pb-8">
      <div className="bg-white rounded-2xl border border-slate-200/75 p-5 shadow-[0_2px_12px_-4px_rgba(13,40,78,0.06)] flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-base font-bold text-[#0D284E]">
            Editor de Rubros de Mantenimiento y Limpieza
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Administrá los rubros disponibles para Órdenes de Trabajo, Calendario Operativo y solicitudes desde la app de clientes.
          </p>
        </div>

        {permissions.canManageCatalog && (
          <button
            type="button"
            onClick={openNew}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#0D284E] hover:bg-[#1E4B82] text-white text-xs font-semibold cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            Agregar Rubro
          </button>
        )}
      </div>

      {state.services.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/75 p-16 text-center shadow-[0_2px_12px_-4px_rgba(13,40,78,0.06)]">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <Wrench className="w-6 h-6" />
          </div>
          <h3 className="font-display text-base font-semibold text-[#0D284E]">
            Catálogo de servicios vacío
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            Definí los rubros oficiales de Todoservicio (Limpieza Integral, Electricidad, HVAC, Sanitaria, Albañilería, etc.).
          </p>
          {permissions.canManageCatalog && (
            <button
              type="button"
              onClick={openNew}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0D284E] text-white text-xs font-semibold hover:bg-[#1E4B82] cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Crear Primer Rubro
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {state.services.map((srv) => (
            <div
              key={srv.id}
              className="bg-white rounded-2xl border border-slate-200/75 p-6 shadow-[0_2px_12px_-4px_rgba(13,40,78,0.06)] flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0"
                      style={{ backgroundColor: srv.colorHex }}
                    >
                      <Wrench className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-display text-sm font-bold text-[#0D284E] truncate">{srv.name}</h3>
                      <p className="text-[11px] font-mono-tabular text-slate-500">
                        SLA estándar: {srv.defaultSlaHours}h
                      </p>
                    </div>
                  </div>
                  {permissions.canManageCatalog && (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => openEdit(srv)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-[#0D284E] hover:bg-slate-100 cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteService(srv.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                <p className="text-xs text-slate-600 mt-4 leading-relaxed">
                  {srv.description || 'Sin descripción operativa adicional.'}
                </p>
              </div>

              <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className={srv.active ? 'text-emerald-600 font-semibold' : 'text-slate-400 font-medium'}>
                  {srv.active ? 'Habilitado' : 'Pausado'}
                </span>
                {permissions.canManageCatalog && (
                  <button
                    type="button"
                    onClick={() => updateService(srv.id, { active: !srv.active })}
                    className="text-[#1E4B82] hover:underline font-semibold cursor-pointer"
                  >
                    {srv.active ? 'Desactivar' : 'Reactivar'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-[#0D284E]/45 backdrop-blur-xs flex items-center justify-center p-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-display text-base font-bold text-[#0D284E]">
                {editing ? 'Editar Rubro' : 'Nuevo Rubro de Servicio'}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nombre del Rubro *</label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Ej. Electricidad & Tableros"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Descripción</label>
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">SLA Objetivo (horas)</label>
                  <input
                    type="number"
                    min={1}
                    max={168}
                    value={form.defaultSlaHours}
                    onChange={(e) => setForm({ ...form, defaultSlaHours: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-mono-tabular"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Color identificador</label>
                  <div className="flex items-center gap-2 pt-1.5">
                    {PRESET_COLORS.map((hex) => (
                      <button
                        key={hex}
                        type="button"
                        onClick={() => setForm({ ...form, colorHex: hex })}
                        className={`w-6 h-6 rounded-full cursor-pointer ${
                          form.colorHex === hex ? 'ring-2 ring-offset-2 ring-[#0D284E]' : ''
                        }`}
                        style={{ backgroundColor: hex }}
                      />
                    ))}
                  </div>
                </div>
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
                  Guardar Rubro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
