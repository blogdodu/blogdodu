/* ......... área base: funcionalidades gerais e automações ......... */

// ......... lógica para capturar o redirecionamento do 404.html .........
(function()
	{
		var p = new URLSearchParams(window.location.search).get('p');
		if (p !== null)
		{
			window.history.replaceState
			(null, null, 
				window.location.pathname.slice(0, -1) + (p || '') +
				window.location.hash
    		);
  		}
	}
)
();



// ......... função: tratar links antigos (compatibilidade v1.0 -> v2.0)
const tratarLinksLegados = () =>
{
	const hash = window.location.hash; // pega o que vem depois do #

	// verifica se o link começa com #post-
	if (hash && hash.startsWith('#post-'))
	{
		// extrai o ID (remove o '#post-')
		constpostId = hash.replace('#post-', '');
        
		// redireciona para a nova estrutura de URL
		const novaUrl = `/post/${postId}`;
        
		// atualiza a URL no navegador sem recarregar a página e chama o roteador
		history.replaceState(null, null, novaUrl);
		rotear();
	}
};

// chame a função assim que o script carregar
tratarLinksLegados();




// ......... função: barra de progresso de leitura
window.addEventListener
('scroll', () =>
	{
		const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
		const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
		const scrolled = (winScroll / height) * 100;

		const barra = document.getElementById("barra-leitura-progresso");
		if (barra) barra.style.height = scrolled + "%";
	}
);




// ......... função: seletor de modo claro/escuro
const togglesTema = document.querySelectorAll
('.theme-toggle-input');

const setTema = (isLight) =>
{
	document.body.classList.toggle('light-mode', isLight);
	localStorage.setItem('theme', isLight ? 'light' : 'dark');
	togglesTema.forEach(t => t.checked = !isLight);
};

const temaSalvo = localStorage.getItem
('theme');

setTema(temaSalvo === 'light');

togglesTema.forEach
(t =>
	{
		t.addEventListener
		('change', () =>
			{
				setTema(!t.checked);
			}
		);
	}
);




// ......... função ajudante: limpa acentos e espaços para criar URLs amigáveis
const criarSlug = (texto) =>
{
	return texto.toLowerCase().trim()
	.normalize("NFD").replace(/[\u0300-\u036f]/g, "") // remove os acentos (ç vira c, ã vira a)
	.replace(/\s+/g, '-'); // troca os espaços por hífens
};




// ......... função ajudante: filtra os posts, bloqueando os do futuro (formato: 2026.mai.11)
const obterPostsPublicados = () => 
{
	if (typeof postsData === 'undefined') return [];
    
	const hoje = new Date();
	hoje.setHours(0, 0, 0, 0); // zera o relógio para comparar só o dia

	// mapa de tradução dos meses
	const meses =
	{
		jan: 0, feb: 1, mar: 2, abr: 3, mai: 4, jun: 5, jul: 6, ago: 7, set: 8, out: 9, nov: 10, dez: 11
	};

	return postsData.filter
	(post =>
		{
			if (!post.date) return false;
			
			// separa 2026.mai.11 em partes
			const partes = post.date.split('.'); 
			if (partes.length === 3)
			{
				const ano = parseInt(partes[0]);
				const mesTexto = partes[1].toLowerCase();
				const dia = parseInt(partes[2]);
				
				const mesIndex = meses[mesTexto];
				
				if (mesIndex !== undefined)
				{
					const dataDoPost = new Date(ano, mesIndex, dia);
					return dataDoPost <= hoje; 
				}
			}
			return true; // se a data estiver estranha, mostra por segurança
		}
	);
};




