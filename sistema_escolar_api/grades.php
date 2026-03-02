<?php
include 'db.php';

$method = $_SERVER['REQUEST_METHOD'];

// Hardcoded Default Grades (Must match constants.ts)
$default_grades = [
    "INF II", "INF III", "INF IV", "INF V",
    "1º ANO", "2º ANO", "3º ANO", "4º ANO", "5º ANO",
    "6º ANO", "7º ANO", "8º ANO", "9º ANO",
    "1º ANO MÉDIO", "2º ANO MÉDIO", "3º ANO MÉDIO"
];

if ($method == 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Ensure table exists
try {
    $conn->query("SELECT 1 FROM grades LIMIT 1");
} catch (PDOException $e) {
    try {
        $conn->exec("CREATE TABLE IF NOT EXISTS grades (name VARCHAR(255) PRIMARY KEY) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
    } catch (PDOException $e2) {
        // Silently fail or log, will fail on select if not created
    }
}

// Self-Healing Logic: Check if table is empty or missing critical defaults
try {
    // Strategy: Fetch ALL existing grades into a set for fast lookup
    $stmt = $conn->query("SELECT name FROM grades");
    $existingGrades = $stmt->fetchAll(PDO::FETCH_COLUMN);

    // PHP array flip for O(1) lookup
    $existingMap = array_flip($existingGrades);

    $missingGrades = [];

    // Check which default grades are missing
    foreach ($default_grades as $def) {
        if (!isset($existingMap[$def])) {
            $missingGrades[] = $def;
        }
    }

    // If we have missing grades, insert them
    if (!empty($missingGrades)) {
        $conn->beginTransaction();
        $stmtInsert = $conn->prepare("INSERT INTO grades (name) VALUES (:name)");
        foreach ($missingGrades as $grade) {
            $stmtInsert->execute([':name' => $grade]);
        }
        $conn->commit();
    }

    // --- MIGRATION: Update Old Grade Names to New Standard ---
    // This fixes the issue where existing students/permissions use "1º ANO FUND I" but the new standard is "1º ANO".
    // We update the DB strings to match the new constants.

    $migrations = [
        "1º ANO FUND I" => "1º ANO",
        "2º ANO FUND I" => "2º ANO",
        "3º ANO FUND I" => "3º ANO",
        "4º ANO FUND I" => "4º ANO",
        "5º ANO FUND I" => "5º ANO",
        "6º ANO FUND II" => "6º ANO",
        "7º ANO FUND II" => "7º ANO",
        "8º ANO FUND II" => "8º ANO",
        "9º ANO FUND II" => "9º ANO",
        "3 ANO MÉDIO" => "3º ANO MÉDIO" // Typo fix
    ];

    foreach ($migrations as $old => $new) {
        // 1. Update Students
        $conn->exec("UPDATE students SET grade = '$new' WHERE grade = '$old'");

        // 2. Update Grades Table (Delete old if exists, ensuring new exists)
        // If 'old' exists in grades table, remove it (since 'new' was likely added by self-healing above)
        $conn->exec("DELETE FROM grades WHERE name = '$old'");

        // 3. Update Users allowedGrades?
        // This is harder because it's JSON. A robust SQL REPLACE on JSON text is risky but workable for simple strings.
        // We replace "1º ANO FUND I" with "1º ANO" inside the JSON string.
        // MySQL 5.7+ supports JSON_REPLACE but simple text replace is safer for basic XAMPP setups.
        // We use REPLACE() function on the text column.
        $conn->exec("UPDATE users SET allowedGrades = REPLACE(allowedGrades, '$old', '$new')");
    }

} catch (PDOException $e) {
    // Log error but don't crash main request
    if ($conn->inTransaction()) {
        $conn->rollBack();
    }
    error_log("Grade seeding/migration failed: " . $e->getMessage());
}

if ($method == 'GET') {
    try {
        $stmt = $conn->prepare("SELECT * FROM grades");
        $stmt->execute();
        $results = $stmt->fetchAll(PDO::FETCH_COLUMN);

        // Final sanity check for response: if DB return is somehow empty despite healing, return defaults
        if (empty($results)) {
            echo json_encode($default_grades);
        } else {
            echo json_encode($results);
        }
    } catch (PDOException $e) {
        // Fallback
        echo json_encode($default_grades);
    }
}

if ($method == 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);
    $grades = $data['grades'] ?? [];

    try {
        $conn->beginTransaction();
        $conn->exec("DELETE FROM grades");
        $stmt = $conn->prepare("INSERT INTO grades (name) VALUES (:name)");
        foreach ($grades as $grade) {
            $stmt->execute([':name' => $grade]);
        }
        $conn->commit();
        echo json_encode($grades);
    } catch (PDOException $e) {
        $conn->rollBack();
        http_response_code(500);
        echo json_encode(["error" => $e->getMessage()]);
    }
}
?>
