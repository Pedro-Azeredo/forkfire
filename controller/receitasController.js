const receitas = document.getElementById('grade-receitas');
const categoriasContainer = document.getElementById('grade-categorias');
const receitasContainer = document.querySelector('.receitas-container');
const receitasRef = db.ref('/receitas');
const receitaForm = document.getElementById('receitaForm');
let base64String = null;


const categorias = [  
  "Todos",
  "Aperitivos",
  "Bebidas",
  "Bolos",
  "Carnes",
  "Comida Árabe",
  "Comida Asiática",
  "Comida Mexicana",
  "Doces",
  "Gluten-Free",
  "Lanches",
  "Low Carb",
  "Massas",
  "Pães e Tortas",
  "Saladas",
  "Salgados",
  "Sobremesas",
  "Sopas e Caldos",
  "Vegano",
  "Vegetariano" 
];

const imagensCategorias = {
  "Todos": "/forkfire/assets/images/categorias/todos-min.png",
  "Aperitivos": "/forkfire/assets/images/categorias/aperitivo-min.png",
  "Bebidas": "/forkfire/assets/images/categorias/bebidas-min.png",
  "Bolos": "/forkfire/assets/images/categorias/bolos-min.png",
  "Carnes": "/forkfire/assets/images/categorias/carnes-min.png",
  "Comida Árabe": "/forkfire/assets/images/categorias/comida_arabe-min.png",
  "Comida Asiática": "/forkfire/assets/images/categorias/comida_asiatica-min.png",
  "Comida Mexicana": "/forkfire/assets/images/categorias/comida_mexicana-min.png",
  "Doces": "/forkfire/assets/images/categorias/doces-min.png",
  "Gluten-Free": "/forkfire/assets/images/categorias/gluten_free-min.png",
  "Lanches": "/forkfire/assets/images/categorias/lanches-min.png",
  "Low Carb": "/forkfire/assets/images/categorias/low_carb-min.png",
  "Massas": "/forkfire/assets/images/categorias/massas-min.png",
  "Pães e Tortas": "/forkfire/assets/images/categorias/paes-min.png",
  "Saladas": "/forkfire/assets/images/categorias/saladas-min.png",
  "Salgados": "/forkfire/assets/images/categorias/salgados-min.png",
  "Sobremesas": "/forkfire/assets/images/categorias/sobremesas-min.png",
  "Sopas e Caldos": "/forkfire/assets/images/categorias/sopas-min.png",
  "Vegano": "/forkfire/assets/images/categorias/vegano-min.png",
  "Vegetariano": "/forkfire/assets/images/categorias/vegetariano-min.png"
};

const selectCategoria = document.getElementById('categoria');

// Preenche o dropdown dinamicamente
categorias.forEach(categoria => {
  const option = document.createElement('option');
  if (categoria === "Todos") {
    return;
  }
  option.value = categoria;
  option.textContent = categoria;
  selectCategoria.appendChild(option);
  
});

// Event listener para o input de imagem
document.getElementById('imagem').addEventListener('change', async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  // Verifica se é uma imagem
  if (!file.type.match('image.*')) {
    alert('Por favor, selecione um arquivo de imagem válido (JPEG, PNG, etc.)');
    return;
  }

  try {
    
    // Comprime a imagem antes de converter para Base64
    base64String = await compressImage(file, 800, 0.6); // 800px largura, 60% qualidade
    
    console.log('Imagem comprimida e convertida. Tamanho:', Math.round(base64String.length/1024) + 'KB');
  } catch (error) {
    console.error('Erro ao processar imagem:', error);
    alert('Erro ao processar a imagem. Tente novamente.');
    base64String = null;
  } finally {
    document.getElementById('imagem-loader').style.display = 'none';
  }
});