// ......... função: renderizar a grade geral de textos (com busca)
const renderizarGradeTextos = (filtroBusca = '') =>
{
	const container = document.getElementById('grade-de-textos');
	const postsValidos = obterPostsPublicados(); 
	if (!container || postsValidos.length === 0) return;

	container.innerHTML = '';
	// ajudante interno: limpa acentos, maiúsculas e tags HTML para garantir a busca
	const normalizarParaBusca = (texto) =>
	{
		if (!texto) return '';
		// remove tags HTML e converte para minúsculas sem acentos
		return texto.replace(/<[^>]*>/g, ' ')
		.toLowerCase()
		.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
	};

	const termoBusca = normalizarParaBusca(filtroBusca).trim();

	// filtra os textos
	const postsFiltrados = postsValidos.filter
	(post =>
		{
			if (!termoBusca) return true; // se a busca estiver vazia, mostra todos
        
			// normaliza os campos do arquivo posts.js antes de comparar
			const titulo = normalizarParaBusca(post.title);
			const categoria = normalizarParaBusca(post.category);
			const autor = normalizarParaBusca(post.author);
			const conteudo = normalizarParaBusca(post.content);

			// verifica se a palavra digitada está "escondida" em algum desses lugares
			return titulo.includes(termoBusca) ||
			categoria.includes(termoBusca) ||
			autor.includes(termoBusca) ||
			conteudo.includes(termoBusca);
		}
	);

	if (postsFiltrados.length === 0)
	{
	// aviso caso não encontre (centralizado na grade)
	container.innerHTML = '<p style="grid-column: 1 / -1; text-align: center; color: var(--cor-acento); margin-top: 50px;">nenhum texto encontrado para essa busca.....</p>';
	return;
}

	// monta os cards
	postsFiltrados.forEach
	(post =>
		{
			const link = document.createElement('a');
			link.href = `/post/${post.id}`;
			link.className = 'card-texto';
			link.setAttribute('data-link', '');

			link.innerHTML =
			`
				<div class="container-img-card">
					<img src="${post.image}" alt="capa do post" class="card-img">
				</div>

				<span class="card-meta">
					${post.date}
				</span>

				<h3 class="card-titulo">
					${post.title}
				</h3>

				<div class="card-rodape">
					<span class="card-autor">
						${post.author} • ${post.readingTime}
					</span>
				</div>
			`;

			// o card inteiro é um grande link
			link.onclick = (e) =>
			{
				e.preventDefault();
				history.pushState(null, null, link.href);
				rotear();
				window.scrollTo({ top: 0, behavior: 'smooth' });
			};
			container.appendChild(link);
		}
	);
};

// liga o campo de busca à função de cima
const campoBusca = document.getElementById('campo-busca');
if (campoBusca)
{
	campoBusca.addEventListener
	('input', (e) =>
		{
			renderizarGradeTextos(e.target.value);
		}
	);
}




// ......... função: motor de renderização de autoras(es)
const renderizarPerfilAuthor = (idBusca, tituloForcado = null) =>
{
	const container = document.getElementById('conteudo-perfil-author');
	const elementoTitulo = document.getElementById('titulo-author');

	if (!container || typeof authorsData === 'undefined') return;

	const author = authorsData.find(a => a.id === idBusca);

	if (author)
	{
		if (elementoTitulo) elementoTitulo.innerText = tituloForcado || author.nome;
        
		// 1. Monta a parte principal do perfil (A Bio e o Apoio)
		let htmlPerfil =
		`
			<div class="sobre-container">
				<div class="sobre-foto">
					<img src="${author.foto}" alt="foto de ${author.nome}" id="foto-perfil-clicavel">
					<span class="legenda-foto">
						${author.legenda_foto}
					</span>
				</div>
				<div class="sobre-texto">
					${author.bio}
					${author.apoio}
				</div>
			</div>
		`;

		// 2. Lógica para puxar os "caminhos" específicos desse autor
		// Filtra os posts onde o slug do autor bate com o ID que estamos acessando
		const postsDoAutor = postsData.filter(p => criarSlug(p.author) === author.id);

		if (postsDoAutor.length > 0)
		{
			const categoriasDoAutor = new Set();
			const listaCategoriasAutor = [];

			// Extrai as categorias únicas apenas dos posts desse autor
			postsDoAutor.forEach
			(post =>
				{
					if (!categoriasDoAutor.has(post.category))
					{
						categoriasDoAutor.add(post.category);
						listaCategoriasAutor.push
						(
							{
								nome: post.category,
								slug: criarSlug(post.category)
							}
						);
					}
				}
			);

			// Constrói o HTML da lista com o visual do print
			htmlPerfil +=
			`
				<hr class="divisor-fino-longo" style="margin-top: 60px;">
				<h3 style="text-align: center; margin-bottom: 30px; font-family: 'Courier Prime', monospace; font-size: 1rem; color: var(--cor-txt);"><strong>${author.nome} - textos</strong></h3>
				<div class="lista-simples">
			`;

			listaCategoriasAutor.forEach
			(cat =>
				{
					htmlPerfil +=
					`
						<a href="/authors/${author.id}/ways/${cat.slug}" class="item-lista link-autor-caminho">
							<span>
								${cat.nome}
							</span>
							<span style="color: var(--cor-acento);">&rarr;</span>
						</a>
					`;
				}
			);

			htmlPerfil += `</div>`;
		}

		// Injeta tudo na tela
		container.innerHTML = htmlPerfil;

		// 3. Ativa as interações (Modal de foto)
		const imgPerfil = document.getElementById('foto-perfil-clicavel');
		const modalFoto = document.getElementById('modal-foto');
		const modalImg = document.getElementById('img-ampliada');

		if (imgPerfil && modalFoto && modalImg)
		{
			imgPerfil.onclick = () =>
			{
				modalFoto.style.display = "flex"; 
				modalImg.src = imgPerfil.src;
			};
		}

		if (modalFoto)
		{
			modalFoto.onclick = () => modalFoto.style.display = "none";
		}

		// 4. Ensina os novos links da lista a usarem o roteador (SPA)
		container.querySelectorAll('.link-autor-caminho').forEach
		(link =>
			{
				link.onclick = (e) =>
				{
					e.preventDefault();
					history.pushState(null, null, link.href);
					rotear();
					window.scrollTo({ top: 0, behavior: 'smooth' });
				};
			}
		);
	}
};




