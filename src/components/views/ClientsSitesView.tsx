import React, { useState } from 'react';
import {
  Building2,
  MapPin,
  Plus,
  ExternalLink,
  Search,
  Trash2,
  Edit3,
  X,
  Phone,
  Mail,
} from 'lucide-react';
import { useTodoservicio } from '../../services/dataStore';
import type { Company, DepartmentUY, SiteLocation } from '../../types/todoservicio';

interface ClientsSitesViewProps {
  activeSubTab: string;
  onChangeSubTab: (tab: string) => void;
}

const NEIGHBORHOOD_PRESETS: Record<DepartmentUY, { label: string; lat: number; lng: number }[]> = {
  Montevideo: [
    { label: 'Pocitos', lat: -34.9082, lng: -56.1478 },
    { label: 'Buceo / WTC', lat: -34.9059, lng: -56.1364 },
    { label: 'Centro / 18 de Julio', lat: -34.9058, lng: -56.1913 },
    { label: 'Ciudad Vieja', lat: -34.9065, lng: -56.2055 },
    { label: 'Carrasco', lat: -34.8886, lng: -56.0581 },
    { label: 'Punta Carretas', lat: -34.9225, lng: -56.1585 },
    { label: 'Tres Cruces', lat: -34.8944, lng: -56.1656 },
    { label: 'Prado', lat: -34.8592, lng: -56.2031 },
  ],
  Canelones: [
    { label: 'Ciudad de la Costa / Solymar', lat: -34.8286, lng: -55.9562 },
    { label: 'Lagomar / Shangrilá', lat: -34.8388, lng: -55.9835 },
    { label: 'Las Piedras', lat: -34.7289, lng: -56.2191 },
    { label: 'Pando', lat: -34.7172, lng: -55.9584 },
    { label: 'Atlántida', lat: -34.7719, lng: -55.7584 },
    { label: 'Canelones Centro', lat: -34.5228, lng: -56.2778 },
  ],
};

