<?php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// LÓGICA DE LOGOUT INTEGRADA: Garante que o botão Sair funcione imediatamente
if (isset($_GET['action']) && $_GET['action'] === 'logout') {
    $_SESSION = array();
    if (ini_get("session.use_cookies")) {
        $params = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000,
            $params["path"], $params["domain"],
            $params["secure"], $params["httponly"]
        );
    }
    session_destroy();
    header("Location: login.php");
    exit;
}

// Se o usuário não estiver logado, manda de volta para a tela de login
if (!isset($_SESSION['usuario_id'])) {
    header("Location: login.php");
    exit;
}

// Conecta ao banco SQLite para puxar os filmes/séries
require_once 'conexao.php';

try {
    // Busca todas as mídias cadastradas na tabela 'medias'
    $stmt = $pdo->query("SELECT * FROM medias ORDER BY id DESC");
    $filmes = $stmt->fetchAll(PDO::FETCH_ASSOC);
} catch (PDOException $e) {
    $filmes = [];
    $erro_banco = "Erro ao carregar mídias: " . $e->getMessage();
}
?>
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CineTrack - Dashboard</title>
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
            min-height: 100vh;
            padding: 30px 40px;
            position: relative;
        }

        /* Topbar com Glassmorphism Avançado */
        .navbar {
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: linear-gradient(135deg, rgba(19, 23, 36, 0.7) 0%, rgba(13, 18, 31, 0.8) 100%);
            backdrop-filter: blur(20px);
            padding: 18px 35px;
            border-radius: 20px;
            margin-bottom: 40px;
            border: 1px solid rgba(255, 255, 255, 0.06);
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
        }

        .logo {
            font-size: 26px;
            font-weight: 800;
            letter-spacing: -1px;
        }

        .logo span {
            background: linear-gradient(135deg, #1a66ff, #6699ff);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }

        .user-panel {
            display: flex;
            align-items: center;
            gap: 20px;
        }

        .welcome-text {
            font-size: 14px;
            color: #94a3b8;
        }

        .welcome-text strong {
            color: #ffffff;
            font-weight: 600;
        }

        .role-badge {
            background: rgba(26, 102, 255, 0.15);
            color: #6699ff;
            border: 1px solid rgba(26, 102, 255, 0.3);
            padding: 6px 14px;
            border-radius: 30px;
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .btn-logout {
            color: #ff4d4d;
            text-decoration: none;
            font-weight: 700;
            font-size: 14px;
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 8px 16px;
            border-radius: 10px;
            transition: all 0.2s ease;
            background: rgba(255, 77, 77, 0.05);
            border: 1px solid rgba(255, 77, 77, 0.1);
        }

        .btn-logout:hover {
            background: rgba(255, 77, 77, 0.15);
            color: #ff6666;
            box-shadow: 0 0 15px rgba(255, 77, 77, 0.1);
        }

        /* Seção de Conteúdo */
        .content-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 25px;
        }

        .section-title {
            font-size: 24px;
            font-weight: 700;
            letter-spacing: -0.5px;
            color: #f1f5f9;
        }

        .btn-add-media {
            background: linear-gradient(135deg, #1a66ff, #004fe6);
            color: #ffffff;
            text-decoration: none;
            font-weight: 700;
            font-size: 14px;
            padding: 12px 24px;
            border-radius: 12px;
            display: flex;
            align-items: center;
            gap: 8px;
            box-shadow: 0 8px 20px rgba(26, 102, 255, 0.25);
            transition: all 0.3s ease;
        }

        .btn-add-media:hover {
            transform: translateY(-2px);
            box-shadow: 0 12px 25px rgba(26, 102, 255, 0.4);
            background: linear-gradient(135deg, #3377ff, #1a66ff);
        }

        /* Grid Multimídia Avançado */
        .grid-medias {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
            gap: 28px;
        }

        .card-media {
            background: rgba(19, 23, 36, 0.6);
            border-radius: 18px;
            overflow: hidden;
            border: 1px solid rgba(255, 255, 255, 0.05);
            transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
            position: relative;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
        }

        .card-media:hover {
            transform: translateY(-8px) scale(1.02);
            border-color: rgba(26, 102, 255, 0.4);
            box-shadow: 0 20px 35px rgba(0, 0, 0, 0.5), 0 0 15px rgba(26, 102, 255, 0.15);
        }

        .poster-container {
            position: relative;
            width: 100%;
            height: 300px;
            background-color: #0f121d;
            overflow: hidden;
        }

        .poster-image {
            width: 100%;
            height: 100%;
            object-fit: cover;
            transition: transform 0.5s ease;
        }

        .card-media:hover .poster-image {
            transform: scale(1.06);
        }

        .poster-placeholder {
            width: 100%;
            height: 100%;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            color: #334155;
            font-size: 50px;
            gap: 10px;
            background: linear-gradient(135deg, #0f121d 0%, #171d2e 100%);
        }

        .poster-placeholder span {
            font-size: 12px;
            font-weight: 600;
            color: #475569;
            text-transform: uppercase;
            letter-spacing: 1px;
        }

        /* Etiqueta Flutuante de Tipo (Filme / Série) */
        .type-badge {
            position: absolute;
            top: 14px;
            right: 14px;
            padding: 5px 10px;
            border-radius: 8px;
            font-size: 11px;
            font-weight: 800;
            text-transform: uppercase;
            backdrop-filter: blur(10px);
            background: rgba(10, 13, 22, 0.75);
            border: 1px solid rgba(255, 255, 255, 0.1);
            letter-spacing: 0.5px;
        }

        .type-badge.filme { color: #38bdf8; }
        .type-badge.serie { color: #a855f7; }

        .card-info {
            padding: 18px;
            background: linear-gradient(180deg, rgba(19, 23, 36, 0) 0%, rgba(10, 13, 22, 0.9) 100%);
        }

        .card-title {
            font-size: 15px;
            font-weight: 700;
            color: #f8fafc;
            margin-bottom: 6px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .card-meta {
            font-size: 13px;
            color: #64748b;
            font-weight: 500;
            display: flex;
            align-items: center;
            gap: 6px;
        }

        .sem-filmes {
            grid-column: 1 / -1;
            padding: 60px 40px;
            background: rgba(19, 23, 36, 0.4);
            border-radius: 20px;
            color: #64748b;
            text-align: center;
            border: 2px dashed rgba(255, 255, 255, 0.05);
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 15px;
        }

        .sem-filmes i {
            font-size: 40px;
            color: #334155;
        }

        @media(max-width: 768px) {
            body { padding: 20px; }
            .navbar { flex-direction: column; gap: 15px; text-align: center; }
            .content-header { flex-direction: column; gap: 15px; align-items: flex-start; }
        }
    </style>
</head>
<body>

    <nav class="navbar">
        <div class="logo">Cine<span>Track</span></div>
        <div class="user-panel">
            <span class="welcome-text">Olá, <strong><?php echo htmlspecialchars($_SESSION['usuario_nome']); ?></strong>!</span>
            <span class="role-badge"><i class="fa-solid fa-shield-halved"></i> <?php echo htmlspecialchars($_SESSION['usuario_role']); ?></span>
            <a href="dashboard.php?action=logout" class="btn-logout"><i class="fa-solid fa-right-from-bracket"></i> Sair</a>
        </div>
    </nav>

    <div class="content-header">
        <h2 class="section-title">Minha Coleção de Filmes e Séries</h2>
        <a href="cadastrar_midia.php" class="btn-add-media">
            <i class="fa-solid fa-plus"></i> Adicionar Mídia
        </a>
    </div>

    <?php if (isset($erro_banco)): ?>
        <p style="color: #ff4d4d; margin-bottom: 20px; font-weight: 600;"><i class="fa-solid fa-triangle-exclamation"></i> <?= $erro_banco ?></p>
    <?php endif; ?>

    <div class="grid-medias">
        <?php if (!empty($filmes)): ?>
            <?php foreach ($filmes as $filme): ?>
                <div class="card-media">
                    <div class="poster-container">
                        <?php 
                            $tipoFormatado = strtolower($filme['type'] ?? '');
                            $classeTipo = ($tipoFormatado === 'série' || $tipoFormatado === 'serie') ? 'serie' : 'filme';
                        ?>
                        <span class="type-badge <?= $classeTipo ?>">
                            <?= htmlspecialchars($filme['type']); ?>
                        </span>

                        <?php if (!empty($filme['cover_image_url'])): ?>
                            <img src="<?php echo htmlspecialchars($filme['cover_image_url']); ?>" alt="Poster" class="poster-image">
                        <?php else: ?>
                            <div class="poster-placeholder">
                                <i class="fa-solid fa-film"></i>
                                <span>Sem Poster</span>
                            </div>
                        <?php endif; ?>
                    </div>

                    <div class="card-info">
                        <div class="card-title" title="<?php echo htmlspecialchars($filme['title']); ?>">
                            <?php echo htmlspecialchars($filme['title']); ?>
                        </div>
                        <div class="card-meta">
                            <i class="fa-regular fa-calendar"></i>
                            <span><?php echo htmlspecialchars($filme['release_year']); ?></span>
                        </div>
                    </div>
                </div>
            <?php endforeach; ?>
        <?php else: ?>
            <div class="sem-filmes">
                <i class="fa-solid fa-clapperboard"></i>
                <p>Nenhum filme ou série cadastrado ainda no seu banco de dados.</p>
            </div>
        <?php endif; ?>
    </div>

</body>
</html>