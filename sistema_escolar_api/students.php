<?php
error_reporting(E_ERROR | E_PARSE);
include_once 'logger.php';
include 'db.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method == 'OPTIONS') {
    http_response_code(200);
    exit();
}

// ------------------------------------------------------------------------------------------------
// MIGRATION: Ensure 'hasAgenda' column exists using robust SHOW COLUMNS check
// ------------------------------------------------------------------------------------------------
try {
    $stmt = $conn->query("SHOW COLUMNS FROM students LIKE 'hasAgenda'");
    if ($stmt->rowCount() == 0) {
        logError("Migrating table students: Adding hasAgenda column");
        $conn->exec("ALTER TABLE students ADD COLUMN hasAgenda TINYINT(1) DEFAULT 0");
    }
} catch (PDOException $e) {
    // Fallback or log if SHOW COLUMNS fails (e.g. permissions)
    logError("Migration Check Failed: " . $e->getMessage());
}
// ------------------------------------------------------------------------------------------------

if ($method == 'GET') {
    try {
        $stmt = $conn->prepare("SELECT * FROM students");
        $stmt->execute();
        $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
        foreach ($results as &$row) {
            $row['guardians'] = json_decode($row['guardians']);
            $row['turnstileRegistered'] = $row['turnstileRegistered'] == 1;
            // Handle NULL or integer/string conversion safely
            $row['hasAgenda'] = isset($row['hasAgenda']) ? ($row['hasAgenda'] == 1 || $row['hasAgenda'] === true || $row['hasAgenda'] === '1') : false;
        }
        $json = json_encode($results);
        if ($json === false) {
            $msg = "JSON Encoding Error: " . json_last_error_msg();
            logError($msg);
            http_response_code(500);
            echo json_encode(["error" => $msg]);
        } else {
            echo $json;
        }
    } catch (PDOException $e) {
        logError("GET Students Error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(["error" => $e->getMessage()]);
    }
}

if ($method == 'POST') {
    $input = file_get_contents("php://input");
    $data = json_decode($input, true);

    // Debug Log: Check incoming data for hasAgenda
    $hasAgendaVal = isset($data['hasAgenda']) ? ($data['hasAgenda'] ? 'TRUE' : 'FALSE') : 'MISSING';
    // logError("Saving Student: " . ($data['name'] ?? 'Unknown') . " | hasAgenda: " . $hasAgendaVal);

    try {
        $sql = "INSERT INTO students (id, name, registration, sequenceNumber, birthDate, grade, shift, email, photoUrl, fatherName, fatherPhone, motherName, motherPhone, guardians, bookStatus, peStatus, turnstileRegistered, hasAgenda)
                VALUES (:id, :name, :registration, :sequenceNumber, :birthDate, :grade, :shift, :email, :photoUrl, :fatherName, :fatherPhone, :motherName, :motherPhone, :guardians, :bookStatus, :peStatus, :turnstileRegistered, :hasAgenda)
                ON DUPLICATE KEY UPDATE
                name=:name, registration=:registration, sequenceNumber=:sequenceNumber, birthDate=:birthDate, grade=:grade, shift=:shift, email=:email, photoUrl=:photoUrl,
                fatherName=:fatherName, fatherPhone=:fatherPhone, motherName=:motherName, motherPhone=:motherPhone, guardians=:guardians, bookStatus=:bookStatus, peStatus=:peStatus, turnstileRegistered=:turnstileRegistered, hasAgenda=:hasAgenda";

        $stmt = $conn->prepare($sql);

        // Explicit boolean to integer conversion
        $turnstileInt = (!empty($data['turnstileRegistered']) && $data['turnstileRegistered'] !== 'false') ? 1 : 0;
        $hasAgendaInt = (!empty($data['hasAgenda']) && $data['hasAgenda'] !== 'false') ? 1 : 0;

        $stmt->execute([
            ':id' => $data['id'],
            ':name' => $data['name'],
            ':registration' => $data['registration'],
            ':sequenceNumber' => $data['sequenceNumber'],
            ':birthDate' => $data['birthDate'],
            ':grade' => $data['grade'],
            ':shift' => $data['shift'],
            ':email' => $data['email'],
            ':photoUrl' => $data['photoUrl'],
            ':fatherName' => $data['fatherName'],
            ':fatherPhone' => $data['fatherPhone'],
            ':motherName' => $data['motherName'],
            ':motherPhone' => $data['motherPhone'],
            ':guardians' => json_encode($data['guardians']),
            ':bookStatus' => $data['bookStatus'],
            ':peStatus' => $data['peStatus'],
            ':turnstileRegistered' => $turnstileInt,
            ':hasAgenda' => $hasAgendaInt
        ]);

        // Return the data exactly as processed to confirm state
        $data['hasAgenda'] = ($hasAgendaInt === 1);
        $data['turnstileRegistered'] = ($turnstileInt === 1);

        echo json_encode($data);
    } catch (PDOException $e) {
        logError("POST Student Error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(["error" => $e->getMessage()]);
    }
}

if ($method == 'DELETE') {
    $id = $_GET['id'] ?? null;
    if ($id) {
        $stmt = $conn->prepare("DELETE FROM students WHERE id = :id");
        $stmt->execute([':id' => $id]);
        echo json_encode(["success" => true]);
    }
}
?>
