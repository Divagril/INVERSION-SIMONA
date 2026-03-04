const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://Flor:Hola20@cluster0.ja7oags.mongodb.net/sistema_pos_v5";

mongoose.connect(MONGO_URI)
    .then(() => console.log("✅ Conectado a sistema_pos_v5"))
    .catch(err => console.error("❌ Error Mongo:", err));

// Modelos ultra-flexibles (leen cualquier campo)
const Inversion = mongoose.model('Inversion', new mongoose.Schema({}, { strict: false }), 'inversions');
const Venta = mongoose.model('Venta', new mongoose.Schema({}, { strict: false }), 'ventas');
const Fiado = mongoose.model('Fiado', new mongoose.Schema({}, { strict: false }), 'movimientofiados');

app.get('/api/dashboard/rentabilidad', async (req, res) => {
    try {
        const db = mongoose.connection.db;

        // Leemos las colecciones forzando el nombre exacto de tu DB (sistema_pos_v5)
        const invs = await db.collection('inversions').find({}).toArray();
        const vts = await db.collection('ventas').find({}).toArray();
        const clts = await db.collection('clientes').find({}).toArray();

        console.log(`Datos leídos -> Inversiones: ${invs.length}, Ventas: ${vts.length}, Clientes: ${clts.length}`);

        // 1. SUMAR INVERSIONES (campo: costo_total)
        const totalInversion = invs.reduce((acc, i) => acc + (Number(i.costo_total || 0)), 0);

        // 2. SUMAR VENTAS (campo: total)
        const totalVentas = vts.reduce((acc, v) => acc + (Number(v.total || 0)), 0);

        // 3. SUMAR DEUDAS (campo: deudaTotal)
        const plataPorCobrar = clts.reduce((acc, c) => acc + (Number(c.deudaTotal || 0)), 0);

        // 4. CÁLCULOS
        const dineroEnCaja = totalVentas - plataPorCobrar;
        const gananciaReal = dineroEnCaja - totalInversion;

        res.json({
            inversionTotal: totalInversion,
            ingresosTotalesVentas: totalVentas,
            plataPorCobrar: plataPorCobrar,
            dineroEnCaja: dineroEnCaja,
            gananciaReal: gananciaReal,
            grafico: [] // Por ahora vacío para probar que los números aparezcan
        });

    } catch (e) {
        console.error("Error en Dashboard:", e);
        res.status(500).json({ error: e.message });
    }
});

app.get('/api/nombres-inversiones', async (req, res) => {
    try { res.json(await Inversion.distinct('nombre')); } catch (e) { res.json([]); }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => console.log(`🚀 Puerto: ${PORT}`));