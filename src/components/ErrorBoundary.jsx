import { Component } from 'react';

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 24, fontFamily: 'system-ui, sans-serif', background: 'var(--bg)', color: 'var(--fg)' }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8, color: 'var(--danger)' }}>Erro inesperado</h2>
          <pre style={{ fontSize: 13, color: 'var(--fg-secondary)', whiteSpace: 'pre-wrap' }}>{this.state.error.message}</pre>
          <button type="button" onClick={() => { this.setState({ error: null }); window.location.hash = '#/dashboard'; }}
            style={{ marginTop: 16, padding: '8px 16px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--fg)', fontSize: 14, cursor: 'pointer' }}>
            Voltar ao Dashboard
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
