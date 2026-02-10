<?php
// debug_data.php
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "<h1>Diagnóstico de Dados Pedagógicos</h1>";

// Tentar conectar
$host = 'localhost';
$dbname = 'sistema_escolar';
$username = 'root';
$password = '';

try {
    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username, $password);
    echo "<p style='color:green'>Conexão com '$dbname' OK!</p>";
} catch (PDOException $e) {
    die("<p style='color:red'>Erro fatal de conexão: " . $e->getMessage() . "</p>");
}

// Listar Tabelas
echo "<h2>Tabelas no Banco:</h2><ul>";
$tables = $pdo->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);
foreach ($tables as $t) {
    echo "<li>$t</li>";
}
echo "</ul>";

// Verificar dados
echo "<h2>Conteúdo de 'pedagogical_records':</h2>";
try {
    $stmt = $pdo->query("SELECT * FROM pedagogical_records");
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    echo "<p>Total de registros: " . count($rows) . "</p>";

    if (count($rows) > 0) {
        echo "<table border='1' style='border-collapse:collapse; width:100%'>";
        echo "<tr>";
        foreach (array_keys($rows[0]) as $k) echo "<th>$k</th>";
        echo "</tr>";

        foreach ($rows as $row) {
            echo "<tr>";
            foreach ($row as $v) echo "<td>" . htmlspecialchars(substr($v, 0, 50)) . "</td>";
            echo "</tr>";
        }
        echo "</table>";
    } else {
        echo "<p style='color:orange'>A tabela existe mas está vazia.</p>";
    }

} catch (Exception $e) {
    echo "<p style='color:red'>Erro ao ler tabela: " . $e->getMessage() . "</p>";
}
?>
