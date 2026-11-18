import React, { useMemo, useState } from 'react';
import { FileSpreadsheet, Download, Printer, FileText } from 'lucide-react';
import { useTodoservicio } from '../../services/dataStore';

export const ReportsView: React.FC = () => {
  const { state } = useTodoservicio();
  const [reportType, setReportType] = useState<'servicios' | 'horas'>('servicios');

  const workOrderRows = useMemo(() => {
    return state.workOrders.map((wo) => {
      const company = state.companies.find((c) => c.id === wo.companyId)?.name ?? '—';
      const site = state.sites.find((s) => s.id === wo.siteId)?.name ?? '—';
      const staff = state.staff.find((m) => m.id === wo.staffId)?.fullName ?? '—';
      const service = state.services.find((s) => s.id === wo.serviceId)?.name ?? '—';
      return {
        codigo: wo.code,
        fecha: wo.scheduledDate,
        empresa: company,
        sede: site,
        personal: staff,
        rubro: service,
        estado: wo.status,
        calificacion: wo.rating ? `${wo.rating}/5` : 'Sin calificar',
      };
    });
  }, [state.workOrders, state.companies, state.sites, state.staff, state.services]);

  const hoursRows = useMemo(() => {
    return state.staff.map((m) => {
      const logs = state.gpsLogs
        .filter((g) => g.staffId === m.id && g.approvalStatus !== 'rechazada')
        .sort((a, b) => a.timestamp.localeCompare(b.timestamp));

      let totalMinutes = 0;
      let lastIn: number | null = null;
      for (const l of logs) {
        const ts = new Date(l.timestamp).getTime();
        if (l.type === 'entrada') {
          lastIn = ts;
        } else if (l.type === 'salida' && lastIn !== null) {
          totalMinutes += Math.max(0, Math.round((ts - lastIn) / 60000));
          lastIn = null;
        }
      }

      const otsCount = state.workOrders.filter((w) => w.staffId === m.id).length;

      return {
        personal: m.fullName,
        ci: m.documentId || '—',
        categoria: m.category,
        zona: m.assignedZone,
        marcas: logs.length,
        horasCalculadas: (totalMinutes / 60).toFixed(2),
        ordenesAsignadas: otsCount,
      };
    });
  }, [state.staff, state.gpsLogs, state.workOrders]);

  const downloadCsv = () => {
    const rows = reportType === 'servicios' ? workOrderRows : hoursRows;
    if (rows.length === 0) return;

    const headers = Object.keys(rows[0]);
    const csvLines = [
      headers.join(';'),
      ...rows.map((r) =>
        headers
          .map((h) => `"${String((r as Record<string, unknown>)[h] ?? '').replace(/"/g, '""')}"`)
          .join(';')
      ),
    ];

    const blob = new Blob(['\uFEFF' + csvLines.join('\n')], {
      type: 'text/csv;charset=utf-8;',
    });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `todoservicio_${reportType}_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const downloadExcel = () => {
    const rows = reportType === 'servicios' ? workOrderRows : hoursRows;
    if (rows.length === 0) return;

    const headers = Object.keys(rows[0]);
    const tableHtml = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head><meta charset="utf-8" /></head>
      <body>
        <table border="1">
          <thead><tr>${headers.map((h) => `<th>${h.toUpperCase()}</th>`).join('')}</tr></thead>
          <tbody>
            ${rows
              .map(
                (r) =>
                  `<tr>${headers
                    .map((h) => `<td>${String((r as Record<string, unknown>)[h] ?? '')}</td>`)
                    .join('')}</tr>`
              )
              .join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([tableHtml], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `todoservicio_${reportType}_${new Date().toISOString().slice(0, 10)}.xls`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const isEmpty =
    (reportType === 'servicios' && workOrderRows.length === 0) ||
    (reportType === 'horas' && hoursRows.length === 0);

  return (
    <div className="space-y-6 pb-8">
      <div className="no-print bg-white rounded-2xl border border-slate-200/75 p-4 shadow-[0_2px_12px_-4px_rgba(13,40,78,0.06)] flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-1 p-1 bg-[#F4F7FA] rounded-xl">
          <button
            type="button"
            onClick={() => setReportType('servicios')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer whitespace-nowrap ${
              reportType === 'servicios' ? 'bg-[#0D284E] text-white' : 'text-slate-600 hover:text-[#0D284E]'
            }`}
          >
            Planilla de Servicios y OT
          </button>
          <button
            type="button"
            onClick={() => setReportType('horas')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer whitespace-nowrap ${
              reportType === 'horas' ? 'bg-[#0D284E] text-white' : 'text-slate-600 hover:text-[#0D284E]'
            }`}
          >
            Planilla de Horas Trabajadas
          </button>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={downloadExcel}
            disabled={isEmpty}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-45 disabled:cursor-not-allowed text-white text-xs font-semibold cursor-pointer whitespace-nowrap"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            Exportar Excel
          </button>
          <button
            type="button"
            onClick={downloadCsv}
            disabled={isEmpty}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 disabled:opacity-45 disabled:cursor-not-allowed text-[#0D284E] text-xs font-semibold cursor-pointer whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5" />
            CSV
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            disabled={isEmpty}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0D284E] hover:bg-[#1E4B82] disabled:opacity-45 disabled:cursor-not-allowed text-white text-xs font-semibold cursor-pointer whitespace-nowrap"
          >
            <Printer className="w-3.5 h-3.5" />
            PDF A4
          </button>
        </div>
      </div>

      <div className="print-a4-sheet bg-white rounded-2xl border border-slate-200/75 shadow-[0_2px_12px_-4px_rgba(13,40,78,0.06)] overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="font-display text-sm font-bold text-[#0D284E]">
              {reportType === 'servicios'
                ? 'Reporte Consolidado de Servicios y Órdenes de Trabajo'
                : 'Reporte de Horas Trabajadas y Cobertura de Personal'}
            </h2>
            <p className="text-[11px] text-slate-400">
              Todoservicio Uruguay · Generado el {new Date().toLocaleDateString('es-UY')}
            </p>
          </div>
        </div>

        {isEmpty ? (
          <div className="p-16 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <FileText className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-[#0D284E]">Sin datos para exportar</p>
            <p className="text-xs text-slate-500 mt-1">
              Cuando existan registros operativos en el sistema podrás descargarlos en Excel, CSV o PDF A4.
            </p>
          </div>
        ) : reportType === 'servicios' ? (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-[#F4F7FA]/60 text-[11px] font-semibold text-slate-500">
                <th className="py-3 px-5">Código</th>
                <th className="py-3 px-4">Fecha</th>
                <th className="py-3 px-4">Empresa</th>
                <th className="py-3 px-4">Sede</th>
                <th className="py-3 px-4">Personal</th>
                <th className="py-3 px-4">Rubro</th>
                <th className="py-3 px-4">Estado</th>
                <th className="py-3 px-5 text-right">Calificación</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {workOrderRows.map((r) => (
                <tr key={r.codigo}>
                  <td className="py-3 px-5 font-mono-tabular font-bold text-[#0D284E]">{r.codigo}</td>
                  <td className="py-3 px-4 font-mono-tabular text-slate-600">{r.fecha}</td>
                  <td className="py-3 px-4 font-medium text-slate-800">{r.empresa}</td>
                  <td className="py-3 px-4 text-slate-600">{r.sede}</td>
                  <td className="py-3 px-4 text-slate-700">{r.personal}</td>
                  <td className="py-3 px-4 text-slate-600">{r.rubro}</td>
                  <td className="py-3 px-4 capitalize text-slate-700">{r.estado.replace('_', ' ')}</td>
                  <td className="py-3 px-5 text-right font-mono-tabular text-slate-700">{r.calificacion}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-[#F4F7FA]/60 text-[11px] font-semibold text-slate-500">
                <th className="py-3 px-5">Personal</th>
                <th className="py-3 px-4">CI</th>
                <th className="py-3 px-4">Rol</th>
                <th className="py-3 px-4">Zona</th>
                <th className="py-3 px-4 text-right">Marcas GPS</th>
                <th className="py-3 px-4 text-right">Horas Registradas</th>
                <th className="py-3 px-5 text-right">OTs Asignadas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {hoursRows.map((r) => (
                <tr key={`${r.personal}-${r.ci}`}>
                  <td className="py-3 px-5 font-semibold text-[#0D284E]">{r.personal}</td>
                  <td className="py-3 px-4 font-mono-tabular text-slate-600">{r.ci}</td>
                  <td className="py-3 px-4 capitalize text-slate-700">{r.categoria}</td>
                  <td className="py-3 px-4 text-slate-600">{r.zona}</td>
                  <td className="py-3 px-4 text-right font-mono-tabular text-slate-700">{r.marcas}</td>
                  <td className="py-3 px-4 text-right font-mono-tabular font-semibold text-[#0D284E]">
                    {r.horasCalculadas}h
                  </td>
                  <td className="py-3 px-5 text-right font-mono-tabular text-slate-700">
                    {r.ordenesAsignadas}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
