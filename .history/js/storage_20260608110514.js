export const Storage = {
    get(key) {
        return JSON.parse(localStorage.getItem(key));
    },
    set(key, val) {
        localStorage.setItem(key, JSON.stringify(val));
    },
    initStructure() {
        if (!localStorage.getItem('products')) localStorage.setItem('products', JSON.stringify([]));
        if (!localStorage.getItem('users')) localStorage.setItem('users', JSON.stringify([]));
        if (!localStorage.getItem('orders')) localStorage.setItem('orders', JSON.stringify([]));
        if (!localStorage.getItem('offline_orders')) localStorage.setItem('offline_orders', JSON.stringify([]));
    }
};