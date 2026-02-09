<?php
// conexao.php

// Configurações do Banco
$host = 'localhost';
$port = '3306';
$dbname = 'sistema_escolar'; // Alterado para o banco correto do XAMPP
$username = 'root';
$password = '';

try {
    // Usando 127.0.0.1 em vez de localhost as vezes ajuda com problemas de socket no Windows
    // Mas vamos manter localhost por enquanto.
    $dsn = "mysql:host=$host;dbname=$dbname;charset=utf8";
    
    // Adicionar porta se necessário (mas padrão 3306 geralmente funciona sem especificar)
    // $dsn .= ";port=$port";

    $pdo = new PDO($dsn, $username, $password);
    
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => "Erro de conexão: " . $e->getMessage()]);
    exit;
}
?>