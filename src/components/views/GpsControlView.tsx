import React, { useMemo, useState } from 'react';
import {
  MapPin,
  AlertTriangle,
  Check,
  X,
  Navigation,
  ExternalLink,
  PlusCircle,
  Clock,
} from 'lucide-react';
import { useTodoservicio } from '../../services/dataStore';
import type { GpsMarkType } from '../../types/todoservicio';

interface GpsControlViewProps {
  activeSubTab: string;
  onChangeSubTab: (tab: string) => void;
}

// Linear projection calibrated for Metropolitan Montevideo & Canelones (-34.96..-34.68 lat, -56.28..-55.72 lng)
const MAP_BOUNDS = {
  minLat: -34.95,
  maxLat: -34.68,
  minLng: -56.28,
  maxLng: -55.72,
};

function projectToSvg(lat: number, lng: number): { x: number; y: number } {
  const xRatio = (lng - MAP_BOUNDS.minLng) / (MAP_BOUNDS.maxLng - MAP_BOUNDS.minLng);
  const yRatio = (MAP_BOUNDS.maxLat - lat) / (MAP_BOUNDS.maxLat - MAP_BOUNDS.minLat);
  const x = Math.max(30, Math.min(870, 30 + xRatio * 840));
  const y = Math.max(30, Math.min(430, 30 + yRatio * 400));
  return { x, y };
}

