import { db, collection, getDocs } from './firebase-config.js';

let products = [];
let cart = [];
let activeMainFilters = [];
let activeSubFilters = [];
let selectedSize = null; // Guarda tamanho escolhido no modal
let selectedColor = null; // Guarda cor escolhida no modal

document.addEventListener('DOMContentLoaded', async () => {
    const grid = document.getElementById('product-grid');
    grid.innerHTML = '<p style="text-align:center; padding: 20px;">Carregando coleção...</p>';

    try {
        const querySnapshot = await getDocs(collection(db, "produtos"));
        products = [];
        querySnapshot.forEach((doc) => {
            let data = doc.data();
            data.category = data.category ? data.category.toLowerCase() : 'outros';
            data.subcategory = data.subcategory ? data.subcategory.toLowerCase() : '';
            
            // Garante que imageList sempre exista como uma array
            if (data.images && Array.isArray(data.images)) {
                data.imageList = data.images;
            } else if (data.image) {
                data.imageList = [data.image];
            } else {
                data.imageList = ["https://via.placeholder.com/300"];
            }

            products.push({ id: doc.id, ...data });
        });

        // Vincula a lista local à global
        window.products = products; 

        renderMainMenu();
        renderProducts(products);
        
        // Verifica se a função existe antes de chamar para evitar erro no console
        if (typeof renderCategoryShowcases === 'function') {
            renderCategoryShowcases();
        }
        
        // Separa o que é exclusivo para o Carrossel de Luxo
        const exclusivos = products.filter(p => p.exclusive === true);
        initExclusiveCarousel(exclusivos);

        // O restante aparece na grade normal
        renderProducts(products);
    } catch (error) {
        console.error("Erro:", error);
        grid.innerHTML = '<p style="text-align:center;">Erro ao carregar a loja.</p>';
    }
});

function renderProducts(items) {
    const grid = document.getElementById('product-grid');
    if (!grid) return;
    grid.innerHTML = ''; 

    if (items.length === 0) {
        grid.innerHTML = '<p style="text-align:center; width:100%; grid-column: 1 / -1;">Nenhum produto encontrado.</p>';
        return;
    }

    items.forEach(product => {
        const card = document.createElement('div');
        card.className = 'product-card';
        // Clicar no cartão abre o modal
        card.onclick = () => openProductModal(product.id);
        
        const precoAtual = (product.price || 0).toFixed(2).replace('.', ',');
        let priceHtml = `<p class="current-price">R$ ${precoAtual}</p>`;
        
        if (product.oldPrice && product.oldPrice > product.price) {
            const precoAntigo = product.oldPrice.toFixed(2).replace('.', ',');
            const desconto = Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100);
            priceHtml = `
                <div class="promo-box">
                    <span class="old-price">R$ ${precoAntigo}</span>
                    <span class="discount-tag">-${desconto}%</span>
                </div>
                <p class="current-price sale">R$ ${precoAtual}</p>
            `;
        }

        // Lógica do Selo de Exclusividade
        const seloExclusivo = product.exclusive 
            ? `<span class="exclusive-badge">Seleção Exclusive</span>` 
            : '';

        card.innerHTML = `
            <div class="image-container">
                ${seloExclusivo}
                <img src="${product.imageList[0]}" class="product-image" alt="${product.name}">
            </div>
            <div class="product-info">
                <h3>${product.name}</h3>
                ${priceHtml}
                <button class="add-btn" onclick="event.stopPropagation(); openProductModal(String('${product.id}'))">VER DETALHES</button>
            </div>
        `;
        
        grid.appendChild(card);

        // --- MELHORIA: ZOOM DE RASTRO SUAVE (ESTILO VITRINE PRINCIPAL) ---
        const imgContainer = card.querySelector('.image-container');
        const img = card.querySelector('.product-image');

        imgContainer.addEventListener('mousemove', (e) => {
            if (window.innerWidth > 768) {
                const rect = imgContainer.getBoundingClientRect();
                // Calcula a posição do mouse em % dentro da imagem
                const x = ((e.clientX - rect.left) / rect.width) * 100;
                const y = ((e.clientY - rect.top) / rect.height) * 100;

                img.style.transformOrigin = `${x}% ${y}%`;
                img.style.transform = "scale(1.4)"; // Zoom equilibrado para a grade
            }
        });

        imgContainer.addEventListener('mouseleave', () => {
            img.style.transform = "scale(1)";
            img.style.transformOrigin = "center center";
        });
        // ----------------------------------------------------------------
    });
}

