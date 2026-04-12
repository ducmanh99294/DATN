import React, { useState } from 'react';
import '../assets/register.css';
import { useNavigate } from 'react-router-dom';
import { loginWithFacebookApi, registerApi } from '../api/authApi';
import { useNotify } from '../hooks/useNotification';

interface RegisterProps {
  onRegisterSuccess?: (userData: any) => void;
  onSwitchToForgotPassword?: () => void;
}

const Register: React.FC<RegisterProps> = ({ 
}) => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    dateOfBirth: '',
    gender: '',
    address: '',
    agreeTerms: false,
    receiveNewsletter: true
  });
  const notify = useNotify()
  const navigate = useNavigate();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);

  // Xử lý thay đổi input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    // Clear error khi user bắt đầu nhập
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Validate từng bước
  const validateStep = (step: number) => {
    const newErrors: Record<string, string> = {};

    if (step === 1) {
      // Full name validation
      if (!formData.fullName.trim()) {
        newErrors.fullName = 'Vui lòng nhập họ tên';
      } else if (formData.fullName.trim().length < 3) {
        newErrors.fullName = 'Họ tên phải có ít nhất 3 ký tự';
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!formData.email.trim()) {
        newErrors.email = 'Vui lòng nhập email';
      } else if (!emailRegex.test(formData.email)) {
        newErrors.email = 'Email không hợp lệ';
      }

      // Phone validation
      const phoneRegex = /(84|0[3|5|7|8|9])+([0-9]{8})\b/;
      if (!formData.phone.trim()) {
        newErrors.phone = 'Vui lòng nhập số điện thoại';
      } else if (!phoneRegex.test(formData.phone)) {
        newErrors.phone = 'Số điện thoại không hợp lệ';
      }
    }

    if (step === 2) {
      // Password validation
      if (!formData.password) {
        newErrors.password = 'Vui lòng nhập mật khẩu';
      } else if (formData.password.length < 8) {
        newErrors.password = 'Mật khẩu phải có ít nhất 8 ký tự';
      } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
        newErrors.password = 'Mật khẩu phải chứa chữ hoa, chữ thường và số';
      }

      // Confirm password validation
      if (!formData.confirmPassword) {
        newErrors.confirmPassword = 'Vui lòng xác nhận mật khẩu';
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Mật khẩu không khớp';
      }
    }

    if (step === 3) {
      // Date of birth validation
      if (!formData.dateOfBirth) {
        newErrors.dateOfBirth = 'Vui lòng chọn ngày sinh';
      } else {
        const birthDate = new Date(formData.dateOfBirth);
        const today = new Date();
        const age = today.getFullYear() - birthDate.getFullYear();
        if (age < 16) {
          newErrors.dateOfBirth = 'Bạn phải đủ 16 tuổi để đăng ký';
        }
      }

      // Gender validation
      if (!formData.gender) {
        newErrors.gender = 'Vui lòng chọn giới tính';
      }

      // Address validation
      if (!formData.address.trim()) {
        newErrors.address = 'Vui lòng nhập địa chỉ';
      }

      // Terms agreement validation
      if (!formData.agreeTerms) {
        newErrors.agreeTerms = 'Bạn phải đồng ý với điều khoản sử dụng';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Chuyển đến bước tiếp theo
  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 3));
      window.scrollTo(0, 0);
    }
  };

  // Quay lại bước trước
  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
    window.scrollTo(0, 0);
  };

  // Xử lý submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateStep(3)) {
      return;
    }

    setIsLoading(true);

    try {
      const res = await registerApi(
        formData.address,
        formData.dateOfBirth,
        formData.email,
        formData.fullName,
        formData.gender,
        formData.password,
        formData.phone
      )
      console.log
      console.log(res)
      // Hiển thị thông báo thành công
      setRegistrationSuccess(true);
    } catch (error) {
      console.error('Registration error:', error);
      setErrors({ submit: 'Đã có lỗi xảy ra. Vui lòng thử lại sau.' });
    } finally {
      setIsLoading(false);
    }
  };

  // Đăng ký bằng mạng xã hội
  const handleSocialRegister = (provider: string) => {
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

  // Render progress steps
  const renderProgressSteps = () => {
    const steps = [
      { number: 1, title: 'Thông tin cơ bản' },
      { number: 2, title: 'Tạo mật khẩu' },
      { number: 3, title: 'Hoàn tất' }
    ];

    return (
      <div className="progress-steps">
        {steps.map(step => (
          <div 
            key={step.number} 
            className={`step ${step.number === currentStep ? 'active' : step.number < currentStep ? 'completed' : ''}`}
          >
            <div className="step-circle">
              {step.number < currentStep ? (
                <i className="fas fa-check"></i>
              ) : (
                <span>{step.number}</span>
              )}
            </div>
            <div className="step-title">{step.title}</div>
            {step.number < steps.length && <div className="step-connector"></div>}
          </div>
        ))}
      </div>
    );
  };

  // Render form theo từng bước
  const renderFormStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="form-step">
            <h3>
              <i className="fas fa-user-circle"></i>
              Thông tin cơ bản
            </h3>
            
            <div className="form-group">
              <label htmlFor="fullName">
                <i className="fas fa-user"></i> Họ và tên *
              </label>
              <input
                type="text"
                id="fullName"
                name="fullName"
                placeholder="Nhập họ và tên đầy đủ"
                value={formData.fullName}
                onChange={handleInputChange}
                className={errors.fullName ? 'error' : ''}
              />
              {errors.fullName && (
                <span className="error-message">
                  <i className="fas fa-exclamation-circle"></i> {errors.fullName}
                </span>
              )}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="email">
                  <i className="fas fa-envelope"></i> Email *
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  placeholder="example@email.com"
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
                <label htmlFor="phone">
                  <i className="fas fa-phone"></i> Số điện thoại *
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  placeholder="0123 456 789"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className={errors.phone ? 'error' : ''}
                />
                {errors.phone && (
                  <span className="error-message">
                    <i className="fas fa-exclamation-circle"></i> {errors.phone}
                  </span>
                )}
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="form-step">
            <h3>
              <i className="fas fa-lock"></i>
              Tạo mật khẩu
            </h3>

            <div className="form-group">
              <label htmlFor="password">
                <i className="fas fa-key"></i> Mật khẩu *
              </label>
              <div className="password-input">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  placeholder="Nhập mật khẩu (ít nhất 8 ký tự)"
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
              <div className="password-requirements">
                <p>Mật khẩu phải có:</p>
                <ul>
                  <li className={formData.password.length >= 8 ? 'valid' : ''}>
                    <i className={formData.password.length >= 8 ? "fas fa-check-circle" : "fas fa-circle"}></i>
                    Ít nhất 8 ký tự
                  </li>
                  <li className={/(?=.*[a-z])/.test(formData.password) ? 'valid' : ''}>
                    <i className={/(?=.*[a-z])/.test(formData.password) ? "fas fa-check-circle" : "fas fa-circle"}></i>
                    Chữ thường
                  </li>
                  <li className={/(?=.*[A-Z])/.test(formData.password) ? 'valid' : ''}>
                    <i className={/(?=.*[A-Z])/.test(formData.password) ? "fas fa-check-circle" : "fas fa-circle"}></i>
                    Chữ hoa
                  </li>
                  <li className={/(?=.*\d)/.test(formData.password) ? 'valid' : ''}>
                    <i className={/(?=.*\d)/.test(formData.password) ? "fas fa-check-circle" : "fas fa-circle"}></i>
                    Số
                  </li>
                </ul>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">
                <i className="fas fa-key"></i> Xác nhận mật khẩu *
              </label>
              <div className="password-input">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirmPassword"
                  name="confirmPassword"
                  placeholder="Nhập lại mật khẩu"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className={errors.confirmPassword ? 'error' : ''}
                />
                <button 
                  type="button" 
                  className="toggle-password"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <i className={showConfirmPassword ? "fas fa-eye-slash" : "fas fa-eye"}></i>
                </button>
              </div>
              {errors.confirmPassword && (
                <span className="error-message">
                  <i className="fas fa-exclamation-circle"></i> {errors.confirmPassword}
                </span>
              )}
              {formData.confirmPassword && formData.password === formData.confirmPassword && (
                <div className="success-message">
                  <i className="fas fa-check-circle"></i> Mật khẩu khớp
                </div>
              )}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="form-step">
            <h3>
              <i className="fas fa-clipboard-check"></i>
              Thông tin bổ sung
            </h3>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="dateOfBirth">
                  <i className="fas fa-birthday-cake"></i> Ngày sinh *
                </label>
                <input
                  type="date"
                  id="dateOfBirth"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleInputChange}
                  className={errors.dateOfBirth ? 'error' : ''}
                  max={new Date().toISOString().split('T')[0]}
                />
                {errors.dateOfBirth && (
                  <span className="error-message">
                    <i className="fas fa-exclamation-circle"></i> {errors.dateOfBirth}
                  </span>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="gender">
                  <i className="fas fa-venus-mars"></i> Giới tính *
                </label>
                <select
                  id="gender"
                  name="gender"
                  value={formData.gender}
                  onChange={handleInputChange}
                  className={errors.gender ? 'error' : ''}
                >
                  <option value="">Chọn giới tính</option>
                  <option value="male">Nam</option>
                  <option value="female">Nữ</option>
                  <option value="other">Khác</option>
                </select>
                {errors.gender && (
                  <span className="error-message">
                    <i className="fas fa-exclamation-circle"></i> {errors.gender}
                  </span>
                )}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="address">
                <i className="fas fa-map-marker-alt"></i> Địa chỉ *
              </label>
              <input
                type="text"
                id="address"
                name="address"
                placeholder="Nhập địa chỉ đầy đủ"
                value={formData.address}
                onChange={handleInputChange}
                className={errors.address ? 'error' : ''}
              />
              {errors.address && (
                <span className="error-message">
                  <i className="fas fa-exclamation-circle"></i> {errors.address}
                </span>
              )}
            </div>

            <div className="form-checkboxes">
              <label className="checkbox-container">
                <input
                  type="checkbox"
                  name="agreeTerms"
                  checked={formData.agreeTerms}
                  onChange={handleInputChange}
                />
                <span className="checkmark"></span>
                Tôi đồng ý với <button type="button" className="text-link">Điều khoản sử dụng</button> và 
                <button type="button" className="text-link"> Chính sách bảo mật</button> *
              </label>
              {errors.agreeTerms && (
                <span className="error-message">
                  <i className="fas fa-exclamation-circle"></i> {errors.agreeTerms}
                </span>
              )}

              <label className="checkbox-container">
                <input
                  type="checkbox"
                  name="receiveNewsletter"
                  checked={formData.receiveNewsletter}
                  onChange={handleInputChange}
                />
                <span className="checkmark"></span>
                Tôi muốn nhận thông tin về dịch vụ y tế và khuyến mãi qua email
              </label>
            </div>

            <div className="account-type">
              <h4>
                <i className="fas fa-user-tag"></i>
                Loại tài khoản
              </h4>
              <div className="account-options">
                <div className="account-option active">
                  <div className="account-icon">
                    <i className="fas fa-user-injured"></i>
                  </div>
                  <div className="account-info">
                    <h5>Bệnh nhân</h5>
                    <p>Đặt lịch khám, mua thuốc, xem kết quả xét nghiệm</p>
                  </div>
                </div>
                <div className="account-option">
                  <div className="account-icon">
                    <i className="fas fa-user-md"></i>
                  </div>
                  <div className="account-info">
                    <h5>Bác sĩ</h5>
                    <p>Quản lý lịch hẹn, tư vấn trực tuyến, kê đơn thuốc</p>
                    <button type="button" className="account-action">
                      Đăng ký là bác sĩ <i className="fas fa-arrow-right"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // Render success message
  if (registrationSuccess) {
    return (
      <div className="register-container">
        {/* <div className="register-wrapper"> */}
          <div className="success-message-container">
            <div className="success-icon">
              <i className="fas fa-check-circle"></i>
            </div>
            <h2>Đăng ký thành công!</h2>
            <p>Chúc mừng bạn đã tạo tài khoản MediCare thành công.</p>
            
            <div className="success-details">
              <div className="detail-item">
                <i className="fas fa-envelope"></i>
                <span>Xác nhận đã được gửi đến: <strong>{formData.email}</strong></span>
              </div>
              <div className="detail-item">
                <i className="fas fa-user"></i>
                <span>Tên tài khoản: <strong>{formData.fullName}</strong></span>
              </div>
              <div className="detail-item">
                <i className="fas fa-history"></i>
                <span>Tài khoản sẽ được kích hoạt ngay lập tức</span>
              </div>
            </div>

            <div className="success-actions">
              <button className="success-btn primary" onClick={()=>{navigate('/login')}}>
                <i className="fas fa-sign-in-alt"></i>
                Đăng nhập ngay
              </button>
              <button className="success-btn secondary">
                <i className="fas fa-home"></i>
                Về trang chủ
              </button>
            </div>
          </div>
        {/* </div> */}
      </div>
    );
  }

  return (
    <div className="register-container">
      <div className="register-wrapper">
        {/* Left side - Info */}
        <div className="register-left">
          <div className="register-brand">
            <div className="brand-logo">
              <i className="fas fa-heartbeat"></i>
            </div>
            <h1>MediCare</h1>
            <p className="brand-tagline">Đăng ký tài khoản mới</p>
          </div>

          <div className="register-benefits">
            <h3>
              <i className="fas fa-gift"></i>
              Lợi ích khi đăng ký
            </h3>
            
            <div className="benefits-list">
              <div className="benefit">
                <div className="benefit-icon">
                  <i className="fas fa-calendar-check"></i>
                </div>
                <div className="benefit-content">
                  <h4>Đặt lịch dễ dàng</h4>
                  <p>Đặt lịch khám trực tuyến với bác sĩ chuyên khoa</p>
                </div>
              </div>

              <div className="benefit">
                <div className="benefit-icon">
                  <i className="fas fa-file-medical"></i>
                </div>
                <div className="benefit-content">
                  <h4>Hồ sơ sức khỏe điện tử</h4>
                  <p>Lưu trữ và quản lý hồ sơ bệnh án trực tuyến</p>
                </div>
              </div>

              <div className="benefit">
                <div className="benefit-icon">
                  <i className="fas fa-tags"></i>
                </div>
                <div className="benefit-content">
                  <h4>Ưu đãi đặc biệt</h4>
                  <p>Nhận ưu đãi và khuyến mãi dành riêng cho thành viên</p>
                </div>
              </div>

              <div className="benefit">
                <div className="benefit-icon">
                  <i className="fas fa-history"></i>
                </div>
                <div className="benefit-content">
                  <h4>Theo dõi lịch sử</h4>
                  <p>Xem lại lịch sử khám bệnh và đơn thuốc</p>
                </div>
              </div>
            </div>
          </div>

          <div className="already-member">
            <p>Đã có tài khoản?</p>
            <button className="login-link" onClick={()=>{navigate('/login')}}>
              <i className="fas fa-sign-in-alt"></i>
              Đăng nhập ngay
            </button>
          </div>
        </div>

        {/* Right side - Form */}
        <div className="register-right">
          <div className="register-form-container">
            <div className="form-header">
              <h2>Tạo tài khoản mới</h2>
              <p>Điền thông tin để bắt đầu sử dụng dịch vụ y tế trực tuyến</p>
            </div>

            {/* Progress Steps */}
            {renderProgressSteps()}

            {/* Social Register */}
            <div className="social-register">
              <div className="social-buttons">
                <button 
                  type="button" 
                  className="social-btn google"
                  onClick={() => handleSocialRegister('Google')}
                >
                  <i className="fab fa-google"></i>
                  <span>Tiếp tục với Google</span>
                </button>
              </div>

              <div className="divider">
                <span>hoặc đăng ký với email</span>
              </div>
            </div>

            {/* Main Form */}
            <form className="register-form" onSubmit={handleSubmit}>
              {renderFormStep()}

              {errors.submit && (
                <div className="form-error">
                  <i className="fas fa-exclamation-triangle"></i>
                  {errors.submit}
                </div>
              )}

              <div className="form-navigation">
                {currentStep > 1 && (
                  <button 
                    type="button" 
                    className="nav-btn prev-btn"
                    onClick={prevStep}
                    disabled={isLoading}
                  >
                    <i className="fas fa-arrow-left"></i>
                    Quay lại
                  </button>
                )}
                
                {currentStep < 3 ? (
                  <button 
                    type="button" 
                    className="nav-btn next-btn"
                    onClick={nextStep}
                    disabled={isLoading}
                  >
                    Tiếp theo
                    <i className="fas fa-arrow-right"></i>
                  </button>
                ) : (
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
                    ) : (
                      <>
                        <i className="fas fa-user-plus"></i>
                        Hoàn tất đăng ký
                      </>
                    )}
                  </button>
                )}
              </div>
            </form>

            {/* Security Info */}
            <div className="security-info">
              <div className="security-icon">
                <i className="fas fa-shield-alt"></i>
              </div>
              <div className="security-content">
                <h4>Thông tin của bạn được bảo mật</h4>
                <p>Chúng tôi cam kết bảo mật thông tin cá nhân theo tiêu chuẩn HIPAA</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;