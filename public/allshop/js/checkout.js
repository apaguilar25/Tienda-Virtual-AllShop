(function () {
  const s = requireAuth();
  if (!s) return;
  renderNavbar();
  renderFooter();

  const items = DB.getCart(s.id);
  const sumEl = document.getElementById("sum");

  if (!items.length) {
    sumEl.innerHTML = "<p>Carrito vacío.</p>";
    document.getElementById("payForm").style.display = "none";
    return;
  }

  const subtotal = items.reduce((a, i) => a + i.price * i.qty, 0);
  const tax = subtotal * 0.16;
  const total = subtotal + tax;
  sumEl.innerHTML = `
    <h3>Tu pedido</h3>
    ${items.map(i => `<div class="row"><span>${i.title} ×${i.qty}</span><span>$${(i.price*i.qty).toFixed(2)}</span></div>`).join("")}
    <hr/>
    <div class="row"><span>Subtotal</span><span>$${subtotal.toFixed(2)}</span></div>
    <div class="row"><span>Impuestos</span><span>$${tax.toFixed(2)}</span></div>
    <div class="row total"><span>Total</span><span>$${total.toFixed(2)}</span></div>
  `;

  document.getElementById("fullName").value = s.name || "";
  document.getElementById("address").value = s.address || "";

  document.getElementById("ccNum").addEventListener("input", e => {
    e.target.value = e.target.value.replace(/\D/g, "").slice(0, 16).replace(/(\d{4})/g, "$1 ").trim();
  });

  document.getElementById("payForm").addEventListener("submit", e => {
    e.preventDefault();
    const msg = document.getElementById("payMsg");
    const num = document.getElementById("ccNum").value.replace(/\s/g, "");
    const exp = document.getElementById("ccExp").value;
    const cvv = document.getElementById("ccCvv").value;
    if (!/^\d{15,16}$/.test(num)) { msg.textContent = "Número de tarjeta inválido."; return; }
    if (!/^\d{2}\/\d{2}$/.test(exp)) { msg.textContent = "Fecha de expiración inválida (MM/AA)."; return; }
    if (!/^\d{3,4}$/.test(cvv)) { msg.textContent = "CVV inválido."; return; }

    const order = {
      id: DB.uid(),
      userId: s.id,
      userName: s.name,
      items, subtotal, tax, total,
      status: "Pendiente",
      address: document.getElementById("address").value,
      date: Date.now(),
    };
    if (!navigator.onLine) {
      DB.pushQueue({ type: "order", payload: order });
      toast("Sin conexión: pedido encolado para sincronizar.");
    } else {
      DB.addOrder(order);
      toast("¡Pedido realizado!");
    }
    DB.setCart(s.id, []);
    setTimeout(() => location.href = "profile.html", 800);
  });
})();