(function () {
  renderNavbar();
  renderFooter();

  function getUserId() { return DB.getSession()?.id; }

  function render() {
    const uid = getUserId();
    const items = DB.getCart(uid);
    const itemsEl = document.getElementById("cartItems");
    const sumEl = document.getElementById("cartSummary");
    if (!items.length) {
      itemsEl.innerHTML = "<p class='text-muted'>Tu carrito está vacío. <a href='catalog.html'>Ver productos</a></p>";
      sumEl.innerHTML = "";
      return;
    }
    itemsEl.innerHTML = items.map(i => `
      <div class="cart-item">
        <img src="${i.image}" alt="${i.title}"/>
        <div>
          <div style="font-weight:600">${i.title}</div>
          <div class="text-muted">$${i.price.toFixed(2)} c/u</div>
          <div class="qty mt-16">
            <button data-act="dec" data-id="${i.id}">−</button>
            <span>${i.qty}</span>
            <button data-act="inc" data-id="${i.id}">+</button>
            <button class="btn btn-sm btn-secondary" data-act="clone" data-id="${i.id}" title="Clonar">⎘</button>
            <button class="btn btn-sm btn-danger" data-act="del" data-id="${i.id}">🗑️</button>
          </div>
        </div>
        <div style="font-weight:700;">$${(i.price * i.qty).toFixed(2)}</div>
      </div>
    `).join("");

    const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
    const tax = subtotal * 0.16;
    const total = subtotal + tax;
    sumEl.innerHTML = `
      <h3>Resumen</h3>
      <div class="row"><span>Subtotal</span><span>$${subtotal.toFixed(2)}</span></div>
      <div class="row"><span>Impuestos (16%)</span><span>$${tax.toFixed(2)}</span></div>
      <div class="row total"><span>Total</span><span>$${total.toFixed(2)}</span></div>
      <a class="btn btn-block mt-16" href="checkout.html">Ir al checkout →</a>
    `;

    itemsEl.querySelectorAll("button[data-act]").forEach(b => {
      b.onclick = () => {
        const items = DB.getCart(uid);
        const i = items.find(x => x.id === b.dataset.id);
        if (!i) return;
        if (b.dataset.act === "inc") i.qty++;
        if (b.dataset.act === "dec") { i.qty--; if (i.qty <= 0) items.splice(items.indexOf(i), 1); }
        if (b.dataset.act === "del") items.splice(items.indexOf(i), 1);
        if (b.dataset.act === "clone") items.push({ ...i, qty: 1 });
        DB.setCart(uid, items);
        render(); renderNavbar();
      };
    });
  }
  render();
})();