<?php
header('Content-Type: application/json');
require 'db.php';
try {
    $stmt = $conn->query("SELECT id, name, createdAt, classes FROM users WHERE role = 'Teacher'");
    $teachers = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($teachers);
} catch (PDOException $e) {
    echo json_encode(["error" => $e->getMessage()]);
}
?>
