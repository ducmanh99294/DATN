import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import '../assets/specialty.css';
import type { Doctor } from './BookingFlow';
import { getSpeciallyBySlug } from '../api/specialyApi';
import { useNotify } from '../hooks/useNotification';

interface Specialty {
  _id: string;
  name: string;
  slug: string;
  bannerImage: string;
  icon: string;
  description: string;
  longDescription: string;
  overview: string;
  symptoms: string[];
  treatments: string[];
  technologies: string[];
  stats: {
    doctors: number;
    patients: number;
    yearsExperience: number;
    successRate: number;
  };
  faqs: {
    question: string;
    answer: string;
  }[];
}

const Specialty = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  
  const [specialty, setSpecialty] = useState<Specialty | null>(null);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [filteredDoctors, setFilteredDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [showDoctorModal, setShowDoctorModal] = useState(false);
  const [filterExperience, setFilterExperience] = useState<string>('all');
  const [filterRating, setFilterRating] = useState<number>(0);
  const [filterAvailability, setFilterAvailability] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<string>('experience');
  const notify = useNotify();
  useEffect(() => {
  if (!slug) return;
  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Lấy chuyên khoa theo slug
      const data = await getSpeciallyBySlug(slug);

      if (!data || !data.specialty) return;
      const specialty = data.specialty;

      setSpecialty(specialty);
      setDoctors(data.doctors || []);
      setFilteredDoctors(data.doctors || []);

    } catch (error) {
      notify.error('thông báo', 'có lỗi xảy ra vui lòng thử lại')
      console.error("Lỗi khi load chuyên khoa:", error);
    } finally {
      setLoading(false);
    }
  };

  fetchData();
}, [slug]);
useEffect(() => {
    // Apply filters
    let filtered = [...doctors];

    if (filterExperience !== 'all') {
      const [min, max] = filterExperience.split('-').map(Number);
      filtered = filtered.filter(doc => 
        max ? doc.experience >= min && doc.experience <= max : doc.experience >= min
      );
    }

    if (filterRating > 0) {
      filtered = filtered.filter(doc => doc.rating >= filterRating);
    }

    if (filterAvailability) {
      filtered = filtered.filter(doc => doc.availableToday);
    }

    // Apply sorting
    switch (sortBy) {
      case 'experience':
        filtered.sort((a, b) => b.experience - a.experience);
        break;
      case 'rating':
        filtered.sort((a, b) => b.rating - a.rating);
        break;
      case 'fee-asc':
        filtered.sort((a, b) => a.consultationFee - b.consultationFee);
        break;
      case 'fee-desc':
        filtered.sort((a, b) => b.consultationFee - a.consultationFee);
        break;
      default:
        break;
    }

    setFilteredDoctors(filtered);
  }, [doctors, filterExperience, filterRating, filterAvailability, sortBy]);

  const handleBookAppointment = (doctor: Doctor) => {
    navigate(`/booking?doctor=${doctor._id}`);
  };

  const handleViewDoctorProfile = (doctor: Doctor) => {
    setSelectedDoctor(doctor);
    setShowDoctorModal(true);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN').format(price) + '₫';
  };

  const renderDoctorModal = () => {
    if (!selectedDoctor) return null;
    return (
      <div className="modal-overlay" onClick={() => setShowDoctorModal(false)}>
        <div className="modal-content doctor-modal" onClick={e => e.stopPropagation()}>
          <button className="modal-close" onClick={() =>{ setShowDoctorModal(false),setSelectedDoctor(null)}}>
            <i className="fas fa-times"></i>
          </button>

          <div className="doctor-profile">
            <div className="profile-header">
              <img src={selectedDoctor.userId.image} alt={selectedDoctor.userId.fullName} />
              <div className="profile-header-info">
                <h2>{selectedDoctor.userId.fullName}</h2>
                <p className="doctor-title">{selectedDoctor.description}</p>
                <div className="doctor-specialty-badge">
                  <i className="fas fa-stethoscope"></i>
                  {selectedDoctor.specialty}
                </div>
                <div className="profile-stats">
                  <div className="profile-stat">
                    <i className="fas fa-star"></i>
                    <div>
                      <strong>{selectedDoctor.rating}</strong>
                      <span>{selectedDoctor.totalReviews} đánh giá</span>
                    </div>
                  </div>
                  <div className="profile-stat">
                    <i className="fas fa-briefcase"></i>
                    <div>
                      <strong>{selectedDoctor.experienceYears} năm</strong>
                      <span>Kinh nghiệm</span>
                    </div>
                  </div>
                  <div className="profile-stat">
                    <i className="fas fa-users"></i>
                    {/* <div>
                      <strong>{selectedDoctor.patientsCount}+</strong>
                      <span>Bệnh nhân</span>
                    </div> */}
                  </div>
                </div>
              </div>
            </div>

            <div className="profile-body">
              <div className="profile-section">
                <h3>
                  <i className="fas fa-user-md"></i>
                  Giới thiệu
                </h3>
                <p>{selectedDoctor.description}</p>
              </div>

              <div className="profile-section">
                <h3>
                  <i className="fas fa-graduation-cap"></i>
                  Học vấn & Chứng chỉ
                </h3>
                <ul>
                  {selectedDoctor.qualifications.map((qual, index) => (
                    <li key={index}>
                      <i className="fas fa-check-circle"></i>
                      {qual}
                    </li>
                  ))}
                </ul>
              </div>

              {/* <div className="profile-section">
                <h3>
                  <i className="fas fa-trophy"></i>
                  Thành tựu
                </h3>
                <ul>
                  {selectedDoctor.achievements.map((achievement, index) => (
                    <li key={index}>
                      <i className="fas fa-award"></i>
                      {achievement}
                    </li>
                  ))}
                </ul>
              </div> */}

              {/* <div className="profile-section">
                <h3>
                  <i className="fas fa-language"></i>
                  Ngôn ngữ
                </h3>
                <div className="languages">
                  {selectedDoctor.languages.map((lang, index) => (
                    <span key={index} className="language-tag">{lang}</span>
                  ))}
                </div>
              </div> */}
            </div>

            <div className="profile-footer">
              <div className="consultation-fee">
                <span>Phí khám:</span>
                <strong>{formatPrice(selectedDoctor.price)}</strong>
              </div>
              <div className="profile-actions">
                <button 
                  className="btn-book"
                  onClick={() => {
                    setShowDoctorModal(false);
                    handleBookAppointment(selectedDoctor);
                  }}
                >
                  <i className="fas fa-calendar-check"></i>
                  Đặt lịch ngay
                </button>
                <button className="btn-chat">
                  <i className="fas fa-comment-medical"></i>
                  Tư vấn
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="loading-container">
        <i className="fas fa-spinner fa-spin"></i>
        <p>Đang tải thông tin chuyên khoa...</p>
      </div>
    );
  }

  if (!specialty) {
    return (
      <div className="not-found-container">
        <i className="fas fa-exclamation-circle"></i>
        <h2>Không tìm thấy chuyên khoa</h2>
        <p>Chuyên khoa bạn đang tìm không tồn tại.</p>
        <button onClick={() => navigate('/')}>Về trang chủ</button>
      </div>
    );
  }

  return (
    <div className="specialty-container">
      {/* Banner */}
      <div className="specialty-banner">
        <img src={specialty.bannerImage} alt={specialty.name} />
        <div className="banner-overlay">
          <div className="container">
            <div className="banner-content">
              {/* <div className="specialty-icon">
                <i className={specialty.icon}></i>
              </div> */}
              <h1>Chuyên khoa {specialty.name}</h1>
              <p>{specialty.description}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container">
        {/* Stats */}
        <div className="specialty-stats">
          <div className="stat-item">
            <div className="stat-icon">
              <i className="fas fa-user-md"></i>
            </div>
            <div className="stat-info">
              <div className="stat-value">{doctors.length || 0}+</div>
              <div className="stat-label">Bác sĩ chuyên khoa</div>
            </div>
          </div>
          <div className="stat-item">
            <div className="stat-icon">
              <i className="fas fa-users"></i>
            </div>
            <div className="stat-info">
              <div className="stat-value">{doctors.filter(d => d.isActive).length || 0}+</div>
              <div className="stat-label">Bác sĩ đang rảnh</div>
            </div>
          </div>
          <div className="stat-item">
            <div className="stat-icon">
              <i className="fas fa-calendar-alt"></i>
            </div>
            <div className="stat-info">
              <div className="stat-value">{doctors.length > 0 ? Math.round(doctors.reduce((sum, d) => sum + (d.experienceYears || 0), 0) / doctors.length) : 0}+</div>
              <div className="stat-label">Số năm kinh nghiệm trung bình</div>
            </div>
          </div>
          {/* <div className="stat-item">
            <div className="stat-icon">
              <i className="fas fa-chart-line"></i>
            </div>
            <div className="stat-info">
              <div className="stat-value">{specialty.stats?.successRate || 0}%</div>
              <div className="stat-label">Tỉ lệ thành công</div>
            </div>
          </div> */}
        </div>

        {/* Tabs */}
        <div className="specialty-tabs">
          <button 
            className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <i className="fas fa-info-circle"></i>
            Tổng quan
          </button>
          <button 
            className={`tab ${activeTab === 'doctors' ? 'active' : ''}`}
            onClick={() => setActiveTab('doctors')}
          >
            <i className="fas fa-user-md"></i>
            Đội ngũ bác sĩ ({doctors.length})
          </button>
        </div>

        {/* Tab Content */}
        <div className="tab-content">
          {activeTab === 'overview' && (
            <div className="overview-tab">
              <div className="overview-section">
                <h2>Giới thiệu chuyên khoa {specialty.name}</h2>
                <p>{specialty.description}</p>
              </div>

              {/* <div className="overview-section">
                <h3>Phương pháp điều trị</h3>
                <div className="treatments-grid">
                  {specialty.treatments.map((treatment, index) => (
                    <div key={index} className="treatment-item">
                      <i className="fas fa-check-circle"></i>
                      {treatment}
                    </div>
                  ))}
                </div>
              </div> */}
            </div>
          )}

          {activeTab === 'doctors' && (
            <div className="doctors-tab">
              <div className="doctors-filters">
                <div className="filter-group">
                  <label>Kinh nghiệm</label>
                  <select value={filterExperience} onChange={(e) => setFilterExperience(e.target.value)}>
                    <option value="all">Tất cả</option>
                    <option value="0-5">0-5 năm</option>
                    <option value="5-10">5-10 năm</option>
                    <option value="10-15">10-15 năm</option>
                    <option value="15">Trên 15 năm</option>
                  </select>
                </div>

                <div className="filter-group">
                  <label>Đánh giá</label>
                  <select value={filterRating} onChange={(e) => setFilterRating(Number(e.target.value))}>
                    <option value="0">Tất cả</option>
                    <option value="4">4 sao trở lên</option>
                    <option value="4.5">4.5 sao trở lên</option>
                    <option value="4.8">4.8 sao trở lên</option>
                  </select>
                </div>

                <div className="filter-group">
                  <label>Sắp xếp</label>
                  <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                    <option value="experience">Kinh nghiệm (cao → thấp)</option>
                    <option value="rating">Đánh giá (cao → thấp)</option>
                    <option value="fee-asc">Phí khám (thấp → cao)</option>
                    <option value="fee-desc">Phí khám (cao → thấp)</option>
                  </select>
                </div>

                <div className="filter-group availability-filter">
                  <label className="checkbox-label">
                    <input 
                      type="checkbox" 
                      checked={filterAvailability}
                      onChange={(e) => setFilterAvailability(e.target.checked)}
                    />
                    <span className="checkbox-text">Chỉ hiện bác sĩ có lịch hôm nay</span>
                  </label>
                </div>
              </div>

              <div className="doctors-grid">
                {filteredDoctors.map(doctor => (
                  <div key={doctor._id} className="doctor-card">
                    <div className="doctor-card-header">
                      <img src={doctor.userId.image} alt={doctor.userId.fullName} />
                      {doctor.availableToday && (
                        <span className="available-badge">
                          <i className="fas fa-check-circle"></i>
                          Có lịch hôm nay
                        </span>
                      )}
                    </div>
                    
                    <div className="doctor-card-body">
                      <h3>{doctor.userId.fullName}</h3>
                      <p className="doctor-title">{doctor.description}</p>
                      <p className="doctor-specialty">{doctor.specialty}</p>
                      
                      {/* <div className="doctor-rating">
                        <i className="fas fa-star"></i>
                        <span>{doctor.rating}</span>
                        <span className="rating-count">({doctor.totalReviews} đánh giá)</span>
                      </div> */}

                      <div className="doctor-experience">
                        <i className="fas fa-briefcase"></i>
                        {doctor.experienceYears} năm kinh nghiệm
                      </div>

                      {/* <div className="doctor-patients">
                        <i className="fas fa-users"></i>
                        {doctor.patientsCount.toLocaleString()} bệnh nhân
                      </div> */}

                      <div className="doctor-fee">
                        <span>Phí khám:</span>
                        <strong>{formatPrice(doctor.price)}</strong>
                      </div>

                      <div className="doctor-qualifications">
                        {doctor.qualifications.slice(0, 2).map((qual, index) => (
                          <div key={index} className="qualification">
                            <i className="fas fa-check"></i>
                            {qual}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="doctor-card-footer">
                      <button 
                        className="btn-profile"
                        onClick={() => handleViewDoctorProfile(doctor)}
                      >
                        <i className="fas fa-user-md"></i>
                        Xem hồ sơ
                      </button>
                      <button 
                        className="btn-book"
                        onClick={() => handleBookAppointment(doctor)}
                      >
                        <i className="fas fa-calendar-check"></i>
                        Đặt lịch
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {filteredDoctors.length === 0 && (
                <div className="no-doctors">
                  <i className="fas fa-user-md"></i>
                  <h3>Không tìm thấy bác sĩ</h3>
                  <p>Không có bác sĩ nào phù hợp với tiêu chí bạn chọn.</p>
                  <button 
                    className="reset-filters"
                    onClick={() => {
                      setFilterExperience('all');
                      setFilterRating(0);
                      setFilterAvailability(false);
                      setSortBy('experience');
                    }}
                  >
                    Xóa bộ lọc
                  </button>
                </div>
              )}
            </div>
          )}

          {/* {activeTab === 'faq' && (
            <div className="faq-tab">
              <h2>Câu hỏi thường gặp về {specialty.name}</h2>
              <div className="faq-list">
                {specialty.faqs.map((faq, index) => (
                  <div key={index} className="faq-item">
                    <div className="faq-question">
                      <i className="fas fa-question-circle"></i>
                      {faq.question}
                    </div>
                    <div className="faq-answer">
                      <i className="fas fa-answer-circle"></i>
                      {faq.answer}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )} */}
        </div>

        {/* CTA Section */}
        <div className="specialty-cta">
          <div className="cta-content">
            <h2>Cần tư vấn về sức khỏe {specialty.name}?</h2>
            <p>Đội ngũ bác sĩ chuyên khoa của chúng tôi luôn sẵn sàng hỗ trợ bạn</p>
            <div className="cta-buttons">
              <button 
                className="btn-primary"
                onClick={() => setActiveTab('doctors')}
              >
                <i className="fas fa-user-md"></i>
                Xem danh sách bác sĩ
              </button>
              <button 
                className="btn-secondary"
                onClick={() => navigate('/booking')}
              >
                <i className="fas fa-calendar-check"></i>
                Đặt lịch ngay
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Doctor Profile Modal */}
      {renderDoctorModal()}
    </div>
  );
};

export default Specialty;