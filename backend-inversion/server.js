const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("✅ MongoDB Conectado"))
    .catch(err => console.error("❌ Error:", err));

// --- MODELOS ---
const Inversion = mongoose.model('Inversion', new mongoose.Schema({
    nombre: String,
    formato_compra: String,
    cantidad_formato: Number,
    unidades_por_formato: Number,
    costo_total: Number,
    total_unidades_compradas: Number,
    fecha: { type: Date, default: Date.now }
}), 'inversions');

const Venta = mongoose.model('Venta', new mongoose.Schema({
    total: Number,
    productos: Array,
    fecha: { type: Date, default: Date.now }
}), 'ventas');

const Producto = mongoose.model('Producto', new mongoose.Schema({
    nombre: String, precio: Number, precio_compra: Number, cantidad: Number, unidad: String
}), 'productos');

app.get('/api/dashboard/rentabilidad', async (req, res) => {
    try {
        const { desde, hasta, producto } = req.query;
        
        let filtro = {};
        if (desde && hasta) filtro.fecha = { $gte: new Date(desde), $lte: new Date(hasta) };
        if (producto) filtro.nombre = new RegExp(producto, 'i');

        const [inversiones, ventas] = await Promise.all([
            Inversion.find(filtro),
            // Para ventas, el filtro es un poco diferente si buscamos por producto específico dentro del array
            Venta.find(desde && hasta ? { fecha: filtro.fecha } : {})
        ]);

        // 1. Cálculos de totales con filtro
        const inversionTotal = inversiones.reduce((acc, inv) => acc + (Number(inv.costo_total) || 0), 0);
        const ingresosTotales = ventas.reduce((acc, v) => acc + (Number(v.total) || 0), 0);
        const gananciaNeta = ingresosTotales > 0 ? ingresosTotales - inversionTotal : 0;

        // 2. Datos para el GRÁFICO (Agrupado por Mes)
        // Creamos un mapa de los últimos meses
        const datosGrafico = inversiones.reduce((acc, inv) => {
            const mes = new Date(inv.fecha).toLocaleString('es-ES', { month: 'short' });
            if (!acc[mes]) acc[mes] = { name: mes, inversion: 0, ventas: 0 };
            acc[mes].inversion += inv.costo_total;
            return acc;
        }, {});

        ventas.forEach(v => {
            const mes = new Date(v.fecha).toLocaleString('es-ES', { month: 'short' });
            if (!datosGrafico[mes]) datosGrafico[mes] = { name: mes, inversion: 0, ventas: 0 };
            datosGrafico[mes].ventas += v.total;
        });

        res.json({
            inversionTotalEnVentas: inversionTotal,
            ingresosTotales: ingresosTotales,
            gananciaNeta: gananciaNeta,
            grafico: Object.values(datosGrafico) // Convertimos el mapa a array para el gráfico
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});


// --- RUTAS CRUD INVERSIONES ---
app.get('/api/inversiones', async (req, res) => {
    const list = await Inversion.find().sort({ fecha: -1 });
    res.json(list);
});

app.post('/api/productos/inversion', async (req, res) => {
    try {
        const { nombre, formato, cantidadFormato, unidadesPorFormato, costoTotal } = req.body;
        const nueva = new Inversion({
            nombre, formato_compra: formato, cantidad_formato: cantidadFormato,
            unidades_por_formato: unidadesPorFormato, costo_total: costoTotal,
            total_unidades_compradas: Number(cantidadFormato) * Number(unidadesPorFormato)
        });
        await nueva.save();
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/inversiones/:id', async (req, res) => {
    try {
        const { nombre, formato, cantidadFormato, unidadesPorFormato, costoTotal } = req.body;
        await Inversion.findByIdAndUpdate(req.params.id, {
            nombre, formato_compra: formato, cantidad_formato: cantidadFormato,
            unidades_por_formato: unidadesPorFormato, costo_total: costoTotal,
            total_unidades_compradas: Number(cantidadFormato) * Number(unidadesPorFormato)
        });
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/inversiones/:id', async (req, res) => {
    try {
        await Inversion.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/productos', async (req, res) => {
    const prods = await Producto.find().sort({ nombre: 1 });
    res.json(prods);
});
// OBTENER NOMBRES ÚNICOS DESDE LAS COMPRAS (INVERSIONES)
app.get('/api/nombres-inversiones', async (req, res) => {
    try {
        // .distinct('nombre') devuelve la lista sin repetir nombres
        const nombres = await Inversion.distinct('nombre');
        res.json(nombres);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

const PORT = 5000;
app.listen(PORT, () => console.log(`🚀 Servidor en puerto ${PORT}`));