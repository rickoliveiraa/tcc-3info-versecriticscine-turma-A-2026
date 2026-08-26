<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Accept");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

require_once 'conexao.php';

$jsonInput = file_get_contents('php://input');
$data = json_decode($jsonInput, true);

if (!$data || !is_array($data)) {
    echo json_encode(['sucesso' => false, 'mensagem' => 'Dados inválidos.']);
    exit;
}

$nome = trim($data['nome'] ?? '');
$email = trim($data['email'] ?? '');
$senha = $data['senha'] ?? '';

if (empty($nome) || empty($email) || empty($senha)) {
    echo json_encode(['sucesso' => false, 'mensagem' => 'Preencha todos os campos.']);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(['sucesso' => false, 'mensagem' => 'E-mail inválido.']);
    exit;
}

if (strlen($senha) < 6) {
    echo json_encode(['sucesso' => false, 'mensagem' => 'Senha mínima de 6 caracteres.']);
    exit;
}

try {
    $stmtCheck = $pdo->prepare("SELECT id FROM users WHERE email = :email");
    $stmtCheck->execute([':email' => $email]);
    
    if ($stmtCheck->fetch()) {
        echo json_encode(['sucesso' => false, 'mensagem' => 'E-mail já cadastrado.']);
        exit;
    }

    $senhaHash = password_hash($senha, PASSWORD_DEFAULT);
    
    $sql = "INSERT INTO users (username, email, password_hash, role, created_at) 
            VALUES (:username, :email, :password_hash, 'user', :created_at)";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute([
        ':username' => $nome,
        ':email' => $email,
        ':password_hash' => $senhaHash,
        ':created_at' => date('Y-m-d H:i:s')
    ]);

    echo json_encode(['sucesso' => true, 'mensagem' => 'Conta criada com sucesso!']);

} catch (PDOException $e) {
    echo json_encode(['sucesso' => false, 'mensagem' => 'Erro no servidor.']);
}
?>