import React, { useState } from 'react';
import { DataProvider, useTodoservicio } from './services/dataStore';
import type { NavModuleId } from './types/todoservicio';
import { Sidebar } from './components/layout/Sidebar';
import { TopHeader } from './components/layout/TopHeader';
import { LoginView } from './components/auth/LoginView';
import { DashboardView } from './components/views/DashboardView';
import { ClientsSitesView } from './components/views/ClientsSitesView';
import { CalendarView } from './components/views/CalendarView';
import { GpsControlView } from './components/views/GpsControlView';
import { WorkOrdersView } from './components/views/WorkOrdersView';
import { StaffDossierView } from './components/views/StaffDossierView';
import { BulletinBoardView } from './components/views/BulletinBoardView';
import { ServiceCatalogView } from './components/views/ServiceCatalogView';
import { ReportsView } from './components/views/ReportsView';
import { SupabaseConfigModal } from './components/modals/SupabaseConfigModal';

const TodoservicioShell: React.FC = () => {
  const { session } = useTodoservicio();
  const [activeModule, setActiveModule] = useState<NavModuleId>('dashboard');
  const [activeSubTab, setActiveSubTab] = useState<string>('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [supabaseModalOpen, setSupabaseModalOpen] = useState<boolean>(false);

  if (!session) {
    return <LoginView />;
  }

  const handleNavigate = (module: NavModuleId, subTab?: string) => {
    setActiveModule(module);
    setActiveSubTab(subTab ?? '');
  };

  return (
    <div className="min-h-screen bg-[#F4F7FA] flex text-[#0D284E]">
      <Sidebar
        activeModule={activeModule}
        activeSubTab={activeSubTab}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((c) => !c)}
        onNavigate={handleNavigate}
      />

      <div className="flex-1 min-w-0 flex flex-col">
        <TopHeader
          activeModule={activeModule}
          onOpenSupabaseModal={() => setSupabaseModalOpen(true)}
          onNavigate={handleNavigate}
        />

        <main className="flex-1 px-7 pt-2 overflow-y-auto">
          {activeModule === 'dashboard' && <DashboardView onNavigate={handleNavigate} />}
          {activeModule === 'clients' && (
            <ClientsSitesView activeSubTab={activeSubTab} onChangeSubTab={setActiveSubTab} />
          )}
          {activeModule === 'calendar' && <CalendarView />}
          {activeModule === 'gps' && (
            <GpsControlView activeSubTab={activeSubTab} onChangeSubTab={setActiveSubTab} />
          )}
          {activeModule === 'work-orders' && (
            <WorkOrdersView activeSubTab={activeSubTab} onChangeSubTab={setActiveSubTab} />
          )}
          {activeModule === 'staff' && (
            <StaffDossierView activeSubTab={activeSubTab} onChangeSubTab={setActiveSubTab} />
          )}
          {activeModule === 'bulletin' && <BulletinBoardView />}
          {activeModule === 'catalog' && <ServiceCatalogView />}
          {activeModule === 'reports' && <ReportsView />}
        </main>
      </div>

      <SupabaseConfigModal
        open={supabaseModalOpen}
        onClose={() => setSupabaseModalOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <DataProvider>
      <TodoservicioShell />
    </DataProvider>
  );
}
