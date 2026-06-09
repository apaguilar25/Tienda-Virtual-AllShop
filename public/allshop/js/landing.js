(async function () {
  renderNavbar("home");
  renderFooter();
  await ensureProductsSeeded();

  const products = DB.getProducts()
    .slice()
    .sort((a, b) => (b.rating || 0) - (a.rating || 0))
    .slice(0, 4);

  const grid = document.getElementById("featured");
  grid.innerHTML = products.map(p => `
    <a class="product" href="product.html?id=${p.id}">
      <div class="thumb"><img src="${p.image}" alt="${p.title}" loading="lazy"/></div>
      <div class="body">
        <div class="title">${p.title}</div>
        <div class="rating">★ ${(p.rating || 0).toFixed(1)}</div>
        <div class="price">$${p.price.toFixed(2)}</div>
      </div>
    </a>
  `).join("");

  document.getElementById("newsletterForm").addEventListener("submit", e => {
    e.preventDefault();
    const email = document.getElementById("newsletterEmail").value.trim();
    DB.addNewsletter(email);
    document.getElementById("newsletterMsg").textContent = "¡Gracias por suscribirte!";
    e.target.reset();
  });
})();