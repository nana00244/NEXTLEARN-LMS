import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { isConfigured } from './lib/supabase';

const Root = () => {
  // If for some reason configuration still fails, show a simple error
  if (!isConfigured) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
        <div className="max-w-md w-full bg-white rounded-[2rem] p-10 shadow-xl border border-slate-100 text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <h1 className="text-xl font-black text-slate-900 mb-2">Configuration Error</h1>
          <p className="text-slate-500 text-sm mb-6">Unable to connect to the Supabase backend. Please check your network connection and credentials.</p>
          <button onClick={() => window.location.reload()} className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold">Retry</button>
        </div>
      </div>
    );
  }

  return (
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
};

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(<Root />);
}