(async function () {
  renderNavbar("catalog");
  renderFooter();
  await ensureProductsSeeded();

  const products = DB.getProducts();
  const cats = [...new Set(products.map(p => p.category))];
  const sel = document.getElementById("categorySelect");
  cats.forEach(c => {
    const o = document.createElement("option");
    o.value = c; o.textContent = c; sel.appendChild(o);
  });

  const maxPrice = Math.ceil(Math.max(...products.map(p => p.price), 100));
  const range = document.getElementById("priceRange");
  range.max = maxPrice; range.value = maxPrice;
  document.getElementById("priceLabel").textContent = "$" + maxPrice;

  function render() {
    const q = document.getElementById("searchInput").value.toLowerCase().trim();
    const cat = sel.value;
    const max = +range.value;
    document.getElementById("priceLabel").textContent = "$" + max;
    const filtered = products.filter(p =>
      (!q || p.title.toLowerCase().includes(q)) &&
      (!cat || p.category === cat) &&
      p.price <= max
    );
    const grid = document.getElementById("productsGrid");
    document.getElementById("emptyMsg").classList.toggle("hidden", filtered.length > 0);
    grid.innerHTML = filtered.map(p => `
      <div class="product">
        <a href="product.html?id=${p.id}" class="thumb"><img src="${p.image}" alt="${p.title}" loading="lazy"/></a>
        <div class="body">
          <a href="product.html?id=${p.id}" style="color:inherit"><div class="title">${p.title}</div></a>
          <div class="rating">★ ${(p.rating || 0).toFixed(1)}</div>
          <div class="price">$${p.price.toFixed(2)}</div>
          <div class="actions">
            <button class="btn btn-sm btn-block" data-add="${p.id}">Añadir al carrito</button>
          </div>
        </div>
      </div>
    `).join("");
    grid.querySelectorAll("[data-add]").forEach(b => b.onclick = () => addToCart(b.dataset.add));
  }

  document.getElementById("searchInput").oninput = render;
  sel.onchange = render;
  range.oninput = render;
  document.getElementById("resetFilters").onclick = () => {
    document.getElementById("searchInput").value = "";
    sel.value = "";
    range.value = maxPrice;
    render();
  };
  render();
})();