<?php
require 'cors.php';
require 'conexao.php';

// Helper to check and create table if not exists
function ensurePedagogicalTable($pdo) {
    try {
        $check = $pdo->query("SHOW TABLES LIKE 'pedagogical_records'");
        if ($check->rowCount() == 0) {
            $sql = "CREATE TABLE IF NOT EXISTS pedagogical_records (
                id VARCHAR(50) PRIMARY KEY,
                teacherName VARCHAR(255) NOT NULL,
                weekStart VARCHAR(20) NOT NULL,
                checklist TEXT,
                classHours TEXT,
                observation TEXT,
                missed_classes TEXT
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;";
            $pdo->exec($sql);
        } else {
             // Check for column migration (missed_classes)
            $colCheck = $pdo->query("SHOW COLUMNS FROM pedagogical_records LIKE 'missed_classes'");
            if ($colCheck->rowCount() == 0) {
                $pdo->exec("ALTER TABLE pedagogical_records ADD COLUMN missed_classes TEXT");
            }
        }
    } catch (PDOException $e) {
        // Log error or handle silently? Best to let it fail later if critical.
    }
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method == 'GET') {
    try {
        ensurePedagogicalTable($pdo);

        $stmt = $pdo->prepare("SELECT * FROM pedagogical_records");
        $stmt->execute();
        $results = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Decode JSON fields for frontend
        foreach ($results as &$row) {
            $row['checklist'] = json_decode($row['checklist']);
            $row['classHours'] = json_decode($row['classHours']);
            $row['missedClasses'] = isset($row['missed_classes']) ? json_decode($row['missed_classes']) : [];
            unset($row['missed_classes']); // Map back to camelCase for JS
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
        ensurePedagogicalTable($pdo);

        $sql = "INSERT INTO pedagogical_records (id, teacherName, weekStart, checklist, classHours, observation, missed_classes)
                VALUES (:id, :teacherName, :weekStart, :checklist, :classHours, :observation, :missed_classes)
                ON DUPLICATE KEY UPDATE
                teacherName=:teacherName, weekStart=:weekStart, checklist=:checklist, classHours=:classHours, observation=:observation, missed_classes=:missed_classes";

        $stmt = $pdo->prepare($sql);

        $stmt->execute([
            ':id' => $data['id'],
            ':teacherName' => $data['teacherName'],
            ':weekStart' => $data['weekStart'],
            ':checklist' => json_encode($data['checklist']),
            ':classHours' => json_encode($data['classHours']),
            ':observation' => $data['observation'] ?? '',
            ':missed_classes' => json_encode($data['missedClasses'] ?? [])
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
        ensurePedagogicalTable($pdo);

        $stmt = $pdo->prepare("DELETE FROM pedagogical_records WHERE id = :id");
        $stmt->execute([':id' => $id]);
        echo json_encode(["success" => true]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["error" => $e->getMessage()]);
    }
}
?>
