<?php
// conexao.php

// Configurações do Banco
$host = 'localhost';
$port = '3306'; // Porta padrão do MySQL (XAMPP)
$dbname = 'sistema_escolar'; // Nome do banco de dados (VERIFIQUE NO PHPMYADMIN SE É "sistema_escolar" OU "escola360")
$username = 'root';
$password = '';

try {
    // Tenta primeiro via socket (localhost), se falhar o PHP pode tentar TCP/IP se 127.0.0.1 for usado
    $dsn = "mysql:host=$host;dbname=$dbname;charset=utf8";
    
    // Opcional: Especificar porta explicitamente pode ajudar se o XAMPP estiver em outra porta
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