<?php
// Test DB connection and list databases
error_reporting(E_ALL);
ini_set('display_errors', 1);

$host = 'localhost';
$username = 'root';
$password = '';

try {
    $pdo = new PDO("mysql:host=$host", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    echo "Connected to MySQL server successfully.\n";

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
