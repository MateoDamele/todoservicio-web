import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type {
  ApprovalRequest,
  CalendarAssignment,
  Company,
  GpsLog,
  NoticeItem,
  ServiceCategory,
  SiteLocation,
  StaffMember,
  TodoservicioState,
  UserRole,
  UserSession,
  WorkOrder,
} from '../types/todoservicio';
import { getSavedSupabaseConfig, getSupabaseClient } from './supabaseClient';

const STATE_STORAGE_KEY = 'todoservicio_erp_state_v1';
const SESSION_STORAGE_KEY = 'todoservicio_session_v1';
const BROADCAST_CHANNEL_NAME = 'todoservicio_realtime_sync_v1';

const EMPTY_STATE: TodoservicioState = {
  companies: [],
  sites: [],
  staff: [],
  services: [],
  assignments: [],
  gpsLogs: [],
  workOrders: [],
  approvals: [],
  notices: [],
  lastOtSequence: 0,
};

const DEFAULT_ADMIN_SESSION: UserSession = {
  id: 'usr-mateod',
  username: 'MateoD',
  fullName: 'Mateo Dámele',
  email: 'mateodamele@todoservicio.com.uy',
  role: 'admin',
  mustChangePassword: false,
  authenticatedAt: new Date().toISOString(),
};

function generateId(prefix: string): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
  }
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

export function formatOtCode(seq: number): string {
  return `OT-${String(seq).padStart(4, '0')}`;
}

