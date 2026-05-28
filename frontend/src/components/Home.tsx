import React, { useState, useEffect, useRef } from 'react';
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
import { createConversation, getConversations, getMessages } from "../api/chatApi";
import { useNotification } from '../context/NotificationContext';
import { getAllNews } from '../api/newsApi';
import bg from '../assets/image/bg.png'; 
import slide1 from '../assets/image/slidebar1.png'; 
import slide2 from '../assets/image/slidebar2.png'; 
import slide3 from '../assets/image/slidebar3.png'; 
import gsap from 'gsap';
import { useChatStore } from '../hooks/useChat';
import { getAllSpecially } from '../api/specialyApi';

const Home = () => {
  const doctorSelectRef = useRef<HTMLDivElement | null>(null);
  const infoRef = useRef<HTMLDivElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const heroRef = useRef(null);

  const { user,doctor } = useAuthContext();
  const notify = useNotification();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSpecialty, setActiveSpecialty] = useState('all');
  const [currentSlide, setCurrentSlide] = useState(0);
  const [doctors, setDoctors] = useState<any[]>([])
  const [IndexDoctor, setIndexDoctor] = useState<number>(0)
  const [news, setNews] = useState<any[]>([])
  const [appointments, setAppointments] = useState<any[]>([])
  const [doctorLoading, setDoctorLoading] = useState(false);
  const [newsLoading, setNewsLoading] = useState(false);
  const [appoinmentLoading, setAppoinmentLoading] = useState(false);
  const [randomDoctors, setRandomDoctors] = useState<any[]>([]);
  const [specialty, setSpecialty] = useState<any>(null);
  const navigate = useNavigate();
  const [isHovering, setIsHovering] = useState(false);
  const {addConversation} = useChatStore();
  // Dữ liệu slider

