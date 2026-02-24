<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

include_once 'logger.php';

$host = 'localhost';
$db_name = 'sistema_escolar';
$username = 'root';
$password = '';

try {
    // Connect without database first to ensure it exists
    $conn = new PDO("mysql:host=$host;charset=utf8", $username, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // Create database if not exists
    $conn->exec("CREATE DATABASE IF NOT EXISTS `$db_name` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
    $conn->exec("USE `$db_name`");

} catch(PDOException $e) {
    logError("Connection Failed: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(["error" => "Conexão falhou: " . $e->getMessage()]);
    exit();
}
?>
