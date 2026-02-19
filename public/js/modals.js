window.selectedSize = null;
window.selectedColor = null;

window.openProductModal = function(id) {
    const product = window.products.find(p => p.id == id);
    if (!product) return;

    window.selectedSize = null;
    window.selectedColor = null;

    document.getElementById('modal-title').innerText = product.name;
    
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

    const pInstallments = document.querySelector('.modal-installments');
    if (product.installments > 1) {
        const valorParcela = (product.price / product.installments).toFixed(2).replace('.', ',');
        pInstallments.innerText = `ou ${product.installments}x de R$ ${valorParcela} sem juros`;
        pInstallments.style.display = 'block';
    } else {
        pInstallments.style.display = 'none';
    }

    const imgContainer = document.querySelector('.main-image-container');
    const mainImg = document.getElementById('modal-main-img');

    imgContainer.classList.remove('mobile-zoom');
    mainImg.style.transform = "scale(1)";

    imgContainer.onmousemove = (e) => {
        if (window.innerWidth > 768) {
            const { left, top, width, height } = imgContainer.getBoundingClientRect();
            // Correção: usar clientX e clientY para não sofrer interferência do scroll da página
            const x = ((e.clientX - left) / width) * 100;
            const y = ((e.clientY - top) / height) * 100;
            
            mainImg.style.transformOrigin = `${x}% ${y}%`;
            mainImg.style.transform = "scale(2.2)"; 
        }
    };

    imgContainer.onmouseleave = () => {
        if (window.innerWidth > 768) {
            mainImg.style.transform = "scale(1)";
            mainImg.style.transformOrigin = "center";
        }
    };

    imgContainer.onclick = (e) => {
        if (window.innerWidth <= 768) {
            imgContainer.classList.toggle('mobile-zoom');
        }
    };
    
    const btnAdd = document.getElementById('modal-add-btn');
    btnAdd.onclick = null; 
    btnAdd.onclick = (e) => {
        e.preventDefault();
        window.addToCartFromModal(product.id);
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
                window.selectedSize = size;
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
                window.selectedColor = color;
            };
            colorsContainer.appendChild(btn);
        });
    } else {
        document.getElementById('group-colors').style.display = 'none';
    }

    document.getElementById('product-modal').classList.add('active');
    document.body.style.overflow = 'hidden';
};

window.closeProductModal = function(event) {
    if (!event || event.target.id === 'product-modal') {
        document.getElementById('product-modal').classList.remove('active');
        document.body.style.overflow = 'auto';
    }
};

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
};

window.closeHelpModal = function(event) {
    const modal = document.getElementById('help-modal');
    if (!event || event.target === modal || event.target.closest('.modal-close') || event.target.closest('.modal-add-btn')) {
        modal.classList.remove('active');
        document.body.style.overflow = 'auto';
    }
};