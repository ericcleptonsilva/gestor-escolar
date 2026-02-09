<?php
// conexao.php

// Configurações do Banco
$host = 'localhost';
$port = '3306'; // <--- Adicione a porta aqui (verifique no seu XAMPP)
$dbname = 'escola360';
$username = 'root';
$password = '';

try {
    // Note que adicionamos ";port=$port" dentro da string de conexão
    $dsn = "mysql:host=$host;port=$port;dbname=$dbname;charset=utf8";
    
    $pdo = new PDO($dsn, $username, $password);
    
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => "Erro de conexão: " . $e->getMessage()]);
    exit;
}
?>