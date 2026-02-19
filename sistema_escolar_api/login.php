<?php
require 'cors.php';
require 'conexao.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = getBody();
    
    $stmt = $pdo->prepare("SELECT * FROM users WHERE email = ? AND password = ?");
    $stmt->execute([$data['email'], $data['password']]);
    $user = $stmt->fetch();

    if ($user) {
        $user['allowedGrades'] = json_decode($user['allowedGrades']);
        echo json_encode($user);
    } else {
        http_response_code(401); // Não autorizado
        echo json_encode(["error" => "Credenciais inválidas"]);
    }
}
?>