window.openProductModal = (id) => {
    // Usamos == para garantir que encontre o ID mesmo se for string/número
    const product = products.find(p => p.id == id);
    if (!product) return;

    selectedSize = null;
    selectedColor = null;

    document.getElementById('modal-title').innerText = product.name;
    
    // --- LÓGICA DE PREÇO E PROMOÇÃO NO MODAL ---
    const precoContainer = document.getElementById('modal-price');
    const precoAtual = product.price.toFixed(2).replace('.', ',');
    
    if (product.oldPrice && product.oldPrice > product.price) {
        const precoAntigo = product.oldPrice.toFixed(2).replace('.', ',');
        const desconto = Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100);
        
        precoContainer.innerHTML = `
            <div class="promo-box">
                <span class="old-price">R$ ${precoAntigo}</span>
                <span class="discount-tag">-${desconto}%</span>
            </div>
            <span class="current-price sale">R$ ${precoAtual}</span>
        `;
    } else {
        precoContainer.innerHTML = `R$ ${precoAtual}`;
    }

    // --- LÓGICA DE PARCELAMENTO ---
    const pInstallments = document.querySelector('.modal-installments');
    if (product.installments > 1) {
        const valorParcela = (product.price / product.installments).toFixed(2).replace('.', ',');
        pInstallments.innerText = `ou ${product.installments}x de R$ ${valorParcela} sem juros`;
        pInstallments.style.display = 'block';
    } else {
        pInstallments.style.display = 'none';
    }

    // --- LÓGICA DE ZOOM APRIMORADA ---
    const imgContainer = document.querySelector('.main-image-container');
    const mainImg = document.getElementById('modal-main-img');

    // Reseta zoom ao trocar de produto
    imgContainer.classList.remove('mobile-zoom');
    mainImg.style.transform = "scale(1)";

    // Zoom no Mouse (PC)
    imgContainer.onmousemove = (e) => {
        if (window.innerWidth > 768) {
            const { left, top, width, height } = imgContainer.getBoundingClientRect();
            const x = ((e.pageX - left) / width) * 100;
            const y = ((e.pageY - top) / height) * 100;
            
            mainImg.style.transformOrigin = `${x}% ${y}%`;
            mainImg.style.transform = "scale(2.5)"; // Aumenta o zoom no PC
        }
    };

    imgContainer.onmouseleave = () => {
        if (window.innerWidth > 768) {
            mainImg.style.transform = "scale(1)";
            mainImg.style.transformOrigin = "center";
        }
    };

    // Zoom no Toque (Mobile)
    imgContainer.onclick = (e) => {
        if (window.innerWidth <= 768) {
            imgContainer.classList.toggle('mobile-zoom');
        }
    };
    
    // --- VINCULAÇÃO DO BOTÃO ADICIONAR ---
    const btnAdd = document.getElementById('modal-add-btn');
    btnAdd.onclick = null; 
    btnAdd.onclick = (e) => {
        e.preventDefault();
        addToCartFromModal(product.id);
    };

    const thumbsContainer = document.getElementById('modal-thumbs');
    mainImg.src = product.imageList[0]; 
    thumbsContainer.innerHTML = ''; 

    product.imageList.forEach((imgSrc, index) => {
        const thumb = document.createElement('img');
        thumb.src = imgSrc;
        thumb.className = 'thumb-img';
        if (index === 0) thumb.classList.add('active');
        thumb.onclick = () => {
            // Ao trocar de foto, removemos o zoom para não bugar a visualização
            imgContainer.classList.remove('mobile-zoom');
            mainImg.src = imgSrc;
            document.querySelectorAll('.thumb-img').forEach(t => t.classList.remove('active'));
            thumb.classList.add('active');
        };
        thumbsContainer.appendChild(thumb);
    });

    const sizesContainer = document.getElementById('modal-sizes');
    sizesContainer.innerHTML = '';
    if (product.sizes && product.sizes.length > 0) {
        document.getElementById('group-sizes').style.display = 'block';
        product.sizes.forEach(size => {
            const btn = document.createElement('button');
            btn.className = 'chip-btn';
            btn.innerText = size;
            btn.onclick = (e) => {
                e.stopPropagation(); 
                document.querySelectorAll('#modal-sizes .chip-btn').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                selectedSize = size;
            };
            sizesContainer.appendChild(btn);
        });
    } else {
        document.getElementById('group-sizes').style.display = 'none';
    }

    const colorsContainer = document.getElementById('modal-colors');
    colorsContainer.innerHTML = '';
    if (product.colors && product.colors.length > 0) {
        document.getElementById('group-colors').style.display = 'block';
        const colorList = product.colors.split(',').map(c => c.trim());
        colorList.forEach(color => {
            const btn = document.createElement('button');
            btn.className = 'chip-btn';
            btn.innerText = color;
            btn.onclick = (e) => {
                e.stopPropagation();
                document.querySelectorAll('#modal-colors .chip-btn').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                selectedColor = color;
            };
            colorsContainer.appendChild(btn);
        });
    } else {
        document.getElementById('group-colors').style.display = 'none';
    }

    document.getElementById('product-modal').classList.add('active');
    document.body.style.overflow = 'hidden';
};

