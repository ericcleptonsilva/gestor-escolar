<?php
include 'db.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method == 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($method == 'GET') {
    $stmt = $conn->prepare("SELECT * FROM exams");
    $stmt->execute();
    echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
}

if ($method == 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    $sql = "INSERT INTO exams (id, studentId, subject, originalDate, scheduledDate, reason, status, period)
            VALUES (:id, :studentId, :subject, :originalDate, :scheduledDate, :reason, :status, :period)
            ON DUPLICATE KEY UPDATE
            subject=:subject, originalDate=:originalDate, scheduledDate=:scheduledDate, reason=:reason, status=:status, period=:period";
    $stmt = $conn->prepare($sql);
    $stmt->execute([
        ':id' => $data['id'],
        ':studentId' => $data['studentId'],
        ':subject' => $data['subject'],
        ':originalDate' => $data['originalDate'],
        ':scheduledDate' => $data['scheduledDate'] ?? '',
        ':reason' => $data['reason'] ?? '',
        ':status' => $data['status'],
        ':period' => $data['period'] ?? ''
    ]);
    echo json_encode($data);
}

if ($method == 'DELETE') {
    $id = $_GET['id'] ?? null;
    if ($id) {
        $stmt = $conn->prepare("DELETE FROM exams WHERE id = :id");
        $stmt->execute([':id' => $id]);
        echo json_encode(["success" => true]);
    }
}
?>
