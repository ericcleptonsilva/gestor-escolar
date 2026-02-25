<?php
include 'db.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method == 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Ensure table exists
try {
    $conn->query("SELECT 1 FROM coordination_records LIMIT 1");
} catch (PDOException $e) {
    try {
        $sql = "CREATE TABLE IF NOT EXISTS coordination_records (
            id VARCHAR(255) PRIMARY KEY,
            type VARCHAR(50) NOT NULL,
            teacherId VARCHAR(255),
            teacherName VARCHAR(255),
            grade VARCHAR(50),
            shift VARCHAR(50),
            subject VARCHAR(100),
            deadline DATE,
            deliveryDate DATE,
            status VARCHAR(50),
            fileUrl TEXT,
            observation TEXT,
            period VARCHAR(50),
            weekDate DATE,
            isCompleted TINYINT(1) DEFAULT 0
        ) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci";
        $conn->exec($sql);
    } catch (PDOException $e2) {
        // Log error
    }
}

if ($method == 'GET') {
    try {
        $stmt = $conn->prepare("SELECT * FROM coordination_records");
        $stmt->execute();
        $results = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Convert boolean/int to appropriate types if needed (though JSON handles strings mostly)
        foreach ($results as &$row) {
            $row['isCompleted'] = (bool)$row['isCompleted'];
        }

        echo json_encode($results);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["error" => $e->getMessage()]);
    }
}

if ($method == 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);

    if (!isset($data['id']) || !isset($data['type'])) {
        http_response_code(400);
        echo json_encode(["error" => "Dados incompletos"]);
        exit();
    }

    try {
        $sql = "INSERT INTO coordination_records (
                    id, type, teacherId, teacherName, grade, shift, subject,
                    deadline, deliveryDate, status, fileUrl, observation,
                    period, weekDate, isCompleted
                ) VALUES (
                    :id, :type, :teacherId, :teacherName, :grade, :shift, :subject,
                    :deadline, :deliveryDate, :status, :fileUrl, :observation,
                    :period, :weekDate, :isCompleted
                ) ON DUPLICATE KEY UPDATE
                    type=:type, teacherId=:teacherId, teacherName=:teacherName, grade=:grade,
                    shift=:shift, subject=:subject, deadline=:deadline, deliveryDate=:deliveryDate,
                    status=:status, fileUrl=:fileUrl, observation=:observation, period=:period,
                    weekDate=:weekDate, isCompleted=:isCompleted";

        $stmt = $conn->prepare($sql);

        $stmt->execute([
            ':id' => $data['id'],
            ':type' => $data['type'],
            ':teacherId' => $data['teacherId'] ?? null,
            ':teacherName' => $data['teacherName'] ?? '',
            ':grade' => $data['grade'] ?? null,
            ':shift' => $data['shift'] ?? null,
            ':subject' => $data['subject'] ?? null,
            ':deadline' => !empty($data['deadline']) ? $data['deadline'] : null,
            ':deliveryDate' => !empty($data['deliveryDate']) ? $data['deliveryDate'] : null,
            ':status' => $data['status'] ?? 'No Prazo',
            ':fileUrl' => $data['fileUrl'] ?? '',
            ':observation' => $data['observation'] ?? '',
            ':period' => $data['period'] ?? null,
            ':weekDate' => !empty($data['weekDate']) ? $data['weekDate'] : null,
            ':isCompleted' => isset($data['isCompleted']) && $data['isCompleted'] ? 1 : 0
        ]);

        echo json_encode($data);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["error" => $e->getMessage()]);
    }
}

if ($method == 'DELETE') {
    $id = $_GET['id'] ?? null;
    if ($id) {
        try {
            $stmt = $conn->prepare("DELETE FROM coordination_records WHERE id = :id");
            $stmt->execute([':id' => $id]);
            echo json_encode(["success" => true]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(["error" => $e->getMessage()]);
        }
    } else {
        http_response_code(400);
        echo json_encode(["error" => "ID missing"]);
    }
}
?>
