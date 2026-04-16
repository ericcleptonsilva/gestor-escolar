<?php
error_reporting(E_ERROR | E_PARSE);
include_once 'logger.php';
include 'db.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method == 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Ensure table exists
try {
    $conn->exec("CREATE TABLE IF NOT EXISTS school_calendar (
        id VARCHAR(50) PRIMARY KEY,
        date DATE NOT NULL,
        type VARCHAR(100) NOT NULL,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
} catch (PDOException $e) {
    logError("Migration Failed (school_calendar): " . $e->getMessage());
}

if ($method == 'GET') {
    try {
        $stmt = $conn->prepare("SELECT id, date, type, description, created_at FROM school_calendar ORDER BY date ASC");
        $stmt->execute();
        $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode($results);
    } catch (PDOException $e) {
        logError("GET Calendar Error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(["error" => $e->getMessage()]);
    }
}

if ($method == 'POST') {
    $input = file_get_contents("php://input");
    $data = json_decode($input, true);

    try {
        $sql = "INSERT INTO school_calendar (id, date, type, description)
                VALUES (:id, :date, :type, :description)
                ON DUPLICATE KEY UPDATE
                type=:type, description=:description";

        $stmt = $conn->prepare($sql);

        $stmt->execute([
            ':id' => $data['id'],
            ':date' => $data['date'],
            ':type' => $data['type'],
            ':description' => $data['description'] ?? null
        ]);

        echo json_encode($data);
    } catch (PDOException $e) {
        logError("POST Calendar Error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(["error" => $e->getMessage()]);
    }
}

if ($method == 'DELETE') {
    $id = $_GET['id'] ?? null;
    if ($id) {
        try {
            $stmt = $conn->prepare("DELETE FROM school_calendar WHERE id = :id");
            $stmt->execute([':id' => $id]);
            echo json_encode(["success" => true]);
        } catch (PDOException $e) {
            logError("DELETE Calendar Error: " . $e->getMessage());
            http_response_code(500);
            echo json_encode(["error" => $e->getMessage()]);
        }
    }
}
?>
