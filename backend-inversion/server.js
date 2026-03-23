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

// Definición del Modelo
const Inversion = mongoose.model('Inversion', new mongoose.Schema({}, { strict: false }), 'inversions');

// --- RUTAS ---

// 1. Guardar Inversión
app.post('/api/productos/inversion', async (req, res) => {
    try {
        const inv = new Inversion(req.body);
        await inv.save();
        res.status(201).json(inv);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// 2. Obtener Historial de Inversiones
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

app.put('/api/inversiones/:id', async (req, res) => {
    try {
        const updated = await Inversion.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updated);
    } catch (e) { res.status(500).json({ error: e.message }); }
});
app.get('/api/dashboard/rentabilidad', async (req, res) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    try {
        const db = mongoose.connection.db;
        if (!db) return res.status(503).json({ error: "Conectando..." });

        const { desde, hasta, producto } = req.query;
        const regex = producto ? new RegExp(producto.trim(), 'i') : null;

        // 1. Filtros
        let queryInv = producto ? { nombre: { $regex: regex } } : {};
        let queryVts = producto ? { "productos": { $elemMatch: { $or: [{ "nombre": regex }, { "nombre_producto": regex }] } } } : {};

        if (desde || hasta) {
            const f = {};
            if (desde) f.$gte = new Date(desde);
            if (hasta) f.$lte = new Date(hasta);
            queryInv.fecha = f;
            queryVts.fecha = f;
        }

        // 2. Consultas
        const [invs, vts, clts] = await Promise.all([
            db.collection('inversions').find(queryInv).toArray(),
            db.collection('ventas').find(queryVts).toArray(),
            db.collection('clientes').find({}).toArray() // Traemos clientes para ver deuda actual
        ]);

        // 3. Cálculo de Inversión
        const inversionTotal = invs.reduce((acc, i) => acc + Number(i.costoTotal || 0), 0);

        // 4. LÓGICA DE CAJA Y FIADO REAL POR PRODUCTO
        let ventasCobradasDirectas = 0; // Efectivo/Yape en el momento
        let ventasOriginalmenteFiadas = 0; // Lo que se vendió como fiado alguna vez

        vts.forEach(v => {
            const subtotalProd = v.productos
                .filter(p => !producto || regex.test(p.nombre || p.nombre_producto || ""))
                .reduce((sum, p) => sum + Number(p.subtotal || (p.precio * p.cantidad) || 0), 0);

            const metodo = (v.metodoPago || "").toUpperCase();
            if (metodo.includes("FIADO")) {
                ventasOriginalmenteFiadas += subtotalProd;
            } else {
                ventasCobradasDirectas += subtotalProd;
            }
        });

        // 5. CALCULAR DEUDA VIVA (Lo que todavía está en la lista de deudores)
        let deudaActualReal = 0;
        if (producto) {
            // Buscamos dentro de los detalles_deuda de todos los clientes
            clts.forEach(cliente => {
                if (cliente.detalles_deuda && cliente.detalles_deuda.length > 0) {
                    const deudaDeEsteProducto = cliente.detalles_deuda
                        .filter(d => regex.test(d.nombre || d.nombre_producto || ""))
                        .reduce((sum, d) => sum + Number(d.precio || 0), 0);
                    deudaActualReal += deudaDeEsteProducto;
                }
            });
        } else {
            // Si no hay filtro, la deuda es el total de la colección clientes
            deudaActualReal = clts.reduce((acc, c) => acc + Number(c.deudaTotal || 0), 0);
        }

        // 6. EL MOMENTO CLAVE:
        // El dinero cobrado de fiados = (Todo lo que se fío alguna vez) - (Lo que todavía deben)
        const cobradoDeFiados = ventasOriginalmenteFiadas - deudaActualReal;
        
        // CAJA = Lo que se cobró al momento + Lo que se cobró después de que pagaran su deuda
        const dineroEnCaja = ventasCobradasDirectas + cobradoDeFiados;

        res.json({
            inversionTotal,
            dineroEnCaja, // Dinero físico que ya tienes (Directo + Pagos de Deudas)
            plataPorCobrar: deudaActualReal, // Lo que todavía te deben
            gananciaReal: dineroEnCaja - inversionTotal // GANANCIA = CAJA - INVERSION
        });

    } catch (e) {
        console.error(e);
        res.status(500).json({ error: e.message });
    }
});

// 5. Eliminar Inversión
app.delete('/api/inversiones/:id', async (req, res) => {
    try {
        await Inversion.findByIdAndDelete(req.params.id);
        res.json({ message: "Eliminado" });
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// 6. Nombres para Filtros
app.get('/api/nombres-inversiones', async (req, res) => {
    try {
        const nombres = await Inversion.distinct('nombre');
        res.json(nombres);
    } catch (e) { res.status(500).json([]); }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, '0.0.0.0', () => console.log(`🚀 Puerto: ${PORT}`));