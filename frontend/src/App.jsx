import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import LandingPage from './pages/LandingPage';

function App() {
  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            fontFamily: 'Poppins, sans-serif',
            borderRadius: '12px',
          },
          success: {
            style: { background: '#0fb8a5', color: '#fff' },
          },
          error: {
            style: { background: '#ef4444', color: '#fff' },
          },
        }}
      />
      <Routes>
        <Route path="/" element={<LandingPage />} />
      </Routes>
    </>
  );
}

export default App;
