let cart = [];

window.removeFromCart = function(index) {
    cart.splice(index, 1);
    updateCartUI();
};

function updateCartUI() {
    const cartItemsContainer = document.getElementById('cart-items');
    const cartCount = document.getElementById('cart-count');
    const cartTotal = document.getElementById('cart-total');

    cartItemsContainer.innerHTML = '';
    let total = 0;

    cart.forEach((item, index) => {
        total += item.price;
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

        const itemParaSacola = { 
            ...product,
            selectedSize: window.selectedSize || null,
            selectedColor: window.selectedColor || null
        };

        cart.push(itemParaSacola);
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
        cart.push(product);
        updateCartUI();
        window.toggleCart();
    }
};

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
        mensagem += `   Tamanho: ${item.selectedSize || 'N/A'}\n`;
        mensagem += `   Cor: ${item.selectedColor || 'N/A'}\n`;
        mensagem += `   Qtd: ${item.quantity || 1}\n`;
        mensagem += `   Valor: R$ ${subtotal.toLocaleString('pt-BR', {minimumFractionDigits: 2})}\n\n`;
    });

    mensagem += `*Total estimado: R$ ${total.toLocaleString('pt-BR', {minimumFractionDigits: 2})}*\n`;
    mensagem += `\nAguardo seu retorno para confirmar disponibilidade e frete!`;

    const msgEncoded = encodeURIComponent(mensagem);
    const fone = "5547933869807"; 
    const url = `https://wa.me/${fone}?text=${msgEncoded}`;

    window.open(url, '_blank');
};