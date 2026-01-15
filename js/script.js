document.addEventListener('DOMContentLoaded', () => {

    // --- 1. Lógica do Tema (Dark/Light) - Sincronizada ---
    const toggleCheckboxes = document.querySelectorAll('.theme-toggle-input');
    const temaSalvo = localStorage.getItem('theme');
    
    const setTema = (isLight) => {
        document.body.classList.toggle('light-mode', isLight);
        localStorage.setItem('theme', isLight ? 'light' : 'dark');
        toggleCheckboxes.forEach(box => box.checked = !isLight);

        const iframe = document.querySelector('iframe.giscus-frame');
        if (iframe) {
            const novoTema = isLight ? 'light' : 'noborder_gray';
            iframe.contentWindow.postMessage({ giscus: { setConfig: { theme: novoTema } } }, 'https://giscus.app');
        }
    };
    
    if (temaSalvo === 'light') setTema(true);
    else setTema(false);

    toggleCheckboxes.forEach(box => {
        box.addEventListener('change', () => setTema(!box.checked));
    });

    // --- 2. Auxiliar de Agendamento ---
    // Converte "24 mar 2025" em um objeto Date real para comparação
    function converterDataParaComparacao(dataStr) {
        const meses = {
            jan: 0, fev: 1, mar: 2, abr: 3, mai: 4, jun: 5,
            jul: 6, ago: 7, set: 8, out: 9, nov: 10, dez: 11
        };
        const partes = dataStr.split(' ');
        return new Date(partes[2], meses[partes[1]], partes[0]);
    }

    // --- 3. Função de Renderização (Lista de Posts) ---
    function renderizarListaPosts(filtroCategoria = null, postsForcados = null) {
        const feedContainer = document.getElementById('textos-lista');
        const tituloSecao = document.querySelector('#textos h2'); 
        const areaLeitura = document.querySelector('.area-leitura');

        if (!feedContainer || typeof postsData === 'undefined') return;

        feedContainer.innerHTML = '';
        
        // --- FILTRO DE AGENDAMENTO ---
        // Só permite ver posts cuja data seja hoje ou no passado
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);

        const postsVisiveis = postsData.filter(post => {
            const dataPost = converterDataParaComparacao(post.date);
            return dataPost <= hoje;
        });

        let postsParaExibir = [];
        let modoVisualizacao = ''; 
        
        // Lógica de Prioridade de Exibição
        if (postsForcados) {
            // Na busca, filtramos os resultados para não mostrar agendados
            postsParaExibir = postsForcados.filter(post => converterDataParaComparacao(post.date) <= hoje);
            modoVisualizacao = 'grid';
            feedContainer.className = 'feed-grid';
            if(areaLeitura) areaLeitura.classList.add('largura-expandida');
        }
        else if (filtroCategoria) {
            postsParaExibir = postsVisiveis.filter(post => post.category === filtroCategoria).reverse();
            modoVisualizacao = 'lista';
            feedContainer.className = 'feed-list';
            if(areaLeitura) areaLeitura.classList.remove('largura-expandida');
            if(tituloSecao) tituloSecao.innerText = filtroCategoria; 
        } 
        else {
            postsParaExibir = postsVisiveis;
            modoVisualizacao = 'grid';
            feedContainer.className = 'feed-grid';
            if(areaLeitura) areaLeitura.classList.add('largura-expandida');
            if(tituloSecao) tituloSecao.innerText = 'textos';
        }

        if (postsParaExibir.length > 0) {
            postsParaExibir.forEach(post => {
                const article = document.createElement('article');
                
                if (modoVisualizacao === 'grid') {
                    article.className = 'post-card animacao-entrada';
                    article.innerHTML = `
                        <a href="#post-${post.id}">
                            <div class="card-image-wrapper">
                                <img src="${post.image}" alt="${post.imageAlt}" loading="lazy">
                            </div>
                            <div class="card-content">
                                <small>${post.date}</small>
                                <h3>${post.title}</h3>
                                <div class="card-meta">${post.author} . ${post.readingTime}</div>
                            </div>
                        </a>`;
                } else {
                    const tempDiv = document.createElement("div");
                    tempDiv.innerHTML = post.content;
                    const resumo = (tempDiv.textContent || tempDiv.innerText || "").substring(0, 120) + "...";

                    article.className = 'post-item animacao-entrada';
                    article.innerHTML = `
                        <a href="#post-${post.id}" style="text-decoration: none; color: inherit;">
                            <small>${post.date}</small>
                            <h3>${post.title}</h3>
                            <p>${resumo}</p>
                        </a>`;
                }
                feedContainer.appendChild(article);
            });
        } else {
            feedContainer.innerHTML = '<p style="text-align:center; margin-top:30px; opacity: 0.6; font-family:Courier Prime;">nenhum texto encontrado...</p>';
        }
    }

    // --- 4. Lógica da Busca ---
    const campoBusca = document.getElementById('campo-busca');
    if (campoBusca) {
        campoBusca.addEventListener('input', function(e) {
            const termo = e.target.value.toLowerCase();
            if (termo === '') {
                renderizarListaPosts(null);
                return;
            }
            const resultados = postsData.filter(post => {
                return post.title.toLowerCase().includes(termo) || post.content.toLowerCase().includes(termo);
            });
            renderizarListaPosts(null, resultados);
        });
    }

    // --- 5. Compartilhamento e Comentários (Giscus) ---
    function gerarBotoesShare(titulo, url) {
        const texto = encodeURIComponent(titulo);
        const link = encodeURIComponent(url);
        return `
            <div class="share-section">
                <p class="share-title">compartilhar essa idéia:</p>
                <div class="share-buttons">
                    <a href="https://api.whatsapp.com/send?text=${texto}%20${link}" target="_blank" class="btn-share">WhatsApp</a>
                    <a href="https://twitter.com/intent/tweet?text=${texto}&url=${link}" target="_blank" class="btn-share">X</a>
                    <button class="btn-share" onclick="navigator.clipboard.writeText('${url}').then(() => alert('link copiado!'))">Link</button>
                </div>
            </div>
            <div class="giscus-container" style="margin-top: 50px;"></div>`;
    }

    function carregarGiscus() {
        const container = document.querySelector('.giscus-container');
        if (!container) return;
        container.innerHTML = '';
        const tema = document.body.classList.contains('light-mode') ? 'light' : 'noborder_gray';

        const s = document.createElement('script');
        s.src = "https://giscus.app/client.js";
        s.setAttribute("data-repo", "blogdodu/blogdodu");
        s.setAttribute("data-repo-id", "R_kgDOQraO_w");
        s.setAttribute("data-category", "General");
        s.setAttribute("data-category-id", "DIC_kwDOQraO_84Cz_cT");
        s.setAttribute("data-mapping", "url");
        s.setAttribute("data-theme", tema);
        s.setAttribute("data-lang", "pt");
        s.crossOrigin = "anonymous";
        s.async = true;
        container.appendChild(s);
    }

    // --- 6. Roteamento ---
    function roteador() {
        window.scrollTo(0, 0);
        const hash = window.location.hash;
        const capa = document.getElementById('capa');
        const conteudo = document.getElementById('conteudo');
        const todasSecoes = document.querySelectorAll('.secao-conteudo');
        const linksMenu = document.querySelectorAll('.links-internos a');
        
        if (typeof gtag === 'function') {
            gtag('event', 'page_view', { page_path: hash || '/' });
        }

        if (!hash || hash === '#') {
            capa.style.display = 'flex';
            conteudo.classList.add('hidden');
            return;
        }

        capa.style.display = 'none';
        conteudo.classList.remove('hidden');
        todasSecoes.forEach(s => s.style.display = 'none');

        if (hash.startsWith('#post-')) {
            const post = postsData.find(p => p.id === hash.replace('#post-', ''));
            if (post) {
                // Checa se o post está agendado (segurança extra)
                if (converterDataParaComparacao(post.date) > new Date()) {
                    window.location.hash = '#textos';
                    return;
                }
                document.getElementById('dynamic-title').innerText = post.title;
                document.getElementById('dynamic-content').innerHTML = post.content;
                document.getElementById('dynamic-image').src = post.image;
                document.getElementById('social-area').innerHTML = gerarBotoesShare(post.title, window.location.href);
                carregarGiscus();
                document.getElementById('post-view').style.display = 'block';
            }
        } else if (hash === '#textos') {
            document.getElementById('textos').style.display = 'block';
            renderizarListaPosts();
        } else {
            const secao = document.querySelector(hash);
            if (secao) secao.style.display = 'block';
        }

        linksMenu.forEach(l => l.classList.toggle('link-ativo', l.getAttribute('href') === hash));
    }

    window.addEventListener('hashchange', roteador);
    roteador();

    // --- 7. UI (Menu, Barra Progresso, Voltar) ---
    const menuBtn = document.getElementById('menu-btn');
    const menuLista = document.getElementById('menu-lista');
    if (menuBtn) {
        menuBtn.addEventListener('click', () => {
            menuLista.classList.toggle('menu-aberto');
            menuBtn.classList.toggle('ativo');
        });
    }

    window.onscroll = () => {
        const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
        const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const scrolled = (winScroll / height) * 100;
        const barra = document.getElementById("barra-leitura");
        if (barra) barra.style.height = scrolled + "%";
    };

    document.querySelectorAll('.seta-voltar').forEach(b => {
        b.addEventListener('click', (e) => {
            e.preventDefault();
            window.history.back();
        });
    });
});
