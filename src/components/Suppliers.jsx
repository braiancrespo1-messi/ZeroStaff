import React, { useState } from 'react';
import { Users, Search, Plus, MapPin, Loader2, X } from 'lucide-react';

export default function Suppliers({ suppliers, accounts, useAccounting, onAddSupplier }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  
  // Form fields
  const [cuit, setCuit] = useState('');
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [taxCondition, setTaxCondition] = useState('Responsable Inscripto');
  const [defaultAccount, setDefaultAccount] = useState(accounts[0]?.code || '6101');
  const [loading, setLoading] = useState(false);

  // Filter suppliers
  const filteredSuppliers = suppliers.filter(sup => 
    String(sup.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(sup.cuit || '').replace(/\D/g, '').includes(searchTerm.replace(/\D/g, ''))
  );

  const handleAfipLookup = async () => {
    const cleanCuit = cuit.replace(/\D/g, '');
    if (cleanCuit.length !== 11) {
      alert('Por favor ingresa un CUIT válido de 11 dígitos.');
      return;
    }
    setLoading(true);

    try {
      const res = await fetch(`https://us-central1-tmc-backend-2f5c4.cloudfunctions.net/consultarCuitAfip?cuit=${cleanCuit}&ignoreYiqi=true`);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const json = await res.json();
      if (json.success && json.data) {
        const data = json.data;
        setName(data.socialName || data.razonSocial || 'LOGISTICA EXPRESS S.A.');
        setAddress(data.address || data.domicilio || 'Av. de Mayo 789, CABA');
        
        let cond = 'Responsable Inscripto';
        const ivaRaw = String(data.ivaCondition || '').toLowerCase();
        if (ivaRaw.includes('monotributo') || ivaRaw.includes('monotributista')) {
          cond = 'Monotributista';
        } else if (ivaRaw.includes('exento')) {
          cond = 'Exento';
        }
        setTaxCondition(cond);
      } else {
        throw new Error(json.error || 'CUIT no encontrado en el padrón AFIP');
      }
    } catch (err) {
      console.error("[ZeroStaff AFIP] Error en consulta de CUIT:", err);
      alert(err.message || 'Error al conectar con la consulta de CUIT de AFIP.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name || !cuit) return;

    onAddSupplier({
      cuit: cuit.replace(/\D/g, ''),
      name: name.trim(),
      address: address.trim() || 'Sin Domicilio Registrado',
      taxCondition: taxCondition,
      defaultAccount: defaultAccount
    });

    // Reset
    setCuit('');
    setName('');
    setAddress('');
    setDefaultAccount(accounts[0]?.code || '6101');
    setShowAddModal(false);
  };

  const getAccountName = (code) => {
    const acc = accounts.find(a => a.code === code);
    return acc ? `${acc.code} - ${acc.name}` : code;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '20px', flex: 1, overflowY: 'auto' }}>
      
      {/* Header Toolbar */}
      <div className="glass" style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px 20px',
        borderRadius: '12px',
        gap: '16px'
      }}>
        {/* Search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', position: 'relative', flex: 1, maxWidth: '320px' }}>
          <Search size={14} style={{ color: 'hsl(var(--text-muted))', position: 'absolute', left: '10px', top: '12px' }} />
          <input 
            type="text" 
            placeholder="Buscar proveedor por nombre o CUIT..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '32px', height: '36px' }}
          />
        </div>

        {/* Add Button */}
        <button onClick={() => setShowAddModal(true)} className="btn btn-primary" style={{ gap: '6px' }}>
          <Plus size={16} />
          <span>Agregar Proveedor</span>
        </button>
      </div>

      {/* Grid of Supplier Cards (Fichas) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
        gap: '20px',
        overflowY: 'auto',
        flex: 1
      }}>
        {filteredSuppliers.length === 0 ? (
          <div style={{ gridColumn: '1/-1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'hsl(var(--text-muted))', gap: '12px', padding: '60px 0' }}>
            <Users size={32} style={{ opacity: 0.5 }} />
            <span style={{ fontSize: '14px' }}>No se encontraron fichas de proveedores registradas.</span>
          </div>
        ) : (
          filteredSuppliers.map(sup => (
            <div key={sup.cuit} className="panel" style={{ padding: '18px', gap: '12px', position: 'relative' }}>
              
              {/* Card top */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ minWidth: 0 }}>
                  <h3 style={{ fontSize: '15px', fontWeight: '700', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'hsl(var(--text-main))' }} title={sup.name}>
                    {sup.name}
                  </h3>
                  <span style={{ fontSize: '11px', color: 'hsl(var(--text-muted))', fontFamily: 'monospace' }}>
                    CUIT: {sup.cuit.replace(/(\d{2})(\d{8})(\d{1})/, '$1-$2-$3')}
                  </span>
                </div>
                <span className="badge badge-info" style={{ fontSize: '10px' }}>
                  {sup.taxCondition}
                </span>
              </div>

              {/* Card details */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px', color: 'hsl(var(--text-muted))', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '10px' }}>
                
                {/* Domicilio */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
                  <MapPin size={13} style={{ marginTop: '2px', flexShrink: 0, color: 'hsl(var(--primary))' }} />
                  <span style={{ lineHeight: '1.4' }}>{sup.address}</span>
                </div>

                {/* Cuenta de Gasto */}
                {useAccounting && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(168, 85, 247, 0.05)', border: '1px solid rgba(168, 85, 247, 0.12)', padding: '6px 10px', borderRadius: '6px', marginTop: '4px' }}>
                    <span style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', color: 'hsl(var(--primary))' }}>Gasto:</span>
                    <span style={{ fontWeight: '600', color: 'hsl(var(--text-main))' }}>
                      {getAccountName(sup.defaultAccount)}
                    </span>
                  </div>
                )}

              </div>

            </div>
          ))
        )}
      </div>

      {/* Manual Creation Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal" style={{ width: '440px' }}>
            <div className="modal-header">
              <h3 style={{ fontWeight: '700' }}>Nueva Ficha de Proveedor</h3>
              <button onClick={() => setShowAddModal(false)} className="btn btn-secondary btn-icon-only" style={{ background: 'none', border: 'none', padding: 0 }}>
                <X size={18} style={{ color: 'hsl(var(--text-muted))' }} />
              </button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                
                {/* CUIT AFIP lookup */}
                <div className="form-group">
                  <label>CUIT (Sin guiones)</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input 
                      type="text" 
                      placeholder="Ej. 30711261599" 
                      value={cuit}
                      onChange={(e) => setCuit(e.target.value)}
                      required
                    />
                    <button 
                      type="button" 
                      onClick={handleAfipLookup}
                      className="btn btn-secondary"
                      disabled={loading}
                      style={{ gap: '4px' }}
                    >
                      {loading ? <Loader2 size={12} className="rotate-spinner" /> : <Search size={12} />}
                      <span>AFIP</span>
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label>Razón Social (Nombre)</label>
                  <input 
                    type="text" 
                    placeholder="Razón Social del Proveedor" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Domicilio Fiscal</label>
                  <input 
                    type="text" 
                    placeholder="Dirección Legal completa" 
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
                  <div className="form-group">
                    <label>Condición Fiscal (IVA)</label>
                    <select 
                      value={taxCondition}
                      onChange={(e) => setTaxCondition(e.target.value)}
                    >
                      <option value="Responsable Inscripto">Responsable Inscripto</option>
                      <option value="Monotributista">Monotributista</option>
                      <option value="Exento">Exento</option>
                    </select>
                  </div>
                </div>

                {useAccounting && (
                  <div className="form-group">
                    <label>Asignación de Cuenta Contable (Gasto por Defecto)</label>
                    <select 
                      value={defaultAccount}
                      onChange={(e) => setDefaultAccount(e.target.value)}
                    >
                      {accounts.map(acc => (
                        <option key={acc.code} value={acc.code}>
                          {acc.code} - {acc.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '10px' }}>
                  <span>Guardar Ficha del Proveedor</span>
                </button>

              </form>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
