<?php
// 1. SUPRIMIR WARNINGS E ERROS (evita que HTML vaze antes do JSON)
error_reporting(0);
ini_set('display_errors', 0);

// 2. Limpar qualquer output anterior
if (ob_get_level()) ob_clean();

// 3. Configurações de segurança
if (session_status() === PHP_SESSION_NONE) {
    @ini_set('session.cookie_httponly', 1);
    @ini_set('session.use_only_cookies', 1);
    session_start();
}

// 4. Importa o ficheiro de conexão com o SQLite
require_once 'conexao.php';

// 5. Detecta se é requisição da API Mobile
$isJsonRequest = false;
if (isset($_SERVER['CONTENT_TYPE']) && strpos($_SERVER['CONTENT_TYPE'], 'application/json') !== false) {
    $isJsonRequest = true;
}
if (isset($_SERVER['HTTP_ACCEPT']) && strpos($_SERVER['HTTP_ACCEPT'], 'application/json') !== false) {
    $isJsonRequest = true;
}
if (!empty(file_get_contents('php://input'))) {
    $isJsonRequest = true;
}

$erro = "";

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    if ($isJsonRequest) {
        // ==========================================
        // API PARA O APP MOBILE (Retorna JSON)
        // ==========================================
        header("Access-Control-Allow-Origin: *");
        header("Access-Control-Allow-Methods: POST, OPTIONS");
        header("Access-Control-Allow-Headers: Content-Type, Accept");
        header("Content-Type: application/json; charset=UTF-8");

        // Limpa qualquer output anterior antes de enviar JSON
        ob_clean();

        // Lê o JSON enviado pelo app
        $jsonInput = file_get_contents('php://input');
        $data = json_decode($jsonInput, true);
        
        // ✅ CORREÇÃO: Verifica se as chaves existem antes de acessar
        $email = isset($data['email']) ? filter_var($data['email'], FILTER_VALIDATE_EMAIL) : false;
        $senha = isset($data['senha']) ? $data['senha'] : '';

        if ($email && $senha) {
            try {
                $stmt = $pdo->prepare("SELECT id, username, password_hash, role FROM users WHERE email = :email");
                $stmt->execute(['email' => $email]);
                $usuario = $stmt->fetch(PDO::FETCH_ASSOC);

                if ($usuario && password_verify($senha, $usuario['password_hash'])) {
                    echo json_encode([
                        'sucesso' => true,
                        'mensagem' => 'Login realizado com sucesso!',
                        'usuario' => [
                            'id' => $usuario['id'],
                            'nome' => $usuario['username'],
                            'email' => $usuario['email']
                        ]
                    ]);
                    exit;
                } else {
                    echo json_encode(['sucesso' => false, 'mensagem' => 'E-mail ou senha incorretos.']);
                    exit;
                }
            } catch (PDOException $e) {
                echo json_encode(['sucesso' => false, 'mensagem' => 'Erro no sistema.']);
                exit;
            }
        } else {
            echo json_encode(['sucesso' => false, 'mensagem' => 'Preencha e-mail e senha corretamente.']);
            exit;
        }
    } else {
        // ==========================================
        // FORMULÁRIO WEB (Processa e mostra HTML)
        // ==========================================
        $email = filter_input(INPUT_POST, 'email', FILTER_VALIDATE_EMAIL);
        $senha = $_POST['senha'] ?? '';

        if ($email) {
            try {
                $stmt = $pdo->prepare("SELECT id, username, password_hash, role FROM users WHERE email = :email");
                $stmt->execute(['email' => $email]);
                $usuario = $stmt->fetch(PDO::FETCH_ASSOC);

                if ($usuario && password_verify($senha, $usuario['password_hash'])) {
                    session_regenerate_id(true);
                    $_SESSION['usuario_id'] = $usuario['id'];
                    $_SESSION['usuario_nome'] = $usuario['username'];
                    $_SESSION['usuario_email'] = $email;
                    $_SESSION['usuario_role'] = $usuario['role'];

                    header("Location: dashboard.php"); 
                    exit;
                } else {
                    $erro = "E-mail ou senha incorretos.";
                }
            } catch (PDOException $e) {
                $erro = "Erro no sistema: " . $e->getMessage();
            }
        } else {
            $erro = "Por favor, insira um e-mail válido.";
        }
    }
}

