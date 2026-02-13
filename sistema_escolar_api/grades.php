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
function ensureGradesTable($pdo) {
    try {
        $check = $pdo->query("SHOW TABLES LIKE 'grades'");
        if ($check->rowCount() == 0) {
            $sql = "CREATE TABLE IF NOT EXISTS grades (
                name VARCHAR(50) PRIMARY KEY
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
        ensureGradesTable($pdo);

        $stmt = $pdo->prepare("SELECT name FROM grades");
        $stmt->execute();
        $results = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $list = array_map(function($item) { return $item['name']; }, $results);

        echo json_encode($list);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["error" => $e->getMessage()]);
    }
}

if ($method == 'POST') {
    $data = getBody();

    if (!isset($data['grades']) || !is_array($data['grades'])) {
        http_response_code(400);
        echo json_encode(["error" => "Dados inválidos. Esperado array 'grades'."]);
        exit();
    }

    try {
        ensureGradesTable($pdo);

        $pdo->beginTransaction();

        // Full replace strategy
        $pdo->exec("DELETE FROM grades");

        $stmt = $pdo->prepare("INSERT INTO grades (name) VALUES (:name)");

        foreach ($data['grades'] as $grade) {
            if (!empty(trim($grade))) {
                $stmt->execute([':name' => trim($grade)]);
            }
        }

        $pdo->commit();

        echo json_encode($data['grades']);
    } catch (PDOException $e) {
        if ($pdo->inTransaction()) {
            $pdo->rollBack();
        }
        http_response_code(500);
        echo json_encode(["error" => $e->getMessage()]);
    }
}
?>