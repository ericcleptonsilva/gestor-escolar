<?php
require 'sistema_escolar_api/conexao.php';

echo "Verifying Schema...\n";

// Check Users table
echo "Checking 'users' table columns:\n";
$stmt = $pdo->query("SHOW COLUMNS FROM users");
$columns = $stmt->fetchAll(PDO::FETCH_COLUMN);
if (in_array('registration', $columns)) {
    echo "PASS: 'registration' column exists.\n";
} else {
    echo "FAIL: 'registration' column MISSING.\n";
}

// Check Teacher Attendance table
echo "Checking 'teacher_attendance' table:\n";
$stmt = $pdo->query("SHOW TABLES LIKE 'teacher_attendance'");
if ($stmt->rowCount() > 0) {
    echo "PASS: 'teacher_attendance' table exists.\n";
} else {
    echo "FAIL: 'teacher_attendance' table MISSING.\n";
}

// Trigger ensure logic by calling endpoints via CLI (simulated)
// Actually we can just include the files but they expect REQUEST_METHOD
// Let's just run a curl or assume the frontend trigger will work.
// But we can call the ensure functions directly if we include the files.
// However, files have side effects (echo json).
// Better to just rely on the above checks.
?>
