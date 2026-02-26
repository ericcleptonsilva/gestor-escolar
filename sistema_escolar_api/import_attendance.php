<?php
error_reporting(E_ERROR | E_PARSE);
include_once 'logger.php';
include 'db.php';

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $input = file_get_contents("php://input");
    $records = json_decode($input, true);

    if (!is_array($records)) {
        http_response_code(400);
        echo json_encode(["error" => "Invalid input: expected an array of attendance records."]);
        exit();
    }

    $successCount = 0;
    $failCount = 0;
    $errors = [];

    try {
        $conn->beginTransaction();

        $sql = "INSERT INTO attendance (id, studentId, date, status, observation)
                VALUES (:id, :studentId, :date, :status, :observation)
                ON DUPLICATE KEY UPDATE
                studentId=:studentId, date=:date, status=:status, observation=:observation";

        $stmt = $conn->prepare($sql);

        foreach ($records as $record) {
            try {
                if (empty($record['id'])) {
                    $record['id'] = uniqid();
                }

                $stmt->execute([
                    ':id' => $record['id'],
                    ':studentId' => $record['studentId'],
                    ':date' => $record['date'],
                    ':status' => $record['status'],
                    ':observation' => $record['observation'] ?? ''
                ]);
                $successCount++;
            } catch (PDOException $e) {
                $failCount++;
                $errors[] = "Error saving attendance for student " . ($record['studentId'] ?? '?') . ": " . $e->getMessage();
            }
        }

        $conn->commit();
        echo json_encode([
            "success" => true,
            "processed" => count($records),
            "successCount" => $successCount,
            "failCount" => $failCount,
            "errors" => $errors
        ]);

    } catch (PDOException $e) {
        $conn->rollBack();
        logError("Batch Attendance Import Error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(["error" => "Transaction failed: " . $e->getMessage()]);
    }
}
?>
