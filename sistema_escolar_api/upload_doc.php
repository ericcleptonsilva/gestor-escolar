<?php
// Reutiliza o arquivo de CORS que você já criou para permitir o acesso do App
require 'cors.php';

// Verifica se o método é POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(["error" => "Método não permitido. Use POST."]);
    exit;
}

// Verifica se o arquivo foi enviado
if (!isset($_FILES['file']) || $_FILES['file']['error'] !== UPLOAD_ERR_OK) {
    http_response_code(400);
    echo json_encode(["error" => "Nenhum arquivo enviado ou erro no upload."]);
    exit;
}

// Recebe os dados extras (ID e Tipo) para nomear o arquivo corretamente
$id = $_POST['id'] ?? 'unknown';
$type = $_POST['type'] ?? 'doc'; // 'exam', 'plan', 'report', 'drive'

// --- CONFIGURAÇÃO DE SEGURANÇA ---

// 1. Defina a pasta de destino (cria se não existir)
$targetDir = __DIR__ . "/docs/";
if (!is_dir($targetDir)) {
    mkdir($targetDir, 0777, true);
}

// 2. Valida a extensão do arquivo (documentos)
$fileInfo = pathinfo($_FILES['file']['name']);
$extension = strtolower($fileInfo['extension']);
$allowedExtensions = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'txt', 'csv'];

if (!in_array($extension, $allowedExtensions)) {
    http_response_code(400);
    echo json_encode(["error" => "Formato de arquivo inválido. Apenas PDF, DOC, DOCX, XLS, XLSX, TXT, CSV."]);
    exit;
}

// 3. Gera um nome único e seguro para o arquivo
// Exemplo de nome gerado: exam_550e8400-e29b.pdf
$newFileName = $type . "_" . $id . "." . $extension;
$targetFilePath = $targetDir . $newFileName;

// --- SALVANDO O ARQUIVO ---

if (move_uploaded_file($_FILES['file']['tmp_name'], $targetFilePath)) {

    // Constrói a URL pública para retornar ao App
    // O App vai salvar essa URL no banco de dados

    // Detecta o protocolo (http ou https)
    $protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off' || $_SERVER['SERVER_PORT'] == 443) ? "https://" : "http://";

    // Monta a URL base automaticamente
    // Se sua API está em localhost/escola360/api, isso retorna essa base
    $serverName = $_SERVER['SERVER_NAME']; // localhost ou IP
    $scriptPath = dirname($_SERVER['SCRIPT_NAME']); // /escola360/api

    // URL Final: http://192.168.x.x/escola360/api/docs/exam_123.pdf
    $finalUrl = $protocol . $serverName . ":8787" . $scriptPath . "/docs/" . $newFileName;

    // Retorna JSON conforme esperado pelo seu TypeScript
    echo json_encode([
        "success" => true,
        "url" => $finalUrl
    ]);

} else {
    http_response_code(500);
    echo json_encode(["error" => "Falha ao mover o arquivo para a pasta de destino."]);
}
?>