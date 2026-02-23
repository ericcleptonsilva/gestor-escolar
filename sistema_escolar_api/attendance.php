<?php
include 'db.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method == 'GET') {
    $stmt = $conn->prepare("SELECT * FROM attendance");
    $stmt->execute();
    echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
}

if ($method == 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    $sql = "INSERT INTO attendance (id, studentId, date, status, observation)
            VALUES (:id, :studentId, :date, :status, :observation)
            ON DUPLICATE KEY UPDATE
            status=:status, observation=:observation";
    $stmt = $conn->prepare($sql);
    $stmt->execute([
        ':id' => $data['id'],
        ':studentId' => $data['studentId'],
        ':date' => $data['date'],
        ':status' => $data['status'],
        ':observation' => $data['observation'] ?? ''
    ]);
    echo json_encode($data);
}

if ($method == 'DELETE') {
    $studentId = $_GET['studentId'] ?? null;
    $date = $_GET['date'] ?? null;
    if ($studentId && $date) {
        $stmt = $conn->prepare("DELETE FROM attendance WHERE studentId = :studentId AND date = :date");
        $stmt->execute([':studentId' => $studentId, ':date' => $date]);
        echo json_encode(["success" => true]);
    }
}
?>
