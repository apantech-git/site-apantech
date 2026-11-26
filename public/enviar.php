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

// Resposta automática para o cliente. Se falhar, o pedido já chegou: não é erro para o site.
// O texto é fixo de propósito: não repete a mensagem nem links do cliente, para que ninguém
// use o formulário para mandar spam a terceiros pelo nosso e-mail.
@mail($email, $cab('Recebemos seu pedido de orçamento · apantech'), ...respostaAutomatica($nome, $TIPOS[$tipo], $cab));

responder(200, ['ok' => true]);

/** @return array{0:string,1:string,2:string} corpo, cabeçalhos e parâmetro do envelope */
function respostaAutomatica(string $nome, string $tipo, callable $cab): array {
    // só o primeiro nome, só letras: evita links ou texto estranho dentro do nosso e-mail
    $primeiro = preg_replace('/[^\p{L}\'-]/u', '', explode(' ', $nome)[0]) ?? '';
    $primeiro = mb_convert_case(mb_substr($primeiro, 0, 30), MB_CASE_TITLE);
    $ola = $primeiro !== '' ? "Olá, $primeiro!" : 'Olá!';
    $whats = 'https://wa.me/5511981714641';
    $site  = 'https://www.apantech.com.br';
    $h = static fn(string $s): string => htmlspecialchars($s, ENT_QUOTES, 'UTF-8');

    $texto = implode("\n", [
        $ola,
        '',
        "Recebemos seu pedido de orçamento ($tipo) pelo site da apantech. Obrigado pelo contato!",
        '',
        'Próximos passos:',
        '1. Vamos ler o que você escreveu com atenção.',
        '2. Respondemos pelo e-mail ou WhatsApp que você informou, em dias úteis, das 9h às 18h.',
        '3. Marcamos uma conversa rápida para entender o projeto e preparar a proposta.',
        '',
        'Quer adiantar? Fale com a gente no WhatsApp: ' . $whats,
        'Ou responda este e-mail para acrescentar detalhes, arquivos ou referências.',
        '',
        'Até breve,',
        'Equipe apantech',
        $site,
        '',
        '---',
        'Este é um e-mail automático, enviado porque este endereço foi usado no formulário de ' . $site . '.',
        'Se não foi você, pode ignorar esta mensagem.',
    ]);

    $passos = '';
    foreach ([
        'Vamos ler o que você escreveu com atenção.',
        'Respondemos pelo e-mail ou WhatsApp que você informou, em dias úteis, das 9h às 18h.',
        'Marcamos uma conversa rápida para entender o projeto e preparar a proposta.',
    ] as $i => $p) {
        $passos .= '<tr><td style="width:28px;vertical-align:top;padding:0 0 12px"><span style="display:inline-block;width:22px;height:22px;line-height:22px;border-radius:6px;background:#e8f5fe;color:#1479b8;font-size:12px;font-weight:600;text-align:center">' . ($i + 1) . '</span></td><td style="padding:2px 0 12px;font-size:15px;line-height:1.5;color:#3f3f46">' . $h($p) . '</td></tr>';
    }

    $html = '<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Recebemos seu pedido</title></head>'
        . '<body style="margin:0;padding:0;background:#f4f4f5;font-family:Inter,Segoe UI,Arial,sans-serif;color:#18181b">'
        . '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5"><tr><td align="center" style="padding:32px 16px">'
        . '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #e4e4e7;border-radius:14px">'
        . '<tr><td style="padding:28px 32px 0"><span style="display:inline-block;width:12px;height:12px;border-radius:3px;background:#27A4F2;vertical-align:middle"></span>'
        . '<span style="font-size:18px;font-weight:600;letter-spacing:-.01em;vertical-align:middle;margin-left:8px">apantech</span></td></tr>'
        . '<tr><td style="padding:24px 32px 8px"><h1 style="margin:0 0 12px;font-size:22px;line-height:1.3;font-weight:600">' . $h($ola) . '</h1>'
        . '<p style="margin:0;font-size:15px;line-height:1.6;color:#3f3f46">Recebemos seu pedido de orçamento <strong style="color:#18181b">(' . $h($tipo) . ')</strong> pelo site. Obrigado pelo contato!</p></td></tr>'
        . '<tr><td style="padding:20px 32px 4px"><p style="margin:0 0 12px;font-size:13px;font-weight:600;color:#71717a;text-transform:uppercase;letter-spacing:.06em">Próximos passos</p>'
        . '<table role="presentation" cellpadding="0" cellspacing="0">' . $passos . '</table></td></tr>'
        . '<tr><td style="padding:8px 32px 8px"><a href="' . $whats . '" style="display:inline-block;background:#27A4F2;color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:12px 20px;border-radius:10px">Adiantar pelo WhatsApp</a></td></tr>'
        . '<tr><td style="padding:12px 32px 28px;font-size:14px;line-height:1.6;color:#52525b">Ou responda este e-mail para acrescentar detalhes, arquivos ou referências.<br><br>Até breve,<br><strong style="color:#18181b">Equipe apantech</strong></td></tr>'
        . '</table>'
        . '<p style="max-width:560px;margin:16px auto 0;font-size:12px;line-height:1.5;color:#a1a1aa">E-mail automático, enviado porque este endereço foi usado no formulário de <a href="' . $site . '" style="color:#71717a">apantech.com.br</a>. Se não foi você, pode ignorar.</p>'
        . '</td></tr></table></body></html>';

    $b = 'apt-' . bin2hex(random_bytes(8));
    $corpo = "--$b\r\nContent-Type: text/plain; charset=UTF-8\r\nContent-Transfer-Encoding: base64\r\n\r\n"
        . chunk_split(base64_encode($texto))
        . "--$b\r\nContent-Type: text/html; charset=UTF-8\r\nContent-Transfer-Encoding: base64\r\n\r\n"
        . chunk_split(base64_encode($html))
        . "--$b--\r\n";

    $cabecalhos = implode("\r\n", [
        'From: ' . $cab('apantech') . ' <' . REMETENTE . '>',
        'Reply-To: ' . REMETENTE,
        'MIME-Version: 1.0',
        'Content-Type: multipart/alternative; boundary="' . $b . '"',
        // avisa aos servidores que é automática: evita "respostas de férias" em loop
        'Auto-Submitted: auto-replied',
        'X-Auto-Response-Suppress: All',
        'X-Mailer: apantech-site',
    ]);

    return [$corpo, $cabecalhos, '-f' . REMETENTE];
}
