<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    if (isset($_FILES['photo'])) {
        $target_dir = "photos/";
        if (!file_exists($target_dir)) {
            mkdir($target_dir, 0777, true);
        }

        $original_name = basename($_FILES["photo"]["name"]);
        $imageFileType = strtolower(pathinfo($original_name, PATHINFO_EXTENSION));

        // Generate unique name
        $id = $_POST['id'] ?? uniqid();
        $target_file = $target_dir . $id . "." . $imageFileType;

        if (move_uploaded_file($_FILES["photo"]["tmp_name"], $target_file)) {
            // Return full URL
            $protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? "https" : "http";
            $host = $_SERVER['HTTP_HOST'];
            $path = dirname($_SERVER['REQUEST_URI']);
            $url = "$protocol://$host$path/$target_file";

            echo json_encode(["url" => $url]);
        } else {
            http_response_code(500);
            echo json_encode(["error" => "Failed to move uploaded file."]);
        }
    } else {
        http_response_code(400);
        echo json_encode(["error" => "No file uploaded."]);
    }
}
?>
