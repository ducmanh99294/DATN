// AdminOrders.js
import { useState, useEffect, useRef } from 'react';
import '../../assets/admin/order.css';
import { cancelOrder, getAllOrders, getOrderById, updateOrderStatus, importOrders } from '../../api/orderApi';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../../context/AuthContext';
import { useNotify } from '../../hooks/useNotification';
import { exportToExcel, parseExcelFile } from '../../utils/excelUtils';
import type { Order } from '../Order';

const AdminOrders = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [activeModal, setActiveModal] = useState<"detail" | "reason" | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [orderDetail, setOrderDetail] = useState<any | null>(null);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    status: "all",
    date: "all",
    search: "",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { user } = useAuthContext();
  const notify = useNotify()
  const navigate = useNavigate();
  
  useEffect(() => {
    if (!user) return;

    if (user.role !== "admin") {
      notify.warning("Bạn không có quyền truy cập trang này!");
      navigate("/");
      return;
    }

    const fetchOrders = async () => {
      try {
        const data = await getAllOrders(
          `?page=${currentPage}&date=${filters.date}&status=${filters.status}&search=${filters.search}`
        );

        if (data) {
          setOrders(data.orders);
          setTotalPages(data.totalPages);
          setTotalOrders(data.total);
        }

      } catch (err) {
        console.error("Lỗi load orders:", err);
        notify.error("Không thể tải danh sách đơn hàng");
      }
    };

    fetchOrders();

  }, [user, filters.status, filters.date, filters.search, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filters.search, filters.status, filters.date]);

  // chi tiết đơn
  useEffect(() => {
    if (!selectedOrder?._id) return;

    const fetchOrderDetail = async () => {
      try {
        const data = await getOrderById(selectedOrder._id);
        setOrderDetail(data);
      } catch (err) {
        console.error("Lỗi lấy chi tiết đơn:", err);
      }
    };

    fetchOrderDetail();

  }, [selectedOrder?._id]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));

    setCurrentPage(1);
  };

  // 🔹 Cập nhật trạng thái đơn hàng bằng API
  const handleUpdateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      setOrders((prev) =>
        prev.map((order) =>
          order._id === orderId ? { ...order, status: newStatus } : order
        )
      );
      notify.success("Cập nhật trạng thái thành công!");
    } catch (err) {
      console.error(err);
      notify.error("Cập nhật trạng thái thất bại!");
    }
  };

  const openReasonModal = (order: Order) => {
    setSelectedOrder(order);
    setReason("");
    setActiveModal("reason");
  };

  const openDetailModal = (order: Order) => {
    setSelectedOrder(order);
    setActiveModal("detail");
  };

  const closeModal = () => {
    setActiveModal(null);
    setSelectedOrder(null);
    setReason("");
    setSelectedOrder(null);
    setOrderDetail(null);
  };

  const handleCancelOrder = async (e: any) => {
    e.preventDefault(); 
    console.log("Cancel order:", selectedOrder, reason);
    try {
      await cancelOrder(selectedOrder._id, reason);
      setOrders((prev) =>
        prev.map((order) =>
          order._id === selectedOrder._id ? { ...order, status: "cancelled" } : order
        )
      );

      notify.success("Hủy đơn hàng thành công!");
      setSelectedOrder(null);
      setActiveModal(null);
      setReason("");
    } catch (err) {
      console.error(err);
      notify.error("Hủy đơn hàng thất bại!");
    }
  };
  
  // 🔹 Format helper
  const formatPrice = (price: number) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);

  const getStatusText = (status: string) => {
    const statusMap: any = {
      pending: "Chờ xác nhận",
      processing: "Đang chuẩn bị",
      completed: "Hoàn thành",
      cancelled: "Đã hủy",
    };
    return statusMap[status] || status;
  };

  const handleExportExcel = async () => {
    try {
      setExporting(true);
      const data = await getAllOrders(`?page=1&limit=5000&date=${filters.date}&status=${filters.status}&search=${filters.search}`);
      const rows = (data.orders || []).map((o: any) => ({
        "Mã đơn": o._id?.slice(0, 8)?.toUpperCase() || "",
        "Khách hàng": o.user?.fullName || "",
        "Email": o.user?.email || "",
        "SĐT": o.userPhone || o.shippingAddress?.phone || "",
        "Tổng tiền": o.totalPrice ?? 0,
        "Ghi chú": o.note || "",
        "Địa chỉ": [o.shippingAddress?.address, o.shippingAddress?.ward, o.shippingAddress?.district].filter(Boolean).join(", ") || "",
        "Trạng thái": getStatusText(o.status),
        "Ngày tạo": o.createdAt ? new Date(o.createdAt).toLocaleString("vi-VN") : "",
      }));
      exportToExcel(rows, `don-hang-${new Date().toISOString().slice(0, 10)}`, "Đơn hàng");
      notify.success("Xuất Excel thành công!");
    } catch (err) {
      console.error(err);
      notify.error("Xuất Excel thất bại!");
    } finally {
      setExporting(false);
    }
  };

  const handleDownloadTemplateOrder = () => {
    const template = [
      { userEmail: "email@example.com", "fullName": "Nguyễn Văn A", "phone": "0901234567", "address": "123 Đường X", "ward": "Phường 1", "district": "Quận 1", note: "", productId: "ID_SẢN_PHẨM", quantity: 1 },
    ];
    exportToExcel(template, "mau-nhap-don-hang", "Mẫu");
    notify.success("Đã tải mẫu Excel!");
  };

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setImporting(true);
      const rows = await parseExcelFile(file);
      if (rows.length === 0) {
        notify.error("File không có dữ liệu.");
        return;
      }
      const ordersPayload = rows.map((row: any) => {
        const userEmail = row.userEmail ?? row["userEmail"] ?? "";
        const fullName = row.fullName ?? row["fullName"] ?? "";
        const phone = row.phone ?? row["phone"] ?? "";
        const address = row.address ?? row["address"] ?? "";
        const ward = row.ward ?? row["ward"] ?? "";
        const district = row.district ?? row["district"] ?? "";
        const note = row.note ?? row["note"] ?? "";
        const productId = row.productId ?? row["productId"] ?? "";
        const quantity = Number(row.quantity ?? row["quantity"]) || 1;
        return {
          userEmail: String(userEmail).trim(),
          shippingAddress: { fullName: String(fullName), phone: String(phone), address: String(address), ward: String(ward), district: String(district) },
          note: String(note),
          items: [{ productId: String(productId).trim(), quantity }],
        };
      }).filter((o: any) => o.userEmail && o.shippingAddress.fullName && o.shippingAddress.phone && o.items?.length > 0);
      if (ordersPayload.length === 0) {
        notify.error("Không có dòng nào hợp lệ. Kiểm tra cột: userEmail, fullName, phone, productId, quantity.");
        return;
      }
      await importOrders(ordersPayload);
      notify.success(`Đã nhập ${ordersPayload.length} đơn hàng!`);
      const data = await getAllOrders(`?page=${currentPage}&date=${filters.date}&status=${filters.status}&search=${filters.search}`);
      if (data) {
        setOrders(data.orders);
        setTotalPages(data.totalPages);
        setTotalOrders(data.total);
      }
    } catch (err: any) {
      notify.error(err?.message || "Nhập Excel thất bại!");
    } finally {
      setImporting(false);
      e.target.value = "";
    }
  };

  // console.log(ordersDetail)
  return (
    <div className="admin-orders">
        <main className="dashboard-main">
          <div className="orders-main">
            <div className="orders-header">
              <h2 className="orders-title">Quản Lý Đơn Hàng</h2>
              <div className="orders-actions">
                <button type="button" className="export-btn" onClick={handleExportExcel} disabled={exporting}>
                  {exporting ? "⏳ Đang xuất..." : "📤 Xuất Excel"}
                </button>
                <button type="button" className="filter-btn" onClick={handleDownloadTemplateOrder}>
                  📥 Tải mẫu Excel
                </button>
                <button type="button" className="filter-btn" onClick={() => fileInputRef.current?.click()} disabled={importing}>
                  {importing ? "⏳ Đang nhập..." : "📂 Nhập Excel"}
                </button>
                <input ref={fileInputRef} type="file" accept=".xlsx,.xls" onChange={handleImportExcel} style={{ display: "none" }} />
              </div>
            </div>

            {/* Filters */}
            <div className="orders-filter">
              <div className="filter-group">
                <label className="filter-label">Trạng thái</label>
                <select 
                  className="filter-select"
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                >
                  <option value="all">Tất cả trạng thái</option>
                  <option value="pending">Chờ xác nhận</option>
                  <option value="confirmed">Đã xác nhận</option>
                  <option value="completed">Hoàn thành</option>
                  <option value="cancelled">Đã hủy</option>
                </select>
              </div>

              <div className="filter-group">
                <label className="filter-label">Thời gian</label>
                <select 
                  className="filter-select"
                  value={filters.date}
                  onChange={(e) => handleFilterChange('date', e.target.value)}
                >
                  <option value="all">Tất cả</option>
                  <option value="today">Hôm nay</option>
                  <option value="7days">7 ngày gần đây</option>
                  <option value="30days">30 ngày gần đây</option>
                  <option value="thisMonth">Tháng này</option>
                </select>
              </div>

              <div className="filter-group">
                <label className="filter-label">Tìm kiếm</label>
                <div className="search-box">
                  <input
                    type="text"
                    className="search-input"
                    placeholder="Mã đơn, tên KH, SĐT..."
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                  />
                  <span className="search-icon">🔍</span>
                </div>
              </div>
            </div>

            {/* Orders Table */}
            <div className="orders-table-container">
              <table className="orders-table">
                <thead>
                  <tr>
                    <th>Mã Đơn</th>
                    <th>Khách Hàng</th>
                    <th>Tổng Tiền</th>
                    <th>Ghi chú</th>
                    <th>Địa chỉ</th>
                    <th>Trạng Thái</th>
                    <th>Thao Tác</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map(order => (
                    <tr key={order._id}>
                      <td className="order-id">{order._id.slice(0,8).toUpperCase()}</td>
                      <td>
                        <div className="customer-info">
                          <div className="customer-name">{order.user.fullName}</div>
                          <div className="customer-contact">{order?.userPhone}</div>
                        </div>
                      </td>
                      <td className="order-amount">{formatPrice(order?.totalPrice)}</td>
                      <td>
                        <span className={`order-type ${order.note}`}>
                            {order.note ? order.note : "Không có ghi chú"}
                        </span>
                      </td>
                      <td className="order-address">
                        <div>{order.shippingAddress?.fullName}</div>
                        <div>{order.shippingAddress?.phone}</div>
                        <div>
                          {order.shippingAddress?.address}, 
                          {order.shippingAddress?.ward}, 
                          {order.shippingAddress?.district}
                        </div>
                      </td>
                      <td>
                        <span 
                          className={`order-status ${order?.status}`}
                          onClick={() => setSelectedOrder(order)}
                        >
                          {getStatusText(order?.status)}
                        </span>
                      </td>
                      <td>
                        <div className="order-actions">
                          <button 
                            className="action-btn view"
                            onClick={() => {
                              openDetailModal(order);
                            }}
                          >
                            👁️
                          </button>
                          {order.status === 'pending' && (
                            <>
                              <button 
                                className="action-btn edit"
                                onClick={() => handleUpdateOrderStatus(order._id, 'confirmed')}
                              >
                                ✅
                              </button>
                              <button 
                                className="action-btn cancel"
                                onClick={() => openReasonModal(order)}
                              >
                                ❌
                              </button>
                            </>
                          )}
                          {order.status === 'confirmed' && (
                            <button 
                              className="action-btn edit"
                              onClick={() => handleUpdateOrderStatus(order._id, 'completed')}
                            >
                              ✅
                              
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="pagination">
              <div className="pagination-controls">
                <button 
                  className="page-btn"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  ←
                </button>
                {[...Array(totalPages)].map((_, index) => (
                  <button
                    key={index + 1}
                    className={`page-btn ${currentPage === index + 1 ? 'active' : ''}`}
                    onClick={() => setCurrentPage(index + 1)}
                  >
                    {index + 1}
                  </button>
                ))}
                <button 
                  className="page-btn"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  →
                </button>
              </div>
            </div>
          </div>
        </main>
        {selectedOrder && orderDetail && activeModal === "detail" && (
        <div 
            className="order-details-modal"
            onClick={(e) => {
            if (e.target === e.currentTarget) {
                closeModal();
            }
            }}
        >
            <div className="modal-content">
            <div className="modal-header">
                <h2 className="modal-title">Chi Tiết Đơn Hàng {orderDetail.order._id.slice(0,8).toUpperCase()}</h2>
                <button className="close-btn" onClick={() => closeModal()}>×</button>
            </div>

            <div style={{ display: 'grid', gap: '25px' }}>
                {/* --- Thông tin khách hàng --- */}
                <div>
                <h3 style={{ color: '#4B3B2B', marginBottom: '15px', fontSize: '1.2rem' }}>Thông tin khách hàng</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                    <div><strong>Họ tên:</strong> {orderDetail.order.user.fullName}</div>
                    <div><strong>SĐT:</strong> {orderDetail.order.user.phone}</div>
                    <div><strong>Email:</strong> {orderDetail.order.user.email}</div>
                    <div><strong>Thời gian đặt:</strong> {new Date(orderDetail.order.createdAt).toLocaleString('vi-VN')}</div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                {orderDetail.order.note ? (
                    <div style={{ marginTop: '10px' }}>
                    <strong>Ghi chú:</strong> {orderDetail.order.note}
                    </div>
                ):(
                   <div style={{ marginTop: '10px' }}>
                    <strong>Ghi chú:</strong> Không có ghi chú
                    </div>
                )}
                {orderDetail.order.dateConfirmed ? ( <div style={{ marginTop: '10px' }}><strong>Thời gian hoàn thành:</strong> {new Date(orderDetail.order.dateConfirmed).toLocaleString('vi-VN')}</div>): ("")}
                    </div>

                    <div style={{ marginTop: '10px' }}>
                      <strong>Địa chỉ: </strong>
                      {orderDetail.order.shippingAddress?.address}, 
                      {orderDetail.order.shippingAddress?.ward}, 
                      {orderDetail.order.shippingAddress?.district}
                    </div>
                </div>

                {/* --- Danh sách sản phẩm --- */}
                <div>
                <h3 style={{ color: '#4B3B2B', marginBottom: '15px', fontSize: '1.2rem' }}>Sản phẩm</h3>
                <div style={{ background: '#FDFDFD', borderRadius: '10px', padding: '20px' }}>
                    {orderDetail.items.map((item: any, index: any) => (
                    <div key={index} style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        padding: '10px 0',
                        borderBottom: index < orderDetail.items.length - 1 ? '1px solid rgba(75, 59, 43, 0.1)' : 'none'
                    }}>
                        <div>
                        <div style={{ fontWeight: '500', color: '#4B3B2B' }}>{item.product.name}</div>
                        <div style={{ fontSize: '0.9rem', color: 'rgba(75, 59, 43, 0.7)' }}>
                            Số lượng: {item.quantity}
                        </div>
                        </div>
                        <div style={{ fontWeight: '600', color: '#A0522D' }}>
                        {new Intl.NumberFormat("vi-VN", {
                            style: "currency",
                            currency: "VND"
                        }).format(item.price * item.quantity)}
                        </div>
                    </div>
                    ))}
                    <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    paddingTop: '15px',
                    marginTop: '15px',
                    borderTop: '2px solid #F5F0E6',
                    fontWeight: '700',
                    fontSize: '1.1rem',
                    color: '#A0522D'
                    }}>
                    <span>Tổng cộng:</span>
                    <span>
                        {new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" })
                        .format(orderDetail.order.totalPrice)}
                    </span>
                    </div>
                </div>
                </div>

                {/* --- Nút hành động --- */}
                <div style={{ display: 'flex', gap: '15px', justifyContent: 'flex-end' }}>
                <button className="action-btn cancel" onClick={() => closeModal()}>
                    Đóng
                </button>

                {orderDetail.order.status === 'pending' && (
                    <>
                    <button 
                        className="action-btn edit"
                        onClick={() => handleUpdateOrderStatus(orderDetail.order._id, 'confirmed')}
                    >
                        Xác nhận
                    </button>
                    <button 
                        className="action-btn cancel"
                        onClick={() => openReasonModal(orderDetail)}
                    >
                        Hủy đơn
                    </button>
                    </>
                )}

                {orderDetail.status === 'confirmed' && (
                    <button 
                    className="action-btn shipping"
                    onClick={() => handleUpdateOrderStatus(orderDetail.order._id, 'shipping')}
                    >
                    Giao hàng
                    </button>
                )}
                {orderDetail.order.status === 'shipping' && (
                    <button 
                    className="action-btn complete"
                    onClick={() => handleUpdateOrderStatus(orderDetail.order._id, 'completed')}
                    >
                    Hoàn thành
                    </button>
                )}
                </div>
            </div>
            </div>
        </div>
        )}
  
        {activeModal === "reason" && selectedOrder && (
          <div className="order-details-modal">
            <div className="modal-content">
              <div className="modal-header">
                <h2 className="modal-title">
                  Vui lòng nhập lý do
                </h2>
                <button className="close-btn" onClick={()=> closeModal()}>×</button>
              </div>

              <form className="product-form">
                <div className="form-group full-width">
                  <label className="form-label required">Lý do</label>
                  <input
                    type="text"
                    className="form-input"
                    name="banReason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    required
                  />
                </div>
                <div style={{ display: 'flex', gap: '15px', justifyContent: 'flex-end' }}>
                  <button 
                  type="button"
                  className="cancel-btn"
                  style={{ width: '50%' }}
                  onClick={() => closeModal()}>
                    Hủy
                  </button>
                  <button type="submit" className="save-btn" onClick={handleCancelOrder}>
                    Xác nhận
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
    </div>
  );
};


export default AdminOrders;