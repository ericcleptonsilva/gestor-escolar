import { Shift, AcademicPeriod } from "./types";

export const GRADE_GROUPS = {
  "EDUCAÇÃO INFANTIL": ["INF II", "INF III", "INF IV", "INF V"],
  "FUNDAMENTAL I": ["1º ANO", "2º ANO", "3º ANO", "4º ANO", "5º ANO"],
  "FUNDAMENTAL II": ["6º ANO", "7º ANO", "8º ANO", "9º ANO"],
  "ENSINO MÉDIO": ["1º ANO MÉDIO", "2º ANO MÉDIO", "3º ANO MÉDIO"]
};

export const GRADES_LIST = [
  ...GRADE_GROUPS["EDUCAÇÃO INFANTIL"],
  ...GRADE_GROUPS["FUNDAMENTAL I"],
  ...GRADE_GROUPS["FUNDAMENTAL II"],
  ...GRADE_GROUPS["ENSINO MÉDIO"]
];

export const IMPORT_GRADE_MAP: Record<string, string> = {
  "2": "INF II",
  "3": "INF III",
  "4": "INF IV",
  "5": "INF V",
  "11": "1º ANO",
  "12": "2º ANO",
  "13": "3º ANO",
  "14": "4º ANO",
  "15": "5º ANO",
  "16": "6º ANO",
  "17": "7º ANO",
  "18": "8º ANO",
  "19": "9º ANO",
  "21": "1º ANO MÉDIO",
  "22": "2º ANO MÉDIO",
  "23": "3º ANO MÉDIO"
};

export const SHIFTS_LIST: Shift[] = ["Manhã", "Tarde"];
export const ACADEMIC_PERIODS: AcademicPeriod[] = ['1ª Etp', '1ª Bi', '2ª Etp', '2ª Bi', '3ª Etp', '3ª Bi', '4ª Etp', '4ª Bi'];
