import React, { useState, useEffect } from 'react';
import '../assets/header.css';

// Import các icon (sử dụng react-icons)
import { 
  FaUserCircle, 
  FaShoppingCart, 
  FaBell, 
  FaBars, 
  FaTimes,
  FaPills,
  FaRobot,
  FaCalendarAlt,
  FaHome,
  FaClinicMedical,
  FaNewspaper,
  } from 'react-icons/fa';
import { MdHealthAndSafety } from 'react-icons/md';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../context/AuthContext';
import { useNotify } from '../hooks/useNotification';
import type Specialty from './Specialty';
import { getAllSpecially } from '../api/specialyApi';
import { useSocket } from '../context/SocketContext';


const Header: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isSpecialtiesOpen, setIsSpecialtiesOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [activeNav, setActiveNav] = useState('home');
  const { user, isLoading, logout } = useAuthContext();
  const navigate = useNavigate();
  const notify = useNotify();
  const { socket } = useSocket();
  const [notifications, setNotifications] = useState<any[]>([]);
  // Xử lý scroll để thay đổi style header
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Đóng menu khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = () => {
      if (isMenuOpen) setIsMenuOpen(false);
      if (isUserMenuOpen) setIsUserMenuOpen(false);
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isMenuOpen, isUserMenuOpen]);

  useEffect(() => {
    const fetchSpecialties = async () => {
      try {
        const data = await getAllSpecially();
        setSpecialties(data);
      } catch (error) {
        console.error("Lỗi load chuyên khoa:", error);
      }
    };

    fetchSpecialties();
  }, []);

  useEffect(() => {
    if (!socket) return;

    socket.on("connect", () => {
      socket.emit("user_ready");
    });

    socket.on("notification", (data) => {
      setNotifications(prev => [data, ...prev]);
    });

    return () => {
      socket.off("notification");
    };
  }, [socket]);

  useEffect(() => {
    const handleClickOutside = () => {
      if (isNotificationOpen) setIsNotificationOpen(false);
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [isNotificationOpen]);

  // Navigation items
  const navItems = [
    { id: 'home', label: 'Trang chủ', icon: <FaHome />, navigateTo: '/' },
    { id: 'pharmacy', label: 'Chuyên khoa', icon: <FaClinicMedical />, navigateTo: '/specialty', isDropdown: true },
    { id: 'clinic', label: 'Thuốc', icon: <FaPills />, navigateTo: '/products' },
    { id: 'health', label: 'Tin tức', icon: <FaNewspaper />, navigateTo: '/news' },
  ];

  // Xử lý click navigation
  const handleNavClick = (id: string) => {
    setActiveNav(id);
    setIsMenuOpen(false);
    // logic điều hướng
    const item = navItems.find(nav => nav.id === id);
    if (item && item.navigateTo) {
      navigate(item.navigateTo);
    } else { 
      navigate('/');
    }
  };

  // Xử lý click logo
  const handleLogoClick = () => {
    setActiveNav('home');
    navigate('/');
  };

  const getBookingButtonConfig = () => {
    if (!user) {
      return {
        label: 'Đặt lịch',
        onClick: () => {
          notify.info("Vui lòng đăng nhập để sử dụng chức năng này", "thông báo"),
          navigate('/login')}
      };
    }

    switch (user.role) {
      case 'patient':
        return {
          label: 'Đặt lịch',
          onClick: () => navigate('/booking'),
        };

      case 'doctor':
        return {
          label: 'Lịch làm việc',
          onClick: () => navigate('/available '),
        };

      case 'admin':
        return {
          label: 'Dashboard',
          onClick: () => navigate('/admin'),
        };

      default:
        return {
          label: 'Đặt lịch',
          onClick: () => navigate('/booking'),
        };
    }
  };

  // Xử lý click mở chat AI
  const handleOpenChatAI = () => {
    alert('Mở chat AI');
    // Ở đây bạn sẽ mở chat AI
  };

  // Xử lý click mở giỏ hàng
  const handleOpenCart = () => {
    navigate("/cart")
  };

  // Xử lý click thông báo
  const handleOpenNotifications = () => {
    alert('Mở thông báo');
    // Ở đây bạn sẽ mở thông báo
  };

  // Xử lý click đăng nhập
  const handleLogin = () => {
    navigate("/login")
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // User menu items
  const userMenuItems = [
    { label: 'Hồ sơ của tôi', onClick: () => navigate("/account") },
    { label: 'Lịch hẹn của tôi', onClick: () => navigate('/appoinments') },
    { label: 'Đơn thuốc', onClick: () => navigate("/orders") },
    // { label: 'Cài đặt', onClick: () => alert('Mở cài đặt') },
    { label: 'Đăng xuất', onClick: handleLogout },
  ];

  if (isLoading) return null;
  return (
    <header className={`header ${isScrolled ? 'scrolled' : ''}`}>
      <div className="header-container">
        {/* Logo và Brand */}
        <div className="header-brand" onClick={handleLogoClick}>
          <div className="logo">
            <MdHealthAndSafety className="logo-icon" />
          </div>
          <div className="brand-text">
            <h1 className="brand-name">MediCare</h1>
            <p className="brand-tagline">Chăm sóc sức khỏe toàn diện</p>
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav className="desktop-nav">
          <ul className="nav-list">
            {navItems.map(item => (
            <li
              key={item.id}
              className="nav-item"
              onMouseEnter={() => item.isDropdown && setIsSpecialtiesOpen(true)}
              onMouseLeave={() => item.isDropdown && setIsSpecialtiesOpen(false)}
            >
              <button
                className={`nav-link ${activeNav === item.id ? 'active' : ''}`}
                onClick={() => {
                  if (!item.isDropdown) handleNavClick(item.id);
                }}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
              </button>

              {/* Dropdown chuyên khoa */}
              {item.isDropdown && isSpecialtiesOpen && (
                <div className="specialty-dropdown">
                  {specialties.map((sp) => (
                    <div
                      key={sp._id}
                      className="dropdown-item"
                      onClick={() => {
                        navigate(`/specialty/${sp.slug}`);
                        setIsSpecialtiesOpen(false);
                      }}
                    >
                      {sp.name}
                    </div>
                  ))}
                </div>
              )}
            </li>
          ))}
          </ul>
        </nav>

        {/* Header Actions */}
        <div className="header-actions">
          {/* Nút Chat AI */}
          {/* <button className="action-btn ai-btn" onClick={handleOpenChatAI} title="Chat với AI">
            <FaRobot className="action-icon" />
            <span className="action-label">Chat AI</span>
          </button> */}

          {/* Nút Đặt lịch (CTA chính) */}
          {(() => {
            const bookingBtn = getBookingButtonConfig();

            return (
              <button
                className="action-btn cta-btn"
                onClick={bookingBtn.onClick}
                title={bookingBtn.label}
              >
                <FaCalendarAlt className="action-icon" />
                <span className="action-label">{bookingBtn.label}</span>
              </button>
            );
          })()}

          {/* Nút Giỏ hàng */}
          <button className="action-btn cart-btn" onClick={handleOpenCart} title="Giỏ hàng">
            <FaShoppingCart className="action-icon" />
            {/* {cartItemCount > 0 && (
              <span className="badge">{cartItemCount > 9 ? '9+' : cartItemCount}</span>
            )} */}
            <span className="action-label">Giỏ hàng</span>
          </button>

          {/* Nút Thông báo */}
          <div className="notification-wrapper">
            <button
              className="action-btn notification-btn"
              onClick={(e) => {
                e.stopPropagation();
                setIsNotificationOpen(!isNotificationOpen);
              }}
              title="Thông báo"
            >
              <FaBell className="action-icon" />

              {notifications.length > 0 && (
                <span className="notification-badge">
                  {notifications.length > 9 ? "9+" : notifications.length}
                </span>
              )}

              <span className="action-label">Thông báo</span>
            </button>

            {isNotificationOpen && (
              <div className="notification-dropdown">
                {notifications.length === 0 ? (
                  <div className="notification-empty">
                    Không có thông báo
                  </div>
                ) : (
                  notifications.map((noti, index) => (
                    <div key={index} className="notification-item">
                      {noti.message}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* User Menu */}
          <div className="user-menu-container">
            {user ? (
              <button 
                className="user-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsUserMenuOpen(!isUserMenuOpen);
                }}
              >
                {user.image ? (
                  <img src={user.image} alt={user.fullName} className="user-avatar" />
                ) : (
                  <FaUserCircle className="user-icon" />
                )}
                <span className="user-name">{user.fullName}</span>
              </button>
            ) : (
              <button className="login-btn" onClick={handleLogin}>
                <FaUserCircle className="user-icon" />
                <span className="login-text">Đăng nhập</span>
              </button>
            )}

            {/* User Dropdown Menu */}
            {isUserMenuOpen && user && (
              <div className="user-dropdown">
                <div className="user-info">
                  {user.image ? (
                    <img src={user.image} alt={user.fullName} className="dropdown-avatar" />
                  ) : (
                    <FaUserCircle className="dropdown-icon" />
                  )}
                  <div className="user-details">
                    <h4>{user.fullName}</h4>
                  </div>
                </div>
                <div className="dropdown-divider"></div>
                <ul className="dropdown-menu">
                  {userMenuItems.map((item, index) => (
                    <li key={index}>
                      <button className="dropdown-item" onClick={item.onClick}>
                        {item.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button 
            className="mobile-menu-toggle"
            onClick={(e) => {
              e.stopPropagation();
              setIsMenuOpen(!isMenuOpen);
            }}
          >
            {isMenuOpen ? <FaTimes /> : <FaBars />}
          </button>
        </div>

        {/* Mobile Navigation Menu */}
        <div className={`mobile-nav ${isMenuOpen ? 'open' : ''}`}>
          <div className="mobile-nav-header">
            {user ? (
              <div className="mobile-user-info">
                {user.image ? (
                  <img src={user.image} alt={user.fullName} className="mobile-user-avatar" />
                ) : (
                  <FaUserCircle className="mobile-user-icon" />
                )}
                <div>
                  <h4>{user.fullName}</h4>
                </div>
              </div>
            ) : (
              <button className="mobile-login-btn" onClick={handleLogin}>
                <FaUserCircle className="mobile-user-icon" />
                <span>Đăng nhập / Đăng ký</span>
              </button>
            )}
          </div>

          <ul className="mobile-nav-list">
            {navItems.map(item => (
              <li key={item.id} className="mobile-nav-item">
                <button
                  className={`mobile-nav-link ${activeNav === item.id ? 'active' : ''}`}
                  onClick={() => handleNavClick(item.id)}
                >
                  <span className="mobile-nav-icon">{item.icon}</span>
                  <span className="mobile-nav-label">{item.label}</span>
                </button>
              </li>
            ))}
          </ul>

          <div className="mobile-nav-footer">
            {/* <button className="mobile-action-btn" onClick={handleOpenChatAI}>
              <FaRobot />
              <span>Chat với AI</span>
            </button> */}
            <button
              className="mobile-action-btn"
              onClick={getBookingButtonConfig().onClick}
            >
              <FaCalendarAlt />
              <span>{getBookingButtonConfig().label}</span>
            </button>
            <button className="mobile-action-btn" onClick={handleOpenCart}>
              <FaShoppingCart />
              {/* <span>Giỏ hàng {cartItemCount > 0 && `(${cartItemCount})`}</span> */}
            </button>
          </div>
        </div>

        {/* Mobile Nav Overlay */}
        {isMenuOpen && (
          <div 
            className="mobile-nav-overlay"
            onClick={() => setIsMenuOpen(false)}
          ></div>
        )}
      </div>
    </header>
  );
};

export default Header;