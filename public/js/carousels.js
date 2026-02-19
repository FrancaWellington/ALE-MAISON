let currentSlide = 0;
let carouselInterval;

window.initExclusiveCarousel = function(items) {
    const container = document.getElementById('hero-carousel');
    if (!container) return;

    if (!items || items.length === 0) {
        container.classList.add('no-slides');
        return;
    }

    items.forEach((product) => {
        const preco = product.price.toFixed(2).replace('.', ',');
        const slide = document.createElement('div');
        slide.className = 'hero-slide';
        slide.onclick = () => window.openProductModal(product.id);
        
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
    window.startAutoSlide();
};

window.startAutoSlide = function() {
    clearInterval(carouselInterval);
    carouselInterval = setInterval(() => {
        window.changeSlide(1);
    }, 5000);
};

window.changeSlide = function(direction) {
    const slides = document.querySelectorAll('.hero-slide');
    if (slides.length <= 1) return;

    slides[currentSlide].classList.remove('active');
    currentSlide = (currentSlide + direction + slides.length) % slides.length;
    slides[currentSlide].classList.add('active');

    window.startAutoSlide();
};

window.renderCategoryShowcases = function() {
    const container = document.getElementById('category-showcases');
    if (!container) return;
    
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

        const wrapper = section.querySelector('.mini-slider-wrapper');

        let timer = setInterval(() => window.changeMiniSlide(safeId, 1), 6000);
        section.dataset.timerId = timer;
    });
};

window.scrollShowcases = function(direction) {
    const track = document.getElementById('showcases-track');
    const scrollAmount = track.clientWidth * 0.8; 
    track.scrollBy({ left: direction * scrollAmount, behavior: 'smooth' });
};

window.changeMiniSlide = function(safeId, direction) {
    const wrapper = document.getElementById(`wrapper-${safeId}`);
    const slides = wrapper.querySelectorAll('.mini-item');
    let currentIndex = Array.from(slides).findIndex(s => s.classList.contains('active'));

    slides[currentIndex].classList.remove('active');
    currentIndex = (currentIndex + direction + slides.length) % slides.length;
    slides[currentIndex].classList.add('active');

    const parent = wrapper.closest('.showcase-container');
    clearInterval(parent.dataset.timerId);
    parent.dataset.timerId = setInterval(() => { window.changeMiniSlide(safeId, 1); }, 6000);
};