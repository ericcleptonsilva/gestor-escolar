import { 
  AppState, 
  Student, 
  User, 
  AttendanceRecord, 
  MakeUpExam, 
  HealthDocument,
  PedagogicalRecord,
  CoordinationRecord
} from "../types";

// --- CONFIGURATION ---
const getEnv = (key: string) => {
  try {
    // @ts-ignore
    return (typeof process !== 'undefined' && process.env) ? process.env[key] : undefined;
  } catch (e) {
    return undefined;
  }
};

let apiBaseUrl = "http://192.168.25.77:8787/sistema_escolar_api";
try {
  const saved = localStorage.getItem('escola360_api_url');
  if (saved) apiBaseUrl = saved;
} catch (e) {
  console.warn("Could not access localStorage for API URL");
}

export const getApiBaseUrl = () => apiBaseUrl;

export const setApiBaseUrl = (url: string) => {
  apiBaseUrl = url.replace(/\/$/, '');
  localStorage.setItem('escola360_api_url', apiBaseUrl);
};

// --- INTERFACES ---
interface ApiService {
  loadAllData(): Promise<AppState>;
  login(email: string, password: string): Promise<User | null>;
  sync(): Promise<void>;
  uploadPhoto(file: File, type: 'student' | 'user', id: string): Promise<string>;

  // Students
  saveStudent(student: Student): Promise<Student>;
  deleteStudent(id: string): Promise<void>;
  
  // Users
  saveUser(user: User): Promise<User>;
  deleteUser(id: string): Promise<void>;
  
  // Attendance
  saveAttendance(record: AttendanceRecord): Promise<AttendanceRecord>;
  deleteAttendance(studentId: string, date: string): Promise<void>;
  
  // Exams
  saveExam(exam: MakeUpExam): Promise<MakeUpExam>;
  deleteExam(id: string): Promise<void>;
  updateSubjects(subjects: string[]): Promise<string[]>;

  // Documents
  saveDocument(doc: HealthDocument): Promise<HealthDocument>;
  deleteDocument(id: string): Promise<void>;

  // Pedagogical
  savePedagogicalRecord(record: PedagogicalRecord): Promise<PedagogicalRecord>;
  deletePedagogicalRecord(id: string): Promise<void>;

  // Coordination (New)
  updateGrades(grades: string[]): Promise<string[]>;
  saveCoordinationRecord(record: CoordinationRecord): Promise<CoordinationRecord>;
  deleteCoordinationRecord(id: string): Promise<void>;

  // Imports
  importStudents(students: Student[]): Promise<any>;
  importAttendance(records: AttendanceRecord[]): Promise<any>;
  importTurnstileFile(file: File): Promise<any>;
  importTurnstileFromLocal(): Promise<any>;
  batchUploadPhotos(formData: FormData): Promise<any>;

  // System
  resetSystem(): Promise<void>;
}

// --- HTTP IMPLEMENTATION (XAMPP ONLY) ---
class HttpApi implements ApiService {
  private notifyStatus(status: 'online' | 'offline' | 'error') {
      window.dispatchEvent(new CustomEvent('api-sync-status', { detail: { status } }));
  }

