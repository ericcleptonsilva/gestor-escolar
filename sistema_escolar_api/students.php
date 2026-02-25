<?php
require 'cors.php';
require 'conexao.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    // Lista todos os estudantes
    $stmt = $pdo->query("SELECT * FROM students");
    $students = $stmt->fetchAll();
    
    // Converte campos especiais de volta para o formato do App
    foreach ($students as &$s) {
        $s['guardians'] = json_decode($s['guardians'] ?? '[]');
        $s['turnstileRegistered'] = (bool)$s['turnstileRegistered'];
    }
    echo json_encode($students);

} elseif ($method === 'POST') {
    // Salva ou Atualiza (REPLACE INTO)
    $data = getBody();
    
    $sql = "REPLACE INTO students (
        id, name, registration, sequenceNumber, birthDate, grade, shift, email, photoUrl, 
        fatherName, fatherPhone, motherName, motherPhone, guardians, bookStatus, peStatus, turnstileRegistered
    ) VALUES (
        :id, :name, :registration, :sequenceNumber, :birthDate, :grade, :shift, :email, :photoUrl, 
        :fatherName, :fatherPhone, :motherName, :motherPhone, :guardians, :bookStatus, :peStatus, :turnstileRegistered
    )";

    $stmt = $pdo->prepare($sql);
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
        ':guardians' => json_encode($data['guardians']), // Array -> String
        ':bookStatus' => $data['bookStatus'],
        ':peStatus' => $data['peStatus'],
        ':turnstileRegistered' => $data['turnstileRegistered'] ? 1 : 0
    ]);
    
    echo json_encode($data);

} elseif ($method === 'DELETE') {
    // Deleta pelo ID passado na URL
    $id = $_GET['id'] ?? null;
    if ($id) {
        $stmt = $pdo->prepare("DELETE FROM students WHERE id = ?");
        $stmt->execute([$id]);
        echo json_encode(["success" => true]);
    }
}
?>