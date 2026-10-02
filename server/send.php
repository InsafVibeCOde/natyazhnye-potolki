<?php
/**
 * Приём заявок с сайта «Люкс Монтаж».
 *
 * Работает на обычном PHP-хостинге в России (Timeweb, Beget, REG.RU и т.п.).
 * Заявка сначала записывается в журнал на этом сервере (РФ), затем уходит письмом на почту.
 * Так выполняется требование 152-ФЗ о первичной записи персональных данных в РФ.
 *
 * Подключение: в js/main.js указать CONFIG.leadsEndpoint = 'server/send.php'.
 */

declare(strict_types=1);

// Предупреждения не должны попадать в ответ сайту — только в лог сервера
ini_set('display_errors', '0');
error_reporting(E_ALL);
date_default_timezone_set('Europe/Moscow'); // Казань — московское время

const MAIL_TO   = 'luxmontage@mail.ru';
const LOG_DIR   = __DIR__ . '/leads';          // закрыт от браузера через .htaccess
const MAX_BYTES = 10000;

header('Content-Type: application/json; charset=utf-8');

function reply(int $code, array $body): void {
    http_response_code($code);
    echo json_encode($body, JSON_UNESCAPED_UNICODE);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    reply(405, ['ok' => false, 'error' => 'method']);
}

$raw = file_get_contents('php://input', false, null, 0, MAX_BYTES + 1);
if ($raw === false || strlen($raw) > MAX_BYTES) {
    reply(413, ['ok' => false, 'error' => 'size']);
}

$data = json_decode($raw, true);
if (!is_array($data)) {
    reply(400, ['ok' => false, 'error' => 'json']);
}

// Бот заполнил скрытое поле — отвечаем «ок», но ничего не делаем
if (!empty($data['website'])) {
    reply(200, ['ok' => true]);
}

// Обрезка до 500 символов без расширения mbstring (на части хостингов оно выключено)
$clean = static function ($v): string {
    $s = trim(strip_tags((string)($v ?? '')));
    return preg_match('/^.{0,500}/us', $s, $m) ? $m[0] : '';
};

$phoneDigits = preg_replace('/\D+/', '', (string)($data['phone'] ?? ''));
if (strlen($phoneDigits) !== 11) {
    reply(422, ['ok' => false, 'error' => 'phone']);
}
if (empty($data['consent'])) {
    reply(422, ['ok' => false, 'error' => 'consent']);
}

$lead = [
    'time'       => date('Y-m-d H:i:s'),
    'phone'      => '+' . $phoneDigits,
    'contact'    => $clean($data['contact'] ?? ''),
    'source'     => $clean($data['source'] ?? ''),
    'calc'       => $clean($data['calc'] ?? ''),
    'page'       => $clean($data['page'] ?? ''),
    'consent'    => $clean($data['consent']),
    'consent_at' => $clean($data['consent_at'] ?? ''),
];

// 1. Журнал на сервере в РФ
if (!is_dir(LOG_DIR)) {
    mkdir(LOG_DIR, 0750, true);
}
$file = LOG_DIR . '/leads-' . date('Y-m') . '.csv';
$isNew = !file_exists($file);
$saved = false;
$fh = fopen($file, 'ab');
if ($fh) {
    if ($isNew) {
        fwrite($fh, "\xEF\xBB\xBF"); // BOM, чтобы Excel открыл кириллицу
        fputcsv($fh, array_keys($lead), ';', '"', '');
    }
    $saved = fputcsv($fh, array_values($lead), ';', '"', '') !== false;
    fclose($fh);
}

// 2. Письмо на почту
$labels = [
    'phone' => 'Телефон', 'contact' => 'Как связаться', 'source' => 'Откуда заявка',
    'calc' => 'Расчёт', 'page' => 'Страница',
    'consent' => 'Согласие', 'consent_at' => 'Время согласия', 'time' => 'Получено',
];
$lines = [];
foreach ($labels as $key => $label) {
    if ($lead[$key] !== '') {
        $lines[] = "{$label}: {$lead[$key]}";
    }
}
$subject = '=?UTF-8?B?' . base64_encode('Заявка с сайта: ' . ($lead['source'] ?: 'сайт')) . '?=';
$host = preg_replace('/[^a-z0-9.\-]/i', '', $_SERVER['HTTP_HOST'] ?? 'localhost');
$headers = implode("\r\n", [
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 8bit',
    'From: =?UTF-8?B?' . base64_encode('Сайт Люкс Монтаж') . "?= <noreply@{$host}>",
]);
$sent = mail(MAIL_TO, $subject, implode("\n", $lines), $headers);

// Заявка не потеряна, если сохранена в журнале или ушла письмом
$ok = $saved || $sent;
if (!$sent) {
    error_log('send.php: письмо не отправлено, заявка сохранена в журнале: ' . ($saved ? 'да' : 'нет'));
}
reply($ok ? 200 : 500, ['ok' => $ok]);
