import { 
  AppState, 
  Student, 
  User, 
  AttendanceRecord, 
  MakeUpExam, 
  HealthDocument,
  PedagogicalRecord
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

const DATA_SOURCE = 'sync' as 'sqlite' | 'http' | 'sync';

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

declare global {
  interface Window {
    initSqlJs: (config: any) => Promise<any>;
  }
}

// --- DEFAULT DATA (For Seed) ---
const DEFAULT_STATE: AppState = {
  users: [
    {
      id: 'admin1',
      name: 'Administrador Principal',
      email: 'admin@escola.com',
      password: '123',
      role: 'Admin',
      photoUrl: 'https://ui-avatars.com/api/?name=Admin&background=4f46e5&color=fff',
      allowedGrades: []
    }
  ],
  students: [], 
  attendance: [],
  documents: [],
  exams: [],
  subjects: [
    "Língua Portuguesa", "Matemática", "História", "Geografia", "Ciências", 
    "Física", "Química", "Biologia", "Inglês", "Espanhol", "Artes", 
    "Educação Física", "Filosofia", "Sociologia", "Redação", "Ensino Religioso"
  ],
  pedagogicalRecords: []
};

// --- SYNC QUEUE TYPES ---
type SyncOperation =
  | { type: 'saveStudent'; data: Student }
  | { type: 'deleteStudent'; id: string }
  | { type: 'saveUser'; data: User }
  | { type: 'deleteUser'; id: string }
  | { type: 'saveAttendance'; data: AttendanceRecord }
  | { type: 'deleteAttendance'; studentId: string; date: string }
  | { type: 'saveExam'; data: MakeUpExam }
  | { type: 'deleteExam'; id: string }
  | { type: 'updateSubjects'; data: string[] }
  | { type: 'saveDocument'; data: HealthDocument }
  | { type: 'deleteDocument'; id: string }
  | { type: 'savePedagogicalRecord'; data: PedagogicalRecord }
  | { type: 'deletePedagogicalRecord'; id: string };

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

  // System
  resetSystem(): Promise<void>;
}

function toBinString(arr: Uint8Array) {
  let u8 = new Uint8Array(arr);
  let b64encoded = btoa(String.fromCharCode.apply(null, u8 as any));
  return b64encoded;
}

