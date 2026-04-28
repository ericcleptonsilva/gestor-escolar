<?php
include 'db.php';
$stmt = $conn->query("SELECT id, name, classes, createdAt FROM users WHERE role = 'teacher' LIMIT 5");
$teachers = $stmt->fetchAll(PDO::FETCH_ASSOC);

foreach ($teachers as &$t) {
    $t['classes_decoded'] = json_decode($t['classes'], true);
}
echo json_encode($teachers, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
?>
