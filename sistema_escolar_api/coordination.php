<?php
// Ensure errors are reported as JSON
error_reporting(E_ALL);
ini_set('display_errors', 0); // Disable HTML errors, we handle manually
ini_set('log_errors', 1);

// Custom Error Handler to return JSON on fatal errors
function exception_handler($e) {
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode(["error" => $e->getMessage(), "file" => $e->getFile(), "line" => $e->getLine()]);
    exit;
}
set_exception_handler('exception_handler');

// Ensure PDO extension is loaded
if (!extension_loaded('pdo_mysql')) {
    http_response_code(500);
    echo json_encode(["error" => "Extensão PHP 'pdo_mysql' não carregada. Verifique seu php.ini."]);
    exit;
}

require 'cors.php';
require 'conexao.php';

// Helper to check and create table if not exists
function ensureCoordinationTable($pdo) {
    try {
        $check = $pdo->query("SHOW TABLES LIKE 'coordination_deliveries'");
        if ($check->rowCount() == 0) {
            $sql = "CREATE TABLE IF NOT EXISTS coordination_deliveries (
                id VARCHAR(50) PRIMARY KEY,
                teacherId VARCHAR(50) NOT NULL,
                teacherName VARCHAR(255) NOT NULL,
                type VARCHAR(20) NOT NULL,
                status VARCHAR(20),
                deadline VARCHAR(20),
                deliveryDate VARCHAR(20),
                fileUrl TEXT,
                observation TEXT,
                metadata TEXT
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;";
            $pdo->exec($sql);
        }
    } catch (PDOException $e) {
        error_log("Table check failed: " . $e->getMessage());
    }
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method == 'GET') {
    try {
        ensureCoordinationTable($pdo);

        $stmt = $pdo->prepare("SELECT * FROM coordination_deliveries");
        $stmt->execute();
        $results = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Decode JSON fields for frontend
        foreach ($results as &$row) {
            $row['metadata'] = json_decode($row['metadata']);
        }

        echo json_encode($results);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["error" => $e->getMessage()]);
    }
}

if ($method == 'POST') {
    $data = getBody();

    if (!isset($data['id'])) {
        http_response_code(400);
        echo json_encode(["error" => "Dados inválidos"]);
        exit();
    }

    try {
        ensureCoordinationTable($pdo);

        $sql = "INSERT INTO coordination_deliveries (id, teacherId, teacherName, type, status, deadline, deliveryDate, fileUrl, observation, metadata)
                VALUES (:id, :teacherId, :teacherName, :type, :status, :deadline, :deliveryDate, :fileUrl, :observation, :metadata)
                ON DUPLICATE KEY UPDATE
                teacherId=:teacherId, teacherName=:teacherName, type=:type, status=:status, deadline=:deadline, deliveryDate=:deliveryDate, fileUrl=:fileUrl, observation=:observation, metadata=:metadata";

        $stmt = $pdo->prepare($sql);

        $stmt->execute([
            ':id' => $data['id'],
            ':teacherId' => $data['teacherId'],
            ':teacherName' => $data['teacherName'],
            ':type' => $data['type'],
            ':status' => $data['status'],
            ':deadline' => $data['deadline'] ?? '',
            ':deliveryDate' => $data['deliveryDate'] ?? '',
            ':fileUrl' => $data['fileUrl'] ?? '',
            ':observation' => $data['observation'] ?? '',
            ':metadata' => json_encode($data['metadata'] ?? [])
        ]);

        echo json_encode($data);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["error" => $e->getMessage()]);
    }
}

if ($method == 'DELETE') {
    $id = $_GET['id'] ?? null;
    if (!$id) {
        http_response_code(400);
        echo json_encode(["error" => "ID necessário"]);
        exit();
    }

    try {
        ensureCoordinationTable($pdo);

        $stmt = $pdo->prepare("DELETE FROM coordination_deliveries WHERE id = :id");
        $stmt->execute([':id' => $id]);
        echo json_encode(["success" => true]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["error" => $e->getMessage()]);
    }
}
?>