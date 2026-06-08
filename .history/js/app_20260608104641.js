import { Auth } from './modules/auth.js';
import { Cart } from './modules/cart.js';
import { Catalog } from './modules/catalog.js';
import { initSyncManager } from './modules/sync.js';
import { Storage } from './storage.js';
import { initThemeControl } from './utils/theme.js';

// Para el service worker
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js')
        .then(() => console.log("Service Worker Registrado en Ecosistema Apple"))
        .catch(err => console.log("Fallo en SW", err));
}

document.addEventListener('DOMContentLoaded', async () => {
    // Inicializaciones críticas
    Storage.initData();
    initThemeControl();
    initSyncManager();
    await Catalog.fetchInitialProducts();
    updateNetworkStatus();

    // Sistema de Enrutamiento de pestañas (Tab Navigation)
    const tabs = document.querySelectorAll('.tab-item');
    tabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            const targetView = tab.getAttribute('data-view');
            switchView(targetView);
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
        });
    });

    // Control del Estado de Red
    function updateNetworkStatus() {
        const status = document.getElementById('network-status');
        if (navigator.onLine) {
            status.textContent = "● Sistema Online";
            status.style.color = "var(--ios-success)";
        } else {
            status.textContent = "● Modo Offline Autónomo";
            status.style.color = "var(--ios-text-secondary)";
        }
    }
    window.addEventListener('online', updateNetworkStatus);
    window.addEventListener('offline', updateNetworkStatus);

    // Sistema de Cambio Dinámico de Vistas
    function switchView(viewId) {
        document.querySelectorAll('.ios-view').forEach(v => v.hidden = true);
        const target = document.getElementById(viewId);
        if (target) target.hidden = false;

        // Actualizar título superior estilo iOS
        const titleMap = {
            'view-landing': 'Descubrir',
            'view-catalog': 'Buscar',
            'view-cart': 'Bolsa',
            'view-auth': 'Cuenta',
            'view-profile': 'Mi Perfil',
            'view-admin': 'Consola Admin'
        };
        document.getElementById('nav-page-title').textContent = titleMap[viewId] || 'Store';

        // Disparar lógica de renderizados de datos al entrar a la vista
        if (viewId === 'view-landing') renderLandingFeatured();
        if (viewId === 'view-catalog') renderCatalogGrid();
        if (viewId === 'view-cart') renderCart();
        if (viewId === 'view-admin') renderAdminDashboard();
    }

    // --- ACCIONES LANDING ---
    document.getElementById('cta-catalog').addEventListener('click', () => {
        switchView('view-catalog');
        document.querySelector('[data-view="view-catalog"]').click();
    });

    function renderLandingFeatured() {
        const container = document.getElementById('featured-products');
        const featured = Catalog.getAll().slice(0, 3);
        container.innerHTML = featured.map(p => `
            <div class="ios-product-card">
                <div class="prod-img-wrapper"><img src="${p.image}"></div>
                <div class="prod-info">
                    <div class="prod-title">${p.title}</div>
                    <div class="prod-price">$${p.price}</div>
                </div>
            </div>
        `).join('');
    }

    // --- FORMULARIO NEWSLETTER ---
    document.getElementById('newsletter-form').addEventListener('submit', (e) => {
        e.preventDefault();
        alert('✨ ¡Te has suscrito con éxito a las novedades Apple!');
        e.target.reset();
    });

    // --- CONTROL DE LOGIN / REGISTRO ---
    document.getElementById('tab-login').addEventListener('click', () => {
        document.getElementById('form-login').hidden = false;
        document.getElementById('form-register').hidden = true;
        document.getElementById('tab-login').classList.add('active');
        document.getElementById('tab-register').classList.remove('active');
    });

    document.getElementById('tab-register').addEventListener('click', () => {
        document.getElementById('form-login').hidden = true;
        document.getElementById('form-register').hidden = false;
        document.getElementById('tab-register').classList.add('active');
        document.getElementById('tab-login').classList.remove('active');
    });

    document.getElementById('form-register').addEventListener('submit', (e) => {
        e.preventDefault();
        const res = Auth.register(
            document.getElementById('reg-name').value,
            document.getElementById('reg-email').value,
            document.getElementById('reg-pass').value,
            document.getElementById('reg-avatar').value,
            document.getElementById('reg-address').value,
            document.getElementById('reg-role').value
        );
        if (res.success) {
            alert('Cuenta creada. Inicia sesión.');
            document.getElementById('tab-login').click();
        } else alert(res.msg);
    });

    document.getElementById('form-login').addEventListener('submit', (e) => {
        e.preventDefault();
        const res = Auth.login(document.getElementById('login-email').value, document.getElementById('login-pass').value);
        if (res.success) {
            handleSessionUI();
        } else alert(res.msg);
    });

    document.getElementById('logout-btn').addEventListener('click', () => {
        Auth.logout();
        window.location.reload();
    });

    function handleSessionUI() {
        const user = Auth.getCurrentUser();
        if (user) {
            document.getElementById('logout-btn').hidden = false;
            document.getElementById('tab-profile-nav').setAttribute('data-view', 'view-profile');
            
            // Si es Administrador habilitar pestaña
            if (user.role === 'admin') {
                document.getElementById('tab-admin-nav').hidden = false;
            }
            
            // Poblar datos de perfil
            document.getElementById('profile-name-title').textContent = user.name;
            document.getElementById('profile-avatar-img').src = user.avatar;
            document.getElementById('profile-name').value = user.name;
            document.getElementById('profile-address').value = user.address;
            document.getElementById('profile-avatar').value = user.avatar;

            switchView('view-profile');
        }
    }

    // --- ACTUALIZACIÓN DE PERFIL ---
    document.getElementById('form-profile-edit').addEventListener('submit', (e) => {
        e.preventDefault();
        Auth.updateProfile({
            name: document.getElementById('profile-name').value,
            address: document.getElementById('profile-address').value,
            avatar: document.getElementById('profile-avatar').value
        });
        alert('Perfil actualizado.');
        handleSessionUI();
    });

    // --- CATÁLOGO CLIENTE ---
    let categoriesSet = new Set();
    function renderCatalogGrid() {
        const grid = document.getElementById('catalog-grid');
        const filterCat = document.getElementById('filter-category');
        const searchVal = document.getElementById('search-input').value.toLowerCase();
        const catVal = filterCat.value;
        const priceVal = document.getElementById('filter-price').value;

        let items = Catalog.getAll();

        // Cargar Categorías en el Selector dinámicamente
        items.forEach(p => categoriesSet.add(p.category));
        if(filterCat.options.length === 1) {
            categoriesSet.forEach(c => {
                const opt = document.createElement('option');
                opt.value = c; opt.textContent = c; filterCat.appendChild(opt);
            });
        }

        // Filtros cruzados aplicados
        items = items.filter(p => {
            const matchesSearch = p.title.toLowerCase().includes(searchVal);
            const matchesCat = (catVal === 'all' || p.category === catVal);
            let matchesPrice = true;
            if (priceVal === '0-50') matchesPrice = p.price <= 50;
            if (priceVal === '50-100') matchesPrice = p.price > 50 && p.price <= 100;
            if (priceVal === '100+') matchesPrice = p.price > 100;

            return matchesSearch && matchesCat && matchesPrice;
        });

        grid.innerHTML = items.map(p => `
            <div class="ios-product-card">
                <div class="prod-img-wrapper"><img src="${p.image}"></div>
                <div class="prod-info">
                    <div class="prod-title">${p.title}</div>
                    <div class="prod-price">$${p.price}</div>
                    <button class="ios-btn-primary add-to-cart-btn" data-id="${p.id}" style="padding: 6px; font-size:12px;">+ Añadir</button>
                    
                    <div class="feedback-box" style="margin-top:8px;">
                        <span style="font-size:11px; color:var(--ios-text-secondary)">⭐ ${calcStars(p.reviews)} (${p.reviews.length})</span>
                        <button class="ios-text-btn btn-review" data-id="${p.id}" style="font-size:11px; display:block;">Opinar</button>
                    </div>
                </div>
            </div>
        `).join('');

        // Listeners delegados en la Grid
        grid.querySelectorAll('.add-to-cart-btn').forEach(b => {
            b.addEventListener('click', () => {
                const id = b.getAttribute('data-id');
                const prod = Catalog.getAll().find(p => p.id == id);
                Cart.add(prod);
                alert('Añadido a la bolsa.');
            });
        });

        grid.querySelectorAll('.btn-review').forEach(b => {
            b.addEventListener('click', () => {
                const id = b.getAttribute('data-id');
                const rating = prompt("Calificación (1-5 estrellas):", "5");
                const comment = prompt("Comentario:");
                if(rating && comment) {
                    Catalog.addReview(id, { rating: Number(rating), comment, user: 'Anónimo' });
                    renderCatalogGrid();
                }
            });
        });
    }

    function calcStars(reviews) {
        if(!reviews || reviews.length === 0) return "5.0";
        return (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1);
    }

    document.getElementById('search-input').addEventListener('input', renderCatalogGrid);
    document.getElementById('filter-category').addEventListener('change', renderCatalogGrid);
    document.getElementById('filter-price').addEventListener('change', renderCatalogGrid);

    // --- RENDERIZADO Y CONTROL DEL CARRITO ---
    function renderCart() {
        const container = document.getElementById('cart-items-list');
        const items = Cart.get();

        if(items.length === 0) {
            container.innerHTML = '<p style="padding:16px; text-align:center; color:var(--ios-text-secondary)">Bolsa vacía.</p>';
            document.getElementById('cart-subtotal').textContent = "$0.00";
            document.getElementById('cart-total').textContent = "$0.00";
            return;
        }

        container.innerHTML = items.map(i => `
            <div style="display:flex; justify-content:space-between; align-items:center; padding:12px; border-bottom:0.5px solid var(--ios-border)">
                <div style="width:60%"><div class="prod-title">${i.title}</div><div>$${i.price}</div></div>
                <div style="display:flex; align-items:center; gap:8px;">
                    <button class="ios-btn-secondary btn-qty" data-id="${i.id}" data-amt="-1" style="padding:4px 10px;">-</button>
                    <span>${i.quantity}</span>
                    <button class="ios-btn-secondary btn-qty" data-id="${i.id}" data-amt="1" style="padding:4px 10px;">+</button>
                </div>
            </div>
        `).join('');

        const totals = Cart.getTotals();
        document.getElementById('cart-subtotal').textContent = `$${totals.subtotal.toFixed(2)}`;
        document.getElementById('cart-total').textContent = `$${totals.total.toFixed(2)}`;

        container.querySelectorAll('.btn-qty').forEach(b => {
            b.addEventListener('click', () => {
                Cart.changeQty(b.getAttribute('data-id'), Number(b.getAttribute('data-amt')));
                renderCart();
            });
        });
    }

    document.getElementById('checkout-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const user = Auth.getCurrentUser();
        if(!user) {
            alert("Inicia sesión para poder realizar compras.");
            switchView('view-auth');
            return;
        }
        const res = Cart.processCheckout(user.email);
        alert(res.msg);
        renderCart();
    });

    // --- PANEL ADMINISTRATIVO (SUBVISTAS Y LOGICA METRICAS) ---
    document.getElementById('admin-tab-metrics').addEventListener('click', () => toggleAdminSub('admin-sub-metrics'));
    document.getElementById('admin-tab-crud').addEventListener('click', () => toggleAdminSub('admin-sub-crud'));
    document.getElementById('admin-tab-sales').addEventListener('click', () => toggleAdminSub('admin-sub-sales'));

    function toggleAdminSub(subId) {
        document.getElementById('admin-sub-metrics').hidden = true;
        document.getElementById('admin-sub-crud').hidden = true;
        document.getElementById('admin-sub-sales').hidden = true;
        document.getElementById(subId).hidden = false;
        
        document.querySelectorAll('#view-admin .segment').forEach(s => s.classList.remove('active'));
        if(subId === 'admin-sub-metrics') document.getElementById('admin-tab-metrics').classList.add('active');
        if(subId === 'admin-sub-crud') document.getElementById('admin-tab-crud').classList.add('active');
        if(subId === 'admin-sub-sales') document.getElementById('admin-tab-sales').classList.add('active');
    }

    function renderAdminDashboard() {
        const orders = Storage.get('orders') || [];
        const users = Storage.get('users') || [];

        // Calcular Métricas
        const revenue = orders.reduce((sum, o) => sum + o.total, 0);
        document.getElementById('metric-revenue').textContent = `$${revenue.toFixed(2)}`;
        document.getElementById('metric-users').textContent = `${users.length} / ${users.length}`;

        // Top 3 Productos de Forma Pura en CSS/JS sin dependencias de gráficos
        const productCounts = {};
        orders.forEach(o => o.items.forEach(i => {
            productCounts[i.title] = (productCounts[i.title] || 0) + i.quantity;
        }));

        const top3 = Object.entries(productCounts).sort((a,b) => b[1] - a[1]).slice(0,3);
        const chart = document.getElementById('admin-chart-container');
        
        if(top3.length === 0) chart.innerHTML = '<p style="color:var(--ios-text-secondary)">Aún no hay ventas.</p>';
        else {
            const maxVal = top3[0][1];
            chart.innerHTML = top3.map(([title, qty]) => {
                const pct = (qty / maxVal) * 100;
                return `
                    <div class="chart-bar-row">
                        <div class="chart-label">${title} (${qty} u.)</div>
                        <div class="chart-track"><div class="chart-fill" style="width:${pct}%"></div></div>
                    </div>
                `;
            }).join('');
        }

        // Render CRUD List de Productos
        const crudList = document.getElementById('admin-crud-list');
        crudList.innerHTML = Catalog.getAll().map(p => `
            <div style="display:flex; justify-content:space-between; align-items:center; padding:12px; border-bottom:0.5px solid var(--ios-border)">
                <span style="font-size:14px; width:70%">${p.title} - <strong>$${p.price}</strong></span>
                <div>
                    <button class="ios-text-btn edit-prod-btn" data-id="${p.id}">✍️</button>
                    <button class="ios-text-btn del-prod-btn" data-id="${p.id}" style="color:red; margin-left:8px;">🗑️</button>
                </div>
            </div>
        `).join('');

        crudList.querySelectorAll('.del-prod-btn').forEach(b => {
            b.addEventListener('click', () => {
                Catalog.delete(b.getAttribute('data-id'));
                renderAdminDashboard();
            });
        });

        crudList.querySelectorAll('.edit-prod-btn').forEach(b => {
            b.addEventListener('click', () => {
                const p = Catalog.getAll().find(prod => prod.id == b.getAttribute('data-id'));
                document.getElementById('prod-id').value = p.id;
                document.getElementById('prod-title').value = p.title;
                document.getElementById('prod-price').value = p.price;
                document.getElementById('prod-category').value = p.category;
                document.getElementById('prod-image').value = p.image;
                document.getElementById('prod-desc').value = p.description;
                document.getElementById('ios-modal').hidden = false;
            });
        });

        // Render Historial de Ventas
        const salesList = document.getElementById('admin-sales-list');
        salesList.innerHTML = orders.map(o => `
            <div style="padding:12px; border-bottom:0.5px solid var(--ios-border)">
                <div><strong>Pedido #${o.id}</strong> - ${o.date}</div>
                <div style="font-size:13px; color:var(--ios-text-secondary)">Cliente: ${o.email} | Total: $${o.total.toFixed(2)}</div>
                <select class="ios-filter-pill change-status-select" data-id="${o.id}">
                    <option value="Pendiente" ${o.status==='Pendiente'?'selected':''}>Pendiente</option>
                    <option value="Enviado" ${o.status==='Enviado'?'selected':''}>Enviado</option>
                    <option value="Entregado" ${o.status==='Entregado'?'selected':''}>Entregado</option>
                </select>
            </div>
        `).join('');

        salesList.querySelectorAll('.change-status-select').forEach(s => {
            s.addEventListener('change', () => {
                const id = s.getAttribute('data-id');
                const allOrders = Storage.get('orders');
                const idx = allOrders.findIndex(o => o.id == id);
                if(idx !== -1) {
                    allOrders[idx].status = s.value;
                    Storage.set('orders', allOrders);
                    alert('Estado del envío actualizado de forma segura.');
                }
            });
        });
    }

    // Modal CRUD Controladores
    document.getElementById('btn-open-create').addEventListener('click', () => {
        document.getElementById('product-form').reset();
        document.getElementById('prod-id').value = '';
        document.getElementById('ios-modal').hidden = false;
    });

    document.getElementById('btn-close-modal').addEventListener('click', () => {
        document.getElementById('ios-modal').hidden = true;
    });

    document.getElementById('product-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const id = document.getElementById('prod-id').value;
        const prodData = {
            title: document.getElementById('prod-title').value,
            price: Number(document.getElementById('prod-price').value),
            category: document.getElementById('prod-category').value,
            image: document.getElementById('prod-image').value,
            description: document.getElementById('prod-desc').value
        };

        if(id) Catalog.update(id, prodData);
        else Catalog.create(prodData);

        document.getElementById('ios-modal').hidden = true;
        renderAdminDashboard();
    });

    // Iniciar Sesión en UI Inicial
    handleSessionUI();
    switchView('view-landing');
});