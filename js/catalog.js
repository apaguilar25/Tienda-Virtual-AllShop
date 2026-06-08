import {
  getData,
  KEYS,
  saveData,
} from './storage.js';

let activeProducts = [];

window.initModule = function() {
    activeProducts = getData(KEYS.PRODUCTS);
    poblarCategorias();
    renderCatalog(activeProducts);
    setupFiltros();
};

function poblarCategorias() {
    const selector = document.getElementById('category-filter');
    const categories = [...new Set(activeProducts.map(p => p.category))];
    categories.forEach(cat => {
        const opt = document.createElement('option');
        opt.value = cat; opt.textContent = cat;
        selector.appendChild(opt);
    });
}

export function renderCatalog(productsList) {
    const container = document.getElementById('catalog-products-container');
    if(!container) return;
    
    container.innerHTML = productsList.map(p => `
        <div class="ios-card product-card">
            <img src="${p.image}" alt="${p.title}">
            <h4>${p.title.substring(0, 30)}...</h4>
            <p style="color:var(--ios-text-secondary); font-size:13px; margin: 5px 0;">Stock: ${p.stock}</p>
            <p class="price" style="font-weight:700; margin-bottom:12px;">$${p.price.toFixed(2)}</p>
            <div style="display:flex; gap:5px; justify-content:center;">
                <button class="ios-btn ios-btn-primary btn-view-detail" data-id="${p.id}" style="font-size:12px; padding:6px 12px;">Detalle</button>
                <button class="ios-btn ios-btn-primary btn-add-cart" data-id="${p.id}" style="font-size:12px; padding:6px 12px; background-color:var(--ios-success)">+ 🛒</button>
            </div>
        </div>
    `).join('');

    // Listener Detalle
    container.querySelectorAll('.btn-view-detail').forEach(b => {
        b.addEventListener('click', () => abrirDetalle(b.dataset.id));
    });
}

function setupFiltros() {
    const search = document.getElementById('search-input');
    const cat = document.getElementById('category-filter');
    const price = document.getElementById('price-filter');
    const priceVal = document.getElementById('price-val');

    function aplicar() {
        priceVal.textContent = price.value;
        let original = getData(KEYS.PRODUCTS);
        
        let filtrados = original.filter(p => {
            const matchSearch = p.title.toLowerCase().includes(search.value.toLowerCase());
            const matchCat = cat.value === 'all' || p.category === cat.value;
            const matchPrice = p.price <= parseFloat(price.value);
            return matchSearch && matchCat && matchPrice;
        });
        renderCatalog(filtrados);
    }

    search.addEventListener('input', aplicar);
    cat.addEventListener('change', aplicar);
    price.addEventListener('input', aplicar);
}

function abrirDetalle(id) {
    const products = getData(KEYS.PRODUCTS);
    const p = products.find(prod => prod.id == id);
    const modal = document.getElementById('product-modal');
    const body = document.getElementById('modal-product-detail-body');

    body.innerHTML = `
        <div style="text-align:center; padding-top:20px;">
            <img src="${p.image}" style="max-height:180px; object-fit:contain; margin-bottom:15px;">
            <h2>${p.title}</h2>
            <p style="margin:10px 0; font-size:14px; color:var(--ios-text-secondary);">${p.description}</p>
            <h3>$${p.price.toFixed(2)}</h3>
        </div>
        <hr style="border:0; border-top:1px solid var(--ios-border); margin:20px 0;">
        <h3>Opiniones de Compradores</h3>
        <div id="reviews-list-box" style="margin-top:10px;">
            ${p.reviews.map(r => `
                <div style="background:var(--ios-bg); padding:10px; border-radius:8px; margin-bottom:8px;">
                    <strong>${r.user} (${'★'.repeat(r.rating)})</strong>
                    <p style="font-size:13px; margin-top:3px;">${r.comment}</p>
                </div>
            `).join('')}
        </div>
        
        <form id="feedback-form" style="display:flex; flex-direction:column; gap:8px; margin-top:15px;">
            <h4>Añadir reseña</h4>
            <div class="star-rating" id="star-selector">
                <span data-v="1">★</span><span data-v="2">★</span><span data-v="3">★</span><span data-v="4">★</span><span data-v="5">★</span>
            </div>
            <input type="text" id="review-comment" class="ios-input" placeholder="Escribe tu opinión aquí..." required>
            <button type="submit" class="ios-btn ios-btn-primary" style="font-size:13px;">Publicar Feedback</button>
        </form>
    `;

    modal.classList.remove('hidden');

    // Gestión Estrellas
    let SelectedRating = 5;
    const stars = body.querySelectorAll('#star-selector span');
    stars.forEach((s, idx) => {
        if(idx < SelectedRating) s.classList.add('active');
        s.addEventListener('click', () => {
            SelectedRating = parseInt(s.dataset.v);
            stars.forEach((st, i) => i < SelectedRating ? st.classList.add('active') : st.classList.remove('active'));
        });
    });

    // Envío Reseña
    body.getElementById('feedback-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const session = JSON.parse(sessionStorage.getItem(KEYS.SESSION));
        const userActiveName = session ? session.name : "Anónimo";
        
        const nuevaResena = {
            user: userActiveName,
            rating: SelectedRating,
            comment: body.querySelector('#review-comment').value
        };

        p.reviews.push(nuevaResena);
        const index = products.findIndex(prod => prod.id == id);
        products[index] = p;
        saveData(KEYS.PRODUCTS, products);

        alert('⭐ Gracias por tu comentario.');
        abrirDetalle(id); // Refrescar modal
    });
}

document.getElementById('close-detail-modal').addEventListener('click', () => {
    document.getElementById('product-modal').classList.add('hidden');
});