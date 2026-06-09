// AllShop — utilidades globales (tema, navbar, online/offline, toast, render común)
(function () {
  // ---------- Tema ----------
  const savedTheme = localStorage.getItem(DB.KEYS.THEME) || "light";
  document.documentElement.setAttribute("data-theme", savedTheme);

  window.toggleTheme = function () {
    const cur = document.documentElement.getAttribute("data-theme");
    const next = cur === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem(DB.KEYS.THEME, next);
    const btn = document.getElementById("themeBtn");
    if (btn) btn.textContent = next === "dark" ? "☀️" : "🌙";
  };

  // ---------- Toast ----------
  window.toast = function (msg) {
    let el = document.getElementById("toast");
    if (!el) {
      el = document.createElement("div");
      el.id = "toast";
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(el._t);
    el._t = setTimeout(() => el.classList.remove("show"), 2200);
  };

  // ---------- Sesión / Auth helpers ----------
  window.getSession = () => DB.getSession();
  window.requireAuth = function (role) {
    const s = DB.getSession();
    if (!s) { location.href = "login.html?redirect=" + encodeURIComponent(location.pathname); return null; }
    if (role && s.role !== role) { location.href = "index.html"; toast("Acceso denegado"); return null; }
    return s;
  };
  window.logout = function () {
    DB.clearSession();
    location.href = "index.html";
  };

  // ---------- Navbar ----------
  window.renderNavbar = function (active) {
    const s = DB.getSession();
    const cartCount = DB.getCart(s?.id).reduce((a, b) => a + b.qty, 0);
    const isAdmin = s?.role === "admin";
    const links = [
      { href: "index.html", label: "Inicio", key: "home" },
      { href: "catalog.html", label: "Catálogo", key: "catalog" },
    ];
    if (isAdmin) links.push({ href: "admin.html", label: "Admin", key: "admin" });

    const theme = document.documentElement.getAttribute("data-theme");
    const html = `
      <nav class="navbar">
        <div class="nav-inner">
          <a href="index.html" class="brand">
            <span class="logo">A</span> AllShop
          </a>
          <div class="nav-links" id="navLinks">
            ${links.map(l => `<a href="${l.href}" class="${active === l.key ? "active" : ""}">${l.label}</a>`).join("")}
            ${s
              ? `<a href="profile.html" class="${active === "profile" ? "active" : ""}">Perfil</a>
                 <a href="#" onclick="logout();return false;">Salir</a>`
              : `<a href="login.html" class="${active === "login" ? "active" : ""}">Entrar</a>
                 <a href="register.html">Registro</a>`}
          </div>
          <div class="nav-actions">
            <button class="icon-btn" id="themeBtn" onclick="toggleTheme()" title="Cambiar tema">${theme === "dark" ? "☀️" : "🌙"}</button>
            <a class="icon-btn" href="cart.html" title="Carrito">🛒 <span class="cart-count">${cartCount}</span></a>
            <button class="icon-btn menu-toggle" onclick="document.getElementById('navLinks').classList.toggle('open')">☰</button>
          </div>
        </div>
      </nav>
    `;
    const slot = document.getElementById("navbar");
    if (slot) slot.outerHTML = html;
  };

  // ---------- Footer ----------
  window.renderFooter = function () {
    const online = navigator.onLine;
    const html = `
      <footer>
        <div class="footer-inner">
          <div>
            <h4>AllShop</h4>
            <p class="text-muted">Tu tienda virtual de confianza.</p>
          </div>
          <div>
            <h4>Enlaces</h4>
            <p><a href="catalog.html">Catálogo</a></p>
            <p><a href="profile.html">Mi cuenta</a></p>
            <p><a href="#">Política de privacidad</a></p>
          </div>
          <div>
            <h4>Redes</h4>
            <p><a href="#">Instagram</a> · <a href="#">X</a> · <a href="#">Facebook</a></p>
          </div>
          <div>
            <h4>Estado</h4>
            <p id="netStatus"><span class="status-dot ${online ? "" : "offline"}"></span>${online ? "Online" : "Offline"}</p>
          </div>
        </div>
        <div class="footer-bottom">© ${new Date().getFullYear()} AllShop — Todos los derechos reservados.</div>
      </footer>
    `;
    const slot = document.getElementById("footer");
    if (slot) slot.outerHTML = html;

    const update = () => {
      const el = document.getElementById("netStatus");
      if (!el) return;
      const on = navigator.onLine;
      el.innerHTML = `<span class="status-dot ${on ? "" : "offline"}"></span>${on ? "Online" : "Offline"}`;
      if (on) syncOfflineQueue();
    };
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
  };

  // ---------- Cargar catálogo inicial desde FakeStore API (una sola vez) ----------
  window.ensureProductsSeeded = async function () {
    if (localStorage.getItem(DB.KEYS.SEEDED)) return;
    if (DB.getProducts().length > 0) {
      localStorage.setItem(DB.KEYS.SEEDED, "1");
      return;
    }
    try {
      const res = await fetch("https://fakestoreapi.com/products");
      const data = await res.json();
      const products = data.map(p => ({
        id: String(p.id),
        title: p.title,
        price: p.price,
        description: p.description,
        category: p.category,
        image: p.image,
        rating: p.rating?.rate || 0,
        ratingCount: p.rating?.count || 0,
        stock: 25,
      }));
      DB.setProducts(products);
      localStorage.setItem(DB.KEYS.SEEDED, "1");
    } catch (e) {
      console.warn("No se pudo cargar la API. Usando seed offline.");
      // Seed offline mínimo
      if (DB.getProducts().length === 0) {
        DB.setProducts([
          { id: "of1", title: "Camiseta clásica", price: 19.99, description: "Algodón 100%", category: "ropa", image: "https://via.placeholder.com/300", rating: 4.4, ratingCount: 10, stock: 20 },
          { id: "of2", title: "Auriculares BT", price: 49.5, description: "Sonido envolvente", category: "electronics", image: "https://via.placeholder.com/300", rating: 4.6, ratingCount: 22, stock: 15 },
          { id: "of3", title: "Mochila urbana", price: 35.0, description: "Resistente al agua", category: "accesorios", image: "https://via.placeholder.com/300", rating: 4.2, ratingCount: 8, stock: 10 },
        ]);
        localStorage.setItem(DB.KEYS.SEEDED, "1");
      }
    }
  };

  // ---------- Sincronización de cola offline ----------
  window.syncOfflineQueue = function () {
    const q = DB.getQueue();
    if (!q.length) return;
    q.forEach(item => {
      if (item.type === "order") {
        DB.addOrder(item.payload);
      }
    });
    DB.clearQueue();
    toast("Pedidos offline sincronizados");
  };

  // ---------- Registrar Service Worker ----------
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("/allshop/sw.js").catch(() => {});
    });
  }

  // ---------- Marcar usuario activo periódicamente ----------
  setInterval(() => {
    const s = DB.getSession();
    if (s) DB.setSession(s);
  }, 60_000);
})();