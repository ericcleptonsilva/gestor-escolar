<?php
require 'cors.php';
require 'conexao.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    // Lista todos os documents
    $stmt = $pdo->query("SELECT * FROM documents");
    echo json_encode($stmt->fetchAll());

} elseif ($method === 'POST') {
    $data = getBody();
    
    // Note que aqui usamos os campos CORRETOS da tabela DOCUMENTS
    $sql = "REPLACE INTO documents (id, studentId, type, description, dateIssued) 
        VALUES (:id, :studentId, :type, :description, :dateIssued)";

    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        ':id' => $data['id'],
        ':studentId' => $data['studentId'],
        ':type' => $data['type'],
        ':description' => $data['description'] ?? '',
        ':dateIssued' => $data['dateIssued']
    ]);
    
    echo json_encode($data);

} elseif ($method === 'DELETE') {
    $id = $_GET['id'] ?? null;
    if ($id) {
        $stmt = $pdo->prepare("DELETE FROM documents WHERE id = ?");
        $stmt->execute([$id]);
        echo json_encode(["success" => true]);
    }
}
?>