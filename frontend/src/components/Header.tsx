import React, { useState, useEffect, useRef } from 'react';
import '../assets/header.css';

// Import các icon (sử dụng react-icons)
import { 
  FaUserCircle, 
  FaShoppingCart, 
  FaBell, 
  FaBars, 
  FaTimes,
  FaPills,
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
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

const Header: React.FC = () => {
  gsap.registerPlugin(ScrollTrigger);
  const headerRef = useRef<HTMLElement | null>(null);
  const logoRef = useRef<HTMLElement | null>(null);
  const logoTitle = useRef<HTMLElement | null>(null);
  const navRef = useRef<HTMLElement | null>(null);
  const navRef2 = useRef<HTMLElement | null>(null);
  const iconRef = useRef<HTMLElement | null>(null);
  const menuBtnRef = useRef<HTMLElement | null>(null);

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isSpecialtiesOpen, setIsSpecialtiesOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [activeNav, setActiveNav] = useState('home');
  const { user, isLoading, logout } = useAuthContext();
  const navigate = useNavigate();
  const notify = useNotify();
  const { socket } = useSocket();
  const [notifications, setNotifications] = useState<any[]>([]);

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

  // Xử lý click mở giỏ hàng
  const handleOpenCart = () => {
    navigate("/cart")
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

  //------------aniation--------------
  useEffect(() => {
    const isMobile = window.innerWidth <= 768;

    // nếu mobile thì không chạy animation
    if (isMobile)  {
      const trigger = ScrollTrigger.create({
        trigger: document.body,
        start: "50px top",

        onEnter: () => {
          gsap.to(headerRef.current, {
            backgroundColor: "rgba(255, 255, 255, 0)",
            duration: 0.4
          });

          gsap.to(logoRef.current, {
            scale: 1.2,
            y: 5,
            duration: 0.4,
            ease: "power2.out"
          });

          gsap.to(menuBtnRef.current, {
            opacity: 1,
            x: 40,
            duration: 0.4
          });

          gsap.to(navRef.current, {
            opacity: 0,
            y: -10,
            duration: 0.2
          });

          gsap.to(iconRef.current, {
            opacity: 0,
            y: -10,
            duration: 0.2
          });
        },

        onLeaveBack: () => {
          gsap.to(headerRef.current, {
            backgroundColor: "#ffffff",
            backdropFilter: "blur(0px)",
            duration: 0.4
          });

          gsap.to(logoRef.current, {
            scale: 1,
            y: 0,
            duration: 0.4
          });

          gsap.to(menuBtnRef.current, {
            opacity: 1,
            x: 40,
            duration: 0.3
          });

          gsap.to(navRef.current, {
            opacity: 1,
            y: 0,
            duration: 0.3
          });

          gsap.to(iconRef.current, {
            opacity: 1,
            y: 0,
            duration: 0.3
          });
        }
      });

      return () => trigger.kill();
    }

    const trigger = ScrollTrigger.create({
      trigger: document.body,
      start: "80px top",

      onEnter: () => {
        gsap.to(headerRef.current, {
          background: "rgba(255,255,255,0)",
          duration: 0.5,
          boxShadow: "none",

        });

        gsap.to(logoRef.current, {
          x: 20,
          y: 25,
          scale: 1.5,
          duration: 0.6,
          ease: "power3.out"
        });

        gsap.to(logoTitle.current, {
          opacity: 0,
          duration: 0.4,
          ease: "power2.out"
        });

        gsap.to(navRef.current, {
          opacity: 1,
          y: 0,
          duration: 0.3
        });

        if (navRef2.current) {
          gsap.to(navRef2.current.querySelectorAll('.cta-btn, .cart-btn, .notification-btn'), {
            display: "none",
            opacity: 0,
            x: 160,
            duration: 0.3
          });
        }
        if (navRef.current) {
        gsap.to(navRef.current.querySelectorAll('.nav-icon'), {
          opacity: 0,
          duration: 0.3
        });

        gsap.to(navRef.current.querySelectorAll('.nav-link'), {
          duration: 0.3,
          opacity:0,
        });
        }
        
        if (headerRef.current) {
        // Làm biến mất chữ (tên hoặc chữ "Đăng nhập")
        gsap.to(headerRef.current.querySelectorAll('.user-name, .login-text'), {
          width: 0,
          opacity: 0,
          display: "none",
          duration: 0.3
        });

        // Xóa khoảng trống (gap) và thu nhỏ padding để nút thành hình tròn bao quanh avatar
        gsap.to(headerRef.current.querySelectorAll('.user-btn, .login-btn'), {
          gap: 0,
          padding: "8px", // Thu nhỏ padding 2 bên lại
          duration: 0.3
        });

        gsap.to(headerRef.current.querySelectorAll('.mobile-menu-toggle'), {
          display: "block",
          color: "white",
          opacity: 1,
        });
        }

        gsap.to(iconRef.current, {
          opacity: 0,
          y: -20,
          duration: 0.3
        });

        gsap.to(menuBtnRef.current, {
          opacity: 1,
          x: 0,
          duration: 0.5
        });
      },

      onLeaveBack: () => {
        gsap.to(headerRef.current, {
          background: "radial-gradient(circle, #1a2238 10%, #0E7490 50%, #1a2238 90%)",
          duration: 0.5
        });

        gsap.to(logoRef.current, {
          x: 0,
          y:0,
          scale: 1,
          duration: 0.6
        });

        gsap.to(logoTitle.current, {
          opacity: 1,
          duration: 0.4,
          ease: "power2.out"
        });

        gsap.to(navRef.current, {
          opacity: 1,
          y: 0,
          duration: 0.3
        });
        if (navRef.current) {
        gsap.to(navRef.current.querySelectorAll('.nav-icon'), {
          opacity: 1,
          duration: 0.3
        });

        gsap.to(navRef.current.querySelectorAll('.nav-link'), {
          clearProps: "all",
          duration: 0.6,
          backgroundColor: "rgba(14, 116, 144, 0.1)",
          paddingRight: 0,
        });
        }

        if (navRef2.current) {
        gsap.to(navRef2.current.querySelectorAll('.cta-btn, .cart-btn, .notification-btn'), {
          display: "block",
          opacity: 1,
          x: 0,
          duration: 0.2
        });
        }

        if (headerRef.current) {
        // Hiện lại chữ
        gsap.to(headerRef.current.querySelectorAll('.user-name, .login-text'), {
          display: "block",
          width: "auto",
          opacity: 1,
          duration: 0.3
        });

        // Trả lại khoảng trống và padding ban đầu cho nút
        gsap.to(headerRef.current.querySelectorAll('.user-btn, .login-btn'), {
          gap: "8px",
          padding: "8px 12px", 
          duration: 0.3
        });

        gsap.to(headerRef.current.querySelectorAll('.mobile-menu-toggle'), {
          display: "none",
          color: "white",
          duration: 0.3,
          opacity:0,
        });
        }

        gsap.to(iconRef.current, {
          opacity: 1,
          y: 0,
          duration: 0.3
        });

        gsap.to(menuBtnRef.current, {
          opacity: 0,
          x: -80,
          duration: 0.3
        });
      }
    });

    return () => {
      trigger.kill();
    };
  }, []);

  if (isLoading) return null;

  return (
    <header className="header" ref={headerRef}>
      <div className="header-container">
        {/* Logo và Brand */}
        <div className="header-brand" onClick={handleLogoClick}>
          <div className="logo" ref={logoRef}>
            <MdHealthAndSafety className="logo-icon" />
          </div>
          <div className="brand-text" ref={logoTitle}>
            <h1 className="brand-name">MediCare</h1>
            <p className="brand-tagline">Chăm sóc sức khỏe toàn diện</p>
          </div>
        </div>

        {/* Desktop Navigation */}
        <nav className="desktop-nav" ref={navRef}>
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
                <span className="nav-icon" >{item.icon}</span>
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
        <div className="header-actions" ref={navRef2}>
          {/* Đặt lịch */}
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
              <div className="user-dropdown" >
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
        <div className={`mobile-nav ${isMenuOpen ? 'open' : ''}`} >
          <div className="mobile-nav-header" >
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
              <span>Giỏ hàng</span>
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