// Função para cadastrar nova receita
receitaForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const user = firebase.auth().currentUser;

  let titulo = document.getElementById('titulo').value.trim();
  let ingredientes = document.getElementById('ingredientes').value.trim();
  let categoria = document.getElementById('categoria').value.trim();
  let modoPreparo = document.getElementById('modoPreparo').value.trim().replace(/\s+/g, ' ');
  let tempoPreparo = document.getElementById('tempoPreparo').value.trim();
  let dataHora = Date.now();

  try {
    const novaReceitaRef = db.ref(`receitas/${user.uid}/${dataHora}`);

    await novaReceitaRef.set({
      titulo: titulo,
      ingredientes: ingredientes,
      categoria: categoria,
      modoPreparo: modoPreparo,
      tempoPreparo: tempoPreparo,
      foto: base64String,
      criadoPor: user.uid,
      dataCriacao: dataHora,
    });

    console.log('Receita salva com sucesso!');
    receitaForm.reset();
    base64String = null;
  } catch (error) {
    console.error('Erro ao salvar receita:', error);
  }
});

// Função para buscar as receitas passando a categoria
function buscarReceitas(categoriaDesejada = null) {
  const loader = document.getElementById('loader');
  const gradeReceitas = document.getElementById('grade-receitas');
  
  loader.style.display = 'block';
  gradeReceitas.innerHTML = ''; // Limpa apenas a grade, não o container todo

  // Cria container para o botão e conteúdo
  const contentWrapper = document.createElement('div');
  contentWrapper.className = 'receitas-content-wrapper';

  // Cria o botão de voltar
  const voltarBtn = document.createElement('button');
  voltarBtn.textContent = 'Voltar para Categorias';
  voltarBtn.className = 'voltar-btn';
  voltarBtn.innerHTML = '<i class="fas fa-arrow-left"></i> Voltar para Categorias';
  voltarBtn.onclick = () => {
    document.querySelector('.receitas-container').style.display = 'none';
    renderizarCategorias();
  };

  // Adiciona botão ao wrapper
  contentWrapper.appendChild(voltarBtn);

  // Cria container para as receitas
  const receitasContent = document.createElement('div');
  receitasContent.id = 'receitas-content';
  contentWrapper.appendChild(receitasContent);

  // Adiciona wrapper à grade
  gradeReceitas.appendChild(contentWrapper);

  // Busca receitas
  receitasRef.once('value').then((snapshot) => {
    loader.style.display = 'none';
    const receitasData = snapshot.val();

    if (receitasData) {
      renderizarReceitas(receitasData, categoriaDesejada);
    } else {
      const mensagem = document.createElement('p');
      mensagem.className = 'sem-receitas';
      mensagem.textContent = 'Nenhuma receita encontrada nesta categoria.';
      receitasContent.appendChild(mensagem);
    }
    
    document.querySelector('.receitas-container').style.display = 'block';
  }).catch((error) => {
    console.error("Erro ao buscar receitas:", error);
    loader.style.display = 'none';
  });
}

// Função para buscar todas as receitas
function buscarTodasReceitas() {
  const loader = document.getElementById('loader');
  const gradeReceitas = document.getElementById('grade-receitas');
  
  loader.style.display = 'block';
  gradeReceitas.innerHTML = '';

  // Cria container para o botão e conteúdo
  const contentWrapper = document.createElement('div');
  contentWrapper.className = 'receitas-content-wrapper';

  const voltarBtn = document.createElement('button');
  voltarBtn.textContent = 'Voltar para Categorias';
  voltarBtn.className = 'voltar-btn';
  voltarBtn.innerHTML = '<i class="fas fa-arrow-left"></i> Voltar';
  voltarBtn.onclick = () => {
    document.querySelector('.receitas-container').style.display = 'none';
    renderizarCategorias();
  };
  
  // Adiciona botão ao wrapper
  contentWrapper.appendChild(voltarBtn);

  // Cria container para as receitas
  const receitasContent = document.createElement('div');
  receitasContent.id = 'receitas-content';
  contentWrapper.appendChild(receitasContent);

  // Adiciona wrapper à grade
  gradeReceitas.appendChild(contentWrapper);

  // Busca TODAS as receitas sem filtrar por categoria
  receitasRef.once('value').then((snapshot) => {
    loader.style.display = 'none';
    const receitasData = snapshot.val();

    if (receitasData) {
      renderizarReceitas(receitasData); // Sem passar categoriaDesejada
    } else {
      const mensagem = document.createElement('p');
      mensagem.className = 'sem-receitas';
      mensagem.textContent = 'Nenhuma receita encontrada.';
      receitasContent.appendChild(mensagem);
    }
    
    document.querySelector('.receitas-container').style.display = 'block';
  }).catch((error) => {
    console.error("Erro ao buscar receitas:", error);
    loader.style.display = 'none';
  });
}

