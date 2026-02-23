// Recupera a sacola salva na memória do navegador, ou cria uma nova vazia
let cart = JSON.parse(localStorage.getItem('aleMaisonCart')) || [];

document.addEventListener('DOMContentLoaded', () => {
    updateCartUI();
});

window.removeFromCart = function(index) {
    cart.splice(index, 1);
    updateCartUI();
};

// Nova função: Aumentar ou diminuir a quantidade
window.changeQuantity = function(index, delta) {
    if (!cart[index].quantity) cart[index].quantity = 1;
    cart[index].quantity += delta;
    
    // Se a quantidade chegar a zero, remove o item da sacola
    if (cart[index].quantity <= 0) {
        cart.splice(index, 1);
    }
    updateCartUI();
};

function updateCartUI() {
    // Salva o estado atual da sacola no celular/computador do cliente
    localStorage.setItem('aleMaisonCart', JSON.stringify(cart));

    const cartItemsContainer = document.getElementById('cart-items');
    const cartCount = document.getElementById('cart-count');
    const cartTotal = document.getElementById('cart-total');
    const checkoutContainer = document.querySelector('.checkout-container');

    cartItemsContainer.innerHTML = '';
    let total = 0;
    let countItems = 0;

    // SE A SACOLA ESTIVER VAZIA:
    if (cart.length === 0) {
        cartItemsContainer.innerHTML = `
            <div class="empty-cart-msg">
                <i class="fa-solid fa-bag-shopping" style="font-size: 3rem; color: #eee; margin-bottom: 15px;"></i>
                <h3 style="font-size: 1rem; text-transform: uppercase; letter-spacing: 2px;">Sacola Vazia</h3>
                <p style="font-size: 0.8rem; color: #888; margin-top: 10px;">Sua seleção exclusiva aparecerá aqui.</p>
            </div>
        `;
        if (checkoutContainer) checkoutContainer.style.display = 'none';
    } 
    // SE TIVER ITENS:
    else {
        if (checkoutContainer) checkoutContainer.style.display = 'block';
        
        cart.forEach((item, index) => {
            let qty = item.quantity || 1;
            total += item.price * qty;
            countItems += qty;
            
            let details = [];
            if (item.selectedSize) details.push(`Tam: ${item.selectedSize}`);
            if (item.selectedColor) details.push(`Cor: ${item.selectedColor}`);
            const detailsHtml = details.length > 0 ? `<small style="color:#666; display:block; margin-bottom:5px;">${details.join(' | ')}</small>` : '';

            const itemElement = document.createElement('div');
            itemElement.className = 'cart-item';
            itemElement.innerHTML = `
                <img src="${item.imageList[0]}" alt="${item.name}">
                <div class="cart-item-info">
                    <h4>${item.name}</h4>
                    ${detailsHtml}
                    <p style="font-weight:bold;">R$ ${item.price.toFixed(2).replace('.', ',')}</p>
                    
                    <div class="cart-qty-controls">
                        <button onclick="changeQuantity(${index}, -1)">-</button>
                        <span>${qty}</span>
                        <button onclick="changeQuantity(${index}, 1)">+</button>
                        <a href="#" onclick="removeFromCart(${index})" style="color:red; font-size:0.75rem; margin-left:15px; text-decoration:none;">Remover</a>
                    </div>
                </div>
            `;
            cartItemsContainer.appendChild(itemElement);
        });
    } // <-- Era essa chave de fechamento do "else" que estava faltando!

    cartCount.innerText = countItems;
    cartTotal.innerText = `R$ ${total.toFixed(2).replace('.', ',')}`;
}

window.toggleCart = function() {
    const sidebar = document.getElementById('cart-sidebar');
    const overlay = document.getElementById('overlay');
    sidebar.classList.toggle('open');
    overlay.classList.toggle('active');
};

window.addToCartFromModal = function(id) {
    const product = window.products.find(p => p.id == id);
    
    if(product) {
        if (product.sizes && product.sizes.length > 0 && !window.selectedSize) {
            alert("Por favor, selecione um tamanho.");
            return;
        }

        // Verifica se o MESMO produto, com a MESMA cor e tamanho já está na sacola
        const existingItemIndex = cart.findIndex(item => 
            item.id == id && 
            item.selectedSize == window.selectedSize && 
            item.selectedColor == window.selectedColor
        );

        const qtyToAdd = window.modalQuantity || 1;

        if (existingItemIndex > -1) {
            // Se já existe na sacola, soma a quantidade atual com a nova escolhida no modal
            cart[existingItemIndex].quantity = (cart[existingItemIndex].quantity || 1) + qtyToAdd;
        } else {
            // Se é um item/tamanho/cor novo, adiciona do zero com a quantidade escolhida
            const itemParaSacola = { 
                ...product,
                selectedSize: window.selectedSize || null,
                selectedColor: window.selectedColor || null,
                quantity: qtyToAdd
            };
            cart.push(itemParaSacola);
        }

        updateCartUI(); 
        window.closeProductModal(); 
        setTimeout(() => {
            window.toggleCart();
        }, 300);
    }
};

window.addToCart = function(id) {
    const product = window.products.find(p => p.id === id);
    if(product) {
        const existingItemIndex = cart.findIndex(item => item.id == id && !item.selectedSize && !item.selectedColor);
        
        if (existingItemIndex > -1) {
            cart[existingItemIndex].quantity = (cart[existingItemIndex].quantity || 1) + 1;
        } else {
            cart.push({...product, quantity: 1});
        }
        
        updateCartUI();
        window.toggleCart();
    }
};

window.checkoutWhatsApp = function() {
    if (cart.length === 0) {
        alert("Sua sacola está vazia!");
        return;
    }

    let mensagem = "Olá Ale! Gostaria de finalizar meu pedido:\n\n";
    let total = 0;

    cart.forEach((item, index) => {
        const qty = item.quantity || 1;
        const subtotal = item.price * qty;
        total += subtotal;

        mensagem += `*${index + 1}. ${item.name}*\n`;
        mensagem += `   Tamanho: ${item.selectedSize || 'N/A'}\n`;
        mensagem += `   Cor: ${item.selectedColor || 'N/A'}\n`;
        mensagem += `   Qtd: ${qty}\n`;
        mensagem += `   Subtotal: R$ ${subtotal.toLocaleString('pt-BR', {minimumFractionDigits: 2})}\n\n`;
    });

    mensagem += `*Total estimado: R$ ${total.toLocaleString('pt-BR', {minimumFractionDigits: 2})}*\n`;
    mensagem += `\nAguardo seu retorno para confirmar disponibilidade e frete!`;

    const msgEncoded = encodeURIComponent(mensagem);
    const fone = "5547933869807"; 
    const url = `https://wa.me/${fone}?text=${msgEncoded}`;

    window.open(url, '_blank');
};