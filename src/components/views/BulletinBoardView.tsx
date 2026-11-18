import React, { useState } from 'react';
import { Megaphone, Plus, Bell, Trash2, Upload, X } from 'lucide-react';
import { useTodoservicio } from '../../services/dataStore';
import type { NoticeAudience, NoticePriority } from '../../types/todoservicio';

export const BulletinBoardView: React.FC = () => {
  const { state, session, permissions, addNotice, deleteNotice } = useTodoservicio();

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    title: '',
    body: '',
    priority: 'alta' as NoticePriority,
    audience: 'todos' as NoticeAudience,
    imageUrl: '',
    pushSent: true,
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setForm((prev) => ({ ...prev, imageUrl: reader.result as string }));
    reader.readAsDataURL(file);
  };

  const handlePublish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.body.trim()) return;
    addNotice({
      ...form,
      imageUrl: form.imageUrl || undefined,
      pushSentAt: form.pushSent ? new Date().toISOString() : undefined,
      author: session?.username ?? 'MateoD',
    });
    setForm({
      title: '',
      body: '',
      priority: 'alta',
      audience: 'todos',
      imageUrl: '',
      pushSent: true,
    });
    setModalOpen(false);
  };

  const priorityColor = (p: NoticePriority) => {
    if (p === 'alta') return 'text-red-600';
    if (p === 'media') return 'text-amber-600';
    return 'text-[#1E4B82]';
  };

  return (
    <div className="space-y-6 pb-8">
      <div className="bg-white rounded-2xl border border-slate-200/75 p-5 shadow-[0_2px_12px_-4px_rgba(13,40,78,0.06)] flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-base font-bold text-[#0D284E]">
            Cartelera Digital y Comunicados Push
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Publicá avisos segmentados por rol (Técnicos, Limpieza o Clientes) con despacho directo a la app móvil.
          </p>
        </div>

        {permissions.canPublishNotices && (
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#0D284E] hover:bg-[#1E4B82] text-white text-xs font-semibold cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5" />
            Publicar Aviso
          </button>
        )}
      </div>

      {state.notices.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/75 p-16 text-center shadow-[0_2px_12px_-4px_rgba(13,40,78,0.06)]">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <Megaphone className="w-6 h-6" />
          </div>
          <h3 className="font-display text-base font-semibold text-[#0D284E]">
            No hay comunicados publicados
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            Emití avisos de seguridad, protocolos de ingreso en edificios o novedades operativas con notificación push.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {state.notices.map((notice) => (
            <article
              key={notice.id}
              className="bg-white rounded-2xl border border-slate-200/75 p-6 shadow-[0_2px_12px_-4px_rgba(13,40,78,0.06)] flex flex-col justify-between gap-4"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="text-xs text-slate-500 flex items-center gap-2">
                    <span className={`font-bold uppercase ${priorityColor(notice.priority)}`}>
                      Prioridad {notice.priority}
                    </span>
                    <span>·</span>
                    <span className="capitalize">Audiencia: {notice.audience}</span>
                  </div>
                  {permissions.canPublishNotices && (
                    <button
                      type="button"
                      onClick={() => deleteNotice(notice.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <h3 className="font-display text-base font-bold text-[#0D284E] mt-2">
                  {notice.title}
                </h3>

                {notice.imageUrl && (
                  <img
                    src={notice.imageUrl}
                    alt={notice.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-44 object-cover rounded-xl mt-3 border border-slate-100"
                  />
                )}

                <p className="text-xs text-slate-600 leading-relaxed mt-3 whitespace-pre-line">
                  {notice.body}
                </p>
              </div>

              <div className="pt-3.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                <span>
                  Publicado por {notice.author} ·{' '}
                  {new Date(notice.createdAt).toLocaleDateString('es-UY')}
                </span>
                {notice.pushSent && (
                  <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold">
                    <Bell className="w-3 h-3" /> Push enviado
                  </span>
                )}
              </div>
            </article>
          ))}
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-[#0D284E]/45 backdrop-blur-xs flex items-center justify-center p-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-display text-base font-bold text-[#0D284E]">
                Nuevo Comunicado en Cartelera Digital
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handlePublish} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Título *</label>
                <input
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Prioridad</label>
                  <select
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: e.target.value as NoticePriority })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white"
                  >
                    <option value="alta">Alta</option>
                    <option value="media">Media</option>
                    <option value="baja">Baja</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Segmentación por Rol</label>
                  <select
                    value={form.audience}
                    onChange={(e) => setForm({ ...form, audience: e.target.value as NoticeAudience })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white"
                  >
                    <option value="todos">Todo el equipo</option>
                    <option value="tecnicos">Solo Técnicos</option>
                    <option value="limpieza">Solo Limpieza</option>
                    <option value="clientes">Solo Clientes</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Mensaje *</label>
                <textarea
                  required
                  rows={4}
                  value={form.body}
                  onChange={(e) => setForm({ ...form, body: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <div className="flex items-center justify-between">
                <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-[#0D284E] hover:bg-slate-50 cursor-pointer">
                  <Upload className="w-3.5 h-3.5" />
                  Adjuntar imagen
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </label>

                <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.pushSent}
                    onChange={(e) => setForm({ ...form, pushSent: e.target.checked })}
                  />
                  Enviar notificación push móvil
                </label>
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
                  Publicar Aviso
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
