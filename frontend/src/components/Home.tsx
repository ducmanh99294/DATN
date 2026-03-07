import React, { useState, useEffect } from 'react';
import '../assets/home.css';
import { 
  FaSearch, 
  FaCalendarCheck, 
  FaUserMd, 
  FaStethoscope, 
  FaHeartbeat,
  FaBrain,
  FaTooth,
  FaEye,
  FaBaby,
  FaArrowRight,
  FaClock,
  FaStar,
  FaRegStar,
  FaChevronLeft,
  FaChevronRight,
  FaNewspaper,
  FaCommentMedical,
  FaPrescriptionBottle,
  FaClinicMedical,
  FaProcedures,
  FaPhoneAlt
} from 'react-icons/fa';
import { 
  MdHealthAndSafety, 
  MdEventAvailable,
  MdOutlineScience,
  MdPsychology
} from 'react-icons/md';
import { GiLungs } from 'react-icons/gi';
import { getDoctor } from '../api/doctorApi';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../context/AuthContext';
import { confirmAppointmentApi, getDoctorAppointments, getMyAppointment } from '../api/appointmentApi';
import { useNotification } from '../context/NotificationContext';
import { getMe } from '../api/authApi';

const Home = () => {
  const { user,doctor } = useAuthContext();
  const notify = useNotification();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSpecialty, setActiveSpecialty] = useState('all');
  const [currentSlide, setCurrentSlide] = useState(0);
  // const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [doctors, setDoctors] = useState<any[]>([])
  const [appointments, setAppointments] = useState<any[]>([])
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Dữ liệu slider
  const slides = [
    {
      id: 1,
      title: "Tư vấn y tế 24/7",
      description: "Kết nối với bác sĩ mọi lúc, mọi nơi",
      image: "https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=1200",
      cta: "Đặt lịch ngay",
      color: "linear-gradient(135deg, #0E7490, #06B6D4)"
    },
    {
      id: 2,
      title: "Nhà thuốc trực tuyến",
      description: "Giao thuốc tận nhà trong 2 giờ",
      image: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=1200",
      cta: "Mua thuốc",
      color: "linear-gradient(135deg, #1E40AF, #3B82F6)"
    },
    {
      id: 3,
      title: "Xét nghiệm tại nhà",
      description: "Lấy mẫu và trả kết quả tận nơi",
      image: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w-1200",
      cta: "Đặt dịch vụ",
      color: "linear-gradient(135deg, #059669, #10B981)"
    }
  ];

  // Dữ liệu chuyên khoa
  const specialties = [
    { id: 'all', name: 'Tất cả', icon: <MdHealthAndSafety />, color: '#0E7490' },
    { id: 'cardiology', name: 'Tim mạch', icon: <FaHeartbeat />, color: '#DC2626' },
    { id: 'neurology', name: 'Thần kinh', icon: <FaBrain />, color: '#7C3AED' },
    { id: 'dentistry', name: 'Răng hàm mặt', icon: <FaTooth />, color: '#0891B2' },
    { id: 'pediatrics', name: 'Nhi khoa', icon: <FaBaby />, color: '#DB2777' },
    { id: 'ophthalmology', name: 'Mắt', icon: <FaEye />, color: '#EA580C' },
    { id: 'pulmonology', name: 'Hô hấp', icon: <GiLungs />, color: '#65A30D' },
    { id: 'psychology', name: 'Tâm lý', icon: <MdPsychology />, color: '#9333EA' },
    { id: 'surgery', name: 'Ngoại khoa', icon: <FaProcedures />, color: '#0284C7' }
  ];

  useEffect(()=>{
    const fetchDoctor = async () => {
      try{
          setLoading(true)
          const data = await getDoctor();
          setDoctors(data);
        } catch (e) {
          console.log(e);
        } finally {
          setLoading(false);
        }
      }
      fetchDoctor();
      }
    ,[])

  useEffect(() => {
    if (!user) return;

    const fetchAppointments = async () => {
      try {
        setLoading(true);

        if (user.role === 'patient') {
          const data = await getMyAppointment();
          setAppointments(data);
        }

        if (user.role === 'doctor' && doctor?._id) {
          console.log("Fetching appointments for doctor ID:", doctor._id);
          const data = await getDoctorAppointments();
          setAppointments(data);
        }
      } catch (e) {
        console.log(e);
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, [user, doctor?._id]);
    
  // Dữ liệu tin tức
  const news = [
    {
      id: 1,
      title: "Phát hiện mới trong điều trị ung thư",
      excerpt: "Công nghệ CRISPR mở ra hy vọng mới cho bệnh nhân ung thư giai đoạn cuối...",
      category: "Nghiên cứu",
      date: "15/12/2024",
      readTime: "5 phút",
      image: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400"
    },
    {
      id: 2,
      title: "Cách phòng chống sốt xuất huyết mùa mưa",
      excerpt: "Các biện pháp hiệu quả giúp bảo vệ gia đình bạn khỏi sốt xuất huyết...",
      category: "Phòng bệnh",
      date: "12/12/2024",
      readTime: "3 phút",
      image: "https://images.unsplash.com/photo-1584467735871-8db9ac8f1f7a?w=400"
    },
    {
      id: 3,
      title: "Xu hướng y tế số 2025",
      excerpt: "AI và IoT đang thay đổi cách chúng ta tiếp cận dịch vụ y tế...",
      category: "Công nghệ",
      date: "10/12/2024",
      readTime: "7 phút",
      image: "https://images.unsplash.com/photo-1551601651-2a8555f1a136?w=400"
    }
  ];

  // Dữ liệu lịch đã đặt (nếu đã đăng nhập)
  // const appointments = [
  //   {
  //     id: 1,
  //     doctor: "TS.BS. Nguyễn Văn An",
  //     specialty: "Tim mạch",
  //     date: "20/12/2024",
  //     time: "09:00",
  //     status: "confirmed"
  //   },
  //   {
  //     id: 2,
  //     doctor: "ThS.BS. Trần Thị Bình",
  //     specialty: "Nhi khoa",
  //     date: "22/12/2024",
  //     time: "14:30",
  //     status: "pending"
  //   }
  // ];

  // Dữ liệu stats
  const stats = [
    { label: "Bác sĩ", value: "500+", icon: <FaUserMd /> },
    { label: "Chuyên khoa", value: "30+", icon: <FaStethoscope /> },
    { label: "Bệnh nhân", value: "50.000+", icon: <FaHeartbeat /> },
    { label: "Đánh giá", value: "4.9/5", icon: <FaStar /> }
  ];

  // Xử lý tìm kiếm
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/products?q=${encodeURIComponent(searchQuery)}`;
    }
  };

  // Trạng thái lịch hẹn
    const status: Record<string,{ label: string; className: string }> = {
    pending: {
      label: 'Chờ xác nhận',
      className: 'pending',
    },
    confirmed: {
      label: 'Đã xác nhận',
      className: 'confirmed',
    },
    completed: {
      label: 'Hoàn thành',
      className: 'completed',
    },
    cancelled: {
      label: 'Đã hủy',
      className: 'cancelled',
    },
  };

  // Xử lý slider
  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  // Xử lý đặt lịch
  const handleBookAppointment = () => {
    navigate('/booking');
  };

  // xử lí xác nhận lịch
  const handleConfirmed = async (appointmentId: string) => {
    try {
      await confirmAppointmentApi(appointmentId);
      // Refresh appointments list
      const data = await getMyAppointment();
      setAppointments(data);
    } catch (error) {
      console.log(error);
    }
  };

  // Xử lý xem chi tiết tin tức
  const handleReadNews = (newsId: number) => {
    console.log(`Đọc tin tức ${newsId}`);
  };

  // Render rating stars
  const renderRating = (rating: number) => {
    return (
      <div className="rating">
        {[...Array(5)].map((_, i) => (
          i < Math.floor(rating) ? 
            <FaStar key={i} className="star filled" /> : 
            <FaRegStar key={i} className="star" />
        ))}
        <span className="rating-text">{rating}</span>
      </div>
    );
  };
  return (
    <div className="home-modern">

      {/* Main Content */}
      <div className="container main-container">
        <div className="content-wrapper">
          {/* Main Content Area */}
          <main className="main-content">
            {/* Hero Search Section */}
            <section className="hero-section">
              <div className="hero-content">
                <h1 className="hero-title">
                  Tìm <span className="highlight">bác sĩ</span> và 
                  <span className="highlight"> đặt lịch</span> dễ dàng
                </h1>
                <p className="hero-subtitle">
                  Kết nối với hơn 500 bác sĩ chuyên khoa và 30+ dịch vụ y tế chất lượng cao
                </p>
                
                <form className="search-form" onSubmit={handleSearch}>
                  <div className="search-input-wrapper">
                    <FaSearch className="search-icon" />
                    <input
                      type="text"
                      placeholder="Tìm bác sĩ, chuyên khoa, triệu chứng..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="search-input"
                    />
                    <button type="submit" className="search-btn">
                      Tìm kiếm
                    </button>
                  </div>
                  <div className="search-tags">
                    <span>Phổ biến:</span>
                    <button type="button" className="tag">Tim mạch</button>
                    <button type="button" className="tag">Nhi khoa</button>
                    <button type="button" className="tag">Da liễu</button>
                    <button type="button" className="tag">Xét nghiệm</button>
                  </div>
                </form>

                <div className="hero-stats">
                  {stats.map((stat, index) => (
                    <div className="stat-item" key={index}>
                      <div className="stat-icon">{stat.icon}</div>
                      <div className="stat-content">
                        <div className="stat-value">{stat.value}</div>
                        <div className="stat-label">{stat.label}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Specialty Filter */}
            <section className="specialty-section">
              <div className="section-header">
                <h2 className="section-title">
                  <FaStethoscope className="title-icon" />
                  Chuyên khoa
                </h2>
                <button className="view-all">
                  Xem tất cả <FaArrowRight />
                </button>
              </div>
              
              <div className="specialty-filter">
                {specialties.map((spec) => (
                  <button
                    key={spec.id}
                    className={`specialty-btn ${activeSpecialty === spec.id ? 'active' : ''}`}
                    onClick={() => setActiveSpecialty(spec.id)}
                    style={{ '--spec-color': spec.color } as React.CSSProperties}
                  >
                    <div className="spec-icon" style={{ color: spec.color }}>
                      {spec.icon}
                    </div>
                    <span className="spec-name">{spec.name}</span>
                  </button>
                ))}
              </div>
            </section>

            {/* Slider Section */}
            <section className="slider-section">
              <div className="slider-container">
                <div className="slider" style={{ transform: `translateX(-${currentSlide * 100}%)` }}>
                  {slides.map((slide) => (
                    <div 
                      className="slide" 
                      key={slide.id}
                      style={{ background: slide.color }}
                    >
                      <div className="slide-content">
                        <h3 className="slide-title">{slide.title}</h3>
                        <p className="slide-description">{slide.description}</p>
                        <button className="slide-cta">
                          {slide.cta} <FaArrowRight />
                        </button>
                      </div>
                      <div className="slide-image">
                        <div className="image-placeholder" />
                      </div>
                    </div>
                  ))}
                </div>
                <button className="slider-nav prev" onClick={prevSlide}>
                  <FaChevronLeft />
                </button>
                <button className="slider-nav next" onClick={nextSlide}>
                  <FaChevronRight />
                </button>
                <div className="slider-dots">
                  {slides.map((_, index) => (
                    <button
                      key={index}
                      className={`dot ${index === currentSlide ? 'active' : ''}`}
                      onClick={() => setCurrentSlide(index)}
                    />
                  ))}
                </div>
              </div>
            </section>

            {/* Doctors Section */}
            <section className="doctors-section">
              <div className="section-header">
                <h2 className="section-title">
                  <FaUserMd className="title-icon" />
                  Bác sĩ nổi bật
                </h2>
                <button className="view-all">
                  Xem tất cả <FaArrowRight />
                </button>
              </div>
              
              <div className="doctors-grid">
                {doctors.map((doctor) => (
                  <div className="doctor-card" key={doctor._id}>
                    <div className="doctor-header">
                      <img src={doctor?.userId?.image} alt={doctor.name} className="doctor-avatar" />
                      <div className="doctor-info">
                        <h3 className="doctor-name">{doctor?.userId?.fullName}</h3>
                        <div className="doctor-specialty">{doctor.specialtyId.name}</div>
                        {renderRating(doctor.rating)}
                      </div>
                      <div className={`availability ${doctor.isActive ? 'available' : 'busy'}`}>
                        {doctor.isActive ? 'Có lịch' : 'Bận'}
                      </div>
                    </div>
                    
                    <div className="doctor-details">
                      <div className="detail-item">
                        <FaClock className="detail-icon" />
                        <span>Kinh nghiệm: {doctor.experienceYears}</span>
                      </div>
                      <div className="detail-item">
                        <MdEventAvailable className="detail-icon" />
                        {/* <span>Đã khám: {doctor.appointments.toLocaleString()}</span> */}
                      </div>
                    </div>
                    
                    <div className="doctor-actions">
                      <button className="action-btn primary" onClick={() => handleBookAppointment()}>
                        <FaCalendarCheck />
                        Đặt lịch ngay
                      </button>
                      <button className="action-btn secondary">
                        <FaCommentMedical />
                        Tư vấn
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* News Section */}
            <section className="news-section">
              <div className="section-header">
                <h2 className="section-title">
                  <FaNewspaper className="title-icon" />
                  Tin tức y tế
                </h2>
                <button type="button" className="view-all" onClick={() => navigate('/news')}>
                  Xem tất cả <FaArrowRight />
                </button>
              </div>
              
              <div className="news-grid">
                {news.map((item) => (
                  <div className="news-card" key={item.id}>
                    <div className="news-image">
                      <div className="image-placeholder" />
                      <span className="news-category">{item.category}</span>
                    </div>
                    <div className="news-content">
                      <div className="news-meta">
                        <span className="news-date">{item.date}</span>
                        <span className="news-read-time">{item.readTime} đọc</span>
                      </div>
                      <h3 className="news-title">{item.title}</h3>
                      <p className="news-excerpt">{item.excerpt}</p>
                      <button className="read-more" onClick={() => handleReadNews(item.id)}>
                        Đọc thêm <FaArrowRight />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </main>

          {/* Sidebar */}
          <aside className="sidebar">
            {/* User Info Card (if logged in) */}
            {user && (
              <div className="sidebar-card user-card">
                <div className="user-header">
                  <img src={user?.image} alt={user?.fullName} className="user-sidebar-avatar" />
                  <div className="user-sidebar-info">
                    <h3>{user?.fullName}</h3>
                  </div>
                </div>
                <div className="user-stats">
                  <div className="user-stat">
                    <div className="stat-number">{user?.gender === 'male' ? 'Nam' : 'Nữ'}</div>
                    <div className="stat-label">Giới tính</div>
                  </div>
                  <div className="user-stat">
                    <div className="stat-number">{user?.phone}</div>
                    <div className="stat-label">Số điện thoại</div>
                  </div>
                  <div className="user-stat">
                    <div className="stat-number">{user?.createdAt.slice(0, 10)}</div>
                    <div className="stat-label">Ngày tham gia</div>
                  </div>
                </div>
              </div>
            )}

            {/* Upcoming Appointments */}
            {user && appointments.length > 0 && (
              <div className="sidebar-card appointments-card">
                <div className="card-header">
                  <h3>
                    <FaCalendarCheck />
                    Lịch hẹn sắp tới
                  </h3>
                  <button className="view-all-btn">Tất cả</button>
                </div>
                
                <div className="appointments-list">
                  {appointments.map((appointment) => (
                    <div className="appointment-item" key={appointment._id}>
                      <div className="appointment-header">
                        <h4>{appointment.doctor}</h4>
                        <span className={`status ${appointment.status}`}>
                          {status[appointment.status]?.label || appointment.status}
                        </span>
                      </div>
                      <div className="appointment-details">
                        <span className="detail">
                          <FaStethoscope /> {appointment.specialtyId.name}
                        </span>
                        <span className="detail">
                          <FaClock /> {appointment?.slotId[0].date.slice(0, 10)} • {appointment?.slotId[0].startTime}
                        </span>
                      </div>
                      <div className="appointment-actions">
                        <button className="action-btn small">Chi tiết</button>
                        <button className="action-btn small outline"
                        onClick={() => handleConfirmed(appointment._id)}
                        >{doctor?._id ? "xác nhận" : "Hủy lịch"}</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="sidebar-card quick-actions-card">
              <h3>Thao tác nhanh</h3>
              <div className="quick-actions">
                <button className="quick-action"  onClick={() => {navigate("/orders")}}>
                  <FaPrescriptionBottle />
                  <span>Đơn thuốc của tôi</span>
                </button>
                <button className="quick-action">
                  <FaClinicMedical />
                  <span>Phòng khám gần nhất</span>
                </button>
                <button className="quick-action">
                  <MdOutlineScience />
                  <span>Kết quả xét nghiệm</span>
                </button>
                <button className="quick-action">
                  <MdHealthAndSafety />
                  <span>Bảo hiểm y tế</span>
                </button>
              </div>
            </div>

            {/* Emergency Contact */}
            <div className="sidebar-card emergency-card">
              <h3>
                <FaHeartbeat className="emergency-icon" />
                Cấp cứu 24/7
              </h3>
              <div className="emergency-info">
                <div className="emergency-number">115</div>
                <p>Gọi ngay khi cần hỗ trợ y tế khẩn cấp</p>
                <button className="emergency-btn">
                  <FaPhoneAlt />
                  Gọi cấp cứu
                </button>
              </div>
            </div>

            {/* Health Tips */}
            <div className="sidebar-card tips-card">
              <h3>Mẹo sức khỏe hôm nay</h3>
              <div className="health-tip">
                <div className="tip-icon">💧</div>
                <div className="tip-content">
                  <h4>Uống đủ nước</h4>
                  <p>Uống 2 lít nước mỗi ngày giúp cơ thể hoạt động tốt và da đẹp hơn</p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default Home;