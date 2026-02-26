<?php
error_reporting(E_ERROR | E_PARSE);
include_once 'logger.php';
include 'db.php';

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

    // 1. Fetch All Students for Lookup
    try {
        $stmt = $conn->query("SELECT id, registration, shift FROM students");
        $students = $stmt->fetchAll(PDO::FETCH_ASSOC);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["error" => "Database error fetching students: " . $e->getMessage()]);
        exit();
    }

    // Normalize Student Map: normalized_reg -> student
    $studentMap = [];
    foreach ($students as $student) {
        $reg = trim($student['registration']);
        // Store exact match
        $studentMap[$reg] = $student;

        // Store normalized integer match (remove leading zeros)
        if (ctype_digit($reg)) {
            $regInt = (int)$reg;
            $studentMap[(string)$regInt] = $student;
        }
    }

    // --- TIME FILTER PARSING ---
    $startTimeInt = null;
    $endTimeInt = null;
    if (!empty($_POST['start_time'])) {
        $startTimeInt = (int)str_replace(':', '', $_POST['start_time']);
    }
    if (!empty($_POST['end_time'])) {
        $endTimeInt = (int)str_replace(':', '', $_POST['end_time']);
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

        // Find Student
        $student = null;
        if (isset($studentMap[$matriculaRaw])) {
            $student = $studentMap[$matriculaRaw];
        } elseif (ctype_digit($matriculaRaw)) {
             $matriculaInt = (int)$matriculaRaw;
             if (isset($studentMap[(string)$matriculaInt])) {
                 $student = $studentMap[(string)$matriculaInt];
             }
        }

        if (!$student) {
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

        // Mark present
        $presentStudentsByDate[$dateISO][$student['id']] = true;

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

        $key = $student['id'] . '_' . $dateISO;

        if (!isset($recordsToSave[$key])) {
            $recordsToSave[$key] = [
                'id' => uniqid(),
                'studentId' => $student['id'],
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
        $processedCount++;
    }

    fclose($handle);

    // --- AUTOMATIC ABSENCE LOGIC ---
    foreach ($shiftActivityByDate as $dateISO => $activity) {
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

            if ($shouldProcess && !isset($presentSet[$student['id']])) {
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

            $sql = "INSERT INTO attendance (id, studentId, date, status, observation)
                    VALUES (:id, :studentId, :date, :status, :observation)
                    ON DUPLICATE KEY UPDATE
                    status = VALUES(status),
                    observation = CASE
                        WHEN VALUES(status) = 'Present' AND attendance.status = 'Present' THEN CONCAT(attendance.observation, ' | ', VALUES(observation))
                        ELSE VALUES(observation)
                    END";

            // Note: The concatenation logic in SQL might be tricky if observation is null or empty.
            // Simplified logic: Overwrite status. If Present, append observation.
            // If we are inserting Absent, we overwrite whatever was there (e.g. they were marked Present manually but actually absent in file? No, usually we trust the file).
            // Actually, the Frontend logic for Present was: Append.
            // For Absent: Only insert if NOT exists.

            // To match Frontend "Only insert Absent if NOT exists", we need a different query for Absences.
            // Let's split records into Present and Absent.

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
                    observation = CONCAT(IFNULL(observation, ''), IF(observation <> '' AND observation IS NOT NULL, ' | ', ''), :observation)");

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

    echo json_encode([
        "success" => true,
        "processed" => $processedCount,
        "present" => $successCount,
        "absent" => $autoAbsenceCount,
        "notFound" => $notFoundCount,
        "datesProcessed" => count($shiftActivityByDate)
    ]);
}
?>