// ......... função: renderizar lista de categorias (caminhos)
const renderizarCaminhos = () =>
{
	const container = document.getElementById('lista-caminhos');
	if (!container || typeof postsData === 'undefined') return;

	container.innerHTML = '';
	const categoriasVistas = new Set();
	const listaCategorias = [];

	// extrai as categorias na ordem em que aparecem no posts.js
	postsData.forEach(post =>
		{
			if (!categoriasVistas.has(post.category))
			{
				categoriasVistas.add(post.category);
				listaCategorias.push(
					{
						nome: post.category,
						// cria um slug amigável para a url
						slug: criarSlug(post.category)
					}
				);
			}
		}
	);

	listaCategorias.forEach(cat =>
		{
			const link = document.createElement('a');
			link.href = `/ways/${cat.slug}`;
			link.className = 'item-lista';
			link.setAttribute('data-link', '');

			link.innerHTML =
			`
				<span>${cat.nome}</span>
				<span style="color: var(--cor-acento);">&rarr;</span>
			`;

			link.onclick = (e) =>
			{
				e.preventDefault();
				history.pushState(null, null, link.href);
				rotear();
			};

			container.appendChild(link);
		}
	);
};




// ......... função: renderizar posts de uma categoria específica
const renderizarPostsPorCategoria = (slugBusca, authorSlug = null) =>
{
	const container = document.getElementById('lista-posts-categoria');
	const tituloPagina = document.getElementById('titulo-categoria-ativa');
	
	if (!container || typeof postsData === 'undefined') return;

	container.innerHTML = '';

	const postsFiltrados = postsData.filter
	(p =>
		{
			const categoriaBate = criarSlug(p.category) === slugBusca;
			// se tiver authorSlug, verifica se bate. se não tiver, ignora esse filtro.
			const autorBate = authorSlug ? criarSlug(p.author) === authorSlug : true;
			return categoriaBate && autorBate;
		}
	);

	if (postsFiltrados.length > 0)
	{
		// ajuste do título para mostrar "categoria - autor" se estiver filtrado
		if (authorSlug)
		{
			const nomeAutor = authorsData.find(a => a.id === authorSlug)?.nome || authorSlug;
			tituloPagina.innerText = `${postsFiltrados[0].category} - ${nomeAutor}`;
		}
		else
		{
			tituloPagina.innerText = postsFiltrados[0].category;
		}

		const listaCronologica = [...postsFiltrados].reverse();

		listaCronologica.forEach
		(post =>
			{
				const link = document.createElement('a');
				link.href = `/post/${post.id}`;
				link.className = 'item-post-resumo';
				link.setAttribute('data-link', '');

				const resumoTemp = post.content.replace(/<[^>]*>/g, '');
				const resumoCurto = resumoTemp.substring(0, 150) + '.....';

				link.innerHTML =
				`
					<span class="data-resumo">${post.date}</span>
					<h3 class="titulo-resumo">${post.title}</h3>
					<p class="texto-resumo">${resumoCurto}</p>
				`;

				link.onclick = (e) =>
				{
					e.preventDefault();
					history.pushState(null, null, link.href);
					rotear();
					window.scrollTo({ top: 0, behavior: 'smooth' });
				};

				container.appendChild(link);
			}
		);
	}
	else
	{
		tituloPagina.innerText = "nenhum texto encontrado";
	}
};




