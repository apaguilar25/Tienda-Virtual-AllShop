import {
  getData,
  KEYS,
  saveData,
} from './storage.js';

document.addEventListener('DOMContentLoaded', () => {
    // Protección estricta contra intrusos
    const session = JSON.parse(sessionStorage.getItem(KEYS.SESSION));
    if (!session || session.role !== 'admin') {
        window.location.href = 'index.html';
        return;
    }
});

window.initModule = function() {
    renderDashboard();
    setupCRUD();
};

function renderDashboard() {
    const products = getData(KEYS.PRODUCTS);
    const orders = getData(KEYS.ORDERS);
    const users = getData(KEYS.USERS);

    // 1. Calcular Ingresos Totales
    const totalRevenue = orders.reduce((acc, o) => acc + o.total, 0);
    document.getElementById('metric-revenue').textContent = `$${totalRevenue.toFixed(2)}`;

    // 2. Usuarios
    document.getElementById('metric-users').textContent = `Registrados: ${users.length} | Activos: 1`;

    // 3. Pintar Historial de Órdenes/Ventas
    const salesTable = document.getElementById('sales-table-body');
    salesTable.innerHTML = orders.map(o => `
        <tr>
            <td>#${o.id}</td>
            <td>${o.client}</td>
            <td>${o.date}</td>
            <td style="font-weight:700;">$${o.total.toFixed(2)}</td>
            <td><span style="font-size:12px; font-weight:bold; padding:4px 8px; border-radius:6px; background: rgba(0,0,0,0.05);">${o.status}</span></td>
            <td>
                <select class="ios-input select-status" data-id="${o.id}" style="padding:4px; font-size:12px; width:auto;">
                    <option value="Pendiente" ${o.status==='Pendiente'?'selected':''}>Pendiente</option>
                    <option value="Enviado" ${o.status==='Enviado'?'selected':''}>Enviado</option>
                    <option value="Entregado" ${o.status==='Entregado'?'selected':''}>Entregado</option>
                </select>
            </td>
        </tr>
    `).join('');

    // Manejar cambio de estado en vivo
    salesTable.querySelectorAll('.select-status').forEach(sel => {
        sel.addEventListener('change', (e) => {
            const oId = sel.dataset.id;
            const nuevoEstado = e.target.value;
            const todasLasOrdenes = getData(KEYS.ORDERS);
            const idx = todasLasOrdenes.findIndex(ord => ord.id == oId);
            if(idx !== -1) {
                todasLasOrdenes[idx].status = nuevoEstado;
                saveData(KEYS.ORDERS, todasLasOrdenes);
                alert('📦 Estado de envío actualizado.');
            }
        });
    });

    // 4. Renderizar Gráfico de los 3 más vendidos (Simulado en base a ítems despachados)
    const productSalesMap = {};
    orders.forEach(o => {
        o.items.forEach(item => {
            productSalesMap[item.title] = (productSalesMap[item.title] || 0) + item.qty;
        });
    });

    const sortedSales = Object.keys(productSalesMap)
        .map(title => ({ title, qty: productSalesMap[title] }))
        .sort((a,b) => b.qty - a.qty).slice(0, 3);

    const maxQty = sortedSales[0]?.qty || 1;
    const chartContainer = document.getElementById('pure-css-chart');
    
    if(sortedSales.length === 0) {
        chartContainer.innerHTML = "<p style='font-size:12px; color:var(--ios-text-secondary);'>Sin ventas registradas.</p>";
    } else {
        chartContainer.innerHTML = sortedSales.map(item => `
            <div class="chart-row">
                <span class="chart-lbl">${item.title}</span>
                <div class="chart-bar-bg">
                    <div class="chart-bar-fill" style="width: ${(item.qty / maxQty)*100}%;"></div>
                </div>
                <span style="font-weight:600;">${item.qty} u.</span>
            </div>
        `).join('');
    }
}

function setupCRUD() {
    renderInventoryTable();

    const modal = document.getElementById('product-form-modal');
    const form = document.getElementById('crud-form');

    document.getElementById('btn-open-create').addEventListener('click', () => {
        form.reset();
        document.getElementById('form-product-id').value = '';
        document.getElementById('modal-form-title').textContent = "Nuevo Producto";
        modal.classList.remove('hidden');
    });

    document.getElementById('close-form-modal').addEventListener('click', () => modal.classList.add('hidden'));

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const products = getData(KEYS.PRODUCTS);
        const id = document.getElementById('form-product-id').value;

        const pData = {
            title: document.getElementById('form-title').value,
            category: document.getElementById('form-category').value,
            price: parseFloat(document.getElementById('form-price').value),
            stock: parseInt(document.getElementById('form-stock').value),
            image: document.getElementById('form-image').value,
            description: document.getElementById('form-description').value,
            reviews: []
        };

        if(id) {
            // OPERACIÓN: UPDATE
            const idx = products.findIndex(p => p.id == id);
            pData.id = parseInt(id);
            pData.reviews = products[idx].reviews; // Preservar reseñas viejas
            products[idx] = pData;
            alert('✏️ Producto editado con éxito.');
        } else {
            // OPERACIÓN: CREATE
            pData.id = Date.now();
            products.push(pData);
            alert('✨ Producto añadido al inventario local.');
        }

        saveData(KEYS.PRODUCTS, products);
        modal.classList.add('hidden');
        renderDashboard();
    });
}

function renderInventoryTable() {
    const products = getData(KEYS.PRODUCTS);
    const tbody = document.getElementById('inventory-table-body');

    tbody.innerHTML = products.map(p => `
        <tr>
            <td><img src="${p.image}"></td>
            <td><strong>${p.title.substring(0,25)}...</strong></td>
            <td>${p.category}</td>
            <td>$${p.price.toFixed(2)}</td>
            <td>${p.stock}</td>
            <td>
                <button class="ios-btn btn-edit" data-id="${p.id}" style="padding:4px 10px; font-size:11px; margin-right:5px;">Editar</button>
                <button class="ios-btn btn-delete" data-id="${p.id}" style="padding:4px 10px; font-size:11px; background-color:var(--ios-danger); color:white;">Eliminar</button>
            </td>
        </tr>
    `).join('');

    // Manejar Edición (Carga datos al modal)
    tbody.querySelectorAll('.btn-edit').forEach(btn => {
        btn.addEventListener('click', () => {
            const p = products.find(prod => prod.id == btn.dataset.id);
            document.getElementById('form-product-id').value = p.id;
            document.getElementById('form-title').value = p.title;
            document.getElementById('form-category').value = p.category;
            document.getElementById('form-price').value = p.price;
            document.getElementById('form-stock').value = p.stock;
            document.getElementById('form-image').value = p.image;
            document.getElementById('form-description').value = p.description;
            
            document.getElementById('modal-form-title').textContent = "Editar Producto";
            document.getElementById('product-form-modal').classList.remove('hidden');
        });
    });

    // Manejar Eliminación (DELETE)
    tbody.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', () => {
            if(confirm('🗑️ ¿Estás completamente seguro de eliminar este producto?')) {
                let filtrados = products.filter(prod => prod.id != btn.dataset.id);
                saveData(KEYS.PRODUCTS, filtrados);
                renderDashboard();
            }
        });
    });
}