import React, { useState } from 'react';
import {
  Users,
  Plus,
  KeyRound,
  Phone,
  ShieldAlert,
  Trash2,
  Edit3,
  X,
  Upload,
} from 'lucide-react';
import { useTodoservicio } from '../../services/dataStore';
import type { DepartmentUY, StaffCategory, StaffMember, UserRole } from '../../types/todoservicio';

interface StaffDossierViewProps {
  activeSubTab: string;
  onChangeSubTab: (tab: string) => void;
}

export const StaffDossierView: React.FC<StaffDossierViewProps> = ({
  activeSubTab,
  onChangeSubTab,
}) => {
  const { state, permissions, addStaff, updateStaff, deleteStaff } = useTodoservicio();

  const currentTab =
    activeSubTab === 'tecnicos' || activeSubTab === 'limpieza' ? activeSubTab : 'todos';

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<StaffMember | null>(null);
  const [form, setForm] = useState({
    fullName: '',
    documentId: '',
    category: 'tecnico' as StaffCategory,
    role: 'tecnico' as UserRole,
    phone: '',
    email: '',
    avatarUrl: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyRelation: '',
    username: '',
    mustChangePassword: true,
    active: true,
    hireDate: new Date().toISOString().slice(0, 10),
    assignedZone: 'Montevideo' as DepartmentUY,
  });

  const openNew = () => {
    setEditing(null);
    setForm({
      fullName: '',
      documentId: '',
      category: currentTab === 'limpieza' ? 'limpieza' : 'tecnico',
      role: currentTab === 'limpieza' ? 'limpieza' : 'tecnico',
      phone: '',
      email: '',
      avatarUrl: '',
      emergencyContactName: '',
      emergencyContactPhone: '',
      emergencyRelation: '',
      username: '',
      mustChangePassword: true,
      active: true,
      hireDate: new Date().toISOString().slice(0, 10),
      assignedZone: 'Montevideo',
    });
    setModalOpen(true);
  };

  const openEdit = (m: StaffMember) => {
    setEditing(m);
    setForm({
      fullName: m.fullName,
      documentId: m.documentId,
      category: m.category,
      role: m.role,
      phone: m.phone,
      email: m.email,
      avatarUrl: m.avatarUrl ?? '',
      emergencyContactName: m.emergencyContactName,
      emergencyContactPhone: m.emergencyContactPhone,
      emergencyRelation: m.emergencyRelation,
      username: m.username,
      mustChangePassword: m.mustChangePassword,
      active: m.active,
      hireDate: m.hireDate,
      assignedZone: m.assignedZone,
    });
    setModalOpen(true);
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setForm((prev) => ({ ...prev, avatarUrl: reader.result as string }));
    reader.readAsDataURL(file);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName.trim()) return;
    const payload = {
      ...form,
      username:
        form.username.trim() ||
        form.fullName.toLowerCase().replace(/\s+/g, '.').slice(0, 16),
      role: form.category as UserRole,
    };
    if (editing) {
      updateStaff(editing.id, payload);
    } else {
      addStaff(payload);
    }
    setModalOpen(false);
  };

  const visibleStaff = state.staff.filter((m) => {
    if (currentTab === 'tecnicos') return m.category === 'tecnico';
    if (currentTab === 'limpieza') return m.category === 'limpieza';
    return true;
  });

  return (
    <div className="space-y-6 pb-8">
      {/* Toolbar */}
      <div className="bg-white rounded-2xl border border-slate-200/75 p-4 shadow-[0_2px_12px_-4px_rgba(13,40,78,0.06)] flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-1 p-1 bg-[#F4F7FA] rounded-xl">
          <button
            type="button"
            onClick={() => onChangeSubTab('todos')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer ${
              currentTab === 'todos' ? 'bg-[#0D284E] text-white' : 'text-slate-600 hover:text-[#0D284E]'
            }`}
          >
            Nómina General ({state.staff.length})
          </button>
          <button
            type="button"
            onClick={() => onChangeSubTab('tecnicos')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer ${
              currentTab === 'tecnicos' ? 'bg-[#0D284E] text-white' : 'text-slate-600 hover:text-[#0D284E]'
            }`}
          >
            Técnicos ({state.staff.filter((s) => s.category === 'tecnico').length})
          </button>
          <button
            type="button"
            onClick={() => onChangeSubTab('limpieza')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer ${
              currentTab === 'limpieza' ? 'bg-[#0D284E] text-white' : 'text-slate-600 hover:text-[#0D284E]'
            }`}
          >
            Limpieza ({state.staff.filter((s) => s.category === 'limpieza').length})
          </button>
        </div>

        {permissions.canManageStaff && (
          <button
            type="button"
            onClick={openNew}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0D284E] hover:bg-[#1E4B82] text-white text-xs font-semibold cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            Alta de Personal
          </button>
        )}
      </div>

      {/* Staff Cards / Empty State */}
      {visibleStaff.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/75 p-16 text-center shadow-[0_2px_12px_-4px_rgba(13,40,78,0.06)]">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="font-display text-base font-semibold text-[#0D284E]">
            Legajo digital sin personal cargado
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            Cargá técnicos de mantenimiento y funcionarias de limpieza con su Cédula, contacto de emergencia y credenciales con cambio obligatorio de contraseña.
          </p>
          {permissions.canManageStaff && (
            <button
              type="button"
              onClick={openNew}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0D284E] text-white text-xs font-semibold hover:bg-[#1E4B82] cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Crear Primer Legajo
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {visibleStaff.map((member) => (
            <div
              key={member.id}
              className="bg-white rounded-2xl border border-slate-200/75 p-6 shadow-[0_2px_12px_-4px_rgba(13,40,78,0.06)] flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3.5 min-w-0">
                    {member.avatarUrl ? (
                      <img
                        src={member.avatarUrl}
                        alt={member.fullName}
                        referrerPolicy="no-referrer"
                        className="w-12 h-12 rounded-full object-cover border border-slate-200 shrink-0"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-[#0D284E] text-white font-display font-bold text-sm flex items-center justify-center shrink-0">
                        {member.fullName
                          .split(' ')
                          .slice(0, 2)
                          .map((p) => p[0])
                          .join('')}
                      </div>
                    )}
                    <div className="min-w-0">
                      <h3 className="font-display text-sm font-bold text-[#0D284E] truncate">
                        {member.fullName}
                      </h3>
                      <p className="text-xs text-slate-500 capitalize">
                        {member.category === 'limpieza' ? 'Funcionaria de Limpieza' : 'Técnico de Campo'} ·{' '}
                        {member.assignedZone}
                      </p>
                      <p className="text-[11px] font-mono-tabular text-slate-400">
                        CI {member.documentId || 'Sin CI'}
                      </p>
                    </div>
                  </div>

                  {permissions.canManageStaff && (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => openEdit(member)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-[#0D284E] hover:bg-slate-100 cursor-pointer"
                        title="Editar legajo"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteStaff(member.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                        title="Eliminar legajo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-slate-100 space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-slate-600">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="font-mono-tabular">{member.phone || '—'}</span>
                    <span className="text-slate-300">·</span>
                    <span className="truncate">{member.email || '—'}</span>
                  </div>
                  <div className="flex items-start gap-2 text-slate-600">
                    <ShieldAlert className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
                    <span>
                      Emergencia: <strong className="text-[#0D284E]">{member.emergencyContactName || '—'}</strong>{' '}
                      ({member.emergencyRelation || 'Familiar'}) ·{' '}
                      <span className="font-mono-tabular">{member.emergencyContactPhone || '—'}</span>
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1.5 text-slate-600">
                  <KeyRound className="w-3.5 h-3.5 text-[#1E4B82]" />
                  <span className="font-mono-tabular">@{member.username}</span>
                </div>
                {member.mustChangePassword ? (
                  <span className="text-amber-700 font-semibold">
                    Cambio de clave obligatorio
                  </span>
                ) : (
                  <span className="text-emerald-600 font-semibold">Credencial vigente</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Legajo Digital Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-[#0D284E]/45 backdrop-blur-xs flex items-center justify-center p-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-display text-base font-bold text-[#0D284E]">
                {editing ? 'Legajo Digital del Personal' : 'Alta en Legajo Digital'}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-4">
              <div className="flex items-center gap-4">
                {form.avatarUrl ? (
                  <img
                    src={form.avatarUrl}
                    alt="Avatar"
                    referrerPolicy="no-referrer"
                    className="w-14 h-14 rounded-full object-cover border border-slate-200"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-[#F4F7FA] border border-slate-200 flex items-center justify-center text-slate-400">
                    <Users className="w-6 h-6" />
                  </div>
                )}
                <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-[#0D284E] hover:bg-slate-50 cursor-pointer">
                  <Upload className="w-3.5 h-3.5" />
                  Subir foto de perfil
                  <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                </label>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nombre Completo *</label>
                  <input
                    required
                    value={form.fullName}
                    onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Cédula de Identidad (UY)</label>
                  <input
                    value={form.documentId}
                    onChange={(e) => setForm({ ...form, documentId: e.target.value })}
                    placeholder="4.521.890-3"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-mono-tabular"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Categoría / Rol</label>
                  <select
                    value={form.category}
                    onChange={(e) =>
                      setForm({ ...form, category: e.target.value as StaffCategory })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white"
                  >
                    <option value="tecnico">Técnico de Mantenimiento</option>
                    <option value="limpieza">Funcionaria de Limpieza</option>
                    <option value="supervisor">Supervisor</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Zona Base</label>
                  <select
                    value={form.assignedZone}
                    onChange={(e) =>
                      setForm({ ...form, assignedZone: e.target.value as DepartmentUY })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white"
                  >
                    <option value="Montevideo">Montevideo</option>
                    <option value="Canelones">Canelones</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Teléfono Celular</label>
                  <input
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    placeholder="099 ..."
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-mono-tabular"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <div className="text-xs font-bold text-[#0D284E] mb-2">Contacto de Emergencia</div>
                <div className="grid grid-cols-3 gap-3">
                  <input
                    value={form.emergencyContactName}
                    onChange={(e) => setForm({ ...form, emergencyContactName: e.target.value })}
                    placeholder="Nombre"
                    className="px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                  <input
                    value={form.emergencyRelation}
                    onChange={(e) => setForm({ ...form, emergencyRelation: e.target.value })}
                    placeholder="Vínculo (Esposa/o, Madre)"
                    className="px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                  <input
                    value={form.emergencyContactPhone}
                    onChange={(e) => setForm({ ...form, emergencyContactPhone: e.target.value })}
                    placeholder="Teléfono 099..."
                    className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono-tabular"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 space-y-3">
                <div className="text-xs font-bold text-[#0D284E]">Credenciales App Móvil</div>
                <div className="grid grid-cols-2 gap-4 items-center">
                  <input
                    value={form.username}
                    onChange={(e) => setForm({ ...form, username: e.target.value })}
                    placeholder="Usuario (ej. rsilveira)"
                    className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-mono-tabular"
                  />
                  <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.mustChangePassword}
                      onChange={(e) => setForm({ ...form, mustChangePassword: e.target.checked })}
                    />
                    Exigir cambio obligatorio de clave
                  </label>
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
                  Guardar Legajo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
