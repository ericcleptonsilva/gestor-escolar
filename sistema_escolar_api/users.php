<?php
require 'cors.php';
require 'conexao.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $stmt = $pdo->query("SELECT * FROM users");
    $users = $stmt->fetchAll();
    foreach ($users as &$u) {
        $u['allowedGrades'] = json_decode($u['allowedGrades'] ?? '[]');
    }
    echo json_encode($users);

} elseif ($method === 'POST') {
    $data = getBody();
    $sql = "REPLACE INTO users (id, name, email, password, role, photoUrl, allowedGrades) 
            VALUES (:id, :name, :email, :password, :role, :photoUrl, :allowedGrades)";
    
    $stmt = $pdo->prepare($sql);
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

} elseif ($method === 'DELETE') {
    $id = $_GET['id'] ?? null;
    if ($id) {
        $stmt = $pdo->prepare("DELETE FROM users WHERE id = ?");
        $stmt->execute([$id]);
        echo json_encode(["success" => true]);
    }
}
?>