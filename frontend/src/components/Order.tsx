import  { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../assets/order.css';
import { getMyOrder } from '../api/orderApi';
import type { Product } from './Product';

interface OrderItem {
  id: number;
  product: Product;
  name: string;
  image: string;
  price: number;
  quantity: number;
  total: number;
  prescriptionRequired?: boolean;
}

export interface Order {
  _id: string;
  orderNumber: string;
  createdAt: string;
  status: 'pending' | 'confirmed' | 'processing' | 'shipping' | 'delivered' | 'cancelled' | 'refunded';
  totalPrice: number;
  items: OrderItem[];
  shippingAddress: {
    fullName: string;
    phone: string;
    address: string;
  };
  paymentMethod: string;
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  shippingFee: number;
  discount: number;
  voucherCode?: string;
  estimatedDelivery?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  note?: string;
  cancellationReason?: string;
  updatedAt?: string;
  reviewStatus?: {
    [key: string]: boolean; // productId: reviewed
  };
}

interface OrderFilter {
  status: string;
  dateRange: 'all' | 'today' | 'week' | 'month' | 'custom';
  startDate?: string;
  endDate?: string;
  searchQuery: string;
}

interface OrderStats {
  total: number;
  pending: number;
  processing: number;
  shipping: number;
  delivered: number;
  cancelled: number;
  totalSpent: number;
}

const Orders = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<string>('all');
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderDetail, setShowOrderDetail] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancellationReason, setCancellationReason] = useState('');
  const [cancellationNote, setCancellationNote] = useState('');
  const [filter, setFilter] = useState<OrderFilter>({
    status: 'all',
    dateRange: 'all',
    searchQuery: ''
  });
  const [stats, setStats] = useState<OrderStats>({
    total: 0,
    pending: 0,
    processing: 0,
    shipping: 0,
    delivered: 0,
    cancelled: 0,
    totalSpent: 0
  });
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const ordersPerPage = 10;

  // Mock data - Đơn hàng mẫu
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const data = await getMyOrder();

        // Nếu backend trả mảng orders
        setOrders(data || []);
      } catch (error) {
        console.error("Fetch orders failed:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

    console.log(orders)

  useEffect(() => {
    filterOrders();
    calculateStats();
  }, [orders, activeTab, filter]);

  const filterOrders = () => {
    let filtered = [...orders];

    // Filter by tab status
    if (activeTab !== 'all') {
      filtered = filtered.filter(order => order.status === activeTab);
    }

    // Filter by date range
    if (filter.dateRange !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      filtered = filtered.filter(order => {
        const orderDate = new Date(order.createdAt);
        
        switch (filter.dateRange) {
          case 'today':
            return orderDate >= today;
          case 'week':
            const weekAgo = new Date(today);
            weekAgo.setDate(weekAgo.getDate() - 7);
            return orderDate >= weekAgo;
          case 'month':
            const monthAgo = new Date(today);
            monthAgo.setMonth(monthAgo.getMonth() - 1);
            return orderDate >= monthAgo;
          default:
            return true;
        }
      });
    }

    // Filter by search query
    if (filter.searchQuery) {
      const query = filter.searchQuery.toLowerCase();
      filtered = filtered.filter(order =>
        order._id.toLowerCase().includes(query) ||
        order.items.some(item => item.name.toLowerCase().includes(query))
      );
    }

    // Sort by date (newest first)
    filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    setFilteredOrders(filtered);
  };

  const calculateStats = () => {
    const total = orders.length;
    const pending = orders.filter(o => o.status === 'pending').length;
    const processing = orders.filter(o => o.status === 'processing').length;
    const shipping = orders.filter(o => o.status === 'shipping').length;
    const delivered = orders.filter(o => o.status === 'delivered').length;
    const cancelled = orders.filter(o => o.status === 'cancelled').length;
    const totalSpent = orders
      .filter(o => o.status === 'delivered')
      .reduce((sum, o) => sum + o.totalPrice, 0);

    setStats({ total, pending, processing, shipping, delivered, cancelled, totalSpent });
  };

  // Pagination
  const indexOfLastOrder = currentPage * ordersPerPage;
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
  const currentOrders = filteredOrders.slice(indexOfFirstOrder, indexOfLastOrder);
  const totalPages = Math.ceil(filteredOrders.length / ordersPerPage);

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatShortDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  // Format price
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN').format(price) + '₫';
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    const statusMap: { [key: string]: { text: string; icon: string; className: string } } = {
      pending: { text: 'Chờ xác nhận', icon: 'fas fa-clock', className: 'status-pending' },
      confirmed: { text: 'Đã xác nhận', icon: 'fas fa-check-circle', className: 'status-confirmed' },
      processing: { text: 'Đang xử lý', icon: 'fas fa-box', className: 'status-processing' },
      shipping: { text: 'Đang giao', icon: 'fas fa-truck', className: 'status-shipping' },
      delivered: { text: 'Đã giao', icon: 'fas fa-check-double', className: 'status-delivered' },
      cancelled: { text: 'Đã hủy', icon: 'fas fa-times-circle', className: 'status-cancelled' },
      refunded: { text: 'Đã hoàn tiền', icon: 'fas fa-undo-alt', className: 'status-refunded' }
    };
    return statusMap[status] || statusMap.pending;
  };

  // Get payment status badge
  const getPaymentStatusBadge = (status: string) => {
    const statusMap: { [key: string]: { text: string; className: string } } = {
      pending: { text: 'Chờ thanh toán', className: 'payment-pending' },
      paid: { text: 'Đã thanh toán', className: 'payment-paid' },
      failed: { text: 'Thất bại', className: 'payment-failed' },
      refunded: { text: 'Đã hoàn tiền', className: 'payment-refunded' }
    };
    return statusMap[status] || statusMap.pending;
  };

  // Handle cancel order
  const handleCancelOrder = (order: Order) => {
    setSelectedOrder(order);
    setShowCancelModal(true);
  };

  const submitCancellation = () => {
    if (!cancellationReason) {
      alert('Vui lòng chọn lý do hủy đơn');
      return;
    }

    setOrders(prevOrders =>
      prevOrders.map(order =>
        order._id === selectedOrder?._id
          ? { ...order, status: 'cancelled', cancellationReason, completedAt: new Date().toISOString() }
          : order
      )
    );

    setShowCancelModal(false);
    setSelectedOrder(null);
    setCancellationReason('');
    setCancellationNote('');
  };

  // Handle reorder
  const handleReorder = (order: Order) => {
    // Add items to cart
    console.log('Reordering:', order);
    navigate('/cart');
  };

  // Handle review product
  const handleReview = (productId: string, orderId: string) => {
    navigate(`/review/${productId}?order=${orderId}`);
  };

  // Handle track order
  const handleTrackOrder = (order: Order) => {
    if (order.trackingUrl) {
      window.open(order.trackingUrl, '_blank');
    }
  };

  // Handle view order detail
  const handleViewDetail = (order: Order) => {
    setSelectedOrder(order);
    setShowOrderDetail(true);
  };

  // Render order card
  const renderOrderCard = (order: Order) => {
    const statusBadge = getStatusBadge(order.status);
    const paymentBadge = getPaymentStatusBadge(order.paymentStatus);
    return (
      <div key={order._id} className="order-card">
        <div className="order-header">
          <div className="order-info">
            <div className="order-number">
              <i className="fas fa-receipt"></i>
              Mã đơn: <strong>{order._id.slice(0,6)}</strong>
            </div>
            <div className="order-date">
              <i className="fas fa-calendar-alt"></i>
              {formatDate(order.createdAt)}
            </div>
          </div>
          <div className="order-badges">
            <span className={`status-badge ${statusBadge.className}`}>
              <i className={statusBadge.icon}></i>
              {statusBadge.text}
            </span>
            <span className={`payment-badge ${paymentBadge.className}`}>
              <i className="fas fa-credit-card"></i>
              {paymentBadge.text}
            </span>
          </div>
        </div>

        <div className="order-items">
          {order.items.slice(0, 3).map(item => (
            <div key={item.id} className="order-item">
              <div className="item-image">
                <img src={item?.product?.images[0]} alt={item.name} />
                {item.prescriptionRequired && (
                  <span className="prescription-icon" title="Thuốc kê đơn">
                    <i className="fas fa-prescription"></i>
                  </span>
                )}
              </div>
              <div className="item-details">
                <div className="item-name">{item.product.name}</div>
                <div className="item-price">
                  {formatPrice(item.price)} x {item.quantity}
                </div>
              </div>
            </div>
          ))}
          {order.items.length > 3 && (
            <div className="more-items">
              +{order.items.length - 3} sản phẩm khác
            </div>
          )}
        </div>

        <div className="order-footer">
          <div className="order-total">
            <span>Tổng tiền:</span>
            <span className="total-amount">{formatPrice(order.totalPrice)}</span>
          </div>
          
          <div className="order-actions">
            <button 
              className="action-btn view"
              onClick={() => handleViewDetail(order)}
            >
              <i className="fas fa-eye"></i>
              Chi tiết
            </button>
            
            {order.status === 'shipping' && order.trackingNumber && (
              <button 
                className="action-btn track"
                onClick={() => handleTrackOrder(order)}
              >
                <i className="fas fa-truck"></i>
                Theo dõi
              </button>
            )}
            
            {order.status === 'pending' && (
              <button 
                className="action-btn cancel"
                onClick={() => handleCancelOrder(order)}
              >
                <i className="fas fa-ban"></i>
                Hủy đơn
              </button>
            )}
            
            {order.status === 'delivered' && (
              <>
                <button 
                  className="action-btn reorder"
                  onClick={() => handleReorder(order)}
                >
                  <i className="fas fa-redo-alt"></i>
                  Mua lại
                </button>
                {order.items.some(item => !order.reviewStatus?.[String(item.product._id)]) && (
                  <button 
                    className="action-btn review"
                    onClick={() => handleReview(order.items[0].product._id, order._id)}
                  >
                    <i className="fas fa-star"></i>
                    Đánh giá
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Render order detail modal
  const renderOrderDetailModal = () => {
    if (!selectedOrder) return null;

    const statusBadge = getStatusBadge(selectedOrder.status);
    const paymentBadge = getPaymentStatusBadge(selectedOrder.paymentStatus);

    return (
      <div className="modal-overlay" onClick={() => setShowOrderDetail(false)}>
        <div className="modal-content order-detail-modal" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h3>
              <i className="fas fa-file-invoice"></i>
              Chi tiết đơn hàng
            </h3>
            <button className="close-btn" onClick={() => setShowOrderDetail(false)}>
              <i className="fas fa-times"></i>
            </button>
          </div>

          <div className="modal-body">
            <div className="order-header-info">
              <div className="order-number-large">
                Mã đơn: <strong>{selectedOrder.orderNumber}</strong>
              </div>
              <div className="order-date-large">
                <i className="fas fa-calendar-alt"></i>
                {formatDate(selectedOrder.createdAt)}
              </div>
            </div>

            <div className="order-status-section">
              <div className="status-row">
                <span className="label">Trạng thái đơn hàng:</span>
                <span className={`status-badge ${statusBadge.className}`}>
                  <i className={statusBadge.icon}></i>
                  {statusBadge.text}
                </span>
              </div>
              <div className="status-row">
                <span className="label">Trạng thái thanh toán:</span>
                <span className={`payment-badge ${paymentBadge.className}`}>
                  <i className="fas fa-credit-card"></i>
                  {paymentBadge.text}
                </span>
              </div>
            </div>

            <div className="order-timeline-detail">
              <h4>
                <i className="fas fa-history"></i>
                Lịch sử đơn hàng
              </h4>
              <div className="timeline-steps">
                <div className={`timeline-step ${selectedOrder.status !== 'cancelled' ? 'completed' : ''}`}>
                  <div className="step-icon">
                    <i className="fas fa-check"></i>
                  </div>
                  <div className="step-content">
                    <div className="step-title">Đơn hàng đã đặt</div>
                    <div className="step-date">{formatShortDate(selectedOrder.createdAt)}</div>
                  </div>
                </div>

                {selectedOrder.status !== 'cancelled' && (
                  <>
                    <div className={`timeline-step ${['processing', 'shipping', 'delivered'].includes(selectedOrder.status) ? 'completed' : ''}`}>
                      <div className="step-icon">
                        <i className="fas fa-box"></i>
                      </div>
                      <div className="step-content">
                        <div className="step-title">Đang xử lý</div>
                      </div>
                    </div>

                    <div className={`timeline-step ${['shipping', 'delivered'].includes(selectedOrder.status) ? 'completed' : ''}`}>
                      <div className="step-icon">
                        <i className="fas fa-truck"></i>
                      </div>
                      <div className="step-content">
                        <div className="step-title">Đang giao hàng</div>
                        {selectedOrder.trackingNumber && (
                          <div className="step-tracking">
                            Mã vận đơn: {selectedOrder.trackingNumber}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className={`timeline-step ${selectedOrder.status === 'delivered' ? 'completed' : ''}`}>
                      <div className="step-icon">
                        <i className="fas fa-check-double"></i>
                      </div>
                      <div className="step-content">
                        <div className="step-title">Giao hàng thành công</div>
                        {selectedOrder.updatedAt && (
                          <div className="step-date">{formatShortDate(selectedOrder.updatedAt)}</div>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {selectedOrder.status === 'cancelled' && (
                  <div className="timeline-step cancelled">
                    <div className="step-icon">
                      <i className="fas fa-times"></i>
                    </div>
                    <div className="step-content">
                      <div className="step-title">Đã hủy</div>
                      {selectedOrder.cancellationReason && (
                        <div className="step-reason">Lý do: {selectedOrder.cancellationReason}</div>
                      )}
                      {selectedOrder.updatedAt && (
                        <div className="step-date">{formatShortDate(selectedOrder.updatedAt)}</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="shipping-info">
              <h4>
                <i className="fas fa-map-marker-alt"></i>
                Thông tin giao hàng
              </h4>
              <div className="info-card">
                <div className="info-row">
                  <span className="label">Người nhận:</span>
                  <span className="value">{selectedOrder.shippingAddress.fullName}</span>
                </div>
                <div className="info-row">
                  <span className="label">Số điện thoại:</span>
                  <span className="value">{selectedOrder.shippingAddress.phone}</span>
                </div>
                <div className="info-row">
                  <span className="label">Địa chỉ:</span>
                  <span className="value">{selectedOrder.shippingAddress.address}</span>
                </div>
                {selectedOrder.estimatedDelivery && (
                  <div className="info-row">
                    <span className="label">Dự kiến giao:</span>
                    <span className="value">{formatShortDate(selectedOrder.estimatedDelivery)}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="payment-info">
              <h4>
                <i className="fas fa-credit-card"></i>
                Thông tin thanh toán
              </h4>
              <div className="info-card">
                <div className="info-row">
                  <span className="label">Phương thức:</span>
                  <span className="value">
                    {selectedOrder.paymentMethod === 'cod' ? 'Thanh toán khi nhận hàng' :
                     selectedOrder.paymentMethod === 'bank' ? 'Chuyển khoản ngân hàng' :
                     selectedOrder.paymentMethod === 'momo' ? 'Ví MoMo' :
                     selectedOrder.paymentMethod === 'vnpay' ? 'VNPAY' :
                     selectedOrder.paymentMethod === 'zalopay' ? 'ZaloPay' : selectedOrder.paymentMethod}
                  </span>
                </div>
                <div className="info-row">
                  <span className="label">Trạng thái:</span>
                  <span className={`payment-badge ${paymentBadge.className}`}>
                    {paymentBadge.text}
                  </span>
                </div>
              </div>
            </div>

            <div className="products-list">
              <h4>
                <i className="fas fa-shopping-bag"></i>
                Sản phẩm đã mua
              </h4>
              {selectedOrder.items.map(item => (
                <div key={item.id} className="product-item">
                  <div className="product-image">
                    <img src={item.product.images[0]} alt={item.name} />
                  </div>
                  <div className="product-details">
                    <div className="product-name">{item.product.name}</div>
                    <div className="product-price">
                      {formatPrice(item.price)} x {item.quantity}
                    </div>
                  </div>
                  <div className="product-total">
                    {formatPrice(item.price * item.quantity)}
                  </div>
                </div>
              ))}
            </div>

            <div className="order-summary-detail">
              <div className="summary-row">
                <span>Tạm tính:</span>
                <span>{formatPrice(selectedOrder.totalPrice - selectedOrder.shippingFee + selectedOrder.discount)}</span>
              </div>
              <div className="summary-row">
                <span>Phí vận chuyển:</span>
                <span>{selectedOrder.shippingFee === 0 ? 'Miễn phí' : formatPrice(selectedOrder.shippingFee)}</span>
              </div>
              {selectedOrder.discount > 0 && (
                <div className="summary-row discount">
                  <span>Giảm giá:</span>
                  <span>-{formatPrice(selectedOrder.discount)}</span>
                </div>
              )}
              {selectedOrder.voucherCode && (
                <div className="summary-row">
                  <span>Mã giảm giá:</span>
                  <span className="voucher-code">{selectedOrder.voucherCode}</span>
                </div>
              )}
              <div className="summary-row total">
                <span>Tổng cộng:</span>
                <span className="total-price">{formatPrice(selectedOrder.totalPrice)}</span>
              </div>
            </div>

            {selectedOrder.note && (
              <div className="order-note">
                <h4>
                  <i className="fas fa-pencil-alt"></i>
                  Ghi chú
                </h4>
                <p>{selectedOrder.note}</p>
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button className="close-modal-btn" onClick={() => setShowOrderDetail(false)}>
              Đóng
            </button>
            {selectedOrder.status === 'shipping' && selectedOrder.trackingNumber && (
              <button 
                className="track-order-btn"
                onClick={() => handleTrackOrder(selectedOrder)}
              >
                <i className="fas fa-truck"></i>
                Theo dõi vận chuyển
              </button>
            )}
            {selectedOrder.status === 'pending' && (
              <button 
                className="cancel-order-btn"
                onClick={() => {
                  setShowOrderDetail(false);
                  handleCancelOrder(selectedOrder);
                }}
              >
                <i className="fas fa-ban"></i>
                Hủy đơn hàng
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Render cancel modal
  const renderCancelModal = () => {
    if (!showCancelModal) return null;

    return (
      <div className="modal-overlay" onClick={() => setShowCancelModal(false)}>
        <div className="modal-content cancel-modal" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h3>
              <i className="fas fa-exclamation-triangle"></i>
              Xác nhận hủy đơn hàng
            </h3>
            <button className="close-btn" onClick={() => setShowCancelModal(false)}>
              <i className="fas fa-times"></i>
            </button>
          </div>

          <div className="modal-body">
            <div className="cancel-info">
              <p>Bạn có chắc chắn muốn hủy đơn hàng <strong>{selectedOrder?.orderNumber}</strong>?</p>
            </div>

            <div className="form-group">
              <label>Lý do hủy *</label>
              <select 
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
              >
                <option value="">Chọn lý do hủy</option>
                <option value="Thay đổi địa chỉ giao hàng">Thay đổi địa chỉ giao hàng</option>
                <option value="Thay đổi phương thức thanh toán">Thay đổi phương thức thanh toán</option>
                <option value="Muốn thay đổi sản phẩm">Muốn thay đổi sản phẩm</option>
                <option value="Tìm thấy giá tốt hơn ở nơi khác">Tìm thấy giá tốt hơn ở nơi khác</option>
                <option value="Không có đơn thuốc theo yêu cầu">Không có đơn thuốc theo yêu cầu</option>
                <option value="Thời gian giao hàng quá lâu">Thời gian giao hàng quá lâu</option>
                <option value="Lý do khác">Lý do khác</option>
              </select>
            </div>

            {cancellationReason === 'Lý do khác' && (
              <div className="form-group">
                <label>Ghi chú thêm</label>
                <textarea
                  placeholder="Nhập lý do chi tiết..."
                  value={cancellationNote}
                  onChange={(e) => setCancellationNote(e.target.value)}
                  rows={3}
                />
              </div>
            )}

            <div className="cancel-warning">
              <i className="fas fa-info-circle"></i>
              <p>Sau khi hủy, đơn hàng sẽ được hoàn tác và bạn có thể đặt lại nếu muốn.</p>
            </div>
          </div>

          <div className="modal-footer">
            <button className="close-modal-btn" onClick={() => setShowCancelModal(false)}>
              Không, giữ lại
            </button>
            <button className="confirm-cancel-btn" onClick={submitCancellation}>
              <i className="fas fa-check"></i>
              Xác nhận hủy
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="orders-container">
      {/* Header */}
      <div className="orders-header">
        <div className="container">
          <div className="header-content">
            <h1>
              <i className="fas fa-boxes"></i>
              Đơn hàng của tôi
            </h1>
            <p>Quản lý và theo dõi tất cả đơn hàng đã đặt</p>
          </div>
        </div>
      </div>

      <div className="container">
        {/* Stats Cards */}
        <div className="stats-cards">
          <div className="stat-card">
            <div className="stat-icon total">
              <i className="fas fa-shopping-bag"></i>
            </div>
            <div className="stat-info">
              <div className="stat-value">{stats.total}</div>
              <div className="stat-label">Tổng đơn</div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon pending">
              <i className="fas fa-clock"></i>
            </div>
            <div className="stat-info">
              <div className="stat-value">{stats.pending}</div>
              <div className="stat-label">Chờ xác nhận</div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon shipping">
              <i className="fas fa-truck"></i>
            </div>
            <div className="stat-info">
              <div className="stat-value">{stats.shipping}</div>
              <div className="stat-label">Đang giao</div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon delivered">
              <i className="fas fa-check-circle"></i>
            </div>
            <div className="stat-info">
              <div className="stat-value">{stats.delivered}</div>
              <div className="stat-label">Đã giao</div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="orders-filters">
          <div className="search-box">
            <i className="fas fa-search"></i>
            <input
              type="text"
              placeholder="Tìm kiếm theo mã đơn hoặc tên sản phẩm"
              value={filter.searchQuery}
              onChange={(e) => setFilter({...filter, searchQuery: e.target.value})}
            />
          </div>
          
          <div className="date-filter">
            <select 
              value={filter.dateRange}
              onChange={(e) => setFilter({...filter, dateRange: e.target.value as any})}
            >
              <option value="all">Tất cả thời gian</option>
              <option value="today">Hôm nay</option>
              <option value="week">7 ngày qua</option>
              <option value="month">30 ngày qua</option>
            </select>
          </div>
        </div>

        {/* Tabs */}
        <div className="orders-tabs">
          <button 
            className={`tab ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            Tất cả ({stats.total})
          </button>
          <button 
            className={`tab ${activeTab === 'pending' ? 'active' : ''}`}
            onClick={() => setActiveTab('pending')}
          >
            Chờ xác nhận ({stats.pending})
          </button>
          <button 
            className={`tab ${activeTab === 'processing' ? 'active' : ''}`}
            onClick={() => setActiveTab('processing')}
          >
            Đang xử lý ({stats.processing})
          </button>
          <button 
            className={`tab ${activeTab === 'shipping' ? 'active' : ''}`}
            onClick={() => setActiveTab('shipping')}
          >
            Đang giao ({stats.shipping})
          </button>
          <button 
            className={`tab ${activeTab === 'delivered' ? 'active' : ''}`}
            onClick={() => setActiveTab('delivered')}
          >
            Đã giao ({stats.delivered})
          </button>
          <button 
            className={`tab ${activeTab === 'cancelled' ? 'active' : ''}`}
            onClick={() => setActiveTab('cancelled')}
          >
            Đã hủy ({stats.cancelled})
          </button>
        </div>

        {/* Orders List */}
        <div className="orders-list">
          {loading ? (
            <div className="loading-state">
              <i className="fas fa-spinner fa-spin"></i>
              <p>Đang tải đơn hàng...</p>
            </div>
          ) : filteredOrders.length > 0 ? (
            <>
              {currentOrders.map(order => renderOrderCard(order))}
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="pagination">
                  <button 
                    className={`page-btn ${currentPage === 1 ? 'disabled' : ''}`}
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    <i className="fas fa-chevron-left"></i>
                  </button>
                  
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      className={`page-btn ${currentPage === page ? 'active' : ''}`}
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </button>
                  ))}
                  
                  <button 
                    className={`page-btn ${currentPage === totalPages ? 'disabled' : ''}`}
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                  >
                    <i className="fas fa-chevron-right"></i>
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">
                <i className="fas fa-box-open"></i>
              </div>
              <h3>Chưa có đơn hàng nào</h3>
              <p>Bạn chưa có đơn hàng nào trong mục này</p>
              <button 
                className="shop-now-btn"
                onClick={() => navigate('/products')}
              >
                <i className="fas fa-shopping-bag"></i>
                Mua sắm ngay
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showOrderDetail && renderOrderDetailModal()}
      {renderCancelModal()}
    </div>
  );
};

export default Orders;