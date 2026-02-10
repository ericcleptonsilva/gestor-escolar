<?php
// Test DB connection and list databases
error_reporting(E_ALL);
ini_set('display_errors', 1);

$host = '127.0.0.1';
$port = '3306';
$username = 'root';
$password = '';

try {
    $dsn = "mysql:host=$host;port=$port";
    $pdo = new PDO($dsn, $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    echo "Connected to MySQL server successfully (TCP/IP).\n";

    echo "Databases:\n";
    $stm = $pdo->query("SHOW DATABASES");
    $dbs = $stm->fetchAll(PDO::FETCH_ASSOC);
    foreach($dbs as $db) {
        echo "- " . $db['Database'] . "\n";
    }

} catch(PDOException $e) {
    echo "Connection failed: " . $e->getMessage() . "\n";
}
?>
