(async function () {
  const s = requireAuth("admin");
  if (!s) return;
  renderNavbar("admin"); renderFooter();
  await ensureProductsSeeded();

  const tabs = document.querySelectorAll(".tab");
  tabs.forEach(t => t.onclick = () => {
    tabs.forEach(x => x.classList.remove("active"));
    t.classList.add("active");
    ["dashboard","inventory","sales"].forEach(k => {
      document.getElementById("tab-" + k).classList.toggle("hidden", k !== t.dataset.tab);
    });
  });

  function renderDashboard() {
    const orders = DB.getOrders();
    const revenue = orders.reduce((a, o) => a + o.total, 0);
    document.getElementById("kRevenue").textContent = "$" + revenue.toFixed(2);
    document.getElementById("kOrders").textContent = orders.length;
    document.getElementById("kUsers").textContent = DB.getUsers().length;
    document.getElementById("kActive").textContent = DB.getActiveUsers();

    const counts = {};
    orders.forEach(o => o.items.forEach(i => {
      counts[i.id] = counts[i.id] || { title: i.title, qty: 0 };
      counts[i.id].qty += i.qty;
    }));
    const top = Object.values(counts).sort((a, b) => b.qty - a.qty).slice(0, 3);
    const max = top[0]?.qty || 1;
    document.getElementById("topChart").innerHTML = top.length
      ? top.map(t => `
        <div class="bar-row">
          <div style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${t.title}</div>
          <div class="bar"><span style="width:${(t.qty/max*100).toFixed(0)}%"></span></div>
          <div style="text-align:right;font-weight:700;">${t.qty}</div>
        </div>`).join("")
      : "<p class='text-muted'>Sin datos aún.</p>";
  }

  function renderInventory() {
    const products = DB.getProducts();
    document.getElementById("invBody").innerHTML = products.map(p => `
      <tr>
        <td><img src="${p.image}" alt="" style="width:48px;height:48px;object-fit:contain;background:#fff;border-radius:6px;"/></td>
        <td>${p.title}</td>
        <td>${p.category}</td>
        <td>$${p.price.toFixed(2)}</td>
        <td>${p.stock ?? "-"}</td>
        <td>
          <button class="btn btn-sm btn-secondary" data-edit="${p.id}">Editar</button>
          <button class="btn btn-sm btn-danger" data-del="${p.id}">Eliminar</button>
        </td>
      </tr>
    `).join("");
    document.querySelectorAll("[data-edit]").forEach(b => b.onclick = () => openEditor(b.dataset.edit));
    document.querySelectorAll("[data-del]").forEach(b => b.onclick = () => {
      if (confirm("¿Eliminar este producto?")) {
        DB.deleteProduct(b.dataset.del);
        renderInventory(); renderDashboard();
        toast("Producto eliminado");
      }
    });
  }

  function openEditor(id) {
    const wrap = document.getElementById("productEditor");
    wrap.classList.remove("hidden");
    wrap.scrollIntoView({ behavior: "smooth" });
    if (id) {
      const p = DB.getProduct(id);
      document.getElementById("editorTitle").textContent = "Editar producto";
      document.getElementById("pid").value = p.id;
      document.getElementById("ptitle").value = p.title;
      document.getElementById("pcategory").value = p.category;
      document.getElementById("pprice").value = p.price;
      document.getElementById("pstock").value = p.stock ?? 0;
      document.getElementById("pimage").value = p.image;
      document.getElementById("pdesc").value = p.description || "";
    } else {
      document.getElementById("editorTitle").textContent = "Nuevo producto";
      document.getElementById("productForm").reset();
      document.getElementById("pid").value = "";
    }
  }

  document.getElementById("newProductBtn").onclick = () => openEditor(null);
  document.getElementById("cancelEdit").onclick = () => document.getElementById("productEditor").classList.add("hidden");

  document.getElementById("productForm").addEventListener("submit", e => {
    e.preventDefault();
    const id = document.getElementById("pid").value;
    const data = {
      title: document.getElementById("ptitle").value.trim(),
      category: document.getElementById("pcategory").value.trim(),
      price: parseFloat(document.getElementById("pprice").value),
      stock: parseInt(document.getElementById("pstock").value, 10),
      image: document.getElementById("pimage").value.trim(),
      description: document.getElementById("pdesc").value.trim(),
    };
    if (id) {
      DB.updateProduct(id, data);
      toast("Producto actualizado");
    } else {
      DB.addProduct({ id: DB.uid(), rating: 0, ratingCount: 0, ...data });
      toast("Producto creado");
    }
    document.getElementById("productEditor").classList.add("hidden");
    renderInventory();
  });

  function renderSales() {
    const orders = DB.getOrders().slice().sort((a,b)=>b.date-a.date);
    document.getElementById("salesBody").innerHTML = orders.length
      ? orders.map(o => `
        <tr>
          <td>${new Date(o.date).toLocaleString()}</td>
          <td>${o.userName}</td>
          <td>${o.items.reduce((s,i)=>s+i.qty,0)}</td>
          <td>$${o.total.toFixed(2)}</td>
          <td>
            <select data-status="${o.id}">
              ${["Pendiente","Enviado","Entregado"].map(st => `<option ${st===o.status?"selected":""}>${st}</option>`).join("")}
            </select>
          </td>
        </tr>`).join("")
      : "<tr><td colspan='5' class='text-muted'>Sin ventas registradas.</td></tr>";
    document.querySelectorAll("[data-status]").forEach(sel => {
      sel.onchange = () => { DB.updateOrder(sel.dataset.status, { status: sel.value }); toast("Estado actualizado"); };
    });
  }

  renderDashboard();
  renderInventory();
  renderSales();

  // Refrescar admin cuando hay cambios desde otra pestaña (compras, registros, etc.)
  window.addEventListener("storage", e => {
    if (!e.key) return;
    if (e.key === DB.KEYS.ORDERS || e.key === DB.KEYS.ACTIVE || e.key === DB.KEYS.USERS) {
      renderDashboard(); renderSales();
    }
    if (e.key === DB.KEYS.PRODUCTS) renderInventory();
  });
  // Y refrescar el dashboard cada 10s para reflejar usuarios activos en tiempo casi-real
  setInterval(() => { renderDashboard(); renderSales(); }, 10000);
})();