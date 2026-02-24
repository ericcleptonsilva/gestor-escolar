<?php
include 'db.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method == 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($method == 'POST') {
    try {
        $conn->exec("DELETE FROM students");
        $conn->exec("DELETE FROM attendance");
        $conn->exec("DELETE FROM documents");
        $conn->exec("DELETE FROM exams");
        $conn->exec("DELETE FROM pedagogical_records");
        // Keep users? Or reset all? App says "Apagar Tudo".
        $conn->exec("DELETE FROM users");
        // Re-seed admin is done by frontend if necessary? No, frontend seeds local.
        // Backend reset implies clearing DB.
        echo json_encode(["success" => true]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["error" => $e->getMessage()]);
    }
}
?>
