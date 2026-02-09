<?php
// Permite acesso de qualquer lugar (necessário para Mobile/Expo)
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

// Se for apenas uma verificação prévia (OPTIONS), encerra aqui
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Helper para pegar o JSON do corpo da requisição
function getBody() {
    return json_decode(file_get_contents("php://input"), true);
}
?>