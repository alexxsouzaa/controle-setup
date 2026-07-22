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
        <div style={{ padding: 24, fontFamily: 'system-ui, sans-serif' }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8, color: '#dc2626' }}>Erro inesperado</h2>
          <pre style={{ fontSize: 13, color: '#71717a', whiteSpace: 'pre-wrap' }}>{this.state.error.message}</pre>
          <button type="button" onClick={() => { this.setState({ error: null }); window.location.hash = '#/dashboard'; }}
            style={{ marginTop: 16, padding: '8px 16px', borderRadius: 8, border: '1px solid #e4e4e7', background: '#fff', fontSize: 14, cursor: 'pointer' }}>
            Voltar ao Dashboard
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