function fromBinString(b64Encoded: string) {
  let binaryString = atob(b64Encoded);
  let bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// --- SQLITE IMPLEMENTATION ---
class SqliteApi implements ApiService {
  private db: any = null;
  private initPromise: Promise<void> | null = null;
  private STORAGE_KEY_DB = 'escola360_sqlite_db';

  constructor() {
    this.initPromise = this.init();
  }

  private async init() {
    if (this.db) return;
    if (!window.initSqlJs) {
      console.error("SQL.js script not loaded in index.html");
      return;
    }
    try {
        const SQL = await window.initSqlJs({
          locateFile: (file: string) => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${file}`
        });

        const savedDb = localStorage.getItem(this.STORAGE_KEY_DB);
        if (savedDb) {
          try {
            const binary = fromBinString(savedDb);
            this.db = new SQL.Database(binary);
          } catch (e) {
            this.db = new SQL.Database();
            this.createTables();
            this.seedData();
          }
        } else {
          this.db = new SQL.Database();
          this.createTables();
          this.seedData();
        }
    } catch (e) {
        console.error("Failed to initialize SQL.js", e);
    }
  }

  private createTables() {
    if (!this.db) return;
    this.db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY, name TEXT, email TEXT, password TEXT, role TEXT, photoUrl TEXT, allowedGrades TEXT
      );
      CREATE TABLE IF NOT EXISTS students (
        id TEXT PRIMARY KEY, name TEXT, registration TEXT, sequenceNumber TEXT, birthDate TEXT, grade TEXT, shift TEXT,
        email TEXT, photoUrl TEXT, fatherName TEXT, fatherPhone TEXT, motherName TEXT, motherPhone TEXT, guardians TEXT,
        bookStatus TEXT, peStatus TEXT, turnstileRegistered INTEGER
      );
      CREATE TABLE IF NOT EXISTS attendance (
        id TEXT PRIMARY KEY, studentId TEXT, date TEXT, status TEXT, observation TEXT
      );
      CREATE TABLE IF NOT EXISTS documents (
        id TEXT PRIMARY KEY, studentId TEXT, type TEXT, description TEXT, dateIssued TEXT
      );
      CREATE TABLE IF NOT EXISTS exams (
        id TEXT PRIMARY KEY, studentId TEXT, subject TEXT, originalDate TEXT, scheduledDate TEXT, reason TEXT, status TEXT, period TEXT
      );
      CREATE TABLE IF NOT EXISTS subjects (
        name TEXT PRIMARY KEY
      );
      CREATE TABLE IF NOT EXISTS pedagogical_records (
        id TEXT PRIMARY KEY, teacherName TEXT, weekStart TEXT, checklist TEXT, classHours TEXT, observation TEXT, missed_classes TEXT
      );
    `);
    // Migration: Add missed_classes column if it doesn't exist
    try {
        const columns = this.db.exec("PRAGMA table_info(pedagogical_records)");
        if (columns.length > 0 && columns[0].values) {
            const columnNames = columns[0].values.map((v: any) => v[1]);
            if (!columnNames.includes('missed_classes')) {
                console.log("Migrating: Adding missed_classes column...");
                this.db.run("ALTER TABLE pedagogical_records ADD COLUMN missed_classes TEXT;");
            }
        }
    } catch (e) { console.error("Migration Error:", e); }
    this.persist();
  }

  private seedData() {
    if (!this.db) return;
    try {
        const users = this.db.exec("SELECT count(*) as count FROM users");
        if (users[0].values[0][0] === 0) {
            DEFAULT_STATE.users.forEach(u => this.saveUser(u));
        }
    } catch (e) { }
    try {
        const subjects = this.db.exec("SELECT count(*) as count FROM subjects");
        if (subjects[0].values[0][0] === 0) {
            this.updateSubjects(DEFAULT_STATE.subjects);
        }
    } catch (e) { }
    this.persist();
  }

  private persist() {
    if (!this.db) return;
    try {
        const binary = this.db.export();
        const str = toBinString(binary);
        localStorage.setItem(this.STORAGE_KEY_DB, str);
    } catch(e) { }
  }

  private async query(sql: string, params: any[] = []) {
    await this.initPromise;
    if (!this.db) return [];
    try {
        const stmt = this.db.prepare(sql);
        stmt.bind(params);
        const results = [];
        while (stmt.step()) { results.push(stmt.getAsObject()); }
        stmt.free();
        return results;
    } catch (e) { return []; }
  }

  private async execute(sql: string, params: any[] = []) {
    await this.initPromise;
    if (!this.db) return;
    try {
        this.db.run(sql, params);
        this.persist();
    } catch(e) { console.error("SQLite Execute Error:", e, sql); }
  }

  public async replaceAllData(data: AppState) {
    await this.initPromise;
    if (!this.db) return;
    try {
        this.db.run("DELETE FROM users; DELETE FROM students; DELETE FROM attendance; DELETE FROM documents; DELETE FROM exams; DELETE FROM subjects; DELETE FROM pedagogical_records;");

        for (const u of data.users) {
            this.db.run("INSERT INTO users VALUES (?, ?, ?, ?, ?, ?, ?)", [u.id, u.name, u.email, u.password, u.role, u.photoUrl, JSON.stringify(u.allowedGrades)]);
        }
        for (const s of data.students) {
            this.db.run("INSERT INTO students VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", 
            [s.id, s.name, s.registration, s.sequenceNumber, s.birthDate, s.grade, s.shift, s.email, s.photoUrl,
            s.fatherName, s.fatherPhone, s.motherName, s.motherPhone, JSON.stringify(s.guardians), s.bookStatus, s.peStatus, s.turnstileRegistered ? 1 : 0]);
        }
        for (const a of data.attendance) {
            this.db.run("INSERT INTO attendance VALUES (?, ?, ?, ?, ?)", [a.id, a.studentId, a.date, a.status, a.observation || '']);
        }
        for (const d of data.documents) {
            this.db.run("INSERT INTO documents VALUES (?, ?, ?, ?, ?)", [d.id, d.studentId, d.type, d.description, d.dateIssued]);
        }
        for (const e of data.exams) {
            this.db.run("INSERT INTO exams VALUES (?, ?, ?, ?, ?, ?, ?, ?)", [e.id, e.studentId, e.subject, e.originalDate, e.scheduledDate || '', e.reason, e.status, e.period || '']);
        }
        for (const sub of data.subjects) {
            this.db.run("INSERT INTO subjects VALUES (?)", [sub]);
        }
        for (const p of data.pedagogicalRecords) {
            this.db.run("INSERT INTO pedagogical_records VALUES (?, ?, ?, ?, ?, ?, ?)",
            [p.id, p.teacherName, p.weekStart, JSON.stringify(p.checklist), JSON.stringify(p.classHours), p.observation || '', JSON.stringify(p.missedClasses || [])]);
        }
        this.persist();
    } catch (e) { console.error("Error replacing data in SQLite:", e); }
  }

  async sync(): Promise<void> { return Promise.resolve(); }

  async uploadPhoto(file: File, type: 'student' | 'user', id: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
  }

  async loadAllData(): Promise<AppState> {
    await this.initPromise;
    if (!this.db) return DEFAULT_STATE;

    const users = (await this.query("SELECT * FROM users")).map((u: any) => ({ ...u, allowedGrades: JSON.parse(u.allowedGrades || '[]') }));
    const students = (await this.query("SELECT * FROM students")).map((s: any) => ({ ...s, guardians: JSON.parse(s.guardians || '[]'), turnstileRegistered: s.turnstileRegistered === 1 }));
    const attendance = await this.query("SELECT * FROM attendance");
    const documents = await this.query("SELECT * FROM documents");
    const exams = await this.query("SELECT * FROM exams");
    const subjects = (await this.query("SELECT name FROM subjects")).map((s: any) => s.name);
    const pedagogicalRecords = (await this.query("SELECT * FROM pedagogical_records")).map((p: any) => ({
        ...p,
        checklist: JSON.parse(p.checklist || '{}'),
        classHours: JSON.parse(p.classHours || '{}'),
        missedClasses: p.missed_classes ? JSON.parse(p.missed_classes) : []
    }));

    return {
      users: users as User[],
      students: students as Student[],
      attendance: attendance as AttendanceRecord[],
      documents: documents as HealthDocument[],
      exams: exams as MakeUpExam[],
      subjects,
      pedagogicalRecords: pedagogicalRecords as PedagogicalRecord[]
    };
  }

  async login(email: string, password: string): Promise<User | null> {
    const res = await this.query("SELECT * FROM users WHERE email = ? AND password = ?", [email, password]);
    if (res.length > 0) return { ...res[0], allowedGrades: JSON.parse(res[0].allowedGrades) } as User;
    return null;
  }

  async saveStudent(student: Student): Promise<Student> {
    await this.execute(`INSERT OR REPLACE INTO students VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [student.id, student.name, student.registration, student.sequenceNumber, student.birthDate, student.grade, student.shift, student.email, student.photoUrl,
    student.fatherName, student.fatherPhone, student.motherName, student.motherPhone, JSON.stringify(student.guardians), student.bookStatus, student.peStatus, student.turnstileRegistered ? 1 : 0]);
    return student;
  }
  async deleteStudent(id: string): Promise<void> { await this.execute("DELETE FROM students WHERE id = ?", [id]); }
  async saveUser(user: User): Promise<User> {
    await this.execute(`INSERT OR REPLACE INTO users VALUES (?, ?, ?, ?, ?, ?, ?)`, [user.id, user.name, user.email, user.password, user.role, user.photoUrl, JSON.stringify(user.allowedGrades)]);
    return user;
  }
  async deleteUser(id: string): Promise<void> { await this.execute("DELETE FROM users WHERE id = ?", [id]); }
  async saveAttendance(record: AttendanceRecord): Promise<AttendanceRecord> {
    const exists = await this.query("SELECT id FROM attendance WHERE studentId = ? AND date = ?", [record.studentId, record.date]);
    if (exists.length > 0) {
      await this.execute("UPDATE attendance SET status = ?, observation = ? WHERE studentId = ? AND date = ?", [record.status, record.observation || '', record.studentId, record.date]);
      record.id = exists[0].id;
    } else {
      await this.execute("INSERT INTO attendance VALUES (?, ?, ?, ?, ?)", [record.id, record.studentId, record.date, record.status, record.observation || '']);
    }
    return record;
  }
  async deleteAttendance(studentId: string, date: string): Promise<void> { await this.execute("DELETE FROM attendance WHERE studentId = ? AND date = ?", [studentId, date]); }
  async saveExam(exam: MakeUpExam): Promise<MakeUpExam> {
    await this.execute(`INSERT OR REPLACE INTO exams VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [exam.id, exam.studentId, exam.subject, exam.originalDate, exam.scheduledDate || '', exam.reason, exam.status, exam.period || '']);
    return exam;
  }
  async deleteExam(id: string): Promise<void> { await this.execute("DELETE FROM exams WHERE id = ?", [id]); }
  async updateSubjects(subjects: string[]): Promise<string[]> {
    await this.execute("DELETE FROM subjects");
    for (const sub of subjects) await this.execute("INSERT INTO subjects (name) VALUES (?)", [sub]);
    return subjects;
  }
  async saveDocument(doc: HealthDocument): Promise<HealthDocument> {
    await this.execute(`INSERT OR REPLACE INTO documents VALUES (?, ?, ?, ?, ?)`, [doc.id, doc.studentId, doc.type, doc.description, doc.dateIssued]);
    return doc;
  }
  async deleteDocument(id: string): Promise<void> { await this.execute("DELETE FROM documents WHERE id = ?", [id]); }

  async savePedagogicalRecord(record: PedagogicalRecord): Promise<PedagogicalRecord> {
      await this.execute(`INSERT OR REPLACE INTO pedagogical_records (id, teacherName, weekStart, checklist, classHours, observation, missed_classes) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [record.id, record.teacherName, record.weekStart, JSON.stringify(record.checklist), JSON.stringify(record.classHours), record.observation || '', JSON.stringify(record.missedClasses || [])]);
      return record;
  }
  async deletePedagogicalRecord(id: string): Promise<void> { await this.execute("DELETE FROM pedagogical_records WHERE id = ?", [id]); }

  async resetSystem(): Promise<void> {
    localStorage.removeItem(this.STORAGE_KEY_DB);
    this.db = null;
    await this.init();
  }
}

// --- HTTP IMPLEMENTATION ---
class HttpApi implements ApiService {
  public async request(endpoint: string, method: string = 'GET', body?: any) {
    const headers: any = { 'Accept': 'application/json' };
    if (!(body instanceof FormData)) headers['Content-Type'] = 'application/json; charset=utf-8';
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    
    try {
        const response = await fetch(`${getApiBaseUrl()}${endpoint}`, { method, headers, mode: 'cors', body: body ? (body instanceof FormData ? body : JSON.stringify(body)) : undefined, signal: controller.signal });
        clearTimeout(timeoutId);
        if (!response.ok) throw new Error(`Erro do servidor (${response.status})`);
        return await response.json();
    } catch (networkError: any) {
        clearTimeout(timeoutId);
        const url = `${getApiBaseUrl()}${endpoint}`;
        throw new Error(`Falha ao conectar ao servidor (${url}). Verifique se o endereço está correto.`);
    }
  }

  async sync(): Promise<void> { return; }
  async uploadPhoto(file: File, type: 'student' | 'user', id: string): Promise<string> {
      const formData = new FormData(); formData.append('photo', file); formData.append('type', type); formData.append('id', id);
      const response = await this.request('/upload.php', 'POST', formData);
      return response.url;
  }
  async loadAllData(): Promise<AppState> {
    const [students, users, attendance, documents, exams, subjects, pedagogicalRecords] = await Promise.all([
        this.request('/students.php'), this.request('/users.php'), this.request('/attendance.php'),
        this.request('/documents.php'), this.request('/exams.php'), this.request('/subjects.php'),
        this.request('/pedagogical.php').catch(() => []) // Fallback for new endpoint
    ]);
    return { students, users, attendance, documents, exams, subjects, pedagogicalRecords };
  }
  async login(email: string, password: string): Promise<User | null> {
    try { return await this.request('/login.php', 'POST', { email, password }); } catch { return null; }
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
  async resetSystem(): Promise<void> { return this.request('/reset.php', 'POST'); }
}

// --- HYBRID IMPLEMENTATION ---
class HybridApi implements ApiService {
  private sqlite = new SqliteApi();
  private http = new HttpApi();
  private isOnline = navigator.onLine;

  private queue: SyncOperation[] = [];
  private QUEUE_KEY = 'escola360_sync_queue';

  constructor() {
    window.addEventListener('online', () => {
        this.isOnline = true;
        this.notifyStatus('online');
    });
    window.addEventListener('offline', () => {
        this.isOnline = false;
        this.notifyStatus('offline');
    });
    try {
        const q = localStorage.getItem(this.QUEUE_KEY);
        if (q) this.queue = JSON.parse(q);
    } catch(e) { console.error("Queue load error", e); }
  }

  private notifyStatus(status: 'online' | 'offline' | 'error') {
      window.dispatchEvent(new CustomEvent('api-sync-status', {
          detail: { status, pending: this.queue.length }
      }));
  }

  private enqueue(op: SyncOperation) {
      this.queue.push(op);
      this.persistQueue();
      this.notifyStatus(this.isOnline ? 'online' : 'offline');
  }

  private persistQueue() {
      localStorage.setItem(this.QUEUE_KEY, JSON.stringify(this.queue));
  }

  async sync(): Promise<void> {
    if (!this.isOnline) throw new Error("Sem conexão com a internet.");

    // 1. Process Queue (PUSH)
    // We clone queue to iterate. If op succeeds, we remove it from main queue.
    const opsToProcess = [...this.queue];
    const failedOps: SyncOperation[] = [];

    // Optimistic: Assume success, rebuild queue if failures occur.
    // Actually safer to remove one by one on success.

    let processedCount = 0;

    for (const op of opsToProcess) {
        try {
            switch(op.type) {
                case 'saveStudent': await this.http.saveStudent(op.data); break;
                case 'deleteStudent': await this.http.deleteStudent(op.id); break;
                case 'saveUser': await this.http.saveUser(op.data); break;
                case 'deleteUser': await this.http.deleteUser(op.id); break;
                case 'saveAttendance': await this.http.saveAttendance(op.data); break;
                case 'deleteAttendance': await this.http.deleteAttendance(op.studentId, op.date); break;
                case 'saveExam': await this.http.saveExam(op.data); break;
                case 'deleteExam': await this.http.deleteExam(op.id); break;
                case 'updateSubjects': await this.http.updateSubjects(op.data); break;
                case 'saveDocument': await this.http.saveDocument(op.data); break;
                case 'deleteDocument': await this.http.deleteDocument(op.id); break;
                case 'savePedagogicalRecord': await this.http.savePedagogicalRecord(op.data); break;
                case 'deletePedagogicalRecord': await this.http.deletePedagogicalRecord(op.id); break;
            }
            processedCount++;

            // Remove processed item from queue (find index to be safe against async modifications)
            // But since we are single threaded here, shift() works if we modify 'this.queue' directly?
            // Safer: Filter out the specific object instance.
            this.queue = this.queue.filter(q => q !== op);
            this.persistQueue();
            this.notifyStatus('online'); // Update count
        } catch (e) {
            console.error("Sync op failed", op, e);
            failedOps.push(op);
            // If network fails completely, stop trying others to save time
            if (e instanceof Error && e.message.includes("Falha ao conectar")) {
                break;
            }
        }
    }

    if (this.queue.length > 0) {
        this.notifyStatus('error');
        // Don't throw if some succeeded, but warn?
        // Let's throw to alert user, but only after trying all feasible.
        throw new Error(`Algumas alterações não puderam ser enviadas. (${this.queue.length} pendentes). Tente novamente.`);
    }

    // 2. Pull Data (PULL)
    // Only pull if queue is empty (all changes sent), otherwise we risk overwriting local changes that failed to send.
    // Wait, if queue is not empty, we already threw an error above. So if we are here, queue is empty.

    try {
        const serverData = await this.http.loadAllData();
        await this.sqlite.replaceAllData(serverData);
        this.notifyStatus('online');
    } catch (e) {
        this.notifyStatus('error');
        throw e;
    }
  }

  async uploadPhoto(file: File, type: 'student' | 'user', id: string): Promise<string> {
      if (this.isOnline) {
          try { return await this.http.uploadPhoto(file, type, id); } catch (e) { }
      }
      return await this.sqlite.uploadPhoto(file, type, id);
  }

  async loadAllData(): Promise<AppState> {
    // ALWAYS load local data first for speed and offline-first capability.
    // We do NOT pull from server automatically to prevent overwriting local changes.
    // User must explicitly click "Sync".
    this.notifyStatus(this.isOnline ? 'online' : 'offline');
    return await this.sqlite.loadAllData();
  }

  async login(email: string, password: string): Promise<User | null> {
    try { const serverUser = await this.http.login(email, password); if (serverUser) return serverUser; } catch (e) { }
    return this.sqlite.login(email, password);
  }

  // --- QUEUED OPERATIONS ---

  async saveStudent(student: Student): Promise<Student> {
    const local = await this.sqlite.saveStudent(student);
    this.enqueue({ type: 'saveStudent', data: student });
    return local;
  }
  async deleteStudent(id: string): Promise<void> {
    await this.sqlite.deleteStudent(id);
    this.enqueue({ type: 'deleteStudent', id });
  }
  async saveUser(user: User): Promise<User> {
    const local = await this.sqlite.saveUser(user);
    this.enqueue({ type: 'saveUser', data: user });
    return local;
  }
  async deleteUser(id: string): Promise<void> {
    await this.sqlite.deleteUser(id);
    this.enqueue({ type: 'deleteUser', id });
  }
  async saveAttendance(record: AttendanceRecord): Promise<AttendanceRecord> {
    const local = await this.sqlite.saveAttendance(record);
    this.enqueue({ type: 'saveAttendance', data: record });
    return local;
  }
  async deleteAttendance(studentId: string, date: string): Promise<void> {
    await this.sqlite.deleteAttendance(studentId, date);
    this.enqueue({ type: 'deleteAttendance', studentId, date });
  }
  async saveExam(exam: MakeUpExam): Promise<MakeUpExam> {
    const local = await this.sqlite.saveExam(exam);
    this.enqueue({ type: 'saveExam', data: exam });
    return local;
  }
  async deleteExam(id: string): Promise<void> {
    await this.sqlite.deleteExam(id);
    this.enqueue({ type: 'deleteExam', id });
  }
  async updateSubjects(subjects: string[]): Promise<string[]> {
    const local = await this.sqlite.updateSubjects(subjects);
    this.enqueue({ type: 'updateSubjects', data: subjects });
    return local;
  }
  async saveDocument(doc: HealthDocument): Promise<HealthDocument> {
    const local = await this.sqlite.saveDocument(doc);
    this.enqueue({ type: 'saveDocument', data: doc });
    return local;
  }
  async deleteDocument(id: string): Promise<void> {
    await this.sqlite.deleteDocument(id);
    this.enqueue({ type: 'deleteDocument', id });
  }
  async savePedagogicalRecord(record: PedagogicalRecord): Promise<PedagogicalRecord> {
      const local = await this.sqlite.savePedagogicalRecord(record);
      this.enqueue({ type: 'savePedagogicalRecord', data: record });
      return local;
  }
  async deletePedagogicalRecord(id: string): Promise<void> {
      await this.sqlite.deletePedagogicalRecord(id);
      this.enqueue({ type: 'deletePedagogicalRecord', id });
  }
  async resetSystem(): Promise<void> {
    await this.sqlite.resetSystem();
    // Do not queue reset, send immediately if possible? Or maybe we should?
    // Reset is drastic. Let's try HTTP directly.
    this.http.resetSystem().catch(e => console.warn("Sync Fail", e));
  }
}

let apiInstance: ApiService;
try {
    switch (DATA_SOURCE) {
      case 'sync': apiInstance = new HybridApi(); console.log("Hybrid Mode"); break;
      case 'sqlite': apiInstance = new SqliteApi(); console.log("SQLite Mode"); break;
      case 'http': apiInstance = new HttpApi(); console.log("HTTP Mode"); break;
      default: apiInstance = new SqliteApi(); console.log("Fallback SQLite");
    }
} catch (e) { apiInstance = new SqliteApi(); }

export const api = apiInstance;
