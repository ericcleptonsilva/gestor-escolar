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
// MIGRATION: Ensure 'soe_records' table exists
// ------------------------------------------------------------------------------------------------
try {
    $conn->exec("CREATE TABLE IF NOT EXISTS soe_records (
        id VARCHAR(50) PRIMARY KEY,
        student_id VARCHAR(50) NOT NULL,
        date DATE NOT NULL,
        reason TEXT NOT NULL,
        status VARCHAR(50) NOT NULL DEFAULT 'Pendente',
        observation TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
} catch (PDOException $e) {
    logError("Migration Failed (soe_records): " . $e->getMessage());
}
// ------------------------------------------------------------------------------------------------

if ($method == 'GET') {
    try {
        $stmt = $conn->prepare("SELECT id, student_id as studentId, date, reason, status, observation, created_at FROM soe_records ORDER BY created_at DESC");
        $stmt->execute();
        $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode($results);
    } catch (PDOException $e) {
        logError("GET SOE Error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(["error" => $e->getMessage()]);
    }
}

if ($method == 'POST') {
    $input = file_get_contents("php://input");
    $data = json_decode($input, true);

    try {
        $sql = "INSERT INTO soe_records (id, student_id, date, reason, status, observation)
                VALUES (:id, :student_id, :date, :reason, :status, :observation)
                ON DUPLICATE KEY UPDATE
                date=:date, reason=:reason, status=:status, observation=:observation";

        $stmt = $conn->prepare($sql);

        $stmt->execute([
            ':id' => $data['id'],
            ':student_id' => $data['studentId'],
            ':date' => $data['date'],
            ':reason' => $data['reason'],
            ':status' => $data['status'],
            ':observation' => $data['observation'] ?? null
        ]);

        echo json_encode($data);
    } catch (PDOException $e) {
        logError("POST SOE Error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(["error" => $e->getMessage()]);
    }
}

if ($method == 'DELETE') {
    $id = $_GET['id'] ?? null;
    if ($id) {
        try {
            $stmt = $conn->prepare("DELETE FROM soe_records WHERE id = :id");
            $stmt->execute([':id' => $id]);
            echo json_encode(["success" => true]);
        } catch (PDOException $e) {
            logError("DELETE SOE Error: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(["error" => $e->getMessage()]);
        }
    }
}
?>
