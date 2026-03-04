const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(cors({
  origin: "*", // Permite conexiones desde cualquier origen
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));
const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://Flor:Hola20@cluster0.ja7oags.mongodb.net/sistema_pos_v5";

mongoose.connect(MONGO_URI)
    .then(() => console.log("✅ Conectado a sistema_pos_v5"))
    .catch(err => console.error("❌ Error Mongo:", err));

// Modelos ultra-flexibles (leen cualquier campo)
const Inversion = mongoose.model('Inversion', new mongoose.Schema({}, { strict: false }), 'inversions');
const Venta = mongoose.model('Venta', new mongoose.Schema({}, { strict: false }), 'ventas');
const Fiado = mongoose.model('Fiado', new mongoose.Schema({}, { strict: false }), 'movimientofiados');

app.post('/api/productos/inversion', async (req, res) => {
    try {
        const inv = new Inversion(req.body); // Asegúrate de que el modelo 'Inversion' esté bien
        await inv.save();
        res.status(201).json(inv);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});
app.get('/api/inversiones', async (req, res) => {
    try {
        const invs = await Inversion.find({});
        // Normalizamos los nombres de campos para que el frontend los entienda
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
    } catch (e) {
        res.status(500).json([]);
    }
});
app.get('/api/dashboard/rentabilidad', async (req, res) => {
    try {
        const { desde, hasta, producto } = req.query;
        const db = mongoose.connection.db;

        // Filtros combinados
        let queryInversiones = {};
        if (producto) queryInversiones.nombre = producto; // Filtra por nombre exacto
        if (desde || hasta) {
            queryInversiones.fecha = {};
            if (desde) queryInversiones.fecha.$gte = new Date(desde);
            if (hasta) queryInversiones.fecha.$lte = new Date(hasta);
        }
        const invs = await db.collection('inversions').find(queryInversiones).toArray();

        const totalInversion = invs.reduce((acc, i) => acc + (Number(i.costo_total || i.costoTotal || 0)), 0);
        const totalVentas = vts.reduce((acc, v) => acc + (Number(v.total || 0)), 0);
        const plataPorCobrar = clts.reduce((acc, c) => acc + (Number(c.deudaTotal || 0)), 0);

        const meses = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
        const graficoMap = {};

        // Función auxiliar para obtener mes seguro
        const getMes = (fecha) => {
            const d = new Date(fecha);
            return !isNaN(d) ? d.getMonth() : new Date().getMonth(); // Si falla, usa mes actual
        };

        // Procesar inversiones
        invs.forEach(i => {
            const m = meses[getMes(i.fecha)];
            if (!graficoMap[m]) graficoMap[m] = { name: m, inversion: 0, ventas: 0 };
            graficoMap[m].inversion += Number(i.costo_total || i.costoTotal || 0);
        });

        // Procesar ventas
        vts.forEach(v => {
            const m = meses[getMes(v.fecha)];
            if (!graficoMap[m]) graficoMap[m] = { name: m, inversion: 0, ventas: 0 };
            graficoMap[m].ventas += Number(v.total || 0);
        });

        res.json({
            inversionTotal: totalInversion,
            ingresosTotalesVentas: totalVentas,
            plataPorCobrar: plataPorCobrar,
            dineroEnCaja: totalVentas - plataPorCobrar,
            gananciaReal: (totalVentas - plataPorCobrar) - totalInversion,
            grafico: Object.values(graficoMap)
        });

    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});
// EDITAR
app.put('/api/inversiones/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updated = await Inversion.findByIdAndUpdate(id, req.body, { new: true });
        res.json(updated);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// ELIMINAR
app.delete('/api/inversiones/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await Inversion.findByIdAndDelete(id);
        res.json({ message: "Eliminado" });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.get('/api/dashboard/rentabilidad', async (req, res) => {
    try {
        const { desde, hasta, producto } = req.query;
        const db = mongoose.connection.db;

        // 1. Consultas base
        const queryInv = producto ? { nombre: producto } : {};
        const queryVts = producto ? { "productos.nombre": producto } : {};

        // 2. Ejecutar con Promise.all y asegurar que TODO esté definido
        const [invs, vts, clts] = await Promise.all([
            db.collection('inversions').find(queryInv).toArray(),
            db.collection('ventas').find(queryVts).toArray(),
            db.collection('clientes').find({}).toArray()
        ]);

        // 3. Cálculos seguros (usando || 0 para evitar errores si algo falta)
        const totalInversion = invs.reduce((acc, i) => acc + (Number(i.costo_total || i.costoTotal || 0)), 0);
        const totalVentas = vts.reduce((acc, v) => acc + (Number(v.total || 0)), 0);
        const plataPorCobrar = clts.reduce((acc, c) => acc + (Number(c.deudaTotal || 0)), 0);

        const dineroEnCaja = totalVentas - plataPorCobrar;
        const gananciaReal = dineroEnCaja - totalInversion;

        // 4. Respuesta
        res.json({
            inversionTotal: totalInversion,
            ingresosTotalesVentas: totalVentas,
            plataPorCobrar: plataPorCobrar,
            dineroEnCaja: dineroEnCaja,
            gananciaReal: gananciaReal
        });

    } catch (e) {
        console.error("Error crítico:", e);
        res.status(500).json({ error: e.message });
    }
});


app.get('/api/nombres-inversiones', async (req, res) => {
    try { res.json(await Inversion.distinct('nombre')); } catch (e) { res.json([]); }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => console.log(`🚀 Puerto: ${PORT}`));