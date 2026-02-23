<?php
include 'cors.php';

$results = [
    "php_version" => phpversion(),
    "mysql_extension" => extension_loaded('pdo_mysql') ? "OK" : "MISSING",
    "write_permission" => is_writable(".") ? "OK" : "FAILED",
    "database_connection" => "PENDING",
    "database_name" => "escola360",
    "tables" => []
];

$host = 'localhost';
$db_name = 'escola360';
$username = 'root';
$password = '';

try {
    $conn = new PDO("mysql:host=$host;dbname=$db_name;charset=utf8", $username, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $results["database_connection"] = "OK";

    $tables = ['students', 'users', 'attendance', 'documents', 'exams', 'subjects', 'pedagogical_records'];
    foreach ($tables as $table) {
        try {
            $stmt = $conn->query("SELECT count(*) FROM $table");
            $count = $stmt->fetchColumn();
            $results["tables"][$table] = "OK (Rows: $count)";
        } catch (PDOException $e) {
            $results["tables"][$table] = "MISSING or ERROR: " . $e->getMessage();
        }
    }

} catch(PDOException $e) {
    $results["database_connection"] = "FAILED: " . $e->getMessage();
    // Try without DB to see if it's just the DB missing
    try {
        $conn = new PDO("mysql:host=$host;charset=utf8", $username, $password);
        $results["server_connection"] = "OK (But DB '$db_name' not found)";
    } catch (PDOException $e2) {
        $results["server_connection"] = "FAILED";
    }
}

echo json_encode($results, JSON_PRETTY_PRINT);
?>
