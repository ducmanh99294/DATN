import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../assets/checkout.css';
import { useCart } from '../context/CartContext';
import { createOrder } from '../api/orderApi';
import { useNotify } from '../hooks/useNotification';
import { getPaymentUrl } from '../api/paymentApi';

export interface Address {
  _id: string;
  fullName: string;
  phone: string;
  address: string;
  district: string;
  ward: string;
  isDefault: boolean;
}

interface PaymentMethod {
  id: string;
  name: string;
  icon: string;
  description: string;
  fee?: number;
  isActive: boolean;
}

interface DeliveryOption {
  id: string;
  name: string;
  description: string;
  fee: number;
  estimatedDays: string;
  icon: string;
}

interface Voucher {
  id: string;
  code: string;
  name: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrder?: number;
  maxDiscount?: number;
  expiryDate: string;
}

interface OrderSummary {
  subtotal: number;
  productDiscount: number;
  voucherDiscount: number;
  deliveryFee: number;
  total: number;
  savedAmount: number;
}

interface OrderNote {
  type: string;
  content: string;
}

const Checkout = () => {
  const navigate = useNavigate();
  const {state} = useCart();
  const [currentStep, setCurrentStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const notify = useNotify();
  // Addresses
  const [addresses, setAddresses] = useState<Address[]>([]);

  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [newAddress, setNewAddress] = useState<Partial<Address>>({
    fullName: '',
    phone: '',
    address: '',
    district: '',
    ward: '',
  });

  // Payment methods
  const [paymentMethods] = useState<PaymentMethod[]>([
    {
      id: 'cod',
      name: 'Thanh toán khi nhận hàng',
      icon: 'fas fa-money-bill-wave',
      description: 'Chỉ thanh toán khi nhận được hàng',
      isActive: true
    },
    {
      id: 'bank',
      name: 'Chuyển khoản ngân hàng',
      icon: 'fas fa-university',
      description: 'Thanh toán qua tài khoản ngân hàng',
      isActive: true
    },
    {
      id: 'momo',
      name: 'Ví MoMo',
      icon: 'fas fa-mobile-alt',
      description: 'Thanh toán nhanh chóng qua ví điện tử',
      isActive: true
    },
    {
      id: 'vnpay',
      name: 'VNPAY',
      icon: 'fas fa-shield-alt',
      description: 'Thanh toán qua VNPAY, Internet Banking',
      isActive: true
    },
    {
      id: 'zalopay',
      name: 'ZaloPay',
      icon: 'fas fa-comment',
      description: 'Thanh toán qua ví ZaloPay',
      isActive: true
    }
  ]);

  const [selectedPayment, setSelectedPayment] = useState<string>('cod');

  // Delivery options
  const [deliveryOptions] = useState<DeliveryOption[]>([
    {
      id: 'standard',
      name: 'Giao hàng tiêu chuẩn',
      description: 'Giao hàng trong 3-5 ngày làm việc',
      fee: 30000,
      estimatedDays: '3-5 ngày',
      icon: 'fas fa-truck'
    },
    {
      id: 'express',
      name: 'Giao hàng nhanh',
      description: 'Giao hàng trong 1-2 ngày làm việc',
      fee: 50000,
      estimatedDays: '1-2 ngày',
      icon: 'fas fa-rocket'
    },
    {
      id: 'instant',
      name: 'Giao hàng hỏa tốc',
      description: 'Giao hàng trong vòng 4 giờ (nội thành)',
      fee: 80000,
      estimatedDays: '2-4 giờ',
      icon: 'fas fa-bolt'
    }
  ]);

  const [selectedDelivery, setSelectedDelivery] = useState<string>('standard');

  // Vouchers
  const [availableVouchers] = useState<Voucher[]>([
    {
      id: 'v1',
      code: 'MEDICARE10',
      name: 'Giảm 10% đơn hàng',
      discountType: 'percentage',
      discountValue: 10,
      minOrder: 200000,
      maxDiscount: 50000,
      expiryDate: '31/12/2024'
    },
    {
      id: 'v2',
      code: 'WELCOME20',
      name: 'Giảm 20% đơn hàng đầu tiên',
      discountType: 'percentage',
      discountValue: 20,
      minOrder: 300000,
      maxDiscount: 100000,
      expiryDate: '31/12/2024'
    },
    {
      id: 'v3',
      code: 'FREESHIP',
      name: 'Miễn phí vận chuyển',
      discountType: 'fixed',
      discountValue: 30000,
      expiryDate: '31/12/2024'
    }
  ]);

  const [appliedVoucher, setAppliedVoucher] = useState<Voucher | null>(null);

  // Order note
  const [orderNote, setOrderNote] = useState('');
  const [orderNotes, setOrderNotes] = useState<OrderNote[]>([
    { type: 'delivery', content: 'Gọi điện trước khi giao hàng' },
    { type: 'time', content: 'Giao hàng trong giờ hành chính' }
  ]);

  // Invoice info
  const [needInvoice, setNeedInvoice] = useState(false);
  const [invoiceInfo, setInvoiceInfo] = useState({
    companyName: '',
    taxCode: '',
    address: '',
    email: ''
  });

  // Order summary
  const [summary, setSummary] = useState<OrderSummary>({
    subtotal: 0,
    productDiscount: 0,
    voucherDiscount: 0,
    deliveryFee: 30000,
    total: 0,
    savedAmount: 0
  });

  // Steps
  const steps = [
    { id: 1, name: 'Thông tin giao hàng', icon: 'fas fa-map-marker-alt' },
    { id: 2, name: 'Phương thức thanh toán', icon: 'fas fa-credit-card' },
    { id: 3, name: 'Xác nhận đơn hàng', icon: 'fas fa-check-circle' },
  ];

  // Initialize
  useEffect(() => {
    // Set default address
    const defaultAddress = addresses.find(addr => addr.isDefault);
    setSelectedAddress(defaultAddress || addresses[0]);

    // Calculate initial summary
    calculateSummary();
  }, []);

  // Calculate summary when dependencies change
  useEffect(() => {
    calculateSummary();
  }, [state, appliedVoucher, selectedDelivery]);

  // Calculate order summary
  const calculateSummary = () => {
    const subtotal = state.items.reduce((sum, item) => sum + (item.productId.price * item.quantity), 0);
    
    const productDiscount = state.items.reduce((sum, item) => {
      if (item.productId.discount) {
        return sum + ((item.productId.price - (item.productId.price * (100-item.productId.discount)/100)) * item.quantity);
      }
      return sum;
    }, 0);

    let voucherDiscount = 0;
    if (appliedVoucher) {
      if (appliedVoucher.discountType === 'percentage') {
        voucherDiscount = subtotal * (appliedVoucher.discountValue / 100);
        if (appliedVoucher.maxDiscount) {
          voucherDiscount = Math.min(voucherDiscount, appliedVoucher.maxDiscount);
        }
      } else {
        voucherDiscount = appliedVoucher.discountValue;
      }
    }

    const deliveryFee = deliveryOptions.find(d => d.id === selectedDelivery)?.fee || 0;
    const total = subtotal - voucherDiscount + deliveryFee;
    const savedAmount = productDiscount + voucherDiscount;

    setSummary({
      subtotal,
      productDiscount,
      voucherDiscount,
      deliveryFee,
      total,
      savedAmount
    });
  };

  // Add new address
  const handleAddAddress = () => {
    if (!newAddress.fullName || !newAddress.phone || !newAddress.address) {
      notify.warning('Vui lòng điền đầy đủ thông tin','thông báo');
      return;
    }

    const address: Address = {
      _id: `addr_${Date.now()}`,
      fullName: newAddress.fullName,
      phone: newAddress.phone,
      address: newAddress.address,
      district: newAddress.district || '',
      ward: newAddress.ward || '',
      isDefault: addresses.length === 0,
    };

    setAddresses([...addresses, address]);
    setSelectedAddress(address);
    setShowAddressForm(false);
    setNewAddress({
      fullName: '',
      phone: '',
      address: '',
      district: '',
      ward: '',
    });
  };

  const handlePayment = async () => {
    try {
      setIsProcessing(true);

      if (selectedPayment !== "vnpay") {
        const res = await createOrder(
          selectedAddress,
          orderNote,
          selectedPayment
        );

        if (!res) {
          throw new Error("Tạo đơn hàng thất bại");
        }

        const orderId = res.orderCode || res._id
        setOrderSuccess(true);
        navigate(`/checkout/success/${orderId}`);

        notify.success(
          `Đặt hàng thành công! Mã đơn hàng: ${res.orderCode || res._id}`
        );

        return;
      }

      //VNPay
      const res = await getPaymentUrl({
        type: "medicine",
        amount: summary.total,
        metadata: {
          shippingAddress: selectedAddress,
          note: orderNote,
          items: state,
        },
      });

      if (!res?.paymentUrl) {
        throw new Error("Không tạo được link thanh toán");
      }

      // 👉 redirect VNPay
      window.location.href = res.paymentUrl;
  
      if(res.ok) {
        notify.success('tạo đơn hàng thành công','thông báo')
      }

    } catch (error) {
      console.error("Payment error:", error);
      notify.error("Có lỗi xảy ra khi thanh toán");
    } finally {
      setIsProcessing(false);
    }
  };

  // Go to next step
  const handleNextStep = () => {
    if (currentStep === 1 && !selectedAddress) {
      notify.warning('Vui lòng chọn địa chỉ giao hàng','thông báo');
      return;
    }

    if (currentStep === 2 && !selectedPayment) {
      notify.warning('Vui lòng chọn phương thức thanh toán','thông báo');
      return;
    }

    setCurrentStep(currentStep + 1);
    window.scrollTo(0, 0);
  };

  // Go to previous step
  const handlePrevStep = () => {
    setCurrentStep(currentStep - 1);
    window.scrollTo(0, 0);
  };

  // Format price
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN').format(price) + '₫';
  };

  // Render step 1: Shipping Information
  const renderShippingStep = () => (
    <div className="checkout-step">
      <div className="step-header">
        <h3>
          <i className="fas fa-map-marker-alt"></i>
          Thông tin giao hàng
        </h3>
      </div>

      <div className="address-section">
          <div className="address-form">
            <h4>Nhập địa chỉ</h4>
            
            <div className="form-row">
              <div className="form-group">
                <label>Họ tên người nhận *</label>
                <input
                  type="text"
                  placeholder="Nhập họ tên"
                  value={newAddress.fullName}
                  onChange={(e) => setNewAddress({...newAddress, fullName: e.target.value})}
                />
              </div>
              
              <div className="form-group">
                <label>Số điện thoại *</label>
                <input
                  type="tel"
                  placeholder="Nhập số điện thoại"
                  value={newAddress.phone}
                  onChange={(e) => setNewAddress({...newAddress, phone: e.target.value})}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Quận/Huyện *</label>
                <input
                  type="text"
                  placeholder="Nhập quận/huyện"
                  value={newAddress.district}
                  onChange={(e) => setNewAddress({...newAddress, district: e.target.value})}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Phường/Xã *</label>
                <input
                  type="text"
                  placeholder="Nhập phường/xã"
                  value={newAddress.ward}
                  onChange={(e) => setNewAddress({...newAddress, ward: e.target.value})}
                />
              </div>
            </div>

            <div className="form-group full-width">
              <label>Địa chỉ chi tiết *</label>
              <input
                type="text"
                placeholder="Số nhà, tên đường, tòa nhà..."
                value={newAddress.address}
                onChange={(e) => setNewAddress({...newAddress, address: e.target.value})}
              />
            </div>

            <div className="form-actions">
              {/* <button 
                className="cancel-btn"
                onClick={() => setShowAddressForm(false)}
              >
                Hủy
              </button> */}
              <button 
                className="save-btn"
                onClick={handleAddAddress}
              >
                <i className="fas fa-save"></i>
                Xác nhận địa chỉ
              </button>
            </div>
          </div>
      </div>

      <div className="delivery-section">
        <h4>
          <i className="fas fa-truck"></i>
          Phương thức vận chuyển
        </h4>

        <div className="delivery-options">
          {deliveryOptions.map(option => (
            <div 
              key={option.id}
              className={`delivery-option ${selectedDelivery === option.id ? 'selected' : ''}`}
              onClick={() => setSelectedDelivery(option.id)}
            >
              <div className="delivery-radio">
                <span className={`radio-indicator ${selectedDelivery === option.id ? 'checked' : ''}`}>
                  {selectedDelivery === option.id && <i className="fas fa-check"></i>}
                </span>
              </div>
              
              <div className="delivery-icon">
                <i className={option.icon}></i>
              </div>
              
              <div className="delivery-info">
                <div className="delivery-name">{option.name}</div>
                <div className="delivery-desc">{option.description}</div>
                <div className="delivery-time">
                  <i className="fas fa-clock"></i>
                  {option.estimatedDays}
                </div>
              </div>
              
              <div className="delivery-fee">
                {option.fee === 0 ? (
                  <span className="free-shipping">Miễn phí</span>
                ) : (
                  <span>{formatPrice(option.fee)}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="order-notes">
        <h4>
          <i className="fas fa-pencil-alt"></i>
          Ghi chú đơn hàng
        </h4>
        
        <div className="note-input">
          <textarea
            placeholder="Nhập ghi chú cho đơn hàng (thời gian giao hàng mong muốn, lưu ý cho người giao...)"
            value={orderNote}
            onChange={(e) => setOrderNote(e.target.value)}
            rows={3}
          />
        </div>

        <div className="quick-notes">
          {orderNotes.map((note, index) => (
            <button 
              key={index}
              className="quick-note-btn"
              onClick={() => setOrderNote(note.content)}
            >
              <i className="fas fa-plus"></i>
              {note.content}
            </button>
          ))}
        </div>
      </div>

      <div className="step-actions">
        <button 
          className="back-btn"
          onClick={() => navigate('/cart')}
        >
          <i className="fas fa-arrow-left"></i>
          Quay lại giỏ hàng
        </button>
        
        <button 
          className="next-btn"
          onClick={handleNextStep}
        >
          Tiếp tục
          <i className="fas fa-arrow-right"></i>
        </button>
      </div>
    </div>
  );

  // Render step 2: Payment Method
  const renderPaymentStep = () => (
    <div className="checkout-step">
      <div className="step-header">
        <h3>
          <i className="fas fa-credit-card"></i>
          Phương thức thanh toán
        </h3>
      </div>

      <div className="payment-section">
        <div className="payment-methods">
          {paymentMethods.map(method => (
            <div 
              key={method.id}
              className={`payment-method ${selectedPayment === method.id ? 'selected' : ''}`}
              onClick={() => setSelectedPayment(method.id)}
            >
              <div className="payment-radio">
                <span className={`radio-indicator ${selectedPayment === method.id ? 'checked' : ''}`}>
                  {selectedPayment === method.id && <i className="fas fa-check"></i>}
                </span>
              </div>
              
              <div className="payment-icon">
                <i className={method.icon}></i>
              </div>
              
              <div className="payment-info">
                <div className="payment-name">{method.name}</div>
                <div className="payment-desc">{method.description}</div>
              </div>

              {method.fee && method.fee > 0 && (
                <div className="payment-fee">
                  Phí: {formatPrice(method.fee)}
                </div>
              )}
            </div>
          ))}
        </div>

        {selectedPayment === 'bank' && (
          <div className="bank-transfer-info">
            <h5>Thông tin chuyển khoản</h5>
            <div className="bank-details">
              <div className="bank-row">
                <span className="label">Ngân hàng:</span>
                <span className="value">Vietcombank - CN TP.HCM</span>
              </div>
              <div className="bank-row">
                <span className="label">Số tài khoản:</span>
                <span className="value">1234 5678 9012 3456</span>
              </div>
              <div className="bank-row">
                <span className="label">Chủ tài khoản:</span>
                <span className="value">MEDICARE HEALTHCARE</span>
              </div>
              <div className="bank-row">
                <span className="label">Nội dung:</span>
                <span className="value">TT {orderId || 'DH' + Date.now()}</span>
              </div>
            </div>
            <div className="bank-note">
              <i className="fas fa-info-circle"></i>
              Đơn hàng sẽ được xác nhận sau khi chúng tôi nhận được thanh toán
            </div>
          </div>
        )}

        {selectedPayment === 'momo' && (
          <div className="ewallet-info">
            <img 
              src="https://developers.momo.vn/v3/img/momo-icon.png" 
              alt="MoMo" 
              className="ewallet-logo"
            />
            <p>Quét mã QR hoặc đăng nhập MoMo để thanh toán</p>
            <div className="qr-code">
              <div className="qr-placeholder">
                <i className="fas fa-qrcode"></i>
              </div>
            </div>
          </div>
        )}

        {selectedPayment === 'vnpay'}
      </div>

      <div className="invoice-section">
        <h4>
          <i className="fas fa-file-invoice"></i>
          Hóa đơn VAT
        </h4>

        <div className="invoice-option">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={needInvoice}
              onChange={(e) => setNeedInvoice(e.target.checked)}
            />
            <span className="checkbox-text">
              Tôi cần xuất hóa đơn VAT
            </span>
          </label>
        </div>

        {needInvoice && (
          <div className="invoice-form">
            <div className="form-group">
              <label>Tên công ty *</label>
              <input
                type="text"
                placeholder="Nhập tên công ty"
                value={invoiceInfo.companyName}
                onChange={(e) => setInvoiceInfo({...invoiceInfo, companyName: e.target.value})}
              />
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>Mã số thuế *</label>
                <input
                  type="text"
                  placeholder="Nhập mã số thuế"
                  value={invoiceInfo.taxCode}
                  onChange={(e) => setInvoiceInfo({...invoiceInfo, taxCode: e.target.value})}
                />
              </div>
              
              <div className="form-group">
                <label>Email nhận hóa đơn *</label>
                <input
                  type="email"
                  placeholder="example@company.com"
                  value={invoiceInfo.email}
                  onChange={(e) => setInvoiceInfo({...invoiceInfo, email: e.target.value})}
                />
              </div>
            </div>
            
            <div className="form-group">
              <label>Địa chỉ công ty *</label>
              <input
                type="text"
                placeholder="Nhập địa chỉ công ty"
                value={invoiceInfo.address}
                onChange={(e) => setInvoiceInfo({...invoiceInfo, address: e.target.value})}
              />
            </div>
          </div>
        )}
      </div>

      <div className="step-actions">
        <button 
          className="back-btn"
          onClick={handlePrevStep}
        >
          <i className="fas fa-arrow-left"></i>
          Quay lại
        </button>
        
        <button 
          className="next-btn"
          onClick={handleNextStep}
        >
          Xác nhận đơn hàng
          <i className="fas fa-arrow-right"></i>
        </button>
      </div>
    </div>
  );

  // Render step 3: Order Confirmation
  const renderConfirmationStep = () => (
    <div className="checkout-step">
      <div className="step-header">
        <h3>
          <i className="fas fa-check-circle"></i>
          Xác nhận đơn hàng
        </h3>
        <p>Vui lòng kiểm tra kỹ thông tin đơn hàng trước khi thanh toán</p>
      </div>

      <div className="confirmation-section">
        <div className="confirmation-card">
          <div className="card-header">
            <h4>
              <i className="fas fa-map-marker-alt"></i>
              Địa chỉ nhận hàng
            </h4>
            <button className="edit-link" onClick={handlePrevStep}>
              <i className="fas fa-edit"></i>
              Sửa
            </button>
          </div>
          
          <div className="card-content">
            {selectedAddress && (
              <>
                <div className="address-header">
                  <span className="name">{selectedAddress.fullName}</span>
                  <span className="phone">{selectedAddress.phone}</span>
                </div>
                <p className="address">
                  {selectedAddress.address}, {selectedAddress.ward}, 
                  {selectedAddress.district}
                </p>
              </>
            )}
          </div>
        </div>

        <div className="confirmation-card">
          <div className="card-header">
            <h4>
              <i className="fas fa-truck"></i>
              Phương thức vận chuyển
            </h4>
            <button className="edit-link" onClick={handlePrevStep}>
              <i className="fas fa-edit"></i>
              Sửa
            </button>
          </div>
          
          <div className="card-content">
            {deliveryOptions.find(d => d.id === selectedDelivery) && (
              <div className="delivery-info">
                <div className="delivery-name">
                  {deliveryOptions.find(d => d.id === selectedDelivery)?.name}
                </div>
                <div className="delivery-time">
                  <i className="fas fa-clock"></i>
                  {deliveryOptions.find(d => d.id === selectedDelivery)?.estimatedDays}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="confirmation-card">
          <div className="card-header">
            <h4>
              <i className="fas fa-credit-card"></i>
              Phương thức thanh toán
            </h4>
            <button className="edit-link" onClick={handlePrevStep}>
              <i className="fas fa-edit"></i>
              Sửa
            </button>
          </div>
          
          <div className="card-content">
            {paymentMethods.find(m => m.id === selectedPayment) && (
              <div className="payment-info">
                <div className="payment-icon">
                  <i className={paymentMethods.find(m => m.id === selectedPayment)?.icon}></i>
                </div>
                <div className="payment-name">
                  {paymentMethods.find(m => m.id === selectedPayment)?.name}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="confirmation-card">
          <div className="card-header">
            <h4>
              <i className="fas fa-shopping-bag"></i>
              Sản phẩm đã chọn
            </h4>
          </div>
          
          <div className="card-content">
            <div className="order-items">
              {state.items.map(item => (
                <div key={item._id} className="order-item">
                  <div className="item-image">
                    <img src={item.productId.images[0]} alt={item.productId.name} />
                    <span className="item-quantity">x{item.quantity}</span>
                  </div>
                  <div className="item-info">
                    <div className="item-name">{item.productId.name}</div>
                    <div className="item-category">{item.productId.category.name}</div>
                  </div>
                  <div className="item-price">
                    {formatPrice(item.productId.price * item.quantity)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {orderNote && (
          <div className="confirmation-card">
            <div className="card-header">
              <h4>
                <i className="fas fa-pencil-alt"></i>
                Ghi chú đơn hàng
              </h4>
            </div>
            <div className="card-content">
              <p className="order-note">{orderNote}</p>
            </div>
          </div>
        )}

        {needInvoice && (
          <div className="confirmation-card">
            <div className="card-header">
              <h4>
                <i className="fas fa-file-invoice"></i>
                Thông tin xuất hóa đơn
              </h4>
            </div>
            <div className="card-content">
              <div className="invoice-details">
                <p><strong>Công ty:</strong> {invoiceInfo.companyName}</p>
                <p><strong>Mã số thuế:</strong> {invoiceInfo.taxCode}</p>
                <p><strong>Địa chỉ:</strong> {invoiceInfo.address}</p>
                <p><strong>Email:</strong> {invoiceInfo.email}</p>
              </div>
            </div>
          </div>
        )}

        <div className="order-summary-card">
          <h4>Tổng kết đơn hàng</h4>
          
          <div className="summary-row">
            <span>Tạm tính:</span>
            <span>{formatPrice(summary.subtotal)}</span>
          </div>
          
          {summary.productDiscount > 0 && (
            <div className="summary-row discount">
              <span>Giảm giá sản phẩm:</span>
              <span>-{formatPrice(summary.productDiscount)}</span>
            </div>
          )}
          
          {summary.voucherDiscount > 0 && (
            <div className="summary-row voucher">
              <span>Mã giảm giá:</span>
              <span>-{formatPrice(summary.voucherDiscount)}</span>
            </div>
          )}
          
          <div className="summary-row">
            <span>Phí vận chuyển:</span>
            {summary.deliveryFee === 0 ? (
              <span className="free">Miễn phí</span>
            ) : (
              <span>{formatPrice(summary.deliveryFee)}</span>
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
        </div>

        <div className="terms-agreement">
          <label className="checkbox-label">
            <input type="checkbox" defaultChecked />
            <span className="checkbox-text">
              Tôi đồng ý với <button className="terms-link">Điều khoản sử dụng</button> và 
              <button className="terms-link">Chính sách đổi trả</button> của MediCare
            </span>
          </label>
        </div>
      </div>

      <div className="step-actions">
        <button 
          className="back-btn"
          onClick={handlePrevStep}
        >
          <i className="fas fa-arrow-left"></i>
          Quay lại
        </button>
        
        <button 
          className="payment-btn"
          onClick={handlePayment}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <>
              <i className="fas fa-spinner fa-spin"></i>
              Đang xử lý...
            </>
          ) : (
            <>
              <i className="fas fa-lock"></i>
              Thanh toán {formatPrice(summary.total)}
            </>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <div className="checkout-container">
      {/* Header */}
      <div className="checkout-header">
        <div className="container">
          <div className="header-content">
            <h1>
              <i className="fas fa-shopping-cart"></i>
              Thanh toán
            </h1>
          </div>
        </div>
      </div>

      <div className="container">
        {/* Progress Steps */}
        <div className="checkout-progress">
          {steps.map((step, index) => (
            <div 
              key={step.id}
              className={`progress-step ${currentStep >= step.id ? 'active' : ''}`}
            >
              <div className="step-indicator">
                <i className={step.icon}></i>
              </div>
              <div className="step-info">
                <span className="step-number">Bước {step.id}</span>
                <span className="step-name">{step.name}</span>
              </div>
              {index < steps.length - 1 && (
                <div className="step-connector"></div>
              )}
            </div>
          ))}
        </div>

        <div className="checkout-layout">
          {/* Main Content */}
          <div className="checkout-main">
            {currentStep === 1 && renderShippingStep()}
            {currentStep === 2 && renderPaymentStep()}
            {currentStep === 3 && renderConfirmationStep()}
          </div>

          {/* Order Summary Sidebar */}
          {currentStep < 4 && (
            <div className="checkout-sidebar">
              <div className="sidebar-card">
                <h3>
                  <i className="fas fa-shopping-bag"></i>
                  Đơn hàng ({state.items.length} sản phẩm)
                </h3>

                <div className="order-preview">
                  {state.items.map(item => (
                    <div key={item._id} className="preview-item">
                      <div className="preview-image">
                        <img src={item.productId.images[0]} alt={item.productId.name} />
                        <span className="preview-quantity">{item.quantity}</span>
                      </div>
                      <div className="preview-info">
                        <div className="preview-name">{item.productId.name}</div>
                        <div className="preview-price">
                          {formatPrice(item.productId.price * item.quantity)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="sidebar-divider"></div>

                <div className="sidebar-summary">
                  <div className="summary-item">
                    <span>Tạm tính:</span>
                    <span>{formatPrice(summary.subtotal)}</span>
                  </div>
                  
                  {summary.voucherDiscount > 0 && (
                    <div className="summary-item discount">
                      <span>Giảm giá:</span>
                      <span>-{formatPrice(summary.voucherDiscount)}</span>
                    </div>
                  )}
                  
                  <div className="summary-item">
                    <span>Phí vận chuyển:</span>
                    {summary.deliveryFee === 0 ? (
                      <span className="free">Miễn phí</span>
                    ) : (
                      <span>{formatPrice(summary.deliveryFee)}</span>
                    )}
                  </div>

                  <div className="summary-item total">
                    <span>Tổng cộng:</span>
                    <span className="total-price">{formatPrice(summary.total)}</span>
                  </div>
                </div>

                <div className="security-badge">
                  <i className="fas fa-shield-alt"></i>
                  <div className="badge-text">
                    <strong>Thanh toán an toàn</strong>
                    <p>Thông tin của bạn được bảo mật tuyệt đối</p>
                  </div>
                </div>
              </div>

              <div className="sidebar-card">
                <h4>
                  <i className="fas fa-truck"></i>
                  Chính sách vận chuyển
                </h4>
                <ul className="policy-list">
                  <li>
                    <i className="fas fa-check"></i>
                    Miễn phí vận chuyển cho đơn hàng từ 500.000₫
                  </li>
                  <li>
                    <i className="fas fa-check"></i>
                    Giao hàng toàn quốc, COD mọi tỉnh thành
                  </li>
                  <li>
                    <i className="fas fa-check"></i>
                    Kiểm tra hàng trước khi thanh toán
                  </li>
                  <li>
                    <i className="fas fa-check"></i>
                    Đổi trả miễn phí trong 7 ngày
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Checkout;