<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CineTrack - Avaliações da Comunidade</title>
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

        .brand {
            display: flex;
            align-items: center;
            gap: 12px;
            text-decoration: none;
            color: #fff;
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
            padding: 20px 6% 60px 6%;
            flex-grow: 1;
            display: flex;
            flex-direction: column;
            gap: 40px;
        }

        /* Seção de Resumo das Notas */
        .reviews-summary {
            display: flex;
            background: linear-gradient(135deg, rgba(19, 23, 36, 0.6) 0%, rgba(13, 18, 31, 0.7) 100%);
            border: 1px solid rgba(255, 255, 255, 0.06);
            border-radius: 20px;
            padding: 30px;
            align-items: center;
            justify-content: space-between;
            flex-wrap: wrap;
            gap: 30px;
            backdrop-filter: blur(15px);
        }

        .summary-info h1 {
            font-size: 32px;
            font-weight: 800;
            letter-spacing: -0.5px;
            margin-bottom: 6px;
        }

        .summary-info p {
            color: #94a3b8;
            font-size: 15px;
        }

        .rating-box {
            display: flex;
            align-items: center;
            gap: 20px;
            background: rgba(255, 255, 255, 0.02);
            padding: 16px 28px;
            border-radius: 16px;
            border: 1px solid rgba(255, 255, 255, 0.04);
        }

        .rating-number {
            font-size: 48px;
            font-weight: 800;
            color: #ffffff;
            line-height: 1;
        }

        .rating-stars {
            display: flex;
            flex-direction: column;
            gap: 4px;
        }

        .rating-stars .stars {
            color: #ffb800;
            font-size: 16px;
            display: flex;
            gap: 4px;
        }

        .rating-stars span {
            font-size: 12px;
            color: #64748b;
            font-weight: 600;
        }

        /* Grade de Avaliações */
        .reviews-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
            gap: 24px;
        }

        /* Card de Avaliação individual */
        .review-card {
            background: rgba(19, 23, 36, 0.4);
            border: 1px solid rgba(255, 255, 255, 0.05);
            border-radius: 18px;
            padding: 24px;
            display: flex;
            flex-direction: column;
            gap: 16px;
            transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .review-card:hover {
            transform: translateY(-4px);
            border-color: rgba(26, 102, 255, 0.25);
            background: rgba(19, 23, 36, 0.6);
            box-shadow: 0 15px 30px rgba(0, 0, 0, 0.3);
        }

        .review-user {
            display: flex;
            align-items: center;
            justify-content: space-between;
        }

        .user-meta {
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .user-avatar {
            width: 42px;
            height: 42px;
            border-radius: 50%;
            object-fit: cover;
            background: #161f30;
            border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .user-name {
            font-size: 15px;
            font-weight: 700;
            color: #ffffff;
        }

        .review-time {
            font-size: 12px;
            color: #475569;
            font-weight: 500;
        }

        .card-stars {
            color: #ffb800;
            font-size: 12px;
            display: flex;
            gap: 2px;
        }

        .review-subject {
            display: flex;
            flex-direction: column;
            gap: 2px;
        }

        .subject-title {
            font-size: 16px;
            font-weight: 700;
            color: #ffffff;
        }

        .subject-type {
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #6699ff;
            font-weight: 700;
        }

        .review-text {
            font-size: 14px;
            color: #94a3b8;
            line-height: 1.6;
            font-style: italic;
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

        @media (max-width: 1024px) {
            nav {
                display: none;
            }
            .reviews-summary {
                flex-direction: column;
                align-items: flex-start;
            }
            .rating-box {
                width: 100%;
                justify-content: center;
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
            <a href="index.php">Início</a>
            <a href="filmes.php">Filmes & Séries</a>
            <a href="avaliacoes.php" class="active">Avaliações</a>
            <a href="#">Trilhas Sonoras</a>
            <a href="#">Sobre</a>
        </nav>

        <a href="login.php" class="btn-top-login">Login</a>
    </header>

    <main>
        <div class="reviews-summary">
            <div class="summary-info">
                <h1>Avaliações da Comunidade</h1>
                <p>Veja o que os usuários do CineTrack estão achando das produções e das suas respectivas trilhas sonoras.</p>
            </div>
            <div class="rating-box">
                <div class="rating-number">4.8</div>
                <div class="rating-stars">
                    <div class="stars">
                        <i class="fa-solid fa-star"></i>
                        <i class="fa-solid fa-star"></i>
                        <i class="fa-solid fa-star"></i>
                        <i class="fa-solid fa-star"></i>
                        <i class="fa-solid fa-star-half-stroke"></i>
                    </div>
                    <span>Média baseada em 1.420 notas</span>
                </div>
            </div>
        </div>

        <div class="reviews-grid">

            <div class="review-card">
                <div class="review-user">
                    <div class="user-meta">
                        <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80" alt="Avatar Usuário" class="user-avatar">
                        <div>
                            <div class="user-name">Beatriz Souza</div>
                            <div class="card-stars">
                                <i class="fa-solid fa-star"></i>
                                <i class="fa-solid fa-star"></i>
                                <i class="fa-solid fa-star"></i>
                                <i class="fa-solid fa-star"></i>
                                <i class="fa-solid fa-star"></i>
                            </div>
                        </div>
                    </div>
                    <span class="review-time">há 2 horas</span>
                </div>
                <div class="review-subject">
                    <span class="subject-type">Filme / Trilha Sonora</span>
                    <h3 class="subject-title">Interstellar</h3>
                </div>
                <p class="review-text">
                    "A sincronização com o Spotify me deixou maluca! Poder ver a faixa 'Cornfield Chase' engatando logo após terminar as cenas cruciais torna a experiência de catalogar sensacional. Nota 10."
                </p>
            </div>

            <div class="review-card">
                <div class="review-user">
                    <div class="user-meta">
                        <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80" alt="Avatar Usuário" class="user-avatar">
                        <div>
                            <div class="user-name">Lucas Andrade</div>
                            <div class="card-stars">
                                <i class="fa-solid fa-star"></i>
                                <i class="fa-solid fa-star"></i>
                                <i class="fa-solid fa-star"></i>
                                <i class="fa-solid fa-star"></i>
                                <i class="fa-regular fa-star"></i>
                            </div>
                        </div>
                    </div>
                    <span class="review-time">há 5 horas</span>
                </div>
                <div class="review-subject">
                    <span class="subject-type">Série de TV</span>
                    <h3 class="subject-title">Stranger Things 5</h3>
                </div>
                <p class="review-text">
                    "O gerenciador de maratona limpo ajuda muito a não se perder nos episódios lançados. A interface escura combina perfeitamente com a vibe da série."
                </p>
            </div>

            <div class="review-card">
                <div class="review-user">
                    <div class="user-meta">
                        <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80" alt="Avatar Usuário" class="user-avatar">
                        <div>
                            <div class="user-name">Mariana Costa</div>
                            <div class="card-stars">
                                <i class="fa-solid fa-star"></i>
                                <i class="fa-solid fa-star"></i>
                                <i class="fa-solid fa-star"></i>
                                <i class="fa-solid fa-star"></i>
                                <i class="fa-solid fa-star"></i>
                            </div>
                        </div>
                    </div>
                    <span class="review-time">há 1 dia</span>
                </div>
                <div class="review-subject">
                    <span class="subject-type">Filme</span>
                    <h3 class="subject-title">Duna: Parte Dois</h3>
                </div>
                <p class="review-text">
                    "Que obra prima de filme e a trilha do Hans Zimmer é absurda de boa. O CineTrack facilitou muito achar as tracks sem precisar ficar caçando playlists aleatórias no app vizinho."
                </p>
            </div>

        </div>
    </main>

    <footer>
        CineTrack &copy; 2026 &mdash; Trabalho de Conclusão de Curso (TCC) Técnico em Informática para Internet.
    </footer>

</body>
</html>