window.closeProductModal = (event) => {
    // Agora só fecha se:
    // 1. O evento for nulo (clique direto no botão X)
    // 2. O alvo do clique for EXATAMENTE o fundo escuro (ID product-modal)
    if (!event || event.target.id === 'product-modal') {
        document.getElementById('product-modal').classList.remove('active');
        document.body.style.overflow = 'auto';
    }
};

// Adiciona do Modal para o Carrinho (levando em conta tamanho/cor)
function addToCartFromModal(id) {
    // Usamos == para evitar erro se um ID for número e o outro texto
    const product = products.find(p => p.id == id);
    
    if(product) {
        // Validação: Se o produto TEM tamanhos cadastrados, obriga a escolher
        if (product.sizes && product.sizes.length > 0 && !selectedSize) {
            alert("Por favor, selecione um tamanho.");
            return;
        }

        // Criamos o item para a sacola com as escolhas feitas
        const itemParaSacola = { 
            ...product,
            selectedSize: selectedSize || null,
            selectedColor: selectedColor || null
        };

        cart.push(itemParaSacola);
        updateCartUI(); // Atualiza a lista da sacola
        closeProductModal(); // Fecha a janela
        
        // Pequeno atraso para abrir a sacola suavemente
        setTimeout(() => {
            toggleCart();
        }, 300);
    } else {
        console.error("Produto não encontrado para o ID:", id);
    }
}

// Adiciona direto do Card (sem escolher tamanho/cor - comportamento padrão)
function addToCart(id) {
    const product = products.find(p => p.id === id);
    if(product) {
        cart.push(product);
        updateCartUI();
        toggleCart();
    }
}

// --- RESTO DO CÓDIGO (Menus, Filtros, Carrinho) ---
// (Mantenha as funções abaixo iguais: renderMainMenu, toggleMainFilter, checkoutWhatsApp, etc.)

function renderMainMenu() {
    const menuContainer = document.getElementById('main-menu');
    const uniqueCategories = [...new Set(products.map(p => p.category))];
    menuContainer.innerHTML = ''; 

    uniqueCategories.forEach(cat => {
        const btn = document.createElement('button');
        btn.className = 'filter-btn';
        btn.id = `btn-${cat.replace(/\s+/g, '-')}`; 
        btn.innerText = cat.charAt(0).toUpperCase() + cat.slice(1); 
        btn.onclick = () => toggleMainFilter(cat);
        menuContainer.appendChild(btn);
    });

    const clearBtn = document.createElement('button');
    clearBtn.className = 'filter-btn';
    clearBtn.title = "Limpar Filtros";
    clearBtn.style = "color: #ccc;";
    clearBtn.innerHTML = '<i class="fa-solid fa-filter-circle-xmark"></i>';
    clearBtn.onclick = () => toggleMainFilter('todos');
    menuContainer.appendChild(clearBtn);
}

