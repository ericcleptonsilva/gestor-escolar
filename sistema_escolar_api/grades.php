<?php
include 'db.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method == 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Ensure table exists
try {
    $conn->query("SELECT 1 FROM grades LIMIT 1");
} catch (PDOException $e) {
    try {
        $conn->exec("CREATE TABLE IF NOT EXISTS grades (name VARCHAR(255) PRIMARY KEY) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
    } catch (PDOException $e2) {
        // Silently fail or log, will fail on select if not created
    }
}

// SEED DEFAULT GRADES IF EMPTY
try {
    $stmt = $conn->query("SELECT COUNT(*) FROM grades");
    if ($stmt->fetchColumn() == 0) {
        $defaults = [
            "INF II", "INF III", "INF IV", "INF V",
            "1º ANO FUND I", "2º ANO FUND I", "3º ANO FUND I", "4º ANO FUND I", "5º ANO FUND I",
            "6º ANO FUND II", "7º ANO FUND II", "8º ANO FUND II", "9º ANO FUND II",
            "1º ANO MÉDIO", "2º ANO MÉDIO", "3 ANO MÉDIO"
        ];

        $insert = $conn->prepare("INSERT INTO grades (name) VALUES (:name)");
        foreach ($defaults as $grade) {
            try {
                $insert->execute([':name' => $grade]);
            } catch (PDOException $e) {
                // Ignore duplicates if any race condition
            }
        }
    }
} catch (PDOException $e) {
    // Log error but continue
    error_log("Grade Seeding Error: " . $e->getMessage());
}


if ($method == 'GET') {
    try {
        $stmt = $conn->prepare("SELECT * FROM grades");
        $stmt->execute();
        $results = $stmt->fetchAll(PDO::FETCH_COLUMN);
        echo json_encode($results);
    } catch (PDOException $e) {
        // Fallback
        echo json_encode([]);
    }
}

if ($method == 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    $grades = $data['grades'] ?? [];

    try {
        $conn->beginTransaction();
        $conn->exec("DELETE FROM grades");
        $stmt = $conn->prepare("INSERT INTO grades (name) VALUES (:name)");
        foreach ($grades as $grade) {
            $stmt->execute([':name' => $grade]);
        }
        $conn->commit();
        echo json_encode($grades);
    } catch (PDOException $e) {
        $conn->rollBack();
        http_response_code(500);
        echo json_encode(["error" => $e->getMessage()]);
    }
}
?>
