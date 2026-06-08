export function initThemeControl() {
    const btn = document.getElementById('theme-toggle');
    const currentTheme = localStorage.getItem('theme');

    if (currentTheme === 'dark') {
        document.body.classList.add('ios-dark-theme');
    }

    btn.addEventListener('click', () => {
        document.body.classList.toggle('ios-dark-theme');
        const theme = document.body.classList.contains('ios-dark-theme') ? 'dark' : 'light';
        localStorage.setItem('theme', theme);
    });
}