import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { supabase } from './lib/supabase';

console.log("[NextLearn] Application mounting...");

// Production Health Check
const checkConnection = async () => {
  try {
    const { error } = await supabase.auth.getSession();
    if (error) {
      console.warn("[NextLearn] Supabase connection warning:", error.message);
    } else {
      console.log("[NextLearn] Supabase cloud connection active.");
    }
  } catch (err) {
    console.error("[NextLearn] Failed to initialize Supabase connection:", err);
  }
};

checkConnection();

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error("[NextLearn] Critical Failure: Could not find root element in DOM.");
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);