import { initializeShell } from '../global.js';
import { AdminLogic } from '../modules/admin.js';
import { Auth } from '../modules/auth.js';
import { Catalog } from '../modules/catalog.js';
import { Storage } from '../storage.js';

document.addEventListener('DOMContentLoaded', () => {
    // Protección de Ruta (Seguridad)
    const user = Auth.getUser();
    if (!user || user.role !== 'admin') {
        alert("Acceso denegado. Se requiere cuenta de Administrador.");
        window.location.href = "index.html";
        return;
    }

    initializeShell();
    renderMetrics();

    // Navegación de Subsecciones Administrativas
    const bMet = document.getElementById('show-metrics');
    const bCrud = document.getElementById('show-crud');
    const bSal = document.getElementById('show-sales');
    const sMet = document.getElementById('sec-metrics');
    const sCrud = document.getElementById('sec-crud');
    const sSal = document.getElementById('sec-sales');

    bMet.addEventListener('click', () => { toggleSection(bMet, sMet); renderMetrics(); });
    bCrud.addEventListener('click', () => { toggleSection(bCrud, sCrud); renderInventory(); });
    bSal.addEventListener('click', () => { toggleSection(bSal, sSal); renderSales(); });

    function toggleSection(activeBtn, activeSec) {
        [bMet, bCrud, bSal].forEach(b => b.classList.remove('active'));
        [sMet, sCrud, sSal].forEach(s => s.style.display = 'none');
        activeBtn.classList.add('active');
        activeSec.style.display = 'block';
    }

    // Modal Controladores (Corregido problema de bloqueo inicial)
    const overlay = document.getElementById('crud-modal');
    document.getElementById('open-crud-modal').addEventListener('click', () => {
        document.getElementById('crud-form').reset();
        document.getElementById('prod-id').value = '';
        document.getElementById('modal-action-title').textContent = "Nuevo Registro";
        overlay.classList.add('open');
    });

    document.getElementById('close-crud-modal').addEventListener('click', () => {
        overlay.classList.remove('open');
    });

    // Operaciones Analíticas
    function renderMetrics() {
        document.getElementById('total-revenue-text').textContent = `$${AdminLogic.compileRevenue().toFixed(2)}`;
        const uList = Storage.get('users') || [];
        document.getElementById('total-users-text').textContent = `${uList.length} / ${uList.length}`;

        const top3 = AdminLogic.getTopThree();
        const container = document.getElementById('graphics-bars-container');
        container.innerHTML = '';

        if(top3.length === 0) {
            container.textContent = "Sin transacciones registradas.";
            return;
        }

        const max = top3[0][1];
        top3.forEach(([title, qty]) => {
            const pCent = (qty / max) * 100;
            const block = document.createElement('div');
            block.className = 'bar-row';
            
            const label = document.createElement('div');
            label.style.fontSize = '12px';
            label.textContent = `${title.substring(0, 25)}... (${qty} u.)`;

            const track = document.createElement('div');
            track.className = 'bar-track';
            const fill = document.createElement('div');
            fill.className = 'bar-fill';
            
            track.appendChild(fill);
            block.appendChild(label);
            block.appendChild(track);
            container.appendChild(block);

            setTimeout(() => { fill.style.width = `${pCent}%`; }, 50);
        });
    }

    // Operaciones CRUD
    function renderInventory() {
        const box = document.getElementById('crud-list-container');
        box.innerHTML = '';
        const data = Catalog.getAll();

        data.forEach(p => {
            const row = document.createElement('div');
            row.style.padding = '12px';
            row.style.borderBottom = '0.5px solid var(--border-color)';
            row.style.display = 'flex';
            row.style.justifyContent = 'space-between';

            const txt = document.createElement('span');
            txt.textContent = p.title.substring(0,30) + "...";

            const wrapBtns = document.createElement('div');
            const bEdit = document.createElement('button');
            bEdit.className = 'nav-btn'; bEdit.textContent = "✍️";
            bEdit.addEventListener('click', () => {
                document.getElementById('prod-id').value = p.id;
                document.getElementById('prod-title').value = p.title;
                document.getElementById('prod-price').value = p.price;
                document.getElementById('prod-category').value = p.category;
                document.getElementById('prod-image').value = p.image;
                document.getElementById('modal-action-title').textContent = "Modificar Artículo";
                overlay.classList.add('open');
            });

            const bDel = document.createElement('button');
            bDel.className = 'nav-btn'; bDel.textContent = "🗑️"; bDel.style.color = 'red'; bDel.style.marginLeft = '10px';
            bDel.addEventListener('click', () => {
                if(confirm("¿Eliminar producto?")) {
                    const filtered = Catalog.getAll().filter(item => item.id != p.id);
                    Catalog.save(filtered);
                    renderInventory();
                }
            });

            wrapBtns.appendChild(bEdit);
            wrapBtns.appendChild(bDel);
            row.appendChild(txt);
            row.appendChild(wrapBtns);
            box.appendChild(row);
        });
    }

    document.getElementById('crud-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const id = document.getElementById('prod-id').value;
        const currentList = Catalog.getAll();

        const payload = {
            id: id ? Number(id) : Date.now(),
            title: document.getElementById('prod-title').value,
            price: Number(document.getElementById('prod-price').value),
            category: document.getElementById('prod-category').value,
            image: document.getElementById('prod-image').value,
            reviews: id ? (currentList.find(x => x.id == id).reviews || []) : []
        };

        if (id) {
            const idx = currentList.findIndex(x => x.id == id);
            currentList[idx] = payload;
        } else {
            currentList.push(payload);
        }

        Catalog.save(currentList);
        overlay.classList.remove('open');
        renderInventory();
    });

    // Gestión del Historial de Ventas
    function renderSales() {
        const box = document.getElementById('sales-list-container');
        box.innerHTML = '';
        const orders = Storage.get('orders') || [];

        orders.forEach(o => {
            const block = document.createElement('div');
            block.style.padding = '12px';
            block.style.borderBottom = '0.5px solid var(--border-color)';

            const info = document.createElement('div');
            info.style.fontSize = '13px';
            info.textContent = `Ref: #${o.id} | Comprador: ${o.user} | Total: $${o.total.toFixed(2)}`;

            const select = document.createElement('select');
            select.className = 'pill-selector';
            select.style.marginTop = '6px';
            ['Pendiente', 'Enviado', 'Entregado'].forEach(st => {
                const opt = document.createElement('option');
                opt.value = st; opt.textContent = st;
                if(o.status === st) opt.selected = true;
                select.appendChild(opt);
            });

            select.addEventListener('change', () => {
                const all = Storage.get('orders') || [];
                const matched = all.find(x => x.id == o.id);
                if(matched) matched.status = select.value;
                Storage.set('orders', all);
                alert("Estado de logística actualizado.");
            });

            block.appendChild(info);
            block.appendChild(select);
            box.appendChild(block);
        });
    }
});