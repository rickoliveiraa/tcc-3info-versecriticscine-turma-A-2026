<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CineTrack - Home</title>
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
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            overflow-x: hidden;
        }

        /* Efeito de Luz de Fundo (Glow Orb) */
        body::before {
            content: '';
            position: absolute;
            width: 400px;
            height: 400px;
            background: radial-gradient(circle, rgba(26, 102, 255, 0.15) 0%, rgba(0,0,0,0) 70%);
            top: -100px;
            right: -100px;
            z-index: 0;
            pointer-events: none;
        }

        /* Cabeçalho / Navbar */
        header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 30px 6%;
            background-color: transparent;
            position: relative;
            z-index: 10;
        }

        /* Ajuste para que o link da logo não mude de cor e mantenha o layout inline */
        .brand {
            display: flex;
            align-items: center;
            gap: 12px;
            text-decoration: none;
            color: #ffffff;
        }

        .brand-logo {
            width: 40px;
            height: 40px;
            object-fit: cover;
            border-radius: 50%;
            border: 2px solid rgba(26, 102, 255, 0.5);
            box-shadow: 0 0 15px rgba(26, 102, 255, 0.4);
        }

        .brand-name {
            font-size: 26px;
            font-weight: 800;
            letter-spacing: -0.5px;
        }

        .brand-name span {
            background: linear-gradient(135deg, #1a66ff, #6699ff);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }

        nav {
            display: flex;
            gap: 32px;
            background: rgba(255, 255, 255, 0.03);
            padding: 8px 24px;
            border-radius: 30px;
            border: 1px solid rgba(255, 255, 255, 0.05);
            backdrop-filter: blur(10px);
        }

        nav a {
            color: #94a3b8;
            text-decoration: none;
            font-size: 14px;
            font-weight: 600;
            transition: all 0.3s ease;
        }

        nav a.active, nav a:hover {
            color: #ffffff;
            text-shadow: 0 0 15px rgba(255, 255, 255, 0.5);
        }

        .btn-top-login {
            background: rgba(255, 255, 255, 0.05);
            color: #ffffff;
            border: 1px solid rgba(255, 255, 255, 0.1);
            padding: 12px 28px;
            border-radius: 25px;
            font-size: 14px;
            font-weight: 700;
            cursor: pointer;
            text-decoration: none;
            transition: all 0.3s ease;
        }

        .btn-top-login:hover {
            background: #ffffff;
            color: #05060a;
            box-shadow: 0 4px 20px rgba(255, 255, 255, 0.2);
            transform: translateY(-1px);
        }

        /* Conteúdo Principal */
        main {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 40px 6%;
            flex-grow: 1;
            gap: 60px;
            position: relative;
            z-index: 5;
        }

        .hero-section {
            max-width: 52%;
        }

        .hero-title {
            font-size: 58px;
            font-weight: 800;
            line-height: 1.15;
            letter-spacing: -1.5px;
            margin-bottom: 24px;
            background: linear-gradient(180deg, #ffffff 0%, #cbd5e1 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }

        .hero-description {
            font-size: 18px;
            color: #94a3b8;
            line-height: 1.7;
            margin-bottom: 40px;
            max-width: 90%;
        }

        .btn-cta {
            display: inline-flex;
            align-items: center;
            gap: 12px;
            background: linear-gradient(135deg, #1a66ff, #004fe6);
            color: #ffffff;
            padding: 18px 36px;
            border-radius: 35px;
            font-size: 16px;
            font-weight: 700;
            text-decoration: none;
            box-shadow: 0 8px 25px rgba(26, 102, 255, 0.35);
            transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .btn-cta:hover {
            background: linear-gradient(135deg, #3377ff, #1a66ff);
            transform: translateY(-3px);
            box-shadow: 0 12px 30px rgba(26, 102, 255, 0.5);
        }

        .btn-cta i {
            transition: transform 0.3s ease;
        }

        .btn-cta:hover i {
            transform: translateX(4px);
        }

        /* Card Lateral de Preview */
        .preview-section {
            width: 43%;
            display: flex;
            justify-content: flex-end;
        }

        .preview-card {
            background: linear-gradient(135deg, rgba(19, 23, 36, 0.7) 0%, rgba(13, 18, 31, 0.8) 100%);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 24px;
            padding: 36px;
            width: 100%;
            max-width: 440px;
            box-shadow: 0 30px 60px rgba(0, 0, 0, 0.6), inset 0 1px 1px rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(20px);
            position: relative;
        }

        /* Linha brilhante decorativa superior no card */
        .preview-card::after {
            content: '';
            position: absolute;
            top: -1px;
            left: 30px;
            right: 30px;
            height: 1px;
            background: linear-gradient(90deg, rgba(26,102,255,0) 0%, rgba(26,102,255,0.6) 50%, rgba(26,102,255,0) 100%);
        }

        .preview-badge {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 1.5px;
            color: #6699ff;
            background: rgba(26, 102, 255, 0.15);
            padding: 6px 14px;
            border-radius: 20px;
            font-weight: 700;
            margin-bottom: 24px;
            border: 1px solid rgba(26, 102, 255, 0.2);
        }

        .movie-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 8px;
        }

        .movie-title {
            font-size: 24px;
            font-weight: 700;
            letter-spacing: -0.5px;
        }

        .stars {
            color: #ffb800;
            font-size: 13px;
            display: flex;
            gap: 2px;
        }

        .sync-tag {
            font-size: 13px;
            color: #1a66ff;
            margin-bottom: 28px;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 6px;
        }

        .progress-container {
            margin-bottom: 32px;
        }

        .progress-bar {
            width: 100%;
            height: 8px;
            background-color: #161f30;
            border-radius: 4px;
            overflow: hidden;
            margin-bottom: 10px;
        }

        .progress-fill {
            width: 75%;
            height: 100%;
            background: linear-gradient(90deg, #1a66ff, #6699ff);
            border-radius: 4px;
            box-shadow: 0 0 10px rgba(26, 102, 255, 0.5);
        }

        .progress-labels {
            display: flex;
            justify-content: space-between;
            font-size: 12px;
            color: #64748b;
            font-weight: 600;
        }

        .progress-labels span:last-child {
            color: #ffffff;
        }

        .track-list {
            display: flex;
            flex-direction: column;
            gap: 14px;
        }

        .track-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: rgba(255, 255, 255, 0.02);
            padding: 16px 20px;
            border-radius: 12px;
            border: 1px solid rgba(255, 255, 255, 0.04);
            transition: all 0.2s ease;
        }

        .track-item:hover {
            background: rgba(255, 255, 255, 0.05);
            border-color: rgba(26, 102, 255, 0.3);
            transform: scale(1.02);
        }

        .track-name {
            font-size: 14px;
            font-weight: 600;
            color: #ffffff;
            display: flex;
            align-items: center;
        }

        .track-name span {
            color: #475569;
            margin-right: 10px;
            font-weight: 700;
        }

        .track-artist {
            font-size: 12px;
            color: #64748b;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 6px;
        }

        .track-artist i {
            color: #1db954;
        }

        /* Rodapé */
        footer {
            text-align: center;
            padding: 30px;
            font-size: 13px;
            color: #475569;
            border-top: 1px solid rgba(255, 255, 255, 0.03);
            position: relative;
            z-index: 10;
        }

        /* Responsividade */
        @media (max-width: 1024px) {
            main {
                flex-direction: column;
                text-align: center;
                padding: 60px 24px;
                gap: 50px;
            }
            .hero-section, .preview-section {
                max-width: 100%;
                width: 100%;
                justify-content: center;
            }
            .hero-description {
                max-width: 100%;
            }
            nav {
                display: none;
            }
        }
    </style>
</head>
<body>

    <header>
        <a href="index.php" class="brand">
            <img src="logo.png" alt="CineTrack Logo" class="brand-logo">
            <div class="brand-name">Cine<span>Track</span></div>
        </a>
        
        <nav>
            <a href="index.php" class="active">Início</a>
            <a href="filmes.php">Filmes & Séries</a>
            <a href="avaliacoes.php">Avaliações</a>
            <a href="#">Trilhas Sonoras</a>
            <a href="#">Sobre</a>
        </nav>

        <a href="login.php" class="btn-top-login">Login</a>
    </header>

    <main>
        <div class="hero-section">
            <h1 class="hero-title">Com o CineTrack,<br>sua paixão por maratonas não será perdida.</h1>
            <p class="hero-description">
                Cadastre-se e gerencie seus filmes e séries favoritos de forma limpa, conectando instantaneamente cada episódio assistido com as suas trilhas sonoras oficiais.
            </p>
            <a href="filmes.php" class="btn-cta">
                Conheça a plataforma <i class="fa-solid fa-arrow-right"></i>
            </a>
        </div>

        <div class="preview-section">
            <div class="preview-card">
                <span class="preview-badge"><i class="fa-solid fa-eye"></i> Preview do App</span>
                
                <div class="movie-header">
                    <h2 class="movie-title">Interstellar</h2>
                    <div class="stars">
                        <i class="fa-solid fa-star"></i>
                        <i class="fa-solid fa-star"></i>
                        <i class="fa-solid fa-star"></i>
                        <i class="fa-solid fa-star"></i>
                        <i class="fa-solid fa-star"></i>
                    </div>
                </div>
                
                <div class="sync-tag"><i class="fa-brands fa-spotify" style="color: #1db954;"></i> Sincronizado com Spotify API</div>
                
                <div class="progress-container">
                    <div class="progress-bar">
                        <div class="progress-fill"></div>
                    </div>
                    <div class="progress-labels">
                        <span>Progresso da Maratona</span>
                        <span>75%</span>
                    </div>
                </div>

                <div class="track-list">
                    <div class="track-item">
                        <div class="track-name"><span>1.</span> Cornfield Chase</div>
                        <div class="track-artist"><i class="fa-brands fa-spotify"></i> Hans Zimmer</div>
                    </div>
                    <div class="track-item">
                        <div class="track-name"><span>2.</span> No Time for Caution</div>
                        <div class="track-artist"><i class="fa-brands fa-spotify"></i> Hans Zimmer</div>
                    </div>
                </div>
            </div>
        </div>
    </main>

    <footer>
        CineTrack &copy; 2026 &mdash; Trabalho de Conclusão de Curso (TCC) Técnico em Informática para Internet.
    </footer>

</body>
</html>