// Haversine distance in meters between two GPS coordinates
export function calculateDistanceMeters(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

export interface RolePermissions {
  canManageClients: boolean;
  canManageCalendar: boolean;
  canApproveGpsAndRequests: boolean;
  canManageStaff: boolean;
  canManageCatalog: boolean;
  canPublishNotices: boolean;
  canExportReports: boolean;
  canManageWorkOrders: boolean;
}

export function getPermissionsForRole(role: UserRole): RolePermissions {
  switch (role) {
    case 'admin':
      return {
        canManageClients: true,
        canManageCalendar: true,
        canApproveGpsAndRequests: true,
        canManageStaff: true,
        canManageCatalog: true,
        canPublishNotices: true,
        canExportReports: true,
        canManageWorkOrders: true,
      };
    case 'supervisor':
      return {
        canManageClients: true,
        canManageCalendar: true,
        canApproveGpsAndRequests: true,
        canManageStaff: false,
        canManageCatalog: false,
        canPublishNotices: true,
        canExportReports: true,
        canManageWorkOrders: true,
      };
    case 'tecnico':
    case 'limpieza':
      return {
        canManageClients: false,
        canManageCalendar: false,
        canApproveGpsAndRequests: false,
        canManageStaff: false,
        canManageCatalog: false,
        canPublishNotices: false,
        canExportReports: false,
        canManageWorkOrders: true,
      };
    case 'cliente':
      return {
        canManageClients: false,
        canManageCalendar: false,
        canApproveGpsAndRequests: false,
        canManageStaff: false,
        canManageCatalog: false,
        canPublishNotices: false,
        canExportReports: true,
        canManageWorkOrders: false,
      };
  }
}

interface DataContextValue {
  state: TodoservicioState;
  session: UserSession | null;
  permissions: RolePermissions;
  realtimeMode: 'supabase' | 'local-broadcast';
  lastSyncAt: string;
  // Auth & RBAC
  login: (username: string, role?: UserRole) => void;
  logout: () => void;
  switchRolePreview: (role: UserRole) => void;
  // Companies & Sites
  addCompany: (data: Omit<Company, 'id' | 'createdAt'>) => Company;
  updateCompany: (id: string, patch: Partial<Company>) => void;
  deleteCompany: (id: string) => void;
  addSite: (data: Omit<SiteLocation, 'id' | 'createdAt'>) => SiteLocation;
  updateSite: (id: string, patch: Partial<SiteLocation>) => void;
  deleteSite: (id: string) => void;
  // Staff
  addStaff: (data: Omit<StaffMember, 'id'>) => StaffMember;
  updateStaff: (id: string, patch: Partial<StaffMember>) => void;
  deleteStaff: (id: string) => void;
  // Services Catalog
  addService: (data: Omit<ServiceCategory, 'id' | 'createdAt'>) => ServiceCategory;
  updateService: (id: string, patch: Partial<ServiceCategory>) => void;
  deleteService: (id: string) => void;
  // Calendar Assignments
  addAssignment: (data: Omit<CalendarAssignment, 'id' | 'createdAt'>) => CalendarAssignment;
  updateAssignment: (id: string, patch: Partial<CalendarAssignment>) => void;
  deleteAssignment: (id: string) => void;
  // GPS Logs
  addGpsLog: (data: Omit<GpsLog, 'id' | 'distanceMeters' | 'outOfRange'>) => GpsLog;
  resolveGpsApproval: (id: string, decision: 'aprobada' | 'rechazada') => void;
  // Work Orders
  createWorkOrder: (data: Omit<WorkOrder, 'id' | 'code' | 'createdAt'>) => WorkOrder;
  updateWorkOrder: (id: string, patch: Partial<WorkOrder>) => void;
  deleteWorkOrder: (id: string) => void;
  // Approvals
  addApprovalRequest: (data: Omit<ApprovalRequest, 'id' | 'createdAt'>) => ApprovalRequest;
  resolveApproval: (id: string, decision: 'aprobada' | 'rechazada') => void;
  // Notices
  addNotice: (data: Omit<NoticeItem, 'id' | 'createdAt'>) => NoticeItem;
  deleteNotice: (id: string) => void;
  // Optional Uruguay Demo Data / Reset
  loadUruguayDemoData: () => void;
  clearAllData: () => void;
}

const DataContext = createContext<DataContextValue | null>(null);

function loadInitialState(): TodoservicioState {
  try {
    const raw = localStorage.getItem(STATE_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<TodoservicioState>;
      return {
        companies: parsed.companies ?? [],
        sites: parsed.sites ?? [],
        staff: parsed.staff ?? [],
        services: parsed.services ?? [],
        assignments: parsed.assignments ?? [],
        gpsLogs: parsed.gpsLogs ?? [],
        workOrders: parsed.workOrders ?? [],
        approvals: parsed.approvals ?? [],
        notices: parsed.notices ?? [],
        lastOtSequence: parsed.lastOtSequence ?? 0,
      };
    }
  } catch {
    // ignore corrupted cache
  }
  return EMPTY_STATE;
}

function loadInitialSession(): UserSession | null {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (raw === 'null') return null;
    if (raw) return JSON.parse(raw) as UserSession;
  } catch {
    // ignore
  }
  return DEFAULT_ADMIN_SESSION;
}

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<TodoservicioState>(loadInitialState);
  const [session, setSession] = useState<UserSession | null>(loadInitialSession);
  const [lastSyncAt, setLastSyncAt] = useState<string>(new Date().toISOString());

  const supabaseCfg = getSavedSupabaseConfig();
  const realtimeMode: 'supabase' | 'local-broadcast' = supabaseCfg.enabled ? 'supabase' : 'local-broadcast';

  const commitState = useCallback((updater: (prev: TodoservicioState) => TodoservicioState) => {
    setState((prev) => {
      const next = updater(prev);
      try {
        localStorage.setItem(STATE_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // storage quota protection
      }
      setLastSyncAt(new Date().toISOString());
      try {
        const bc = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
        bc.postMessage({ type: 'STATE_SYNC', payload: next });
        bc.close();
      } catch {
        // BroadcastChannel fallback
      }
      return next;
    });
  }, []);

  // Multi-tab & Mobile App Realtime sync listener
  useEffect(() => {
    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
      bc.onmessage = (ev) => {
        if (ev.data?.type === 'STATE_SYNC' && ev.data.payload) {
          setState(ev.data.payload as TodoservicioState);
          setLastSyncAt(new Date().toISOString());
        }
      };
    } catch {
      // ignore if unsupported
    }

    const handleStorage = (ev: StorageEvent) => {
      if (ev.key === STATE_STORAGE_KEY && ev.newValue) {
        try {
          setState(JSON.parse(ev.newValue) as TodoservicioState);
          setLastSyncAt(new Date().toISOString());
        } catch {
          // ignore
        }
      }
    };
    window.addEventListener('storage', handleStorage);

    // Optional live Supabase Realtime channel if configured
    const sb = getSupabaseClient();
    const channel = sb
      ? sb
          .channel('todoservicio-ops-realtime')
          .on('postgres_changes', { event: '*', schema: 'public' }, () => {
            setLastSyncAt(new Date().toISOString());
          })
          .subscribe()
      : null;

    return () => {
      bc?.close();
      window.removeEventListener('storage', handleStorage);
      if (channel && sb) {
        void sb.removeChannel(channel);
      }
    };
  }, []);

  const login = useCallback((username: string, role: UserRole = 'admin') => {
    const cleanUser = username.trim() || 'MateoD';
    const nextSession: UserSession = {
      id: cleanUser.toLowerCase() === 'mateod' ? 'usr-mateod' : generateId('usr'),
      username: cleanUser,
      fullName: cleanUser.toLowerCase() === 'mateod' ? 'Mateo Dámele' : cleanUser,
      email:
        cleanUser.toLowerCase() === 'mateod'
          ? 'mateodamele@todoservicio.com.uy'
          : `${cleanUser.toLowerCase().replace(/\s+/g, '.')}@todoservicio.com.uy`,
      role,
      mustChangePassword: false,
      authenticatedAt: new Date().toISOString(),
    };
    setSession(nextSession);
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(nextSession));
  }, []);

  const logout = useCallback(() => {
    setSession(null);
    localStorage.setItem(SESSION_STORAGE_KEY, 'null');
  }, []);

  const switchRolePreview = useCallback((role: UserRole) => {
    setSession((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, role };
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  // Companies
  const addCompany = useCallback(
    (data: Omit<Company, 'id' | 'createdAt'>): Company => {
      const created: Company = { ...data, id: generateId('emp'), createdAt: new Date().toISOString() };
      commitState((prev) => ({ ...prev, companies: [created, ...prev.companies] }));
      return created;
    },
    [commitState]
  );

  const updateCompany = useCallback(
    (id: string, patch: Partial<Company>) => {
      commitState((prev) => ({
        ...prev,
        companies: prev.companies.map((c) => (c.id === id ? { ...c, ...patch } : c)),
      }));
    },
    [commitState]
  );

  const deleteCompany = useCallback(
    (id: string) => {
      commitState((prev) => ({
        ...prev,
        companies: prev.companies.filter((c) => c.id !== id),
        sites: prev.sites.filter((s) => s.companyId !== id),
      }));
    },
    [commitState]
  );

  // Sites
  const addSite = useCallback(
    (data: Omit<SiteLocation, 'id' | 'createdAt'>): SiteLocation => {
      const created: SiteLocation = { ...data, id: generateId('sede'), createdAt: new Date().toISOString() };
      commitState((prev) => ({ ...prev, sites: [created, ...prev.sites] }));
      return created;
    },
    [commitState]
  );

  const updateSite = useCallback(
    (id: string, patch: Partial<SiteLocation>) => {
      commitState((prev) => ({
        ...prev,
        sites: prev.sites.map((s) => (s.id === id ? { ...s, ...patch } : s)),
      }));
    },
    [commitState]
  );

  const deleteSite = useCallback(
    (id: string) => {
      commitState((prev) => ({
        ...prev,
        sites: prev.sites.filter((s) => s.id !== id),
      }));
    },
    [commitState]
  );

  // Staff
  const addStaff = useCallback(
    (data: Omit<StaffMember, 'id'>): StaffMember => {
      const created: StaffMember = { ...data, id: generateId('per') };
      commitState((prev) => ({ ...prev, staff: [created, ...prev.staff] }));
      return created;
    },
    [commitState]
  );

  const updateStaff = useCallback(
    (id: string, patch: Partial<StaffMember>) => {
      commitState((prev) => ({
        ...prev,
        staff: prev.staff.map((m) => (m.id === id ? { ...m, ...patch } : m)),
      }));
    },
    [commitState]
  );

  const deleteStaff = useCallback(
    (id: string) => {
      commitState((prev) => ({
        ...prev,
        staff: prev.staff.filter((m) => m.id !== id),
      }));
    },
    [commitState]
  );

  // Services Catalog
  const addService = useCallback(
    (data: Omit<ServiceCategory, 'id' | 'createdAt'>): ServiceCategory => {
      const created: ServiceCategory = { ...data, id: generateId('srv'), createdAt: new Date().toISOString() };
      commitState((prev) => ({ ...prev, services: [created, ...prev.services] }));
      return created;
    },
    [commitState]
  );

  const updateService = useCallback(
    (id: string, patch: Partial<ServiceCategory>) => {
      commitState((prev) => ({
        ...prev,
        services: prev.services.map((s) => (s.id === id ? { ...s, ...patch } : s)),
      }));
    },
    [commitState]
  );

  const deleteService = useCallback(
    (id: string) => {
      commitState((prev) => ({
        ...prev,
        services: prev.services.filter((s) => s.id !== id),
      }));
    },
    [commitState]
  );

  // Calendar Assignments
  const addAssignment = useCallback(
    (data: Omit<CalendarAssignment, 'id' | 'createdAt'>): CalendarAssignment => {
      const created: CalendarAssignment = { ...data, id: generateId('cal'), createdAt: new Date().toISOString() };
      commitState((prev) => ({ ...prev, assignments: [created, ...prev.assignments] }));
      return created;
    },
    [commitState]
  );

  const updateAssignment = useCallback(
    (id: string, patch: Partial<CalendarAssignment>) => {
      commitState((prev) => ({
        ...prev,
        assignments: prev.assignments.map((a) => (a.id === id ? { ...a, ...patch } : a)),
      }));
    },
    [commitState]
  );

  const deleteAssignment = useCallback(
    (id: string) => {
      commitState((prev) => ({
        ...prev,
        assignments: prev.assignments.filter((a) => a.id !== id),
      }));
    },
    [commitState]
  );

  // GPS Logs
  const addGpsLog = useCallback(
    (data: Omit<GpsLog, 'id' | 'distanceMeters' | 'outOfRange'>): GpsLog => {
      let createdLog!: GpsLog;
      commitState((prev) => {
        const site = prev.sites.find((s) => s.id === data.siteId);
        const distance = site ? calculateDistanceMeters(data.lat, data.lng, site.lat, site.lng) : 0;
        const outOfRange = site ? distance > site.geofenceRadiusMeters : false;

        createdLog = {
          ...data,
          id: generateId('gps'),
          distanceMeters: distance,
          outOfRange,
        };

        // If out of range or manual pending, create an approval item automatically
        const nextApprovals = [...prev.approvals];
        if (outOfRange || data.approvalStatus === 'pendiente') {
          const staffMember = prev.staff.find((m) => m.id === data.staffId);
          nextApprovals.unshift({
            id: generateId('apr'),
            type: 'marca_manual_gps',
            title: outOfRange
              ? `Marca fuera de rango (${distance}m) — ${staffMember?.fullName ?? 'Personal'}`
              : `Marca manual pendiente — ${staffMember?.fullName ?? 'Personal'}`,
            description: `${site?.name ?? 'Sede'} · ${data.type.toUpperCase()} ${data.manualReason ? `· ${data.manualReason}` : ''}`,
            requestedBy: staffMember?.fullName ?? data.recordedBy,
            siteId: data.siteId,
            staffId: data.staffId,
            gpsLogId: createdLog.id,
            status: 'pendiente',
            createdAt: new Date().toISOString(),
          });
        }

        return {
          ...prev,
          gpsLogs: [createdLog, ...prev.gpsLogs],
          approvals: nextApprovals,
        };
      });
      return createdLog;
    },
    [commitState]
  );

  const resolveGpsApproval = useCallback(
    (id: string, decision: 'aprobada' | 'rechazada') => {
      commitState((prev) => ({
        ...prev,
        gpsLogs: prev.gpsLogs.map((g) => (g.id === id ? { ...g, approvalStatus: decision } : g)),
        approvals: prev.approvals.map((a) => (a.gpsLogId === id ? { ...a, status: decision } : a)),
      }));
    },
    [commitState]
  );

  // Work Orders (correlative OT-0001+)
  const createWorkOrder = useCallback(
    (data: Omit<WorkOrder, 'id' | 'code' | 'createdAt'>): WorkOrder => {
      let createdOrder!: WorkOrder;
      commitState((prev) => {
        const nextSeq = prev.lastOtSequence + 1;
        createdOrder = {
          ...data,
          id: generateId('ot'),
          code: formatOtCode(nextSeq),
          createdAt: new Date().toISOString(),
        };
        return {
          ...prev,
          lastOtSequence: nextSeq,
          workOrders: [createdOrder, ...prev.workOrders],
        };
      });
      return createdOrder;
    },
    [commitState]
  );

  const updateWorkOrder = useCallback(
    (id: string, patch: Partial<WorkOrder>) => {
      commitState((prev) => ({
        ...prev,
        workOrders: prev.workOrders.map((wo) => (wo.id === id ? { ...wo, ...patch } : wo)),
      }));
    },
    [commitState]
  );

  const deleteWorkOrder = useCallback(
    (id: string) => {
      commitState((prev) => ({
        ...prev,
        workOrders: prev.workOrders.filter((wo) => wo.id !== id),
      }));
    },
    [commitState]
  );

  // Approvals
  const addApprovalRequest = useCallback(
    (data: Omit<ApprovalRequest, 'id' | 'createdAt'>): ApprovalRequest => {
      const created: ApprovalRequest = { ...data, id: generateId('apr'), createdAt: new Date().toISOString() };
      commitState((prev) => ({ ...prev, approvals: [created, ...prev.approvals] }));
      return created;
    },
    [commitState]
  );

  const resolveApproval = useCallback(
    (id: string, decision: 'aprobada' | 'rechazada') => {
      commitState((prev) => {
        const target = prev.approvals.find((a) => a.id === id);
        return {
          ...prev,
          approvals: prev.approvals.map((a) => (a.id === id ? { ...a, status: decision } : a)),
          gpsLogs: target?.gpsLogId
            ? prev.gpsLogs.map((g) => (g.id === target.gpsLogId ? { ...g, approvalStatus: decision } : g))
            : prev.gpsLogs,
        };
      });
    },
    [commitState]
  );

  // Notices
  const addNotice = useCallback(
    (data: Omit<NoticeItem, 'id' | 'createdAt'>): NoticeItem => {
      const created: NoticeItem = { ...data, id: generateId('aviso'), createdAt: new Date().toISOString() };
      commitState((prev) => ({ ...prev, notices: [created, ...prev.notices] }));
      return created;
    },
    [commitState]
  );

  const deleteNotice = useCallback(
    (id: string) => {
      commitState((prev) => ({
        ...prev,
        notices: prev.notices.filter((n) => n.id !== id),
      }));
    },
    [commitState]
  );

  // On-demand Uruguay Operational Test Scenario (explicitly invoked by user, never on boot)
  const loadUruguayDemoData = useCallback(() => {
    const today = new Date();
    const fmt = (offsetDays: number) => {
      const d = new Date(today);
      d.setDate(d.getDate() + offsetDays);
      return d.toISOString().slice(0, 10);
    };

    const demoState: TodoservicioState = {
      companies: [
        {
          id: 'emp-rudy',
          name: 'Rudy Burger',
          rut: '218492030019',
          industry: 'Gastronomía',
          contactName: 'Martín Etcheverry',
          contactPhone: '099 412 880',
          contactEmail: 'operaciones@rudyburger.com.uy',
          notes: 'Mantenimiento preventivo de extractores, eléctrica y limpieza profunda nocturna.',
          createdAt: new Date().toISOString(),
        },
        {
          id: 'emp-wtc',
          name: 'WTC Montevideo',
          rut: '214091280015',
          industry: 'Complejo Corporativo',
          contactName: 'Carolina Pereyra',
          contactPhone: '2628 4000',
          contactEmail: 'facility@wtcmontevideo.com.uy',
          notes: 'Torre 1 a 4 y Free Zone · Protocolo de ingreso por seguridad.',
          createdAt: new Date().toISOString(),
        },
        {
          id: 'emp-edif',
          name: 'Edificio Torre del Puerto',
          rut: '217731900012',
          industry: 'Propiedad Horizontal',
          contactName: 'Arq. Gonzalo Núñez',
          contactPhone: '098 721 310',
          contactEmail: 'administracion@torredelpuerto.uy',
          createdAt: new Date().toISOString(),
        },
      ],
      sites: [
        {
          id: 'sede-rudy-pocitos',
          companyId: 'emp-rudy',
          name: 'Rudy Burger — Pocitos',
          department: 'Montevideo',
          neighborhood: 'Pocitos',
          address: '26 de Marzo 3471, Montevideo',
          lat: -34.9082,
          lng: -56.1478,
          geofenceRadiusMeters: 120,
          googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=-34.9082,-56.1478',
          siteContactName: 'Lucas Bentancor',
          siteContactPhone: '099 301 450',
          createdAt: new Date().toISOString(),
        },
        {
          id: 'sede-rudy-carrasco',
          companyId: 'emp-rudy',
          name: 'Rudy Burger — Carrasco',
          department: 'Montevideo',
          neighborhood: 'Carrasco',
          address: 'Av. Alfredo Arocena 1678, Montevideo',
          lat: -34.8886,
          lng: -56.0581,
          geofenceRadiusMeters: 120,
          googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=-34.8886,-56.0581',
          siteContactName: 'Sofía Méndez',
          siteContactPhone: '099 882 119',
          createdAt: new Date().toISOString(),
        },
        {
          id: 'sede-wtc-buceo',
          companyId: 'emp-wtc',
          name: 'WTC Torre 4 — Buceo',
          department: 'Montevideo',
          neighborhood: 'Buceo',
          address: 'Av. Dr. Luis Alberto de Herrera 1248, Montevideo',
          lat: -34.9059,
          lng: -56.1364,
          geofenceRadiusMeters: 150,
          googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=-34.9059,-56.1364',
          siteContactName: 'Carolina Pereyra',
          siteContactPhone: '2628 4000',
          createdAt: new Date().toISOString(),
        },
        {
          id: 'sede-costa',
          companyId: 'emp-edif',
          name: 'Complejo Costa Urbana — Solymar',
          department: 'Canelones',
          neighborhood: 'Ciudad de la Costa',
          address: 'Av. Giannattasio Km 21, Canelones',
          lat: -34.8286,
          lng: -55.9562,
          geofenceRadiusMeters: 160,
          googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=-34.8286,-55.9562',
          siteContactName: 'Gonzalo Núñez',
          siteContactPhone: '098 721 310',
          createdAt: new Date().toISOString(),
        },
      ],
      staff: [
        {
          id: 'per-1',
          fullName: 'Rodrigo Silveira',
          documentId: '4.521.890-3',
          category: 'tecnico',
          role: 'tecnico',
          phone: '099 514 220',
          email: 'rsilveira@todoservicio.com.uy',
          emergencyContactName: 'Ana Silveira',
          emergencyContactPhone: '099 112 340',
          emergencyRelation: 'Esposa',
          username: 'rsilveira',
          mustChangePassword: false,
          active: true,
          hireDate: '2024-03-11',
          assignedZone: 'Montevideo',
        },
        {
          id: 'per-2',
          fullName: 'Valeria Techera',
          documentId: '4.819.302-1',
          category: 'limpieza',
          role: 'limpieza',
          phone: '098 441 908',
          email: 'vtechera@todoservicio.com.uy',
          emergencyContactName: 'Jorge Techera',
          emergencyContactPhone: '098 201 774',
          emergencyRelation: 'Hermano',
          username: 'vtechera',
          mustChangePassword: false,
          active: true,
          hireDate: '2024-06-01',
          assignedZone: 'Montevideo',
        },
        {
          id: 'per-3',
          fullName: 'Matías Fernández',
          documentId: '5.102.441-7',
          category: 'tecnico',
          role: 'tecnico',
          phone: '091 774 321',
          email: 'mfernandez@todoservicio.com.uy',
          emergencyContactName: 'Laura Díaz',
          emergencyContactPhone: '099 661 810',
          emergencyRelation: 'Madre',
          username: 'mfernandez',
          mustChangePassword: true,
          active: true,
          hireDate: '2025-01-15',
          assignedZone: 'Canelones',
        },
        {
          id: 'per-4',
          fullName: 'Gimena Olivera',
          documentId: '4.390.118-5',
          category: 'limpieza',
          role: 'limpieza',
          phone: '099 843 210',
          email: 'golivera@todoservicio.com.uy',
          emergencyContactName: 'Pedro Olivera',
          emergencyContactPhone: '099 102 553',
          emergencyRelation: 'Padre',
          username: 'golivera',
          mustChangePassword: false,
          active: true,
          hireDate: '2023-11-04',
          assignedZone: 'Montevideo',
        },
      ],
      services: [
        {
          id: 'srv-1',
          name: 'Limpieza Integral Corporativa',
          description: 'Mantenimiento diario de oficinas, vidrios, sanitarios y áreas comunes.',
          defaultSlaHours: 4,
          colorHex: '#10B981',
          active: true,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'srv-2',
          name: 'Electricidad & Tableros',
          description: 'Revisión de llaves térmicas, luminarias LED y circuitos trifásicos.',
          defaultSlaHours: 6,
          colorHex: '#1E4B82',
          active: true,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'srv-3',
          name: 'Aire Acondicionado / HVAC',
          description: 'Limpieza de filtros, carga de gas y mantenimiento preventivo de equipos.',
          defaultSlaHours: 12,
          colorHex: '#3B82F6',
          active: true,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'srv-4',
          name: 'Sanitaria & Plomería',
          description: 'Desobstrucción de graseras, grifería industrial y bombas de presión.',
          defaultSlaHours: 8,
          colorHex: '#F59E0B',
          active: true,
          createdAt: new Date().toISOString(),
        },
      ],
      assignments: [
        {
          id: 'cal-1',
          date: fmt(0),
          startTime: '08:00',
          endTime: '12:00',
          companyId: 'emp-wtc',
          siteId: 'sede-wtc-buceo',
          staffId: 'per-2',
          serviceId: 'srv-1',
          status: 'en_curso',
          notes: 'Piso 14 y recepción ejecutiva.',
          createdAt: new Date().toISOString(),
        },
        {
          id: 'cal-2',
          date: fmt(1),
          startTime: '09:30',
          endTime: '11:30',
          companyId: 'emp-rudy',
          siteId: 'sede-rudy-pocitos',
          staffId: 'per-1',
          serviceId: 'srv-2',
          status: 'programada',
          notes: 'Chequeo tablero de cocina antes de apertura.',
          createdAt: new Date().toISOString(),
        },
        {
          id: 'cal-3',
          date: fmt(3),
          startTime: '14:00',
          endTime: '17:00',
          companyId: 'emp-edif',
          siteId: 'sede-costa',
          staffId: 'per-3',
          serviceId: 'srv-3',
          status: 'programada',
          notes: 'Mantenimiento splits sector administración.',
          createdAt: new Date().toISOString(),
        },
      ],
      gpsLogs: [
        {
          id: 'gps-1',
          staffId: 'per-2',
          siteId: 'sede-wtc-buceo',
          type: 'entrada',
          timestamp: new Date(Date.now() - 1000 * 60 * 110).toISOString(),
          lat: -34.9061,
          lng: -56.1362,
          distanceMeters: 28,
          outOfRange: false,
          isManual: false,
          approvalStatus: 'aprobada',
          recordedBy: 'Valeria Techera (App Móvil)',
        },
        {
          id: 'gps-2',
          staffId: 'per-1',
          siteId: 'sede-rudy-pocitos',
          type: 'entrada',
          timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
          lat: -34.9084,
          lng: -56.148,
          distanceMeters: 29,
          outOfRange: false,
          isManual: false,
          approvalStatus: 'aprobada',
          recordedBy: 'Rodrigo Silveira (App Móvil)',
        },
        {
          id: 'gps-3',
          staffId: 'per-3',
          siteId: 'sede-costa',
          type: 'entrada',
          timestamp: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
          lat: -34.832,
          lng: -55.959,
          distanceMeters: 456,
          outOfRange: true,
          isManual: false,
          manualReason: 'Estacionamiento exterior por obra en acceso.',
          approvalStatus: 'pendiente',
          recordedBy: 'Matías Fernández (App Móvil)',
        },
      ],
      workOrders: [
        {
          id: 'ot-1',
          code: 'OT-0001',
          companyId: 'emp-rudy',
          siteId: 'sede-rudy-pocitos',
          staffId: 'per-1',
          serviceId: 'srv-2',
          title: 'Reemplazo de contactor trifásico en campana extractora',
          description: 'Se sustituyó contactor de 32A y se verificó consumo estable por fase.',
          status: 'completada',
          scheduledDate: fmt(-1),
          startedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
          completedAt: new Date(Date.now() - 1000 * 60 * 60 * 22).toISOString(),
          signedByName: 'Lucas Bentancor',
          rating: 5,
          clientComment: 'Excelente respuesta, quedó funcionando antes del turno noche.',
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 25).toISOString(),
        },
        {
          id: 'ot-2',
          code: 'OT-0002',
          companyId: 'emp-wtc',
          siteId: 'sede-wtc-buceo',
          staffId: 'per-2',
          serviceId: 'srv-1',
          title: 'Limpieza profunda de cristales y hall Piso 14',
          description: 'Servicio integral programado en Torre 4.',
          status: 'en_curso',
          scheduledDate: fmt(0),
          startedAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
          createdAt: new Date(Date.now() - 1000 * 60 * 100).toISOString(),
        },
      ],
      approvals: [
        {
          id: 'apr-1',
          type: 'marca_manual_gps',
          title: 'Marca fuera de rango (456m) — Matías Fernández',
          description: 'Complejo Costa Urbana — Solymar · ENTRADA · Estacionamiento exterior por obra en acceso.',
          requestedBy: 'Matías Fernández',
          siteId: 'sede-costa',
          staffId: 'per-3',
          gpsLogId: 'gps-3',
          status: 'pendiente',
          createdAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
        },
        {
          id: 'apr-2',
          type: 'solicitud_cliente_ia',
          title: 'Solicitud urgente limpieza grasera — Rudy Burger Carrasco',
          description: 'Enviada por Sofía Méndez vía Asistente Cliente para turno mañana 08:30.',
          requestedBy: 'Sofía Méndez (Rudy Burger)',
          companyId: 'emp-rudy',
          siteId: 'sede-rudy-carrasco',
          status: 'pendiente',
          createdAt: new Date(Date.now() - 1000 * 60 * 50).toISOString(),
        },
      ],
      notices: [
        {
          id: 'av-1',
          title: 'Protocolo de ingreso actualizado WTC Montevideo',
          body: 'Todo el personal técnico y de limpieza debe presentar cédula vigente en recepción de Torre 4 antes de subir a pisos corporativos.',
          priority: 'alta',
          audience: 'todos',
          pushSent: true,
          pushSentAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
          author: 'MateoD',
          createdAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
        },
      ],
      lastOtSequence: 2,
    };

    commitState(() => demoState);
  }, [commitState]);

  const clearAllData = useCallback(() => {
    commitState(() => EMPTY_STATE);
  }, [commitState]);

  const permissions = useMemo(
    () => getPermissionsForRole(session?.role ?? 'admin'),
    [session?.role]
  );

  const value: DataContextValue = {
    state,
    session,
    permissions,
    realtimeMode,
    lastSyncAt,
    login,
    logout,
    switchRolePreview,
    addCompany,
    updateCompany,
    deleteCompany,
    addSite,
    updateSite,
    deleteSite,
    addStaff,
    updateStaff,
    deleteStaff,
    addService,
    updateService,
    deleteService,
    addAssignment,
    updateAssignment,
    deleteAssignment,
    addGpsLog,
    resolveGpsApproval,
    createWorkOrder,
    updateWorkOrder,
    deleteWorkOrder,
    addApprovalRequest,
    resolveApproval,
    addNotice,
    deleteNotice,
    loadUruguayDemoData,
    clearAllData,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export function useTodoservicio(): DataContextValue {
  const ctx = useContext(DataContext);
  if (!ctx) {
    throw new Error('useTodoservicio must be used inside DataProvider');
  }
  return ctx;
}
