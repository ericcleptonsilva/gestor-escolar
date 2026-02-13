
export type AttendanceStatus = 'Present' | 'Absent' | 'Excused';
export type BookStatus = 'Comprou' | 'Nao Comprou' | 'Copia' | 'Livro Antigo';
export type PEStatus = 'Pendente' | 'Em Análise' | 'Aprovado' | 'Reprovado';
export type Shift = 'Manhã' | 'Tarde';

export type UserRole = 'Admin' | 'Coordinator' | 'Teacher';

// Nova tipagem para as tags de etapa/bimestre
export type AcademicPeriod = '1ª Etp' | '1ª Bi' | '2ª Etp' | '2ª Bi' | '3ª Etp' | '3ª Bi' | '4ª Etp' | '4ª Bi';

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string; // In a real app, never store plain text
  role: UserRole;
  photoUrl?: string;
  allowedGrades?: string[]; // Array of grades this user can access
  subjects?: string[]; // Disciplinas que o professor leciona
  registration?: string; // Matrícula (para professores)
}

export interface TeacherAttendanceRecord {
  id: string;
  teacherId: string;
  date: string; // YYYY-MM-DD
  status: 'Present' | 'Absent';
  time?: string; // HH:MM
  observation?: string;
}

export interface Guardian {
  id: string;
  name: string;
  phone: string;
  relation: string;
}

export interface Student {
  id: string;
  name: string;
  registration: string; // Matrícula
  sequenceNumber: string; // Número de sequência
  birthDate: string;
  grade: string; // Turma/Série
  shift: Shift;
  email: string;
  photoUrl?: string;

  // Family & Contact
  fatherName: string;
  fatherPhone: string;
  motherName: string;
  motherPhone: string;
  guardians: Guardian[]; // Outros (Tio, Avó, etc)

  // Statuses
  bookStatus: BookStatus;
  peStatus: PEStatus; // Status Atestado Educação Física
  turnstileRegistered: boolean; // Catraca
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  date: string;
  status: AttendanceStatus;
  observation?: string; // Campo de observação adicionado
}

export enum DocType {
  PHYSICAL_EDUCATION = 'Atestado Educação Física',
  MEDICAL_REPORT = 'Laudo Médico'
}

export interface HealthDocument {
  id: string;
  studentId: string;
  type: DocType;
  description: string;
  dateIssued: string;
  fileName?: string;
}

export interface MakeUpExam {
  id: string;
  studentId: string;
  subject: string;
  originalDate: string;
  scheduledDate?: string; // Agora opcional
  reason: string;
  status: 'Pending' | 'Completed' | 'Cancelled';
  period?: AcademicPeriod; // Novo campo para a tag editável
}

export interface MissedClass {
  date: string;
  time: string;
  hours?: number; // Added to track hours missed
  reason?: string;
}

export interface PedagogicalRecord {
  id: string;
  teacherName: string;
  weekStart: string; // YYYY-MM-DD of Monday
  checklist: Record<string, boolean>; // Dynamic Checklist
  classHours: {
    planned: number;
    given: number;
  };
  missedClasses?: MissedClass[]; // New field for missed hours
  observation?: string;
}

export type DeliveryType = 'Exam' | 'Plan' | 'Report' | 'Drive';
export type DeliveryStatus = 'No Prazo' | 'Antecipado' | 'Fora do prazo' | 'Em Dias' | 'Atrasado';

export interface CoordinationDelivery {
  id: string;
  teacherId: string;
  teacherName: string;
  type: DeliveryType;
  deadline?: string;
  deliveryDate?: string;
  status: DeliveryStatus;
  fileUrl?: string;
  observation?: string;
  metadata: {
    grade?: string;
    shift?: string;
    subject?: string;
    period?: string;
    week?: string;
  };
}

export interface AppState {
  users: User[];
  students: Student[];
  attendance: AttendanceRecord[];
  documents: HealthDocument[];
  exams: MakeUpExam[];
  subjects: string[];
  grades: string[];
  pedagogicalRecords: PedagogicalRecord[];
  coordinationDeliveries: CoordinationDelivery[];
  teacherAttendance: TeacherAttendanceRecord[];
}

export type ViewState = 'dashboard' | 'students' | 'attendance' | 'health' | 'exams' | 'reports' | 'users' | 'pedagogical' | 'coordination';