// ......... função: renderizar lista de autoras(es)
const renderizarListaAutoras = () =>
{
	const container = document.getElementById('lista-pessoas-autoras');
	if (!container || typeof authorsData === 'undefined') return;

	container.innerHTML = '';

	authorsData.forEach
	(author => 
		{
			const link = document.createElement('a');
			link.href = `/authors/${author.id}`; 
			link.className = 'item-lista';
			link.setAttribute('data-link', '');

			link.innerHTML = 
			`
				<span>${author.nome}</span>
				<span style="color: var(--cor-sbg);">${author.papel}</span>
			`;

			link.addEventListener
			('click', (evento) =>
				{
					evento.preventDefault();
					history.pushState(null, null, link.href);
					rotear();
				}
			);

	        container.appendChild(link);
		}
	);
};




// ......... função: renderizar post (texto individual)
const renderizarPost = (postId) =>
{
	const container = document.getElementById('post-conteudo');
	if (!container || typeof postsData === 'undefined') return;

	const post = postsData.find(p => p.id === postId);

	if (post)
	{
		document.getElementById('post-titulo').innerText = post.title;
		document.getElementById('post-data').innerText = post.date;
		document.getElementById('post-tempo').innerText = post.readingTime;

		const authorLink = document.getElementById('post-author');
		authorLink.innerText = post.author;
		authorLink.href = `/authors/${post.author.toLowerCase()}`;

		const catLink = document.getElementById('post-categoria');
		catLink.innerText = post.category;
		catLink.href = "#"; 

		let htmlFinal = post.content;
		const autorDoPost = authorsData.find(a => a.id === post.author.toLowerCase());

		if (autorDoPost && autorDoPost.apoio)
		{
			htmlFinal += autorDoPost.apoio;
		}


		/* --- MOTOR DO PAINEL DE NAVEGAÇÃO EDITORIAL --- */
		const postsAtivos = obterPostsPublicados();
		const indexAtual = postsAtivos.findIndex(p => p.id === post.id);

		// no seu posts.js o [0] é o mais novo e o último é o mais antigo.
		const postProximo = postsAtivos[indexAtual - 1]; // post mais novo (direita)
		const postAnterior = postsAtivos[indexAtual + 1]; // post mais velho (esquerda)

		htmlFinal += `<div class="painel-navegacao-inferior">`;

		// Bloco Esquerdo: Post Anterior (Mais Velho)
		if (postAnterior)
		{
			htmlFinal +=
			`
				<a href="/post/${postAnterior.id}" class="nav-item nav-anterior">
					<span class="nav-label">&larr; anterior</span>
					<img src="${postAnterior.image}" class="nav-img" alt="capa post anterior">
					<span class="nav-titulo">${postAnterior.title}</span>
				</a>
			`;
		}
		else
		{
		htmlFinal +=`<div class="nav-vazio"></div>`; // Mantém a grade alinhada
		}

		// Bloco Central: Imagem Atual + Legenda
		if (post.image)
		{
			htmlFinal +=
			`
				<div class="nav-atual">
					<img src="${post.image}" class="nav-img-atual" alt="capa do post">
					<span class="legenda-foto-post">${post.imageCaption || ''}</span>
				</div>
			`;
		}

		// Bloco Direito: Próximo Post (Mais Novo)
		if (postProximo)
		{
			htmlFinal +=
			`
				<a href="/post/${postProximo.id}" class="nav-item nav-proximo">
					<span class="nav-label">próximo &rarr;</span>
					<img src="${postProximo.image}" class="nav-img" alt="capa próximo post">
					<span class="nav-titulo">${postProximo.title}</span>
				</a>
			`;
		}
		else
		{
			htmlFinal += `<div class="nav-vazio"></div>`; // Mantém a grade alinhada
		}

		htmlFinal += `</div>`; // fecha o painel

		// Injeta tudo na tela de uma vez
		container.innerHTML = htmlFinal;

		// ENSINA OS NOVOS LINKS A USAREM O ROTEADOR SPA COM SCROLL PRO TOPO
		const linksDinamicos = container.querySelectorAll('.nav-item');
		linksDinamicos.forEach
		(link =>
			{
				link.onclick = (e) =>
				{
					e.preventDefault();
					history.pushState(null, null, link.href);
					rotear();
					window.scrollTo({ top: 0, behavior: 'smooth' }); // Sobe suavemente ao trocar de texto
				};
			}
		);

		// re-liga o link do autor do cabeçalho
		authorLink.onclick = (e) =>
		{
			e.preventDefault();
			history.pushState(null, null, authorLink.href);
			rotear();
		};
	}
};




// ......... função: roteamento de páginas/sessões (roteador)
const capaInicial = document.getElementById('capa-inicial');
const cabecalhoPrincipal = document.getElementById('cabecalho-principal');
const conteudoPrincipal = document.getElementById('conteudo-principal');
const rodapeInterno = document.getElementById('rodape-interno');

