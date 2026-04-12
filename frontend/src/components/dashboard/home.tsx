// AdminDashboard.js
import React, { useState, useEffect } from 'react';
import '../../assets/admin/dashboard.css';
import AdminOrders from './orderAdmin';
import AdminDashboard from './dashboard';
import AdminProduct from './productAdmin';
import AdminNews from './newsAdmin';
import AdminManagerUser from './userAdmin';

const Home: React.FC = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeNav, setActiveNav] = useState('dashboard');

  const dashboardStats = {
    totalRevenue: 38450000,
    totalOrders: 1247,
    totalCustomers: 892,
    averageOrder: 30800,
    todayRevenue: 1850000,
    todayOrders: 67,
    pendingOrders: 23,
    lowStockProducts: 8
  };

  const adminNavItems = [
    { id: 'dashboard', label: 'Tổng quan', icon: '📊', badge: null },
    { id: 'orders', label: 'Đơn hàng', icon: '📦', },
    { id: 'products', label: 'Sản phẩm', icon: '☕',  },
    { id: 'users', label: 'Người dùng', icon: '📦', },
    { id: 'employees', label: 'Tin tức', icon: '👨‍💼', },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatPrice = (price: any) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  return (
    <div className="admin-dashboard">
      {/* Header */}
      <header className="admin-header">
        <div>
          <h1 className="admin-title">Dashboard</h1>
        </div>
        <div className="admin-info">
          <div className="current-time">
            {currentTime.toLocaleDateString('vi-VN', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
            <br />
            {currentTime.toLocaleTimeString('vi-VN')}
          </div>
          <div className="admin-actions">
            <button className="admin-btn primary">📊 Báo Cáo Hôm Nay</button>
            <button className="admin-btn secondary">🔄 Cập Nhật</button>
          </div>
        </div>
      </header>

      <div className="dashboard-layout">
        {/* Sidebar */}
        <aside className="admin-sidebar">
          {/* Navigation */}
          <div className="sidebar-section">
            <h3 className="sidebar-title">Điều Hướng</h3>
            <nav className="admin-nav">
              {adminNavItems.map(item => (
                <div
                  key={item.id}
                  className={`nav-item ${activeNav === item.id ? 'active' : ''}`}
                  onClick={() => setActiveNav(item.id)}
                >
                  <span className="nav-icon">{item.icon}</span>
                  <span className="nav-text">{item.label}</span>
                </div>
              ))}
            </nav>
          </div>

          {/* Quick Stats */}
          <div className="sidebar-section">
            <h3 className="sidebar-title">Thống Kê Nhanh</h3>
            <div className="quick-stats">
              <div className="stat-item">
                <div className="stat-icon orders">📦</div>
                <div className="stat-info">
                  <div className="stat-value">{dashboardStats.todayOrders}</div>
                  <div className="stat-label">Đơn hôm nay</div>
                </div>
              </div>
              <div className="stat-item">
                <div className="stat-icon revenue">💰</div>
                <div className="stat-info">
                  <div className="stat-value">{formatPrice(dashboardStats.todayRevenue)}</div>
                  <div className="stat-label">Doanh thu hôm nay</div>
                </div>
              </div>
              <div className="stat-item">
                <div className="stat-icon customers">👥</div>
                <div className="stat-info">
                  <div className="stat-value">{dashboardStats.pendingOrders}</div>
                  <div className="stat-label">Đơn chờ xử lý</div>
                </div>
              </div>
              <div className="stat-item">
                <div className="stat-icon products">⚠️</div>
                <div className="stat-info">
                  <div className="stat-value">{dashboardStats.lowStockProducts}</div>
                  <div className="stat-label">SP sắp hết hàng</div>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="dashboard-main">
        {activeNav === 'dashboard' && <AdminDashboard />}
        {activeNav === 'orders' && <AdminOrders />}
        {activeNav === 'products' && <AdminProduct />}
        {activeNav === 'users' && <AdminManagerUser />}
        {activeNav === 'employees' && <AdminNews />}
        </main>
      </div>
    </div>
  );
};

export default Home;