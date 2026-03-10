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
app.get('/api/dashboard/rentabilidad', async (req, res) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    try {
        const db = mongoose.connection.db;
        if (!db) return res.status(503).json({ error: "Conectando a BD..." });

        const { desde, hasta, producto } = req.query;

        // 1. Filtro de Inversiones
        let queryInv = producto ? { nombre: { $regex: new RegExp(producto, 'i') } } : {};

        // 2. Filtro de Ventas (buscando el producto dentro del array)
        let queryVts = {};
        if (producto) {
            queryVts = {
                "productos": { 
                    $elemMatch: { 
                        $or: [
                            { "nombre_producto": { $regex: new RegExp(producto, 'i') } },
                            { "nombre": { $regex: new RegExp(producto, 'i') } }
                        ] 
                    } 
                }
            };
        }

        if (desde || hasta) {
            const f = {};
            if (desde) f.$gte = new Date(desde);
            if (hasta) f.$lte = new Date(hasta);
            queryInv.fecha = f;
            queryVts.fecha = f;
        }

        // 3. Ejecutar consultas
        const [invs, vts, clts] = await Promise.all([
            db.collection('inversions').find(queryInv).toArray().catch(() => []),
            db.collection('ventas').find(queryVts).toArray().catch(() => []),
            db.collection('clientes').find({}).toArray().catch(() => [])
        ]);

        // --- LÓGICA DE CÁLCULO CORREGIDA ---

        const totalInversion = invs.reduce((acc, i) => acc + (Number(i.costoTotal || i.costo_total || 0)), 0);
        
        // Sumar ingresos totales de ventas (solo de los productos filtrados si hay filtro)
        const totalVentas = vts.reduce((acc, v) => {
            if (producto) {
                const subtotal = v.productos
                    .filter(p => new RegExp(producto, 'i').test(p.nombre_producto || p.nombre || ""))
                    .reduce((sum, p) => sum + (Number(p.subtotal || p.precio_total || 0)), 0);
                return acc + subtotal;
            }
            return acc + (Number(v.total || 0));
        }, 0);

        // CORRECCIÓN DE FIADOS:
        let totalFiados = 0;
        if (producto) {
            // Si hay producto, calculamos la deuda solo de las ventas filtradas que fueron fiadas
            totalFiados = vts.reduce((acc, v) => {
                // Si la venta tiene saldo pendiente (fiado)
                const deudaDeEstaVenta = Number(v.total || 0) - Number(v.monto_pagado || v.pagado || 0);
                if (deudaDeEstaVenta > 0) {
                    // Calculamos qué parte de esa deuda le corresponde al producto filtrado
                    const proporcionProducto = v.productos
                        .filter(p => new RegExp(producto, 'i').test(p.nombre_producto || p.nombre || ""))
                        .reduce((sum, p) => sum + (Number(p.subtotal || p.precio_total || 0)), 0);
                    
                    // Si la venta es de 100 y el producto es de 50, se asume que el fiado es proporcional
                    return acc + proporcionProducto; 
                }
                return acc;
            }, 0);
        } else {
            // Si no hay filtro, mostramos la deuda total de todos los clientes (como antes)
            totalFiados = clts.reduce((acc, c) => acc + (Number(c.deudaTotal || 0)), 0);
        }

        res.json({
            inversionTotal: totalInversion,
            ingresosTotalesVentas: totalVentas,
            plataPorCobrar: totalFiados,
            dineroEnCaja: totalVentas - totalFiados,
            gananciaReal: (totalVentas - totalFiados) - totalInversion
        });

    } catch (e) {
        console.error(e);
        res.status(500).json({ error: e.message });
    }
});

// 4. Actualizar Inversión
app.put('/api/inversiones/:id', async (req, res) => {
    try {
        const updated = await Inversion.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json(updated);
    } catch (e) { res.status(500).json({ error: e.message }); }
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