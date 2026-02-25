<?php
require 'cors.php';
require 'conexao.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    echo json_encode($pdo->query("SELECT * FROM attendance")->fetchAll());

} elseif ($method === 'POST') {
    $data = getBody();
    // Use INSERT ... ON DUPLICATE KEY UPDATE para garantir atualização correta
    $sql = "INSERT INTO attendance (id, studentId, date, status, observation) 
            VALUES (:id, :studentId, :date, :status, :observation)
            ON DUPLICATE KEY UPDATE status = VALUES(status), observation = VALUES(observation)";
            
    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        ':id' => $data['id'],
        ':studentId' => $data['studentId'],
        ':date' => $data['date'],
        ':status' => $data['status'],
        ':observation' => $data['observation'] ?? ''
    ]);
    echo json_encode($data);

} elseif ($method === 'DELETE') {
    $studentId = $_GET['studentId'] ?? null;
    $date = $_GET['date'] ?? null;
    
    if ($studentId && $date) {
        $stmt = $pdo->prepare("DELETE FROM attendance WHERE studentId = ? AND date = ?");
        $stmt->execute([$studentId, $date]);
        echo json_encode(["success" => true]);
    }
}
?>