// Se NÃO for requisição JSON (ou seja, navegador), mostra o HTML
if (!$isJsonRequest) {
?>
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CineTrack - Login</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Plus Jakarta Sans', sans-serif; }
        body { background: radial-gradient(120% 120% at 50% 10%, #0a0d16 0%, #05060a 100%); color: #ffffff; display: flex; justify-content: center; align-items: center; min-height: 100vh; padding: 20px; position: relative; overflow: hidden; }
        body::before { content: ''; position: absolute; width: 500px; height: 500px; background: radial-gradient(circle, rgba(26, 102, 255, 0.12) 0%, rgba(0,0,0,0) 70%); bottom: -150px; left: -150px; z-index: 0; pointer-events: none; }
        .login-card { background: linear-gradient(135deg, rgba(19, 23, 36, 0.7) 0%, rgba(13, 18, 31, 0.8) 100%); border: 1px solid rgba(255, 255, 255, 0.08); padding: 45px 40px; border-radius: 24px; width: 100%; max-width: 440px; box-shadow: 0 30px 60px rgba(0, 0, 0, 0.6); backdrop-filter: blur(20px); position: relative; z-index: 10; }
        .login-card::after { content: ''; position: absolute; top: -1px; left: 40px; right: 40px; height: 1px; background: linear-gradient(90deg, rgba(26,102,255,0) 0%, rgba(26,102,255,0.6) 50%, rgba(26,102,255,0) 100%); }
        .header { text-align: center; margin-bottom: 35px; }
        .logo { font-size: 34px; font-weight: 800; letter-spacing: -1px; margin-bottom: 10px; }
        .logo span { background: linear-gradient(135deg, #1a66ff, #6699ff); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .subtitle { font-size: 14px; color: #94a3b8; font-weight: 500; }
        .input-group { margin-bottom: 22px; }
        .input-group label { display: block; font-size: 13px; font-weight: 600; margin-bottom: 8px; color: #94a3b8; }
        .input-wrapper { position: relative; display: flex; align-items: center; }
        .input-wrapper i.input-icon { position: absolute; left: 16px; color: #475569; font-size: 16px; }
        .input-wrapper input { width: 100%; padding: 14px 16px 14px 46px; border-radius: 12px; border: 2px solid rgba(255, 255, 255, 0.05); background-color: rgba(5, 6, 10, 0.6); color: #ffffff; font-size: 15px; font-weight: 500; transition: all 0.3s; }
        .input-wrapper input:focus { outline: none; border-color: #1a66ff; background-color: rgba(5, 6, 10, 0.9); box-shadow: 0 0 20px rgba(26, 102, 255, 0.2); }
        .input-wrapper input:focus ~ i.input-icon { color: #1a66ff; }
        .btn-toggle-password { position: absolute; right: 16px; background: none; border: none; color: #475569; cursor: pointer; font-size: 16px; }
        .btn-submit { width: 100%; padding: 16px; background: linear-gradient(135deg, #1a66ff, #004fe6); color: #ffffff; border: none; border-radius: 12px; font-size: 16px; font-weight: 700; cursor: pointer; box-shadow: 0 8px 20px rgba(26, 102, 255, 0.3); margin-top: 10px; }
        .btn-submit:hover { background: linear-gradient(135deg, #3377ff, #1a66ff); transform: translateY(-2px); }
        .alert-error { background-color: rgba(255, 77, 77, 0.1); border: 1px solid rgba(255, 77, 77, 0.2); color: #ff4d4d; padding: 14px; border-radius: 12px; font-size: 14px; font-weight: 600; margin-bottom: 24px; text-align: center; }
        .links-container { margin-top: 32px; text-align: center; font-size: 14px; }
        .links-container a { color: #6699ff; text-decoration: none; font-weight: 600; }
        .links-container a:hover { color: #ffffff; }
        .divider { height: 1px; background: linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.05) 50%, rgba(255,255,255,0) 100%); margin: 20px 0; }
    </style>
</head>
<body>
<div class="login-card">
    <div class="header">
        <div class="logo">Cine<span>Track</span></div>
        <p class="subtitle">Acesse para gerenciar seus filmes e séries</p>
    </div>

    <?php if (!empty($erro)): ?>
        <div class="alert-error">
            <i class="fa-solid fa-triangle-exclamation"></i>
            <?php echo htmlspecialchars($erro); ?>
        </div>
    <?php endif; ?>

    <form action="login.php" method="POST" autocomplete="off">
        <div class="input-group">
            <label for="email">E-mail</label>
            <div class="input-wrapper">
                <input type="email" id="email" name="email" required placeholder="nome@exemplo.com">
                <i class="fa-solid fa-envelope input-icon"></i>
            </div>
        </div>
        <div class="input-group">
            <label for="senha">Senha</label>
            <div class="input-wrapper">
                <input type="password" id="senha" name="senha" required placeholder="Sua senha">
                <i class="fa-solid fa-lock input-icon"></i>
                <button type="button" class="btn-toggle-password" id="togglePassword"><i class="fa-solid fa-eye" id="eyeIcon"></i></button>
            </div>
        </div>
        <button type="submit" class="btn-submit">Entrar na plataforma</button>
    </form>

    <div class="links-container">
        <p><a href="recuperarsenha.php">Esqueceu sua senha?</a></p>
        <div class="divider"></div>
        <p style="color: #64748b;">Não tem uma conta? <a href="criarconta.php">Criar conta</a></p>
    </div>
</div>
<script>
    const togglePassword = document.querySelector('#togglePassword');
    const passwordInput = document.querySelector('#senha');
    const eyeIcon = document.querySelector('#eyeIcon');
    togglePassword.addEventListener('click', function () {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        if (type === 'text') { eyeIcon.classList.remove('fa-eye'); eyeIcon.classList.add('fa-eye-slash'); } 
        else { eyeIcon.classList.remove('fa-eye-slash'); eyeIcon.classList.add('fa-eye'); }
    });
</script>
</body>
</html>
<?php
}
?>