const slides = [
  {
    id: 1,
    title: "Tư vấn y tế 24/7",
    description: "Kết nối với bác sĩ mọi lúc, mọi nơi",
    image: slide1,
    cta: "Đặt lịch ngay",
    color: "linear-gradient(135deg, #0E7490, #06B6D4)"
  },
  {
    id: 2,
    title: "Nhà thuốc trực tuyến",
    description: "Giao thuốc tận nhà trong 2 giờ",
    image: slide2,
    cta: "Mua thuốc",
    color: "linear-gradient(135deg, #1E40AF, #3B82F6)"
  },
  {
    id: 3,
    title: "Xét nghiệm tại nhà",
    description: "Lấy mẫu và trả kết quả tận nơi",
    image: slide3,
    cta: "Đặt dịch vụ",
    color: "linear-gradient(135deg, #059669, #10B981)"
  }
];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getAllSpecially();
        if (!data) return;
        const formatted = [
          ...data.map((s:any) => ({
              id: s._id,
              name: s.name,
              slug: s.slug,
              ...getSpecialtyStyle(s._id)
            })
          )
        ];
        setSpecialty(formatted);
      } catch (error) {
        notify.error("Có lỗi xảy ra vui lòng thử lại","Thông báo");
        console.log(error);
      }
    };
    fetchData();
  }, []);
  // Dữ liệu chuyên khoa
  const specialtyStyles = [
    {
      icon: <MdHealthAndSafety />,
      color: "#0E7490"
    },
    {
      icon: <FaHeartbeat />,
      color: "#DC2626"
    },
    {
      icon: <FaBrain />,
      color: "#7C3AED"
    },
    {
      icon: <FaTooth />,
      color: "#0891B2"
    },
    {
      icon: <FaBaby />,
      color: "#DB2777"
    },
    {
      icon: <FaEye />,
      color: "#EA580C"
    },
    {
      icon: <GiLungs />,
      color: "#65A30D"
    },
    {
      icon: <MdPsychology />,
      color: "#9333EA"
    },
    {
      icon: <FaProcedures />,
      color: "#0284C7"
    }
  ];

  const getSpecialtyStyle = (
    id: string
  ) => {

    let hash = 0;

    for (let i = 0; i < id.length; i++) {
      hash += id.charCodeAt(i);
    }

    return specialtyStyles[
      hash % specialtyStyles.length
    ];
  };

  useEffect(() => {
    if (isHovering || slides.length === 0) return;

      const interval = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % slides.length);
      }, 3000);

      return () => clearInterval(interval);
    }, [isHovering, slides.length]);

  useEffect(()=>{
      fetchNews();
      fetchDoctor();
      }
    ,[])

  useEffect(() => {
    if (doctors && doctors.length > 0) {
      const shuffled = [...doctors]
        .sort(() => 0.5 - Math.random())
        .slice(0, 10);

      setRandomDoctors(shuffled);
    }
  }, [doctors]);

    const fetchDoctor = async () => {
      try{
          setDoctorLoading(true)
          const data = await getDoctor();
          setDoctors(data);
        } catch (e) {
          console.log(e);
        } finally {
          setDoctorLoading(false);
        }
      }
    const fetchNews = async () => {
      try {
        setNewsLoading(true)
        const data = await getAllNews();
        setNews(data.news)
      } catch (e) {
        console.log(e)
      } finally {
        setNewsLoading(false)
      }
    }

  useEffect(() => {
    if (!user) return;

    const fetchAppointments = async () => {
      try {
        setAppoinmentLoading(true);

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
        setAppoinmentLoading(false);
      }
    };

    fetchAppointments();
  }, [user, doctor?._id]);

  // Xử lý tìm kiếm
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery)}`);
    }
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
    navigate(`/news/10-cach-tang-cuong-he`)
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

  const addSearchQuerry = async (query: string) => {
    setSearchQuery(query)
    navigate(`/products?search=${encodeURIComponent(query)}`);
  }
  const selectedDoctor = randomDoctors[IndexDoctor]

  const handleChat = async (doctor: any) => {
    if(!user) {
      notify.info("Vui lòng đăng nhập để sử dụng tính năng này", "thông báo")
      navigate("/login");
      return;
    }

    try {
      // lấy danh sách conversation trước
      const conversations = await getConversations();

      // kiểm tra đã có chat với doctor chưa
      const existingConversation = conversations.find(
        (c: any) => c.doctorId === doctor.userId._id || c.members?.includes(doctor.userId._id)
      );

      // nếu chưa có thì tạo mới
      let conversationId;

      if (!existingConversation) {
        const conversation = await createConversation(doctor.userId._id);
        const privateChat: any = {
        _id: conversation._id,
        type: "private",
        name: doctor.userId.fullName
          ? decodeURIComponent(doctor.userId.fullName)
          : "Bác sĩ",
        avatar: doctor.userId.image,
        lastMessage:
          conversation.lastMessage ||
          "Bắt đầu trò chuyện"
      };
        addConversation(privateChat)
        conversationId = conversation._id;
        notify.success("Đã tạo cuộc trò chuyện thành công", "Thông báo")
      } else {
        conversationId = existingConversation._id;
        notify.info("Bạn đã có cuộc trò chuyện với người này", "Thông báo")
      }

      // lấy tin nhắn của conversation
      await getMessages(conversationId);
    } catch (e) {
      console.log(e);
    }
  };
  // -----------------------ANIMATION------------------------
useEffect(() => {
  if (!doctorSelectRef.current) return;

  const tl = gsap.timeline();

  tl.to(doctorSelectRef.current, {
    opacity: 0,
    y: -20,
    duration: 0.25,
    ease: "power2.in",
  });

  tl.fromTo(
    doctorSelectRef.current,
    {
      opacity: 0,
      y: 20,
    },
    {
      opacity: 1,
      y: 0,
      duration: 4.6,
      ease: "power3.out",
    }
  );

  tl.fromTo(
    infoRef.current,
    {
      opacity: 0,
      x: 40,
    },
    {
      opacity: 1,
      x: 0,
      duration: 3.6,
      ease: "power3.out",
    },
    // "-=0.4"
  );
}, [selectedDoctor]);

useEffect(() => {
  if (!randomDoctors?.length) return;

  const interval = setInterval(() => {
    setIndexDoctor((prev) =>
      prev === randomDoctors.length - 1
        ? 0
        : prev + 1
    );
  }, 5000);

  return () => clearInterval(interval);
}, [randomDoctors]);

// useEffect(() => {
//   if (!scrollRef.current) return;

//   const container = scrollRef.current;

//   let animation: any;

//   if (!isHovering) {
//     animation = gsap.to(container, {
//       scrollLeft: container.scrollWidth,
//       duration: 20,
//       ease: "none",
//       repeat: -1,
//       modifiers: {
//         scrollLeft: (value) => {
//           const maxScroll =
//             container.scrollWidth -
//             container.clientWidth;

//           return `${parseFloat(value) % maxScroll}`;
//         },
//       },
//     });
//   }

//   return () => {
//     if (animation) animation.kill();
//   };
// }, [isHovering]);

const handleSlideHover = (el: any, isHovering: any) => {
  if (!el) return;

  const content = el.querySelector(".slide-content");

  gsap.to(el, {
    scale: isHovering ? 1.04 : 1,
    width: isHovering ? "102%" : "100%",
    height: isHovering ? "600px" : "100%",
    duration: 0.4,
    ease: "power3.out",
  });

  gsap.to(content, {
    y: isHovering ? -10 : 0,
    duration: 0.4,
    ease: "power3.out",
  });
};

const expandHero = () => {
  if (!heroRef.current) return;

  gsap.to(heroRef.current, {
    height: "500px",
    duration: 0.6,
    ease: "power3.out",
  });

  gsap.to(
    heroRef.current.querySelector(".hero-overlay"),
    {
      opacity: 0.25,
      duration: 0.6,
      ease: "power3.out",
    }
  );
};

const resetHero = () => {
  if (!heroRef.current) return;

  gsap.to(heroRef.current, {
    height: "420px",
    duration: 0.6,
    ease: "power3.out",
  });

  gsap.to(
    heroRef.current.querySelector(".hero-overlay"),
    {
      opacity: 0.5,
      duration: 0.6,
      ease: "power3.out",
    }
  );
};

  return (
    <div className="home-modern">

      {/* Main Content */}
      <div className="container main-container">
        {/* <img src={background} alt="" /> */}

        <div className="content-wrapper">
          {/* Main Content Area */}
          <main className="main-content">
            {/* Hero Search Section */}
            <section
              className="hero-section"
              ref={heroRef}
              style={{ "--bg-url": `url(${bg})` }}
            >
              <div className="hero-overlay"></div>

              <div className="hero-content">
                <h1 className="hero-title">
                  Tìm <span className="highlight">bác sĩ</span> và
                  <span className="highlight"> đặt lịch</span> dễ dàng
                </h1>

                <p className="hero-subtitle">
                  Kết nối với hơn 500 bác sĩ chuyên khoa
                  và 30+ dịch vụ y tế chất lượng cao
                </p>

                <form
                  className="search-form"
                  onSubmit={handleSearch}
                >
                  <div className="search-input-wrapper">
                    <FaSearch className="search-icon" />

                    <input
                      type="text"
                      placeholder="Tìm bác sĩ, chuyên khoa, triệu chứng..."
                      value={searchQuery}
                      onChange={(e) =>
                        setSearchQuery(e.target.value)
                      }
                      onFocus={expandHero}
                      onBlur={() => {
                        if (!searchQuery) resetHero();
                      }}
                      className="search-input"
                    />

                    <button
                      type="submit"
                      className="search-btn"
                    >
                      Tìm kiếm
                    </button>
                  </div>

                  <div className="search-tags">
                    <span>Phổ biến:</span>

                    <button
                      type="button"
                      className="tag"
                      onClick={() =>
                        addSearchQuerry("Omega")
                      }
                    >
                      Omega
                    </button>

                    <button
                      type="button"
                      className="tag"
                      onClick={() =>
                        addSearchQuerry("Vitamin")
                      }
                    >
                      Vitamin
                    </button>

                    <button
                      type="button"
                      className="tag"
                      onClick={() =>
                        addSearchQuerry("Men vi sinh")
                      }
                    >
                      Men vi sinh
                    </button>
                  </div>
                </form>
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
                {specialty && specialty.map((spec: any) => (
                  <button
                    key={spec.id}
                    className={`specialty-btn ${activeSpecialty === spec.id ? 'active' : ''}`}
                    onClick={() => {setActiveSpecialty(spec.id)
                      navigate(`/specialty/${spec.slug}`)
                    }}
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
              <div className="slider-container" >
                <div className="slider" style={{ transform: `translateX(-${currentSlide * 100}%)` }}>
                  {slides.map((slide) => (
 <div
    className="slide"
    key={slide.id}
    onMouseEnter={(e) => {
      setIsHovering(true);
      handleSlideHover(e.currentTarget, true);
    }}
    onMouseLeave={(e) => {
      setIsHovering(false);
      handleSlideHover(e.currentTarget, false);
    }}
    style={{
      backgroundImage: `
        linear-gradient(
          rgba(0,0,0,0.2),
          rgba(0,0,0,0.5)
        ),
        url(${slide.image})
      `,
      backgroundSize: "cover",
      backgroundPosition: "center",
    }}
  >
    <div className="slide-content">
      <h3 className="slide-title">
        {slide.title}
      </h3>

      <p className="slide-description">
        {slide.description}
      </p>

      <button className="slide-cta">
        {slide.cta}
        <FaArrowRight />
      </button>
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
              <div>
                {doctorLoading ? (
                  <div className="loading-state">
                    <i className="fas fa-spinner fa-spin"></i>
                    <p>Đang tải bác sĩ...</p>
                  </div>
                ) : (
                  <>                             
                <div className="doctor-select" >
                  <div className="doctor-select-left" ref={doctorSelectRef}>
                    <img
                      src={selectedDoctor?.userId?.image}
                      alt={selectedDoctor?.userId?.fullName}
                      className="doctor-select-avatar"
                    />
                  </div>

                  <div className="doctor-select-right" ref={infoRef}>
                    <span className="doctor-select-badge">
                      Đang hiển thị
                    </span>

                    <h2 className="doctor-select-name">
                      {selectedDoctor?.userId?.fullName}
                    </h2>

                    <p className="doctor-select-specialty">
                      {selectedDoctor?.specialtyId?.name}
                    </p>

                    <p className="doctor-select-specialty">
                      {selectedDoctor?.userId?.email}
                    </p>

                    <p className="doctor-select-specialty">
                      {selectedDoctor?.userId?.phone}
                    </p>
                    
                    <div className="doctor-select-rating">
                      {renderRating(selectedDoctor?.rating)}
                    </div>

                    <div className="doctor-select-meta">
                      <span>
                        Kinh nghiệm:
                        {selectedDoctor?.experienceYears} năm
                      </span>
                      <span>
                        Bằng cấp: {selectedDoctor?.qualifications?.length > 0
                          ? selectedDoctor.qualifications
                              .map((quali: any) => quali.name || quali)
                              .join(", ")
                          : "Chưa cập nhật"}
                      </span>
                      <span
                        className={`doctor-status ${
                          selectedDoctor?.isActive
                            ? "available"
                            : "busy"
                        }`}
                      >
                        {selectedDoctor?.isActive
                          ? "Hoạt động"
                          : "Bận"}
                      </span>
                    </div>
                  </div>
                </div>
                <div 
                  className="doctors-grid" 
                  ref={scrollRef}
                  onMouseEnter={() => setIsHovering(true)}
                  onMouseLeave={() => setIsHovering(false)}
                >

                  {doctors && doctors.length > 0 ? randomDoctors.map((doctor) => (
                    <div className="doctor-card" key={doctor._id}>
                      <div className="doctor-header">
                        <img src={doctor?.userId?.image} alt={doctor.name} className="doctor-avatar" />
                        <div className="doctor-info">
                          <h3 className="doctor-name">{doctor?.userId?.fullName}</h3>
                          <div className="doctor-specialty">{doctor?.specialtyId?.name}</div>
                          {renderRating(doctor.rating)}
                        </div>
                        <div className={`availability ${doctor.isActive ? 'available' : 'busy'}`}>
                          {doctor.isActive ? 'hoạt động' : 'Bận'}
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
                        <button className="action-btn secondary" onClick={() => handleChat(doctor)}>
                          <FaCommentMedical />
                          Tư vấn
                        </button>
                      </div>
                    </div>
                  ))
                  : 
                    <div className="loading-state">
                      <p>Không tìm thấy danh sách bác sĩ</p>
                    </div>
                    }
                </div>
              </>

                )}             
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

              <div>
                {newsLoading ? (
                  <div className="loading-state">
                    <i className="fas fa-spinner fa-spin"></i>
                    <p>Đang tải tin tức...</p>
                  </div>
                ) : (
              <div className="news-grid">
                  {news && news.length > 0 ? news.map((item) => (
                    <div className="news-card" key={item._id}>
                      <div className="news-image">
                          <img src={item.thumbnail} alt="" />

                        <span className="news-category">{item.category.name}</span>
                      </div>
                      <div className="news-content">
                        <div className="news-meta">
                          <span className="news-date">{item.createAt}</span>
                          {/* <span className="news-read-time">{item.readTime} đọc</span> */}
                        </div>
                        <h3 className="news-title">{item.title}</h3>
                        <p className="news-excerpt">{item.summary.slice(0,80)}...</p>
                        <button className="read-more" onClick={() => handleReadNews(item._id)}>
                          Đọc thêm <FaArrowRight />
                        </button>
                      </div>
                    </div>
                  ))  : 
                  <div className="loading-state">
                    <p>Không tìm thấy danh sách tin tức</p>
                  </div> 
                  }
                    </div>
                )}
              </div>
            </section>
          </main>

          {/* Sidebar */}
          {/* <aside className="sidebar">
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
                    <div className="stat-number">{user?.gender === 'nam' || 'male'  ? 'Nam' : 'Nữ'}</div>
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
            )} */}

            {/* {user && appointments.length > 0 && (
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
                        <h4>{appointment.doctorId.userId.fullName}</h4>
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
            )} */}

            {/* Quick Actions */}
            {/* <div className="sidebar-card quick-actions-card">
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
            </div> */}

            {/* Emergency Contact */}
            {/* <div className="sidebar-card emergency-card">
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
            </div> */}

            {/* Health Tips */}
            {/* <div className="sidebar-card tips-card">
              <h3>Mẹo sức khỏe hôm nay</h3>
              <div className="health-tip">
                <div className="tip-icon">💧</div>
                <div className="tip-content">
                  <h4>Uống đủ nước</h4>
                  <p>Uống 2 lít nước mỗi ngày giúp cơ thể hoạt động tốt và da đẹp hơn</p>
                </div>
              </div>
            </div> */}

          {/* </aside> */}
        </div>
      </div>
    </div>
  );
};

export default Home;