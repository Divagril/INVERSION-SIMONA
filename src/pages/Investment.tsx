import React, { useState, useEffect } from 'react';
import { getProductos, guardarInversion, actualizarInversion } from '../services/api';
import { useNotification } from '../context/NotificationContext';
import { Save, RotateCcw, LayoutDashboard, ShoppingBag, Box } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PurchaseHistoryTable from '../components/PurchaseHistoryTable';

const Investment: React.FC = () => {
  const { showNotification } = useNotification();
  const navigate = useNavigate();
  const [productos, setProductos] = useState<any[]>([]);
  const [editId, setEditId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [bloqueado, setBloqueado] = useState(false);
  const formatos = [
  "UNIDAD", "BOTELLA", "LATA", "LATAS", "KG", 
  "LITRO", "METRO", "PAQUETE", "CAJA", 
  "SACO", "PLANCHA", "GALÓN DE GAS"
];
  
  // Usamos strings vacíos para que los inputs se puedan limpiar totalmente
  const inicial = { nombre: '', formato: 'UNIDAD', contenido: '1', cantidad: '', costoTotal: '' };
  const [form, setForm] = useState<any>(inicial);

  useEffect(() => { getProductos().then(setProductos); }, []);

  const handleEdit = (inv: any) => {
    setEditId(inv._id);
    setForm({
      nombre: inv.nombre, 
      formato: inv.formato_compra,
      contenido: inv.unidades_por_formato.toString(), 
      cantidad: inv.cantidad_formato.toString(),
      costoTotal: inv.costo_total.toString()
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGuardar = async () => {
    if (!form.nombre || !form.cantidad || !form.costoTotal) {
        return showNotification("⚠️ Llene los campos obligatorios", true);
    }
    
    setBloqueado(true);
    const esBulto = ['PAQUETE', 'CAJA', 'SACO', 'PLANCHA', 'LATAS'].includes(form.formato);
    const unidPack = (form.formato === 'PAQUETE' || form.formato === 'CAJA') ? Number(form.contenido) : 1;
    
    const datos = {
      nombre: form.nombre, 
      formato: form.formato,
      cantidadFormato: Number(form.cantidad),
      unidadesPorFormato: unidPack,
      costoTotal: Number(form.costoTotal)
    };

    try {
      if (editId) {
        await actualizarInversion(editId, datos);
        showNotification("✅ ACTUALIZADO");
      } else {
        await guardarInversion(datos);
        showNotification("✅ GUARDADO");
      }
      
      setForm(inicial);
      setEditId(null);
      setRefreshKey(k => k + 1);
    } catch (e: any) { 
      showNotification(`❌ Error de conexión`, true); 
    } finally {
      setBloqueado(false);
    }
  };

  return (
    <div className="pantalla-principal">
      <div className="barra-titulo">
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <ShoppingBag size={40} /> 
          <span>{editId ? 'MODO EDICIÓN' : 'REGISTRO DE COMPRA'}</span>
        </div>
        <button className="btn-dashboard" onClick={() => navigate('/dashboard')}><LayoutDashboard /> DASHBOARD</button>
      </div>

      <div className="seccion-formulario-centrada" style={{ flexDirection: 'column', alignItems: 'center' }}>
        <div className={`tarjeta-blanca formulario ${editId ? 'borde-azul' : ''}`}>
          
          <label className="etiqueta-grande">Producto</label>
          <input list="prods" className="campo-gigante" value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})} placeholder="Ej: Azucar" />
          <datalist id="prods">{productos.map((p, i) => <option key={i} value={p.nombre} />)}</datalist>

          <label className="etiqueta-grande">Formato de Compra</label>
          <select className="campo-gigante" value={form.formato} onChange={e => setForm({...form, formato: e.target.value, contenido: '1'})}>
            {formatos.map(f => <option key={f} value={f}>{f}</option>)}
          </select>

          {(form.formato === 'PAQUETE' || 
            form.formato === 'CAJA' || 
            form.formato === 'SACO' || 
            form.formato === 'PLANCHA' || 
            form.formato === 'LATAS') && (
            <div className="alerta-formato">
              <label className="etiqueta-grande"><Box size={20} /> Unidades por {form.formato}</label>
              <input 
                type="number" 
                className="campo-gigante" 
                value={form.contenido} 
                onChange={e => setForm({...form, contenido: e.target.value})} 
              />
            </div>
          )}

          <div style={{ display: 'flex', gap: '20px' }}>
            <div style={{ flex: 1 }}>
                <label className="etiqueta-grande">Cantidad</label>
                <input 
                    type="number" 
                    className="campo-gigante" 
                    value={form.cantidad} 
                    onChange={e => setForm({...form, cantidad: e.target.value})} 
                />
            </div>
            <div style={{ flex: 1 }}>
                <label className="etiqueta-grande">Costo Total</label>
                <div className="contenedor-input-soles">
                    <span className="simbolo-soles">S/.</span>
                    <input 
                        type="number" 
                        className="campo-gigante input-con-prefijo" 
                        value={form.costoTotal} 
                        onChange={e => setForm({...form, costoTotal: e.target.value})} 
                    />
                </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '20px', marginTop: '20px' }}>
            <button className="btn-accion-gigante btn-gris" onClick={() => {setForm(inicial); setEditId(null);}}><RotateCcw /> {editId ? 'CANCELAR' : 'LIMPIAR'}</button>
            <button className="btn-accion-gigante btn-verde" onClick={handleGuardar} disabled={bloqueado}>
                <Save /> {bloqueado ? '...' : (editId ? 'ACTUALIZAR' : 'GUARDAR')}
            </button>
          </div>
        </div>

        <div style={{ width: '100%', maxWidth: '850px' }}>
          <PurchaseHistoryTable refreshKey={refreshKey} onEdit={handleEdit} />
        </div>
      </div>
    </div>
  );
};

export default Investment;