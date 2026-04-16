<?php
include 'db.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method == 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($method == 'GET') {
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

    $isNew = empty($data['id']) || !$conn->query("SELECT id FROM users WHERE id = '{$data['id']}' LIMIT 1")->fetch();

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
