// AdminDashboard.js
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../../assets/admin/dashboard.css';
import { getStats } from '../../api/orderApi';
import { useAuthContext } from '../../context/AuthContext';
import { useNotify } from '../../hooks/useNotification';
import { apiGet } from '../../api/api';
import { getAllProducts } from '../../api/productApi';

const AdminDashboard = () => {
  const [monthReports, setMonthReports] = useState<any>([]);
  const [productReport, setProductReport] = useState<any>([]);
  const [orders, setOrders] = useState<any[]>([]);
  
  const [totalRevenue, setTotalRevenue] = useState<any>([]);
  const [totalOrders, setTotalOrders] = useState<any>([]);

  const { user } = useAuthContext();
  const notify = useNotify();
  const navigate = useNavigate();

  const newestOrder = orders.slice(-5).reverse();

  useEffect(() => {
    if (!user) return;
    
    if (user.role !== "admin") {
      notify.warning("Bạn không có quyền truy cập trang này!");
      navigate("/");
      return;
    }

    fetchReportByMonth();
    fetchTopSellProduct();
    fetchStatsOrders();
  }, []);
  console.log(totalOrders, totalRevenue)
  const formatPrice = (price: any) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const fetchReportByMonth = async () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = date.getMonth() + 1
    try {
      const data = await apiGet<any[]>(`/api/report/admin/${year}/${month}`);
      setMonthReports(data || []);
    } catch (err) {
      console.log(err);
      setMonthReports([]);
    } 
  }

  const fetchTopSellProduct = async () => {
    try {
      const data = await getAllProducts(`?page=1&category=all&search=`);
      const list = (data as any).products || [];
      const sorted = [...list].sort(
        (a: any, b: any) => (b.sellCount || 0) - (a.sellCount || 0)
      );
      setProductReport(sorted.slice(0, 5));
    } catch (err) {
      console.log(err);
      setProductReport([]);
    }
  }

  const fetchStatsOrders = async () => {
    try {
      const data = await getStats();
      setTotalRevenue(data.totalRevenue)
      setTotalOrders(data.totalOrders)
    } catch (err) {
      console.error("Lỗi khi lấy đơn hàng:", err);
      setOrders([]);
    }
  };

  const formatNumber = (number: any) => {
    return new Intl.NumberFormat('vi-VN').format(number);
  };

  const formatDate = (dateTime: string) =>
    new Date(dateTime).toLocaleString("vi-VN");

  console.log()
  return (
    <div className="admin-dashboard">
        {/* Main Content */}
        <main className="dashboard-main">
          {/* Stats Overview */}
          <section>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-card-icon primary">💰</div>
                <div className="stat-card-value">{formatPrice(totalRevenue)}</div>
                <div className="stat-card-label">Tổng Doanh Thu Tháng Này</div>
              </div>
              <div className="stat-card">
                <div className="stat-card-icon success">📦</div>
                <div className="stat-card-value">{formatNumber(totalOrders)}</div>
                <div className="stat-card-label">Tổng Đơn Hàng Tháng này</div>
              </div>
            </div>
          </section>

          {/* Charts Section */}
          <section className="charts-section">
            <div className="chart-card">
              <div className="chart-header">
                <h3 className="chart-title">Doanh Thu 7 Ngày Qua</h3>
                <div className="chart-actions">
                  <button className="chart-action-btn">Tuần</button>
                  <button className="chart-action-btn">Tháng</button>
                  <button className="chart-action-btn">Năm</button>
                </div>
              </div>
              <div className="chart-container">
                <div className="placeholder-chart">
                  <div className="icon">📈</div>
                  {/* <div>Biểu đồ doanh thu</div> */}
                  <div style={{ fontSize: '0.8rem', marginTop: '5px', color: 'rgba(75, 59, 43, 0.5)' }}>
                    {/* (Trong thực tế sẽ tích hợp với Chart.js hoặc D3.js) */}
                  </div>
                </div>
              </div>
            </div>

            <div className="chart-card">
              <div className="chart-header">
                <h3 className="chart-title">Hoạt Động Gần Đây</h3>
                <Link to="/admin/activities" className="view-all">Xem tất cả</Link>
              </div>
              <div className="activity-list">
                {newestOrder.map((order: any) => {
                  const code = order._id ? String(order._id).slice(-4) : "";
                  const customerName = order.user?.fullName || order.username || "Khách hàng";
                  const avatarText = customerName.slice(0, 2).toUpperCase();
                  return (
                    <div key={order._id} className="activity-item">
                      <div className="activity-avatar">
                        {avatarText}
                      </div>
                      <div className="activity-content">
                        <div className="activity-text">
                          <strong>{customerName}</strong> đã 
                            {order.status === 'pending' && ' tạo đơn hàng '}
                            {order.status === 'processing' && ' đang được xử lý '}
                            {order.status === 'completed' && ' hoàn thành '}
                            {order.status === 'cancelled' && ' hủy '}
                          đơn hàng <strong>{code}</strong>
                        </div>
                        <div className="activity-time">{formatDate(order.createdAt)}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Tables Section */}
          <section className="tables-section">
            <div className="table-card">
              <div className="table-header">
                <h3 className="table-title">Đơn Hàng Mới Nhất</h3>
                <Link to="/admin/orders" className="view-all">Xem tất cả</Link>
              </div>
              <table className="orders-table">
                <thead>
                  <tr>
                    <th>Mã Đơn</th>
                    <th>Khách Hàng</th>
                    <th>Số Tiền</th>
                    <th>Trạng Thái</th>
                    <th>Thời Gian</th>
                  </tr>
                </thead>
                <tbody>
                  {newestOrder.map((order: any) => {
                    const code = order._id ? String(order._id).slice(-4) : "";
                    const customerName = order.user?.fullName || order.username || "Khách hàng";
                    return (
                      <tr key={order._id}>
                        <td className="order-id">{code}</td>
                        <td>
                          <div className="customer-info">
                            <div className="customer-name">{customerName}</div>
                            <div className="customer-contact">{order?.userPhone || order.user?.phone}</div>
                          </div>
                        </td>
                        <td className="order-amount">{formatPrice(order.totalPrice)}</td>
                        <td>
                          <span className={`order-status ${order.status}`}>
                            {order.status === 'pending' && 'Chờ xác nhận'}
                            {order.status === 'processing' && 'Đang xử lí'}
                            {order.status === 'completed' && 'Hoàn thành'}
                            {order.status === 'cancelled' && 'Đã hủy'}
                          </span>
                        </td>
                        <td>{formatDate(order.createdAt)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="table-card">
              <div className="table-header">
                <h3 className="table-title">Sản Phẩm Bán Chạy</h3>
                <Link to="/admin/products" className="view-all">Xem tất cả</Link>
              </div>
              <table className="products-table">
                <thead>
                  <tr>
                    <th>Tên Sản Phẩm</th>
                    <th>Đã Bán</th>
                    <th>Giá</th>
                  </tr>
                </thead>
                <tbody>
                  {productReport.map((product: any) => (
                    <tr key={product.id}>
                      <td className="product-name">{product.name}</td>
                      <td>{formatNumber(product.sellCount)}</td>
                      <td className="product-price">{formatPrice(product.price)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </main>

    </div>
  );
};

export default AdminDashboard;