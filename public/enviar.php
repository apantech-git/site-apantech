<?php
// Recebe o formulário de orçamento do site e envia para o e-mail da apantech.
// Roda na própria Hostinger (PHP mail), sem serviço de terceiros e sem senha no código.
// Resposta em JSON: { "ok": true } ou { "ok": false, "erro": "..." } com status HTTP de erro.

declare(strict_types=1);

const DESTINO   = 'contato@apantech.com.br';
const REMETENTE = 'contato@apantech.com.br'; // precisa ser do próprio domínio para não cair no spam
const DOMINIOS  = ['apantech.com.br', 'www.apantech.com.br'];
const LIMITE_HORA = 5; // envios por IP por hora

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

function responder(int $status, array $dados): void {
    http_response_code($status);
    echo json_encode($dados, JSON_UNESCAPED_UNICODE);
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Allow: POST');
    responder(405, ['ok' => false, 'erro' => 'metodo']);
}

// só aceita envios vindos do próprio site
$origem = $_SERVER['HTTP_ORIGIN'] ?? $_SERVER['HTTP_REFERER'] ?? '';
$host = $origem ? strtolower((string) parse_url($origem, PHP_URL_HOST)) : '';
if ($host === '' || !in_array($host, DOMINIOS, true)) {
    responder(403, ['ok' => false, 'erro' => 'origem']);
}

$campo = static fn(string $k, int $max): string => mb_substr(trim((string) ($_POST[$k] ?? '')), 0, $max);
// texto que vai para cabeçalho de e-mail: sem quebras de linha (evita injeção de cabeçalhos)
$linha = static fn(string $s): string => trim(preg_replace('/[\r\n\t]+/', ' ', $s) ?? '');

// armadilha para robôs: campo escondido que pessoas não preenchem
if ($campo('site_url', 200) !== '') {
    responder(200, ['ok' => true]);
}

$nome      = $linha($campo('nome', 100));
$empresa   = $linha($campo('empresa', 120));
$email     = $linha($campo('email', 160));
$telefone  = $linha($campo('telefone', 30));
$tipo      = $campo('tipo', 20);
$segmento  = $linha($campo('segmento', 80));
$mensagem  = $campo('mensagem', 5000);
$aceite    = $campo('aceite', 5);

$TIPOS = ['site' => 'Site', 'sistema' => 'Sistema web', 'dashboard' => 'Dashboard', 'app' => 'Aplicativo Android/iOS', 'outro' => 'Outro', 'nao-sei' => 'Ainda não sei'];

if (mb_strlen($nome) < 2
    || !filter_var($email, FILTER_VALIDATE_EMAIL)
    || !isset($TIPOS[$tipo])
    || mb_strlen($mensagem) < 20
    || $aceite !== 'true') {
    responder(422, ['ok' => false, 'erro' => 'dados']);
}

// limite simples por IP, guardado na pasta temporária do servidor
$ip = $_SERVER['REMOTE_ADDR'] ?? '0';
$arq = sys_get_temp_dir() . '/apantech-form-' . hash('sha256', $ip);
$agora = time();
$envios = array_filter(
    array_map('intval', is_file($arq) ? (array) file($arq, FILE_IGNORE_NEW_LINES) : []),
    static fn(int $t): bool => $t > $agora - 3600
);
if (count($envios) >= LIMITE_HORA) {
    responder(429, ['ok' => false, 'erro' => 'limite']);
}

$cab = static fn(string $s): string => '=?UTF-8?B?' . base64_encode($s) . '?=';

$assunto = 'Pedido de orçamento: ' . $TIPOS[$tipo] . ' · ' . $nome;
$corpo = implode("\n", [
    'Novo pedido de orçamento pelo site.',
    '',
    'Nome: ' . $nome,
    'Empresa: ' . ($empresa !== '' ? $empresa : '-'),
    'E-mail: ' . $email,
    'WhatsApp: ' . ($telefone !== '' ? $telefone : '-'),
    'Tipo de projeto: ' . $TIPOS[$tipo],
    'Segmento: ' . ($segmento !== '' ? $segmento : '-'),
    '',
    'O que precisa:',
    $mensagem,
    '',
    '---',
    'Aceitou a Política de privacidade: sim',
    'Enviado em: ' . (new DateTime('now', new DateTimeZone('America/Sao_Paulo')))->format('d/m/Y H:i'),
    'Para responder, use "Responder": vai direto para o e-mail do cliente.',
]);

$cabecalhos = implode("\r\n", [
    'From: ' . $cab('Site apantech') . ' <' . REMETENTE . '>',
    'Reply-To: ' . $cab($nome) . ' <' . $email . '>',
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 8bit',
    'X-Mailer: apantech-site',
]);

$ok = mail(DESTINO, $cab($assunto), $corpo, $cabecalhos, '-f' . REMETENTE);
if (!$ok) {
    responder(500, ['ok' => false, 'erro' => 'envio']);
}

$envios[] = $agora;
@file_put_contents($arq, implode("\n", $envios), LOCK_EX);
responder(200, ['ok' => true]);
