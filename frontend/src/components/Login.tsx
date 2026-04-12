import React, { useState } from 'react';
import '../assets/login.css';
import { useNavigate } from 'react-router-dom';
import { loginApi, loginWithFacebookApi, loginWithGoogleApi } from '../api/authApi';
import { useAuth } from '../hooks/useAuth';
import { useNotify } from '../hooks/useNotification';

const Login: React.FC = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const notify = useNotify()
  const { fetchMe } = useAuth();
  // Xử lý thay đổi input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error khi user bắt đầu nhập
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = 'Vui lòng nhập email';
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = 'Email không hợp lệ';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Vui lòng nhập mật khẩu';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Xử lý submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }
    setIsLoading(true);

    try {
      const data = await loginApi(formData.email,formData.password);

      if(data.isBanned) {
        notify.error(`Tài khoản đã bị khóa với lí do: ${data.reason}`, "Thông báo")
        return;
      }

      await fetchMe();
      notify.success("Đăng nhập thành công","Thông báo")
      navigate("/")

    } catch (error) {
      notify.error("Đăng nhập thất bại, sai tài khoản hoặc mật khẩu","Thông báo")
    } finally {
      setIsLoading(false);
    }
  };

  // Xử lý đăng nhập bằng mạng xã hội
  const handleSocialLogin = (provider: string) => {
    try {
      if (provider === "Google") {
        window.location.href =
          "http://localhost:3000/api/auth/google";
      }

      if (provider === "Facebook") {
        loginWithFacebookApi()
          .then(() => {
            notify.success("Đăng nhập thành công", "Thông báo");
          })
          .catch(() => {
            notify.error("Đăng nhập thất bại", "Thông báo");
          });
      }
    } catch (e) {
      notify.error("Đăng nhập thất bại", "Thông báo");
      console.log(e);
    }
  };

  return (
    <div className="login-container">
      <div className="login-wrapper">
        {/* Left side - Welcome & Info */}
        <div className="login-left">
          <div className="login-brand">
            <div className="brand-logo">
              <i className="fas fa-heartbeat"></i>
            </div>
            <h1>MediCare</h1>
            <p className="brand-tagline">Chăm sóc sức khỏe toàn diện</p>
          </div>

          <div className="login-features">
            <div className="feature">
              <div className="feature-icon">
                <i className="fas fa-user-md"></i>
              </div>
              <div className="feature-content">
                <h3>Bác sĩ chuyên khoa</h3>
                <p>Kết nối với hơn 500 bác sĩ uy tín</p>
              </div>
            </div>

            <div className="feature">
              <div className="feature-icon">
                <i className="fas fa-calendar-check"></i>
              </div>
              <div className="feature-content">
                <h3>Đặt lịch dễ dàng</h3>
                <p>Đặt lịch khám 24/7, nhận xác nhận ngay</p>
              </div>
            </div>

            <div className="feature">
              <div className="feature-icon">
                <i className="fas fa-pills"></i>
              </div>
              <div className="feature-content">
                <h3>Nhà thuốc trực tuyến</h3>
                <p>Mua thuốc chính hãng, giao tận nhà</p>
              </div>
            </div>

            <div className="feature">
              <div className="feature-icon">
                <i className="fas fa-headset"></i>
              </div>
              <div className="feature-content">
                <h3>Hỗ trợ 24/7</h3>
                <p>Đội ngũ tư vấn luôn sẵn sàng hỗ trợ</p>
              </div>
            </div>
          </div>

          <div className="login-stats">
            <div className="stat">
              <div className="stat-number">50K+</div>
              <div className="stat-label">Bệnh nhân</div>
            </div>
            <div className="stat">
              <div className="stat-number">500+</div>
              <div className="stat-label">Bác sĩ</div>
            </div>
            <div className="stat">
              <div className="stat-number">30+</div>
              <div className="stat-label">Chuyên khoa</div>
            </div>
          </div>
        </div>

        {/* Right side - Form */}
        <div className="login-right">
          <div className="login-form-container">
            <div className="form-header">
              <h2>Đăng nhập</h2>
              <p>Chào mừng trở lại! Vui lòng đăng nhập để tiếp tục
              </p>
            </div>

            {/* Social Login */}
            <div className="social-login">
              <div className="divider">
                <span>Đăng nhập nhanh bằng</span>
              </div>
              
              <div className="social-buttons">
                <button 
                  type="button" 
                  className="social-btn google"
                  onClick={() => handleSocialLogin('Google')}
                >
                  <i className="fab fa-google"></i>
                  <span>Google</span>
                </button>
              </div>
            </div>

            {/* Main Form */}
            <form className="login-form" onSubmit={handleSubmit}>

              <div className="form-group">
                <label htmlFor="email">
                  <i className="fas fa-envelope"></i> Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  placeholder="Nhập địa chỉ email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={errors.email ? 'error' : ''}
                />
                {errors.email && (
                  <span className="error-message">
                    <i className="fas fa-exclamation-circle"></i> {errors.email}
                  </span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="password">
                  <i className="fas fa-lock"></i> Mật khẩu
                </label>
                <div className="password-input">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    placeholder="Nhập mật khẩu"
                    value={formData.password}
                    onChange={handleInputChange}
                    className={errors.password ? 'error' : ''}
                  />
                  <button 
                    type="button" 
                    className="toggle-password"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    <i className={showPassword ? "fas fa-eye-slash" : "fas fa-eye"}></i>
                  </button>
                </div>
                {errors.password && (
                  <span className="error-message">
                    <i className="fas fa-exclamation-circle"></i> {errors.password}
                  </span>
                )}
              </div>

              <button 
                type="submit" 
                className="submit-btn"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i>
                    Đang xử lý...
                  </>
                ) : 
                  <>
                    <i className="fas fa-sign-in-alt"></i>
                    Đăng nhập
                  </>
                }
              </button>

              <div className="form-footer">
                <p>
                  <button 
                    type="button" 
                    className="switch-form"
                    onClick={() => {navigate('/register')}}
                  >
                    Đăng kí ngay
                  </button>
                </p>
                
                <div className="terms">
                  Bằng việc đăng nhập/đăng ký, bạn đồng ý với 
                  <button type="button">Điều khoản sử dụng</button> và 
                  <button type="button">Chính sách bảo mật</button> của chúng tôi.
                </div>
              </div>
            </form>

            {/* Emergency Contact */}
            <div className="emergency-contact">
              <div className="emergency-icon">
                <i className="fas fa-ambulance"></i>
              </div>
              <div className="emergency-info">
                <h4>Cần hỗ trợ khẩn cấp?</h4>
                <p>Gọi ngay: <strong>115</strong> hoặc <strong>1900 1234</strong></p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;