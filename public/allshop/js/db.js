// AllShop — capa de persistencia local (localStorage)
(function () {
  const KEYS = {
    USERS: "allshop.users",
    SESSION: "allshop.session",
    PRODUCTS: "allshop.products",
    CARTS: "allshop.carts",
    ORDERS: "allshop.orders",
    REVIEWS: "allshop.reviews",
    NEWSLETTER: "allshop.newsletter",
    OFFLINE_QUEUE: "allshop.offlineQueue",
    THEME: "allshop.theme",
    SEEDED: "allshop.seeded",
    ACTIVE: "allshop.activeUsers",
  };

  function read(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
    catch { return fallback; }
  }
  function write(key, val) { localStorage.setItem(key, JSON.stringify(val)); }
  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }

  const DB = {
    KEYS, read, write, uid,

    // Users
    getUsers() { return read(KEYS.USERS, []); },
    setUsers(u) { write(KEYS.USERS, u); },
    findUser(email) { return this.getUsers().find(u => u.email.toLowerCase() === email.toLowerCase()); },
    addUser(u) {
      const users = this.getUsers();
      users.push(u);
      this.setUsers(users);
    },
    updateUser(id, patch) {
      const users = this.getUsers().map(u => u.id === id ? { ...u, ...patch } : u);
      this.setUsers(users);
      const s = this.getSession();
      if (s && s.id === id) this.setSession({ ...s, ...patch });
    },

    // Session
    getSession() {
      try { return JSON.parse(sessionStorage.getItem(KEYS.SESSION)); }
      catch { return null; }
    },
    setSession(s) {
      sessionStorage.setItem(KEYS.SESSION, JSON.stringify(s));
      // marcar activo
      const active = read(KEYS.ACTIVE, {});
      active[s.id] = Date.now();
      write(KEYS.ACTIVE, active);
    },
    clearSession() { sessionStorage.removeItem(KEYS.SESSION); },

    // Products
    getProducts() { return read(KEYS.PRODUCTS, []); },
    setProducts(p) { write(KEYS.PRODUCTS, p); },
    addProduct(p) { const arr = this.getProducts(); arr.push(p); this.setProducts(arr); },
    updateProduct(id, patch) {
      this.setProducts(this.getProducts().map(p => p.id === id ? { ...p, ...patch } : p));
    },
    deleteProduct(id) {
      this.setProducts(this.getProducts().filter(p => p.id !== id));
    },
    getProduct(id) { return this.getProducts().find(p => String(p.id) === String(id)); },

    // Cart (por usuario o invitado)
    getCart(userId) {
      const carts = read(KEYS.CARTS, {});
      return carts[userId || "guest"] || [];
    },
    setCart(userId, items) {
      const carts = read(KEYS.CARTS, {});
      carts[userId || "guest"] = items;
      write(KEYS.CARTS, carts);
    },

    // Orders
    getOrders() { return read(KEYS.ORDERS, []); },
    addOrder(o) { const arr = this.getOrders(); arr.push(o); write(KEYS.ORDERS, arr); },
    updateOrder(id, patch) {
      write(KEYS.ORDERS, this.getOrders().map(o => o.id === id ? { ...o, ...patch } : o));
    },

    // Reviews
    getReviews(productId) {
      const all = read(KEYS.REVIEWS, {});
      return all[productId] || [];
    },
    addReview(productId, review) {
      const all = read(KEYS.REVIEWS, {});
      all[productId] = all[productId] || [];
      all[productId].push(review);
      write(KEYS.REVIEWS, all);
    },

    // Newsletter
    addNewsletter(email) {
      const list = read(KEYS.NEWSLETTER, []);
      if (!list.includes(email)) { list.push(email); write(KEYS.NEWSLETTER, list); }
    },

    // Offline queue
    getQueue() { return read(KEYS.OFFLINE_QUEUE, []); },
    pushQueue(item) {
      const q = this.getQueue(); q.push(item); write(KEYS.OFFLINE_QUEUE, q);
    },
    clearQueue() { write(KEYS.OFFLINE_QUEUE, []); },

    // Active users tracking
    getActiveUsers(windowMs = 1000 * 60 * 30) {
      const a = read(KEYS.ACTIVE, {});
      const now = Date.now();
      return Object.values(a).filter(t => now - t < windowMs).length;
    },
  };

  // Seed inicial: admin por defecto
  if (!DB.findUser("admin@allshop.com")) {
    DB.addUser({
      id: DB.uid(),
      name: "Administrador",
      email: "admin@allshop.com",
      password: "admin123",
      role: "admin",
      avatar: "",
      address: "",
      createdAt: Date.now(),
    });
  }

  window.DB = DB;
})();