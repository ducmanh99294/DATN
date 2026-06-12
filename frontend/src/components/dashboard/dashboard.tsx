// AdminDashboard.js
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../../assets/admin/dashboard.css';
import { getAllOrders, getStats } from '../../api/orderApi';
import { useAuthContext } from '../../context/AuthContext';
import { useNotify } from '../../hooks/useNotification';
import { getAllProducts } from '../../api/productApi';
import { getReportByMonth, getReports } from '../../api/reportApi';

const AdminDashboard = () => {
  const [totalRevenue, setTotalRevenue] = useState<number>(0);
  const [totalOrders, setTotalOrders] = useState<number>(0);
  const [monthReports, setMonthReports] = useState<any>([]);
  const [reportToday, setReportToday] = useState<any>([]);
  const [productReport, setProductReport] = useState<any>([]);
  const [orders, setOrders] = useState<any[]>([]);
  // const newestOrder = orders.slice(-5).reverse();

  const { user } = useAuthContext();
  const notify = useNotify();
  const navigate = useNavigate();

  const newestOrder = orders.slice(0, 5);

  useEffect(() => {
    if (!user) return;
    
    if (user.role !== "admin") {
      notify.warning("Bạn không có quyền truy cập trang này!");
      navigate("/");
      return;
    }

    fetchTopSellProduct();
    fetchStatsOrders();
    fetchRecentOrders();
    fetchReportByMonth();
  }, [user]);

  const formatPrice = (price: any) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

    const fetchReportByMonth = async () => {
    try {
      const data = await getReportByMonth();
      // const list = (data as any).products || [];
      // const sorted = [...list].sort(
      //   (a: any, b: any) => (b.sellCount || 0) - (a.sellCount || 0)
      // );
      setMonthReports(data);
    } catch (err) {
      console.log(err);
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

  const fetchRecentOrders = async () => {
    try {
      const data = await getAllOrders("?page=1&limit=30");
      setOrders(data?.orders || []);
    } catch (err) {
      console.error("Lỗi khi lấy danh sách đơn hàng:", err);
      setOrders([]);
    }
  };

  const formatNumber = (number: any) => {
    return new Intl.NumberFormat('vi-VN').format(number);
  };

  const formatDate = (dateTime: string) =>
    new Date(dateTime).toLocaleString("vi-VN");

  const getLast7DaysRevenue = () => {
    const result = [];
    const now = new Date();

    for (let i = 6; i >= 0; i -= 1) {
      const day = new Date(now);
      day.setHours(0, 0, 0, 0);
      day.setDate(now.getDate() - i);
      const nextDay = new Date(day);
      nextDay.setDate(day.getDate() + 1);

      const dailyRevenue = orders
        .filter((order: any) => {
          const createdAt = new Date(order.createdAt);
          return createdAt >= day && createdAt < nextDay && order.status === "completed";
        })
        .reduce((sum: number, order: any) => sum + (order.totalPrice || 0), 0);

      result.push({
        key: day.toISOString(),
        label: day.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" }),
        revenue: dailyRevenue,
      });
    }

    return result;
  };

  const weeklyRevenue = getLast7DaysRevenue();
  const maxRevenue = Math.max(...weeklyRevenue.map((item) => item.revenue), 1);

  const getOrderStatusText = (status: string) => {
    if (status === "pending") return "Chờ xác nhận";
    if (status === "confirmed") return "Đã xác nhận";
    if (status === "shipping") return "Đang giao";
    if (status === "completed") return "Hoàn thành";
    if (status === "cancelled") return "Đã hủy";
    return status;
  };

  return (
    <div className="admin-dashboard">
        {/* Main Content */}
        <main className="dashboard-main">
          {/* Stats Overview */}
          <section>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-card-icon primary">💰</div>
                <div className="stat-card-value">{formatPrice(monthReports.totalRevenue)}</div>
                <div className="stat-card-label">Tổng Doanh Thu Tháng Này</div>
              </div>
              <div className="stat-card">
                <div className="stat-card-icon success">📦</div>
                <div className="stat-card-value">{formatNumber(monthReports.totalOrders)}</div>
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
                </div>
              </div>
              <div className="chart-container">
                <div className="revenue-chart">
                  {weeklyRevenue.map((day) => (
                    <div key={day.key} className="revenue-bar-item">
                      <div className="revenue-value">{formatNumber(day.revenue)}</div>
                      <div
                        className="revenue-bar"
                        style={{ height: `${Math.max((day.revenue / maxRevenue) * 180, 8)}px` }}
                        title={`${day.label}: ${formatPrice(day.revenue)}`}
                      />
                      <div className="revenue-label">{day.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="chart-card">
              <div className="chart-header">
                <h3 className="chart-title">Hoạt Động Gần Đây</h3>
                <Link to="/admin/activities" className="view-all">Xem tất cả</Link>
              </div>
              <div className="activity-list">
                {newestOrder.length === 0 && <div className="no-orders">Chưa có đơn hàng mới</div>}
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
                            {order.status === 'confirmed' && ' xác nhận đơn '}
                            {order.status === 'shipping' && ' đang giao đơn '}
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
                  {newestOrder.length === 0 && (
                    <tr>
                      <td colSpan={5} className="no-orders">Chưa có đơn hàng mới</td>
                    </tr>
                  )}
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
                            {getOrderStatusText(order.status)}
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