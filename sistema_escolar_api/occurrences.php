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
function ensureOccurrencesTable($pdo) {
    try {
        $check = $pdo->query("SHOW TABLES LIKE 'occurrences'");
        if ($check->rowCount() == 0) {
            $sql = "CREATE TABLE IF NOT EXISTS occurrences (
                id VARCHAR(50) PRIMARY KEY,
                studentId VARCHAR(50) NOT NULL,
                date VARCHAR(20) NOT NULL,
                type VARCHAR(50) NOT NULL,
                description TEXT,
                contactedParents TINYINT(1) DEFAULT 0
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;";
            $pdo->exec($sql);
        }
    } catch (PDOException $e) {
        // Log error or handle silently? Best to let it fail later if critical.
        error_log("Table check failed: " . $e->getMessage());
    }
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method == 'GET') {
    try {
        ensureOccurrencesTable($pdo);

        $stmt = $pdo->prepare("SELECT * FROM occurrences");
        $stmt->execute();
        $results = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Decode boolean fields for frontend
        foreach ($results as &$row) {
            $row['contactedParents'] = $row['contactedParents'] == 1;
        }

        echo json_encode($results);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["error" => $e->getMessage()]);
    }
}

if ($method == 'POST') {
    $data = getBody();

    if (!isset($data['id']) || !isset($data['studentId'])) {
        http_response_code(400);
        echo json_encode(["error" => "Dados inválidos"]);
        exit();
    }

    try {
        ensureOccurrencesTable($pdo);

        $sql = "INSERT INTO occurrences (id, studentId, date, type, description, contactedParents)
                VALUES (:id, :studentId, :date, :type, :description, :contactedParents)
                ON DUPLICATE KEY UPDATE
                studentId=:studentId, date=:date, type=:type, description=:description, contactedParents=:contactedParents";

        $stmt = $pdo->prepare($sql);

        $stmt->execute([
            ':id' => $data['id'],
            ':studentId' => $data['studentId'],
            ':date' => $data['date'],
            ':type' => $data['type'],
            ':description' => $data['description'] ?? '',
            ':contactedParents' => ($data['contactedParents'] === true || $data['contactedParents'] == 1) ? 1 : 0
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
        ensureOccurrencesTable($pdo);

        $stmt = $pdo->prepare("DELETE FROM occurrences WHERE id = :id");
        $stmt->execute([':id' => $id]);
        echo json_encode(["success" => true]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["error" => $e->getMessage()]);
    }
}
?>