function renderSubMenu() {
    const subContainer = document.getElementById('sub-filters');
    if (!subContainer) return;

    // REGRA DE LUXO: Só mostra o submenu se houver uma categoria principal selecionada
    if (activeMainFilters.length === 0) {
        subContainer.style.display = 'none';
        subContainer.innerHTML = '';
        activeSubFilters = []; // Limpa seleções antigas de subfiltros
        return;
    }

    // Filtra para encontrar apenas os tipos que existem dentro das categorias selecionadas
    const relevantProducts = products.filter(p => activeMainFilters.includes(p.category));
    const uniqueSubcats = [...new Set(relevantProducts.map(p => p.subcategory))].filter(sub => sub !== '');

    // Se a categoria selecionada não tiver subcategorias cadastradas, esconde o menu
    if (uniqueSubcats.length === 0) {
        subContainer.style.display = 'none';
        activeSubFilters = []; 
        return;
    }

    subContainer.innerHTML = ''; 
    subContainer.style.display = 'flex'; 

    uniqueSubcats.forEach(sub => {
        const btn = document.createElement('button');
        btn.className = 'sub-btn';
        if (activeSubFilters.includes(sub)) btn.classList.add('active');
        // Mantém o padrão de MAIÚSCULO para sofisticação
        btn.innerText = sub.toUpperCase(); 
        btn.onclick = () => toggleSubFilter(sub);
        subContainer.appendChild(btn);
    });

    const separator = document.createElement('span');
    separator.style = "border-left: 1px solid #ccc; margin: 0 5px;";
    subContainer.appendChild(separator);

    const clearBtn = document.createElement('button');
    clearBtn.className = 'sub-btn';
    clearBtn.title = "Limpar Filtros do Tipo";
    clearBtn.style = "color: #ccc; font-size: 1rem;";
    clearBtn.innerHTML = '<i class="fa-solid fa-filter-circle-xmark"></i>';
    clearBtn.onclick = clearSubFilters;
    subContainer.appendChild(clearBtn);
}

