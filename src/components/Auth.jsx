import React, { useState } from 'react';
import { Lock, Building, Key, Sparkles, AlertCircle, ArrowRight } from 'lucide-react';

export default function Auth({ onLogin }) {
  const [isRegistering, setIsRegistering] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [cuit, setCuit] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [isDemo, setIsDemo] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!isDemo && !companyName) {
      setError('Por favor completa el nombre de tu empresa.');
      return;
    }

    if (!isDemo && !cuit.replace(/\D/g, '')) {
      setError('Por favor ingresa un CUIT válido.');
      return;
    }

    // Clean CUIT format
    const cleanedCuit = cuit.replace(/\D/g, '');

    // Simulating authentication & tenant creation
    const tenantData = {
      id: isDemo ? 'demo-tenant' : 'tenant_' + Math.random().toString(36).substr(2, 9),
      companyName: isDemo ? 'Empresa Demostración' : companyName,
      cuit: isDemo ? '30-99999999-9' : cleanedCuit,
      apiKey: isDemo ? 'demo_token' : apiKey,
      isDemoMode: isDemo,
      quotaUsed: 84,
      quotaMax: 100,
    };

    // Save to local storage for persistence
    localStorage.setItem('zerostaff_active_tenant', JSON.stringify(tenantData));
    
    // Notify parent
    onLogin(tenantData);
  };

  const startDemo = () => {
    setIsDemo(true);
    // Auto-submitting demo login
    const tenantData = {
      id: 'demo-tenant',
      companyName: 'Empresa Demostración',
      cuit: '30-99999999-9',
      apiKey: 'demo_token',
      isDemoMode: true,
      quotaUsed: 84,
      quotaMax: 100,
    };
    localStorage.setItem('zerostaff_active_tenant', JSON.stringify(tenantData));
    onLogin(tenantData);
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      padding: '20px',
      background: 'radial-gradient(circle at top right, rgba(168, 85, 247, 0.08), transparent 450px)'
    }}>
      <div className="glass" style={{
        width: '100%',
        maxWidth: '440px',
        borderRadius: '16px',
        padding: '30px',
        boxShadow: '0 20px 40px -15px rgba(0,0,0,0.6)',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
      }}>
        
        {/* Logo/Brand Header */}
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'hsl(var(--primary))',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 8px auto',
            boxShadow: '0 8px 16px -4px rgba(168, 85, 247, 0.5)'
          }}>
            <Sparkles size={24} color="#fff" />
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: '800', letterSpacing: '-0.5px' }}>
            ZeroStaff<span style={{ color: 'hsl(var(--primary))' }}>.ai</span>
          </h2>
          <p style={{ fontSize: '12px', color: 'hsl(var(--text-muted))', lineHeight: '1.4' }}>
            Tu departamento de cuentas por pagar autónomo, libre de personal y 100% eficiente.
          </p>
        </div>

        {error && (
          <div className="badge badge-danger" style={{ padding: '10px', borderRadius: '8px', gap: '8px', display: 'flex', alignItems: 'center', fontSize: '12px', width: '100%' }}>
            <AlertCircle size={14} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {!isDemo && (
            <>
              <div className="form-group">
                <label>Nombre de la Empresa</label>
                <div style={{ position: 'relative' }}>
                  <Building size={16} style={{ position: 'absolute', left: '12px', top: '11px', color: 'hsl(var(--text-muted))' }} />
                  <input 
                    type="text" 
                    placeholder="Ej. Mi Empresa SRL" 
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    style={{ paddingLeft: '38px' }}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>CUIT de la Empresa</label>
                <div style={{ position: 'relative' }}>
                  <Building size={16} style={{ position: 'absolute', left: '12px', top: '11px', color: 'hsl(var(--text-muted))' }} />
                  <input 
                    type="text" 
                    placeholder="Ej. 30-12345678-9" 
                    value={cuit}
                    onChange={(e) => setCuit(e.target.value)}
                    style={{ paddingLeft: '38px' }}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>API Key de YiQi ERP (Opcional)</label>
                <div style={{ position: 'relative' }}>
                  <Key size={16} style={{ position: 'absolute', left: '12px', top: '11px', color: 'hsl(var(--text-muted))' }} />
                  <input 
                    type="password" 
                    placeholder="Ingresa tu token de conexión" 
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    style={{ paddingLeft: '38px' }}
                  />
                </div>
                <span style={{ fontSize: '10px', color: 'hsl(var(--text-muted) / 0.7)', marginTop: '2px' }}>
                  Se almacena localmente de manera segura en tu navegador.
                </span>
              </div>
            </>
          )}

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '10px' }}>
            <span>Comenzar ahora</span>
            <ArrowRight size={14} />
          </button>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', margin: '8px 0', fontSize: '12px', color: 'hsl(var(--text-muted))' }}>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.06)' }} />
          <span>O probá la herramienta</span>
          <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.06)' }} />
        </div>

        <button onClick={startDemo} className="btn btn-secondary" style={{ width: '100%', gap: '8px' }}>
          <Sparkles size={14} style={{ color: 'hsl(var(--primary))' }} />
          <span>Iniciar en Modo Demo (Acceso Rápido)</span>
        </button>

      </div>
    </div>
  );
}
