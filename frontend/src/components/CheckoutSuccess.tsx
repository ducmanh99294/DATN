import { useNavigate, useParams } from 'react-router-dom';
import { useNotify } from '../hooks/useNotification';
import '../assets/checkoutSuccess.css';
import { getOrderById } from '../api/orderApi';
import { useEffect, useState } from 'react';
import { useAuthContext } from '../context/AuthContext';

const CheckoutSuccess = () => {
  // Lấy các tham số VNPay trả về trên URL (nếu muốn hiển thị)
  const notify = useNotify();
  const navigate = useNavigate();
  const { orderId } = useParams();
  const [order, setOrder] = useState<any>()
  const user = useAuthContext();
    // Navigate to order detail
  const handleViewOrder = () => {
    navigate(`/orders/${orderId}`);
  };                          

  // Continue shopping
  const handleContinueShopping = () => {
    navigate('/products');
  };

  useEffect(() =>{
    if(!user){
       notify.warning("vui lòng đăng nhập", "Thông báo") 
       return;
    }
    fetchOrderDetail()
  }, [user])
  
  const fetchOrderDetail = async () => {
    if(!orderId) {
        notify.error("Có lỗi xảy ra vui lòng thử lại", 'thông báo')
        return;
    }
    try {
        const data = await getOrderById(orderId)
        setOrder(data)
    } catch (e) {
        notify.error("Có lỗi xảy ra vui lòng thử lại", 'thông báo')
        console.log(e)
    }
  };

  console.log(order)
  return (
    <div className="checkout-success-wrapper">
    
    <div className="checkout-step success-step">
      <div className="success-animation">
        <div className="success-icon">
          <i className="fas fa-check-circle"></i>
        </div>
      </div>

      <h2>Đặt hàng thành công!</h2>
      
      <div className="success-message">
        <p>Cảm ơn bạn đã mua sắm tại MediCare.</p>
        <p>Mã đơn hàng của bạn: <strong>{orderId}</strong></p>
        <p>Chúng tôi sẽ gửi email xác nhận và thông tin vận chuyển trong vài phút nữa.</p>
      </div>

      <div className="order-timeline">
        <div className="timeline-item completed">
          <div className="timeline-icon">
            <i className="fas fa-check"></i>
          </div>
          <div className="timeline-content">
            <h4>Đã tiếp nhận đơn hàng</h4>
            <p>{new Date().toLocaleString('vi-VN')}</p>
          </div>
        </div>

        <div className="timeline-item active">
          <div className="timeline-icon">
            <i className="fas fa-box"></i>
          </div>
          <div className="timeline-content">
            <h4>Đang chuẩn bị hàng</h4>
            <p>Đơn hàng đang được đóng gói</p>
          </div>
        </div>

        <div className="timeline-item">
          <div className="timeline-icon">
            <i className="fas fa-truck"></i>
          </div>
          <div className="timeline-content">
            <h4>Đang vận chuyển</h4>
            {/* <p>Dự kiến: {deliveryOptions.find(d => d.id === selectedDelivery)?.estimatedDays}</p> */}
          </div>
        </div>

        <div className="timeline-item">
          <div className="timeline-icon">
            <i className="fas fa-check-circle"></i>
          </div>
          <div className="timeline-content">
            <h4>Giao hàng thành công</h4>
            <p></p>
          </div>
        </div>
      </div>

      <div className="success-actions">
        <button 
          className="view-order-btn"
          onClick={handleViewOrder}
        >
          <i className="fas fa-file-invoice"></i>
          Xem chi tiết đơn hàng
        </button>
        
        <button 
          className="continue-shopping-btn"
          onClick={handleContinueShopping}
        >
          <i className="fas fa-shopping-bag"></i>
          Tiếp tục mua sắm
        </button>
      </div>

      <div className="tracking-info">
        <div className="qr-tracking">
          <div className="qr-placeholder small">
            <i className="fas fa-qrcode"></i>
          </div>
          <p>Quét mã QR để theo dõi đơn hàng</p>
        </div>
        
        <div className="support-info">
          <h5>Cần hỗ trợ?</h5>
          <p>
            <i className="fas fa-headset"></i>
            Hotline: <strong>1900 1234</strong>
          </p>
          <p>
            <i className="fas fa-envelope"></i>
            Email: <strong>support@medicare.com</strong>
          </p>
        </div>
      </div>
    </div>

    </div>

  );
}
  export default CheckoutSuccess;