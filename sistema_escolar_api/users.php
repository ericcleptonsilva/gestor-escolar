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
    }
    echo json_encode($results);
}

if ($method == 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    $sql = "INSERT INTO users (id, name, email, password, role, photoUrl, allowedGrades)
            VALUES (:id, :name, :email, :password, :role, :photoUrl, :allowedGrades)
            ON DUPLICATE KEY UPDATE
            name=:name, email=:email, password=:password, role=:role, photoUrl=:photoUrl, allowedGrades=:allowedGrades";
    $stmt = $conn->prepare($sql);
    $stmt->execute([
        ':id' => $data['id'],
        ':name' => $data['name'],
        ':email' => $data['email'],
        ':password' => $data['password'],
        ':role' => $data['role'],
        ':photoUrl' => $data['photoUrl'],
        ':allowedGrades' => json_encode($data['allowedGrades'])
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
