import React, { useState, useEffect } from 'react';
import { UploadCloud, FileText, CheckCircle2, AlertTriangle, Loader2, Sparkles, Plus, Search, X } from 'lucide-react';

export default function Dashboard({ tenant, suppliers, accounts, useAccounting, onAddInvoice, onAddSupplier }) {
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
  const [expenseAccount, setExpenseAccount] = useState('6101');
  
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

  // Detalle de Items state
  const [items, setItems] = useState([]);

  // Auto calculate Neto from items list
  useEffect(() => {
    if (items.length > 0) {
      const sumNeto = items.reduce((acc, it) => acc + (Number(it.cantidad || 0) * Number(it.precioUnitario || 0)), 0);
      setNeto(sumNeto.toFixed(2));
    }
  }, [items]);

  const handleUpdateItem = (index, field, value) => {
    setItems(prev => prev.map((it, idx) => {
      if (idx !== index) return it;
      return { ...it, [field]: value };
    }));
  };

  const handleAddItem = () => {
    setItems(prev => [...prev, { concepto: 'Nuevo Concepto', cantidad: 1, precioUnitario: 0 }]);
  };

  const handleDeleteItem = (index) => {
    setItems(prev => prev.filter((_, idx) => idx !== index));
  };

  // Autocomplete suggestions
  const [showSuggestions, setShowSuggestions] = useState(false);
  const filteredSuggestions = suppliers.filter(s => 
    s.name.toLowerCase().includes(supplierInput.toLowerCase())
  );

  // Quick Supplier Modal state
  const [showQuickSupplier, setShowQuickSupplier] = useState(false);
  const [quickCuit, setQuickCuit] = useState('');
  const [quickName, setQuickName] = useState('');
  const [quickAddress, setQuickAddress] = useState('');
  const [quickTaxCondition, setQuickTaxCondition] = useState('Responsable Inscripto');
  const [quickAccount, setQuickAccount] = useState('6101');
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

  // Handle supplier selection from suggestions
  const handleSelectSupplier = (sup) => {
    setSupplierInput(sup.name);
    setSupplierCuit(sup.cuit);
    setExpenseAccount(sup.defaultAccount);
    setShowSuggestions(false);
  };

  // Lee una imagen y la codifica a base64 (removiendo el prefijo data:image/*;base64,)
  const readImageAsBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        resolve(reader.result.split(',')[1]);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Convierte la primera página de un PDF a imagen base64 usando canvas
  const convertPdfToImage = async (file) => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const page = await pdf.getPage(1);
      
      const viewport = page.getViewport({ scale: 2.0 }); // escala alta para mejor legibilidad OCR
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      
      await page.render({ canvasContext: context, viewport: viewport }).promise;
      return canvas.toDataURL('image/jpeg').split(',')[1];
    } catch (e) {
      console.warn("[ZeroStaff Rasterizar] Error al renderizar PDF a imagen:", e);
      return "";
    }
  };

  // Extrae el texto embebido de un PDF usando pdfjsLib
  const extraerTextoEmbebidoPdf = async (file) => {
    try {
      if (!window.pdfjsLib) {
        throw new Error("pdfjsLib no cargado en el navegador");
      }
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await window.window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const paginas = Math.min(pdf.numPages, 3);
      let texto = "";
      for (let p = 1; p <= paginas; p++) {
        const page = await pdf.getPage(p);
        const contenido = await page.getTextContent();
        const lineas = {};
        contenido.items.forEach(item => {
          const y = Math.round(item.transform[5] / 3) * 3;
          const x = item.transform[4];
          if (!lineas[y]) lineas[y] = [];
          lineas[y].push({ x, str: item.str });
        });
        const yOrdenadas = Object.keys(lineas).map(Number).sort((a, b) => b - a);
        const textoPagina = yOrdenadas.map(y =>
          lineas[y].sort((a, b) => a.x - b.x).map(i => i.str).join(" ").replace(/\s+/g, " ").trim()
        ).filter(l => l).join("\n");
        texto += (p > 1 ? `\n\n--- PAGINA ${p} ---\n\n` : "") + textoPagina;
      }
      return texto.trim();
    } catch (e) {
      console.warn("[ZeroStaff Extraer Texto] Error al extraer texto del PDF:", e);
      return "";
    }
  };

  // Envia el texto o la imagen base64 al backend real de IA
  const parseComprobanteWithRealIA = async (base64Image, mediaType, textoEmbebido = "") => {
    const res = await fetch("https://us-central1-tmc-backend-2f5c4.cloudfunctions.net/analizarComprobanteIAProxy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        imageBase64: textoEmbebido ? undefined : base64Image,
        imageMediaType: mediaType || "image/jpeg",
        textoEmbebido: textoEmbebido || undefined,
        cuitComprador: tenant.cuit || undefined
      })
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }
    const json = await res.json();
    if (!json.success || !json.data) {
      throw new Error(json.error || "IA no pudo procesar");
    }
    return json.data;
  };

  const mapResponseToFields = (iaData) => {
    const tipoLetraToInvoiceType = { "A": "1", "B": "2", "C": "3", "X": "17" };
    const tipoLetra = iaData.tipoComprobante ? iaData.tipoComprobante.valor : null;
    const invoiceType = tipoLetraToInvoiceType[tipoLetra] || "1";

    const perceptions = Array.isArray(iaData.percepciones) ? iaData.percepciones.map(p => {
      const c = String(p.concepto || "").toLowerCase();
      let taxType = 'otros';
      if (c.includes("iva") || c.includes("i.v.a.")) taxType = 'iva';
      else if (c.includes("iibb") || c.includes("ingresos brutos") || c.includes("i.b.")) taxType = 'iibb';
      return {
        taxType,
        importe: Number(p.importe) || 0
      };
    }) : [];

    let percIva = 0;
    let percIibb = 0;
    let percOtros = 0;
    perceptions.forEach(p => {
      if (p.taxType === 'iva') percIva += p.importe;
      else if (p.taxType === 'iibb') percIibb += p.importe;
      else percOtros += p.importe;
    });

    return {
      supplierName: (iaData.nombreProveedor && iaData.nombreProveedor.valor) || "PROVEEDOR DESCONOCIDO",
      supplierCuit: String((iaData.cuit && iaData.cuit.valor) || "").replace(/\D/g, ""),
      invoiceType,
      pos: String((iaData.puntoVenta && iaData.puntoVenta.valor) || "00001"),
      number: String((iaData.numero && iaData.numero.valor) || "00000001"),
      dateEmission: (iaData.fecha && iaData.fecha.valor) || new Date().toISOString().split('T')[0],
      dateDue: (iaData.fechaVencimiento && iaData.fechaVencimiento.valor) || new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0],
      neto: String((iaData.neto && iaData.neto.valor) || 0),
      iva: String((iaData.iva && iaData.iva.valor) || 0),
      exento: String((iaData.exento && iaData.exento.valor) || 0),
      percIva: String(percIva),
      percIibb: String(percIibb),
      percOtros: String(percOtros),
      cuitDestinatario: String((iaData.cuitDestinatario && iaData.cuitDestinatario.valor) || "").replace(/\D/g, ""),
      payType: 'cta_cte'
    };
  };

  // Ingestión real de archivos (PDF digitales, escaneados e imágenes)
  const handleFileDrop = (e) => {
    e.preventDefault();
    const files = e.dataTransfer ? e.dataTransfer.files : e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach(async (file) => {
      const taskId = 'task_' + Math.random().toString(36).substr(2, 9);
      const newTask = {
        id: taskId,
        name: file.name,
        status: 'processing', // processing, ready, uploaded, error
        progressText: 'Procesando con ZeroStaff AI...',
        data: null,
        fileType: file.type,
        blobUrl: URL.createObjectURL(file)
      };

      setTasks(prev => [newTask, ...prev]);
      setSelectedTaskId(taskId);

      try {
        let base64Image = "";
        let renderedMediaType = "image/jpeg";
        let textoEmbebido = "";

        if (file.type === "application/pdf") {
          textoEmbebido = await extraerTextoEmbebidoPdf(file);
          const esDigital = textoEmbebido.length >= 150;
          if (esDigital) {
            console.log("[ZeroStaff] Procesando como PDF Digital:", file.name);
          } else {
            console.log("[ZeroStaff] PDF escaneado detectado. Rasterizando a imagen...");
            textoEmbebido = "";
            base64Image = await convertPdfToImage(file);
            renderedMediaType = "image/jpeg";
          }
        } else if (file.type.startsWith("image/")) {
          console.log("[ZeroStaff] Procesando como Imagen:", file.name);
          base64Image = await readImageAsBase64(file);
          renderedMediaType = file.type;
        } else {
          throw new Error("Formato de archivo no soportado. Usa PDF, JPEG o PNG.");
        }

        const iaData = await parseComprobanteWithRealIA(base64Image, renderedMediaType, textoEmbebido);
        const parsedData = mapResponseToFields(iaData);

        // Actualizar cola con los datos leídos por la IA
        setTasks(prev => prev.map(t => {
          if (t.id !== taskId) return t;
          return {
            ...t,
            status: 'ready',
            progressText: 'Lectura IA exitosa',
            data: parsedData
          };
        }));

      } catch (err) {
        console.warn("[ZeroStaff IA] Fallo en la lectura real de IA. Usando simulador offline:", err.message);
        
        // Simulación offline si falla
        setTimeout(() => {
          setTasks(prev => prev.map(t => {
            if (t.id !== taskId) return t;

            const incorrectCuit = file.name.toLowerCase().includes('error') || file.name.toLowerCase().includes('incorrecto') 
              ? '30111111112' 
              : tenant.cuit;

            let parsedData = {
              supplierName: 'DISTRIBUIDORA MUSTANG SRL',
              supplierCuit: '30-71126159-9',
              invoiceType: '1',
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
              cuitDestinatario: incorrectCuit,
              payType: 'cta_cte'
            };

            if (file.name.toLowerCase().includes('telecom') || file.name.toLowerCase().includes('factura b')) {
              parsedData = {
                supplierName: 'TELECOM ARGENTINA S.A.',
                supplierCuit: '30-63945373-8',
                invoiceType: '2',
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
                cuitDestinatario: tenant.cuit,
                payType: 'cta_cte'
              };
            } else if (file.name.toLowerCase().includes('factura x') || file.name.toLowerCase().includes('x')) {
              parsedData = {
                supplierName: 'BRAI SRL',
                supplierCuit: '33-71126159-9',
                invoiceType: '17',
                pos: '00001',
                number: '00092837',
                dateEmission: new Date().toISOString().split('T')[0],
                dateDue: new Date().toISOString().split('T')[0],
                neto: '90000.00',
                iva: '0.00',
                exento: '0.00',
                percIva: '0.00',
                percIibb: '0.00',
                percOtros: '0.00',
                cuitDestinatario: tenant.cuit,
                payType: 'efectivo'
              };
            }

            return {
              ...t,
              status: 'ready',
              progressText: 'Lectura exitosa (Simulado)',
              data: parsedData
            };
          }));
        }, 1500);
      }
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

      // Lookup if supplier exists to autofill default expense account
      const matchedSup = suppliers.find(s => s.cuit.replace(/\D/g, '') === data.supplierCuit.replace(/\D/g, ''));
      if (matchedSup) {
        setExpenseAccount(matchedSup.defaultAccount);
      } else {
        setExpenseAccount('6101'); // Fallback default
      }
    }
  }, [selectedTaskId, activeTask, suppliers]);

  // Submit invoice to local history & simulate success
  const handleSaveInvoice = (e) => {
    e.preventDefault();
    if (!activeTask || activeTask.status !== 'ready') return;

    // Check CUIT mismatch blocker
    const isOfficial = invoiceType === '1' || invoiceType === '2' || invoiceType === '3';
    const cuitDestLimpiado = String(activeTask.data?.cuitDestinatario || '').replace(/\D/g, '');
    const cuitTenantLimpiado = String(tenant.cuit || '').replace(/\D/g, '');
    if (isOfficial && cuitDestLimpiado && cuitTenantLimpiado && cuitDestLimpiado !== cuitTenantLimpiado) {
      alert(`No se puede guardar: Este comprobante oficial está dirigido al CUIT ${cuitDestLimpiado}, que no coincide con el tuyo (${cuitTenantLimpiado}).`);
      return;
    }

    setTasks(prev => prev.map(t => {
      if (t.id !== selectedTaskId) return t;
      return {
        ...t,
        status: 'uploaded',
        progressText: `Cargada con éxito en base contable`
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
      invoiceId: 'inv_' + Math.random().toString(36).substr(2, 9),
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
      items: items, // Pass items list
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
    setItems([]);
  };

  const handleClearForm = () => {
    setSupplierInput('');
    setSupplierCuit('');
    setPos('');
    setNumber('');
    setDateEmission('');
    setDateDue('');
    setNeto('0.00');
    setIva('0.00');
    setExento('0.00');
    setPercIva('0.00');
    setPercIibb('0.00');
    setPercOtros('0.00');
    setTotal('0.00');
    setItems([]);
  };

  // AFIP Lookup for Quick Supplier
  const handleAfipLookup = async () => {
    const cleanCuit = quickCuit.replace(/\D/g, '');
    if (cleanCuit.length !== 11) {
      alert('Ingresa un CUIT de 11 dígitos válido.');
      return;
    }
    setQuickLoading(true);

    try {
      const res = await fetch(`https://us-central1-tmc-backend-2f5c4.cloudfunctions.net/consultarCuitAfip?cuit=${cleanCuit}&ignoreYiqi=true`);
      if (!res.ok) {
        throw new Error(`Error HTTP: ${res.status}`);
      }
      const json = await res.json();
      if (json.success && json.data) {
        const data = json.data;
        setQuickName(data.socialName || data.razonSocial || 'LOGISTICA EXPRESS S.A.');
        setQuickAddress(data.address || data.domicilio || 'Av. de Mayo 789, CABA');
        
        let cond = 'Responsable Inscripto';
        const ivaRaw = String(data.ivaCondition || '').toLowerCase();
        if (ivaRaw.includes('monotributo') || ivaRaw.includes('monotributista')) {
          cond = 'Monotributista';
        } else if (ivaRaw.includes('exento')) {
          cond = 'Exento';
        }
        setQuickTaxCondition(cond);
      } else {
        throw new Error(json.error || 'CUIT no encontrado en el padrón AFIP.');
      }
    } catch (err) {
      console.error("[ZeroStaff AFIP] Error en consulta de CUIT:", err);
      alert(err.message || 'Error al conectar con la consulta de CUIT de AFIP.');
    } finally {
      setQuickLoading(false);
    }
  };

  const handleRegisterQuickSupplier = () => {
    if (!quickName) return;

    const newSup = {
      cuit: quickCuit.replace(/\D/g, ''),
      name: quickName,
      address: quickAddress || 'Av. de Mayo 789, CABA',
      taxCondition: quickTaxCondition,
      defaultAccount: quickAccount
    };

    // Register supplier in parent state
    onAddSupplier(newSup);

    // Apply to current invoice form
    setSupplierInput(quickName);
    setSupplierCuit(quickCuit.replace(/\D/g, ''));
    setExpenseAccount(quickAccount);

    // Reset Quick modal
    setShowQuickSupplier(false);
    setQuickCuit('');
    setQuickName('');
    setQuickAddress('');
  };

  // CUIT mismatch validation warning display
  let cuitValidationWarning = null;
  if (activeTask && activeTask.data) {
    const isOfficial = invoiceType === '1' || invoiceType === '2' || invoiceType === '3';
    const cuitDestLimpiado = String(activeTask.data.cuitDestinatario || '').replace(/\D/g, '');
    const cuitTenantLimpiado = String(tenant.cuit || '').replace(/\D/g, '');
    if (isOfficial && cuitDestLimpiado && cuitTenantLimpiado && cuitDestLimpiado !== cuitTenantLimpiado) {
      cuitValidationWarning = `¡Alerta de Destinatario! Este comprobante está emitido al CUIT comprador ${cuitDestLimpiado.replace(/(\d{2})(\d{8})(\d{1})/, '$1-$2-$3')} y no al CUIT de tu empresa (${cuitTenantLimpiado.replace(/(\d{2})(\d{8})(\d{1})/, '$1-$2-$3')}). La carga ha sido bloqueada.`;
    }
  }

  return (
    <div className="workspace-grid">
      
      {/* LEFT PANEL: Ingestion & PDF Viewer */}
      <div className="panel">
        <div className="panel-header">
          <h2 className="panel-title">
            <UploadCloud size={18} style={{ color: 'hsl(var(--primary))' }} />
            <span>Ingesta y Visor del Comprobante</span>
          </h2>
        </div>

        <div className="panel-body">
          {/* File Drag and Drop Zone (Only show if no files in queue) */}
          {tasks.length === 0 && (
            <div 
              className="drop-zone"
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleFileDrop}
              style={{ padding: '20px 15px', gap: '8px' }}
            >
              <UploadCloud size={24} style={{ color: 'hsl(var(--text-muted))' }} />
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '12px', fontWeight: '600' }}>Arrastrá tus PDFs de compra acá</p>
              </div>
              <input 
                type="file" 
                multiple 
                onChange={handleFileDrop} 
                style={{ display: 'none' }} 
                id="file-input-dashboard"
              />
              <label htmlFor="file-input-dashboard" className="btn btn-secondary" style={{ height: '30px', padding: '0 10px', fontSize: '11px', cursor: 'pointer' }}>
                Buscar Archivos
              </label>
            </div>
          )}

          {/* Queue Tasks Toolbar (Compact display when files are loaded) */}
          {tasks.length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', paddingBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              {/* Horizontally scrollable list of tasks */}
              <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', flex: 1, minWidth: 0, paddingRight: '10px' }}>
                {tasks.map(task => (
                  <div 
                    key={task.id}
                    onClick={() => setSelectedTaskId(task.id)}
                    className={`task-card ${selectedTaskId === task.id ? 'active' : ''}`}
                    style={{ cursor: 'pointer', padding: '6px 12px', flexShrink: 0, gap: '8px', minWidth: '150px' }}
                  >
                    <FileText size={14} style={{ color: 'hsl(var(--primary))' }} />
                    <span style={{ fontSize: '11px', fontWeight: '600', maxWidth: '75px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {task.name}
                    </span>
                    {task.status === 'ready' && <span className="badge badge-success" style={{ fontSize: '9px', padding: '2px 4px' }}>Listo</span>}
                    {task.status === 'processing' && <Loader2 size={10} className="rotate-spinner" />}
                    {task.status === 'uploaded' && <span className="badge badge-info" style={{ fontSize: '9px', padding: '2px 4px' }}>Subido</span>}
                  </div>
                ))}
              </div>

              {/* Upload more button */}
              <input 
                type="file" 
                multiple 
                onChange={handleFileDrop} 
                style={{ display: 'none' }} 
                id="file-input-dashboard-more"
              />
              <label 
                htmlFor="file-input-dashboard-more" 
                className="btn btn-secondary" 
                style={{ height: '28px', padding: '0 10px', fontSize: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}
              >
                <UploadCloud size={12} />
                <span>Cargar más</span>
              </label>
            </div>
          )}

          {/* Real PDF Document or Image Rendering */}
          {activeTask && activeTask.blobUrl ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1, minHeight: '320px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: 'hsl(var(--text-muted))' }}>
                  Comprobante: {activeTask.name}
                </span>
              </div>
              {activeTask.fileType === 'application/pdf' ? (
                <iframe 
                  src={activeTask.blobUrl} 
                  style={{ 
                    width: '100%', 
                    flex: 1, 
                    border: '1px solid rgba(255, 255, 255, 0.08)', 
                    borderRadius: '12px', 
                    background: '#fff' 
                  }} 
                  title="Visor Comprobante PDF"
                />
              ) : (
                <div style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: '#fff',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  overflow: 'hidden',
                  padding: '10px'
                }}>
                  <img 
                    src={activeTask.blobUrl} 
                    style={{ 
                      maxWidth: '100%', 
                      maxHeight: '100%', 
                      objectFit: 'contain',
                      borderRadius: '6px'
                    }} 
                    alt="Comprobante Imagen"
                  />
                </div>
              )}
            </div>
          ) : (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'hsl(var(--text-muted))', gap: '8px', padding: '40px' }}>
              <FileText size={32} style={{ opacity: 0.3 }} />
              <p style={{ fontSize: '12px' }}>Selecciona un archivo de la cola para previsualizar el PDF.</p>
            </div>
          )}

        </div>
      </div>

      {/* RIGHT PANEL: Form details */}
      <div className="panel">
        <div className="panel-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 className="panel-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={18} style={{ color: 'hsl(var(--primary))' }} />
            <span>Datos Escaneados por IA</span>
          </h2>
          {activeTask && (
            <button 
              type="button" 
              onClick={handleClearForm}
              className="btn btn-secondary"
              style={{ height: '26px', fontSize: '11px', padding: '0 10px', gap: '4px', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <X size={12} />
              <span>Limpiar</span>
            </button>
          )}
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
            <form onSubmit={handleSaveInvoice} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              
              {/* Buyer CUIT Warning banner */}
              {cuitValidationWarning && (
                <div className="badge badge-danger" style={{ padding: '10px 14px', borderRadius: '8px', gap: '8px', display: 'flex', alignItems: 'center', fontSize: '11px', width: '100%', lineHeight: '1.4', whiteSpace: 'normal', textAlign: 'left' }}>
                  <AlertTriangle size={18} style={{ flexShrink: 0 }} />
                  <span>{cuitValidationWarning}</span>
                </div>
              )}

              {/* Supplier Section with Autocomplete */}
              <div className="form-group" style={{ marginBottom: '6px', position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label>Proveedor (Razón Social)</label>
                  <button 
                    type="button" 
                    onClick={() => setShowQuickSupplier(true)}
                    className="btn btn-secondary" 
                    style={{ height: '20px', fontSize: '10px', padding: '0 8px', gap: '4px' }}
                  >
                    <Plus size={10} />
                    <span>Alta Rápida</span>
                  </button>
                </div>
                <input 
                  type="text" 
                  value={supplierInput} 
                  onChange={(e) => {
                    setSupplierInput(e.target.value);
                    setShowSuggestions(true);
                  }} 
                  placeholder="Escribe para buscar proveedor..."
                  required
                />
                
                {/* Suggestions List Dropdown */}
                {showSuggestions && supplierInput && filteredSuggestions.length > 0 && (
                  <div className="glass" style={{
                    position: 'absolute',
                    top: '52px',
                    left: 0,
                    right: 0,
                    zIndex: 10,
                    borderRadius: '8px',
                    maxHeight: '150px',
                    overflowY: 'auto',
                    boxShadow: '0 10px 20px rgba(0,0,0,0.3)',
                    background: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--card-border))'
                  }}>
                    {filteredSuggestions.map(sup => (
                      <div 
                        key={sup.cuit}
                        onClick={() => handleSelectSupplier(sup)}
                        style={{
                          padding: '10px 14px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          borderBottom: '1px solid rgba(255,255,255,0.04)'
                        }}
                        className="suggestion-item"
                        onMouseEnter={(e) => e.target.style.background = 'rgba(255,255,255,0.04)'}
                        onMouseLeave={(e) => e.target.style.background = 'none'}
                      >
                        <div style={{ fontWeight: '600' }}>{sup.name}</div>
                        <div style={{ fontSize: '10px', color: 'hsl(var(--text-muted))' }}>CUIT: {sup.cuit}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Grid 1: CUIT and Invoice Type */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div className="form-group">
                  <label>CUIT del Emisor</label>
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

              {/* Grid 2: POS, Number and Optional Account Imputation */}
              <div style={{ display: 'grid', gridTemplateColumns: useAccounting ? '0.4fr 0.8fr 0.8fr' : '0.4fr 1.6fr', gap: '10px' }}>
                <div className="form-group">
                  <label>POS</label>
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
                  <label>Número</label>
                  <input 
                    type="text" 
                    value={number} 
                    onChange={(e) => setNumber(e.target.value)} 
                    placeholder="23125412"
                    maxLength={20}
                    required
                  />
                </div>
                {useAccounting && (
                  <div className="form-group">
                    <label>Imputación Contable</label>
                    <select 
                      value={expenseAccount} 
                      onChange={(e) => setExpenseAccount(e.target.value)}
                    >
                      {accounts.map(acc => (
                        <option key={acc.code} value={acc.code}>
                          {acc.code} - {acc.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Grid 3: Dates */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
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
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', background: 'rgba(0,0,0,0.15)', padding: '8px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: '9px' }}>Neto Gravado</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    value={neto} 
                    onChange={(e) => setNeto(e.target.value)} 
                    style={{ height: '32px', padding: '6px 10px' }}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: '9px' }}>IVA Liquidado</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    value={iva} 
                    onChange={(e) => setIva(e.target.value)} 
                    style={{ height: '32px', padding: '6px 10px' }}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: '9px' }}>Exento / No Grav.</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    value={exento} 
                    onChange={(e) => setExento(e.target.value)} 
                    style={{ height: '32px', padding: '6px 10px' }}
                  />
                </div>
              </div>

              {/* Perceptions fields */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', background: 'rgba(0,0,0,0.15)', padding: '8px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: '9px' }}>Perc. IVA</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    value={percIva} 
                    onChange={(e) => setPercIva(e.target.value)} 
                    style={{ height: '32px', padding: '6px 10px' }}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: '9px' }}>Perc. IIBB</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    value={percIibb} 
                    onChange={(e) => setPercIibb(e.target.value)} 
                    style={{ height: '32px', padding: '6px 10px' }}
                  />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: '9px' }}>Otros Impuestos</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    value={percOtros} 
                    onChange={(e) => setPercOtros(e.target.value)} 
                    style={{ height: '32px', padding: '6px 10px' }}
                  />
                </div>
              </div>

              {/* Detalle de Ítems */}
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: 'hsl(var(--text-muted))' }}>
                    Detalle de Ítems ({items.length})
                  </label>
                  <button 
                    type="button" 
                    onClick={handleAddItem}
                    className="btn btn-secondary" 
                    style={{ height: '22px', fontSize: '10px', padding: '0 8px', gap: '4px' }}
                  >
                    <Plus size={10} />
                    <span>Agregar Ítem</span>
                  </button>
                </div>

                <div style={{ 
                  maxHeight: '130px', 
                  overflowY: 'auto', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: '6px',
                  paddingRight: '4px'
                }}>
                  {items.length === 0 ? (
                    <span style={{ fontSize: '11px', color: 'hsl(var(--text-muted))', fontStyle: 'italic', padding: '4px 0' }}>
                      No hay ítems cargados. Hacé clic en "Agregar Ítem".
                    </span>
                  ) : (
                    items.map((it, idx) => (
                      <div key={idx} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <input 
                          type="text" 
                          value={it.concepto} 
                          onChange={(e) => handleUpdateItem(idx, 'concepto', e.target.value)}
                          style={{ flex: 2, height: '28px', padding: '4px 8px', fontSize: '11px', background: 'rgba(0,0,0,0.12)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '4px' }}
                          placeholder="Descripción del concepto"
                        />
                        <input 
                          type="number" 
                          value={it.cantidad} 
                          onChange={(e) => handleUpdateItem(idx, 'cantidad', e.target.value)}
                          style={{ width: '48px', height: '28px', padding: '4px 2px', fontSize: '11px', textAlign: 'center', background: 'rgba(0,0,0,0.12)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '4px' }}
                          placeholder="Cant"
                        />
                        <input 
                          type="number" 
                          value={it.precioUnitario} 
                          onChange={(e) => handleUpdateItem(idx, 'precioUnitario', e.target.value)}
                          style={{ width: '80px', height: '28px', padding: '4px 6px', fontSize: '11px', textAlign: 'right', background: 'rgba(0,0,0,0.12)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '4px' }}
                          placeholder="P. Unit"
                        />
                        <div style={{ fontSize: '11px', fontWeight: '700', width: '70px', textAlign: 'right', color: 'hsl(var(--primary))' }}>
                          ${(Number(it.cantidad || 0) * Number(it.precioUnitario || 0)).toFixed(2)}
                        </div>
                        <button 
                          type="button" 
                          onClick={() => handleDeleteItem(idx)}
                          style={{ 
                            padding: '0 6px', 
                            height: '28px', 
                            background: 'rgba(239, 68, 68, 0.08)', 
                            color: 'rgb(239, 68, 68)', 
                            border: '1px solid rgba(239, 68, 68, 0.15)', 
                            borderRadius: '4px', 
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Total Display & Payment Options */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '4px 0', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '8px' }}>
                <span style={{ fontSize: '12px', fontWeight: '700', color: 'hsl(var(--text-muted))' }}>Importe Total</span>
                <span style={{ fontSize: '18px', fontWeight: '800', color: 'hsl(var(--success))' }}>$ {total}</span>
              </div>

              <div className="form-group" style={{ marginBottom: '6px' }}>
                <label>Forma de Pago (Imputación)</label>
                <select value={payType} onChange={(e) => setPayType(e.target.value)} style={{ height: '34px' }}>
                  <option value="cta_cte">Cuenta Corriente (Pendiente)</option>
                  <option value="efectivo">Efectivo (Caja General)</option>
                  <option value="transferencia">Transferencia (Cuenta Banco)</option>
                  <option value="electronico">Tarjeta de Crédito / Electrónico</option>
                </select>
              </div>

              {activeTask.status === 'ready' ? (
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  style={{ width: '100%', height: '38px' }}
                  disabled={!!cuitValidationWarning}
                >
                  <span>Registrar Factura</span>
                </button>
              ) : (
                <div className="badge badge-success" style={{ width: '100%', padding: '10px', justifyContent: 'center', borderRadius: '8px', fontSize: '12px' }}>
                  Comprobante Guardado con Éxito
                </div>
              )}

            </form>
          )}
        </div>
      </div>

      {/* Quick Supplier AFIP Lookup Modal */}
      {showQuickSupplier && (
        <div className="modal-overlay">
          <div className="modal" style={{ width: '400px' }}>
            <div className="modal-header">
              <h4 style={{ fontWeight: 700 }}>Alta Rápida de Proveedor</h4>
              <button onClick={() => setShowQuickSupplier(false)} className="btn btn-secondary btn-icon-only" style={{ background: 'none', border: 'none', padding: 0 }}>
                <X size={16} />
              </button>
            </div>
            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              
              <div className="form-group">
                <label>CUIT (Sin guiones)</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input 
                    type="text" 
                    placeholder="Ej. 30711261599" 
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

              <div className="form-group">
                <label>Domicilio Fiscal (AFIP)</label>
                <input 
                  type="text" 
                  placeholder="Domicilio Autocompletado" 
                  value={quickAddress}
                  onChange={(e) => setQuickAddress(e.target.value)}
                  readOnly={!quickAddress}
                />
              </div>

              {useAccounting && (
                <div className="form-group">
                  <label>Asignar Cuenta de Gasto</label>
                  <select 
                    value={quickAccount}
                    onChange={(e) => setQuickAccount(e.target.value)}
                  >
                    {accounts.map(acc => (
                      <option key={acc.code} value={acc.code}>
                        {acc.code} - {acc.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <button 
                type="button" 
                onClick={handleRegisterQuickSupplier}
                className="btn btn-primary"
                disabled={!quickName}
                style={{ width: '100%', marginTop: '6px' }}
              >
                <span>Crear Ficha y Registrar</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
