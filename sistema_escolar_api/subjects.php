<?php
include 'db.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method == 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($method == 'GET') {
    try {
        $stmt = $conn->prepare("SELECT * FROM subjects");
        $stmt->execute();
        $results = $stmt->fetchAll(PDO::FETCH_COLUMN);
        echo json_encode($results);
    } catch (PDOException $e) {
        // Fallback for first run
        echo json_encode([]);
    }
}

if ($method == 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    $subjects = $data['subjects'] ?? [];

    try {
        $conn->exec("DELETE FROM subjects");
        $stmt = $conn->prepare("INSERT INTO subjects (name) VALUES (:name)");
        foreach ($subjects as $sub) {
            $stmt->execute([':name' => $sub]);
        }
        echo json_encode($subjects);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["error" => $e->getMessage()]);
    }
}
?>
