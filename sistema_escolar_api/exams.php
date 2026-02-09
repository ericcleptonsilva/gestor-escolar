<?php
require 'cors.php';
require 'conexao.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    // Lista todos os exams
    $stmt = $pdo->query("SELECT * FROM exams");
    echo json_encode($stmt->fetchAll());

} elseif ($method === 'POST') {
    // Salva ou Atualiza
    $data = getBody();
    
    // Note que aqui usamos os campos CORRETOS da tabela EXAMS
    $sql = "REPLACE INTO exams (id, studentId, subject, originalDate, scheduledDate, reason, status, period) 
        VALUES (:id, :studentId, :subject, :originalDate, :scheduledDate, :reason, :status, :period)";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        ':id' => $data['id'],
        ':studentId' => $data['studentId'], // Corrigido
        ':subject' => $data['subject'],     // Corrigido
        ':originalDate' => $data['originalDate'],
        ':scheduledDate' => $data['scheduledDate'] ?? '',
        ':reason' => $data['reason'] ?? '',
        ':status' => $data['status'],
        ':period' => $data['period'] ?? ''
    ]);
    
    echo json_encode($data);

} elseif ($method === 'DELETE') {
    $id = $_GET['id'] ?? null;
    if ($id) {
        $stmt = $pdo->prepare("DELETE FROM exams WHERE id = ?");
        $stmt->execute([$id]);
        echo json_encode(["success" => true]);
    }
}
?>