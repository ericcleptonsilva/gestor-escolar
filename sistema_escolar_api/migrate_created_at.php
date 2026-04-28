<?php
// migrate_created_at.php
// Execute este script UMA VEZ para adicionar as colunas createdAt ausentes
// Acesse: http://192.168.25.77:8787/sistema_escolar_api/migrate_created_at.php

header("Content-Type: text/plain; charset=UTF-8");
include 'db.php';

$results = [];

// --- 1. Adiciona createdAt em students (se não existir) ---
try {
    $conn->query("SELECT createdAt FROM students LIMIT 1");
    $results[] = "[OK] Coluna 'createdAt' já existe em 'students'.";
} catch (PDOException $e) {
    try {
        $conn->exec("ALTER TABLE students ADD COLUMN createdAt DATETIME DEFAULT NULL");
        $results[] = "[CRIADO] Coluna 'createdAt' adicionada em 'students'.";
    } catch (PDOException $e2) {
        $results[] = "[ERRO] Falha ao adicionar 'createdAt' em 'students': " . $e2->getMessage();
    }
}

// --- 2. Adiciona createdAt em users (professores) ---
try {
    $conn->query("SELECT createdAt FROM users LIMIT 1");
    $results[] = "[OK] Coluna 'createdAt' já existe em 'users'.";
} catch (PDOException $e) {
    try {
        $conn->exec("ALTER TABLE users ADD COLUMN createdAt DATETIME DEFAULT NULL");
        $results[] = "[CRIADO] Coluna 'createdAt' adicionada em 'users'.";
    } catch (PDOException $e2) {
        $results[] = "[ERRO] Falha ao adicionar 'createdAt' em 'users': " . $e2->getMessage();
    }
}

// --- 3. Verifica turnstileRegistered em students ---
try {
    $conn->query("SELECT turnstileRegistered FROM students LIMIT 1");
    $results[] = "[OK] Coluna 'turnstileRegistered' já existe em 'students'.";
} catch (PDOException $e) {
    try {
        $conn->exec("ALTER TABLE students ADD COLUMN turnstileRegistered TINYINT(1) NOT NULL DEFAULT 0");
        $results[] = "[CRIADO] Coluna 'turnstileRegistered' adicionada em 'students'.";
    } catch (PDOException $e2) {
        $results[] = "[ERRO] Falha ao adicionar 'turnstileRegistered' em 'students': " . $e2->getMessage();
    }
}

echo "=== MIGRAÇÃO DO BANCO DE DADOS ===\n\n";
foreach ($results as $r) {
    echo $r . "\n";
}
echo "\n=== CONCLUÍDO ===\n";
echo "Após verificar os resultados, você pode deletar este arquivo.\n";
?>
