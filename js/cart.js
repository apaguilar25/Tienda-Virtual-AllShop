import { renderCatalog } from './catalog.js';
import {
  getData,
  KEYS,
  saveData,
} from './storage.js';

let cart = [];

document.addEventListener('DOMContentLoaded', () => {
    setupCartUI();
});

function setupCartUI() {
    const btnToggle = document.getElementById('cart-toggle-btn');
    const modalCart = document.getElementById('cart-modal');
    const btnClose = document.getElementById('close-cart-modal');

    if(!btnToggle) return;

    btnToggle.addEventListener('click', () => {
        renderCartItems();
        modalCart.classList.remove('hidden');
    });

    btnClose.addEventListener('click', () => modalCart.classList.add('hidden'));

    // Delegar clics de agregar al carrito en el catálogo
    const catalogContainer = document.getElementById('catalog-products-container');
    if(catalogContainer) {
        catalogContainer.addEventListener('click', (e) => {
            if(e.target.classList.contains('btn-add-cart')) {
                addToCart(e.target.dataset.id);
            }
        });
    }

    // Checkout Submit
    document.getElementById('checkout-form').addEventListener('submit', procesarCheckout);
}

function addToCart(id) {
    const products = getData(KEYS.PRODUCTS);
    const p = products.find(prod => prod.id == id);

    if (p.stock <= 0) {
        alert("❌ Lo sentimos, no queda stock disponible.");
        return;
    }

    const itemEnCarro = cart.find(item => item.id == id);
    if(itemEnCarro) {
        if(itemEnCarro.qty < p.stock) {
            itemEnCarro.qty++;
        } else {
            alert("⚠️ Límite del stock alcanzado.");
        }
    } else {
        cart.push({ ...p, qty: 1 });
    }
    actualizarBadges();
}

function actualizarBadges() {
    const count = cart.reduce((acc, current) => acc + current.qty, 0);
    document.getElementById('cart-count').textContent = count;
}

function renderCartItems() {
    const container = document.getElementById('cart-items-container');
    let subtotal = 0;

    container.innerHTML = cart.map(item => {
        const itemTotal = item.price * item.qty;
        subtotal += itemTotal;
        return `
            <div style="display:flex; justify-content:space-between; align-items:center; background:var(--ios-bg); padding:10px; border-radius:10px; margin-bottom:10px;">
                <div style="text-align:left;">
                    <h5 style="margin:0;">${item.title.substring(0,25)}...</h5>
                    <span style="font-size:13px; font-weight:bold;">$${item.price}</span>
                </div>
                <div style="display:flex; gap:8px; align-items:center;">
                    <button class="ios-btn cart-qty-btn" data-id="${item.id}" data-action="sub" style="padding:2px 8px;">-</button>
                    <span>${item.qty}</span>
                    <button class="ios-btn cart-qty-btn" data-id="${item.id}" data-action="add" style="padding:2px 8px;">+</button>
                    <button class="ios-btn cart-qty-btn" data-id="${item.id}" data-action="del" style="padding:2px 8px; background-color:var(--ios-danger); color:white;">🗑️</button>
                </div>
            </div>
        `;
    }).join('');

    if(cart.length === 0) container.innerHTML = "<p style='text-align:center; color:var(--ios-text-secondary);'>El carrito está vacío.</p>";

    document.getElementById('cart-subtotal').textContent = `$${subtotal.toFixed(2)}`;
    document.getElementById('cart-total').textContent = `$${subtotal.toFixed(2)}`;

    // Listeners control cantidades
    container.querySelectorAll('.cart-qty-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.dataset.id;
            const action = btn.dataset.action;
            const item = cart.find(i => i.id == id);
            const prod = getData(KEYS.PRODUCTS).find(p => p.id == id);

            if(action === 'add') {
                if(item.qty < prod.stock) item.qty++;
                else alert("Máximo stock alcanzado.");
            } else if (action === 'sub') {
                item.qty--;
                if(item.qty <= 0) cart = cart.filter(i => i.id != id);
            } else if (action === 'del') {
                cart = cart.filter(i => i.id != id);
            }
            actualizarBadges();
            renderCartItems();
        });
    });
}

function procesarCheckout(e) {
    e.preventDefault();
    if(cart.length === 0) { alert("Tu bolsa está vacía."); return; }

    const session = JSON.parse(sessionStorage.getItem(KEYS.SESSION));
    const products = getData(KEYS.PRODUCTS);
    
    // Crear objeto de orden de compra
    const nuevaOrden = {
        id: Date.now(),
        client: session ? session.name : "Cliente Invitado",
        email: session ? session.email : "invitado@tienda.com",
        items: [...cart],
        total: cart.reduce((acc, i) => acc + (i.price * i.qty), 0),
        date: new Date().toLocaleDateString(),
        status: 'Pendiente'
    };

    // Reducir stock del inventario
    cart.forEach(item => {
        const idx = products.findIndex(p => p.id == item.id);
        if(idx !== -1) {
            products[idx].stock -= item.qty;
        }
    });
    saveData(KEYS.PRODUCTS, products);

    // Guardado diferencial en base a conectividad
    if (navigator.onLine) {
        const ordenes = getData(KEYS.ORDERS);
        ordenes.push(nuevaOrden);
        saveData(KEYS.ORDERS, ordenes);
        alert(`🛍️ ¡Compra exitosa! Código de orden: #${nuevaOrden.id}`);
    } else {
        // Almacenamiento en Cola Offline
        const cola = JSON.parse(localStorage.getItem(KEYS.OFFLINE_QUEUE)) || [];
        nuevaOrden.status = 'Pendiente (Offline)';
        cola.push(nuevaOrden);
        localStorage.setItem(KEYS.OFFLINE_QUEUE, JSON.stringify(cola));
        alert('📡 Estás fuera de línea. Tu orden se ha guardado localmente y se sincronizará automáticamente al recuperar tu conexión.');
    }

    // Reset total
    cart = [];
    actualizarBadges();
    document.getElementById('cart-modal').classList.add('hidden');
    e.target.reset();
    renderCatalog(getData(KEYS.PRODUCTS)); // Refrescar stock en pantalla
}