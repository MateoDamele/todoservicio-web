export type NavModuleId =
  | 'dashboard'
  | 'clients'
  | 'calendar'
  | 'gps'
  | 'work-orders'
  | 'staff'
  | 'bulletin'
  | 'catalog'
  | 'reports';

export type SubViewTab = string;

export type UserRole = 'admin' | 'supervisor' | 'tecnico' | 'limpieza' | 'cliente';

export interface UserSession {
  id: string;
  username: string;
  fullName: string;
  email: string;
  role: UserRole;
  mustChangePassword?: boolean;
  authenticatedAt: string;
}

export interface Company {
  id: string;
  name: string;
  rut: string;
  industry: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  notes?: string;
  createdAt: string;
}

export type DepartmentUY = 'Montevideo' | 'Canelones';

export interface SiteLocation {
  id: string;
  companyId: string;
  name: string;
  department: DepartmentUY;
  neighborhood: string;
  address: string;
  lat: number;
  lng: number;
  geofenceRadiusMeters: number;
  googleMapsUrl: string;
  siteContactName: string;
  siteContactPhone: string;
  createdAt: string;
}

export type StaffCategory = 'tecnico' | 'limpieza' | 'supervisor';

export interface StaffMember {
  id: string;
  fullName: string;
  documentId: string; // Cédula de Identidad UY
  category: StaffCategory;
  role: UserRole;
  phone: string;
  email: string;
  avatarUrl?: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyRelation: string;
  username: string;
  mustChangePassword: boolean;
  active: boolean;
  hireDate: string;
  assignedZone: DepartmentUY;
}

export interface ServiceCategory {
  id: string;
  name: string;
  description: string;
  defaultSlaHours: number;
  colorHex: string;
  active: boolean;
  createdAt: string;
}

export type AssignmentStatus = 'programada' | 'en_curso' | 'completada' | 'cancelada';

export interface CalendarAssignment {
  id: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  companyId: string;
  siteId: string;
  staffId: string;
  serviceId: string;
  status: AssignmentStatus;
  notes?: string;
  createdAt: string;
}

export type GpsMarkType = 'entrada' | 'salida';

export interface GpsLog {
  id: string;
  staffId: string;
  siteId: string;
  type: GpsMarkType;
  timestamp: string; // ISO
  lat: number;
  lng: number;
  distanceMeters: number;
  outOfRange: boolean;
  isManual: boolean;
  manualReason?: string;
  approvalStatus: 'aprobada' | 'pendiente' | 'rechazada';
  recordedBy: string;
}

export type WorkOrderStatus = 'pendiente' | 'en_curso' | 'completada';

export interface WorkOrder {
  id: string;
  code: string; // OT-0001, OT-0002...
  companyId: string;
  siteId: string;
  staffId: string;
  serviceId: string;
  title: string;
  description: string;
  status: WorkOrderStatus;
  scheduledDate: string;
  startedAt?: string;
  completedAt?: string;
  photoBeforeUrl?: string;
  photoAfterUrl?: string;
  signatureDataUrl?: string;
  signedByName?: string;
  rating?: number; // 1..5
  clientComment?: string;
  createdAt: string;
}

export type ApprovalType = 'solicitud_cliente_ia' | 'marca_manual_gps' | 'cambio_turno';

export interface ApprovalRequest {
  id: string;
  type: ApprovalType;
  title: string;
  description: string;
  requestedBy: string;
  companyId?: string;
  siteId?: string;
  staffId?: string;
  gpsLogId?: string;
  status: 'pendiente' | 'aprobada' | 'rechazada';
  createdAt: string;
}

export type NoticePriority = 'alta' | 'media' | 'baja';
export type NoticeAudience = 'todos' | 'tecnicos' | 'limpieza' | 'clientes';

export interface NoticeItem {
  id: string;
  title: string;
  body: string;
  priority: NoticePriority;
  audience: NoticeAudience;
  imageUrl?: string;
  pushSent: boolean;
  pushSentAt?: string;
  author: string;
  createdAt: string;
}

export interface SupabaseConnectionConfig {
  url: string;
  anonKey: string;
  enabled: boolean;
}

export interface TodoservicioState {
  companies: Company[];
  sites: SiteLocation[];
  staff: StaffMember[];
  services: ServiceCategory[];
  assignments: CalendarAssignment[];
  gpsLogs: GpsLog[];
  workOrders: WorkOrder[];
  approvals: ApprovalRequest[];
  notices: NoticeItem[];
  lastOtSequence: number;
}
