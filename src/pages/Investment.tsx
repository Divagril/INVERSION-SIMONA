import React, { useState, useEffect } from 'react';
import { getProductos, guardarInversion, actualizarInversion } from '../services/api';
import { useNotification } from '../context/NotificationContext';
import { Save, RotateCcw, LayoutDashboard, ShoppingBag, Box, Package , Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PurchaseHistoryTable from '../components/PurchaseHistoryTable';

const Investment: React.FC = () => {
  const { showNotification } = useNotification();
  const navigate = useNavigate();
  const [productos, setProductos] = useState<any[]>([]);
  const [editId, setEditId] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [bloqueado, setBloqueado] = useState(false);

  const formatos = ["UNIDAD", "BOTELLA", "LATA", "KG", "LITRO", "METRO", "PAQUETE", "CAJA", "SACO", "PLANCHA", "GALÓN DE GAS" , "TIRA", "BOLSA"];
  const inicial = { nombre: '', formato: 'UNIDAD', contenido: '1', cantidad: '', costoTotal: '' };
  const [form, setForm] = useState<any>(inicial);

  useEffect(() => { getProductos().then(setProductos); }, []);

  const handleEdit = (inv: any) => {
    setEditId(inv._id);
    setForm({
      nombre: inv.nombre, 
      formato: inv.formato_compra,
      contenido: (inv.unidades_por_formato || 1).toString(), 
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
    
    const bultos = ['PAQUETE', 'CAJA', 'SACO', 'PLANCHA', 'TIRA', 'BOLSA'];
    const unidPack = bultos.includes(form.formato) ? Number(form.contenido) : 1;
    
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
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            className="btn-dashboard" 
            style={{ background: '#10b981' }} 
            onClick={() => window.open('https://simona-pl4b.onrender.com/#/inventario', '_blank')}
          >
            <Package size={20} /> INVENTARIO
          </button>
          <button className="btn-dashboard" onClick={() => navigate('/dashboard')}>
            <LayoutDashboard /> DASHBOARD
          </button>
        </div>
      </div>

      <div className="seccion-formulario-centrada">
        <div className={`tarjeta-blanca formulario ${editId ? 'borde-azul' : ''}`}>
        <div style={{background: '#e0f2fe',color: '#0369a1',padding: '15px 20px',borderRadius: '12px',marginBottom: '25px',display: 'flex',alignItems: 'center',gap: '12px',fontSize: '15px',fontWeight: '600',border: '2px solid #bae6fd'}}>
         <Info size={28} style={{ flexShrink: 0 }} />
          <span>
            <strong>Nota importante:</strong> Aquí debes registrar todos los productos que le compraste al proveedor para abastecer tu negocio.
          </span>
        </div>
          
          <label className="etiqueta-grande">Producto</label>
          <input list="prods" className="campo-gigante" value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})}/>
          <datalist id="prods">{productos.map((p, i) => <option key={i} value={p.nombre} />)}</datalist>

          <label className="etiqueta-grande">Formato de Compra</label>
          <select className="campo-gigante" value={form.formato} onChange={e => setForm({...form, formato: e.target.value, contenido: '1'})}>
            {formatos.map(f => <option key={f} value={f}>{f}</option>)}
          </select>

          {['PAQUETE', 'CAJA', 'SACO', 'PLANCHA', 'TIRA', 'BOLSA'].includes(form.formato) && (
            <div className="alerta-formato" style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', marginBottom: '20px', border: '2px dashed #cbd5e1' }}>
              <label className="etiqueta-grande"><Box size={20} /> Unidades por {form.formato}</label>
              <input type="number" className="campo-gigante" style={{ marginBottom: 0 }} value={form.contenido} onChange={e => setForm({...form, contenido: e.target.value})} />
            </div>
          )}

          <div style={{ display: 'flex', gap: '20px' }}>
            <div style={{ flex: 1 }}>
                <label className="etiqueta-grande">CANTIDAD DE {form.formato}</label>
                <input type="number" className="campo-gigante" value={form.cantidad} onChange={e => setForm({...form, cantidad: e.target.value})} />
            </div>
            <div style={{ flex: 1 }}>
                <label className="etiqueta-grande">Costo Total</label>
                <div className="contenedor-input-soles">
                    <span className="simbolo-soles">S/.</span>
                    <input type="number" className="campo-gigante input-con-prefijo" value={form.costoTotal} onChange={e => setForm({...form, costoTotal: e.target.value})} />
                </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '20px' }}>
            <button className="btn-accion-gigante btn-gris" onClick={() => {setForm(inicial); setEditId(null);}}><RotateCcw /> {editId ? 'CANCELAR' : 'LIMPIAR'}</button>
            <button className="btn-accion-gigante btn-verde" onClick={handleGuardar} disabled={bloqueado}>
                <Save /> {bloqueado ? '...' : (editId ? 'ACTUALIZAR' : 'GUARDAR')}
            </button>
          </div>
        </div>

        <div style={{ width: '100%', maxWidth: '850px', marginTop: '30px' }}>
          <PurchaseHistoryTable refreshKey={refreshKey} onEdit={handleEdit} />
        </div>
      </div>
    </div>
  );
};

export default Investment;