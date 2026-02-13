<?php
require 'cors.php';
require 'conexao.php';

// Ensure table exists
function ensureTeacherAttendanceTable($pdo) {
    try {
        $check = $pdo->query("SHOW TABLES LIKE 'teacher_attendance'");
        if ($check->rowCount() == 0) {
            $sql = "CREATE TABLE IF NOT EXISTS teacher_attendance (
                id VARCHAR(50) PRIMARY KEY,
                teacherId VARCHAR(50) NOT NULL,
                date DATE NOT NULL,
                status VARCHAR(20) NOT NULL,
                time VARCHAR(10),
                observation TEXT,
                INDEX (teacherId),
                INDEX (date)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;";
            $pdo->exec($sql);
        }
    } catch (PDOException $e) {
        error_log("Teacher Attendance table check failed: " . $e->getMessage());
    }
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    ensureTeacherAttendanceTable($pdo);
    $stmt = $pdo->query("SELECT * FROM teacher_attendance");
    echo json_encode($stmt->fetchAll());

} elseif ($method === 'POST') {
    ensureTeacherAttendanceTable($pdo);
    $data = getBody();

    if (!isset($data['id']) || !isset($data['teacherId']) || !isset($data['date'])) {
        http_response_code(400);
        echo json_encode(["error" => "ID, TeacherId e Date são obrigatórios"]);
        exit;
    }

    $sql = "REPLACE INTO teacher_attendance (id, teacherId, date, status, time, observation)
            VALUES (:id, :teacherId, :date, :status, :time, :observation)";

    try {
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            ':id' => $data['id'],
            ':teacherId' => $data['teacherId'],
            ':date' => $data['date'],
            ':status' => $data['status'],
            ':time' => $data['time'] ?? '',
            ':observation' => $data['observation'] ?? ''
        ]);
        echo json_encode($data);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["error" => "Erro ao salvar frequência: " . $e->getMessage()]);
    }

} elseif ($method === 'DELETE') {
    $id = $_GET['id'] ?? null;
    if ($id) {
        ensureTeacherAttendanceTable($pdo);
        $stmt = $pdo->prepare("DELETE FROM teacher_attendance WHERE id = ?");
        $stmt->execute([$id]);
        echo json_encode(["success" => true]);
    }
}
?>
