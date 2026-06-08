export const KEYS = {
    PRODUCTS: 'ios_shop_products',
    USERS: 'ios_shop_users',
    SESSION: 'ios_shop_session',
    ORDERS: 'ios_shop_orders',
    OFFLINE_QUEUE: 'ios_shop_offline_queue'
};

// Usuarios por defecto (Admin y Cliente de prueba)
const defaultUsers = [
    { email: 'admin@tienda.com', pass: 'admin123', name: 'Administrador', role: 'admin', avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150', address: 'Sede Principal Cupertino' },
    { email: 'user@tienda.com', pass: 'user123', name: 'Carlos Delgado', role: 'client', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', address: 'Av. Andrés Bello, Apt 4B' }
];

export async function initStorage() {
    // Inicializar Usuarios si no existen
    if (!localStorage.getItem(KEYS.USERS)) {
        localStorage.setItem(KEYS.USERS, JSON.stringify(defaultUsers));
    }
    
    // Inicializar Órdenes vacías
    if (!localStorage.getItem(KEYS.ORDERS)) {
        localStorage.setItem(KEYS.ORDERS, JSON.stringify([]));
    }

    // Poblar Catálogo desde FakeStoreAPI (Solo la primera vez)
    if (!localStorage.getItem(KEYS.PRODUCTS)) {
        try {
            const res = await fetch('https://fakestoreapi.com/products');
            const data = await res.json();
            // Adaptar campos a nuestra estructura
            const formattedProducts = data.map(item => ({
                id: item.id,
                title: item.title,
                price: item.price,
                description: item.description,
                category: item.category,
                image: item.image,
                stock: Math.floor(Math.random() * 15) + 5, // Stock dinámico inicial
                reviews: [
                    { user: 'Sofía M.', rating: 5, comment: 'Diseño impecable, muy recomendado.' }
                ]
            }));
            localStorage.setItem(KEYS.PRODUCTS, JSON.stringify(formattedProducts));
        } catch (err) {
            console.error("Error al poblar API externa (Modo Offline activo):", err);
        }
    }
}

export function getData(key) {
    return JSON.parse(localStorage.getItem(key)) || [];
}

export function saveData(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}