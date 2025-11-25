import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  LogOut, 
  Menu, 
  X,
  Factory,
  CalendarDays
} from 'lucide-react';
import { User, Role } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  user: User | null;
  onLogout: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, user, onLogout }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();

  const navItems = [
    { name: '生产看板', path: '/', icon: LayoutDashboard },
    { name: '订单管理', path: '/orders', icon: ShoppingCart },
    { name: '库存管理', path: '/inventory', icon: Package },
    { name: '生产排产', path: '/production', icon: CalendarDays },
  ];

  const isActive = (path: string) => location.pathname === path;

  const getRoleName = (role: Role) => {
    switch (role) {
      case Role.ADMIN: return '管理员';
      case Role.PLANNER: return '排产员';
      case Role.WAREHOUSE: return '库管';
      case Role.SALES: return '销售';
      default: return role;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-30 w-64 bg-slate-900 text-white transform transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:inset-0
      `}>
        <div className="flex items-center justify-between h-16 px-6 bg-slate-950">
          <div className="flex items-center space-x-2 font-bold text-xl tracking-wider">
            <Factory className="text-blue-400" />
            <span>SENO<span className="text-blue-400">ERP</span></span>
          </div>
          <button className="lg:hidden" onClick={() => setIsSidebarOpen(false)}>
            <X className="w-6 h-6" />
          </button>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setIsSidebarOpen(false)}
              className={`
                flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors
                ${isActive(item.path) 
                  ? 'bg-blue-600 text-white' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'}
              `}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.name}</span>
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center justify-between px-4 py-3 bg-slate-800 rounded-lg">
            <div className="flex flex-col">
              <span className="text-sm font-medium text-white">{user?.name}</span>
              <span className="text-xs text-slate-400 capitalize">{user ? getRoleName(user.role) : ''}</span>
            </div>
            <button onClick={onLogout} title="退出登录" className="text-slate-400 hover:text-red-400">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <header className="flex items-center justify-between h-16 px-6 bg-white border-b lg:hidden">
          <div className="flex items-center space-x-2 font-bold text-xl text-slate-800">
             <Factory className="text-blue-600" />
             <span>SENO<span className="text-blue-600">ERP</span></span>
          </div>
          <button onClick={() => setIsSidebarOpen(true)}>
            <Menu className="w-6 h-6 text-slate-600" />
          </button>
        </header>

        {/* Scrollable Content Area */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50 p-4 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};