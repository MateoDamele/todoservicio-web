import React, { useState } from 'react';
import {
  LayoutDashboard,
  Building2,
  CalendarDays,
  MapPin,
  ClipboardList,
  Users,
  Megaphone,
  Wrench,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
} from 'lucide-react';
import type { NavModuleId } from '../../types/todoservicio';

interface SidebarProps {
  activeModule: NavModuleId;
  activeSubTab: string;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onNavigate: (module: NavModuleId, subTab?: string) => void;
}

interface NavItemConfig {
  id: NavModuleId;
  label: string;
  icon: React.FC<{ className?: string }>;
  subItems?: { id: string; label: string }[];
}

const NAV_ITEMS: NavItemConfig[] = [
  {
    id: 'dashboard',
    label: 'Panel de Control',
    icon: LayoutDashboard,
  },
  {
    id: 'clients',
    label: 'Clientes y Sedes',
    icon: Building2,
    subItems: [
      { id: 'empresas', label: 'Empresas Matrices' },
      { id: 'sedes', label: 'Sedes y Locales' },
    ],
  },
  {
    id: 'calendar',
    label: 'Calendario Operativo',
    icon: CalendarDays,
  },
  {
    id: 'gps',
    label: 'Control de Limpieza & GPS',
    icon: MapPin,
    subItems: [
      { id: 'mapa', label: 'Mapa en Vivo (UY)' },
      { id: 'marcas', label: 'Marcas y Geocercas' },
      { id: 'manual', label: 'Registro Manual' },
    ],
  },
  {
    id: 'work-orders',
    label: 'Órdenes de Trabajo (OT)',
    icon: ClipboardList,
    subItems: [
      { id: 'todas', label: 'Repositorio OT' },
      { id: 'calificaciones', label: 'Firmas y Estrellas' },
    ],
  },
  {
    id: 'staff',
    label: 'Personal y Legajo Digital',
    icon: Users,
    subItems: [
      { id: 'todos', label: 'Nómina General' },
      { id: 'tecnicos', label: 'Técnicos' },
      { id: 'limpieza', label: 'Limpieza' },
    ],
  },
  {
    id: 'bulletin',
    label: 'Cartelera Digital',
    icon: Megaphone,
  },
  {
    id: 'catalog',
    label: 'Catálogo de Servicios',
    icon: Wrench,
  },
  {
    id: 'reports',
    label: 'Reportes y Exportación',
    icon: FileSpreadsheet,
  },
];

export const Sidebar: React.FC<SidebarProps> = ({
  activeModule,
  activeSubTab,
  collapsed,
  onToggleCollapse,
  onNavigate,
}) => {
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({
    clients: false,
    gps: false,
    'work-orders': false,
    staff: false,
  });

  const handleParentClick = (item: NavItemConfig) => {
    if (item.subItems && !collapsed) {
      setExpandedMenus((prev) => ({ ...prev, [item.id]: !prev[item.id] }));
      onNavigate(item.id, item.subItems[0].id);
    } else {
      onNavigate(item.id, item.subItems?.[0]?.id);
    }
  };

  return (
    <aside
      className={`no-print relative shrink-0 bg-white border-r border-slate-200/80 flex flex-col transition-all duration-200 select-none ${
        collapsed ? 'w-[78px]' : 'w-[264px]'
      }`}
    >
      {/* Floating Circular Collapse Toggle */}
      <button
        type="button"
        onClick={onToggleCollapse}
        aria-label={collapsed ? 'Expandir menú lateral' : 'Contraer menú lateral'}
        className="absolute -right-3.5 top-7 z-20 w-7 h-7 rounded-full bg-white border border-slate-200 shadow-sm flex items-center justify-center text-[#0D284E] hover:bg-[#0D284E] hover:text-white hover:border-[#0D284E] transition-colors cursor-pointer"
      >
        {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
      </button>

      {/* Official Brand Header */}
      <div className="px-4 pt-5 pb-4 border-b border-slate-100">
        {collapsed ? (
          <button
            type="button"
            onClick={() => onNavigate('dashboard')}
            className="w-full h-11 rounded-xl bg-[#0D284E] flex items-center justify-center shadow-sm cursor-pointer"
            title="Todoservicio"
          >
            <span className="font-display font-extrabold text-xl text-white tracking-tight">T</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onNavigate('dashboard')}
            className="w-full rounded-xl overflow-hidden bg-[#0D284E] p-1.5 shadow-sm hover:opacity-95 transition-opacity cursor-pointer text-left"
          >
            <img
              src="/assets/aistudio/Todoservicio_Logo_HD_e9dd8432.png"
              alt="Todoservicio Uruguay"
              referrerPolicy="no-referrer"
              className="w-full h-10 object-contain object-left"
            />
          </button>
        )}
      </div>

      {/* Navigation Modules */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeModule === item.id;
          const isExpanded = Boolean(expandedMenus[item.id] || (isActive && item.subItems));

          return (
            <div key={item.id}>
              <button
                type="button"
                onClick={() => handleParentClick(item)}
                title={collapsed ? item.label : undefined}
                className={`w-full flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-xl text-[13.5px] font-medium transition-all duration-150 cursor-pointer ${
                  isActive
                    ? 'bg-[#0D284E] text-white shadow-[0_4px_12px_-2px_rgba(13,40,78,0.28)]'
                    : 'text-slate-600 hover:bg-[#1E4B82]/8 hover:text-[#0D284E]'
                }`}
              >
                <span className="flex items-center gap-3 min-w-0">
                  <Icon className={`w-[18px] h-[18px] shrink-0 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                  {!collapsed && <span className="truncate whitespace-nowrap">{item.label}</span>}
                </span>

                {!collapsed && item.subItems && (
                  <ChevronDown
                    className={`w-3.5 h-3.5 shrink-0 transition-transform duration-150 ${
                      isExpanded ? 'rotate-180' : ''
                    } ${isActive ? 'text-white/80' : 'text-slate-400'}`}
                  />
                )}
              </button>

              {/* Expandable Submenus */}
              {!collapsed && item.subItems && isExpanded && (
                <div className="mt-1 ml-4 pl-3 border-l border-slate-200 space-y-0.5">
                  {item.subItems.map((sub) => {
                    const subSelected = isActive && activeSubTab === sub.id;
                    return (
                      <button
                        key={sub.id}
                        type="button"
                        onClick={() => onNavigate(item.id, sub.id)}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[12.5px] transition-colors cursor-pointer whitespace-nowrap truncate ${
                          subSelected
                            ? 'text-[#0D284E] font-semibold bg-[#1E4B82]/10'
                            : 'text-slate-500 hover:text-[#0D284E] hover:bg-slate-50'
                        }`}
                      >
                        {sub.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Clean Brand Footer */}
      <div className="px-4 py-3.5 border-t border-slate-100">
        {collapsed ? (
          <div className="text-center text-[10px] font-semibold text-slate-400 tracking-wider">UY</div>
        ) : (
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span className="font-semibold text-[#0D284E]">Todoservicio</span>
            <span>Montevideo · Canelones</span>
          </div>
        )}
      </div>
    </aside>
  );
};
