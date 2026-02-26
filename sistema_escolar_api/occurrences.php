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
// MIGRATION: Ensure 'student_occurrences' table exists
// ------------------------------------------------------------------------------------------------
try {
    $conn->exec("CREATE TABLE IF NOT EXISTS student_occurrences (
        id VARCHAR(50) PRIMARY KEY,
        student_id VARCHAR(50) NOT NULL,
        type VARCHAR(50) NOT NULL DEFAULT 'ConsecutiveAbsence',
        status VARCHAR(50) NOT NULL, -- 'Contacted' | 'NotContacted'
        date DATE,
        observation TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
} catch (PDOException $e) {
    logError("Migration Failed (student_occurrences): " . $e->getMessage());
}
// ------------------------------------------------------------------------------------------------

if ($method == 'GET') {
    try {
        // Alias columns to match frontend camelCase expectations
        $stmt = $conn->prepare("SELECT id, student_id as studentId, type, status, date, observation, created_at FROM student_occurrences ORDER BY created_at DESC");
        $stmt->execute();
        $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode($results);
    } catch (PDOException $e) {
        logError("GET Occurrences Error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(["error" => $e->getMessage()]);
    }
}

if ($method == 'POST') {
    $input = file_get_contents("php://input");
    $data = json_decode($input, true);

    try {
        $sql = "INSERT INTO student_occurrences (id, student_id, type, status, date, observation)
                VALUES (:id, :student_id, :type, :status, :date, :observation)
                ON DUPLICATE KEY UPDATE
                status=:status, date=:date, observation=:observation";

        $stmt = $conn->prepare($sql);

        $stmt->execute([
            ':id' => $data['id'],
            ':student_id' => $data['studentId'], // Frontend uses camelCase studentId
            ':type' => $data['type'] ?? 'ConsecutiveAbsence',
            ':status' => $data['status'],
            ':date' => $data['date'] ?? null,
            ':observation' => $data['observation'] ?? null
        ]);

        echo json_encode($data);
    } catch (PDOException $e) {
        logError("POST Occurrence Error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(["error" => $e->getMessage()]);
    }
}

if ($method == 'DELETE') {
    $id = $_GET['id'] ?? null;
    if ($id) {
        try {
            $stmt = $conn->prepare("DELETE FROM student_occurrences WHERE id = :id");
            $stmt->execute([':id' => $id]);
            echo json_encode(["success" => true]);
        } catch (PDOException $e) {
            logError("DELETE Occurrence Error: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(["error" => $e->getMessage()]);
        }
    }
}
?>
