<?php
include_once 'cors.php';

$host = 'localhost';
$db_name = 'escola360';
$username = 'root';
$password = '';

try {
    // 1. Connect WITHOUT selecting database to check/create it
    $conn = new PDO("mysql:host=$host;charset=utf8", $username, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    // 2. Create database if not exists
    $conn->exec("CREATE DATABASE IF NOT EXISTS `$db_name` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");

    // 3. Select the database
    $conn->exec("USE `$db_name`");

} catch(PDOException $e) {
    http_response_code(500);
    // Return JSON error even on connection failure
    echo json_encode(["error" => "Critical Database Error: " . $e->getMessage()]);
    exit();
}

// Helper to read JSON body
function getBody() {
    return json_decode(file_get_contents("php://input"), true);
}
?>
