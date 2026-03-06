import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
app.use(express.json());
app.use(cors({ origin: "*", methods: ["GET", "POST", "PUT", "DELETE"], credentials: true }));

const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://Flor:Hola20@cluster0.ja7oags.mongodb.net/sistema_pos_v5";

mongoose.connect(MONGO_URI)
    .then(() => console.log("✅ Conectado a sistema_pos_v5"))
    .catch(err => console.error("❌ Error Mongo:", err));

const Inversion = mongoose.model('Inversion', new mongoose.Schema({}, { strict: false }), 'inversions');

const [invs = [], vts = [], clts = []] = await Promise.all([
    db.collection('inversions').find(queryInv).toArray().catch(() => []),
    db.collection('ventas').find(queryVts).toArray().catch(() => []),
    db.collection('clientes').find({}).toArray().catch(() => [])
]);

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
app.get('/api/dashboard/rentabilidad', async (req, res) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');

    try {
        const { desde, hasta, producto } = req.query;
        const db = mongoose.connection.db;

        // Validación: Si la DB no está lista, no intentamos hacer nada
        if (!db) {
            return res.status(503).json({ error: "Base de datos conectando, por favor intenta en unos segundos" });
        }

        let queryInv = producto ? { nombre: { $regex: new RegExp(producto, 'i') } } : {};
        let queryVts = producto ? { "productos.nombre_producto": { $regex: new RegExp(producto, 'i') } } : {};

        if (desde || hasta) {
            const f = {};
            if (desde) f.$gte = new Date(desde);
            if (hasta) f.$lte = new Date(hasta);
            queryInv.fecha = f;
            queryVts.fecha = f;
        }

        // Ejecución en paralelo con .catch(() => []) para evitar que el servidor se caiga si falla una colección
        const [invs, vts, clts] = await Promise.all([
            db.collection('inversions').find(queryInv).toArray().catch(() => []),
            db.collection('ventas').find(queryVts).toArray().catch(() => []),
            db.collection('clientes').find({}).toArray().catch(() => [])
        ]);

        // Cálculo seguro usando el operador lógico || 0 para evitar errores si no hay datos
        const totalInversion = (invs || []).reduce((acc, i) => acc + (Number(i.costoTotal || i.costo_total || 0)), 0);
        const totalVentas = (vts || []).reduce((acc, v) => acc + (Number(v.total || 0)), 0);
        const totalFiados = (clts || []).reduce((acc, c) => acc + (Number(c.deudaTotal || 0)), 0);

        res.json({
            inversionTotal: totalInversion,
            ingresosTotalesVentas: totalVentas,
            plataPorCobrar: totalFiados,
            dineroEnCaja: totalVentas - totalFiados,
            gananciaReal: (totalVentas - totalFiados) - totalInversion
        });

    } catch (e) {
        console.error("Error en Dashboard:", e);
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
    try {
        const nombres = await Inversion.distinct('nombre');
        res.json(nombres);
    } catch (e) { 
        res.status(500).json({ error: e.message });
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => console.log(`🚀 Puerto: ${PORT}`));