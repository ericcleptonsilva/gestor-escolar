<?php
require 'cors.php';
require 'conexao.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    // Retorna array simples de strings ["Matemática", "Português"]
    $stmt = $pdo->query("SELECT name FROM subjects");
    echo json_encode($stmt->fetchAll(PDO::FETCH_COLUMN));

} elseif ($method === 'POST') {
    $data = getBody();
    // O JS manda { subjects: ["A", "B"] }
    $subjects = $data['subjects'] ?? [];

    $pdo->beginTransaction();
    try {
        $pdo->exec("DELETE FROM subjects");
        $stmt = $pdo->prepare("INSERT INTO subjects (name) VALUES (?)");
        foreach ($subjects as $sub) {
            $stmt->execute([$sub]);
        }
        $pdo->commit();
        echo json_encode($subjects);
    } catch (Exception $e) {
        $pdo->rollBack();
        http_response_code(500);
        echo json_encode(["error" => "Erro ao atualizar matérias"]);
    }
}
?>