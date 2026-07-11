import React, { useState, useEffect } from 'react';
import { UploadCloud, FileText, CheckCircle2, AlertTriangle, Loader2, Sparkles, Plus, Search } from 'lucide-react';

export default function Dashboard({ tenant, onAddInvoice }) {
  const [tasks, setTasks] = useState([]);
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  
  // Form fields state
  const [supplierInput, setSupplierInput] = useState('');
  const [supplierCuit, setSupplierCuit] = useState('');
  const [invoiceType, setInvoiceType] = useState('1'); // 1 = Factura A
  const [pos, setPos] = useState('');
  const [number, setNumber] = useState('');
  const [dateEmission, setDateEmission] = useState('');
  const [dateDue, setDateDue] = useState('');
  
  // Tax totals
  const [neto, setNeto] = useState('0.00');
  const [iva, setIva] = useState('0.00');
  const [exento, setExento] = useState('0.00');
  const [percIva, setPercIva] = useState('0.00');
  const [percIibb, setPercIibb] = useState('0.00');
  const [percOtros, setPercOtros] = useState('0.00'); // National + Municipal + Internos
  const [total, setTotal] = useState('0.00');

  // Payment Options
  const [payType, setPayType] = useState('cta_cte'); // cta_cte, efectivo, transferencia, electronico

  // Quick Supplier Modal state
  const [showQuickSupplier, setShowQuickSupplier] = useState(false);
  const [quickCuit, setQuickCuit] = useState('');
  const [quickName, setQuickName] = useState('');
  const [quickLoading, setQuickLoading] = useState(false);

  // Auto calculate Total when parts change
  useEffect(() => {
    const n = parseFloat(neto) || 0;
    const v = parseFloat(iva) || 0;
    const e = parseFloat(exento) || 0;
    const pi = parseFloat(percIva) || 0;
    const pib = parseFloat(percIibb) || 0;
    const po = parseFloat(percOtros) || 0;
    setTotal((n + v + e + pi + pib + po).toFixed(2));
  }, [neto, iva, exento, percIva, percIibb, percOtros]);

  // Simulate dropping files
  const handleFileDrop = (e) => {
    e.preventDefault();
    const files = e.dataTransfer ? e.dataTransfer.files : e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach(file => {
      const taskId = 'task_' + Math.random().toString(36).substr(2, 9);
      const newTask = {
        id: taskId,
        name: file.name,
        status: 'processing', // processing, ready, uploaded, error
        progressText: 'Procesando con ZeroStaff AI...',
        data: null
      };

      setTasks(prev => [newTask, ...prev]);
      setSelectedTaskId(taskId);

      // Simulate AI parsing after 2.5 seconds
      setTimeout(() => {
        setTasks(prev => prev.map(t => {
          if (t.id !== taskId) return t;

          // Generate simulated invoice details
          let parsedData = {
            supplierName: 'DISTRIBUIDORA MUSTANG SRL',
            supplierCuit: '30-71126159-9',
            invoiceType: '1', // Factura A
            pos: '00099',
            number: '23125412',
            dateEmission: new Date().toISOString().split('T')[0],
            dateDue: new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0],
            neto: '74380.17',
            iva: '15619.83',
            exento: '0.00',
            percIva: '0.00',
            percIibb: '0.00',
            percOtros: '0.00',
            payType: 'cta_cte'
          };

          // Vary some details based on file name just for demo value
          if (file.name.toLowerCase().includes('telecom') || file.name.toLowerCase().includes('factura b')) {
            parsedData = {
              supplierName: 'TELECOM ARGENTINA S.A.',
              supplierCuit: '30-63945373-8',
              invoiceType: '2', // Factura B
              pos: '00004',
              number: '92837493',
              dateEmission: new Date().toISOString().split('T')[0],
              dateDue: new Date(Date.now() + 15*24*60*60*1000).toISOString().split('T')[0],
              neto: '12396.69',
              iva: '2603.31',
              exento: '0.00',
              percIva: '0.00',
              percIibb: '0.00',
              percOtros: '0.00',
              payType: 'transferencia'
            };
          } else if (file.name.toLowerCase().includes('factura x') || file.name.toLowerCase().includes('x')) {
            parsedData = {
              supplierName: 'BRAI SRL',
              supplierCuit: '33-71126159-9',
              invoiceType: '17', // Factura X
              pos: '00001',
              number: '00092837',
              dateEmission: new Date().toISOString().split('T')[0],
              dateDue: new Date().toISOString().split('T')[0],
              neto: '0.00',
              iva: '0.00',
              exento: '0.00',
              percIva: '0.00',
              percIibb: '0.00',
              percOtros: '0.00',
              payType: 'efectivo'
            };
          }

          return {
            ...t,
            status: 'ready',
            progressText: 'Lectura exitosa',
            data: parsedData
          };
        }));
      }, 2500);

    });
  };

  // Populate form fields when a task is selected or becomes ready
  const activeTask = tasks.find(t => t.id === selectedTaskId);
  useEffect(() => {
    if (activeTask && activeTask.status === 'ready' && activeTask.data) {
      const data = activeTask.data;
      setSupplierInput(data.supplierName);
      setSupplierCuit(data.supplierCuit);
      setInvoiceType(data.invoiceType);
      setPos(data.pos);
      setNumber(data.number);
      setDateEmission(data.dateEmission);
      setDateDue(data.dateDue);
      setNeto(data.neto);
      setIva(data.iva);
      setExento(data.exento);
      setPercIva(data.percIva);
      setPercIibb(data.percIibb);
      setPercOtros(data.percOtros);
      setPayType(data.payType);
    }
  }, [selectedTaskId, activeTask]);

  // Submit invoice to local history & simulate ERP upload
  const handleSaveInvoice = (e) => {
    e.preventDefault();
    if (!activeTask || activeTask.status !== 'ready') return;

    // Simulate saving/uploading to YiQi ERP
    setTasks(prev => prev.map(t => {
      if (t.id !== selectedTaskId) return t;
      return {
        ...t,
        status: 'uploaded',
        progressText: `Subida exitosa (ID: ${Math.floor(Math.random() * 8000 + 1000)})`
      };
    }));

    const invoiceTypeNameMap = {
      '1': 'Factura A',
      '2': 'Factura B',
      '3': 'Factura C',
      '17': 'Factura X'
    };

    // Add to history
    onAddInvoice({
      timestamp: Date.now(),
      invoiceId: Math.floor(Math.random() * 8000 + 1000).toString(),
      supplierName: supplierInput,
      supplierCuit: supplierCuit,
      invoiceType: invoiceType,
      invoiceTypeName: invoiceTypeNameMap[invoiceType] || 'Factura',
      posNumber: `${pos.padStart(5, '0')}-${number.padStart(8, '0')}`,
      total: parseFloat(total),
      neto: parseFloat(neto),
      iva: parseFloat(iva),
      exento: parseFloat(exento),
      percIva: parseFloat(percIva),
      percIibb: parseFloat(percIibb),
      percOtros: parseFloat(percOtros),
      payType: payType,
      isDemoMode: tenant.isDemoMode
    });

    // Clear form
    setSupplierInput('');
    setSupplierCuit('');
    setPos('');
    setNumber('');
    setNeto('0.00');
    setIva('0.00');
    setExento('0.00');
    setPercIva('0.00');
    setPercIibb('0.00');
    setPercOtros('0.00');
    setTotal('0.00');
  };

  // AFIP Lookup simulation for Quick Supplier
  const handleAfipLookup = () => {
    if (!quickCuit || quickCuit.replace(/\D/g, '').length !== 11) {
      alert('Ingresa un CUIT válido de 11 dígitos.');
      return;
    }
    setQuickLoading(true);

    setTimeout(() => {
      setQuickName('PROVEEDOR TECNOLOGICO NACION S.A.');
      setQuickLoading(false);
    }, 1500);
  };

  const handleRegisterQuickSupplier = () => {
    if (!quickName) return;
    setSupplierInput(quickName);
    setSupplierCuit(quickCuit);
    setShowQuickSupplier(false);
    setQuickCuit('');
    setQuickName('');
  };

  return (
    <div className="workspace-grid">
      
      {/* LEFT PANEL: Ingestion & Tasks Queue */}
      <div className="panel">
        <div className="panel-header">
          <h2 className="panel-title">
            <UploadCloud size={18} style={{ color: 'hsl(var(--primary))' }} />
            <span>Ingesta y Cola de Procesamiento</span>
          </h2>
        </div>

        <div className="panel-body">
          {/* File Drag and Drop Zone */}
          <div 
            className="drop-zone"
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleFileDrop}
          >
            <UploadCloud size={32} style={{ color: 'hsl(var(--text-muted))' }} />
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: '13px', fontWeight: '600' }}>Arrastrá tus PDFs contables acá</p>
              <p style={{ fontSize: '11px', color: 'hsl(var(--text-muted))', marginTop: '2px' }}>
                O haz clic para explorar archivos (Soporta múltiples facturas)
              </p>
            </div>
            <input 
              type="file" 
              multiple 
              onChange={handleFileDrop} 
              style={{ display: 'none' }} 
              id="file-input-dashboard"
            />
            <label htmlFor="file-input-dashboard" className="btn btn-secondary" style={{ height: '32px', padding: '0 12px', fontSize: '12px', cursor: 'pointer' }}>
              Buscar Archivos
            </label>
          </div>

          {/* Queue Tasks List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1, overflowY: 'auto' }}>
            {tasks.length === 0 ? (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'hsl(var(--text-muted))', gap: '8px', padding: '40px 0' }}>
                <FileText size={24} style={{ opacity: 0.5 }} />
                <span style={{ fontSize: '12px' }}>No hay comprobantes cargados en la cola de hoy.</span>
              </div>
            ) : (
              tasks.map(task => (
                <div 
                  key={task.id}
                  onClick={() => setSelectedTaskId(task.id)}
                  className={`task-card ${selectedTaskId === task.id ? 'active' : ''}`}
                  style={{ cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                    <FileText size={18} style={{ color: 'hsl(var(--primary))', flexShrink: 0 }} />
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: '13px', fontWeight: '600', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {task.name}
                      </p>
                      <p style={{ fontSize: '11px', color: 'hsl(var(--text-muted))', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {task.status === 'processing' && <Loader2 size={10} className="rotate-spinner" />}
                        {task.status === 'uploaded' && <CheckCircle2 size={10} style={{ color: 'hsl(var(--success))' }} />}
                        <span>{task.progressText}</span>
                      </p>
                    </div>
                  </div>
                  
                  {task.status === 'ready' && (
                    <span className="badge badge-success">Listo</span>
                  )}
                  {task.status === 'processing' && (
                    <span className="badge badge-warning pulse">Analizando</span>
                  )}
                  {task.status === 'uploaded' && (
                    <span className="badge badge-info">Subido</span>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Embedded PDF Viewer Sim */}
          {activeTask && (
            <div className="glass" style={{ height: '140px', borderRadius: '8px', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '8px' }}>
              <FileText size={24} style={{ color: 'hsl(var(--text-muted))' }} />
              <div style={{ textAlign: 'center' }}>
                <span style={{ fontSize: '11px', color: 'hsl(var(--text-muted))', display: 'block' }}>Vista previa de documento</span>
                <span style={{ fontSize: '12px', fontWeight: '600' }}>{activeTask.name}</span>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* RIGHT PANEL: Dynamic Form details */}
      <div className="panel">
        <div className="panel-header">
          <h2 className="panel-title">
            <Sparkles size={18} style={{ color: 'hsl(var(--primary))' }} />
            <span>Detalles del Comprobante (Lectura IA)</span>
          </h2>
        </div>

        <div className="panel-body">
          {(!activeTask || activeTask.status === 'processing') ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'hsl(var(--text-muted))', gap: '8px', textAlign: 'center', padding: '40px' }}>
              <Loader2 size={32} className={activeTask?.status === 'processing' ? 'rotate-spinner' : ''} style={{ color: 'hsl(var(--primary))', opacity: 0.8 }} />
              <p style={{ fontSize: '13px', fontWeight: '600' }}>
                {activeTask?.status === 'processing' ? 'Procesando lectura con IA...' : 'No hay comprobante seleccionado'}
              </p>
              <p style={{ fontSize: '11px', maxWidth: '240px' }}>
                {activeTask?.status === 'processing' ? 'La IA está extrayendo los campos contables impositivos al instante.' : 'Selecciona una factura de la cola para auditar e imputar los pagos.'}
              </p>
            </div>
          ) : (
            <form onSubmit={handleSaveInvoice} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              
              {/* Supplier Section with Quick Add */}
              <div className="form-group" style={{ marginBottom: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label>Proveedor</label>
                  <button 
                    type="button" 
                    onClick={() => setShowQuickSupplier(true)}
                    className="btn btn-secondary" 
                    style={{ height: '22px', fontSize: '10px', padding: '0 8px', gap: '4px' }}
                  >
                    <Plus size={10} />
                    <span>Alta Rápida</span>
                  </button>
                </div>
                <input 
                  type="text" 
                  value={supplierInput} 
                  onChange={(e) => setSupplierInput(e.target.value)} 
                  placeholder="Razón Social del Proveedor"
                  required
                />
              </div>

              {/* Grid 1: CUIT and Invoice Type */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label>CUIT</label>
                  <input 
                    type="text" 
                    value={supplierCuit} 
                    onChange={(e) => setSupplierCuit(e.target.value)} 
                    placeholder="CUIT del Proveedor"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Tipo de Comprobante</label>
                  <select 
                    value={invoiceType} 
                    onChange={(e) => setInvoiceType(e.target.value)}
                  >
                    <option value="1">Factura A (001)</option>
                    <option value="2">Factura B (006)</option>
                    <option value="3">Factura C (011)</option>
                    <option value="17">Factura X (000)</option>
                  </select>
                </div>
              </div>

              {/* Grid 2: POS and Number */}
              <div style={{ display: 'grid', gridTemplateColumns: '0.4fr 1.6fr', gap: '12px' }}>
                <div className="form-group">
                  <label>Pto. Venta</label>
                  <input 
                    type="text" 
                    value={pos} 
                    onChange={(e) => setPos(e.target.value)} 
                    placeholder="00001"
                    maxLength={5}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Número Factura</label>
                  <input 
                    type="text" 
                    value={number} 
                    onChange={(e) => setNumber(e.target.value)} 
                    placeholder="00000001"
                    maxLength={20}
                    required
                  />
                </div>
              </div>

              {/* Grid 3: Dates */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label>Fecha Emisión</label>
                  <input 
                    type="date" 
                    value={dateEmission} 
                    onChange={(e) => setDateEmission(e.target.value)} 
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Fecha Vencimiento</label>
                  <input 
                    type="date" 
                    value={dateDue} 
                    onChange={(e) => setDateDue(e.target.value)} 
                    required
                  />
                </div>
              </div>

              {/* Tax totals fields */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', background: 'rgba(0,0,0,0.15)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)' }}>
                <div className="form-group">
                  <label>Neto Gravado</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    value={neto} 
                    onChange={(e) => setNeto(e.target.value)} 
                  />
                </div>
                <div className="form-group">
                  <label>IVA Liquidado</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    value={iva} 
                    onChange={(e) => setIva(e.target.value)} 
                  />
                </div>
                <div className="form-group">
                  <label>Exento / No Grav.</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    value={exento} 
                    onChange={(e) => setExento(e.target.value)} 
                  />
                </div>
              </div>

              {/* Perceptions fields */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', background: 'rgba(0,0,0,0.15)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)' }}>
                <div className="form-group">
                  <label>Perc. IVA</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    value={percIva} 
                    onChange={(e) => setPercIva(e.target.value)} 
                  />
                </div>
                <div className="form-group">
                  <label>Perc. IIBB</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    value={percIibb} 
                    onChange={(e) => setPercIibb(e.target.value)} 
                  />
                </div>
                <div className="form-group">
                  <label>Otros Impuestos</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    value={percOtros} 
                    onChange={(e) => setPercOtros(e.target.value)} 
                  />
                </div>
              </div>

              {/* Total Display & Payment Options */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '6px 0', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '12px' }}>
                <span style={{ fontSize: '13px', fontWeight: '700', color: 'hsl(var(--text-muted))' }}>Importe Total</span>
                <span style={{ fontSize: '20px', fontWeight: '800', color: 'hsl(var(--success))' }}>$ {total}</span>
              </div>

              <div className="form-group">
                <label>Forma de Pago (Imputación Inmediata)</label>
                <select value={payType} onChange={(e) => setPayType(e.target.value)}>
                  <option value="cta_cte">Cuenta Corriente (Pendiente)</option>
                  <option value="efectivo">Efectivo (Caja General)</option>
                  <option value="transferencia">Transferencia (Cuenta Banco)</option>
                  <option value="electronico">Tarjeta de Crédito / Electrónico</option>
                </select>
              </div>

              {activeTask.status === 'ready' ? (
                <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '6px', height: '42px' }}>
                  <span>Aprobar y Registrar en ERP</span>
                </button>
              ) : (
                <div className="badge badge-success" style={{ width: '100%', padding: '12px', justifyContent: 'center', borderRadius: '8px', fontSize: '12px' }}>
                  Comprobante Subido con éxito a YiQi ERP
                </div>
              )}

            </form>
          )}
        </div>
      </div>

      {/* Quick Supplier AFIP Lookup Modal */}
      {showQuickSupplier && (
        <div className="modal-overlay">
          <div className="modal" style={{ width: '380px' }}>
            <div className="modal-header">
              <h4 style={{ fontWeight: 700 }}>Alta Rápida de Proveedor</h4>
              <button onClick={() => setShowQuickSupplier(false)} className="btn btn-secondary btn-icon-only" style={{ background: 'none', border: 'none', padding: 0 }}>
                <X size={16} />
              </button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div className="form-group">
                <label>CUIT (Sin guiones)</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input 
                    type="text" 
                    placeholder="30711261599" 
                    value={quickCuit}
                    onChange={(e) => setQuickCuit(e.target.value)}
                  />
                  <button 
                    type="button" 
                    onClick={handleAfipLookup}
                    className="btn btn-secondary"
                    disabled={quickLoading}
                    style={{ gap: '4px' }}
                  >
                    {quickLoading ? <Loader2 size={12} className="rotate-spinner" /> : <Search size={12} />}
                    <span>AFIP</span>
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label>Razón Social (AFIP)</label>
                <input 
                  type="text" 
                  placeholder="Razón Social Autocompletada" 
                  value={quickName}
                  onChange={(e) => setQuickName(e.target.value)}
                  readOnly={!quickName}
                />
              </div>

              <button 
                type="button" 
                onClick={handleRegisterQuickSupplier}
                className="btn btn-primary"
                disabled={!quickName}
                style={{ width: '100%' }}
              >
                <span>Vincular Proveedor</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
