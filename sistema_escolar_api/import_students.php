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
    $students = json_decode($input, true);

    if (!is_array($students)) {
        http_response_code(400);
        echo json_encode(["error" => "Invalid input: expected an array of students."]);
        exit();
    }

    $successCount = 0;
    $failCount = 0;
    $errors = [];

    try {
        $conn->beginTransaction();

        $sql = "INSERT INTO students (id, name, registration, sequenceNumber, birthDate, grade, shift, email, photoUrl, fatherName, fatherPhone, motherName, motherPhone, guardians, bookStatus, peStatus, turnstileRegistered, hasAgenda)
                VALUES (:id, :name, :registration, :sequenceNumber, :birthDate, :grade, :shift, :email, :photoUrl, :fatherName, :fatherPhone, :motherName, :motherPhone, :guardians, :bookStatus, :peStatus, :turnstileRegistered, :hasAgenda)
                ON DUPLICATE KEY UPDATE
                name=:name, registration=:registration, sequenceNumber=:sequenceNumber, birthDate=:birthDate, grade=:grade, shift=:shift, email=:email, photoUrl=:photoUrl,
                fatherName=:fatherName, fatherPhone=:fatherPhone, motherName=:motherName, motherPhone=:motherPhone, guardians=:guardians, bookStatus=:bookStatus, peStatus=:peStatus, turnstileRegistered=:turnstileRegistered, hasAgenda=:hasAgenda";

        $stmt = $conn->prepare($sql);

        foreach ($students as $data) {
            try {
                // Ensure ID is present
                if (empty($data['id'])) {
                    $data['id'] = uniqid();
                }

                // Boolean conversions
                $turnstileInt = (!empty($data['turnstileRegistered']) && $data['turnstileRegistered'] !== 'false') ? 1 : 0;
                $hasAgendaInt = (!empty($data['hasAgenda']) && $data['hasAgenda'] !== 'false') ? 1 : 0;

                // Guardian JSON
                $guardiansJson = is_array($data['guardians']) ? json_encode($data['guardians']) : ($data['guardians'] ?? '[]');

                $stmt->execute([
                    ':id' => $data['id'],
                    ':name' => $data['name'] ?? '',
                    ':registration' => $data['registration'] ?? '',
                    ':sequenceNumber' => $data['sequenceNumber'] ?? '',
                    ':birthDate' => $data['birthDate'] ?? '',
                    ':grade' => $data['grade'] ?? '',
                    ':shift' => $data['shift'] ?? '',
                    ':email' => $data['email'] ?? '',
                    ':photoUrl' => $data['photoUrl'] ?? '',
                    ':fatherName' => $data['fatherName'] ?? '',
                    ':fatherPhone' => $data['fatherPhone'] ?? '',
                    ':motherName' => $data['motherName'] ?? '',
                    ':motherPhone' => $data['motherPhone'] ?? '',
                    ':guardians' => $guardiansJson,
                    ':bookStatus' => $data['bookStatus'] ?? 'Nao Comprou',
                    ':peStatus' => $data['peStatus'] ?? 'Pendente',
                    ':turnstileRegistered' => $turnstileInt,
                    ':hasAgenda' => $hasAgendaInt
                ]);
                $successCount++;
            } catch (PDOException $e) {
                $failCount++;
                $errors[] = "Error saving student " . ($data['name'] ?? 'Unknown') . ": " . $e->getMessage();
            }
        }

        $conn->commit();
        echo json_encode([
            "success" => true,
            "processed" => count($students),
            "successCount" => $successCount,
            "failCount" => $failCount,
            "errors" => $errors
        ]);

    } catch (PDOException $e) {
        $conn->rollBack();
        logError("Batch Import Error: " . $e->getMessage());
        http_response_code(500);
        echo json_encode(["error" => "Transaction failed: " . $e->getMessage()]);
    }
}
?>
