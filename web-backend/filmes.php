<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CineTrack - Explorar Conteúdo</title>
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
            gap: 50px;
        }

        /* Topo da Exploração (Título + Busca) */
        .explore-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            flex-wrap: wrap;
            gap: 20px;
            margin-bottom: 10px;
        }

        .explore-title h1 {
            font-size: 38px;
            font-weight: 800;
            letter-spacing: -1px;
            margin-bottom: 6px;
        }

        .explore-title p {
            color: #94a3b8;
            font-size: 16px;
        }

        .search-box {
            position: relative;
            width: 100%;
            max-width: 400px;
        }

        .search-box input {
            width: 100%;
            background: rgba(255, 255, 255, 0.03);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 12px;
            padding: 14px 20px;
            padding-right: 45px;
            color: #fff;
            font-size: 14px;
            outline: none;
            transition: all 0.3s ease;
        }

        .search-box input:focus {
            border-color: #1a66ff;
            box-shadow: 0 0 15px rgba(26, 102, 255, 0.2);
            background: rgba(255, 255, 255, 0.05);
        }

        .search-box i {
            position: absolute;
            right: 20px;
            top: 50%;
            transform: translateY(-50%);
            color: #475569;
            font-size: 16px;
            pointer-events: none;
        }

        /* Seções de Grade de Mídias */
        .media-section {
            display: flex;
            flex-direction: column;
            gap: 24px;
        }

        .section-indicator {
            display: flex;
            align-items: center;
            gap: 12px;
        }

        .section-indicator::before {
            content: '';
            width: 4px;
            height: 24px;
            background: #1a66ff;
            border-radius: 2px;
            box-shadow: 0 0 10px #1a66ff;
        }

        .section-indicator h2 {
            font-size: 22px;
            font-weight: 700;
            letter-spacing: -0.5px;
        }

        .media-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
            gap: 24px;
        }

        /* Card de Filme/Série */
        .media-card {
            background: rgba(19, 23, 36, 0.4);
            border: 1px solid rgba(255, 255, 255, 0.05);
            border-radius: 16px;
            padding: 12px;
            display: flex;
            flex-direction: column;
            gap: 12px;
            transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
            text-decoration: none;
            color: inherit;
        }

        .media-card:hover {
            transform: translateY(-6px);
            border-color: rgba(26, 102, 255, 0.3);
            background: rgba(19, 23, 36, 0.7);
            box-shadow: 0 15px 30px rgba(0, 0, 0, 0.4);
        }

        .poster-wrapper {
            position: relative;
            width: 100%;
            padding-top: 145%; /* Proporção de aspecto de poster padrão */
            border-radius: 12px;
            overflow: hidden;
            background: #161f30;
        }

        .poster-wrapper img {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            object-fit: cover;
        }

        .media-info {
            display: flex;
            flex-direction: column;
            gap: 4px;
            padding: 2px 4px;
        }

        .media-genre {
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: #6699ff;
            font-weight: 700;
        }

        .media-name {
            font-size: 15px;
            font-weight: 700;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
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
            nav {
                display: none;
            }
            .explore-header {
                flex-direction: column;
                align-items: flex-start;
            }
            .search-box {
                max-width: 100%;
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
            <a href="filmes.php" class="active">Filmes & Séries</a>
            <a href="avaliacoes.php">Avaliações</a>
            <a href="#">Trilhas Sonoras</a>
            <a href="#">Sobre</a>
        </nav>

        <a href="login.php" class="btn-top-login">Login</a>
    </header>

    <main>
        <div class="explore-header">
            <div class="explore-title">
                <h1>Explorar Conteúdo</h1>
                <p>Descubra as produções mais comentadas e suas respectivas trilhas musicais.</p>
            </div>
            <div class="search-box">
                <input type="text" placeholder="Buscar título ou gênero...">
                <i class="fa-solid fa-magnifying-glass"></i>
            </div>
        </div>

        <section class="media-section">
            <div class="section-indicator">
                <h2>Filmes em Destaque na Atualidade</h2>
            </div>
            <div class="media-grid">
                
                <a href="#" class="media-card">
                    <div class="poster-wrapper">
                        <img src="https://image.tmdb.org/t/p/w500/964UuWv0E6769g7vewSgVz7636G.jpg" alt="Duna: Parte Dois">
                    </div>
                    <div class="media-info">
                        <span class="media-genre">Ficção Científica</span>
                        <span class="media-name">Duna: Parte Dois</span>
                    </div>
                </a>

                <a href="#" class="media-card">
                    <div class="poster-wrapper">
                        <img src="https://image.tmdb.org/t/p/w500/uJ6mY4m42g1w688v96Yw93w9v6m.jpg" alt="Homem Aranha: Sem Volta Para Casa">
                    </div>
                    <div class="media-info">
                        <span class="media-genre">Ação</span>
                        <span class="media-name">Homem Aranha: Sem Volta...</span>
                    </div>
                </a>

                <a href="#" class="media-card">
                    <div class="poster-wrapper">
                        <img src="https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MwqjPMvB.jpg" alt="Interstellar">
                    </div>
                    <div class="media-info">
                        <span class="media-genre">Espacial</span>
                        <span class="media-name">Interstellar</span>
                    </div>
                </a>

                <a href="#" class="media-card">
                    <div class="poster-wrapper">
                        <img src="https://image.tmdb.org/t/p/w500/74xTEgt7R36Fpooo50r9T611wZ6.jpg" alt="The Batman">
                    </div>
                    <div class="media-info">
                        <span class="media-genre">Noir</span>
                        <span class="media-name">The Batman</span>
                    </div>
                </a>

                <a href="#" class="media-card">
                    <div class="poster-wrapper">
                        <img src="https://image.tmdb.org/t/p/w500/8Gxv8gS6w0g7Y2wMW7wE3HwBvS5.jpg" alt="Oppenheimer">
                    </div>
                    <div class="media-info">
                        <span class="media-genre">Histórico</span>
                        <span class="media-name">Oppenheimer</span>
                    </div>
                </a>

            </div>
        </section>

        <section class="media-section">
            <div class="section-indicator">
                <h2>Séries Populares no Momento</h2>
            </div>
            <div class="media-grid">
                
                <a href="#" class="media-card">
                    <div class="poster-wrapper">
                        <img src="https://image.tmdb.org/t/p/w500/u9ZgUBg3N02UrXw86We6v47vOqT.jpg" alt="Stranger Things">
                    </div>
                    <div class="media-info">
                        <span class="media-genre">Ficção</span>
                        <span class="media-name">Stranger Things</span>
                    </div>
                </a>

                <a href="#" class="media-card">
                    <div class="poster-wrapper">
                        <img src="https://image.tmdb.org/t/p/w500/uKvH69gYvH6gYv6gYvH6gYvH6gY.jpg" alt="The Last of Us" onerror="this.src='https://image.tmdb.org/t/p/w500/3uCcZbyX9vHfs9Yv2vfsR50gK0s.jpg'">
                    </div>
                    <div class="media-info">
                        <span class="media-genre">Drama</span>
                        <span class="media-name">The Last of Us</span>
                    </div>
                </a>

                <a href="#" class="media-card">
                    <div class="poster-wrapper">
                        <img src="https://image.tmdb.org/t/p/w500/9PFonBhy47v6wY9v6gYv6gYv6gY.jpg" alt="Wandinha" onerror="this.src='https://image.tmdb.org/t/p/w500/40n99mZwNmb3XvS6v9YwYwmbjK4.jpg'">
                    </div>
                    <div class="media-info">
                        <span class="media-genre">Mistério</span>
                        <span class="media-name">Wandinha</span>
                    </div>
                </a>

                <a href="#" class="media-card">
                    <div class="poster-wrapper">
                        <img src="https://image.tmdb.org/t/p/w500/1X7v6wY9v6gYv6gYv6gYv6gYv6gY.jpg" alt="House of the Dragon" onerror="this.src='https://image.tmdb.org/t/p/w500/7g6U2X9vHfs9Yv2vfsR50gK0s.jpg'">
                    </div>
                    <div class="media-info">
                        <span class="media-genre">Fantasia</span>
                        <span class="media-name">House of the Dragon</span>
                    </div>
                </a>

                <a href="#" class="media-card">
                    <div class="poster-wrapper">
                        <img src="https://image.tmdb.org/t/p/w500/f9E2wY9v6gYv6gYv6gYv6gYv6gY.jpg" alt="Better Call Saul" onerror="this.src='https://image.tmdb.org/t/p/w500/f9E2wY9v6gYv6gYv6gYv6gYv6gY.jpg'">
                    </div>
                    <div class="media-info">
                        <span class="media-genre">Crime / Drama</span>
                        <span class="media-name">Better Call Saul</span>
                    </div>
                </a>

            </div>
        </section>
    </main>

    <footer>
        CineTrack &copy; 2026 &mdash; Trabalho de Conclusão de Curso (TCC) Técnico em Informática para Internet.
    </footer>

</body>
</html>