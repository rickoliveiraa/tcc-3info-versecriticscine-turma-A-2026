<?php
// 1. Importa o ficheiro de conexão com o SQLite
require_once 'conexao.php';

$mensagem = "";
$status = "";

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $email = filter_input(INPUT_POST, 'email', FILTER_VALIDATE_EMAIL);

    if ($email) {
        try {
            // Procura o usuário no banco pelo e-mail
            $stmt = $pdo->prepare("SELECT username FROM users WHERE email = :email");
            $stmt->execute(['email' => $email]);
            $usuario = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($usuario) {
                // CORREÇÃO: Simula o envio seguro de redefinição de senha em vez de exibir o hash inviável
                $mensagem = "Olá, <strong>" . htmlspecialchars($usuario['username']) . "</strong>! Enviamos as instruções de redefinição para o seu e-mail.";
                $status = "success";
            } else {
                // Dica de segurança de IA: Em produção, usamos mensagens genéricas para evitar varredura de e-mails,
                // mas para o TCC, manteremos a validação clara.
                $mensagem = "Nenhum usuário cadastrado com este e-mail.";
                $status = "error";
            }
        } catch (PDOException $e) {
            $mensagem = "Erro no sistema: " . $e->getMessage();
            $status = "error";
        }
    } else {
        $mensagem = "Por favor, insira um e-mail válido.";
        $status = "error";
    }
}
?>
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CineTrack - Recuperar Senha</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
            font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        body {
            background: radial-gradient(120% 120% at 50% 10%, #0a0d16 0%, #05060a 100%);
            color: #ffffff;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            padding: 20px;
            position: relative;
            overflow: hidden;
        }

        /* Elemento de iluminação decorativa no fundo */
        body::before {
            content: '';
            position: absolute;
            width: 500px;
            height: 500px;
            background: radial-gradient(circle, rgba(26, 102, 255, 0.1) 0%, rgba(0,0,0,0) 70%);
            top: -150px;
            right: -150px;
            z-index: 0;
            pointer-events: none;
        }

        .recovery-card {
            background: linear-gradient(135deg, rgba(19, 23, 36, 0.7) 0%, rgba(13, 18, 31, 0.8) 100%);
            border: 1px solid rgba(255, 255, 255, 0.08);
            padding: 45px 40px;
            border-radius: 24px;
            width: 100%;
            max-width: 440px;
            box-shadow: 0 30px 60px rgba(0, 0, 0, 0.6), inset 0 1px 1px rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(20px);
            position: relative;
            z-index: 10;
        }

        /* Detalhe sutil na borda superior */
        .recovery-card::after {
            content: '';
            position: absolute;
            top: -1px;
            left: 40px;
            right: 40px;
            height: 1px;
            background: linear-gradient(90deg, rgba(26,102,255,0) 0%, rgba(26,102,255,0.4) 50%, rgba(26,102,255,0) 100%);
        }

        .header {
            text-align: center;
            margin-bottom: 30px;
        }

        .logo {
            font-size: 34px;
            font-weight: 800;
            letter-spacing: -1px;
            margin-bottom: 10px;
        }

        .logo span {
            background: linear-gradient(135deg, #1a66ff, #6699ff);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }

        .subtitle {
            font-size: 14px;
            color: #94a3b8;
            font-weight: 500;
            line-height: 1.5;
        }

        .input-group {
            margin-bottom: 24px;
        }

        .input-group label {
            display: block;
            font-size: 13px;
            font-weight: 600;
            margin-bottom: 8px;
            color: #94a3b8;
            letter-spacing: 0.3px;
        }

        .input-wrapper {
            position: relative;
            display: flex;
            align-items: center;
        }

        .input-wrapper i {
            position: absolute;
            left: 16px;
            color: #475569;
            font-size: 16px;
            transition: color 0.3s ease;
        }

        .input-wrapper input {
            width: 100%;
            padding: 14px 16px 14px 46px;
            border-radius: 12px;
            border: 2px solid rgba(255, 255, 255, 0.05);
            background-color: rgba(5, 6, 10, 0.6);
            color: #ffffff;
            font-size: 15px;
            font-weight: 500;
            transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .input-wrapper input:focus {
            outline: none;
            border-color: #1a66ff;
            background-color: rgba(5, 6, 10, 0.9);
            box-shadow: 0 0 20px rgba(26, 102, 255, 0.2);
        }

        .input-wrapper input:focus ~ i {
            color: #1a66ff;
        }

        .btn-submit {
            width: 100%;
            padding: 16px;
            background: linear-gradient(135deg, #1a66ff, #004fe6);
            color: #ffffff;
            border: none;
            border-radius: 12px;
            font-size: 16px;
            font-weight: 700;
            cursor: pointer;
            box-shadow: 0 8px 20px rgba(26, 102, 255, 0.3);
            transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .btn-submit:hover {
            background: linear-gradient(135deg, #3377ff, #1a66ff);
            transform: translateY(-2px);
            box-shadow: 0 12px 25px rgba(26, 102, 255, 0.45);
        }

        .alert {
            padding: 14px;
            border-radius: 12px;
            font-size: 14px;
            font-weight: 600;
            margin-bottom: 24px;
            display: flex;
            align-items: center;
            gap: 10px;
            line-height: 1.4;
        }

        .alert-error {
            background-color: rgba(255, 77, 77, 0.1);
            border: 1px solid rgba(255, 77, 77, 0.2);
            color: #ff4d4d;
        }

        .alert-success {
            background-color: rgba(43, 182, 115, 0.1);
            border: 1px solid rgba(43, 182, 115, 0.2);
            color: #2bb673;
        }

        .links-container {
            margin-top: 32px;
            text-align: center;
            font-size: 14px;
        }

        .links-container a {
            color: #6699ff;
            text-decoration: none;
            font-weight: 600;
            transition: all 0.2s ease;
            display: inline-flex;
            align-items: center;
            gap: 6px;
        }

        .links-container a:hover {
            color: #ffffff;
            text-shadow: 0 0 10px rgba(255, 255, 255, 0.3);
        }
    </style>
</head>
<body>

<div class="recovery-card">
    <div class="header">
        <div class="logo">Cine<span>Track</span></div>
        <p class="subtitle">Insira seu e-mail cadastrado para recuperar seu acesso</p>
    </div>

    <?php if (!empty($mensagem)): ?>
        <div class="alert alert-<?php echo $status === 'success' ? 'success' : 'error'; ?>">
            <?php if ($status === 'success'): ?>
                <i class="fa-solid fa-circle-check" style="font-size: 16px;"></i>
            <?php else: ?>
                <i class="fa-solid fa-triangle-exclamation" style="font-size: 16px;"></i>
            <?php endif; ?>
            <span><?php echo $mensagem; ?></span>
        </div>
    <?php endif; ?>

    <form action="recuperarsenha.php" method="POST">
        <div class="input-group">
            <label for="email">E-mail Cadastrado</label>
            <div class="input-wrapper">
                <input type="email" id="email" name="email" required placeholder="nome@exemplo.com">
                <i class="fa-solid fa-envelope"></i>
            </div>
        </div>

        <button type="submit" class="btn-submit">Enviar Link de Recuperação</button>
    </form>

    <div class="links-container">
        <a href="login.php"><i class="fa-solid fa-arrow-left"></i> Voltar para o Login</a>
    </div>
</div>

</body>
</html>