import { db, collection, getDocs } from '../firebase-config.js';
import './cart.js';
import './modals.js';
import './carousels.js';

window.products = [];
let activeMainFilters = [];
let activeSubFilters = [];

document.addEventListener('DOMContentLoaded', async () => {
    const grid = document.getElementById('product-grid');
    grid.innerHTML = '<p style="text-align:center; padding: 20px;">Carregando coleção...</p>';

    try {
        const querySnapshot = await getDocs(collection(db, "produtos"));
        const loadedProducts = [];
        querySnapshot.forEach((doc) => {
            let data = doc.data();
            data.category = data.category ? data.category.toLowerCase() : 'outros';
            data.subcategory = data.subcategory ? data.subcategory.toLowerCase() : '';
            
            if (data.images && Array.isArray(data.images)) {
                data.imageList = data.images;
            } else if (data.image) {
                data.imageList = [data.image];
            } else {
                data.imageList = ["https://via.placeholder.com/300"];
            }

            loadedProducts.push({ id: doc.id, ...data });
        });

        window.products = loadedProducts; 

        renderMainMenu();
        renderProducts(window.products);
        
        if (typeof window.renderCategoryShowcases === 'function') {
            window.renderCategoryShowcases();
        }
        
        const exclusivos = window.products.filter(p => p.exclusive === true);
        window.initExclusiveCarousel(exclusivos);

    } catch (error) {
        console.error("Erro:", error);
        grid.innerHTML = '<p style="text-align:center;">Erro ao carregar a loja.</p>';
    }

    const backToTopBtn = document.getElementById('back-to-top');
    if (backToTopBtn) {
        backToTopBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const targetSection = document.getElementById('category-showcases');
            if (targetSection) {
                const offsetPosition = targetSection.getBoundingClientRect().top + window.pageYOffset - 80;
                window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
            }
        });

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
        card.onclick = () => window.openProductModal(product.id);
        
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

        const seloExclusivo = product.exclusive ? `<span class="exclusive-badge">Seleção Exclusive</span>` : '';

        card.innerHTML = `
            <div class="image-container">
                ${seloExclusivo}
                <img src="${product.imageList[0]}" class="product-image" alt="${product.name}">
            </div>
            <div class="product-info">
                <h3>${product.name}</h3>
                ${priceHtml}
                <button class="add-btn" onclick="event.stopPropagation(); window.openProductModal(String('${product.id}'))">VER DETALHES</button>
            </div>
        `;
        
        grid.appendChild(card);

        const imgContainer = card.querySelector('.image-container');
        const img = card.querySelector('.product-image');

        imgContainer.addEventListener('mousemove', (e) => {
            if (window.innerWidth > 768) {
                const rect = imgContainer.getBoundingClientRect();
                const x = ((e.clientX - rect.left) / rect.width) * 100;
                const y = ((e.clientY - rect.top) / rect.height) * 100;
                img.style.transformOrigin = `${x}% ${y}%`;
                img.style.transform = "scale(1.8)"; 
            }
        });

        imgContainer.addEventListener('mouseleave', () => {
            img.style.transform = "scale(1)";
            img.style.transformOrigin = "center center";
        });
    });
}

function renderMainMenu() {
    const menuContainer = document.getElementById('main-menu');
    const uniqueCategories = [...new Set(window.products.map(p => p.category))];
    menuContainer.innerHTML = ''; 

    uniqueCategories.forEach(cat => {
        const btn = document.createElement('button');
        btn.className = 'filter-btn';
        btn.id = `btn-${cat.replace(/\s+/g, '-')}`; 
        btn.innerText = cat.charAt(0).toUpperCase() + cat.slice(1); 
        btn.onclick = () => window.toggleMainFilter(cat);
        menuContainer.appendChild(btn);
    });

    const clearBtn = document.createElement('button');
    clearBtn.className = 'filter-btn';
    clearBtn.title = "Limpar Filtros";
    clearBtn.style = "color: #ccc;";
    clearBtn.innerHTML = '<i class="fa-solid fa-filter-circle-xmark"></i>';
    clearBtn.onclick = () => window.toggleMainFilter('todos');
    menuContainer.appendChild(clearBtn);
}

function renderSubMenu() {
    const subContainer = document.getElementById('sub-filters');
    if (!subContainer) return;

    if (activeMainFilters.length === 0) {
        subContainer.style.display = 'none';
        subContainer.innerHTML = '';
        activeSubFilters = []; 
        return;
    }

    const relevantProducts = window.products.filter(p => activeMainFilters.includes(p.category));
    const uniqueSubcats = [...new Set(relevantProducts.map(p => p.subcategory))].filter(sub => sub !== '');

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
        btn.innerText = sub.toUpperCase(); 
        btn.onclick = () => window.toggleSubFilter(sub);
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
    clearBtn.onclick = window.clearSubFilters;
    subContainer.appendChild(clearBtn);
}

window.toggleMainFilter = function(category) {
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
};

function updateMainButtonsUI() {
    document.querySelectorAll('.categories .filter-btn').forEach(btn => btn.classList.remove('active'));
    activeMainFilters.forEach(cat => {
        const btn = document.getElementById(`btn-${cat.replace(/\s+/g, '-')}`);
        if (btn) btn.classList.add('active');
    });
}

window.toggleSubFilter = function(sub) {
    const index = activeSubFilters.indexOf(sub);
    if (index > -1) activeSubFilters.splice(index, 1);
    else activeSubFilters.push(sub);
    
    document.querySelectorAll('.sub-btn').forEach(btn => {
        if (btn.innerText.toLowerCase() === sub) btn.classList.toggle('active');
    });
    applyFilters();
};

window.clearSubFilters = function() {
    activeSubFilters = [];
    document.querySelectorAll('.sub-btn').forEach(btn => btn.classList.remove('active'));
    applyFilters();
};

function applyFilters() {
    let filtered = window.products;
    if (activeMainFilters.length > 0) filtered = filtered.filter(p => activeMainFilters.includes(p.category));
    if (activeSubFilters.length > 0) filtered = filtered.filter(p => activeSubFilters.includes(p.subcategory));
    renderProducts(filtered);
}