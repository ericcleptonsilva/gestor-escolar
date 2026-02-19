<?php
require 'cors.php';
require 'conexao.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    exit();
}

try {
    // Disable FK checks to allow truncation
    $pdo->exec("SET FOREIGN_KEY_CHECKS = 0");

    // List of tables to clear
    $tables = [
        'students',
        'attendance',
        'documents',
        'exams',
        'pedagogical_records',
        'subjects',
        'users' // Be careful with users!
    ];

    foreach ($tables as $table) {
        // Check if table exists before truncating to avoid errors
        $check = $pdo->query("SHOW TABLES LIKE '$table'");
        if ($check->rowCount() > 0) {
            $pdo->exec("TRUNCATE TABLE $table");
        }
    }

    // Re-enable FK checks
    $pdo->exec("SET FOREIGN_KEY_CHECKS = 1");

    // Re-seed Default Admin User
    // Password '123'
    $sqlAdmin = "INSERT INTO users (id, name, email, password, role, photoUrl, allowedGrades) VALUES
    ('admin1', 'Administrador Principal', 'admin@escola.com', '123', 'Admin', 'https://ui-avatars.com/api/?name=Admin&background=4f46e5&color=fff', '[]')";
    $pdo->exec($sqlAdmin);

    // Re-seed Default Subjects
    $defaultSubjects = [
        "Língua Portuguesa", "Matemática", "História", "Geografia", "Ciências",
        "Física", "Química", "Biologia", "Inglês", "Espanhol", "Artes",
        "Educação Física", "Filosofia", "Sociologia", "Redação", "Ensino Religioso"
    ];

    // Ensure subjects table exists
    $pdo->exec("CREATE TABLE IF NOT EXISTS subjects (name VARCHAR(255) PRIMARY KEY)");

    $stmtSub = $pdo->prepare("INSERT IGNORE INTO subjects (name) VALUES (?)");
    foreach ($defaultSubjects as $sub) {
        $stmtSub->execute([$sub]);
    }

    echo json_encode(["success" => true, "message" => "Sistema restaurado com sucesso."]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(["error" => "Erro ao resetar sistema: " . $e->getMessage()]);
}
?>
