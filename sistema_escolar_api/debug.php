<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");

$results = [
    "php_version" => phpversion(),
    "mysql_extension" => extension_loaded('pdo_mysql') ? "OK" : "MISSING",
    "write_permission" => is_writable(".") ? "OK" : "FAILED",
    "database_connection" => "PENDING",
    "database_exists" => "PENDING"
];

$host = 'localhost';
$username = 'root';
$password = '';

try {
    // 1. Connect without DB
    $conn = new PDO("mysql:host=$host;charset=utf8", $username, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $results["database_connection"] = "OK";

    // 2. Check DB existence
    $stmt = $conn->query("SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = 'sistema_escolar'");
    if ($stmt->fetch()) {
        $results["database_exists"] = "YES";
    } else {
        $results["database_exists"] = "NO (System should create it automatically)";
    }

} catch(PDOException $e) {
    $results["database_connection"] = "FAILED: " . $e->getMessage();
}

echo json_encode($results, JSON_PRETTY_PRINT);
?>
