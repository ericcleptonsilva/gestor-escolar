export interface TurnstileRecord {
  matricula: string;
  code: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  rawTime: number; // HHMM for shift comparison
  rawLine: string;
}

export const parseTopData = (fileContent: string): TurnstileRecord[] => {
  const lines = fileContent.split('\n');
  const records: TurnstileRecord[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const cols = trimmed.split(';');
    if (cols.length < 6) continue;

    // Format: ID;Matrícula;Code;Date;Time;Turnstile
    // Example: 03549;00001018;111;29012026;1042;01
    const matriculaRaw = cols[1].trim();
    const code = cols[2].trim();
    const dateRaw = cols[3].trim();
    const timeRaw = cols[4].trim();

    // Parse Date
    let dateISO = '';
    if (dateRaw.includes('/')) {
      const parts = dateRaw.split('/');
      if (parts.length === 3) {
        dateISO = `${parts[2]}-${parts[1]}-${parts[0]}`;
      }
    } else if (dateRaw.length === 8) {
      const day = dateRaw.substring(0, 2);
      const month = dateRaw.substring(2, 4);
      const year = dateRaw.substring(4, 8);
      dateISO = `${year}-${month}-${day}`;
    }

    if (!dateISO) continue; // Invalid date format

    // Parse Time
    const cleanTime = timeRaw.replace(':', '');
    const timeInt = parseInt(cleanTime, 10);

    let timeFormatted = timeRaw;
    if (timeRaw.length === 4 && !timeRaw.includes(':')) {
      timeFormatted = `${timeRaw.substring(0, 2)}:${timeRaw.substring(2, 4)}`;
    }

    records.push({
      matricula: matriculaRaw,
      code,
      date: dateISO,
      time: timeFormatted,
      rawTime: isNaN(timeInt) ? 0 : timeInt,
      rawLine: trimmed
    });
  }
  return records;
};
