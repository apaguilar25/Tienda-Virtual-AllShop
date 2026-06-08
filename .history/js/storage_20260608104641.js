// Abstracción limpia del motor de datos de la App
export const Storage = {
    get(key) {
        return JSON.parse(localStorage.getItem(key));
    },
    set(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    },
    initData() {
        if (!localStorage.getItem('users')) {
            this.set('users', []);
        }
        if (!localStorage.getItem('orders')) {
            this.set('orders', []);
        }
        if (!localStorage.getItem('offline_queue')) {
            this.set('offline_queue', []);
        }
    }
};