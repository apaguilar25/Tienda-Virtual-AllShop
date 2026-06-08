import { initializeShell } from '../global.js';
import { Auth } from '../modules/auth.js';
import { Cart } from '../modules/cart.js';
import { Catalog } from '../modules/catalog.js';

document.addEventListener('DOMContentLoaded', async () => {
    initializeShell();
    await Catalog.loadFromAPI();
    renderStore();

    document.getElementById('search-box').addEventListener('input', renderStore);
    document.getElementById('cat-filter').addEventListener('change', renderStore);
    document.getElementById('price-filter').addEventListener('change', renderStore);

    function renderStore() {
        const grid = document.getElementById('store-grid');
        const sVal = document.getElementById('search-box').value.toLowerCase();
        const cVal = document.getElementById('cat-filter').value;
        const pVal = document.getElementById('price-filter').value;

        let data = Catalog.getAll();

        // Rellenar selector de categorías por primera vez
        const catSelect = document.getElementById('cat-filter');
        if (catSelect.options.length === 1) {
            const categories = [...new Set(data.map(i => i.category))];
            categories.forEach(c => {
                const op = document.createElement('option');
                op.value = c; op.textContent = c; catSelect.appendChild(op);
            });
        }

        grid.innerHTML = '';
        
        const filtered = data.filter(item => {
            const matchSearch = item.title.toLowerCase().includes(sVal);
            const matchCat = (cVal === 'all' || item.category === cVal);
            let matchPrice = true;
            if (pVal === 'low') matchPrice = item.price <= 50;
            if (pVal === 'mid') matchPrice = item.price > 50 && item.price <= 100;
            if (pVal === 'high') matchPrice = item.price > 100;
            return matchSearch && matchCat && matchPrice;
        });

        filtered.forEach(p => {
            const card = document.createElement('div');
            card.className = 'card-product';

            const wrap = document.createElement('div');
            wrap.className = 'img-container';
            const img = document.createElement('img');
            img.src = p.image;
            wrap.appendChild(img);

            const title = document.createElement('div');
            title.className = 'title-product';
            title.textContent = p.title;

            const price = document.createElement('div');
            price.className = 'price-product';
            price.textContent = `$${p.price.toFixed(2)}`;

            const btnBuy = document.createElement('button');
            btnBuy.className = 'btn-prime';
            btnBuy.style.padding = '8px';
            btnBuy.style.fontSize = '13px';
            btnBuy.textContent = "Añadir";
            btnBuy.addEventListener('click', () => {
                Cart.add(p);
                renderBag();
            });

            // Sección Feedback
            const feed = document.createElement('div');
            feed.style.marginTop = '10px';
            const score = document.createElement('span');
            score.style.fontSize = '12px';
            const revCount = p.reviews ? p.reviews.length : 0;
            score.textContent = `★ ${revCount > 0 ? (p.reviews.reduce((acc, r) => acc + r.rating, 0) / revCount).toFixed(1) : "5.0"} (${revCount})`;
            
            const btnOp = document.createElement('button');
            btnOp.className = 'nav-btn';
            btnOp.style.fontSize = '12px';
            btnOp.style.display = 'block';
            btnOp.textContent = "Opinar";
            btnOp.addEventListener('click', () => {
                const note = prompt("Puntuación de 1 a 5:");
                const msg = prompt("Escribe tu reseña:");
                if(note && msg) {
                    Catalog.addReview(p.id, note, msg);
                    renderStore();
                }
            });

            feed.appendChild(score);
            feed.appendChild(btnOp);

            card.appendChild(wrap);
            card.appendChild(title);
            card.appendChild(price);
            card.appendChild(btnBuy);
            card.appendChild(feed);
            grid.appendChild(card);
        });
    }

    function renderBag() {
        const list = document.getElementById('bag-list');
        list.innerHTML = '';
        
        Cart.content().forEach(item => {
            const row = document.createElement('div');
            row.style.padding = '12px';
            row.style.borderBottom = '0.5px solid var(--border-color)';
            row.style.display = 'flex';
            row.style.justifyContent = 'space-between';

            const name = document.createElement('span');
            name.textContent = `${item.title.substring(0,20)}... (x${item.quantity})`;
            
            const ctrl = document.createElement('div');
            const bLess = document.createElement('button');
            bLess.className = 'nav-btn'; bLess.textContent = " - ";
            bLess.addEventListener('click', () => { Cart.updateQty(item.id, -1); renderBag(); });
            
            const bMore = document.createElement('button');
            bMore.className = 'nav-btn'; bMore.textContent = " + ";
            bMore.style.marginLeft = '10px';
            bMore.addEventListener('click', () => { Cart.add(item); renderBag(); });

            ctrl.appendChild(bLess);
            ctrl.appendChild(bMore);
            row.appendChild(name);
            row.appendChild(ctrl);
            list.appendChild(row);
        });

        const dataBill = Cart.getBill();
        document.getElementById('bag-sub').textContent = `$${dataBill.sub.toFixed(2)}`;
        document.getElementById('bag-tot').textContent = `$${dataBill.tot.toFixed(2)}`;
    }

    document.getElementById('pay-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const u = Auth.getUser();
        if (!u) {
            alert("Se requiere autenticación activa.");
            window.location.href = "cuenta.html";
            return;
        }
        if (Cart.content().length === 0) return alert("Bolsa vacía.");
        
        const mode = Cart.checkout(u.email);
        alert(mode === "synchronized" ? "Operación de pago autorizada." : "Sin red. Registro preservado localmente.");
        renderBag();
        e.target.reset();
    });
});