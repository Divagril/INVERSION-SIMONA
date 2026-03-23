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
        if (!db) return res.status(503).json({ error: "Conectando a la base de datos..." });

        const { desde, hasta, producto } = req.query;
        const regex = producto ? new RegExp(producto, 'i') : null;

        // 1. FILTROS PARA MONGODB
        let queryInv = producto ? { nombre: { $regex: regex } } : {};
        
        // Filtro para Ventas: busca en el array 'productos' ya sea en 'nombre' o 'nombre_producto'
        let queryVts = producto ? {
            "productos": {
                $elemMatch: {
                    $or: [
                        { "nombre": { $regex: regex } },
                        { "nombre_producto": { $regex: regex } }
                    ]
                }
            }
        } : {};

        if (desde || hasta) {
            const f = {};
            if (desde) f.$gte = new Date(desde);
            if (hasta) f.$lte = new Date(hasta);
            queryInv.fecha = f;
            queryVts.fecha = f;
        }

        const [invs, vts, clts] = await Promise.all([
            db.collection('inversions').find(queryInv).toArray(),
            db.collection('ventas').find(queryVts).toArray(),
            db.collection('clientes').find({}).toArray()
        ]);

        // 2. CÁLCULO DE INVERSIÓN
        const inversionTotal = invs.reduce((acc, i) => acc + Number(i.costoTotal || i.costo_total || 0), 0);

        // 3. CÁLCULO DE CAJA Y FIADOS (DESDE VENTAS)
        let dineroEnCaja = 0;
        let plataPorCobrar = 0;

        vts.forEach(v => {
            // Sumamos solo el valor que corresponde al producto filtrado en esta boleta
            const subtotalEsteProducto = v.productos
                .filter(p => !producto || regex.test(p.nombre || p.nombre_producto || ""))
                .reduce((sum, p) => sum + Number(p.subtotal || p.precio_total || (p.precio * p.cantidad) || 0), 0);

            // Normalizamos el método de pago para que no importe si es minúscula o tiene espacios
            const metodo = (v.metodoPago || "").toString().trim().toUpperCase();

            if (metodo === "FIADO") {
                plataPorCobrar += subtotalEsteProducto;
            } else {
                // Si es YAPE, EFECTIVO, PLIN, etc, es dinero cobrado -> VA A CAJA
                dineroEnCaja += subtotalEsteProducto;
            }
        });

        // 4. AJUSTE PARA VISTA GLOBAL (SI NO HAY FILTRO DE PRODUCTO)
        // Si no hay producto, usamos la deuda de la colección clientes para ser más exactos con la vista de deudas.
        if (!producto) {
            plataPorCobrar = clts.reduce((acc, c) => acc + Number(c.deudaTotal || 0), 0);
        }

        res.json({
            inversionTotal,
            dineroEnCaja,
            plataPorCobrar,
            // FÓRMULA SOLICITADA: GANANCIA = LO QUE ENTRO (CAJA) - LO QUE GASTASTE (INVERSION)
            gananciaReal: dineroEnCaja - inversionTotal
        });

    } catch (e) {
        console.error("Error en Dashboard:", e);
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