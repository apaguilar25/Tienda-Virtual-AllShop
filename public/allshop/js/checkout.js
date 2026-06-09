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
    msg.textContent = "";
    try {
      const name = document.getElementById("fullName").value.trim();
      const addr = document.getElementById("address").value.trim();
      const num = document.getElementById("ccNum").value.replace(/\s/g, "");
      const exp = document.getElementById("ccExp").value.trim();
      const cvv = document.getElementById("ccCvv").value.trim();
      if (!name) { msg.textContent = "Ingresa tu nombre."; return; }
      if (!addr) { msg.textContent = "Ingresa tu dirección."; return; }
      if (!/^\d{15,16}$/.test(num)) { msg.textContent = "Número de tarjeta inválido (15-16 dígitos)."; return; }
      const m = exp.match(/^(\d{2})\/(\d{2})$/);
      if (!m) { msg.textContent = "Fecha de expiración inválida (MM/AA)."; return; }
      const mm = parseInt(m[1], 10), yy = parseInt(m[2], 10);
      if (mm < 1 || mm > 12) { msg.textContent = "Mes de expiración inválido."; return; }
      const now = new Date();
      const expDate = new Date(2000 + yy, mm, 0, 23, 59, 59);
      if (expDate < now) { msg.textContent = "La tarjeta está vencida."; return; }
      if (!/^\d{3,4}$/.test(cvv)) { msg.textContent = "CVV inválido."; return; }

      const order = {
        id: DB.uid(),
        userId: s.id,
        userName: name,
        items, subtotal, tax, total,
        status: "Pendiente",
        address: addr,
        date: Date.now(),
      };
      if (!navigator.onLine) {
        DB.pushQueue({ type: "order", payload: order });
        toast("Sin conexión: pedido encolado para sincronizar.");
      } else {
        DB.addOrder(order);
        toast("¡Pedido realizado con éxito!");
      }
      // Vaciar carrito y actualizar contador del navbar
      DB.setCart(s.id, []);
      if (typeof updateCartCount === "function") updateCartCount();
      setTimeout(() => { location.href = "profile.html"; }, 1200);
    } catch (err) {
      console.error("Checkout error:", err);
      msg.textContent = "Ocurrió un error al procesar el pago: " + err.message;
    }
  });
})();