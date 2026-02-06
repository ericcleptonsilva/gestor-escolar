import { 
  AppState, 
  Student, 
  User, 
  AttendanceRecord, 
  MakeUpExam, 
  HealthDocument 
} from "../types";

// --- CONFIGURATION ---
// Safely access process.env to avoid "process is not defined" crashes in browser
const getEnv = (key: string) => {
  try {
    // @ts-ignore
    return (typeof process !== 'undefined' && process.env) ? process.env[key] : undefined;
  } catch (e) {
    return undefined;
  }
};

// --- MODOS DE DADOS ---
// 'sqlite': Apenas local (navegador). Funciona offline, mas não sincroniza com o servidor.
// 'http': Apenas remoto (requer servidor XAMPP online). Não funciona offline.
// 'sync': Híbrido (local com sincronização). O modo padrão e recomendado.
//
// **CONFIGURAÇÃO DE SINCRONIZAÇÃO AUTOMÁTICA NA INICIALIZAÇÃO**
// A linha abaixo define o modo de dados como 'sync'. Isso garante que, ao iniciar,
// o aplicativo sempre tentará se conectar ao servidor XAMPP para buscar os dados
// mais recentes. Se a conexão falhar, ele usará os dados salvos localmente,
// permitindo o uso offline.
// FIX: Used a type assertion with `const` to ensure TypeScript uses the full union type for `DATA_SOURCE`.
// This allows the switch statement to validate all cases without the compiler incorrectly narrowing the type,
// which was causing type comparison errors.
const DATA_SOURCE = 'sync' as 'sqlite' | 'http' | 'sync';


// Ajuste para 127.0.0.1 para evitar erros de DNS/IPv6 no localhost do Windows
const API_BASE_URL = "http://192.168.25.77:8787/sistema_escolar_api";

// Helper for TypeScript to recognize the sql.js window object
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
  ]
};

// --- INTERFACES ---
interface ApiService {
  loadAllData(): Promise<AppState>;
  login(email: string, password: string): Promise<User | null>;
  
  // Manual Sync Trigger
  sync(): Promise<void>;

  // Upload Photo (New)
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

  // System
  resetSystem(): Promise<void>;
}

