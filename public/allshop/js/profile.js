(function () {
  const s = requireAuth();
  if (!s) return;
  renderNavbar("profile"); renderFooter();

  document.getElementById("name").value = s.name || "";
  document.getElementById("avatar").value = s.avatar || "";
  document.getElementById("address").value = s.address || "";
  const ap = document.getElementById("avatarPreview");
  ap.src = s.avatar || "https://ui-avatars.com/api/?name=" + encodeURIComponent(s.name);
  document.getElementById("avatar").addEventListener("input", e => {
    ap.src = e.target.value || "https://ui-avatars.com/api/?name=" + encodeURIComponent(s.name);
  });

  document.getElementById("profileForm").addEventListener("submit", e => {
    e.preventDefault();
    const patch = {
      name: document.getElementById("name").value.trim(),
      avatar: document.getElementById("avatar").value.trim(),
      address: document.getElementById("address").value.trim(),
    };
    DB.updateUser(s.id, patch);
    toast("Perfil actualizado");
    renderNavbar("profile");
  });

  const orders = DB.getOrders().filter(o => o.userId === s.id).sort((a,b)=>b.date-a.date);
  const el = document.getElementById("myOrders");
  if (!orders.length) el.innerHTML = "<p class='text-muted'>Aún no tienes pedidos.</p>";
  else el.innerHTML = `
    <div class="table-wrap"><table class="table">
      <thead><tr><th>Fecha</th><th>Total</th><th>Estado</th></tr></thead>
      <tbody>
        ${orders.map(o => `<tr>
          <td>${new Date(o.date).toLocaleDateString()}</td>
          <td>$${o.total.toFixed(2)}</td>
          <td><span class="badge ${o.status.toLowerCase()}">${o.status}</span></td>
        </tr>`).join("")}
      </tbody>
    </table></div>`;
})();