export const GpsControlView: React.FC<GpsControlViewProps> = ({ activeSubTab, onChangeSubTab }) => {
  const { state, permissions, addGpsLog, resolveGpsApproval } = useTodoservicio();

  const currentTab =
    activeSubTab === 'marcas' || activeSubTab === 'manual' ? activeSubTab : 'mapa';

  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null);
  const [filterOutOfRangeOnly, setFilterOutOfRangeOnly] = useState(false);

  // Manual Check-in Form
  const [manualForm, setManualForm] = useState({
    staffId: state.staff[0]?.id ?? '',
    siteId: state.sites[0]?.id ?? '',
    type: 'entrada' as GpsMarkType,
    latOffsetMeters: 0,
    manualReason: '',
    isManual: true,
  });

  const selectedSite = useMemo(
    () => state.sites.find((s) => s.id === selectedSiteId) ?? state.sites[0] ?? null,
    [state.sites, selectedSiteId]
  );

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const site = state.sites.find((s) => s.id === manualForm.siteId);
    if (!site || !manualForm.staffId) return;

    // Offset latitude (~111,111m per degree) to test in-range vs out-of-range geofence calculation
    const latShift = manualForm.latOffsetMeters / 111111;
    addGpsLog({
      staffId: manualForm.staffId,
      siteId: site.id,
      type: manualForm.type,
      timestamp: new Date().toISOString(),
      lat: Number((site.lat + latShift).toFixed(6)),
      lng: site.lng,
      isManual: manualForm.isManual,
      manualReason: manualForm.manualReason.trim() || undefined,
      approvalStatus: manualForm.isManual ? 'pendiente' : 'aprobada',
      recordedBy: manualForm.isManual ? 'Supervisor (Registro Manual)' : 'App Móvil (GPS)',
    });

    setManualForm((prev) => ({ ...prev, manualReason: '', latOffsetMeters: 0 }));
    onChangeSubTab('marcas');
  };

  const visibleLogs = useMemo(() => {
    return filterOutOfRangeOnly ? state.gpsLogs.filter((g) => g.outOfRange) : state.gpsLogs;
  }, [state.gpsLogs, filterOutOfRangeOnly]);

  const referenceLandmarks = [
    { name: 'Ciudad Vieja', lat: -34.9065, lng: -56.2055 },
    { name: 'Centro', lat: -34.9058, lng: -56.185 },
    { name: 'Pocitos / WTC', lat: -34.907, lng: -56.142 },
    { name: 'Carrasco', lat: -34.8886, lng: -56.0581 },
    { name: 'Ciudad de la Costa', lat: -34.8286, lng: -55.9562 },
    { name: 'Las Piedras', lat: -34.7289, lng: -56.2191 },
    { name: 'Pando', lat: -34.7172, lng: -55.9584 },
    { name: 'Atlántida', lat: -34.7719, lng: -55.7584 },
  ];

  return (
    <div className="space-y-6 pb-8">
      {/* Sub-navigation bar */}
      <div className="bg-white rounded-2xl border border-slate-200/75 p-4 shadow-[0_2px_12px_-4px_rgba(13,40,78,0.06)] flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-1 p-1 bg-[#F4F7FA] rounded-xl">
          <button
            type="button"
            onClick={() => onChangeSubTab('mapa')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer whitespace-nowrap ${
              currentTab === 'mapa' ? 'bg-[#0D284E] text-white' : 'text-slate-600 hover:text-[#0D284E]'
            }`}
          >
            Mapa en Vivo (UY)
          </button>
          <button
            type="button"
            onClick={() => onChangeSubTab('marcas')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer whitespace-nowrap ${
              currentTab === 'marcas' ? 'bg-[#0D284E] text-white' : 'text-slate-600 hover:text-[#0D284E]'
            }`}
          >
            Marcas y Geocercas ({state.gpsLogs.length})
          </button>
          <button
            type="button"
            onClick={() => onChangeSubTab('manual')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer whitespace-nowrap ${
              currentTab === 'manual' ? 'bg-[#0D284E] text-white' : 'text-slate-600 hover:text-[#0D284E]'
            }`}
          >
            Registro Manual
          </button>
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1.5">
            <Navigation className="w-3.5 h-3.5 text-[#1E4B82]" />
            Cobertura: Montevideo y Canelones
          </span>
        </div>
      </div>

      {/* TAB 1: LIVE MAP OF MONTEVIDEO & CANELONES */}
      {currentTab === 'mapa' && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          <div className="xl:col-span-8 bg-white rounded-2xl border border-slate-200/75 p-5 shadow-[0_2px_12px_-4px_rgba(13,40,78,0.06)]">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-display text-sm font-bold text-[#0D284E]">
                  Mapa Operativo Metropolitano — Montevideo y Canelones
                </h2>
                <p className="text-xs text-slate-500">
                  Geocercas de sedes activas, marcas en sitio y alertas fuera de rango
                </p>
              </div>
              <div className="flex items-center gap-4 text-[11px] text-slate-600">
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#1E4B82]" /> Sede / Geocerca
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> En rango
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Fuera de rango ⚠️
                </span>
              </div>
            </div>

            <div className="rounded-xl overflow-hidden border border-slate-200 bg-[#EAF1F8]">
              <svg viewBox="0 0 900 460" className="w-full h-auto block">
                {/* Río de la Plata coastline & land mass */}
                <rect x="0" y="0" width="900" height="460" fill="#DCE8F5" />
                <path
                  d="M 0,0 L 900,0 L 900,260 Q 740,265 620,295 Q 480,335 370,355 Q 245,380 185,375 Q 145,345 110,360 L 0,340 Z"
                  fill="#F7F9FC"
                  stroke="#CBD5E1"
                  strokeWidth="1.5"
                />

                {/* Department border Montevideo / Canelones (Arroyo Carrasco -> Toledo) */}
                <path
                  d="M 380,352 Q 355,255 310,160 Q 260,90 195,30"
                  fill="none"
                  stroke="#CBD5E1"
                  strokeDasharray="6 5"
                  strokeWidth="1.5"
                />

                {/* Major Arteries: Rambla, Av. Italia / Giannattasio, Ruta 5 */}
                <path
                  d="M 135,365 Q 270,368 410,342 Q 610,290 830,245"
                  fill="none"
                  stroke="#94A3B8"
                  strokeOpacity="0.45"
                  strokeWidth="2.5"
                />
                <path
                  d="M 165,342 L 385,305 L 550,275 L 780,225"
                  fill="none"
                  stroke="#94A3B8"
                  strokeOpacity="0.4"
                  strokeWidth="2"
                />
                <path
                  d="M 165,342 L 155,120"
                  fill="none"
                  stroke="#94A3B8"
                  strokeOpacity="0.35"
                  strokeWidth="2"
                />

                {/* Water label */}
                <text x="520" y="415" fill="#64748B" fontSize="13" fontWeight="600" letterSpacing="3">
                  RÍO DE LA PLATA
                </text>
                <text x="55" y="70" fill="#94A3B8" fontSize="11" fontWeight="600">
                  CANELONES
                </text>
                <text x="195" y="245" fill="#94A3B8" fontSize="11" fontWeight="600">
                  MONTEVIDEO
                </text>

                {/* Geographic Landmarks */}
                {referenceLandmarks.map((lm) => {
                  const pt = projectToSvg(lm.lat, lm.lng);
                  return (
                    <g key={lm.name} transform={`translate(${pt.x}, ${pt.y})`}>
                      <circle r="2.5" fill="#94A3B8" />
                      <text
                        x="6"
                        y="3"
                        fill="#64748B"
                        fontSize="10"
                        fontWeight="500"
                      >
                        {lm.name}
                      </text>
                    </g>
                  );
                })}

                {/* Site Geofences */}
                {state.sites.map((site) => {
                  const pt = projectToSvg(site.lat, site.lng);
                  const isSelected = selectedSite?.id === site.id;
                  return (
                    <g
                      key={site.id}
                      transform={`translate(${pt.x}, ${pt.y})`}
                      onClick={() => setSelectedSiteId(site.id)}
                      className="cursor-pointer"
                    >
                      <circle
                        r={isSelected ? 26 : 20}
                        fill="#1E4B82"
                        fillOpacity={isSelected ? 0.2 : 0.12}
                        stroke="#1E4B82"
                        strokeDasharray="3 3"
                        strokeWidth={isSelected ? 2 : 1.2}
                      />
                      <circle r="6" fill="#0D284E" stroke="#FFFFFF" strokeWidth="2" />
                      <text
                        y="-12"
                        textAnchor="middle"
                        fill="#0D284E"
                        fontSize="10.5"
                        fontWeight="700"
                      >
                        {site.name.split('—')[0].trim()}
                      </text>
                    </g>
                  );
                })}

                {/* Live Staff GPS Pins */}
                {state.gpsLogs.slice(0, 20).map((log) => {
                  const pt = projectToSvg(log.lat, log.lng);
                  const staffMember = state.staff.find((s) => s.id === log.staffId);
                  return (
                    <g key={log.id} transform={`translate(${pt.x}, ${pt.y})`}>
                      <circle
                        r="7"
                        fill={log.outOfRange ? '#F59E0B' : '#10B981'}
                        stroke="#FFFFFF"
                        strokeWidth="2"
                      />
                      <title>
                        {staffMember?.fullName ?? 'Personal'} ({log.type}) · {log.distanceMeters}m
                      </title>
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>

          {/* Right Inspection Panel */}
          <div className="xl:col-span-4 bg-white rounded-2xl border border-slate-200/75 p-5 shadow-[0_2px_12px_-4px_rgba(13,40,78,0.06)] space-y-5">
            <h3 className="font-display text-sm font-bold text-[#0D284E]">
              Detalle de Sede y Geocercas
            </h3>

            {state.sites.length === 0 ? (
              <div className="py-10 text-center text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
                No hay sedes registradas aún. Agregá sedes en &ldquo;Clientes y Sedes&rdquo; para visualizar sus geocercas en el mapa.
              </div>
            ) : selectedSite ? (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-[#F4F7FA] border border-slate-200/70 space-y-2">
                  <div className="font-display text-sm font-bold text-[#0D284E]">
                    {selectedSite.name}
                  </div>
                  <div className="text-xs text-slate-600">{selectedSite.address}</div>
                  <div className="text-xs text-slate-500">
                    {selectedSite.neighborhood} · {selectedSite.department}
                  </div>
                  <div className="pt-2 flex items-center justify-between text-xs border-t border-slate-200/70">
                    <span className="font-mono-tabular text-slate-600">
                      Radio: {selectedSite.geofenceRadiusMeters}m
                    </span>
                    <a
                      href={selectedSite.googleMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[#1E4B82] font-semibold hover:underline"
                    >
                      Google Maps <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>

                <div>
                  <div className="text-xs font-semibold text-slate-700 mb-2">
                    Últimas marcas en esta sede
                  </div>
                  {state.gpsLogs.filter((g) => g.siteId === selectedSite.id).length === 0 ? (
                    <p className="text-xs text-slate-400">Sin marcas GPS registradas en esta sede.</p>
                  ) : (
                    <div className="space-y-2">
                      {state.gpsLogs
                        .filter((g) => g.siteId === selectedSite.id)
                        .slice(0, 5)
                        .map((log) => {
                          const staffMember = state.staff.find((s) => s.id === log.staffId);
                          return (
                            <div
                              key={log.id}
                              className="p-2.5 rounded-xl border border-slate-200/80 flex items-center justify-between text-xs"
                            >
                              <div>
                                <div className="font-semibold text-[#0D284E]">
                                  {staffMember?.fullName ?? 'Personal'}
                                </div>
                                <div className="text-[11px] text-slate-500 capitalize">
                                  {log.type} ·{' '}
                                  {new Date(log.timestamp).toLocaleTimeString('es-UY', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </div>
                              </div>
                              <div className="text-right font-mono-tabular">
                                {log.outOfRange ? (
                                  <span className="text-amber-600 font-semibold">
                                    ⚠️ {log.distanceMeters}m
                                  </span>
                                ) : (
                                  <span className="text-emerald-600 font-semibold">
                                    {log.distanceMeters}m
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* TAB 2: MARKS & GEOFENCES TABLE */}
      {currentTab === 'marcas' && (
        <div className="bg-white rounded-2xl border border-slate-200/75 shadow-[0_2px_12px_-4px_rgba(13,40,78,0.06)] overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-display text-sm font-bold text-[#0D284E]">
              Historial de Marcas Entrada / Salida y Alertas de Geocerca
            </h2>
            <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-600 cursor-pointer">
              <input
                type="checkbox"
                checked={filterOutOfRangeOnly}
                onChange={(e) => setFilterOutOfRangeOnly(e.target.checked)}
                className="rounded border-slate-300"
              />
              Solo alertas fuera de rango ⚠️
            </label>
          </div>

          {visibleLogs.length === 0 ? (
            <div className="p-16 text-center">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                <Clock className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-[#0D284E]">Sin registros de asistencia GPS</p>
              <p className="text-xs text-slate-500 mt-1">
                Las marcas de Entrada y Salida desde la app móvil o el Registro Manual aparecerán aquí en tiempo real.
              </p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-[#F4F7FA]/60 text-[11px] font-semibold text-slate-500">
                  <th className="py-3.5 px-5">Personal</th>
                  <th className="py-3.5 px-4">Sede</th>
                  <th className="py-3.5 px-4">Marca</th>
                  <th className="py-3.5 px-4">Fecha y Hora</th>
                  <th className="py-3.5 px-4">Distancia Geocerca</th>
                  <th className="py-3.5 px-4">Estado</th>
                  <th className="py-3.5 px-5 text-right">Revisión</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {visibleLogs.map((log) => {
                  const staffMember = state.staff.find((s) => s.id === log.staffId);
                  const site = state.sites.find((s) => s.id === log.siteId);
                  return (
                    <tr key={log.id} className="hover:bg-slate-50/70">
                      <td className="py-3.5 px-5">
                        <div className="font-semibold text-[#0D284E]">
                          {staffMember?.fullName ?? 'Personal'}
                        </div>
                        <div className="text-[11px] text-slate-400">{log.recordedBy}</div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700">{site?.name ?? 'Sede'}</td>
                      <td className="py-3.5 px-4 uppercase font-semibold text-[#0D284E]">
                        {log.type}
                      </td>
                      <td className="py-3.5 px-4 font-mono-tabular text-slate-600">
                        {new Date(log.timestamp).toLocaleString('es-UY', {
                          day: '2-digit',
                          month: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-3.5 px-4 font-mono-tabular">
                        {log.outOfRange ? (
                          <span className="inline-flex items-center gap-1 text-amber-700 font-semibold">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            Fuera de rango ({log.distanceMeters}m)
                          </span>
                        ) : (
                          <span className="text-emerald-600 font-semibold">
                            En rango ({log.distanceMeters}m)
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 capitalize font-semibold">
                        <span
                          className={
                            log.approvalStatus === 'aprobada'
                              ? 'text-emerald-600'
                              : log.approvalStatus === 'rechazada'
                              ? 'text-red-600'
                              : 'text-amber-600'
                          }
                        >
                          {log.approvalStatus}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        {log.approvalStatus === 'pendiente' && permissions.canApproveGpsAndRequests ? (
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => resolveGpsApproval(log.id, 'aprobada')}
                              className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 cursor-pointer"
                              title="Aprobar marca"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => resolveGpsApproval(log.id, 'rechazada')}
                              className="p-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 cursor-pointer"
                              title="Rechazar marca"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* TAB 3: MANUAL REGISTRATION */}
      {currentTab === 'manual' && (
        <div className="bg-white rounded-2xl border border-slate-200/75 p-6 shadow-[0_2px_12px_-4px_rgba(13,40,78,0.06)] max-w-2xl">
          <div className="flex items-center gap-2.5 mb-4">
            <PlusCircle className="w-5 h-5 text-[#0D284E]" />
            <h2 className="font-display text-base font-bold text-[#0D284E]">
              Registro Manual de Entrada / Salida
            </h2>
          </div>

          {state.staff.length === 0 || state.sites.length === 0 ? (
            <div className="p-8 text-center rounded-xl border border-dashed border-slate-200 text-xs text-slate-500">
              Para registrar marcas manuales primero necesitás cargar al menos 1 sede y 1 miembro del personal.
            </div>
          ) : (
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Personal *</label>
                  <select
                    required
                    value={manualForm.staffId}
                    onChange={(e) => setManualForm({ ...manualForm, staffId: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs bg-white"
                  >
                    {state.staff.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.fullName} ({m.category})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Sede *</label>
                  <select
                    required
                    value={manualForm.siteId}
                    onChange={(e) => setManualForm({ ...manualForm, siteId: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs bg-white"
                  >
                    {state.sites.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} (Geocerca {s.geofenceRadiusMeters}m)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tipo de Marca</label>
                  <select
                    value={manualForm.type}
                    onChange={(e) => setManualForm({ ...manualForm, type: e.target.value as GpsMarkType })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs bg-white"
                  >
                    <option value="entrada">Entrada a sitio</option>
                    <option value="salida">Salida de sitio</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Desvío GPS respecto a la sede (metros)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={5000}
                    value={manualForm.latOffsetMeters}
                    onChange={(e) =>
                      setManualForm({ ...manualForm, latOffsetMeters: Number(e.target.value) })
                    }
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-mono-tabular"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Motivo / Observación
                </label>
                <input
                  value={manualForm.manualReason}
                  onChange={(e) => setManualForm({ ...manualForm, manualReason: e.target.value })}
                  placeholder="Ej. Sin señal de GPS en subsuelo / olvido de marcación"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs"
                />
              </div>

              <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={manualForm.isManual}
                  onChange={(e) => setManualForm({ ...manualForm, isManual: e.target.checked })}
                />
                Requiere validación en &ldquo;Pendientes de Aprobación&rdquo;
              </label>

              <div className="pt-2">
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0D284E] hover:bg-[#1E4B82] text-white text-xs font-semibold cursor-pointer"
                >
                  <MapPin className="w-3.5 h-3.5" />
                  Registrar Marca
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
};
