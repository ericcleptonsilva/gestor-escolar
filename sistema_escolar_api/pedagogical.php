<?php
include 'db.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method == 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($method == 'GET') {
    try {
        // Ensure table exists (basic migration check)
        // In production, this should be in a separate migration script, but for XAMPP drag-drop ease:
        $check = $conn->query("SHOW TABLES LIKE 'pedagogical_records'");
        if ($check->rowCount() == 0) {
            echo json_encode([]);
            exit();
        }

        $stmt = $conn->prepare("SELECT * FROM pedagogical_records");
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
    $data = json_decode(file_get_contents("php://input"), true);

    if (!isset($data['id'])) {
        http_response_code(400);
        echo json_encode(["error" => "Dados inválidos"]);
        exit();
    }

    try {
        // Check for column migration
        $colCheck = $conn->query("SHOW COLUMNS FROM pedagogical_records LIKE 'missed_classes'");
        if ($colCheck->rowCount() == 0) {
            $conn->exec("ALTER TABLE pedagogical_records ADD COLUMN missed_classes TEXT");
        }

        $sql = "INSERT INTO pedagogical_records (id, teacherName, weekStart, checklist, classHours, observation, missed_classes)
                VALUES (:id, :teacherName, :weekStart, :checklist, :classHours, :observation, :missed_classes)
                ON DUPLICATE KEY UPDATE
                teacherName=:teacherName, weekStart=:weekStart, checklist=:checklist, classHours=:classHours, observation=:observation, missed_classes=:missed_classes";

        $stmt = $conn->prepare($sql);

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
        $stmt = $conn->prepare("DELETE FROM pedagogical_records WHERE id = :id");
        $stmt->execute([':id' => $id]);
        echo json_encode(["success" => true]);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["error" => $e->getMessage()]);
    }
}
?>
