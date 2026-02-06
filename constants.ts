import { Shift, AcademicPeriod } from "./types";

export const GRADE_GROUPS = {
  "EDUCAÇÃO INFANTIL": ["INF II", "INF III", "INF IV", "INF V"],
  "FUNDAMENTAL I": ["1º ANO FUND I", "2º ANO FUND I", "3º ANO FUND I", "4º ANO FUND I", "5º ANO FUND I"],
  "FUNDAMENTAL II": ["6º ANO FUND II", "7º ANO FUND II", "8º ANO FUND II", "9º ANO FUND II"],
  "ENSINO MÉDIO": ["1º ANO MÉDIO", "2º ANO MÉDIO", "3 ANO MÉDIO"]
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
  "11": "1º ANO FUND I",
  "12": "2º ANO FUND I",
  "13": "3º ANO FUND I",
  "14": "4º ANO FUND I",
  "15": "5º ANO FUND I",
  "16": "6º ANO FUND II",
  "17": "7º ANO FUND II",
  "18": "8º ANO FUND II",
  "19": "9º ANO FUND II",
  "21": "1º ANO MÉDIO",
  "22": "2º ANO MÉDIO",
  "23": "3 ANO MÉDIO"
};

export const SHIFTS_LIST: Shift[] = ["Manhã", "Tarde"];
export const ACADEMIC_PERIODS: AcademicPeriod[] = ['1ª Etp', '1ª Bi', '2ª Etp', '2ª Bi', '3ª Etp', '3ª Bi', '4ª Etp', '4ª Bi'];
