export function initThemeControl() {
    const btn = document.getElementById('theme-toggle');
    const currentTheme = localStorage.getItem('theme');

    // Aplicar tema guardado en la sesión anterior
    if (currentTheme === 'dark') {
        document.body.classList.add('ios-dark-theme');
        if(btn) btn.textContent = "☀️"; // Icono de sol para volver a claro
    } else {
        if(btn) btn.textContent = "🌙"; // Icono de luna para ir a oscuro
    }

    if (btn) {
        btn.addEventListener('click', () => {
            document.body.classList.toggle('ios-dark-theme');
            const isDark = document.body.classList.contains('ios-dark-theme');
            
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
            btn.textContent = isDark ? "☀️" : "🌙";
        });
    }
}