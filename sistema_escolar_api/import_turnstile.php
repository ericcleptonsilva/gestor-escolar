<?php
error_reporting(E_ERROR | E_PARSE);
include_once 'logger.php';
include 'db.php';

function isBrazilianHoliday($dateStr) {
    if (!$dateStr) return false;
    $year = (int)date('Y', strtotime($dateStr));
    $dateObj = new DateTime($dateStr);
    $dateFormatted = $dateObj->format('m-d');

    $fixedHolidays = [
        '01-01', '04-21', '05-01', '09-07', '10-12', '11-02', '11-15', '12-25'
    ];

    if (in_array($dateFormatted, $fixedHolidays)) {
        return true;
    }

    $a = $year % 19;
    $b = floor($year / 100);
    $c = $year % 100;
    $d = floor($b / 4);
    $e = $b % 4;
    $f = floor(($b + 8) / 25);
    $g = floor(($b - $f + 1) / 3);
    $h = (19 * $a + $b - $d - $g + 15) % 30;
    $i = floor($c / 4);
    $k = $c % 4;
    $l = (32 + 2 * $e + 2 * $i - $h - $k) % 7;
    $m = floor(($a + 11 * $h + 22 * $l) / 451);
    $month = floor(($h + $l - 7 * $m + 114) / 31);
    $day = (($h + $l - 7 * $m + 114) % 31) + 1;
    
    $easterStr = sprintf("%04d-%02d-%02d", $year, $month, $day);
    $easterObj = new DateTime($easterStr);

    $goodFriday = clone $easterObj;
    $goodFriday->modify('-2 days');

    $carnival = clone $easterObj;
    $carnival->modify('-47 days');

    $carnivalMonday = clone $easterObj;
    $carnivalMonday->modify('-48 days');

    $corpusChristi = clone $easterObj;
    $corpusChristi->modify('+60 days');

    $movingHolidays = [
        $goodFriday->format('m-d'),
        $carnival->format('m-d'),
        $carnivalMonday->format('m-d'),
        $corpusChristi->format('m-d')
    ];

    if (in_array($dateFormatted, $movingHolidays)) {
        return true;
    }

    return false;
}

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $filePath = '';

    // Check if we are reading from local file path or upload
    if (isset($_POST['source']) && $_POST['source'] === 'local') {
        // Windows Path (Double backslashes for escaping)
        $localPath = 'C:\\SIETEX\\Portaria\\TopData.txt';

        if (!file_exists($localPath)) {
            // Fallback for testing/dev environments (optional, but good for debugging if C: doesn't exist)
            // $localPath = 'TopData.txt';

            if (!file_exists($localPath)) {
                http_response_code(404);
                echo json_encode(["error" => "Arquivo local não encontrado: $localPath"]);
                exit();
            }
        }
        $filePath = $localPath;
    } else {
        // Default: File Upload
        if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
            http_response_code(400);
            echo json_encode(["error" => "Nenhum arquivo enviado ou erro no upload."]);
            exit();
        }
        $filePath = $_FILES['file']['tmp_name'];
    }

    // Set script execution time limit to 5 minutes to allow for large files
    set_time_limit(300);

    // Open file handle for line-by-line reading (memory efficient)
    $handle = fopen($filePath, "r");
    if (!$handle) {
        http_response_code(500);
        echo json_encode(["error" => "Falha ao abrir arquivo: $filePath"]);
        exit();
    }

    // 1. Fetch All Students and Teachers for Lookup
    try {
        $stmt = $conn->query("SELECT id, registration, shift, turnstileRegistered, createdAt FROM students");
        $students = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $stmtT = $conn->query("SELECT id, name, registration, classes FROM users WHERE role = 'teacher'");
        $teachers = $stmtT->fetchAll(PDO::FETCH_ASSOC);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["error" => "Database error fetching data: " . $e->getMessage()]);
        exit();
    }

    // Normalize Student Map: normalized_reg -> student
    $studentMap = [];
    foreach ($students as $student) {
        $reg = trim($student['registration'] ?? '');
        $student['turnstileRegistered'] = ($student['turnstileRegistered'] == 1 || $student['turnstileRegistered'] === true);
        
        $studentMap[$reg] = $student;
        if (ctype_digit($reg)) {
            $studentMap[(string)(int)$reg] = $student;
        }
    }

    // Normalize Teacher Map
    $teacherMap = [];
    foreach ($teachers as $teacher) {
        $reg = trim($teacher['registration'] ?? '');
        if ($reg) {
            $teacherMap[$reg] = $teacher;
            if (ctype_digit($reg)) {
                $teacherMap[(string)(int)$reg] = $teacher;
            }
        }
    }

    try {
        $stmtC = $conn->query("SELECT date FROM school_calendar WHERE type IN ('Feriado', 'Imprensado', 'Recesso Escolar')");
        $calendarEvents = $stmtC->fetchAll(PDO::FETCH_ASSOC);
        $customHolidays = array_map(function($e) { return $e['date']; }, $calendarEvents);
    } catch (PDOException $e) {
        // Table might not exist yet, treat as empty
        $customHolidays = [];
    }

    $processedCount = 0;
    $successCount = 0;
    $notFoundCount = 0;
    $autoAbsenceCount = 0;
    $skippedDateCount = 0;

    // --- TIME FILTER PARSING (Dual Shift) ---
    $morningStart = null;
    $morningEnd = null;
    $afternoonStart = null;
    $afternoonEnd = null;

    if (!empty($_POST['morning_start'])) $morningStart = (int)str_replace(':', '', $_POST['morning_start']);
    if (!empty($_POST['morning_end']))   $morningEnd = (int)str_replace(':', '', $_POST['morning_end']);

    if (!empty($_POST['afternoon_start'])) $afternoonStart = (int)str_replace(':', '', $_POST['afternoon_start']);
    if (!empty($_POST['afternoon_end']))   $afternoonEnd = (int)str_replace(':', '', $_POST['afternoon_end']);

    $hasMorningFilter = ($morningStart !== null && $morningEnd !== null);
    $hasAfternoonFilter = ($afternoonStart !== null && $afternoonEnd !== null);

    // We track presence per date to determine absences later
    // Date (YYYY-MM-DD) -> Set of Student IDs present
    $presentStudentsByDate = [];
    $presentTeachersByDate = [];


    // Track which shifts had activity on which date
    // Date (YYYY-MM-DD) -> ['morning' => bool, 'afternoon' => bool]
    $shiftActivityByDate = [];

    // Records to save: Key (studentId_date) -> Record
    $recordsToSave = [];

    while (($line = fgets($handle)) !== false) {
        $line = trim($line);
        if (empty($line)) continue;

        $cols = explode(';', $line);
        // Format: ID;Matrícula;Code;Date;Time;Turnstile
        // Example: 03549;00001018;111;29012026;1042;01
        if (count($cols) < 5) continue;

        $matriculaRaw = trim($cols[1]);
        $code = trim($cols[2]);
        $dateRaw = trim($cols[3]);
        $timeRaw = trim($cols[4]);

        // Find Student OR Teacher
        $target = null;
        $isTeacher = false;

        if (isset($studentMap[$matriculaRaw])) {
            $target = $studentMap[$matriculaRaw];
        } elseif (isset($teacherMap[$matriculaRaw])) {
            $target = $teacherMap[$matriculaRaw];
            $isTeacher = true;
        } elseif (ctype_digit($matriculaRaw)) {
             $matriculaInt = (int)$matriculaRaw;
             if (isset($studentMap[(string)$matriculaInt])) {
                 $target = $studentMap[(string)$matriculaInt];
             } elseif (isset($teacherMap[(string)$matriculaInt])) {
                 $target = $teacherMap[(string)$matriculaInt];
                 $isTeacher = true;
             }
        }

        if (!$target) {
            $notFoundCount++;
            continue;
        }

        // Parse Date
        $dateISO = '';
        if (strpos($dateRaw, '/') !== false) {
            $parts = explode('/', $dateRaw);
            if (count($parts) === 3) {
                $dateISO = $parts[2] . '-' . $parts[1] . '-' . $parts[0];
            }
        } elseif (strlen($dateRaw) === 8) {
            $day = substr($dateRaw, 0, 2);
            $month = substr($dateRaw, 2, 2);
            $year = substr($dateRaw, 4, 4);
            $dateISO = "$year-$month-$day";
        }

        if (!$dateISO) continue;

        // Initialize tracking for this date
        if (!isset($presentStudentsByDate[$dateISO])) {
            $presentStudentsByDate[$dateISO] = []; // Use array as set
            $shiftActivityByDate[$dateISO] = ['morning' => false, 'afternoon' => false];
        }

        // Determine Shift Activity from Time
        // HHMM or HH:MM
        $cleanTime = str_replace(':', '', $timeRaw);
        $timeInt = (int)$cleanTime;
        
        $hours = floor($timeInt / 100);
        $mins = $timeInt % 100;
        $totalMins = ($hours * 60) + $mins;

        // Mark present
        if ($isTeacher) {
            if (!isset($presentTeachersByDate[$dateISO])) $presentTeachersByDate[$dateISO] = [];
            if (!isset($presentTeachersByDate[$dateISO][$target['id']])) {
                $presentTeachersByDate[$dateISO][$target['id']] = [];
            }
            $presentTeachersByDate[$dateISO][$target['id']][] = $totalMins;
        } else {
            $presentStudentsByDate[$dateISO][$target['id']] = true;
        }

        // Determine Shift Activity from Time
        // HHMM or HH:MM
        $cleanTime = str_replace(':', '', $timeRaw);
        $timeInt = (int)$cleanTime;

        // Apply Time Filter (if set)
        // We only process the record if it falls within EITHER the morning range OR the afternoon range.
        // If NO filters are set, we process everything.

        $inMorningRange = false;
        $inAfternoonRange = false;

        if ($hasMorningFilter) {
            if ($timeInt >= $morningStart && $timeInt <= $morningEnd) {
                $inMorningRange = true;
            }
        }

        if ($hasAfternoonFilter) {
             if ($timeInt >= $afternoonStart && $timeInt <= $afternoonEnd) {
                $inAfternoonRange = true;
             }
        }

        // Skip if filters exist but record doesn't match any
        if (($hasMorningFilter || $hasAfternoonFilter) && !$inMorningRange && !$inAfternoonRange) {
            continue;
        }

        // Determine Shift Activity
        // Use standard logic (<= 1240) OR specific filter match
        if ($timeInt <= 1240 || $inMorningRange) {
            $shiftActivityByDate[$dateISO]['morning'] = true;
        }

        if ($timeInt > 1240 || $inAfternoonRange) {
            $shiftActivityByDate[$dateISO]['afternoon'] = true;
        }

        // Format Time for Observation
        $timeFormatted = $timeRaw;
        if (strlen($timeRaw) === 4 && strpos($timeRaw, ':') === false) {
            $timeFormatted = substr($timeRaw, 0, 2) . ':' . substr($timeRaw, 2, 2);
        }

        if (!$isTeacher) {
            $key = $target['id'] . '_' . $dateISO;

            if (!isset($recordsToSave[$key])) {
                $recordsToSave[$key] = [
                    'id' => uniqid(),
                    'studentId' => $target['id'],
                    'date' => $dateISO,
                    'status' => 'Present',
                    'observation' => "Catraca ($code) $timeFormatted"
                ];
                $successCount++;
            } else {
                // Append observation if not duplicate
                if (strpos($recordsToSave[$key]['observation'], $timeFormatted) === false) {
                    $recordsToSave[$key]['observation'] .= " | Catraca ($code) $timeFormatted";
                }
            }
        } else {
            // Optional: Log teacher presence somewhere if desired?
            // User requested "associação da sua matricula" for absences.
            // We just need them in $presentTeachersByDate for now.
            $successCount++;
        }
        $processedCount++;
    }

    fclose($handle);

    // --- AUTOMATIC ABSENCE LOGIC ---
    foreach ($shiftActivityByDate as $dateISO => $activity) {
        $dayOfWeek = (int)date('w', strtotime($dateISO));
        // Ignore automatic absences on Sundays (0) and explicitly holidays
        if ($dayOfWeek == 0 || isBrazilianHoliday($dateISO) || in_array($dateISO, $customHolidays)) {
            continue;
        }

        $presentSet = $presentStudentsByDate[$dateISO] ?? [];

        foreach ($students as $student) {
            $studentShift = mb_strtolower(trim($student['shift']), 'UTF-8');
            $shouldProcess = false;

            // Determine if we should check this student for absence
            // Logic:
            // 1. If Morning Filter is set -> ONLY check morning students if file has activity in that range (implied by $activity['morning'] being true from filtered records).
            //    Actually, if filter is set, we force check.

            // Morning check
            if ($studentShift === 'manhã' || $studentShift === 'manha') {
                if ($hasMorningFilter) {
                    // If user specifically asked to filter Morning, we check all morning students
                    $shouldProcess = true;
                } elseif (!$hasAfternoonFilter && $activity['morning']) {
                    // If NO filters set (default mode), rely on file activity
                    $shouldProcess = true;
                }
            }

            // Afternoon check
            if ($studentShift === 'tarde' || $studentShift === 'vespertino') {
                 if ($hasAfternoonFilter) {
                    // If user specifically asked to filter Afternoon, we check all afternoon students
                    $shouldProcess = true;
                } elseif (!$hasMorningFilter && $activity['afternoon']) {
                    // If NO filters set (default mode), rely on file activity
                    $shouldProcess = true;
                }
            }

            if ($shouldProcess && $student['turnstileRegistered'] && !isset($presentSet[$student['id']])) {
                
                // Checar se a data da falta é anterior à matrícula/criação do aluno no BD
                if (!empty($student['createdAt'])) {
                    $createdDateOnly = substr($student['createdAt'], 0, 10); // get YYYY-MM-DD
                    // IGNORAR a data da migração (2026-03-30) pois todos os alunos antigos receberam ela:
                    if ($createdDateOnly !== '2026-03-30') {
                        if ($dateISO < $createdDateOnly) {
                            continue; // não gerar falta para dias anteriores à criação no BD
                        }
                    }
                }

                $key = $student['id'] . '_' . $dateISO;

                // Only add absence if we haven't already processed a presence for this student (which we haven't, by definition of presentSet check, but good to be safe)
                if (!isset($recordsToSave[$key])) {
                    // We need to check if an existing record is already in DB to avoid overwriting manually entered data?
                    // The Frontend logic was: "If NO record exists in state".
                    // Here, we can do INSERT IGNORE or ON DUPLICATE KEY UPDATE.
                    // If we use ON DUPLICATE KEY UPDATE, we overwrite.
                    // Ideally, we only insert absence if it doesn't exist.
                    // But for now, let's assume the import is authoritative for that day.
                    // However, to be safe and match frontend logic (which checked existing state), we might want to be careful.
                    // But in a bulk import script, checking every single record in DB first is slow.
                    // We will upsert. If they were marked Present manually, this might overwrite to Absent?
                    // No, because if they were Present, they should be in the file?
                    // If they were manually marked Present but NOT in file -> They get marked Absent here. This is a potential regression from Frontend logic which had full state.
                    // But usually Turnstile import is done first.

                    // IMPROVEMENT: We can fetch existing attendance for these dates to avoid overwriting non-turnstile data.
                    // But for simplicity and performance, we'll assume Turnstile Import is the source of truth for these days/shifts.

                    $recordsToSave[$key] = [
                        'id' => uniqid(),
                        'studentId' => $student['id'],
                        'date' => $dateISO,
                        'status' => 'Absent',
                        'observation' => 'Ausência automática (Catraca)'
                    ];
                    $autoAbsenceCount++;
                }
            }
        }
    }

    // Batch Insert
    if (!empty($recordsToSave)) {
        try {
            $conn->beginTransaction();

            $presentRecords = [];
            $absentRecords = [];

            foreach ($recordsToSave as $r) {
                if ($r['status'] === 'Present') {
                    $presentRecords[] = $r;
                } else {
                    $absentRecords[] = $r;
                }
            }

            // 1. Process Presents (Upsert with Append)
            if (!empty($presentRecords)) {
                $stmtPresent = $conn->prepare("INSERT INTO attendance (id, studentId, date, status, observation)
                    VALUES (:id, :studentId, :date, :status, :observation)
                    ON DUPLICATE KEY UPDATE
                    status = :status,
                    observation = CASE
                        WHEN observation LIKE CONCAT('%', :observation, '%') THEN observation
                        ELSE CONCAT(IFNULL(observation, ''), IF(observation <> '' AND observation IS NOT NULL, ' | ', ''), :observation)
                    END");

                foreach ($presentRecords as $r) {
                    $stmtPresent->execute([
                        ':id' => $r['id'],
                        ':studentId' => $r['studentId'],
                        ':date' => $r['date'],
                        ':status' => $r['status'],
                        ':observation' => $r['observation']
                    ]);
                }
            }

            // 2. Process Absences (Insert Ignore - Only if no record exists)
            // We don't want to overwrite a manually entered "Justified" or "Present" with "Absent" just because they missed the turnstile.
            if (!empty($absentRecords)) {
                // MySQL doesn't have a simple "INSERT IF NOT EXISTS" that works easily with bulk without ignoring errors.
                // We can use INSERT IGNORE, but that ignores ALL errors (like constraints).
                // But attendance usually has a unique key on (studentId, date).
                // So INSERT IGNORE INTO attendance ... will skip if (studentId, date) exists.

                $stmtAbsent = $conn->prepare("INSERT IGNORE INTO attendance (id, studentId, date, status, observation)
                    VALUES (:id, :studentId, :date, :status, :observation)");

                foreach ($absentRecords as $r) {
                    $stmtAbsent->execute([
                        ':id' => $r['id'],
                        ':studentId' => $r['studentId'],
                        ':date' => $r['date'],
                        ':status' => $r['status'],
                        ':observation' => $r['observation']
                    ]);
                }
            }

            $conn->commit();

        } catch (PDOException $e) {
            $conn->rollBack();
            http_response_code(500);
            echo json_encode(["error" => "Database Transaction Failed: " . $e->getMessage()]);
            exit();
        }
    }

    // --- LÓGICA DE LIMPEZA DE FALTAS ANTERIORES À MATRÍCULA ---
    // Limpa faltas que foram geradas para alunos antes da sua data de matrícula no sistema
    $cleanedAbsences = 0;
    try {
        $cleanupSql = "DELETE a FROM attendance a
                       JOIN students s ON a.studentId = s.id
                       WHERE a.status = 'Absent' 
                         AND s.createdAt IS NOT NULL 
                         AND s.createdAt != ''
                         AND DATE(s.createdAt) != '2026-03-30'
                         AND a.date < DATE(s.createdAt)";
        $stmtCleanup = $conn->prepare($cleanupSql);
        $stmtCleanup->execute();
        $cleanedAbsences = $stmtCleanup->rowCount();
    } catch (PDOException $e) {
        // Log error but continue
        error_log("Erro ao limpar faltas antigas: " . $e->getMessage());
    }

    // --- TEACHER AUTOMATIC ABSENCE LOGIC ---
    $daysOfWeekMap = [
        0 => 'Domingo',
        1 => 'Segunda',
        2 => 'Terça',
        3 => 'Quarta',
        4 => 'Quinta',
        5 => 'Sexta',
        6 => 'Sábado'
    ];

    foreach ($shiftActivityByDate as $dateISO => $activity) {
        $dayOfWeekNum = (int)date('w', strtotime($dateISO));
        if ($dayOfWeekNum == 0 || isBrazilianHoliday($dateISO) || in_array($dateISO, $customHolidays)) {
            continue;
        }
        
        $dayName = $daysOfWeekMap[$dayOfWeekNum];
        $presentTeachers = $presentTeachersByDate[$dateISO] ?? [];

        foreach ($teachers as $teacher) {
            $classesStr = $teacher['classes'] ?? '[]';
            $classes = json_decode($classesStr, true);
            if (!$classes || !is_array($classes)) continue;

            // Total de aulas que ele deveria dar no dia
            $scheduledClassesCount = 0;
            foreach ($classes as $cls) {
                if (isset($cls['schedules']) && is_array($cls['schedules'])) {
                    foreach ($cls['schedules'] as $sch) {
                        if ($sch['dayOfWeek'] === $dayName) {
                            $scheduledClassesCount++;
                        }
                    }
                }
            }

            if ($scheduledClassesCount == 0) continue;

            $givenClasses = 0;

            if (isset($presentTeachers[$teacher['id']])) {
                $punches = $presentTeachers[$teacher['id']];
                sort($punches);

                $firstPunch = $punches[0];
                $lastPunch = $punches[count($punches) - 1];

                if (count($punches) == 1) {
                    $givenClasses = 1; // Pelo menos 1 aula
                } else {
                    $durationMins = $lastPunch - $firstPunch;
                    // Desconta 60 mins de almoço se ficou mais de 6 hrs
                    if ($durationMins > 360) {
                        $durationMins -= 60;
                    }
                    if ($durationMins < 0) $durationMins = 0;

                    // Cada aula tem 50 minutos, com tolerância de 10 min
                    $givenClasses = floor(($durationMins + 10) / 50);
                }
            }

            // Não contabilizar mais aulas dadas do que o programado
            if ($givenClasses > $scheduledClassesCount) {
                $givenClasses = $scheduledClassesCount;
            }

            $missedClasses = $scheduledClassesCount - $givenClasses;

            // Se perdeu alguma aula
            if ($missedClasses > 0) {
                $recordId = 'ABS_' . $teacher['id'] . '_' . str_replace('-', '', $dateISO);
                $statusStr = ($missedClasses == $scheduledClassesCount) ? "Falta Injustificada" : "Falta Parcial";

                $obsData = [
                    "msg" => "Faltou $missedClasses aula(s) de $scheduledClassesCount previstas.",
                    "scheduled" => $scheduledClassesCount,
                    "given" => $givenClasses,
                    "missed" => $missedClasses,
                    "manualOverride" => false // Flag para o Frontend saber se foi editado
                ];
                $obsJson = json_encode($obsData, JSON_UNESCAPED_UNICODE);

                try {
                    // Usamos INSERT IGNORE ou Update Condicional para não sobrescrever edições manuais no Frontend
                    $sqlAbs = "INSERT INTO coordination_records (id, type, teacherId, teacherName, deliveryDate, status, observation)
                               VALUES (:id, 'TEACHER_ABSENCE', :tId, :tName, :date, :status, :obs)
                               ON DUPLICATE KEY UPDATE 
                               status = IF(observation NOT LIKE '%\"manualOverride\":true%', :status, status),
                               observation = IF(observation NOT LIKE '%\"manualOverride\":true%', :obs, observation)";
                    $stmtAbs = $conn->prepare($sqlAbs);
                    $stmtAbs->execute([
                        ':id' => $recordId,
                        ':tId' => $teacher['id'],
                        ':tName' => $teacher['name'],
                        ':date' => $dateISO,
                        ':status' => $statusStr,
                        ':obs' => $obsJson
                    ]);
                    $autoAbsenceCount++;
                } catch (PDOException $e) {
                    error_log("Erro inserindo falta de professor: " . $e->getMessage());
                }
            }
        }
    }

    echo json_encode([
        "success" => true,
        "processed" => $processedCount,
        "inserted" => $successCount,
        "notFound" => $notFoundCount,
        "autoAbsences" => $autoAbsenceCount,
        "skippedDates" => $skippedDateCount,
        "cleanedAbsences" => $cleanedAbsences
    ]);

} else {
    http_response_code(405);
    echo json_encode(["error" => "Método não permitido."]);
}
?>