// renderiza as receitas na tela passando receita e categoria
function renderizarReceitas(receitas, categoriaDesejada = null) {
  const receitasContent = document.getElementById('receitas-content');
  const loader = document.getElementById('loader');
  
  loader.style.display = 'block';
  receitasContent.innerHTML = '';

  setTimeout(() => {
    let receitasEncontradas = false;
    
    Object.entries(receitas).forEach(([userId, userReceitas]) => {
      Object.entries(userReceitas).forEach(([timestamp, receita]) => {
        if (categoriaDesejada && receita.categoria !== categoriaDesejada) {
          return;
        }


        receitasEncontradas = true;
        const card = document.createElement('div');
        const dataCriacao = new Date(Number(receita.dataCriacao));
        const dataFormatada = dataCriacao.toLocaleDateString('pt-BR');

        card.className = 'receita-card';
        card.innerHTML = `
          <div class="receita-image">
            ${receita.foto ? `<img src="${receita.foto}" alt="${receita.titulo}" class="receita-imagem">` : '<div class="sem-imagem">Sem imagem</div>'}
          </div>
          <div class="receita-text">
            <h2>${receita.titulo}</h2>
            <div class="receita-tempo">
              <span class="tempo">${receita.tempoPreparo} min</span>
            </div>
            <div class="receita-categoria">
              <span class="categoria">${receita.categoria}</span>
            </div>
              <p class="cardDataFormatada">Criado em ${dataFormatada}</p>
          </div>
        `;
        
        // Adiciona evento de clique para mostrar detalhes
        card.addEventListener('click', () => {
          mostrarDetalhesReceita(receita);
        });
        
        receitasContent.appendChild(card);
      });
    });
    
    loader.style.display = 'none';
    
    if (!receitasEncontradas) {
      const mensagem = document.createElement('p');
      mensagem.className = 'sem-receitas';
      mensagem.textContent = 'Nenhuma receita encontrada nesta categoria.';
      receitasContent.appendChild(mensagem);
    }
  }, 100);
}

// função para renderizar as categorias
function renderizarCategorias() {
  categoriasContainer.innerHTML = '';
  categoriasContainer.style.display = 'grid'; // Mostra o container de categorias
  receitasContainer.style.display = 'none'; // Esconde o container de receitas
  
  categorias.forEach(categoria => {
    const categoriaElement = document.createElement('div');
    categoriaElement.className = 'categoria-card';
    categoriaElement.style.backgroundImage = `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.5)), url(${imagensCategorias[categoria]})`;
    categoriaElement.innerHTML = `
      <h3>${categoria}</h3>
    `;

    categoriaElement.addEventListener('click', () => {
      const receitas_buscar_todos = document.getElementsByClassName('receitas-buscar-todos')[0];
      if (categoria === "Todos") {
        buscarTodasReceitas();
      }
      else {
        buscarReceitas(categoria);
      }
      categoriasContainer.style.display = 'none'; // Esconde as categorias
      receitasContainer.style.display = 'block'; // Mostra as receitas
    });
    
    categoriasContainer.appendChild(categoriaElement);
  });
}

