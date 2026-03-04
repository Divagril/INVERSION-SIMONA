const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors({ origin: "*", methods: ["GET", "POST", "PUT", "DELETE"], credentials: true }));

const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://Flor:Hola20@cluster0.ja7oags.mongodb.net/sistema_pos_v5";

mongoose.connect(MONGO_URI)
    .then(() => console.log("✅ Conectado a sistema_pos_v5"))
    .catch(err => console.error("❌ Error Mongo:", err));

const Inversion = mongoose.model('Inversion', new mongoose.Schema({}, { strict: false }), 'inversions');

// --- RUTAS ---

app.post('/api/productos/inversion', async (req, res) => {
    try {
        const inv = new Inversion(req.body);
        await inv.save();
        res.status(201).json(inv);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/inversiones', async (req, res) => {
    try {
        const invs = await Inversion.find({});
        const datosNormalizados = invs.map(i => ({
            _id: i._id,
            nombre: i.nombre || "Sin nombre",
            formato_compra: i.formato_compra || i.formato || "UNIDAD",
            cantidad_formato: i.cantidad_formato || i.cantidadFormato || 0,
            unidades_por_formato: i.unidades_por_formato || i.unidadesPorFormato || 1,
            costo_total: i.costo_total || i.costoTotal || 0,
            fecha: i.fecha || new Date()
        }));
        res.json(datosNormalizados);
    } catch (e) { res.status(500).json([]); }
});

// RUTA ÚNICA DE RENTABILIDAD (Corregida y completa)
app.get('/api/dashboard/rentabilidad', async (req, res) => {
    try {
        const { desde, hasta, producto } = req.query;
        const db = mongoose.connection.db;

        const queryInv = producto ? { nombre: producto } : {};
        const queryVts = producto ? { "productos.nombre": producto } : {};

        if (desde || hasta) {
            const fechaFiltro = {};
            if (desde) fechaFiltro.$gte = new Date(desde);
            if (hasta) fechaFiltro.$lte = new Date(hasta);
            queryInv.fecha = fechaFiltro;
            queryVts.fecha = fechaFiltro;
        }

        const [invs, vts, clts] = await Promise.all([
            db.collection('inversions').find(queryInv).toArray(),
            db.collection('ventas').find(queryVts).toArray(),
            db.collection('clientes').find({}).toArray()
        ]);

        const totalInversion = invs.reduce((acc, i) => acc + (Number(i.costo_total || i.costoTotal || 0)), 0);
        const totalVentas = vts.reduce((acc, v) => acc + (Number(v.total || 0)), 0);
        const plataPorCobrar = clts.reduce((acc, c) => acc + (Number(c.deudaTotal || 0)), 0);

        res.json({
            inversionTotal: totalInversion,
            ingresosTotalesVentas: totalVentas,
            plataPorCobrar: plataPorCobrar,
            dineroEnCaja: totalVentas - plataPorCobrar,
            gananciaReal: (totalVentas - plataPorCobrar) - totalInversion
        });

    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.put('/api/inversiones/:id', async (req, res) => {
    try {
        const updated = await Inversion.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updated);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/inversiones/:id', async (req, res) => {
    try {
        await Inversion.findByIdAndDelete(req.params.id);
        res.json({ message: "Eliminado" });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/nombres-inversiones', async (req, res) => {
    try { res.json(await Inversion.distinct('nombre')); } catch (e) { res.json([]); }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => console.log(`🚀 Puerto: ${PORT}`));