  private async request(endpoint: string, method: string = 'GET', body?: any) {
    const headers: any = { 'Accept': 'application/json' };
    if (!(body instanceof FormData)) headers['Content-Type'] = 'application/json; charset=utf-8';
    
    const controller = new AbortController();
    // Increased timeout to 30s to handle larger file uploads and imports
    const timeoutId = setTimeout(() => controller.abort(), 30000);
    
    try {
        const response = await fetch(`${getApiBaseUrl()}${endpoint}`, {
            method,
            headers,
            mode: 'cors',
            body: body ? (body instanceof FormData ? body : JSON.stringify(body)) : undefined,
            signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
            this.notifyStatus('error');
            throw new Error(`Erro do servidor (${response.status})`);
        }

        const data = await response.json();
        this.notifyStatus('online');
        return data;
    } catch (networkError: any) {
        clearTimeout(timeoutId);
        this.notifyStatus('offline');
        const url = `${getApiBaseUrl()}${endpoint}`;
        throw new Error(`Falha ao conectar ao servidor (${url}). Verifique se o XAMPP está rodando.`);
    }
  }

  async sync(): Promise<void> {
      // In online mode, sync is just checking connection
      try {
          await this.request('/students.php?limit=1'); // Ping
          this.notifyStatus('online');
      } catch (e) {
          this.notifyStatus('offline');
          throw e;
      }
  }

  async uploadPhoto(file: File, type: 'student' | 'user', id: string): Promise<string> {
      const formData = new FormData();
      formData.append('photo', file);
      formData.append('type', type);
      formData.append('id', id);
      const response = await this.request('/upload.php', 'POST', formData);
      return response.url;
  }

  async loadAllData(): Promise<AppState> {
    try {
        const [
            students,
            users,
            attendance,
            documents,
            exams,
            subjects,
            pedagogicalRecords,
            grades,
            coordinationRecords
        ] = await Promise.all([
            this.request('/students.php'),
            this.request('/users.php'),
            this.request('/attendance.php'),
            this.request('/documents.php'),
            this.request('/exams.php'),
            this.request('/subjects.php'),
            this.request('/pedagogical.php').catch(() => []),
            this.request('/grades.php').catch(() => []),
            this.request('/coordination.php').catch(() => [])
        ]);

        this.notifyStatus('online');
        return {
            students,
            users,
            attendance,
            documents,
            exams,
            subjects,
            pedagogicalRecords,
            grades,
            coordinationRecords
        };
    } catch (e: any) {
        this.notifyStatus('offline');
        throw e;
    }
  }

  async login(email: string, password: string): Promise<User | null> {
    try {
        return await this.request('/login.php', 'POST', { email, password });
    } catch {
        return null;
    }
  }

  async saveStudent(student: Student): Promise<Student> { return this.request('/students.php', 'POST', student); }
  async deleteStudent(id: string): Promise<void> { return this.request(`/students.php?id=${id}`, 'DELETE'); }

  async saveUser(user: User): Promise<User> { return this.request('/users.php', 'POST', user); }
  async deleteUser(id: string): Promise<void> { return this.request(`/users.php?id=${id}`, 'DELETE'); }

  async saveAttendance(record: AttendanceRecord): Promise<AttendanceRecord> { return this.request('/attendance.php', 'POST', record); }
  async deleteAttendance(studentId: string, date: string): Promise<void> { return this.request(`/attendance.php?studentId=${studentId}&date=${date}`, 'DELETE'); }

  async saveExam(exam: MakeUpExam): Promise<MakeUpExam> { return this.request('/exams.php', 'POST', exam); }
  async deleteExam(id: string): Promise<void> { return this.request(`/exams.php?id=${id}`, 'DELETE'); }

  async updateSubjects(subjects: string[]): Promise<string[]> { return this.request('/subjects.php', 'POST', { subjects }); }

  async saveDocument(doc: HealthDocument): Promise<HealthDocument> { return this.request('/documents.php', 'POST', doc); }
  async deleteDocument(id: string): Promise<void> { return this.request(`/documents.php?id=${id}`, 'DELETE'); }

  async savePedagogicalRecord(record: PedagogicalRecord): Promise<PedagogicalRecord> { return this.request('/pedagogical.php', 'POST', record); }
  async deletePedagogicalRecord(id: string): Promise<void> { return this.request(`/pedagogical.php?id=${id}`, 'DELETE'); }

  // New Coordination Methods
  async updateGrades(grades: string[]): Promise<string[]> { return this.request('/grades.php', 'POST', { grades }); }
  async saveCoordinationRecord(record: CoordinationRecord): Promise<CoordinationRecord> { return this.request('/coordination.php', 'POST', record); }
  async deleteCoordinationRecord(id: string): Promise<void> { return this.request(`/coordination.php?id=${id}`, 'DELETE'); }

  // Imports
  async importStudents(students: Student[]): Promise<any> { return this.request('/import_students.php', 'POST', students); }
  async importAttendance(records: AttendanceRecord[]): Promise<any> { return this.request('/import_attendance.php', 'POST', records); }
  async importTurnstileFile(file: File): Promise<any> {
      const formData = new FormData();
      formData.append('file', file);
      return this.request('/import_turnstile.php', 'POST', formData);
  }

  async importTurnstileFromLocal(): Promise<any> {
      const formData = new FormData();
      formData.append('source', 'local');
      return this.request('/import_turnstile.php', 'POST', formData);
  }
  async batchUploadPhotos(formData: FormData): Promise<any> { return this.request('/batch_upload.php', 'POST', formData); }

  async resetSystem(): Promise<void> { return this.request('/reset.php', 'POST'); }
}

export const api = new HttpApi();
console.log("Using XAMPP (HTTP) API Mode");
