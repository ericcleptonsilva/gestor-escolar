<?php
include 'db.php';
$stmt = $conn->query("SELECT * FROM teacher_schedule_history");
echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
