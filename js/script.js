document.addEventListener('DOMContentLoaded', () => {

    // alerta de confirmação de email do supabase
    if (window.location.hash.includes('type=signup') || window.location.hash.includes('access_token')) {
        alert('e-mail confirmado com sucesso! você já pode entrar.');
        window.history.replaceState(null, null, window.location.pathname);
    }

    // --- 1. lógica do tema (dark/light) ---
    const toggleCheckboxes = document.querySelectorAll('.theme-toggle-input');
    const temaSalvo = localStorage.getItem('theme');
    
    const setTema = (isLight) => {
        document.body.classList.toggle('light-mode', isLight);
        localStorage.setItem('theme', isLight ? 'light' : 'dark');
        toggleCheckboxes.forEach(box => box.checked = !isLight);
    };

    if (temaSalvo === 'light') setTema(true);
    else setTema(false);

    toggleCheckboxes.forEach(box => {
        box.addEventListener('change', () => setTema(!box.checked));
    });

    // --- 2. auxiliar de agendamento ---
    function converterDataParaComparacao(dataStr) {
        const meses = { jan: 0, fev: 1, mar: 2, abr: 3, mai: 4, jun: 5, jul: 6, ago: 7, set: 8, out: 9, nov: 10, dez: 11 };
        const partes = dataStr.split(' ');
        if (partes.length < 3) return new Date(); 
        return new Date(partes[2], meses[partes[1]], partes[0]);
    }

    // --- 3. função de renderização (lista de posts) ---
    function renderizarListaPosts(filtroCategoria = null, postsForcados = null, filtroAutor = null, targetId = 'textos-lista') {
        const feedContainer = document.getElementById(targetId);
        const tituloSecao = document.querySelector('#textos h2'); 
        const areaLeitura = document.querySelector('.area-leitura');

        if (!feedContainer || typeof postsData === 'undefined') return;

        feedContainer.innerHTML = '';
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0); 

        const postsPublicados = postsData.filter(post => converterDataParaComparacao(post.date) <= hoje);
        let postsParaExibir = [];
        let modoVisualizacao = ''; 
        
        if (postsForcados) {
            postsParaExibir = postsForcados.filter(post => converterDataParaComparacao(post.date) <= hoje);
            modoVisualizacao = 'grid';
            feedContainer.className = 'feed-grid';
            if(areaLeitura && targetId === 'textos-lista') areaLeitura.classList.add('largura-expandida');
        
        } else if (filtroCategoria && filtroAutor) {
            // Micro-Caminhos do Autor (Crescente)
            postsParaExibir = postsPublicados.filter(post => post.category === filtroCategoria && post.author.toLowerCase() === filtroAutor.toLowerCase()).reverse();
            modoVisualizacao = 'lista';
            feedContainer.className = 'feed-list';
        
        } else if (filtroCategoria) {
            // Caminhos Globais (Crescente)
            postsParaExibir = postsPublicados.filter(post => post.category === filtroCategoria).reverse();
            modoVisualizacao = 'lista';
            feedContainer.className = 'feed-list';
            if(areaLeitura && targetId === 'textos-lista') areaLeitura.classList.remove('largura-expandida');
            if(tituloSecao && targetId === 'textos-lista') tituloSecao.innerText = filtroCategoria; 
        
        } else if (filtroAutor) {
            postsParaExibir = postsPublicados.filter(post => post.author.toLowerCase() === filtroAutor.toLowerCase());
            modoVisualizacao = 'lista';
            feedContainer.className = 'feed-list';
        
        } else {
            // Textos Globais (Decrescente)
            postsParaExibir = postsPublicados;
            modoVisualizacao = 'grid';
            feedContainer.className = 'feed-grid';
            if(areaLeitura && targetId === 'textos-lista') areaLeitura.classList.add('largura-expandida');
            if(tituloSecao && targetId === 'textos-lista') tituloSecao.innerText = 'textos';
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
                    const textOnly = tempDiv.textContent || tempDiv.innerText || "";
                    const resumo = textOnly.substring(0, 120) + "...";

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
            feedContainer.innerHTML = '<p style="text-align:center; margin-top:30px; opacity: 0.6; font-family:Courier New;">nenhum texto encontrado...</p>';
        }
    }

    // --- renderização da lista de autores ---
    function renderizarListaAutoras() {
        const container = document.getElementById('lista-autoras');
        if (!container || typeof authorsData === 'undefined') return;
        
        container.innerHTML = '';
        container.className = 'lista-simples';
        
        authorsData.forEach(autor => {
            const link = document.createElement('a');
            link.href = `#autor-${autor.id}`; 
            link.className = 'item-lista animacao-entrada';
            
            link.innerHTML = `
                <span>${autor.nome}</span>
                <span style="color: var(--accent-color);">${autor.papel}</span>
            `;
            
            container.appendChild(link);
        });
    }

    // --- renderização do perfil do autor individual ---
    function renderizarPerfilAutor(autorId, catSufix = null) {
        const secaoPerfil = document.getElementById('perfil-autor');
        if (!secaoPerfil || typeof authorsData === 'undefined') return;

        const autor = authorsData.find(a => a.id === autorId);
        if (!autor) { window.location.hash = '#autores'; return; }

        const tituloPagina = autor.id === 'du' ? 'sobre' : autor.nome;
        
        secaoPerfil.style.display = 'block';
        secaoPerfil.classList.add('animacao-entrada');

        // Se houver sufixo de categoria, limpamos a bio para mostrar só a lista (comportamento de "nova página")
        if (catSufix) {
            let catName = (catSufix === 'ensaios') ? 'ensaios e provocações' : 
                          (catSufix === 'conversas') ? 'conversas' : 
                          (catSufix === 'poesias') ? 'poesia e música' : '';
            
            document.title = `${catName} | ${autor.nome}`;

            secaoPerfil.innerHTML = `
                <div class="titulo-com-voltar">
                    <a href="#autor-${autor.id}" class="seta-voltar">&lt;</a>
                    <h2>${catName}</h2>
                </div>
                <div id="lista-textos-autor" class="feed-list"></div>
            `;
            renderizarListaPosts(catName, null, autor.id, 'lista-textos-autor');
            return; // Interrompe aqui para não carregar a bio abaixo
        }

        // Caso contrário, carrega o perfil completo (Bio + Menu de Caminhos)
        document.title = `${tituloPagina} | blog do du`;
        let legendaHtml = autor.legenda_foto ? `<span class="legenda-foto">${autor.legenda_foto}</span>` : '';
        let apoioHtml = autor.apoio ? autor.apoio : '';

        const hoje = new Date();
        hoje.setHours(0,0,0,0);
        const postsDoAutor = postsData.filter(p => p.author.toLowerCase() === autor.id.toLowerCase() && converterDataParaComparacao(p.date) <= hoje);
        const categoriasAtivas = [...new Set(postsDoAutor.map(p => p.category))];

        let caminhosHtml = '';
        categoriasAtivas.forEach(cat => {
            let catSlug = (cat === 'ensaios e provocações') ? 'ensaios' : 
                          (cat === 'conversas') ? 'conversas' : 
                          (cat === 'poesia e música') ? 'poesias' : 'outros';
            
            caminhosHtml += `<a href="#autor-${autor.id}/cat-${catSlug}" class="item-lista">
                                <span>${cat}</span> 
                                <span>&rarr;</span>
                             </a>`;
        });

        secaoPerfil.innerHTML = `
            <div class="titulo-com-voltar">
                <a href="#" class="seta-voltar" onclick="window.history.back(); return false;">&lt;</a>
                <h2>${tituloPagina}</h2>
            </div>

            <div class="sobre-container">
                <div class="sobre-foto">
                    <img src="${autor.foto}" alt="foto de ${autor.nome}" id="foto-perfil-${autor.id}" style="cursor: pointer;">
                    ${legendaHtml}
                </div>

                <div class="sobre-texto">
                    ${autor.bio}
                    ${apoioHtml}
                </div>
            </div>

            <br><br>
            <hr class="divisor-fino-longo" style="margin: 40px 0;">
            
            <div class="perfil-textos">
                <h3 style="margin-bottom: 30px; text-align: center;">caminhos de ${autor.nome}</h3>
                <div class="lista-simples">
                    ${caminhosHtml}
                </div>
            </div>
        `;

        const imgPerfilDynamic = document.getElementById(`foto-perfil-${autor.id}`);
        if (imgPerfilDynamic) {
            imgPerfilDynamic.onclick = function() {
                const modalFoto = document.getElementById("modal-foto");
                const modalImg = document.getElementById("img-ampliada");
                if (modalFoto && modalImg) {
                    modalFoto.style.display = "flex"; 
                    modalImg.src = this.src;
                }
            }
        }
    }

    // --- 4. lógica da busca ---
    const campoBusca = document.getElementById('campo-busca');
    if (campoBusca) {
        campoBusca.addEventListener('input', function(e) {
            const termo = e.target.value.toLowerCase();
            if (termo === '') { renderizarListaPosts(null); return; }
            const resultados = postsData.filter(post => {
                return post.title.toLowerCase().includes(termo) || post.content.toLowerCase().includes(termo);
            });
            renderizarListaPosts(null, resultados);
        });
    }

    // --- 5. compartilhamento ---
    function gerarBotoesShare(titulo, url) {
        const texto = encodeURIComponent(titulo);
        const link = encodeURIComponent(url);
        return `
            <div class="share-section">
                <p class="share-title">compartilhar essa idéia:</p>
                <div class="share-buttons">
                    <a href="https://api.whatsapp.com/send?text=${texto}%20${link}" target="_blank" class="btn-share">whatsapp</a>
                    <a href="https://twitter.com/intent/tweet?text=${texto}&url=${link}" target="_blank" class="btn-share">x / twitter</a>
                    <a href="https://www.facebook.com/sharer/sharer.php?u=${link}" target="_blank" class="btn-share">facebook</a>
                    <button class="btn-share" onclick="navigator.clipboard.writeText('${url}').then(() => alert('link copiado!'))">copiar link</button>
                </div>
            </div>`;
    }

    // --- 6. sistema autoral de interações (supabase) ---
    const supabaseUrl = 'https://ypfwdlkuxxhiqonyxshg.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlwZndkbGt1eHhoaXFvbnl4c2hnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc4NTQ2MzQsImV4cCI6MjA5MzQzMDYzNH0.mfCDB7r9ELvkqjQyWSzI4kG3oY31ro5xdw3WnxijG0M';
    const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

    let currentUser = null;
    let currentProfile = null;
    let postIdAtual = null;
    let comentarioPaiAtual = null; 

    function formatarDataAutoral(dataString) {
        const data = new Date(dataString);
        const ano = data.getFullYear();
        const meses = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
        return `${ano}.${meses[data.getMonth()]}.${String(data.getDate()).padStart(2, '0')} - ${String(data.getHours()).padStart(2, '0')}h${String(data.getMinutes()).padStart(2, '0')}`;
    }

    async function verificarSessao() {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
            currentUser = session.user;
            const { data } = await supabase.from('profiles').select('*').eq('id', currentUser.id).single();
            currentProfile = data;
            document.getElementById('auth-status-text').innerText = `logado como @${currentProfile?.username || 'leitor'} | sair`;
        } else {
            currentUser = null;
            currentProfile = null;
            document.getElementById('auth-status-text').innerText = 'cadastrar-se / entrar';
        }
    }

    const modalAuth = document.getElementById('modal-auth');
    const formAuth = document.getElementById('form-auth');
    const toggleAuthMode = document.getElementById('toggle-auth-mode');
    const authTitulo = document.getElementById('auth-titulo');
    let isLoginMode = true;

    function abrirModalAuth() { modalAuth.style.display = 'flex'; }
    document.querySelector('.fechar-modal-auth')?.addEventListener('click', () => modalAuth.style.display = 'none');
    
    document.querySelectorAll('.toggle-senha').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const input = e.target.previousElementSibling;
            if (input.type === 'password') {
                input.type = 'text';
                e.target.innerText = 'ocultar';
            } else {
                input.type = 'password';
                e.target.innerText = 'ver';
            }
        });
    });

    document.getElementById('auth-status-text')?.addEventListener('click', async () => {
        if (currentUser) {
            await supabase.auth.signOut();
            verificarSessao();
            carregarLikes();
        } else abrirModalAuth();
    });

    toggleAuthMode?.addEventListener('click', () => {
        isLoginMode = !isLoginMode;
        authTitulo.innerText = isLoginMode ? 'entrar' : 'cadastrar-se';
        toggleAuthMode.innerText = isLoginMode ? 'não tem conta? cadastrar-se.' : 'já tem conta? entrar.';
        
        const extras = document.querySelectorAll('.auth-cadastro-extra');
        extras.forEach(el => {
            if (isLoginMode) {
                el.classList.add('hidden');
                el.removeAttribute('required');
            } else {
                el.classList.remove('hidden');
                el.setAttribute('required', 'required');
            }
        });
    });

    document.getElementById('auth-username')?.addEventListener('input', (e) => {
        e.target.value = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '');
    });

    formAuth?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('auth-email').value;
        const password = document.getElementById('auth-senha').value;
        const btnSubmit = document.getElementById('btn-auth-submit');

        if (isLoginMode) {
            btnSubmit.innerText = 'entrando...';
            const { error } = await supabase.auth.signInWithPassword({ email, password });
            btnSubmit.innerText = 'confirmar';
            
            if (error) alert('e-mail ou senha incorretos.');
            else { modalAuth.style.display = 'none'; iniciarInteracoes(postIdAtual); }
        } else {
            const confirmPassword = document.getElementById('auth-senha-confirma').value;
            const username = document.getElementById('auth-username').value;
            
            if (password !== confirmPassword) {
                alert('as senhas não coincidem.');
                return;
            }

            btnSubmit.innerText = 'cadastrando...';
            const { data, error } = await supabase.auth.signUp({ 
                email, 
                password,
                options: { data: { username: username } }
            });
            btnSubmit.innerText = 'confirmar';

            if (error) {
                alert('erro ao cadastrar: ' + error.message);
            } else {
                alert('cadastro realizado! verifique seu e-mail para confirmar a conta antes de entrar.');
                modalAuth.style.display = 'none';
            }
        }
    });

    function gerenciarEstados() {
        if (!currentUser) { abrirModalAuth(); return false; }
        return true;
    }

    const btnLike = document.getElementById('btn-like');
    btnLike?.addEventListener('click', async () => {
        if (!gerenciarEstados()) return;
        if (btnLike.innerText === '♡') {
            btnLike.innerText = '♥';
            btnLike.classList.add('curtido');
            await supabase.from('likes').insert([{ post_id: postIdAtual, user_id: currentUser.id }]);
        } else {
            btnLike.innerText = '♡';
            btnLike.classList.remove('curtido');
            await supabase.from('likes').delete().match({ post_id: postIdAtual, user_id: currentUser.id });
        }
        carregarLikes();
    });

    async function carregarLikes() {
        const { count } = await supabase.from('likes').select('*', { count: 'exact', head: true }).eq('post_id', postIdAtual);
        document.getElementById('like-count').innerText = count || 0;

        if (currentUser) {
            const { data } = await supabase.from('likes').select('*').match({ post_id: postIdAtual, user_id: currentUser.id });
            if (data && data.length > 0) {
                btnLike.innerText = '♥';
                btnLike.classList.add('curtido');
            } else {
                btnLike.innerText = '♡';
                btnLike.classList.remove('curtido');
            }
        }
    }

    const inputComentario = document.getElementById('comentario-input');
    const grupoBotoes = document.getElementById('grupo-botoes-comentario');
    const btnIniciarEnvio = document.getElementById('btn-iniciar-envio');
    const btnCancelarEnvio = document.getElementById('btn-cancelar-envio');
    const btnConfirmarEnvio = document.getElementById('btn-confirmar-envio');
    const separadorBotoes = document.getElementById('separador-botoes');

    inputComentario?.addEventListener('click', (e) => {
        if (!gerenciarEstados()) { e.preventDefault(); inputComentario.blur(); }
    });

    inputComentario?.addEventListener('input', () => {
        if (inputComentario.value.trim() !== '') {
            grupoBotoes.classList.remove('hidden');
            btnIniciarEnvio.classList.remove('hidden');
            btnCancelarEnvio.classList.add('hidden');
            btnConfirmarEnvio.classList.add('hidden');
            separadorBotoes.classList.add('hidden');
        } else {
            grupoBotoes.classList.add('hidden');
            comentarioPaiAtual = null; 
            inputComentario.placeholder = 'escreva seu comentário...';
        }
    });

    btnIniciarEnvio?.addEventListener('click', () => {
        btnIniciarEnvio.classList.add('hidden');
        btnCancelarEnvio.classList.remove('hidden');
        btnConfirmarEnvio.classList.remove('hidden');
        separadorBotoes.classList.remove('hidden');
    });

    btnCancelarEnvio?.addEventListener('click', () => {
        btnIniciarEnvio.classList.remove('hidden');
        btnCancelarEnvio.classList.add('hidden');
        btnConfirmarEnvio.classList.add('hidden');
        separadorBotoes.classList.add('hidden');
        
        comentarioPaiAtual = null;
        inputComentario.placeholder = 'escreva seu comentário...';
        inputComentario.focus();
    });

    btnConfirmarEnvio?.addEventListener('click', async () => {
        if (!gerenciarEstados()) return;
        const conteudo = inputComentario.value.trim();
        if (conteudo === '') return;

        document.getElementById('msg-erro').innerText = 'enviando...';
        
        await supabase.from('comments').insert([{ 
            post_id: postIdAtual, 
            user_id: currentUser.id, 
            content: conteudo,
            parent_id: comentarioPaiAtual 
        }]);
        
        inputComentario.value = '';
        inputComentario.placeholder = 'escreva seu comentário...';
        comentarioPaiAtual = null;
        grupoBotoes.classList.add('hidden');
        document.getElementById('msg-erro').innerText = '';
        carregarComentarios();
    });

    async function carregarComentarios() {
        const lista = document.getElementById('lista-comentarios');
        lista.innerHTML = '<span class="msg-discreta">carregando ideias...</span>';

        const { data: comentarios } = await supabase
            .from('comments')
            .select('*, profiles(username, is_moderator)')
            .eq('post_id', postIdAtual)
            .order('created_at', { ascending: true });

        lista.innerHTML = '';
        
        if(comentarios) {
            comentarios.forEach(c => {
                const div = document.createElement('div');
                div.className = c.parent_id ? 'comentario-item comentario-resposta' : 'comentario-item';
                
                const prefixo = c.parent_id ? ' - ' : '';
                const dataFormatada = formatarDataAutoral(c.created_at);
                const username = c.profiles?.username || 'anonimo';
                
                const p = document.createElement('p');
                p.innerHTML = `${prefixo}<span class="comentario-data">${dataFormatada}</span> <span class="comentario-username">@${username}</span> : ${c.content.replace(/</g, "&lt;").replace(/>/g, "&gt;")}`;
                
                const acoes = document.createElement('div');
                acoes.className = 'comentario-acoes';
                
                const spanResponder = document.createElement('span');
                spanResponder.innerText = 'responder';
                
                spanResponder.onclick = () => {
                    if (!gerenciarEstados()) return;
                    comentarioPaiAtual = c.parent_id ? c.parent_id : c.id; 
                    inputComentario.placeholder = `respondendo a @${username}...`;
                    inputComentario.focus();
                };

                acoes.appendChild(spanResponder);

                if (currentUser && (currentUser.id === c.user_id || currentProfile?.is_moderator)) {
                    const spanApagar = document.createElement('span');
                    spanApagar.innerText = 'apagar';
                    spanApagar.onclick = async () => {
                        await supabase.from('comments').delete().eq('id', c.id);
                        carregarComentarios();
                    };
                    acoes.appendChild(spanApagar);
                }

                div.appendChild(p);
                div.appendChild(acoes);
                lista.appendChild(div);
            });
        }
    }

    async function iniciarInteracoes(postId) {
        postIdAtual = postId;
        await verificarSessao();
        carregarLikes();
        carregarComentarios();
    }


    // --- 7. sistema de roteamento ---
    function roteador() {
        window.scrollTo(0, 0);
        const barraLeitura = document.getElementById("barra-leitura");
        if(barraLeitura) barraLeitura.style.height = "0%";

        document.title = "blog do du | letras, arte e vida";
        
        let hash = window.location.hash;
        if (hash === '#sobre') hash = '#autor-du';

        const capa = document.getElementById('capa');
        const conteudo = document.getElementById('conteudo');
        const todasSecoes = document.querySelectorAll('.secao-conteudo');
        const linksMenu = document.querySelectorAll('.links-internos a');
        const navGlobal = document.getElementById('navegacao-global');
        
        if(campoBusca) campoBusca.value = '';
        const areaLeitura = document.querySelector('.area-leitura');
        if(areaLeitura) areaLeitura.classList.remove('largura-expandida');

        const containerBusca = document.querySelector('.container-busca');
        if(containerBusca) containerBusca.style.display = (hash === '#textos' || hash === '') ? 'block' : 'none';

        const modal = document.getElementById("modal-foto");
        if (modal && modal.style.display === "flex") modal.style.display = "none";

        if (!capa || !conteudo) return;

        if (!hash || hash === '#' || hash === '') {
            conteudo.classList.add('hidden');
            capa.style.display = 'flex';
            if(navGlobal) navGlobal.classList.add('ocultar-desktop');
            linksMenu.forEach(link => link.classList.remove('link-ativo'));
            return;
        }

        capa.style.display = 'none';
        conteudo.classList.remove('hidden');
        if(navGlobal) navGlobal.classList.remove('ocultar-desktop');
        todasSecoes.forEach(secao => secao.style.display = 'none');

        if (hash.startsWith('#post-')) {
            const postId = hash.replace('#post-', '');
            const post = postsData.find(p => p.id === postId);
            const hoje = new Date();
            hoje.setHours(0,0,0,0);

            if (post && converterDataParaComparacao(post.date) <= hoje) {
                
                document.title = `${post.title.toLowerCase()} | blog do du`;

                const tempDiv = document.createElement("div");
                tempDiv.innerHTML = post.content;
                const textOnly = tempDiv.textContent || tempDiv.innerText || "";
                const resumoLimpo = textOnly.substring(0, 150).trim() + "...";

                let metaDescription = document.querySelector('meta[name="description"]');
                if (!metaDescription) {
                    metaDescription = document.createElement('meta');
                    metaDescription.name = "description";
                    document.head.appendChild(metaDescription);
                }
                metaDescription.content = resumoLimpo;

                document.getElementById('dynamic-title').innerText = post.title;
                document.getElementById('dynamic-date').innerText = post.date;
                document.getElementById('dynamic-time').innerText = post.readingTime;
                
                const catLink = document.getElementById('dynamic-cat');
                catLink.innerText = post.category;
                catLink.href = (post.category === "ensaios e provocações") ? "#cat-ensaios" : 
                               (post.category === "conversas") ? "#cat-conversas" : 
                               (post.category === "poesia e música") ? "#cat-poesias" : "#";

                const authLink = document.getElementById('dynamic-author');
                authLink.innerText = post.author;
                authLink.href = `#autor-${post.author.toLowerCase()}`;
                document.getElementById('dynamic-content').innerHTML = post.content;
                
                const img = document.getElementById('dynamic-image');
                img.src = post.image;
                img.alt = post.imageAlt;
                document.getElementById('dynamic-caption').innerText = post.imageCaption;

                const socialArea = document.getElementById('social-area');
                if(socialArea) {
                    socialArea.innerHTML = gerarBotoesShare(post.title, window.location.href);
                }
                
                iniciarInteracoes(post.id);

                const prevContainer = document.getElementById('nav-prev-area');
                const nextContainer = document.getElementById('nav-next-area');
                prevContainer.innerHTML = '';
                nextContainer.innerHTML = '';

                const postsPublicados = postsData.filter(p => converterDataParaComparacao(p.date) <= hoje);
                const currentIdxInPublicados = postsPublicados.findIndex(p => p.id === postId);
                const nextPost = postsPublicados[currentIdxInPublicados - 1]; 
                const prevPost = postsPublicados[currentIdxInPublicados + 1]; 

                if (prevPost) prevContainer.innerHTML = `<a href="#post-${prevPost.id}" class="nav-item nav-prev"><span class="nav-label">&larr; anterior</span><div class="nav-thumb-wrapper"><img src="${prevPost.image}"></div><span class="nav-title">${prevPost.title}</span></a>`;
                if (nextPost) nextContainer.innerHTML = `<a href="#post-${nextPost.id}" class="nav-item nav-next"><span class="nav-label">próximo &rarr;</span><div class="nav-thumb-wrapper"><img src="${nextPost.image}"></div><span class="nav-title">${nextPost.title}</span></a>`;

                const postView = document.getElementById('post-view');
                postView.style.display = 'block';
                postView.classList.add('animacao-entrada');
            } else {
                window.location.hash = '#textos';
            }
        } 
        else if (hash === '#textos') {
            const secaoTextos = document.getElementById('textos');
            if(secaoTextos) {
                secaoTextos.style.display = 'block';
                secaoTextos.classList.add('animacao-entrada');
                renderizarListaPosts(null); 
            }
        }
        else if (hash.startsWith('#cat-')) {
            const secaoTextos = document.getElementById('textos');
            if(secaoTextos) {
                secaoTextos.style.display = 'block';
                secaoTextos.classList.add('animacao-entrada');
                let cat = (hash === '#cat-ensaios') ? 'ensaios e provocações' : 
                          (hash === '#cat-conversas') ? 'conversas' : 
                          (hash === '#cat-poesias') ? 'poesia e música' : '';
                renderizarListaPosts(cat); 
            }
        }
        else if (hash === '#autores') {
            const secaoAutoras = document.getElementById('autores');
            if(secaoAutoras) {
                secaoAutoras.style.display = 'block';
                secaoAutoras.classList.add('animacao-entrada');
                renderizarListaAutoras();
            }
        }
        else if (hash.startsWith('#autor-')) {
            const path = hash.replace('#autor-', ''); 
            const parts = path.split('/cat-');
            const autorId = parts[0];
            const catSufix = parts[1] || null;

            renderizarPerfilAutor(autorId, catSufix);
        }
        else {
            const secaoAtiva = document.querySelector(hash);
            if (secaoAtiva) {
                secaoAtiva.style.display = 'block';
                secaoAtiva.classList.add('animacao-entrada');
            }
        }

        linksMenu.forEach(link => {
            if (link.getAttribute('href') === '#sobre' && hash.startsWith('#autor-du')) {
                link.classList.add('link-ativo');
            } else {
                link.classList.toggle('link-ativo', link.getAttribute('href') === hash);
            }
        });
    }

    window.addEventListener('hashchange', roteador);
    roteador();

    // --- 8. zoom foto de perfil ---
    const imgPerfil = document.getElementById("foto-perfil");
    const modalFoto = document.getElementById("modal-foto");
    const modalImg = document.getElementById("img-ampliada");
    if (imgPerfil && modalFoto) {
        imgPerfil.onclick = function() {
            modalFoto.style.display = "flex"; 
            modalImg.src = this.src;
        }
        modalFoto.onclick = function() { modalFoto.style.display = "none"; }
    }

    // --- 9. menu hamburguer ---
    const menuBtn = document.getElementById('menu-btn');
    const menuLista = document.getElementById('menu-lista');
    if (menuBtn && menuLista) {
        menuBtn.addEventListener('click', () => {
            menuLista.classList.toggle('menu-aberto');
            menuBtn.classList.toggle('ativo');
        });
        document.querySelectorAll('.links-internos a').forEach(link => {
            link.addEventListener('click', () => {
                menuLista.classList.remove('menu-aberto');
                menuBtn.classList.remove('ativo');
            });
        });
    }

    // --- 10. botão voltar ---
    document.querySelectorAll('.seta-voltar').forEach(botao => {
        botao.addEventListener('click', (e) => {
            e.preventDefault();
            window.history.back();
        });
    });
    
    // --- 11. barra de progresso ---
    window.addEventListener('scroll', () => {
        var winScroll = document.body.scrollTop || document.documentElement.scrollTop;
        var height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        var scrolled = (winScroll / height) * 100;
        const barra = document.getElementById("barra-leitura");
        if(barra) barra.style.height = scrolled + "%";
    });
});
