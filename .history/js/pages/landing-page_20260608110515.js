import { initializeShell } from '../global.js';
import { Catalog } from '../modules/catalog.js';

document.addEventListener('DOMContentLoaded', async () => {
    initializeShell();
    await Catalog.loadFromAPI();

    const destContainer = document.getElementById('featured-injection');
    const items = Catalog.getAll().slice(0, 3);

    destContainer.innerHTML = '';
    items.forEach(p => {
        const div = document.createElement('div');
        div.className = 'card-product';
        div.style.minWidth = '160px';

        const wrapper = document.createElement('div');
        wrapper.className = 'img-container';
        const img = document.createElement('img');
        img.src = p.image;
        wrapper.appendChild(img);

        const title = document.createElement('div');
        title.className = 'title-product';
        title.textContent = p.title;

        div.appendChild(wrapper);
        div.appendChild(title);
        destContainer.appendChild(div);
    });

    document.getElementById('news-form').addEventListener('submit', (e) => {
        e.preventDefault();
        alert("Suscripción registrada.");
        e.target.reset();
    });
});