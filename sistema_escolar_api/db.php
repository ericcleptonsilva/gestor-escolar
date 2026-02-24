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
    $conn = new PDO("mysql:host=$host;dbname=$db_name;charset=utf8", $username, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch(PDOException $e) {
    logError("Connection Failed: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(["error" => "Conexão falhou: " . $e->getMessage()]);
    exit();
}
?>
