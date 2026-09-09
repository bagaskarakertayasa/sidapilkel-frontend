import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './components/Toast';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Rekap from './pages/Rekap';
import TPSPage from './pages/TPSPage';
import CalonPage from './pages/CalonPage';
import DesaPage from './pages/DesaPage';
import UsersPage from './pages/UsersPage';
import { RefreshCw } from 'lucide-react';

function MainApp() {
  const { isAuthenticated, loading, isAdminPusat } = useAuth();
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [pageParams, setPageParams] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#EFF2F7] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="size-8 animate-spin text-[#165DFF]" />
          <p className="text-xs font-semibold text-[#6A7686]">Memuat SIDAPILKEL...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  const navigateTo = (page, params = null) => {
    setCurrentPage(page);
    setPageParams(params);
  };

  const renderContent = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard onNavigate={navigateTo} />;
      case 'rekap':
        return <Rekap initialDesaId={pageParams?.desaId} />;
      case 'tps':
        return <TPSPage />;
      case 'calon':
        return <CalonPage />;
      case 'desa':
        return isAdminPusat ? <DesaPage /> : <Dashboard onNavigate={navigateTo} />;
      case 'users':
        return isAdminPusat ? <UsersPage /> : <Dashboard onNavigate={navigateTo} />;
      default:
        return <Dashboard onNavigate={navigateTo} />;
    }
  };

  return (
    <div className="flex h-screen bg-[#EFF2F7]/50 overflow-hidden font-sans">
      <Sidebar
        currentPage={currentPage}
        setCurrentPage={navigateTo}
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
      />

      <main className="flex-1 lg:ml-[280px] flex flex-col bg-white min-h-screen relative overflow-hidden">
        <Header
          currentPage={currentPage}
          onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
        />

        <div className="flex-1 overflow-y-auto p-5 md:p-8 bg-[#EFF2F7]/30">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <MainApp />
      </ToastProvider>
    </AuthProvider>
  );
}
