<?php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Se o usuário não estiver logado, redireciona para o login de forma segura
if (!isset($_SESSION['usuario_id'])) {
    header("Location: login.php");
    exit;
}

require_once 'conexao.php';

$mensagem = '';
$tipo_mensagem = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $title = trim($_POST['title'] ?? '');
    $description = trim($_POST['description'] ?? '');
    $type = $_POST['type'] ?? 'Filme';
    $release_year = filter_input(INPUT_POST, 'release_year', FILTER_VALIDATE_INT);
    $cover_image_url = trim($_POST['cover_image_url'] ?? '');

    if (empty($title)) {
        $mensagem = "O título da mídia é obrigatório.";
        $tipo_mensagem = "erro";
    } else {
        try {
            // Insere a mídia diretamente no banco SQLite (.db)
            $sql = "INSERT INTO medias (title, description, type, release_year, cover_image_url) 
                    VALUES (:title, :description, :type, :release_year, :cover_image_url)";
            
            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                ':title' => $title,
                ':description' => $description,
                ':type' => $type,
                ':release_year' => $release_year ? $release_year : null,
                ':cover_image_url' => !empty($cover_image_url) ? $cover_image_url : null
            ]);

            $mensagem = "Mídia cadastrada com sucesso! Redirecionando para o Dashboard...";
            $tipo_mensagem = "sucesso";
            
            // Redireciona para o dashboard após 2 segundos para ver o resultado
            header("Refresh: 2; url=dashboard.php");
        } catch (PDOException $e) {
            $mensagem = "Erro ao cadastrar mídia: " . $e->getMessage();
            $tipo_mensagem = "erro";
        }
    }
}
?>
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CineTrack - Cadastrar Mídia</title>
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
            overflow-x: hidden;
        }

        /* Detalhe de luz ambiente azul no fundo */
        body::before {
            content: '';
            position: absolute;
            width: 600px;
            height: 600px;
            background: radial-gradient(circle, rgba(26, 102, 255, 0.1) 0%, rgba(0,0,0,0) 70%);
            bottom: -200px;
            left: -200px;
            z-index: 0;
            pointer-events: none;
        }

        .card-cadastro {
            background: linear-gradient(135deg, rgba(19, 23, 36, 0.7) 0%, rgba(13, 18, 31, 0.8) 100%);
            border: 1px solid rgba(255, 255, 255, 0.08);
            padding: 40px;
            border-radius: 24px;
            width: 100%;
            max-width: 520px;
            box-shadow: 0 30px 60px rgba(0, 0, 0, 0.6), inset 0 1px 1px rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(20px);
            position: relative;
            z-index: 10;
        }

        /* Detalhe reflexivo linear na borda superior do Card */
        .card-cadastro::after {
            content: '';
            position: absolute;
            top: -1px;
            left: 40px;
            right: 40px;
            height: 1px;
            background: linear-gradient(90deg, rgba(26,102,255,0) 0%, rgba(26,102,255,0.5) 50%, rgba(26,102,255,0) 100%);
        }

        h2 {
            font-size: 26px;
            font-weight: 800;
            letter-spacing: -0.5px;
            margin-bottom: 8px;
            text-align: center;
            background: linear-gradient(135deg, #ffffff, #94a3b8);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }

        .subtitle {
            font-size: 14px;
            color: #94a3b8;
            text-align: center;
            margin-bottom: 30px;
            font-weight: 500;
        }

        .input-group {
            margin-bottom: 20px;
        }

        .input-group label {
            display: block;
            font-size: 13px;
            font-weight: 600;
            margin-bottom: 8px;
            color: #94a3b8;
            letter-spacing: 0.3px;
        }

        /* Wrapper customizado para embutir ícones */
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
            pointer-events: none;
        }

        /* Estilização avançada para todos os tipos de inputs */
        .input-wrapper input, 
        .input-wrapper select, 
        .input-wrapper textarea {
            width: 100%;
            padding: 13px 16px 13px 46px;
            border-radius: 12px;
            border: 2px solid rgba(255, 255, 255, 0.05);
            background-color: rgba(5, 6, 10, 0.6);
            color: #ffffff;
            font-size: 15px;
            font-weight: 500;
            transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        /* Ajuste específico para textarea */
        .input-wrapper textarea {
            resize: none;
            padding-top: 14px;
        }

        /* Customização visual do elemento select do navegador */
        .input-wrapper select {
            appearance: none;
            cursor: pointer;
        }

        /* Efeito de foco profissional e unificado */
        .input-wrapper input:focus, 
        .input-wrapper select:focus, 
        .input-wrapper textarea:focus {
            outline: none;
            border-color: #1a66ff;
            background-color: rgba(5, 6, 10, 0.9);
            box-shadow: 0 0 20px rgba(26, 102, 255, 0.15);
        }

        /* Ativação de cor do ícone correspondente ao campo focado */
        .input-wrapper input:focus ~ i,
        .input-wrapper select:focus ~ i,
        .input-wrapper textarea:focus ~ i {
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
            margin-top: 10px;
        }

        .btn-submit:hover {
            background: linear-gradient(135deg, #3377ff, #1a66ff);
            transform: translateY(-2px);
            box-shadow: 0 12px 25px rgba(26, 102, 255, 0.45);
        }

        /* Alert styling condizente com a UI geral */
        .alerta {
            padding: 14px;
            border-radius: 12px;
            font-size: 14px;
            font-weight: 600;
            margin-bottom: 24px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
            line-height: 1.4;
        }

        .erro {
            background-color: rgba(255, 77, 77, 0.1);
            border: 1px solid rgba(255, 77, 77, 0.2);
            color: #ff4d4d;
        }

        .sucesso {
            background-color: rgba(43, 182, 115, 0.1);
            border: 1px solid rgba(43, 182, 115, 0.2);
            color: #2bb673;
        }

        .link-voltar {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            justify-content: center;
            width: 100%;
            margin-top: 24px;
            color: #64748b;
            text-decoration: none;
            font-size: 14px;
            font-weight: 600;
            transition: all 0.2s ease;
        }

        .link-voltar:hover {
            color: #ffffff;
            text-shadow: 0 0 10px rgba(255, 255, 255, 0.3);
        }
    </style>
</head>
<body>

<div class="card-cadastro">
    <h2>Adicionar Nova Mídia</h2>
    <p class="subtitle">Insira os metadados abaixo para salvar o título no acervo</p>

    <?php if (!empty($mensagem)): ?>
        <div class="alerta <?= $tipo_mensagem === 'sucesso' ? 'sucesso' : 'erro' ?>">
            <?php if ($tipo_mensagem === 'sucesso'): ?>
                <i class="fa-solid fa-circle-check"></i>
            <?php else: ?>
                <i class="fa-solid fa-triangle-exclamation"></i>
            <?php endif; ?>
            <?= htmlspecialchars($mensagem) ?>
        </div>
    <?php endif; ?>

    <form action="cadastrar_midia.php" method="POST" autocomplete="off">
        <div class="input-group">
            <label for="title">Título da Mídia</label>
            <div class="input-wrapper">
                <input type="text" id="title" name="title" required placeholder="Ex: Interestelar">
                <i class="fa-solid fa-heading"></i>
            </div>
        </div>

        <div class="input-group">
            <label for="type">Tipo de Conteúdo</label>
            <div class="input-wrapper">
                <select id="type" name="type">
                    <option value="Filme">🎬 Filme</option>
                    <option value="Série">📺 Série</option>
                </select>
                <i class="fa-solid fa-shapes"></i>
            </div>
        </div>

        <div class="input-group">
            <label for="release_year">Ano de Lançamento</label>
            <div class="input-wrapper">
                <input type="number" id="release_year" name="release_year" placeholder="Ex: 2014" min="1800" max="2100">
                <i class="fa-solid fa-calendar-days"></i>
            </div>
        </div>

        <div class="input-group">
            <label for="cover_image_url">URL da Imagem de Capa (Poster)</label>
            <div class="input-wrapper">
                <input type="url" id="cover_image_url" name="cover_image_url" placeholder="https://linkdaimagem.com/poster.jpg">
                <i class="fa-solid fa-image"></i>
            </div>
        </div>

        <div class="input-group">
            <label for="description">Sinopse / Descrição</label>
            <div class="input-wrapper">
                <textarea id="description" name="description" rows="3" placeholder="Insira uma breve sinopse do filme ou série..."></textarea>
                <i class="fa-solid fa-align-left" style="top: 16px;"></i>
            </div>
        </div>

        <button type="submit" class="btn-submit">Salvar no Banco de Dados</button>
    </form>

    <a href="dashboard.php" class="link-voltar"><i class="fa-solid fa-arrow-left"></i> Voltar para o Dashboard</a>
</div>

</body>
</html>