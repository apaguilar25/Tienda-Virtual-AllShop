(async function () {
  renderNavbar("catalog");
  renderFooter();
  await ensureProductsSeeded();

  const id = new URLSearchParams(location.search).get("id");
  const p = DB.getProduct(id);
  const view = document.getElementById("productView");
  if (!p) { view.innerHTML = "<p>Producto no encontrado.</p>"; return; }

  view.innerHTML = `
    <div class="card product-detail">
      <div style="background:#fff;border-radius:12px;padding:24px;display:grid;place-items:center;">
        <img src="${p.image}" alt="${p.title}" style="max-height:340px;object-fit:contain;" />
      </div>
      <div>
        <h1>${p.title}</h1>
        <p class="text-muted">${p.category}</p>
        <div class="stars">★ ${(p.rating || 0).toFixed(1)} <span class="text-muted">(${p.ratingCount || 0})</span></div>
        <p>${p.description}</p>
        <div style="font-size:1.8rem;font-weight:800;color:var(--primary);">$${p.price.toFixed(2)}</div>
        <button class="btn mt-16" id="addBtn">Añadir al carrito</button>
      </div>
    </div>
  `;

  document.getElementById("addBtn").onclick = () => addToCart(p.id);

  function renderReviews() {
    const list = DB.getReviews(p.id);
    const el = document.getElementById("reviewsList");
    if (!list.length) { el.innerHTML = "<p class='text-muted'>Aún no hay reseñas.</p>"; return; }
    el.innerHTML = list.map(r => `
      <div class="review">
        <div class="head">
          <strong>${r.userName}</strong>
          <span class="stars">${"★".repeat(r.rating)}${"☆".repeat(5 - r.rating)}</span>
        </div>
        <p>${r.text}</p>
        <small class="text-muted">${new Date(r.date).toLocaleDateString()}</small>
      </div>
    `).join("");
  }
  renderReviews();

  let rating = 0;
  const stars = document.querySelectorAll("#starInput span");
  stars.forEach(s => {
    s.onclick = () => {
      rating = +s.dataset.v;
      stars.forEach(x => x.classList.toggle("on", +x.dataset.v <= rating));
    };
  });

  document.getElementById("submitReview").onclick = () => {
    const s = DB.getSession();
    const msg = document.getElementById("reviewMsg");
    if (!s) { msg.textContent = "Inicia sesión para dejar una reseña."; return; }
    const text = document.getElementById("reviewText").value.trim();
    if (!rating || !text) { msg.textContent = "Selecciona una calificación y escribe un comentario."; return; }
    DB.addReview(p.id, { userId: s.id, userName: s.name, rating, text, date: Date.now() });
    document.getElementById("reviewText").value = "";
    rating = 0; stars.forEach(x => x.classList.remove("on"));
    msg.textContent = "";
    renderReviews();
    toast("Reseña publicada");
  };
})();