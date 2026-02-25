import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../assets/cart.css';
import { useCart, type CartItem } from '../context/CartContext';
import { useAuthContext } from '../context/AuthContext';

interface CartSummary {
  subtotal: number;
  discount: number;
  couponDiscount: number;
  shippingFee: number;
  total: number;
  savedAmount: number;
}

const Cart = () => {
  const navigate = useNavigate();
  const {state,loading,updateQuantity,removeFromCart} = useCart();
  const {user} = useAuthContext();

  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [currentPrescriptionItem, setCurrentPrescriptionItem] = useState<CartItem | null>(null);

  useEffect(() => {
    
    setSelectedItems(state.items.map(item => item._id));
  }, []);

  // Tính toán tổng giỏ hàng
  const calculateSummary = (): CartSummary => {
    const subtotal = state.items
      .filter(item => selectedItems.includes(item._id))
      .reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // Tính discount từ sản phẩm giảm giá
    const productDiscount = state.items
      .filter(item => selectedItems.includes(item._id) && item.price)
      .reduce((sum, item) => {
        const original = item.price  || item.price ;
        const discount = (original - item.price ) * item.quantity;
        return sum + discount;
      }, 0);

    // Tính discount từ coupon
    let couponDiscount = 0;

    // Phí vận chuyển (miễn phí cho đơn > 500k)
    let shippingFee = 30000;
    if (subtotal >= 500000) {
      shippingFee = 0;
    }

    const total = subtotal - couponDiscount + shippingFee;

    return {
      subtotal,
      discount: productDiscount,
      couponDiscount,
      shippingFee,
      total,
      savedAmount: productDiscount + couponDiscount
    };
  };

  const summary = calculateSummary();

  // Xử lý thay đổi số lượng
  const handleQuantityChange = (id: string, delta: number) => {
    const item = state.items.find((item) => item._id === id);
    if (!item) return;

    const newQuantity = item.quantity + delta;

    if (newQuantity < 1) return;

    updateQuantity(id, newQuantity);
  };


  // Xử lý xóa sản phẩm
  const handleRemoveItem = (itemId: string) => {
    removeFromCart(itemId);
    // setSelectedItems(prev => prev.filter(id => id !== itemId));
  };

  // Xử lý chọn tất cả
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedItems(state.items.map(item => item._id));
    } else {
      setSelectedItems([]);
    }
  };

  // Xử lý chọn item
  const handleSelectItem = (itemId: string, checked: boolean) => {
    if (checked) {
      setSelectedItems(prev => [...prev, itemId]);
    } else {
      setSelectedItems(prev => prev.filter(id => id !== itemId));
    }
  };

  // Xử lý upload đơn thuốc
  const handleUploadPrescription = (item: CartItem) => {
    setCurrentPrescriptionItem(item);
    setShowPrescriptionModal(true);
  };

  // Xử lý thanh toán
  const handleCheckout = () => {
    if (!user) {
      alert('Vui lòng đăng nhập để thanh toán');
      navigate('/login', { state: { from: '/cart' } });
      return;
    }

    // Kiểm tra địa chỉ
    // if (!shippingAddress) {
    //   alert('Vui lòng chọn địa chỉ giao hàng');
    //   return;
    // }

    // Kiểm tra thuốc kê đơn
    const prescriptionRequiredItems = state.items.filter(
      item => selectedItems.includes(item._id) && 
      item.productId.prescriptionRequired 
      // && !item.hasPrescription
    );

    if (prescriptionRequiredItems.length > 0) {
      alert('Vui lòng tải lên đơn thuốc cho các sản phẩm yêu cầu kê đơn');
      return;
    }

    setIsCheckingOut(true);

    // Giả lập API call
    setTimeout(() => {
      setIsCheckingOut(false);
      navigate('/checkout');
    }, 2000);
  };

  // Format giá tiền
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN').format(price) + '₫';
  };

  // Render modal tải đơn thuốc
  const renderPrescriptionModal = () => {
    if (!showPrescriptionModal || !currentPrescriptionItem) return null;

    return (
      <div className="modal-overlay" onClick={() => setShowPrescriptionModal(false)}>
        <div className="modal-content" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h3>
              <i className="fas fa-prescription"></i>
              Tải lên đơn thuốc
            </h3>
            <button 
              className="close-btn"
              onClick={() => setShowPrescriptionModal(false)}
            >
              <i className="fas fa-times"></i>
            </button>
          </div>

          <div className="modal-body">
            <div className="prescription-info">
              <p className="product-name">{currentPrescriptionItem.productId.name}</p>
              <p className="product-category">{currentPrescriptionItem.productId.category.name}</p>
              <div className="prescription-notice">
                <i className="fas fa-info-circle"></i>
                <span>Sản phẩm này yêu cầu đơn thuốc từ bác sĩ</span>
              </div>
            </div>

            <div className="upload-area">
              <div className="upload-box">
                <i className="fas fa-cloud-upload-alt"></i>
                <h4>Kéo thả hoặc click để tải lên</h4>
                <p>Hỗ trợ định dạng JPG, PNG, PDF (tối đa 10MB)</p>
                <input type="file" accept="image/*,.pdf" className="file-input" />
              </div>
            </div>

            <div className="prescription-guidelines">
              <h4>
                <i className="fas fa-clipboard-check"></i>
                Yêu cầu đơn thuốc hợp lệ:
              </h4>
              <ul>
                <li>
                  <i className="fas fa-check-circle"></i>
                  Đầy đủ thông tin bác sĩ kê đơn
                </li>
                <li>
                  <i className="fas fa-check-circle"></i>
                  Tên thuốc phù hợp với sản phẩm
                </li>
                <li>
                  <i className="fas fa-check-circle"></i>
                  Liều lượng và hướng dẫn sử dụng
                </li>
                <li>
                  <i className="fas fa-check-circle"></i>
                  Ngày kê đơn không quá 30 ngày
                </li>
              </ul>
            </div>
          </div>

          <div className="modal-footer">
            <button 
              className="cancel-btn"
              onClick={() => setShowPrescriptionModal(false)}
            >
              Hủy
            </button>
            <button className="upload-btn">
              <i className="fas fa-upload"></i>
              Tải lên đơn thuốc
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="cart-container">
      {/* Header */}
      <div className="cart-header">
        <div className="container">
          <div className="header-content">
            <h1>
              <i className="fas fa-shopping-cart"></i>
              Giỏ hàng của tôi
            </h1>
            <p className="header-subtitle">
              {state.items.length} sản phẩm đang chờ thanh toán
            </p>
          </div>
        </div>
      </div>

      <div className="container main-content">
        {loading ? (
          <div className="container main-content">
            <div className="cart-loading">
              <i className="fas fa-spinner fa-spin"></i>
              <p>Đang tải giỏ hàng...</p>
            </div>
          </div>
        ) : (
        <>
        {state.items.length > 0 ? (
          <div className="cart-layout">
            {/* Main Cart Content */}
            <div className="cart-main">
              {/* Select All Bar */}
              <div className="cart-toolbar">
                <label className="checkbox-container">
                  <input
                    type="checkbox"
                    checked={selectedItems.length === state.items.length}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                  />
                  <span className="checkmark"></span>
                  Chọn tất cả ({state.items.length} sản phẩm)
                </label>
                
                <button 
                  className="remove-selected-btn"
                  onClick={() => {
                    if (selectedItems.length > 0) {
                      // setCartItems(prev => prev.filter(item => !selectedItems.includes(item.id)));
                      setSelectedItems([]);
                    }
                  }}
                  disabled={selectedItems.length === 0}
                >
                  <i className="fas fa-trash-alt"></i>
                  Xóa đã chọn
                </button>
              </div>

              {/* Cart Items */}
              <div className="cart-items">
                {state && state.items.map(item => (
                  <div key={item._id} className="cart-item">
                    <div className="item-select">
                      <label className="checkbox-container">
                        <input
                          type="checkbox"
                          checked={selectedItems.includes(item._id)}
                          onChange={(e) => handleSelectItem(item._id, e.target.checked)}
                        />
                        <span className="checkmark"></span>
                      </label>
                    </div>

                    <div className="item-image">
                      <img src={item.productId.images[0]} alt={item.productId.name} />
                      {item.productId.discount && (
                        <span className="discount-badge">-{item.productId.discount}%</span>
                      )}
                    </div>

                    <div className="item-details">
                      <div className="item-header">
                        <h3 className="item-name">{item.productId.name}</h3>
                        <span className="item-category">
                          <i className="fas fa-tag"></i>
                          {item.productId.category.name}
                        </span>
                      </div>

                      <div className="item-price-info">
                        {item.productId.discount ? (
                          <>
                            <span className="current-price">
                              {formatPrice(item.productId.price * (100-item.productId.discount)/100)}
                            </span>
                            <span className="original-price">
                              {formatPrice(item.productId.price)}
                            </span>
                            <span className="discount-info">
                              Tiết kiệm {formatPrice(item.productId.price - (item.productId.price * (100-item.productId.discount)/100))}
                            </span>
                          </>
                        ) : (
                          <span className="current-price">
                            {formatPrice(item.productId.price)}
                          </span>
                        )}
                      </div>

                      {item.productId.prescriptionRequired && (
                        <div className="prescription-status">
                          {item.productId.hasPrescription ? (
                            <span className="status success">
                              <i className="fas fa-check-circle"></i>
                              Đã có đơn thuốc
                            </span>
                          ) : (
                            <span className="status warning">
                              <i className="fas fa-exclamation-triangle"></i>
                              Yêu cầu đơn thuốc
                              <button 
                                className="upload-prescription-btn"
                                onClick={() => handleUploadPrescription(item)}
                              >
                                Tải lên ngay
                              </button>
                            </span>
                          )}
                        </div>
                      )}

                      <div className="item-quantity">
                        <span className="quantity-label">Số lượng:</span>
                        <div className="quantity-controls">
                          <button 
                            className="quantity-btn"
                            onClick={() => handleQuantityChange(item._id, -1)}
                            disabled={item.quantity <= 1}
                          >
                            <i className="fas fa-minus"></i>
                          </button>
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => handleQuantityChange(item._id, parseInt(e.target.value) || 1)}
                            min="1"
                            max={item.productId.stock}
                          />
                          <button 
                            className="quantity-btn"
                            onClick={() => handleQuantityChange(item._id, 1)}
                            disabled={item.quantity >= item.productId.stock}
                          >
                            <i className="fas fa-plus"></i>
                          </button>
                        </div>
                        <span className="stock-info">
                          Còn {item.productId.stock} sản phẩm
                        </span>
                      </div>
                    </div>

                    <div className="item-total">
                      <span className="total-label">Tạm tính:</span>
                      <span className="total-price">
                        {formatPrice(item.productId.price * item.quantity)}
                      </span>
                    </div>

                    <div className="item-actions">
                      <button 
                        className="action-btn remove"
                        onClick={() => handleRemoveItem(item._id)}
                        title="Xóa sản phẩm"
                      >
                        <i className="fas fa-trash-alt"></i>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Shipping Address */}
            </div>

            {/* Cart Sidebar */}
            <div className="cart-sidebar">
              {/* Order Summary */}
              <div className="sidebar-card summary-card">
                <h3>
                  <i className="fas fa-file-invoice"></i>
                  Thông tin đơn hàng
                </h3>

                <div className="summary-row">
                  <span>Tạm tính ({selectedItems.length} sản phẩm):</span>
                  <span>{formatPrice(summary.subtotal)}</span>
                </div>

                {summary.discount > 0 && (
                  <div className="summary-row discount">
                    <span>
                      <i className="fas fa-tag"></i>
                      Giảm giá sản phẩm:
                    </span>
                    <span>-{formatPrice(summary.discount)}</span>
                  </div>
                )}

                {summary.couponDiscount > 0 && (
                  <div className="summary-row coupon-discount">
                    <span>
                      <i className="fas fa-ticket-alt"></i>
                      Giảm giá mã:
                    </span>
                    <span>-{formatPrice(summary.couponDiscount)}</span>
                  </div>
                )}

                <div className="summary-row">
                  <span>
                    <i className="fas fa-truck"></i>
                    Phí vận chuyển:
                  </span>
                  {summary.shippingFee === 0 ? (
                    <span className="free-shipping">Miễn phí</span>
                  ) : (
                    <span>{formatPrice(summary.shippingFee)}</span>
                  )}
                </div>

                <div className="summary-row total">
                  <span>Tổng cộng:</span>
                  <span className="total-price">{formatPrice(summary.total)}</span>
                </div>

                {summary.savedAmount > 0 && (
                  <div className="saved-amount">
                    <i className="fas fa-smile"></i>
                    Bạn đã tiết kiệm {formatPrice(summary.savedAmount)}
                  </div>
                )}

                <div className="shipping-notice">
                  <i className="fas fa-info-circle"></i>
                  <span>
                    {summary.subtotal >= 500000 
                      ? '🎉 Đơn hàng của bạn đủ điều kiện miễn phí vận chuyển!' 
                      : `Mua thêm ${formatPrice(500000 - summary.subtotal)} để được miễn phí vận chuyển`}
                  </span>
                </div>
              </div>

              {/* Checkout Button */}
              <div className="checkout-card">
                <div className="total-preview">
                  <span>Tổng thanh toán:</span>
                  <span className="total-amount">{formatPrice(summary.total)}</span>
                </div>

                <button 
                  className="checkout-btn"
                  onClick={handleCheckout}
                  disabled={selectedItems.length === 0 || isCheckingOut}
                >
                  {isCheckingOut ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i>
                      Đang xử lý...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-check-circle"></i>
                      Thanh toán
                    </>
                  )}
                </button>

                <p className="checkout-policy">
                  Bằng việc tiến hành đặt hàng, bạn đồng ý với 
                  <button className="policy-link">Điều khoản sử dụng</button> và 
                  <button className="policy-link">Chính sách đổi trả</button> của chúng tôi.
                </p>
              </div>
            </div>
          </div>
        ) : (
          !user ? (
          <div className="empty-cart">
            <div className="empty-cart-icon">
              <i className="fas fa-shopping-cart"></i>
            </div>
            <h2>Vui lòng đăng nhập để xem giỏ hàng</h2>
          
          </div>
          ):(
          <div className="empty-cart">
            <div className="empty-cart-icon">
              <i className="fas fa-shopping-cart"></i>
            </div>
            <h2>Giỏ hàng của bạn đang trống</h2>
            <p>Hãy khám phá các sản phẩm thuốc và thiết bị y tế tại MediCare</p>
            <div className="empty-cart-actions">
              <button 
                className="continue-shopping-btn"
                onClick={() => navigate('/products')}
              >
                <i className="fas fa-arrow-left"></i>
                Tiếp tục mua sắm
              </button>
              <button 
                className="view-prescription-btn"
                onClick={() => navigate('/prescription')}
              >
                <i className="fas fa-prescription"></i>
                Tải đơn thuốc lên
              </button>
            </div>
          </div>
          )
        )}
        </>  
      )}
      </div>

      {/* Prescription Modal */}
      {renderPrescriptionModal()}

      {/* Recently Viewed */}
      {/* {loading && state.items.length === 0 && (
        <div className="recently-viewed">
          <div className="container">
            <h3 className="recently-title">
              <i className="fas fa-history"></i>
              Sản phẩm đã xem gần đây
            </h3>
            <div className="recently-grid">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="recently-card">
                  <img 
                    src="https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=150&h=150&fit=crop" 
                    alt="Product"
                  />
                  <div className="recently-info">
                    <h4>Paracetamol 500mg</h4>
                    <span className="recently-price">25.000₫</span>
                    <button className="recently-add-btn">
                      <i className="fas fa-cart-plus"></i>
                      Thêm vào giỏ
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )} */}
    </div>
  );
};

export default Cart;