const rotear = () =>
{
	const caminho = window.location.pathname;
	const links = document.querySelectorAll('.lista-links a, .lista-links-mobile a');
	const sessoes = document.querySelectorAll('.sessao-interna');
	sessoes.forEach(sessao => sessao.classList.remove('ativa'));

	if (caminho === '/' || caminho === '/index.html')
	{
		capaInicial?.classList.remove('hidden');
		cabecalhoPrincipal?.classList.add('hidden');
		conteudoPrincipal?.classList.add('hidden');
		rodapeInterno?.classList.add('hidden');
	}
	else
	{
		capaInicial?.classList.add('hidden');
		cabecalhoPrincipal?.classList.remove('hidden');
		conteudoPrincipal?.classList.remove('hidden');
		rodapeInterno?.classList.remove('hidden');

		if (caminho === '/about')
		{
			renderizarPerfilAuthor('du', 'sobre'); // puxa o 'du' mas mantém o título 'sobre'
			document.getElementById('pagina-about')?.classList.add('ativa');
		}
		else if (caminho === '/texts')
		{
			document.getElementById('campo-busca').value = ''; // limpa a busca ao entrar
			renderizarGradeTextos(); // monta a grade completa
			document.getElementById('pagina-texts')?.classList.add('ativa');
		}		
		else if (caminho === '/ways')
		{
			renderizarCaminhos();
			document.getElementById('pagina-ways')?.classList.add('ativa');
		}
		else if (caminho.startsWith('/ways/'))
		{
			const categoriaSlug = caminho.split('/')[2];
			renderizarPostsPorCategoria(categoriaSlug); // nova função aqui
			document.getElementById('pagina-ways-results')?.classList.add('ativa');
		}
		else if (caminho === '/authors')
		{
			renderizarListaAutoras();
			document.getElementById('pagina-authors')?.classList.add('ativa');
		}
		else if (caminho.startsWith('/post/'))
		{
			const postId = caminho.split('/')[2]; 
			renderizarPost(postId); 
			document.getElementById('pagina-post')?.classList.add('ativa');
		}
		else if (caminho.startsWith('/authors/'))
		{
			const partes = caminho.split('/'); // divide a url
    
			// verifica se é a url composta: /authors/id/ways/categoria
			if (partes.length === 5 && partes[3] === 'ways')
			{
				const authorId = partes[2];
				const categoriaSlug = partes[4];
				renderizarPostsPorCategoria(categoriaSlug, authorId); // chama com os dois filtros
				document.getElementById('pagina-ways-results')?.classList.add('ativa');
			}
			else
			{
				// se for apenas o perfil normal: /authors/id
				const authorId = partes[2];
				renderizarPerfilAuthor(authorId);
				document.getElementById('pagina-about')?.classList.add('ativa');
			}
		}
		else if (caminho === '/contact')
		{
			document.getElementById('pagina-contact')?.classList.add('ativa');
		}
	}

	/* marca o link atual no menu */
	links.forEach
	(link =>
		{
			link.classList.toggle('link-ativo', link.getAttribute('href') === caminho);
		}
	);
}

document.querySelectorAll
('[data-link]').forEach
(link =>
	{
		link.addEventListener
		('click', (evento) =>
			{
				evento.preventDefault();
				history.pushState(null, null, link.href);
				rotear();
			}
		);
	}
);

window.addEventListener
('popstate', rotear);

rotear();




// ......... função: menu mobile (hambúrguer)
const btnMenu = document.getElementById('menu-btn');
const painelMenu = document.getElementById('painel-menu-mobile');

if (btnMenu && painelMenu)
{
	btnMenu.addEventListener
	('click', () =>
		{
			painelMenu.classList.toggle('hidden');
			btnMenu.classList.toggle('ativo');
		}
	);

	const linksMobile = painelMenu.querySelectorAll('a');

	linksMobile.forEach
	(link =>
		{
			link.addEventListener
			('click', () =>
				{
					painelMenu.classList.add('hidden');
					btnMenu.classList.remove('ativo');
				}
			);
		}
	);
}




// ......... função: botão voltar
const botoesVoltar = document.querySelectorAll
('.seta-voltar');

botoesVoltar.forEach
(botao =>
	{
		botao.addEventListener
		('click', (evento) =>
			{
				evento.preventDefault();
				window.history.back(); /* comando nativo do navegador para voltar */
			}
		);
	}
);