export const ClientsSitesView: React.FC<ClientsSitesViewProps> = ({
  activeSubTab,
  onChangeSubTab,
}) => {
  const { state, permissions, addCompany, updateCompany, deleteCompany, addSite, updateSite, deleteSite } =
    useTodoservicio();

  const [search, setSearch] = useState('');
  const [selectedCompanyFilter, setSelectedCompanyFilter] = useState<string>('all');

  // Company Modal
  const [companyModalOpen, setCompanyModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [compForm, setCompForm] = useState({
    name: '',
    rut: '',
    industry: '',
    contactName: '',
    contactPhone: '',
    contactEmail: '',
    notes: '',
  });

  // Site Modal
  const [siteModalOpen, setSiteModalOpen] = useState(false);
  const [editingSite, setEditingSite] = useState<SiteLocation | null>(null);
  const [siteForm, setSiteForm] = useState({
    companyId: '',
    name: '',
    department: 'Montevideo' as DepartmentUY,
    neighborhood: 'Pocitos',
    address: '',
    lat: -34.9082,
    lng: -56.1478,
    geofenceRadiusMeters: 120,
    googleMapsUrl: '',
    siteContactName: '',
    siteContactPhone: '',
  });

  const currentTab = activeSubTab === 'sedes' ? 'sedes' : 'empresas';

  const openNewCompanyModal = () => {
    setEditingCompany(null);
    setCompForm({
      name: '',
      rut: '',
      industry: '',
      contactName: '',
      contactPhone: '',
      contactEmail: '',
      notes: '',
    });
    setCompanyModalOpen(true);
  };

  const openEditCompanyModal = (c: Company) => {
    setEditingCompany(c);
    setCompForm({
      name: c.name,
      rut: c.rut,
      industry: c.industry,
      contactName: c.contactName,
      contactPhone: c.contactPhone,
      contactEmail: c.contactEmail,
      notes: c.notes ?? '',
    });
    setCompanyModalOpen(true);
  };

  const handleSaveCompany = (e: React.FormEvent) => {
    e.preventDefault();
    if (!compForm.name.trim()) return;
    if (editingCompany) {
      updateCompany(editingCompany.id, compForm);
    } else {
      addCompany(compForm);
    }
    setCompanyModalOpen(false);
  };

  const openNewSiteModal = (presetCompanyId?: string) => {
    setEditingSite(null);
    setSiteForm({
      companyId: presetCompanyId || state.companies[0]?.id || '',
      name: '',
      department: 'Montevideo',
      neighborhood: 'Pocitos',
      address: '',
      lat: -34.9082,
      lng: -56.1478,
      geofenceRadiusMeters: 120,
      googleMapsUrl: '',
      siteContactName: '',
      siteContactPhone: '',
    });
    setSiteModalOpen(true);
  };

  const openEditSiteModal = (s: SiteLocation) => {
    setEditingSite(s);
    setSiteForm({
      companyId: s.companyId,
      name: s.name,
      department: s.department,
      neighborhood: s.neighborhood,
      address: s.address,
      lat: s.lat,
      lng: s.lng,
      geofenceRadiusMeters: s.geofenceRadiusMeters,
      googleMapsUrl: s.googleMapsUrl,
      siteContactName: s.siteContactName,
      siteContactPhone: s.siteContactPhone,
    });
    setSiteModalOpen(true);
  };

  const handleSaveSite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!siteForm.name.trim() || !siteForm.companyId) return;
    const mapsUrl =
      siteForm.googleMapsUrl.trim() ||
      `https://www.google.com/maps/search/?api=1&query=${siteForm.lat},${siteForm.lng}`;
    const payload = { ...siteForm, googleMapsUrl: mapsUrl };
    if (editingSite) {
      updateSite(editingSite.id, payload);
    } else {
      addSite(payload);
    }
    setSiteModalOpen(false);
  };

  const filteredCompanies = state.companies.filter((c) =>
    `${c.name} ${c.rut} ${c.industry}`.toLowerCase().includes(search.toLowerCase())
  );

  const filteredSites = state.sites.filter((s) => {
    const matchesCompany = selectedCompanyFilter === 'all' || s.companyId === selectedCompanyFilter;
    const matchesSearch = `${s.name} ${s.address} ${s.neighborhood} ${s.department}`
      .toLowerCase()
      .includes(search.toLowerCase());
    return matchesCompany && matchesSearch;
  });

  return (
    <div className="space-y-6 pb-8">
      {/* Toolbar */}
      <div className="bg-white rounded-2xl border border-slate-200/75 p-4 shadow-[0_2px_12px_-4px_rgba(13,40,78,0.06)] flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-1 p-1 bg-[#F4F7FA] rounded-xl">
          <button
            type="button"
            onClick={() => onChangeSubTab('empresas')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
              currentTab === 'empresas'
                ? 'bg-[#0D284E] text-white shadow-xs'
                : 'text-slate-600 hover:text-[#0D284E]'
            }`}
          >
            Empresas Matrices ({state.companies.length})
          </button>
          <button
            type="button"
            onClick={() => onChangeSubTab('sedes')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
              currentTab === 'sedes'
                ? 'bg-[#0D284E] text-white shadow-xs'
                : 'text-slate-600 hover:text-[#0D284E]'
            }`}
          >
            Sedes y Locales ({state.sites.length})
          </button>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar empresa, RUT o barrio..."
              className="pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 text-xs text-[#0D284E] w-64 focus:outline-none focus:border-[#1E4B82]"
            />
          </div>

          {currentTab === 'sedes' && state.companies.length > 0 && (
            <select
              value={selectedCompanyFilter}
              onChange={(e) => setSelectedCompanyFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs text-[#0D284E] bg-white focus:outline-none focus:border-[#1E4B82]"
            >
              <option value="all">Todas las empresas</option>
              {state.companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          )}

          {permissions.canManageClients && (
            <>
              <button
                type="button"
                onClick={openNewCompanyModal}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0D284E] hover:bg-[#1E4B82] text-white text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Nueva Empresa
              </button>
              <button
                type="button"
                onClick={() => openNewSiteModal()}
                disabled={state.companies.length === 0}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-[#0D284E] text-[#0D284E] hover:bg-[#0D284E]/5 disabled:opacity-45 disabled:cursor-not-allowed text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer"
              >
                <MapPin className="w-3.5 h-3.5" />
                Nueva Sede
              </button>
            </>
          )}
        </div>
      </div>

      {/* Content */}
      {currentTab === 'empresas' ? (
        filteredCompanies.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200/75 p-16 text-center shadow-[0_2px_12px_-4px_rgba(13,40,78,0.06)]">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <Building2 className="w-6 h-6" />
            </div>
            <h3 className="font-display text-base font-semibold text-[#0D284E]">
              Sin empresas matrices registradas
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              Registrá empresas clientes (ej. Rudy Burger, WTC Montevideo, edificios o complejos comerciales) para asociar sus locales y geocercas.
            </p>
            {permissions.canManageClients && (
              <button
                type="button"
                onClick={openNewCompanyModal}
                className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0D284E] text-white text-xs font-semibold hover:bg-[#1E4B82] cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Registrar Primera Empresa
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filteredCompanies.map((comp) => {
              const compSites = state.sites.filter((s) => s.companyId === comp.id);
              return (
                <div
                  key={comp.id}
                  className="bg-white rounded-2xl border border-slate-200/75 p-6 shadow-[0_2px_12px_-4px_rgba(13,40,78,0.06)] flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="font-display text-base font-bold text-[#0D284E]">{comp.name}</h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {comp.industry || 'Corporativo'} · RUT <span className="font-mono-tabular">{comp.rut || 'N/D'}</span>
                        </p>
                      </div>
                      {permissions.canManageClients && (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => openEditCompanyModal(comp)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-[#0D284E] hover:bg-slate-100 cursor-pointer"
                            title="Editar empresa"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteCompany(comp.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                            title="Eliminar empresa"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 pt-4 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                      <div>
                        <span className="text-slate-400">Referente:</span> {comp.contactName || 'Sin definir'}
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-mono-tabular">{comp.contactPhone || '—'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        <span className="truncate">{comp.contactEmail || '—'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCompanyFilter(comp.id);
                        onChangeSubTab('sedes');
                      }}
                      className="text-xs font-semibold text-[#1E4B82] hover:text-[#0D284E] cursor-pointer"
                    >
                      {compSites.length} {compSites.length === 1 ? 'sede vinculada' : 'sedes vinculadas'} →
                    </button>
                    {permissions.canManageClients && (
                      <button
                        type="button"
                        onClick={() => openNewSiteModal(comp.id)}
                        className="text-xs font-semibold text-[#0D284E] hover:underline cursor-pointer"
                      >
                        + Agregar sede
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : filteredSites.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/75 p-16 text-center shadow-[0_2px_12px_-4px_rgba(13,40,78,0.06)]">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
            <MapPin className="w-6 h-6" />
          </div>
          <h3 className="font-display text-base font-semibold text-[#0D284E]">
            Sin sedes o locales configurados
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            Agregá sucursales en Montevideo o Canelones con radio de geocerca y enlace directo a Google Maps.
          </p>
          {permissions.canManageClients && state.companies.length > 0 && (
            <button
              type="button"
              onClick={() => openNewSiteModal()}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0D284E] text-white text-xs font-semibold hover:bg-[#1E4B82] cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Agregar Sede
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/75 shadow-[0_2px_12px_-4px_rgba(13,40,78,0.06)] overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-[#F4F7FA]/60 text-[11px] font-semibold text-slate-500">
                <th className="py-3.5 px-5">Sede / Local</th>
                <th className="py-3.5 px-4">Empresa Matriz</th>
                <th className="py-3.5 px-4">Ubicación (UY)</th>
                <th className="py-3.5 px-4">Geocerca</th>
                <th className="py-3.5 px-4">Google Maps</th>
                <th className="py-3.5 px-5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredSites.map((site) => {
                const company = state.companies.find((c) => c.id === site.companyId);
                return (
                  <tr key={site.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-5">
                      <div className="font-semibold text-[#0D284E]">{site.name}</div>
                      <div className="text-[11px] text-slate-500">{site.address}</div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 font-medium">{company?.name ?? '—'}</td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {site.neighborhood} · {site.department}
                    </td>
                    <td className="py-3.5 px-4 font-mono-tabular text-slate-600">
                      {site.geofenceRadiusMeters}m
                    </td>
                    <td className="py-3.5 px-4">
                      <a
                        href={site.googleMapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[#1E4B82] hover:text-[#0D284E] font-semibold"
                      >
                        <span>Abrir Maps</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      {permissions.canManageClients && (
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => openEditSiteModal(site)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-[#0D284E] hover:bg-slate-100 cursor-pointer"
                            title="Editar sede"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteSite(site.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                            title="Eliminar sede"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Company Modal */}
      {companyModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#0D284E]/45 backdrop-blur-xs flex items-center justify-center p-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-display text-base font-bold text-[#0D284E]">
                {editingCompany ? 'Editar Empresa Matriz' : 'Registrar Empresa Matriz'}
              </h3>
              <button
                type="button"
                onClick={() => setCompanyModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveCompany} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Razón Social / Nombre *</label>
                  <input
                    required
                    value={compForm.name}
                    onChange={(e) => setCompForm({ ...compForm, name: e.target.value })}
                    placeholder="Ej. Rudy Burger"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#1E4B82]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">RUT Uruguay</label>
                  <input
                    value={compForm.rut}
                    onChange={(e) => setCompForm({ ...compForm, rut: e.target.value })}
                    placeholder="218492030019"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-mono-tabular focus:outline-none focus:border-[#1E4B82]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Rubro / Industria</label>
                  <input
                    value={compForm.industry}
                    onChange={(e) => setCompForm({ ...compForm, industry: e.target.value })}
                    placeholder="Gastronomía, Edificios, etc."
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#1E4B82]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Contacto Principal</label>
                  <input
                    value={compForm.contactName}
                    onChange={(e) => setCompForm({ ...compForm, contactName: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#1E4B82]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Teléfono</label>
                  <input
                    value={compForm.contactPhone}
                    onChange={(e) => setCompForm({ ...compForm, contactPhone: e.target.value })}
                    placeholder="099 ..."
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#1E4B82]"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email Corporativo</label>
                  <input
                    type="email"
                    value={compForm.contactEmail}
                    onChange={(e) => setCompForm({ ...compForm, contactEmail: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#1E4B82]"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCompanyModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#0D284E] hover:bg-[#1E4B82] text-white text-xs font-semibold cursor-pointer"
                >
                  Guardar Empresa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Site Modal */}
      {siteModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#0D284E]/45 backdrop-blur-xs flex items-center justify-center p-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-display text-base font-bold text-[#0D284E]">
                {editingSite ? 'Editar Sede / Local' : 'Nueva Sede en Montevideo o Canelones'}
              </h3>
              <button
                type="button"
                onClick={() => setSiteModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveSite} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Empresa Matriz *</label>
                  <select
                    required
                    value={siteForm.companyId}
                    onChange={(e) => setSiteForm({ ...siteForm, companyId: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:border-[#1E4B82]"
                  >
                    {state.companies.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nombre de la Sede / Sucursal *</label>
                  <input
                    required
                    value={siteForm.name}
                    onChange={(e) => setSiteForm({ ...siteForm, name: e.target.value })}
                    placeholder="Ej. Rudy Burger — Pocitos"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#1E4B82]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Departamento</label>
                  <select
                    value={siteForm.department}
                    onChange={(e) => {
                      const dept = e.target.value as DepartmentUY;
                      const preset = NEIGHBORHOOD_PRESETS[dept][0];
                      setSiteForm({
                        ...siteForm,
                        department: dept,
                        neighborhood: preset.label,
                        lat: preset.lat,
                        lng: preset.lng,
                      });
                    }}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:border-[#1E4B82]"
                  >
                    <option value="Montevideo">Montevideo</option>
                    <option value="Canelones">Canelones</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Zona / Barrio (Preset GPS)</label>
                  <select
                    value={siteForm.neighborhood}
                    onChange={(e) => {
                      const chosen = NEIGHBORHOOD_PRESETS[siteForm.department].find(
                        (p) => p.label === e.target.value
                      );
                      setSiteForm({
                        ...siteForm,
                        neighborhood: e.target.value,
                        lat: chosen?.lat ?? siteForm.lat,
                        lng: chosen?.lng ?? siteForm.lng,
                      });
                    }}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:border-[#1E4B82]"
                  >
                    {NEIGHBORHOOD_PRESETS[siteForm.department].map((p) => (
                      <option key={p.label} value={p.label}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Dirección exacta *</label>
                  <input
                    required
                    value={siteForm.address}
                    onChange={(e) => setSiteForm({ ...siteForm, address: e.target.value })}
                    placeholder="Ej. 26 de Marzo 3471, Montevideo"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#1E4B82]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Latitud</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={siteForm.lat}
                    onChange={(e) => setSiteForm({ ...siteForm, lat: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-mono-tabular focus:outline-none focus:border-[#1E4B82]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Longitud</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={siteForm.lng}
                    onChange={(e) => setSiteForm({ ...siteForm, lng: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-mono-tabular focus:outline-none focus:border-[#1E4B82]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Radio Geocerca (metros)</label>
                  <input
                    type="number"
                    min={30}
                    max={1000}
                    value={siteForm.geofenceRadiusMeters}
                    onChange={(e) =>
                      setSiteForm({ ...siteForm, geofenceRadiusMeters: Number(e.target.value) })
                    }
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-mono-tabular focus:outline-none focus:border-[#1E4B82]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Link Google Maps (opcional)</label>
                  <input
                    value={siteForm.googleMapsUrl}
                    onChange={(e) => setSiteForm({ ...siteForm, googleMapsUrl: e.target.value })}
                    placeholder="Auto-generado si se deja vacío"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-[#1E4B82]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSiteModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#0D284E] hover:bg-[#1E4B82] text-white text-xs font-semibold cursor-pointer"
                >
                  Guardar Sede
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
