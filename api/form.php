<?php
/**
 * Dotvolt site formları → e-posta.
 * Paylaşımlı hostingde PHP mail() ile çalışır. SMTP gerekirse PHPMailer ile değiştirin.
 */
header('Content-Type: application/json; charset=utf-8');

$TO   = 'info@dotvolt.com.tr';           // formların gideceği adres
$FROM = 'web@dotvolt.com.tr';            // aynı alan adında bir gönderici olmalı (SPF)

if ($_SERVER['REQUEST_METHOD'] !== 'POST') { http_response_code(405); echo json_encode(['ok'=>false,'error'=>'method']); exit; }
if (!empty($_POST['website'])) { echo json_encode(['ok'=>true]); exit; }          // bal küpü: bot
if (empty($_POST['kvkk'])) { http_response_code(422); echo json_encode(['ok'=>false,'error'=>'kvkk']); exit; }

// Basit hız sınırı: aynı IP'den 60 sn'de 1 gönderim
$ip = $_SERVER['REMOTE_ADDR'] ?? 'x';
$lock = sys_get_temp_dir() . '/dv_form_' . md5($ip);
if (file_exists($lock) && time() - filemtime($lock) < 60) { http_response_code(429); echo json_encode(['ok'=>false,'error'=>'rate']); exit; }
touch($lock);

$clean = function($v){ return trim(str_replace(["\r","\n"], ' ', strip_tags((string)$v))); };
$form  = $clean($_POST['form'] ?? 'Web formu');
$email = filter_var($_POST['eposta'] ?? '', FILTER_VALIDATE_EMAIL);
if (!$email || empty($_POST['ad']) || empty($_POST['telefon'])) { http_response_code(422); echo json_encode(['ok'=>false,'error'=>'eksik']); exit; }

$labels = ['ad'=>'Ad soyad','telefon'=>'Telefon','eposta'=>'E-posta','firma'=>'Firma','il'=>'İl','konu'=>'Konu','model'=>'Model','seri_no'=>'Seri no','faaliyet'=>'Faaliyet','mesaj'=>'Mesaj'];
$body = "Dotvolt web sitesi — $form\n" . str_repeat('-', 40) . "\n";
foreach ($labels as $k => $l) {
  if (!isset($_POST[$k]) || $_POST[$k] === '') continue;
  $v = $k === 'mesaj' ? trim(strip_tags($_POST[$k])) : $clean($_POST[$k]);
  $body .= "$l: $v\n";
}
$body .= "\nIP: $ip\nTarih: " . date('d.m.Y H:i') . "\nKVKK onayı: Evet\n";

$subject = '=?UTF-8?B?' . base64_encode("[Web] $form — " . $clean($_POST['ad'])) . '?=';
$headers = "From: Dotvolt Web <$FROM>\r\nReply-To: $email\r\nContent-Type: text/plain; charset=UTF-8\r\n";
$ok = @mail($TO, $subject, $body, $headers);
echo json_encode(['ok'=>(bool)$ok]);