// mostras os detalhes da receita
function mostrarDetalhesReceita(receita) {
  window.currentRecipe = receita;
  const detalhesContainer = document.querySelector('.receita-detalhes-container');
  const detalhesContent = document.querySelector('.receita-detalhes');
  
  // Formata a data
  const dataCriacao = new Date(Number(receita.dataCriacao));
  const dataFormatada = dataCriacao.toLocaleDateString('pt-BR');
  
  // Busca o nome do usuário no Realtime Database
  const userRef = db.ref(`usuarios/${receita.criadoPor}`);
  userRef.once('value').then((snapshot) => {
    const usuario = snapshot.val();
    const nomeUsuario = usuario ? usuario.nome : 'Anônimo';
    
    // Preenche os detalhes após obter o nome do usuário
    detalhesContent.innerHTML = `
      <button class="voltar-btn" id="voltarReceitas">
        <i class="fas fa-arrow-left"></i> Voltar para Receitas
      </button>

      <div class="receita-detalhes-contorno">
        ${receita.foto ? `<img src="${receita.foto}" alt="${receita.titulo}" class="receita-detalhes-imagem">` : ''}
        <h1 class="receita-detalhes-titulo">${receita.titulo}</h1>
      </div>
        
      <div class="receita-detalhes-meta">
        <span><i class="fas fa-clock"></i> <p>${receita.tempoPreparo} min</p></span>
        <span><i class="fas fa-calendar-alt"></i> <p>${dataFormatada}</p></span>
        <span><i class="fas fa-user"></i> <p>${nomeUsuario}</p></span>
        <span><i class="fas fa-tag"></i> <p>${receita.categoria}</p></span>
      </div>
      
      <div class="receita-detalhes-section">
        <h3>Ingredientes</h3>
        <div class="receita-detalhes-ingredientes">${receita.ingredientes}</div>
      </div>
      
      <div class="receita-detalhes-section">
        <h3>Modo de Preparo</h3>
        <div class="receita-detalhes-preparo">${receita.modoPreparo}</div>
      </div>

      <div class="avaliacao-container">
        <h3>Avaliações</h3>
        <div class="form-avaliacao">
          <ul class="avaliacao">
            <li class="star-icon" data-avaliacao="5" onclick="obterEstrela(event)">★</li>
            <li class="star-icon" data-avaliacao="4" onclick="obterEstrela(event)">★</li>
            <li class="star-icon" data-avaliacao="3" onclick="obterEstrela(event)">★</li>
            <li class="star-icon" data-avaliacao="2" onclick="obterEstrela(event)">★</li>
            <li class="star-icon" data-avaliacao="1" onclick="obterEstrela(event)">★</li>
          </ul>
          <textarea
              class="comentario"
              name="comentario"
              rows="5"
              placeholder="Deixe aqui seu comentário..."
              required
              maxlength="200"
          ></textarea>
          <button id="enviarAvaliacao" onclick="enviarAvaliacao()">Enviar Avaliação</button>
        </div>
        <div class="avaliacoes-lista">
          <h4>Comentários</h4>
          <ul id="listaAvaliacoes">
          </ul>
      </div>
    `;

    // Configura o botão de voltar
    document.getElementById('voltarReceitas').addEventListener('click', () => {
      detalhesContainer.style.display = 'none';
      document.querySelector('.receitas-container').style.display = 'block';
    });
    
    // Mostra os detalhes e esconde a lista
    detalhesContainer.style.display = 'block';
    document.querySelector('.receitas-container').style.display = 'none';

    carregarAvaliacoes(receita);
    
  }).catch((error) => {
    console.error("Erro ao buscar nome do usuário:", error);
    // Se houver erro, mostra sem o nome
    detalhesContent.innerHTML = `
      <!-- ... (mesmo conteúdo acima, mas com 'Anônimo' no lugar do nome) ... -->
    `;
  });
}

// renderizar todas as receitas ao clicar no botão
const receitas_buscar_todos = document.getElementsByClassName('receitas-buscar-todos')[0];

receitas_buscar_todos.onclick = () => {
  buscarTodasReceitas();

  categoriasContainer.style.display = 'none'; // Esconde as categorias
  receitasContainer.style.display = 'block'; // Mostra as receitas
}

// Inicialização
renderizarCategorias();
