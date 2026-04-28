<?php
define('LOG_FILE', __DIR__ . '/import_log.txt');
define('MAX_LOG_SIZE', 2 * 1024 * 1024); // 2MB - limpa automaticamente

function writeLog($level, $message, $context = []) {
    // Limpa o log se ficar muito grande
    if (file_exists(LOG_FILE) && filesize(LOG_FILE) > MAX_LOG_SIZE) {
        file_put_contents(LOG_FILE, "--- LOG LIMPO AUTOMATICAMENTE ---\n");
    }

    $timestamp = date("Y-m-d H:i:s");
    $contextStr = !empty($context) ? ' | ' . json_encode($context, JSON_UNESCAPED_UNICODE) : '';
    $line = "[$timestamp] [$level] $message$contextStr" . PHP_EOL;
    file_put_contents(LOG_FILE, $line, FILE_APPEND | LOCK_EX);
}

function logInfo($message, $context = [])    { writeLog('INFO',    $message, $context); }
function logError($message, $context = [])   { writeLog('ERROR',   $message, $context); }
function logWarning($message, $context = []) { writeLog('WARNING', $message, $context); }
function logDebug($message, $context = [])   { writeLog('DEBUG',   $message, $context); }

function logSeparator($label = '') {
    $line = PHP_EOL . str_repeat('=', 60) . ($label ? " $label " : '') . PHP_EOL;
    file_put_contents(LOG_FILE, $line, FILE_APPEND | LOCK_EX);
}
?>