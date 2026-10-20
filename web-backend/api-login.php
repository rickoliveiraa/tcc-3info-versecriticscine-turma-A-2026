<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

include 'conexao.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    $email = $data['email'] ?? '';
    $senha = $data['senha'] ?? '';
    
    if (empty($email) || empty($senha)) {
        echo json_encode(['success' => false, 'message' => 'Email e senha são obrigatórios']);
        exit();
    }
    
    $stmt = $pdo->prepare("SELECT id, username, email, password_hash, avatar_url FROM users WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($user && password_verify($senha, $user['password_hash'])) {
        echo json_encode([
            'success' => true,
            'message' => 'Login realizado com sucesso',
            'user' => [
                'id' => $user['id'],
                'username' => $user['username'],
                'email' => $user['email'],
                'avatar_url' => $user['avatar_url']
            ]
        ]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Email ou senha incorretos']);
    }
} else {
    echo json_encode(['success' => false, 'message' => 'Método não permitido']);
}
?>