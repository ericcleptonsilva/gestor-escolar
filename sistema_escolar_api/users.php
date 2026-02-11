<?php
require 'cors.php';
require 'conexao.php';

// Ensure table exists
function ensureUsersTable($pdo) {
    try {
        $check = $pdo->query("SHOW TABLES LIKE 'users'");
        if ($check->rowCount() == 0) {
            $sql = "CREATE TABLE IF NOT EXISTS users (
                id VARCHAR(50) PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) NOT NULL,
                password VARCHAR(255) NOT NULL,
                role VARCHAR(50) NOT NULL,
                photoUrl TEXT,
                allowedGrades TEXT
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;";
            $pdo->exec($sql);
        }
    } catch (PDOException $e) {
        error_log("Users table check failed: " . $e->getMessage());
    }
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    ensureUsersTable($pdo);
    $stmt = $pdo->query("SELECT * FROM users");
    $users = $stmt->fetchAll();
    foreach ($users as &$u) {
        $u['allowedGrades'] = json_decode($u['allowedGrades'] ?? '[]');
    }
    echo json_encode($users);

} elseif ($method === 'POST') {
    ensureUsersTable($pdo);
    $data = getBody();

    if (!isset($data['id'])) {
        http_response_code(400);
        echo json_encode(["error" => "ID é obrigatório"]);
        exit;
    }

    $sql = "REPLACE INTO users (id, name, email, password, role, photoUrl, allowedGrades) 
            VALUES (:id, :name, :email, :password, :role, :photoUrl, :allowedGrades)";
    
    try {
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            ':id' => $data['id'],
            ':name' => $data['name'],
            ':email' => $data['email'],
            ':password' => $data['password'],
            ':role' => $data['role'],
            ':photoUrl' => $data['photoUrl'],
            ':allowedGrades' => json_encode($data['allowedGrades'] ?? [])
        ]);
        echo json_encode($data);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["error" => "Erro ao salvar usuário: " . $e->getMessage()]);
    }

} elseif ($method === 'DELETE') {
    $id = $_GET['id'] ?? null;
    if ($id) {
        ensureUsersTable($pdo);
        $stmt = $pdo->prepare("DELETE FROM users WHERE id = ?");
        $stmt->execute([$id]);
        echo json_encode(["success" => true]);
    }
}
?>
