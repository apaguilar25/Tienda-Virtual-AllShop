import { Catalog } from './catalog.js';

export const Feedback = {
    // Agregar una reseña estructurada a un producto específico
    createReview(productId, rating, comment, userName = 'Anónimo') {
        if (rating < 1 || rating > 5) return { success: false, msg: "Calificación inválida" };

        const newReview = {
            id: Date.now(),
            user: userName,
            rating: Number(rating),
            comment: comment,
            date: new Date().toLocaleDateString()
        };

        Catalog.addReview(productId, newReview);
        return { success: true, msg: "¡Gracias por tu opinión al estilo Apple!" };
    },

    // Calcular el promedio de estrellas de un producto
    getAverageRating(reviews) {
        if (!reviews || reviews.length === 0) return 5.0;
        const sum = reviews.reduce((acc, curr) => acc + curr.rating, 0);
        return (sum / reviews.length).toFixed(1);
    }
};