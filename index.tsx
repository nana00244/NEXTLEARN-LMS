import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { isConfigured, supabaseUrl } from './lib/supabase';

const Root = () => {
  // If configuration is missing and it's not the hardcoded default, show warning
  if (!isConfigured) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans text-center">
        <div className="max-w-md w-full bg-white rounded-[2rem] p-10 shadow-xl border border-slate-100">
          <div className="text-4xl mb-4">⚠️</div>
          <h1 className="text-xl font-black text-slate-900 mb-2">Backend Connection Required</h1>
          <p className="text-slate-500 text-sm mb-6">
            The application is unable to initialize the Supabase client. 
            Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set correctly.
          </p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg"
          >
            Retry Connection
          </button>
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