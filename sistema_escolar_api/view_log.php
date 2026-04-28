<?php
// Endpoint simples para visualizar o log de importação
// Acesse: http://192.168.25.77:8787/sistema_escolar_api/view_log.php

header("Access-Control-Allow-Origin: *");
header("Content-Type: text/plain; charset=UTF-8");

$logFile = __DIR__ . '/import_log.txt';

if (!file_exists($logFile)) {
    echo "Nenhum log encontrado ainda.\nFaça uma importação primeiro.";
    exit();
}

$lines = file($logFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
$total = count($lines);

// Mostra as últimas 200 linhas
$last = array_slice($lines, -200);

echo "=== LOG DE IMPORTAÇÃO (últimas " . count($last) . " de $total linhas) ===\n";
echo "Arquivo: $logFile\n";
echo "Tamanho: " . round(filesize($logFile) / 1024, 1) . " KB\n";
echo str_repeat("=", 60) . "\n\n";
echo implode("\n", $last);
echo "\n\n" . str_repeat("=", 60) . "\n";
echo "FIM DO LOG\n";

// Limpar o log
if (isset($_GET['clear'])) {
    file_put_contents($logFile, '');
    echo "\n[LOG LIMPO COM SUCESSO]\n";
}
?>
