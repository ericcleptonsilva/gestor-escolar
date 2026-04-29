<?php
include 'db.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method == 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($method == 'GET') {
    if (isset($_GET['action']) && $_GET['action'] === 'history') {
        $teacherId = $_GET['teacherId'] ?? '';
        if (!$teacherId) {
            echo json_encode([]);
            exit();
        }
        $stmt = $conn->prepare("SELECT * FROM teacher_schedule_history WHERE teacherId = :tid ORDER BY createdAt DESC");
        $stmt->execute([':tid' => $teacherId]);
        $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
        foreach ($results as &$row) {
            $row['classes'] = isset($row['classes']) && $row['classes'] ? json_decode($row['classes']) : [];
        }
        echo json_encode($results);
        exit();
    }

    $stmt = $conn->prepare("SELECT * FROM users");
    $stmt->execute();
    $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
    foreach ($results as &$row) {
        $row['allowedGrades'] = json_decode($row['allowedGrades']);
        $row['classes'] = isset($row['classes']) && $row['classes'] ? json_decode($row['classes']) : [];
    }
    echo json_encode($results);
}

if ($method == 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    // Migration: Add columns if missing
    try {
        $conn->query("SELECT registration FROM users LIMIT 1");
    } catch (PDOException $e) {
        $conn->exec("ALTER TABLE users ADD COLUMN registration VARCHAR(50) DEFAULT ''");
    }

    try {
        $conn->query("SELECT classes FROM users LIMIT 1");
    } catch (PDOException $e) {
        $conn->exec("ALTER TABLE users ADD COLUMN classes TEXT"); // JSON array of TeacherClass
    }

    try {
        $conn->query("SELECT createdAt FROM users LIMIT 1");
    } catch (PDOException $e) {
        // Coluna createdAt não existe ainda – criar e preencher com a data atual para registros antigos
        $conn->exec("ALTER TABLE users ADD COLUMN createdAt DATETIME DEFAULT NULL");
        $conn->exec("UPDATE users SET createdAt = NOW() WHERE createdAt IS NULL");
    }

    try {
        $conn->query("SELECT 1 FROM teacher_schedule_history LIMIT 1");
    } catch (PDOException $e) {
        $conn->exec("CREATE TABLE teacher_schedule_history (
            id INT AUTO_INCREMENT PRIMARY KEY,
            teacherId VARCHAR(255) NOT NULL,
            classes TEXT,
            createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_teacher_date (teacherId, createdAt)
        )");
    }

    $isNew = empty($data['id']) || !$conn->query("SELECT id FROM users WHERE id = '{$data['id']}' LIMIT 1")->fetch();

    $oldClasses = null;
    if (!$isNew && $data['role'] === 'Teacher') {
        $stmtOld = $conn->prepare("SELECT classes FROM users WHERE id = :id");
        $stmtOld->execute([':id' => $data['id']]);
        $row = $stmtOld->fetch();
        if ($row) {
            $oldClasses = $row['classes'];
        }
    }

    $sql = "INSERT INTO users (id, name, email, password, role, photoUrl, allowedGrades, registration, classes, createdAt)
            VALUES (:id, :name, :email, :password, :role, :photoUrl, :allowedGrades, :registration, :classes, NOW())
            ON DUPLICATE KEY UPDATE
            name=:name, email=:email, password=:password, role=:role, photoUrl=:photoUrl, allowedGrades=:allowedGrades, registration=:registration, classes=:classes,
            createdAt=COALESCE(createdAt, NOW())";
    $stmt = $conn->prepare($sql);
    $stmt->execute([
        ':id' => $data['id'],
        ':name' => $data['name'],
        ':email' => $data['email'],
        ':password' => $data['password'],
        ':role' => $data['role'],
        ':photoUrl' => $data['photoUrl'],
        ':allowedGrades' => json_encode($data['allowedGrades']),
        ':registration' => $data['registration'] ?? '',
        ':classes' => json_encode($data['classes'] ?? [])
    ]);

    // Handle Teacher Schedule History
    if ($data['role'] === 'Teacher') {
        $newClassesStr = json_encode($data['classes'] ?? []);
        if ($isNew || $newClassesStr !== $oldClasses) {
            $stmtHist = $conn->prepare("INSERT INTO teacher_schedule_history (teacherId, classes, createdAt) VALUES (:tid, :classes, NOW())");
            $stmtHist->execute([
                ':tid' => $data['id'],
                ':classes' => $newClassesStr
            ]);
        }
    }

    echo json_encode($data);
}

if ($method == 'DELETE') {
    $id = $_GET['id'] ?? null;
    if ($id) {
        $stmt = $conn->prepare("DELETE FROM users WHERE id = :id");
        $stmt->execute([':id' => $id]);
        echo json_encode(["success" => true]);
    }
}
?>
