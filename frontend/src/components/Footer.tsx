import React, { useEffect, useState } from 'react';
import '../assets/footer.css';

// Import các icon (sử dụng react-icons)
import { 
  FaFacebookF, 
  FaTwitter, 
  FaInstagram, 
  FaYoutube, 
  FaMapMarkerAlt, 
  FaPhoneAlt, 
  FaEnvelope, 
  FaClock,
  FaShieldAlt,
  FaCreditCard,
  FaTruck,
  FaHeadset,
  FaFileMedical,
  FaUserMd,
  FaPills,
  FaHeartbeat,
  FaStethoscope,
  FaHospital
} from 'react-icons/fa';
import { MdHealthAndSafety, MdLocalHospital } from 'react-icons/md';
import { getAllSpecially } from '../api/specialyApi';
import { useNavigate } from 'react-router-dom';

const Footer = () => {
  const [speciallyLoading, setSpeciallyLoading] = useState(false);
  const [specially, setSpecially] = useState<any[]>([])
  const navigate = useNavigate()
  useEffect(()=>{
      fetchSpeciatly();
      }
    ,[])
  // Current year for copyright
  const currentYear = new Date().getFullYear();

  // Xử lý đăng ký newsletter
  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const emailInput = form.querySelector('input[type="email"]') as HTMLInputElement;
    
    if (emailInput && emailInput.value) {
      alert(`Đã đăng ký nhận bản tin với email: ${emailInput.value}`);
      emailInput.value = '';
    }
  };

  // Xử lý click các liên kết nhanh
  const handleQuickLinkClick = (slug: string) => {
    navigate(`/specialty/${slug}`)
    // Ở đây bạn sẽ thêm logic điều hướng thực tế
  };

  // Xử lý click mạng xã hội
  const handleSocialClick = (platform: string) => {
    console.log(`Mở ${platform}`);
    // Ở đây bạn sẽ mở liên kết mạng xã hội
  };
  
  const fetchSpeciatly = async () => {
    try {
      setSpeciallyLoading(false)
      const data = await getAllSpecially()
      setSpecially(data)
    } catch (e) {
      console.log(e)
    } finally {
      setSpeciallyLoading(false)
    }
  }
  // Dữ liệu các khoa/phòng
  const departments = [
    { name: 'Khoa Nội tổng quát', link: '#', icon: <FaUserMd /> },
    { name: 'Khoa Nhi', link: '#', icon: <FaHeartbeat /> },
    { name: 'Khoa Sản - Phụ khoa', link: '#', icon: <MdLocalHospital /> },
    { name: 'Khoa Da liễu', link: '#', icon: <FaStethoscope /> },
    { name: 'Khoa Mắt', link: '#', icon: <FaHospital /> },
    { name: 'Khoa Răng Hàm Mặt', link: '#', icon: <FaFileMedical /> },
  ];

  // Dữ liệu dịch vụ
  const services = [
    { name: 'Khám tổng quát', link: '#' },
    { name: 'Xét nghiệm tại nhà', link: '#' },
    { name: 'Tư vấn trực tuyến', link: '#' },
    { name: 'Tiêm chủng', link: '#' },
    { name: 'Cấp cứu 24/7', link: '#' },
    { name: 'Phẫu thuật ngoại trú', link: '#' },
  ];

  // Dữ liệu chính sách
  const policies = [
    { name: 'Chính sách bảo mật', link: '#' },
    { name: 'Điều khoản sử dụng', link: '#' },
    { name: 'Chính sách thanh toán', link: '#' },
    { name: 'Chính sách đặt lịch', link: '#' },
    { name: 'Chính sách đổi trả thuốc', link: '#' },
    { name: 'Câu hỏi thường gặp', link: '#' },
  ];

  return (
    <footer className="footer">
      {/* Phần trên của footer */}
      <div className="footer-top">
        <div className="footer-container">
          <div className="footer-features">
            <div className="feature-item">
              <div className="feature-icon">
                <FaShieldAlt />
              </div>
              <div className="feature-content">
                <h4>Bảo mật thông tin</h4>
                <p>Hồ sơ bệnh án được mã hóa an toàn</p>
              </div>
            </div>
            
            <div className="feature-item">
              <div className="feature-icon">
                <FaCreditCard />
              </div>
              <div className="feature-content">
                <h4>Thanh toán đa dạng</h4>
                <p>Chấp nhận nhiều phương thức thanh toán</p>
              </div>
            </div>
            
            <div className="feature-item">
              <div className="feature-icon">
                <FaTruck />
              </div>
              <div className="feature-content">
                <h4>Giao thuốc tận nơi</h4>
                <p>Miễn phí giao hàng trong nội thành</p>
              </div>
            </div>
            
            <div className="feature-item">
              <div className="feature-icon">
                <FaHeadset />
              </div>
              <div className="feature-content">
                <h4>Hỗ trợ 24/7</h4>
                <p>Hotline: 1900 1234</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Phần chính của footer */}
      <div className="footer-main">
        <div className="footer-container">
          <div className="footer-grid">
            {/* Cột 1: Giới thiệu */}
            <div className="footer-col about-col">
              <div className="footer-logo">
                <MdHealthAndSafety className="logo-icon" />
                <div className="logo-text">
                  <h3>MediCare</h3>
                  <p>Chăm sóc sức khỏe toàn diện</p>
                </div>
              </div>
              <p className="footer-description">
                MediCare là nền tảng chăm sóc sức khỏe trực tuyến hàng đầu, 
                cung cấp dịch vụ y tế chất lượng cao với đội ngũ bác sĩ chuyên môn 
                và hệ thống nhà thuốc đạt chuẩn.
              </p>
              
              {/* Form đăng ký nhận tin */}
              <div className="newsletter">
                <h4>Đăng ký nhận bản tin</h4>
                <p>Nhận thông tin sức khỏe hữu ích hàng tuần</p>
                <form className="newsletter-form" onSubmit={handleNewsletterSubmit}>
                  <input 
                    type="email" 
                    placeholder="Email của bạn" 
                    required 
                  />
                  <button type="submit" className="subscribe-btn">
                    Đăng ký
                  </button>
                </form>
              </div>
            </div>

            {/* Cột 2: Khoa & Dịch vụ */}
            <div className="footer-col">
              <h4 className="footer-title">Khoa & Dịch vụ</h4>
              {speciallyLoading ? (
                  <div className="loading-state">
                    <i className="fas fa-spinner fa-spin"></i>
                  </div>
              ) : (
              <ul className="footer-links">
                {specially && specially.length > 0 ? specially.map((dept, index) => (
                  <li key={index}>
                    <button 
                      className="footer-link"
                      onClick={() => handleQuickLinkClick(dept.slug)}
                    >
                      <span className="link-icon">{dept.icon}</span>
                      {dept.name}
                    </button>
                  </li>
                )) : 
                  "Không tìm thấy chuyên khoa"
                }
              </ul>
              )}

              
              <div className="services-list">
                <h5>Dịch vụ nổi bật</h5>
                <ul>
                  {services.map((service, index) => (
                    <li key={index}>
                      <button 
                        className="service-link"
                        onClick={() => handleQuickLinkClick(service.name)}
                      >
                        {service.name}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Cột 3: Liên kết nhanh */}
            <div className="footer-col">
              <h4 className="footer-title">Liên kết nhanh</h4>
              <ul className="footer-links">
                <li>
                  <button 
                    className="footer-link"
                    onClick={() => handleQuickLinkClick('Trang chủ')}
                  >
                    Trang chủ
                  </button>
                </li>
                <li>
                  <button 
                    className="footer-link"
                    onClick={() => handleQuickLinkClick('Giới thiệu')}
                  >
                    Giới thiệu
                  </button>
                </li>
                <li>
                  <button 
                    className="footer-link"
                    onClick={() => handleQuickLinkClick('Đội ngũ bác sĩ')}
                  >
                    Đội ngũ bác sĩ
                  </button>
                </li>
                <li>
                  <button 
                    className="footer-link"
                    onClick={() => handleQuickLinkClick('Nhà thuốc')}
                  >
                    <FaPills className="link-icon" /> Nhà thuốc
                  </button>
                </li>
                <li>
                  <button 
                    className="footer-link"
                    onClick={() => handleQuickLinkClick('Chat với AI')}
                  >
                    <FaHeadset className="link-icon" /> Chat với AI
                  </button>
                </li>
                <li>
                  <button 
                    className="footer-link"
                    onClick={() => handleQuickLinkClick('Đặt lịch khám')}
                  >
                    <FaClock className="link-icon" /> Đặt lịch khám
                  </button>
                </li>
              </ul>

              {/* Chính sách */}
              <div className="policies">
                <h5>Chính sách</h5>
                <ul>
                  {policies.slice(0, 4).map((policy, index) => (
                    <li key={index}>
                      <button 
                        className="policy-link"
                        onClick={() => handleQuickLinkClick(policy.name)}
                      >
                        {policy.name}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Cột 4: Liên hệ */}
            <div className="footer-col contact-col">
              <h4 className="footer-title">Liên hệ với chúng tôi</h4>
              <ul className="contact-info">
                <li>
                  <FaMapMarkerAlt className="contact-icon" />
                  <div>
                    <strong>Địa chỉ:</strong>
                    <p>123 Đường Y Tế, Phường Sức Khỏe, Quận 1, TP.HCM</p>
                  </div>
                </li>
                <li>
                  <FaPhoneAlt className="contact-icon" />
                  <div>
                    <strong>Điện thoại:</strong>
                    <p>
                      <a href="tel:19001234">1900 1234</a> - 
                      <a href="tel:02812345678"> (028) 1234 5678</a>
                    </p>
                  </div>
                </li>
                <li>
                  <FaEnvelope className="contact-icon" />
                  <div>
                    <strong>Email:</strong>
                    <p>
                      <a href="mailto:info@medicare.com">info@medicare.com</a>
                    </p>
                  </div>
                </li>
                <li>
                  <FaClock className="contact-icon" />
                  <div>
                    <strong>Giờ làm việc:</strong>
                    <p>Thứ 2 - Thứ 7: 7:00 - 20:00</p>
                    <p>Chủ nhật & ngày lễ: 7:30 - 17:00</p>
                  </div>
                </li>
              </ul>

              {/* Mạng xã hội */}
              <div className="social-media">
                <h5>Kết nối với chúng tôi</h5>
                <div className="social-icons">
                  <button 
                    className="social-icon facebook"
                    onClick={() => handleSocialClick('Facebook')}
                    aria-label="Facebook"
                  >
                    <FaFacebookF />
                  </button>
                  <button 
                    className="social-icon twitter"
                    onClick={() => handleSocialClick('Twitter')}
                    aria-label="Twitter"
                  >
                    <FaTwitter />
                  </button>
                  <button 
                    className="social-icon instagram"
                    onClick={() => handleSocialClick('Instagram')}
                    aria-label="Instagram"
                  >
                    <FaInstagram />
                  </button>
                  <button 
                    className="social-icon youtube"
                    onClick={() => handleSocialClick('YouTube')}
                    aria-label="YouTube"
                  >
                    <FaYoutube />
                  </button>
                </div>
              </div>

              {/* App download */}
              <div className="app-download">
                <h5>Tải ứng dụng MediCare</h5>
                <div className="app-buttons">
                  <button 
                    className="app-btn app-store"
                    onClick={() => handleQuickLinkClick('App Store')}
                  >
                    <span>Download on the</span>
                    <strong>App Store</strong>
                  </button>
                  <button 
                    className="app-btn google-play"
                    onClick={() => handleQuickLinkClick('Google Play')}
                  >
                    <span>Get it on</span>
                    <strong>Google Play</strong>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Phần dưới cùng của footer */}
      <div className="footer-bottom">
        <div className="footer-container">
          <div className="footer-bottom-content">
            <div className="copyright">
              <p>&copy; {currentYear} MediCare. Tất cả các quyền được bảo lưu.</p>
              <p className="disclaimer">
                Thông tin trên website chỉ mang tính chất tham khảo. 
                Vui lòng tham khảo ý kiến bác sĩ trước khi sử dụng thuốc.
              </p>
            </div>
            
            <div className="certifications">
              <div className="cert-badge">
                <FaShieldAlt />
                <span>Đã đăng ký Bộ Y Tế</span>
              </div>
              <div className="cert-badge">
                <MdHealthAndSafety />
                <span>ISO 9001:2015</span>
              </div>
              <div className="cert-badge">
                <FaCreditCard />
                <span>Thanh toán an toàn</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;