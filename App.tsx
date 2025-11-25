import React, { useState } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Login } from './components/Login';
import { Dashboard } from './pages/Dashboard';
import { Orders } from './pages/Orders';
import { Inventory } from './pages/Inventory';
import { Production } from './pages/Production';
import { User } from './types';

// Protected Route Wrapper
const ProtectedRoute = ({ children, user }: { children?: React.ReactNode, user: User | null }) => {
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

export default function App() {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('seno_user');
    return saved ? JSON.parse(saved) : null;
  });

  const handleLogin = (u: User) => {
    setUser(u);
    localStorage.setItem('seno_user', JSON.stringify(u));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('seno_user');
  };

  return (
    <HashRouter>
      <Routes>
        <Route path="/login" element={<Login onLogin={handleLogin} />} />
        
        <Route path="/" element={
          <ProtectedRoute user={user}>
            <Layout user={user} onLogout={handleLogout}>
              <Dashboard />
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/orders" element={
          <ProtectedRoute user={user}>
            <Layout user={user} onLogout={handleLogout}>
              <Orders user={user} />
            </Layout>
          </ProtectedRoute>
        } />

        <Route path="/inventory" element={
          <ProtectedRoute user={user}>
            <Layout user={user} onLogout={handleLogout}>
              <Inventory user={user} />
            </Layout>
          </ProtectedRoute>
        } />

        <Route path="/production" element={
          <ProtectedRoute user={user}>
            <Layout user={user} onLogout={handleLogout}>
              <Production user={user} />
            </Layout>
          </ProtectedRoute>
        } />

        {/* Redirect unknown to root */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </HashRouter>
  );
}