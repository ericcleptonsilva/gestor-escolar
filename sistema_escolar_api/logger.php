<?php
function logError($message) {
    $logFile = 'error_log.txt';
    $timestamp = date("Y-m-d H:i:s");
    $formattedMessage = "[$timestamp] $message" . PHP_EOL;
    file_put_contents($logFile, $formattedMessage, FILE_APPEND);
}
?>