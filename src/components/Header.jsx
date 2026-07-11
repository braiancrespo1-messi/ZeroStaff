import React from 'react';
import { Sparkles, LogOut, UploadCloud, Users, Database, History, HelpCircle } from 'lucide-react';

export default function Header({ tenant, currentView, onViewChange, onLogout }) {
  const progressPercent = Math.min(100, (tenant.quotaUsed / tenant.quotaMax) * 100);

  return (
    <header className="glass" style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '0 24px',
      borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
      height: '72px',
      flexShrink: 0
    }}>
      
      {/* Brand Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: '36px',
          height: '36px',
          borderRadius: '8px',
          background: 'hsl(var(--primary))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 10px rgba(168, 85, 247, 0.3)'
        }}>
          <Sparkles size={18} color="#fff" />
        </div>
        <div>
          <h1 style={{ fontSize: '18px', fontWeight: '800', letterSpacing: '-0.3px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            ZeroStaff<span style={{ color: 'hsl(var(--primary))' }}>.ai</span>
          </h1>
          <span style={{ fontSize: '10px', color: 'hsl(var(--text-muted))', display: 'block', marginTop: '-2px' }}>
            digital accounts payable
          </span>
        </div>
      </div>

      {/* Center Navigation Tabs */}
      <nav style={{ display: 'flex', gap: '6px', height: '100%', alignItems: 'center' }}>
        <button 
          onClick={() => onViewChange('dashboard')} 
          className={`btn ${currentView === 'dashboard' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ height: '36px', padding: '0 14px', gap: '6px' }}
        >
          <UploadCloud size={14} />
          <span>Área de Carga</span>
        </button>

        <button 
          onClick={() => onViewChange('suppliers')} 
          className={`btn ${currentView === 'suppliers' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ height: '36px', padding: '0 14px', gap: '6px' }}
        >
          <Users size={14} />
          <span>Fichas de Proveedores</span>
        </button>

        <button 
          onClick={() => onViewChange('accounts')} 
          className={`btn ${currentView === 'accounts' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ height: '36px', padding: '0 14px', gap: '6px' }}
        >
          <Database size={14} />
          <span>Plan de Cuentas</span>
        </button>

        <button 
          onClick={() => onViewChange('history')} 
          className={`btn ${currentView === 'history' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ height: '36px', padding: '0 14px', gap: '6px' }}
        >
          <History size={14} />
          <span>Historial e IVA Digital</span>
        </button>
      </nav>

      {/* Right User Stats & Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        
        {/* Profile Details */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', textAlign: 'right' }}>
          <span style={{ fontSize: '12px', fontWeight: '700', color: 'hsl(var(--text-main))' }}>
            {tenant.companyName}
          </span>
          <span style={{ fontSize: '10px', color: 'hsl(var(--text-muted))' }}>
            CUIT: {tenant.cuit}
          </span>
        </div>

        {/* Consumption Progress */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', width: '100px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', fontWeight: '700' }}>
            <span style={{ color: 'hsl(var(--text-muted))' }}>Escaneos IA</span>
            <span style={{ color: 'hsl(var(--text-main))' }}>{tenant.quotaUsed}/{tenant.quotaMax}</span>
          </div>
          <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '10px', overflow: 'hidden' }}>
            <div style={{
              width: `${progressPercent}%`,
              height: '100%',
              background: 'hsl(var(--primary))',
              borderRadius: '10px',
              transition: 'width 0.4s ease'
            }} />
          </div>
        </div>

        {/* Log Out */}
        <button onClick={onLogout} className="btn btn-secondary btn-icon-only" style={{ height: '36px', width: '36px' }} title="Cerrar Sesión">
          <LogOut size={14} style={{ color: 'hsl(var(--danger))' }} />
        </button>

      </div>

    </header>
  );
}
