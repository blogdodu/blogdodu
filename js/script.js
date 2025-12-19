document.addEventListener('DOMContentLoaded', () => {

    // --- 1. Lógica do Tema (Dark/Light) - Sincronizada ---
    const toggleCheckboxes = document.querySelectorAll('.theme-toggle-input');
    const temaSalvo = localStorage.getItem('theme');
    
    const setTema = (isLight) => {
        document.body.classList.toggle('light-mode', isLight);
        localStorage.setItem('theme', isLight ? 'light' : 'dark');
        toggleCheckboxes.forEach(box => box.checked = !isLight);
    };

    if (temaSalvo === 'light') {
        setTema(true);
    } else {
        setTema(false);
    }

    toggleCheckboxes.forEach(box => {
        box.addEventListener('change', () => {
            setTema(!box.checked);
        });
    });

    // --- 2. Função de Renderização (Lista de Posts) ---
    function renderizarListaPosts(filtroCategoria = null, postsForcados = null) {
        const feedContainer = document.getElementById('textos-lista');
        const tituloSecao = document.querySelector('#textos h2'); 
        const areaLeitura = document.querySelector('.area-leitura');

        if (!feedContainer || typeof postsData === 'undefined') return;

        feedContainer.innerHTML = '';
        let postsParaExibir = [];
        let modoVisualizacao = ''; 
        
        // PRIORIDADE 1: Busca
        if (postsForcados) {
            postsParaExibir = postsForcados;
            modoVisualizacao = 'grid';
            feedContainer.className = 'feed-grid';
            if(areaLeitura) areaLeitura.classList.add('largura-expandida');
        }
        // PRIORIDADE 2: Filtro de Categoria (Caminhos) -> Lista Invertida
        else if (filtroCategoria) {
            postsParaExibir = postsData.filter(post => post.category === filtroCategoria).reverse();
            modoVisualizacao = 'lista';
            feedContainer.className = 'feed-list';
            if(areaLeitura) areaLeitura.classList.remove('largura-expandida');
            if(tituloSecao) tituloSecao.innerText = filtroCategoria; 
        } 
        // PRIORIDADE 3: Feed Padrão (Textos) -> Grade Normal
        else {
            postsParaExibir = postsData;
            modoVisualizacao = 'grid';
            feedContainer.className = 'feed-grid';
            if(areaLeitura) areaLeitura.classList.add('largura-expandida');
            if(tituloSecao) tituloSecao.innerText = 'textos';
        }

        // Renderiza
        if (postsParaExibir.length > 0) {
            postsParaExibir.forEach(post => {
                const article = document.createElement('article');
                
                if (modoVisualizacao === 'grid') {
                    // Grid: Cartão com Autor/Tempo
                    article.className = 'post-card animacao-entrada';
                    article.innerHTML = `
                        <a href="#post-${post.id}">
                            <div class="card-image-wrapper">
                                <img src="${post.image}" alt="${post.imageAlt}" loading="lazy">
                            </div>
                            <div class="card-content">
                                <small>${post.date}</small>
                                <h3>${post.title}</h3>
                                <div class="card-meta">
                                    ${post.author} . ${post.readingTime}
                                </div>
                            </div>
                        </a>
                    `;
                } else {
                    // Lista: Texto com Resumo
                    const tempDiv = document.createElement("div");
                    tempDiv.innerHTML = post.content;
                    const textOnly = tempDiv.textContent || tempDiv.innerText || "";
                    const resumo = textOnly.substring(0, 120) + "...";

                    article.className = 'post-item animacao-entrada';
                    article.innerHTML = `
                        <a href="#post-${post.id}" style="text-decoration: none; color: inherit;">
                            <small>${post.date}</small>
                            <h3>${post.title}</h3>
                            <p>${resumo}</p>
                        </a>
                    `;
                }
                feedContainer.appendChild(article);
            });
        } else {
            feedContainer.innerHTML = '<p style="text-align:center; margin-top:30px; opacity: 0.6; font-family:Courier New;">nenhum texto encontrado...</p>';
        }
    }

    // --- 3. Lógica da Busca ---
    const campoBusca = document.getElementById('campo-busca');
    if (campoBusca) {
        campoBusca.addEventListener('input', function(e) {
            const termo = e.target.value.toLowerCase();
            if (termo === '') {
                renderizarListaPosts(null);
                return;
            }
            const resultados = postsData.filter(post => {
                const titulo = post.title.toLowerCase();
                const conteudo = post.content.toLowerCase();
                return titulo.includes(termo) || conteudo.includes(termo);
            });
            renderizarListaPosts(null, resultados);
        });
    }

    // --- 4. FUNÇÃO DE COMPARTILHAMENTO ---
    function gerarBotoesShare(titulo, url) {
        const texto = encodeURIComponent(titulo);
        const link = encodeURIComponent(url);

        return `
            <div class="share-section">
                <p class="share-title">compartilhar essa idéia:</p>
                <div class="share-buttons">
                    <a href="https://api.whatsapp.com/send?text=${texto}%20${link}" target="_blank" class="btn-share">WhatsApp</a>
                    <a href="https://twitter.com/intent/tweet?text=${texto}&url=${link}" target="_blank" class="btn-share">X / Twitter</a>
                    <a href="https://www.facebook.com/sharer/sharer.php?u=${link}" target="_blank" class="btn-share">Facebook</a>
                    <button class="btn-share" onclick="navigator.clipboard.writeText('${url}').then(() => alert('link copiado!'))">Copiar Link</button>
                </div>
            </div>
            <div id="disqus_thread"></div>
        `;
    }

    // --- 5. FUNÇÃO DO DISQUS ---
    function carregarDisqus(postId, postTitle) {
        var disqus_shortname = 'blogdodu'; // Troque pelo seu shortname real

        if (window.DISQUS) {
            window.DISQUS.reset({
                reload: true,
                config: function () {
                    this.page.identifier = postId;
                    this.page.url = window.location.href;
                    this.page.title = postTitle;
                }
            });
        } else {
            var d = document, s = d.createElement('script');
            s.src = 'https://' + disqus_shortname + '.disqus.com/embed.js';
            s.setAttribute('data-timestamp', +new Date());
            (d.head || d.body).appendChild(s);
        }
    }

    // --- 6. Sistema de Roteamento ---
    function roteador() {
        // RESETAR SCROLL E BARRA DE LEITURA
        window.scrollTo(0, 0);
        const barraLeitura = document.getElementById("barra-leitura");
        if(barraLeitura) barraLeitura.style.height = "0%";

        const hash = window.location.hash;
        const capa = document.getElementById('capa');
        const conteudo = document.getElementById('conteudo');
        const todasSecoes = document.querySelectorAll('.secao-conteudo');
        const linksMenu = document.querySelectorAll('.links-internos a');
        const navGlobal = document.getElementById('navegacao-global');
        
        // Limpezas
        if(campoBusca) campoBusca.value = '';
        const areaLeitura = document.querySelector('.area-leitura');
        if(areaLeitura) areaLeitura.classList.remove('largura-expandida');

        const containerBusca = document.querySelector('.container-busca');
        if(containerBusca) {
            if(hash === '#textos' || hash === '') containerBusca.style.display = 'block';
            else containerBusca.style.display = 'none';
        }

        const modal = document.getElementById("modal-foto");
        if (modal && modal.style.display === "flex") modal.style.display = "none";

        if (!capa || !conteudo) return;

        // --- Estado Inicial (Capa) ---
        if (!hash || hash === '#' || hash === '') {
            conteudo.classList.add('hidden');
            capa.style.display = 'flex';
            
            if(navGlobal) navGlobal.classList.add('ocultar-desktop');

            capa.classList.remove('animacao-entrada');
            void capa.offsetWidth;
            capa.classList.add('animacao-entrada');

            // --- CORREÇÃO: Limpa o estado ativo de todos os links ao ir para a capa ---
            linksMenu.forEach(link => link.classList.remove('link-ativo'));
            return;
        }

        // --- Páginas Internas ---
        capa.style.display = 'none';
        conteudo.classList.remove('hidden');
        
        if(navGlobal) navGlobal.classList.remove('ocultar-desktop');

        todasSecoes.forEach(secao => secao.style.display = 'none');

        // --- ROTA DE POST ---
        if (hash.startsWith('#post-')) {
            const postId = hash.replace('#post-', '');
            const postIndex = postsData.findIndex(p => p.id === postId);
            const post = postsData[postIndex];

            if (post) {
                document.getElementById('dynamic-title').innerText = post.title;
                document.getElementById('dynamic-date').innerText = post.date;
                document.getElementById('dynamic-time').innerText = post.readingTime;
                
                const catLink = document.getElementById('dynamic-cat');
                catLink.innerText = post.category;
                if(post.category === "ensaios & provocações") catLink.href = "#cat-ensaios";
                else if(post.category === "conversas") catLink.href = "#cat-conversas";
                else catLink.href = "#caminhos";

                const authLink = document.getElementById('dynamic-author');
                authLink.innerText = post.author;
                if (post.author === 'du') {
                    authLink.href = "#sobre";
                } else {
                    authLink.href = post.authorId;
                }

                document.getElementById('dynamic-content').innerHTML = post.content;
                
                const img = document.getElementById('dynamic-image');
                img.src = post.image;
                img.alt = post.imageAlt;
                document.getElementById('dynamic-caption').innerText = post.imageCaption;

                const urlAtual = window.location.href;
                const htmlShare = gerarBotoesShare(post.title, urlAtual);
                const socialArea = document.getElementById('social-area');
                if (socialArea) {
                    socialArea.innerHTML = htmlShare;
                }
                carregarDisqus(post.id, post.title);

                const prevContainer = document.getElementById('nav-prev-area');
                const nextContainer = document.getElementById('nav-next-area');
                prevContainer.innerHTML = '';
                nextContainer.innerHTML = '';
                const nextPost = postsData[postIndex - 1]; 
                const prevPost = postsData[postIndex + 1]; 
                if (prevPost) prevContainer.innerHTML = `<a href="#post-${prevPost.id}" class="nav-item nav-prev"><span class="nav-label">&larr; anterior</span><div class="nav-thumb-wrapper"><img src="${prevPost.image}"></div><span class="nav-title">${prevPost.title}</span></a>`;
                if (nextPost) nextContainer.innerHTML = `<a href="#post-${nextPost.id}" class="nav-item nav-next"><span class="nav-label">próximo &rarr;</span><div class="nav-thumb-wrapper"><img src="${nextPost.image}"></div><span class="nav-title">${nextPost.title}</span></a>`;

                const postView = document.getElementById('post-view');
                postView.style.display = 'block';
                postView.classList.add('animacao-entrada');
            }
        } 
        // --- ROTA FEED GERAL ---
        else if (hash === '#textos') {
            const secaoTextos = document.getElementById('textos');
            if(secaoTextos) {
                secaoTextos.style.display = 'block';
                secaoTextos.classList.add('animacao-entrada');
                renderizarListaPosts(null); 
            }
        }
        // --- ROTA CATEGORIAS ---
        else if (hash.startsWith('#cat-')) {
            const secaoTextos = document.getElementById('textos');
            if(secaoTextos) {
                secaoTextos.style.display = 'block';
                secaoTextos.classList.add('animacao-entrada');
                let categoriaNome = '';
                if (hash === '#cat-ensaios') categoriaNome = 'ensaios e provocações';
                else if (hash === '#cat-conversas') categoriaNome = 'conversas';
                renderizarListaPosts(categoriaNome); 
            }
        }
        // --- OUTRAS SEÇÕES ---
        else {
            const secaoAtiva = document.querySelector(hash);
            if (secaoAtiva) {
                secaoAtiva.style.display = 'block';
                secaoAtiva.classList.add('animacao-entrada');
            }
        }

        // Menu Ativo
        linksMenu.forEach(link => {
            link.classList.remove('link-ativo');
            if (link.getAttribute('href') === hash) link.classList.add('link-ativo');
        });
    }

    roteador();
    window.addEventListener('hashchange', roteador);

    // --- 7. Modal de Zoom (CORRIGIDO PARA FLEXBOX e CLIQUE GLOBAL) ---
    const imgPerfil = document.getElementById("foto-perfil");
    const modal = document.getElementById("modal-foto");
    const modalImg = document.getElementById("img-ampliada");
    const span = document.getElementsByClassName("fechar-modal")[0];

    if (imgPerfil && modal) {
        imgPerfil.onclick = function() {
            // Usa FLEX para centralizar com o novo CSS
            modal.style.display = "flex"; 
            modalImg.src = this.src;
            modalImg.classList.add('zoom-animacao');
        }
    }
    
    // Fechar ao clicar no X
    if (span) span.onclick = function() { modal.style.display = "none"; }
    
    // Fechar ao clicar em QUALQUER lugar do modal (fundo ou imagem)
    if (modal) modal.onclick = function() { modal.style.display = "none"; }

    // --- 8. Menu Hamburguer (Mobile) ---
    const menuBtn = document.getElementById('menu-btn');
    const menuLista = document.getElementById('menu-lista');
    const linksMenuMobile = document.querySelectorAll('.links-internos a');

    if (menuBtn && menuLista) {
        menuBtn.addEventListener('click', () => {
            menuLista.classList.toggle('menu-aberto');
            menuBtn.classList.toggle('ativo');
        });

        linksMenuMobile.forEach(link => {
            link.addEventListener('click', () => {
                menuLista.classList.remove('menu-aberto');
                menuBtn.classList.remove('ativo');
            });
        });

        window.addEventListener('scroll', () => {
            if(menuLista.classList.contains('menu-aberto')) {
                menuLista.classList.remove('menu-aberto');
                menuBtn.classList.remove('ativo');
            }
        });
    }

    // --- 9. Botão Voltar ---
    const botoesVoltar = document.querySelectorAll('.seta-voltar');
    botoesVoltar.forEach(botao => {
        botao.addEventListener('click', function(e) {
            e.preventDefault();
            window.history.back();
        });
    });
    
    // --- 10. Barra de Progresso ---
    window.onscroll = function() {
        atualizarBarraProgresso();
    };

    function atualizarBarraProgresso() {
        var winScroll = document.body.scrollTop || document.documentElement.scrollTop;
        var height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        var scrolled = (winScroll / height) * 100;
        document.getElementById("barra-leitura").style.height = scrolled + "%";
    }

});
