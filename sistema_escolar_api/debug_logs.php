<?php
header("Access-Control-Allow-Origin: *");
header("Content-Type: text/plain; charset=UTF-8");

$logFile = 'error_log.txt';

if (file_exists($logFile)) {
    echo file_get_contents($logFile);
} else {
    echo "No logs available.";
}
?>