function toggleMainFilter(category) {
    if (category === 'todos') {
        activeMainFilters = [];
        activeSubFilters = [];
    } else {
        const index = activeMainFilters.indexOf(category);
        if (index > -1) activeMainFilters.splice(index, 1);
        else activeMainFilters.push(category);
    }
    updateMainButtonsUI();
    renderSubMenu();
    applyFilters();
    
    if (activeMainFilters.length > 0) {
        const subFiltersDiv = document.getElementById('sub-filters');
        const target = (subFiltersDiv.style.display !== 'none') ? subFiltersDiv : document.getElementById('product-grid');
        setTimeout(() => target.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    }
}

function updateMainButtonsUI() {
    document.querySelectorAll('.categories .filter-btn').forEach(btn => btn.classList.remove('active'));
    activeMainFilters.forEach(cat => {
        const btn = document.getElementById(`btn-${cat.replace(/\s+/g, '-')}`);
        if (btn) btn.classList.add('active');
    });
}

function toggleSubFilter(sub) {
    const index = activeSubFilters.indexOf(sub);
    if (index > -1) activeSubFilters.splice(index, 1);
    else activeSubFilters.push(sub);
    
    document.querySelectorAll('.sub-btn').forEach(btn => {
        if (btn.innerText.toLowerCase() === sub) btn.classList.toggle('active');
    });
    applyFilters();
}

function clearSubFilters() {
    activeSubFilters = [];
    document.querySelectorAll('.sub-btn').forEach(btn => btn.classList.remove('active'));
    applyFilters();
}

function applyFilters() {
    let filtered = products;
    if (activeMainFilters.length > 0) filtered = filtered.filter(p => activeMainFilters.includes(p.category));
    if (activeSubFilters.length > 0) filtered = filtered.filter(p => activeSubFilters.includes(p.subcategory));
    renderProducts(filtered);
}

// --- CARRINHO ---
function removeFromCart(index) {
    cart.splice(index, 1);
    updateCartUI();
}

function updateCartUI() {
    const cartItemsContainer = document.getElementById('cart-items');
    const cartCount = document.getElementById('cart-count');
    const cartTotal = document.getElementById('cart-total');

    cartItemsContainer.innerHTML = '';
    let total = 0;

    cart.forEach((item, index) => {
        total += item.price;
        
        // Monta texto de detalhes (Tam: P, Cor: Verde)
        let details = [];
        if (item.selectedSize) details.push(`Tam: ${item.selectedSize}`);
        if (item.selectedColor) details.push(`Cor: ${item.selectedColor}`);
        const detailsHtml = details.length > 0 ? `<small style="color:#666">${details.join(' | ')}</small>` : '';

        const itemElement = document.createElement('div');
        itemElement.className = 'cart-item';
        itemElement.innerHTML = `
            <img src="${item.imageList[0]}" alt="${item.name}">
            <div>
                <h4>${item.name}</h4>
                ${detailsHtml}
                <p>R$ ${item.price.toFixed(2).replace('.', ',')}</p>
                <a href="#" onclick="removeFromCart(${index})" style="color:red; font-size:0.8rem;">Remover</a>
            </div>
        `;
        cartItemsContainer.appendChild(itemElement);
    });

    cartCount.innerText = cart.length;
    cartTotal.innerText = `R$ ${total.toFixed(2).replace('.', ',')}`;
}

function toggleCart() {
    const sidebar = document.getElementById('cart-sidebar');
    const overlay = document.getElementById('overlay');
    sidebar.classList.toggle('open');
    overlay.classList.toggle('active');
}

window.checkoutWhatsApp = function() {
    if (cart.length === 0) {
        alert("Sua sacola está vazia!");
        return;
    }

    let mensagem = "Olá Ale Maison! Gostaria de finalizar meu pedido:\n\n";
    let total = 0;

    cart.forEach((item, index) => {
        const precoNum = item.price;
        const subtotal = precoNum * (item.quantity || 1);
        total += subtotal;

        mensagem += `*${index + 1}. ${item.name}*\n`;
        mensagem += `   Tamanho: ${item.size || 'N/A'}\n`;
        mensagem += `   Cor: ${item.color || 'N/A'}\n`;
        mensagem += `   Qtd: ${item.quantity || 1}\n`;
        mensagem += `   Valor: R$ ${subtotal.toLocaleString('pt-BR', {minimumFractionDigits: 2})}\n\n`;
    });

    mensagem += `*Total estimado: R$ ${total.toLocaleString('pt-BR', {minimumFractionDigits: 2})}*\n`;
    mensagem += `\nAguardo seu retorno para confirmar disponibilidade e frete!`;

    // Codifica a mensagem para a URL
    const msgEncoded = encodeURIComponent(mensagem);
    const fone = "5547933869807"; // Número da sua mãe
    const url = `https://wa.me/${fone}?text=${msgEncoded}`;

    // Abre o WhatsApp em uma nova aba
    window.open(url, '_blank');
};

let currentSlide = 0;
let carouselInterval;

function initExclusiveCarousel(items) {
    const container = document.getElementById('hero-carousel');
    if (!container) return;

    // Se não tiver exclusivos, remove as setas e para aqui
    if (!items || items.length === 0) {
        container.classList.add('no-slides');
        return;
    }

    // Cria os slides dos produtos APÓS a logo
    items.forEach((product) => {
        const preco = product.price.toFixed(2).replace('.', ',');
        const slide = document.createElement('div');
        slide.className = 'hero-slide';
        slide.onclick = () => openProductModal(product.id);
        
        slide.innerHTML = `
            <img src="${product.imageList[0]}" class="slide-image">
            <div class="slide-content">
                <span>SELEÇÃO EXCLUSIVE</span>
                <h2>${product.name.toUpperCase()}</h2>
                <p class="price">R$ ${preco}</p>
                <button class="add-btn" style="opacity:1; width:fit-content; padding: 15px 40px;">VER DETALHES</button>
            </div>
        `;
        container.appendChild(slide);
    });

    // Reinicia o tempo automático
    startAutoSlide();
}

function startAutoSlide() {
    clearInterval(carouselInterval);
    carouselInterval = setInterval(() => {
        changeSlide(1);
    }, 5000);
}

window.changeSlide = (direction) => {
    const slides = document.querySelectorAll('.hero-slide');
    if (slides.length <= 1) return;

    // Remove classe ativa do slide atual
    slides[currentSlide].classList.remove('active');

    // Calcula o próximo (incluindo a logo no loop)
    currentSlide = (currentSlide + direction + slides.length) % slides.length;

    // Adiciona classe ativa no novo slide
    slides[currentSlide].classList.add('active');

    // Se o usuário clicou, resetamos o tempo para não pular rápido demais
    startAutoSlide();
}

// EXPORTA FUNÇÕES
window.toggleMainFilter = toggleMainFilter;
window.toggleSubFilter = toggleSubFilter;
window.clearSubFilters = clearSubFilters;
window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.toggleCart = toggleCart;
window.checkoutWhatsApp = checkoutWhatsApp;
window.openProductModal = openProductModal;
window.closeProductModal = closeProductModal;
window.renderCategoryShowcases = renderCategoryShowcases;
// Gerenciamento do Modal de Ajuda Dinâmico
window.openHelpModal = function(topic) {
    const modal = document.getElementById('help-modal');
    const title = modal.querySelector('h2');
    const content = modal.querySelector('.help-content div');
    
    const info = {
        'como-comprar': {
            title: 'Como Comprar',
            text: `<p><strong>1. Escolha suas peças:</strong> Navegue pela nossa curadoria e adicione os itens desejados à sua sacola.</p>
                   <p><strong>2. Revise sua Sacola:</strong> Clique no ícone da sacola no topo para conferir tamanhos e cores selecionadas.</p>
                   <p><strong>3. Finalize no WhatsApp:</strong> Ao clicar em "Finalizar", você será direcionada para uma conversa exclusiva com nossa consultora.</p>
                   <p><strong>4. Atendimento Personalizado:</strong> No WhatsApp, confirmaremos a disponibilidade, calcularemos o frete e enviaremos o link de pagamento seguro.</p>
                   <p><strong>5. Receba em Casa:</strong> Após a confirmação, suas peças serão preparadas com todo carinho e enviadas até você.</p>`
        },
        'envios': {
            title: 'Envios e Prazos',
            text: `<p><strong>Envio Nacional:</strong> Enviamos para todo o Brasil via Correios (SEDEX ou PAC).</p>
                   <p><strong>Prazo de Postagem:</strong> Até 2 dias úteis após a confirmação do pagamento.</p>
                   <p><strong>Rastreio:</strong> Você receberá o código de rastreamento via WhatsApp.</p>`
        },
        'trocas': {
            title: 'Trocas e Devoluções',
            text: `<p><strong>Prazo:</strong> Você tem até 7 dias corridos após o recebimento para solicitar a troca ou devolução.</p>
                   <p><strong>Condições:</strong> A peça deve estar com a etiqueta original, sem sinais de uso e em sua embalagem.</p>
                   <p style="margin-bottom: 25px;"><strong>Como solicitar:</strong> Clique no botão abaixo para iniciar o processo com nossa consultora.</p>
                   <a href="https://wa.me/5547933869807?text=Olá Ale Maison! Gostaria de solicitar a devolução/troca de um pedido." 
                      target="_blank" 
                      class="whatsapp-btn" 
                      style="text-decoration: none; font-size: 0.7rem;">
                      <i class="fa-brands fa-whatsapp"></i> SOLICITAR DEVOLUÇÃO
                   </a>`
        },
        'cuidados': {
            title: 'Guia de Cuidados',
            text: `
                <div style="margin-bottom: 25px; border-bottom: 1px solid #eee; padding-bottom: 15px;">
                    <h4 style="letter-spacing: 2px; text-transform: uppercase; font-size: 0.8rem; margin-bottom: 10px; color: #000;">✨ Suas Roupas</h4>
                    <p><strong>Lavagem:</strong> Priorize lavagem à mão. Para máquinas, use sacos protetores e ciclo delicado.</p>
                    <p><strong>Secagem:</strong> Seque sempre à sombra. O sol direto danifica as fibras e desbota as cores.</p>
                    <p><strong>Tricôs:</strong> Guarde-os sempre dobrados. Jamais utilize cabides, pois o peso da peça a deforma.</p>
                </div>
                <div>
                    <h4 style="letter-spacing: 2px; text-transform: uppercase; font-size: 0.8rem; margin-bottom: 10px; color: #000;">💎 Joias e Acessórios</h4>
                    <p><strong>Perfumes e Cremes:</strong> Aplique seus cosméticos, espere secar totalmente e só então coloque suas peças.</p>
                    <p><strong>Água e Umidade:</strong> Retire as joias antes de tomar banho, entrar na piscina ou no mar.</p>
                    <p><strong>Armazenamento:</strong> Guarde cada peça individualmente em locais secos e macios para evitar riscos.</p>
                    <p><strong>Limpeza:</strong> Use apenas uma flanela macia e seca após o uso para remover resíduos da pele.</p>
                </div>
            `
        },
    };

    if (info[topic]) {
        title.innerText = info[topic].title;
        content.innerHTML = info[topic].text;
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
}

// Função para fechar o modal (Funciona para o X, para o botão Entendi e para o clique fora)
window.closeHelpModal = function(event) {
    const modal = document.getElementById('help-modal');
    
    // Se não houver evento (clique no botão), ou se o clique for no overlay, ou no X
    if (!event || event.target === modal || event.target.closest('.modal-close') || event.target.closest('.modal-add-btn')) {
        modal.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
}

function renderCategoryShowcases() {
    const container = document.getElementById('category-showcases');
    if (!container) return;
    
    // Criamos a estrutura do carrossel de vitrines se não existir
    container.innerHTML = `
        <div class="showcases-outer-wrapper">
            <button class="showcase-main-nav prev" onclick="scrollShowcases(-1)">❮</button>
            <div class="showcases-inner-track" id="showcases-track"></div>
            <button class="showcase-main-nav next" onclick="scrollShowcases(1)">❯</button>
        </div>
    `;

    const track = document.getElementById('showcases-track');
    if (!window.products || window.products.length === 0) return;

    const categories = [...new Set(window.products.map(p => p.category))].filter(c => c);

    categories.forEach(categoryName => {
        const catProducts = window.products.filter(p => p.category === categoryName);
        if (catProducts.length === 0) return;

        const section = document.createElement('div');
        section.className = 'showcase-container';
        const safeId = categoryName.toString().toLowerCase().replace(/[^a-z0-9]/g, '-');
        
        section.innerHTML = `
            <h3 class="showcase-title">${categoryName.toUpperCase()}</h3>
            <div class="mini-slider-wrapper" id="wrapper-${safeId}">
                <button class="mini-nav prev" onclick="event.stopPropagation(); changeMiniSlide('${safeId}', -1)">❮</button>
                <button class="mini-nav next" onclick="event.stopPropagation(); changeMiniSlide('${safeId}', 1)">❯</button>
                <div class="mini-slides-container">
                    ${catProducts.map((p, index) => `
                        <div class="mini-item ${index === 0 ? 'active' : ''}" onclick="openProductModal('${p.id}')">
                            <img src="${(p.imageList && p.imageList[0]) ? p.imageList[0] : ''}" alt="${p.name}">
                            <h4>${p.name.toUpperCase()}</h4>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        track.appendChild(section);

        // --- NOVA LÓGICA DE ZOOM SUAVE (ESTILO VITRINE PRINCIPAL) ---
        const wrapper = section.querySelector('.mini-slider-wrapper');
        
        wrapper.addEventListener('mousemove', (e) => {
            // Apenas aplica o efeito em telas maiores que mobile
            if (window.innerWidth > 768) {
                const activeItem = wrapper.querySelector('.mini-item.active img');
                if (!activeItem) return;

                const rect = wrapper.getBoundingClientRect();
                const x = ((e.clientX - rect.left) / rect.width) * 100;
                const y = ((e.clientY - rect.top) / rect.height) * 100;

                // Ajusta o ponto de origem e amplia
                activeItem.style.transformOrigin = `${x}% ${y}%`;
                activeItem.style.transform = "scale(1.8)"; // 1.8x é o equilíbrio perfeito para mini vitrines
            }
        });

        wrapper.addEventListener('mouseleave', () => {
            const activeItem = wrapper.querySelector('.mini-item.active img');
            if (activeItem) {
                activeItem.style.transform = "scale(1)";
                activeItem.style.transformOrigin = "center center";
            }
        });
        // ----------------------------------------------------------

        let timer = setInterval(() => changeMiniSlide(safeId, 1), 6000);
        section.dataset.timerId = timer;
    });
}

// Função para rolar o carrossel de vitrines (Categorias)
window.scrollShowcases = (direction) => {
    const track = document.getElementById('showcases-track');
    const scrollAmount = track.clientWidth * 0.8; // Rola 80% da tela
    track.scrollBy({
        left: direction * scrollAmount,
        behavior: 'smooth'
    });
};

// Nova função global para controlar as setinhas das vitrines
window.changeMiniSlide = (safeId, direction) => {
    const wrapper = document.getElementById(`wrapper-${safeId}`);
    const slides = wrapper.querySelectorAll('.mini-item');
    let currentIndex = Array.from(slides).findIndex(s => s.classList.contains('active'));

    slides[currentIndex].classList.remove('active');
    currentIndex = (currentIndex + direction + slides.length) % slides.length;
    slides[currentIndex].classList.add('active');

    // Reset do timer automático para não pular logo após o clique manual
    const parent = wrapper.closest('.showcase-container');
    clearInterval(parent.dataset.timerId);
    parent.dataset.timerId = setInterval(() => {
        changeMiniSlide(safeId, 1);
    }, 6000);
};

// --- CONFIGURAÇÃO FINAL DE EXPORTAÇÕES E NAVEGAÇÃO ---

// Lógica corrigida para o botão "Voltar para Vitrines"
const backToTopBtn = document.getElementById('back-to-top');

if (backToTopBtn) {
    // 1. Faz o botão levar para a seção de vitrines e não para o topo
    backToTopBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const targetSection = document.getElementById('category-showcases');
        if (targetSection) {
            const offset = 80; // Espaço para não colar no topo
            const elementPosition = targetSection.getBoundingClientRect().top + window.pageYOffset;
            const offsetPosition = elementPosition - offset;

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        }
    });

    // 2. Controla a visibilidade do botão conforme o scroll
    window.addEventListener('scroll', () => {
        if (window.scrollY > 600) {
            backToTopBtn.style.opacity = "1";
            backToTopBtn.style.visibility = "visible";
        } else {
            backToTopBtn.style.opacity = "0";
            backToTopBtn.style.visibility = "hidden";
        }
    });
}

// Exportações globais para o index.html
window.renderCategoryShowcases = renderCategoryShowcases;
window.openProductModal = openProductModal;
window.changeSlide = changeSlide;
window.toggleMainFilter = toggleMainFilter;
window.toggleSubFilter = toggleSubFilter;
window.addToCart = addToCart;
window.removeFromCart = removeFromCart;
window.toggleCart = toggleCart;
window.checkoutWhatsApp = checkoutWhatsApp;
window.closeProductModal = closeProductModal;
window.openHelpModal = openHelpModal;
window.closeHelpModal = closeHelpModal;