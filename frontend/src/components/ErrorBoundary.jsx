import { Component } from 'react';
import { FiAlertTriangle, FiRefreshCw } from 'react-icons/fi';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('Tanilog UI error', error, info);
  }

  componentDidUpdate(prevProps) {
    if (this.state.hasError && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ hasError: false, error: null });
    }
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-screen bg-navy-900 text-white font-poppins flex items-center justify-center p-6">
        <div className="glass rounded-3xl border border-red-500/20 p-8 max-w-lg text-center">
          <FiAlertTriangle className="mx-auto text-red-300 mb-4" size={34} />
          <h1 className="text-2xl font-bold">Bir sey ters gitti</h1>
          <p className="text-navy-300 mt-2">Sayfayi yenileyerek tekrar deneyebilirsin. Hata devam ederse son yaptigin islemi not al.</p>
          {import.meta.env.DEV && this.state.error?.message && (
            <pre className="mt-4 text-left text-xs text-red-100 bg-red-950/40 border border-red-500/20 rounded-xl p-3 overflow-auto">
              {this.state.error.message}
            </pre>
          )}
          <button
            onClick={() => window.location.reload()}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-teal-500 px-5 py-3 font-bold"
          >
            <FiRefreshCw /> Sayfayi yenile
          </button>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