// --- HELPER FUNCTIONS FOR BINARY STORAGE ---
function toBinString(arr: Uint8Array) {
  let u8 = new Uint8Array(arr);
  let decoder = new TextDecoder('utf8');
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

// --- SQLITE IMPLEMENTATION (Browser WASM) ---
class SqliteApi implements ApiService {
  private db: any = null;
  private initPromise: Promise<void> | null = null;
  private STORAGE_KEY_DB = 'escola360_sqlite_db';

  constructor() {
    this.initPromise = this.init();
  }

  private async init() {
    if (this.db) return;

    // Load SQL.js
    if (!window.initSqlJs) {
      console.error("SQL.js script not loaded in index.html");
      // Don't throw immediately to avoid white screen, just log
      return;
    }

    try {
        const SQL = await window.initSqlJs({
          // Locate the WASM file from CDN
          locateFile: (file: string) => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${file}`
        });

        // Try to load existing DB from LocalStorage
        const savedDb = localStorage.getItem(this.STORAGE_KEY_DB);
        
        if (savedDb) {
          try {
            const binary = fromBinString(savedDb);
            this.db = new SQL.Database(binary);
          } catch (e) {
            console.error("Failed to load saved DB, creating new one", e);
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
        id TEXT PRIMARY KEY, 
        name TEXT, 
        email TEXT, 
        password TEXT, 
        role TEXT, 
        photoUrl TEXT, 
        allowedGrades TEXT
      );
      CREATE TABLE IF NOT EXISTS students (
        id TEXT PRIMARY KEY, 
        name TEXT, 
        registration TEXT, 
        sequenceNumber TEXT, 
        birthDate TEXT, 
        grade TEXT, 
        shift TEXT, 
        email TEXT, 
        photoUrl TEXT, 
        fatherName TEXT, 
        fatherPhone TEXT, 
        motherName TEXT, 
        motherPhone TEXT, 
        guardians TEXT, 
        bookStatus TEXT, 
        peStatus TEXT, 
        turnstileRegistered INTEGER
      );
      CREATE TABLE IF NOT EXISTS attendance (
        id TEXT PRIMARY KEY, 
        studentId TEXT, 
        date TEXT, 
        status TEXT, 
        observation TEXT
      );
      CREATE TABLE IF NOT EXISTS documents (
        id TEXT PRIMARY KEY, 
        studentId TEXT, 
        type TEXT, 
        description TEXT, 
        dateIssued TEXT
      );
      CREATE TABLE IF NOT EXISTS exams (
        id TEXT PRIMARY KEY, 
        studentId TEXT, 
        subject TEXT, 
        originalDate TEXT, 
        scheduledDate TEXT, 
        reason TEXT, 
        status TEXT, 
        period TEXT
      );
      CREATE TABLE IF NOT EXISTS subjects (
        name TEXT PRIMARY KEY
      );
    `);
    this.persist();
  }

  private seedData() {
    if (!this.db) return;
    // Seed Users if empty
    try {
        const users = this.db.exec("SELECT count(*) as count FROM users");
        if (users[0].values[0][0] === 0) {
            DEFAULT_STATE.users.forEach(u => this.saveUser(u));
        }
    } catch (e) { console.error("Error seeding users", e); }
    
    // Seed Subjects if empty
    try {
        const subjects = this.db.exec("SELECT count(*) as count FROM subjects");
        if (subjects[0].values[0][0] === 0) {
            this.updateSubjects(DEFAULT_STATE.subjects);
        }
    } catch (e) { console.error("Error seeding subjects", e); }
    
    this.persist();
  }

  private persist() {
    if (!this.db) return;
    try {
        const binary = this.db.export();
        const str = toBinString(binary);
        localStorage.setItem(this.STORAGE_KEY_DB, str);
    } catch(e) {
        console.error("Persist failed", e);
    }
  }

  // --- Helper to execute SQL and return mapped objects ---
  private async query(sql: string, params: any[] = []) {
    await this.initPromise;
    if (!this.db) return [];
    
    try {
        const stmt = this.db.prepare(sql);
        stmt.bind(params);
        const results = [];
        while (stmt.step()) {
          results.push(stmt.getAsObject());
        }
        stmt.free();
        return results;
    } catch (e) {
        console.error("Query Error", sql, e);
        return [];
    }
  }

  private async execute(sql: string, params: any[] = []) {
    await this.initPromise;
    if (!this.db) return;
    try {
        this.db.run(sql, params);
        this.persist();
    } catch(e) {
        console.error("Execute Error", sql, e);
    }
  }

  // --- Bulk Import for Sync ---
  public async replaceAllData(data: AppState) {
    await this.initPromise;
    if (!this.db) return;
    
    try {
        // Clear tables
        this.db.run("DELETE FROM users; DELETE FROM students; DELETE FROM attendance; DELETE FROM documents; DELETE FROM exams; DELETE FROM subjects;");

        // Insert Users
        for (const u of data.users) {
            this.db.run("INSERT INTO users VALUES (?, ?, ?, ?, ?, ?, ?)", 
            [u.id, u.name, u.email, u.password, u.role, u.photoUrl, JSON.stringify(u.allowedGrades)]);
        }

        // Insert Students
        for (const s of data.students) {
            this.db.run("INSERT INTO students VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", 
            [s.id, s.name, s.registration, s.sequenceNumber, s.birthDate, s.grade, s.shift, s.email, s.photoUrl,
            s.fatherName, s.fatherPhone, s.motherName, s.motherPhone, JSON.stringify(s.guardians), s.bookStatus, s.peStatus, s.turnstileRegistered ? 1 : 0]);
        }

        // Insert Attendance
        for (const a of data.attendance) {
            this.db.run("INSERT INTO attendance VALUES (?, ?, ?, ?, ?)", [a.id, a.studentId, a.date, a.status, a.observation || '']);
        }

        // Insert Docs
        for (const d of data.documents) {
            this.db.run("INSERT INTO documents VALUES (?, ?, ?, ?, ?)", [d.id, d.studentId, d.type, d.description, d.dateIssued]);
        }

        // Insert Exams
        for (const e of data.exams) {
            this.db.run("INSERT INTO exams VALUES (?, ?, ?, ?, ?, ?, ?, ?)", 
            [e.id, e.studentId, e.subject, e.originalDate, e.scheduledDate || '', e.reason, e.status, e.period || '']);
        }

        // Insert Subjects
        for (const sub of data.subjects) {
            this.db.run("INSERT INTO subjects VALUES (?)", [sub]);
        }

        this.persist();
    } catch (e) {
        console.error("Error replacing data in SQLite:", e);
    }
  }

  // --- API Methods ---

  async sync(): Promise<void> {
    // Local DB doesn't sync with itself
    return Promise.resolve();
  }

  async uploadPhoto(file: File, type: 'student' | 'user', id: string): Promise<string> {
    // In pure SQLite/Offline mode, we can't save to a server folder.
    // Fallback: Return Base64 string to store directly in DB.
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

    const users = (await this.query("SELECT * FROM users")).map((u: any) => ({
      ...u,
      allowedGrades: JSON.parse(u.allowedGrades || '[]')
    }));

    const students = (await this.query("SELECT * FROM students")).map((s: any) => ({
      ...s,
      guardians: JSON.parse(s.guardians || '[]'),
      turnstileRegistered: s.turnstileRegistered === 1
    }));

    const attendance = await this.query("SELECT * FROM attendance");
    const documents = await this.query("SELECT * FROM documents");
    const exams = await this.query("SELECT * FROM exams");
    const subjectsRes = await this.query("SELECT name FROM subjects");
    const subjects = subjectsRes.map((s: any) => s.name);

    return {
      users: users as User[],
      students: students as Student[],
      attendance: attendance as AttendanceRecord[],
      documents: documents as HealthDocument[],
      exams: exams as MakeUpExam[],
      subjects
    };
  }

  async login(email: string, password: string): Promise<User | null> {
    const res = await this.query("SELECT * FROM users WHERE email = ? AND password = ?", [email, password]);
    if (res.length > 0) {
      const user = res[0];
      return { ...user, allowedGrades: JSON.parse(user.allowedGrades) } as User;
    }
    return null;
  }

  async saveStudent(student: Student): Promise<Student> {
    await this.execute(`
      INSERT OR REPLACE INTO students (
        id, name, registration, sequenceNumber, birthDate, grade, shift, email, photoUrl, 
        fatherName, fatherPhone, motherName, motherPhone, guardians, bookStatus, peStatus, turnstileRegistered
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      student.id, student.name, student.registration, student.sequenceNumber, student.birthDate, 
      student.grade, student.shift, student.email, student.photoUrl,
      student.fatherName, student.fatherPhone, student.motherName, student.motherPhone,
      JSON.stringify(student.guardians), student.bookStatus, student.peStatus, student.turnstileRegistered ? 1 : 0
    ]);
    return student;
  }

  async deleteStudent(id: string): Promise<void> {
    await this.execute("DELETE FROM students WHERE id = ?", [id]);
  }

  async saveUser(user: User): Promise<User> {
    await this.execute(`
      INSERT OR REPLACE INTO users (id, name, email, password, role, photoUrl, allowedGrades) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [
      user.id, user.name, user.email, user.password, user.role, user.photoUrl, JSON.stringify(user.allowedGrades)
    ]);
    return user;
  }

  async deleteUser(id: string): Promise<void> {
    await this.execute("DELETE FROM users WHERE id = ?", [id]);
  }

  async saveAttendance(record: AttendanceRecord): Promise<AttendanceRecord> {
    const exists = await this.query("SELECT id FROM attendance WHERE studentId = ? AND date = ?", [record.studentId, record.date]);
    if (exists.length > 0) {
      await this.execute("UPDATE attendance SET status = ?, observation = ? WHERE studentId = ? AND date = ?", 
        [record.status, record.observation || '', record.studentId, record.date]);
      record.id = exists[0].id;
    } else {
      await this.execute("INSERT INTO attendance (id, studentId, date, status, observation) VALUES (?, ?, ?, ?, ?)", 
        [record.id, record.studentId, record.date, record.status, record.observation || '']);
    }
    return record;
  }

  async deleteAttendance(studentId: string, date: string): Promise<void> {
    await this.execute("DELETE FROM attendance WHERE studentId = ? AND date = ?", [studentId, date]);
  }

  async saveExam(exam: MakeUpExam): Promise<MakeUpExam> {
    await this.execute(`
      INSERT OR REPLACE INTO exams (id, studentId, subject, originalDate, scheduledDate, reason, status, period)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [exam.id, exam.studentId, exam.subject, exam.originalDate, exam.scheduledDate || '', exam.reason, exam.status, exam.period || '']);
    return exam;
  }

  async deleteExam(id: string): Promise<void> {
    await this.execute("DELETE FROM exams WHERE id = ?", [id]);
  }

  async updateSubjects(subjects: string[]): Promise<string[]> {
    await this.execute("DELETE FROM subjects");
    for (const sub of subjects) {
      await this.execute("INSERT INTO subjects (name) VALUES (?)", [sub]);
    }
    return subjects;
  }

  async saveDocument(doc: HealthDocument): Promise<HealthDocument> {
    await this.execute(`
      INSERT OR REPLACE INTO documents (id, studentId, type, description, dateIssued)
      VALUES (?, ?, ?, ?, ?)
    `, [doc.id, doc.studentId, doc.type, doc.description, doc.dateIssued]);
    return doc;
  }

  async deleteDocument(id: string): Promise<void> {
    await this.execute("DELETE FROM documents WHERE id = ?", [id]);
  }

  async resetSystem(): Promise<void> {
    localStorage.removeItem(this.STORAGE_KEY_DB);
    this.db = null;
    await this.init();
  }
}

// --- HTTP IMPLEMENTATION (Real API / XAMPP) ---
class HttpApi implements ApiService {
  private async request(endpoint: string, method: string = 'GET', body?: any) {
    const headers: any = { 
        'Accept': 'application/json'
    };
    
    // Only set Content-Type for JSON. FormData sets its own.
    if (!(body instanceof FormData)) {
        headers['Content-Type'] = 'application/json; charset=utf-8';
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 second timeout

    const config: RequestInit = { 
        method, 
        headers,
        mode: 'cors',
        signal: controller.signal
    };
    
    if (body) {
        config.body = body instanceof FormData ? body : JSON.stringify(body);
    }

    let response;
    try {
        response = await fetch(`${API_BASE_URL}${endpoint}`, config);
        clearTimeout(timeoutId);
    } catch (networkError: any) {
        clearTimeout(timeoutId);
        // Prevent crashing app, just log warning
        console.warn("XAMPP Connection Warning:", networkError.message);
        throw new Error("Falha ao conectar ao servidor. Verifique se o XAMPP está rodando.");
    }

    const text = await response.text();
    
    // Debug output from PHP
    if (!response.ok) {
        console.error("XAMPP Server Error:", text);
        throw new Error(`Erro do servidor (${response.status}): ${response.statusText}`);
    }

    try {
        return JSON.parse(text);
    } catch (e) {
        console.error("Invalid JSON from Server:", text);
        throw new Error("O servidor retornou dados inválidos. Verifique os arquivos PHP.");
    }
  }

  async sync(): Promise<void> { return; }

  async uploadPhoto(file: File, type: 'student' | 'user', id: string): Promise<string> {
      const formData = new FormData();
      formData.append('photo', file);
      formData.append('type', type);
      formData.append('id', id);
      
      // Assumes upload.php handles saving to 'photos/' folder and returns { "url": "..." }
      const response = await this.request('/upload.php', 'POST', formData);
      return response.url;
  }

  async loadAllData(): Promise<AppState> {
    // Parallel requests to load fast
    const [students, users, attendance, documents, exams, subjects] = await Promise.all([
        this.request('/students.php'),
        this.request('/users.php'),
        this.request('/attendance.php'),
        this.request('/documents.php'),
        this.request('/exams.php'),
        this.request('/subjects.php')
    ]);
    return { students, users, attendance, documents, exams, subjects };
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
  
  // FIXED: Explicit mapping for exams to match PHP/SQL expectations exactly
  async saveExam(exam: MakeUpExam): Promise<MakeUpExam> { 
      const payload = {
          id: exam.id,
          studentId: exam.studentId,
          subject: exam.subject,
          originalDate: exam.originalDate,
          scheduledDate: exam.scheduledDate || '',
          reason: exam.reason || '',
          status: exam.status,
          period: exam.period || ''
      };
      return this.request('/exams.php', 'POST', payload); 
  }
  async deleteExam(id: string): Promise<void> { return this.request(`/exams.php?id=${id}`, 'DELETE'); }
  
  async updateSubjects(subjects: string[]): Promise<string[]> { return this.request('/subjects.php', 'POST', { subjects }); }
  
  // FIXED: Explicit mapping for documents to match PHP/SQL expectations exactly
  async saveDocument(doc: HealthDocument): Promise<HealthDocument> { 
      const payload = {
          id: doc.id,
          studentId: doc.studentId,
          type: doc.type,
          description: doc.description || '',
          dateIssued: doc.dateIssued
      };
      return this.request('/documents.php', 'POST', payload); 
  }
  async deleteDocument(id: string): Promise<void> { return this.request(`/documents.php?id=${id}`, 'DELETE'); }
  
  async resetSystem(): Promise<void> { return this.request('/reset.php', 'POST'); }
}

// --- HYBRID IMPLEMENTATION (SQLite Local + HTTP Sync) ---
class HybridApi implements ApiService {
  private sqlite = new SqliteApi();
  private http = new HttpApi();
  private isOnline = navigator.onLine;

  constructor() {
    window.addEventListener('online', () => this.isOnline = true);
    window.addEventListener('offline', () => this.isOnline = false);
  }

  // FORCE SYNC: Pull from server and update local DB
  async sync(): Promise<void> {
    if (!this.isOnline) {
        throw new Error("Sem conexão com a internet.");
    }
    const serverData = await this.http.loadAllData();
    await this.sqlite.replaceAllData(serverData);
  }

  async uploadPhoto(file: File, type: 'student' | 'user', id: string): Promise<string> {
      if (this.isOnline) {
          try {
              // Try to upload to server first
              return await this.http.uploadPhoto(file, type, id);
          } catch (e) {
              console.warn("Upload failed, falling back to local base64");
          }
      }
      // Fallback: Base64
      return await this.sqlite.uploadPhoto(file, type, id);
  }

  // Load Strategy: ALWAYS try Server first to ensure fresh data on init
  async loadAllData(): Promise<AppState> {
    try {
      console.log("HybridAPI: Iniciando conexão com XAMPP...");
      
      const serverData = await this.http.loadAllData();
      
      console.log("HybridAPI: Sucesso! Servidor respondeu. Atualizando cache local...");
      await this.sqlite.replaceAllData(serverData);
      
      return serverData;
    } catch (error: any) {
      console.warn("HybridAPI: Falha ao conectar no XAMPP. Entrando em MODO OFFLINE (SQLite).");
      
      // Se falhar (offline ou erro no PHP), carrega o que tem localmente
      const localData = await this.sqlite.loadAllData();
      return localData;
    }
  }

  async login(email: string, password: string): Promise<User | null> {
    // Login always requires server first for security, but falls back to local if user exists there
    try {
      const serverUser = await this.http.login(email, password);
      if (serverUser) return serverUser;
    } catch (e) {
      console.log("HybridAPI: Login offline attempt");
    }
    return this.sqlite.login(email, password);
  }

  // Write Strategy: Write Local (Optimistic) -> Try Write Server (Background)
  
  async saveStudent(student: Student): Promise<Student> {
    const local = await this.sqlite.saveStudent(student);
    this.http.saveStudent(student).catch(e => console.warn("Sync: Falha ao salvar no servidor", e));
    return local;
  }

  async deleteStudent(id: string): Promise<void> {
    await this.sqlite.deleteStudent(id);
    this.http.deleteStudent(id).catch(e => console.warn("Sync: Falha ao deletar no servidor", e));
  }

  async saveUser(user: User): Promise<User> {
    const local = await this.sqlite.saveUser(user);
    this.http.saveUser(user).catch(e => console.warn("Sync: Falha ao salvar user no servidor", e));
    return local;
  }

  async deleteUser(id: string): Promise<void> {
    await this.sqlite.deleteUser(id);
    this.http.deleteUser(id).catch(e => console.warn("Sync: Falha ao deletar user no servidor", e));
  }

  async saveAttendance(record: AttendanceRecord): Promise<AttendanceRecord> {
    const local = await this.sqlite.saveAttendance(record);
    this.http.saveAttendance(record).catch(e => console.warn("Sync: Falha ao salvar presença no servidor", e));
    return local;
  }

  async deleteAttendance(studentId: string, date: string): Promise<void> {
    await this.sqlite.deleteAttendance(studentId, date);
    this.http.deleteAttendance(studentId, date).catch(e => console.warn("Sync: Falha ao deletar presença no servidor", e));
  }

  async saveExam(exam: MakeUpExam): Promise<MakeUpExam> {
    const local = await this.sqlite.saveExam(exam);
    this.http.saveExam(exam).catch(e => console.warn("Sync: Falha ao salvar exame no servidor", e));
    return local;
  }

  async deleteExam(id: string): Promise<void> {
    await this.sqlite.deleteExam(id);
    this.http.deleteExam(id).catch(e => console.warn("Sync: Falha ao deletar exame no servidor", e));
  }

  async updateSubjects(subjects: string[]): Promise<string[]> {
    const local = await this.sqlite.updateSubjects(subjects);
    this.http.updateSubjects(subjects).catch(e => console.warn("Sync: Falha ao atualizar matérias no servidor", e));
    return local;
  }

  async saveDocument(doc: HealthDocument): Promise<HealthDocument> {
    const local = await this.sqlite.saveDocument(doc);
    this.http.saveDocument(doc).catch(e => console.warn("Sync: Falha ao salvar documento no servidor", e));
    return local;
  }

  async deleteDocument(id: string): Promise<void> {
    await this.sqlite.deleteDocument(id);
    this.http.deleteDocument(id).catch(e => console.warn("Sync: Falha ao deletar documento no servidor", e));
  }

  async resetSystem(): Promise<void> {
    await this.sqlite.resetSystem();
    this.http.resetSystem().catch(e => console.warn("Sync: Falha ao resetar servidor", e));
  }
}

// Export Singleton based on config
let apiInstance: ApiService;

try {
    switch (DATA_SOURCE) {
      case 'sync':
        apiInstance = new HybridApi();
        console.log("Using Hybrid Mode (SQLite + XAMPP Sync)");
        break;
      case 'sqlite':
        apiInstance = new SqliteApi();
        console.log("Using SQLite (Local Only)");
        break;
      case 'http':
        apiInstance = new HttpApi();
        console.log("Using HTTP API (XAMPP Only)");
        break;
      default:
        // Fallback to SQLite if something is wrong
        apiInstance = new SqliteApi();
        console.log("Fallback to SQLite");
    }
} catch (e) {
    console.error("Critical error initializing API", e);
    // Absolute fallback to avoid crash
    apiInstance = new SqliteApi();
}

export const api = apiInstance;