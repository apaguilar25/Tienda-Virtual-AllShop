function initLogin() {
  renderNavbar("login"); renderFooter();
  document.getElementById("loginForm").addEventListener("submit", e => {
    e.preventDefault();
    const email = document.getElementById("email").value.trim();
    const pass = document.getElementById("password").value;
    const msg = document.getElementById("msg");
    const u = DB.findUser(email);
    if (!u || u.password !== pass) { msg.textContent = "Credenciales inválidas."; return; }
    DB.setSession({ id: u.id, name: u.name, email: u.email, role: u.role, avatar: u.avatar, address: u.address });
    const guest = DB.getCart(null);
    if (guest.length) {
      const userCart = DB.getCart(u.id);
      guest.forEach(g => {
        const ex = userCart.find(x => x.id === g.id);
        if (ex) ex.qty += g.qty; else userCart.push(g);
      });
      DB.setCart(u.id, userCart);
      DB.setCart(null, []);
    }
    const redirect = new URLSearchParams(location.search).get("redirect");
    location.href = redirect || (u.role === "admin" ? "admin.html" : "index.html");
  });
}

function initRegister() {
  renderNavbar(); renderFooter();
  document.getElementById("registerForm").addEventListener("submit", e => {
    e.preventDefault();
    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const msg = document.getElementById("msg");
    if (DB.findUser(email)) { msg.textContent = "Ese correo ya está registrado."; return; }
    const user = { id: DB.uid(), name, email, password, role: "client", avatar: "", address: "", createdAt: Date.now() };
    DB.addUser(user);
    DB.setSession({ id: user.id, name, email, role: "client", avatar: "", address: "" });
    location.href = "index.html";
  });
}

function initForgot() {
  renderNavbar(); renderFooter();
  document.getElementById("forgotForm").addEventListener("submit", e => {
    e.preventDefault();
    const email = document.getElementById("email").value.trim();
    const np = document.getElementById("newPassword").value;
    const msg = document.getElementById("msg");
    const u = DB.findUser(email);
    if (!u) { msg.textContent = "No existe una cuenta con ese correo."; return; }
    DB.updateUser(u.id, { password: np });
    toast("Contraseña actualizada");
    setTimeout(() => location.href = "login.html", 800);
  });
}