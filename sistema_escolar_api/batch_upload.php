<?php
error_reporting(E_ERROR | E_PARSE);
include_once 'logger.php';
include 'db.php';

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    if (!isset($_FILES['photos'])) {
        http_response_code(400);
        echo json_encode(["error" => "No files uploaded."]);
        exit();
    }

    $target_dir = "photos/";
    if (!file_exists($target_dir)) {
        mkdir($target_dir, 0777, true);
    }

    $files = $_FILES['photos'];
    $fileCount = count($files['name']);
    $successCount = 0;
    $failCount = 0;
    $errors = [];

    // Protocol for URL generation
    $protocol = isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on' ? "https" : "http";
    $host = $_SERVER['HTTP_HOST'];
    $path = dirname($_SERVER['REQUEST_URI']);

    // Allowed extensions and MIME types
    $allowedExtensions = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
    $allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

    for ($i = 0; $i < $fileCount; $i++) {
        $originalName = $files['name'][$i];
        $tmpName = $files['tmp_name'][$i];
        $error = $files['error'][$i];

        if ($error !== UPLOAD_ERR_OK) {
            $failCount++;
            $errors[] = "Error uploading $originalName: Code $error";
            continue;
        }

        // Validate Extension
        $ext = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));
        if (!in_array($ext, $allowedExtensions)) {
            $failCount++;
            $errors[] = "Invalid file type for $originalName (Extension: $ext)";
            continue;
        }

        // Validate MIME Type
        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $mime = finfo_file($finfo, $tmpName);
        finfo_close($finfo);

        if (!in_array($mime, $allowedMimeTypes)) {
            $failCount++;
            $errors[] = "Invalid MIME type for $originalName ($mime)";
            continue;
        }

        // Get registration from filename (without extension)
        $registration = pathinfo($originalName, PATHINFO_FILENAME);

        // Find student by registration
        try {
            $stmt = $conn->prepare("SELECT id FROM students WHERE registration = :reg LIMIT 1");
            $stmt->execute([':reg' => $registration]);
            $student = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($student) {
                $studentId = $student['id'];
                $newFileName = $studentId . "." . $ext; // Use ID to be consistent
                $targetFile = $target_dir . $newFileName;

                if (move_uploaded_file($tmpName, $targetFile)) {
                    $url = "$protocol://$host$path/$targetFile";

                    // Update student record
                    $updateStmt = $conn->prepare("UPDATE students SET photoUrl = :url WHERE id = :id");
                    $updateStmt->execute([':url' => $url, ':id' => $studentId]);

                    $successCount++;
                } else {
                    $failCount++;
                    $errors[] = "Failed to move file for student $registration";
                }
            } else {
                $failCount++;
                $errors[] = "Student not found for registration: $registration";
            }
        } catch (PDOException $e) {
            $failCount++;
            $errors[] = "Database error for $registration: " . $e->getMessage();
        }
    }

    echo json_encode([
        "success" => true,
        "total" => $fileCount,
        "processed" => $successCount,
        "failed" => $failCount,
        "errors" => $errors
    ]);
}
?>
