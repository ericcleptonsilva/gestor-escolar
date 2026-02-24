<?php
error_reporting(E_ERROR | E_PARSE);
include 'db.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method == 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Migration: Add hasAgenda column if not exists
try {
    $conn->query("SELECT hasAgenda FROM students LIMIT 1");
} catch (PDOException $e) {
    try {
        $conn->exec("ALTER TABLE students ADD COLUMN hasAgenda TINYINT(1) DEFAULT 0");
    } catch (Exception $ex) { }
}

if ($method == 'GET') {
    try {
        $stmt = $conn->prepare("SELECT * FROM students");
        $stmt->execute();
        $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
        foreach ($results as &$row) {
            $row['guardians'] = json_decode($row['guardians']);
            $row['turnstileRegistered'] = $row['turnstileRegistered'] == 1;
            $row['hasAgenda'] = isset($row['hasAgenda']) ? $row['hasAgenda'] == 1 : false;
        }
        $json = json_encode($results);
        if ($json === false) {
            http_response_code(500);
            echo json_encode(["error" => "JSON Encoding Error: " . json_last_error_msg()]);
        } else {
            echo $json;
        }
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["error" => $e->getMessage()]);
    }
}

if ($method == 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);

    try {
        $sql = "INSERT INTO students (id, name, registration, sequenceNumber, birthDate, grade, shift, email, photoUrl, fatherName, fatherPhone, motherName, motherPhone, guardians, bookStatus, peStatus, turnstileRegistered, hasAgenda)
                VALUES (:id, :name, :registration, :sequenceNumber, :birthDate, :grade, :shift, :email, :photoUrl, :fatherName, :fatherPhone, :motherName, :motherPhone, :guardians, :bookStatus, :peStatus, :turnstileRegistered, :hasAgenda)
                ON DUPLICATE KEY UPDATE
                name=:name, registration=:registration, sequenceNumber=:sequenceNumber, birthDate=:birthDate, grade=:grade, shift=:shift, email=:email, photoUrl=:photoUrl,
                fatherName=:fatherName, fatherPhone=:fatherPhone, motherName=:motherName, motherPhone=:motherPhone, guardians=:guardians, bookStatus=:bookStatus, peStatus=:peStatus, turnstileRegistered=:turnstileRegistered, hasAgenda=:hasAgenda";

        $stmt = $conn->prepare($sql);
        $stmt->execute([
            ':id' => $data['id'],
            ':name' => $data['name'],
            ':registration' => $data['registration'],
            ':sequenceNumber' => $data['sequenceNumber'],
            ':birthDate' => $data['birthDate'],
            ':grade' => $data['grade'],
            ':shift' => $data['shift'],
            ':email' => $data['email'],
            ':photoUrl' => $data['photoUrl'],
            ':fatherName' => $data['fatherName'],
            ':fatherPhone' => $data['fatherPhone'],
            ':motherName' => $data['motherName'],
            ':motherPhone' => $data['motherPhone'],
            ':guardians' => json_encode($data['guardians']),
            ':bookStatus' => $data['bookStatus'],
            ':peStatus' => $data['peStatus'],
            ':turnstileRegistered' => $data['turnstileRegistered'] ? 1 : 0,
            ':hasAgenda' => $data['hasAgenda'] ? 1 : 0
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
        $stmt = $conn->prepare("DELETE FROM students WHERE id = :id");
        $stmt->execute([':id' => $id]);
        echo json_encode(["success" => true]);
    }
}
?>
