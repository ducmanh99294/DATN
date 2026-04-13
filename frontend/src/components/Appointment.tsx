import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../assets/appoinment.css';
import { getDoctorAppointments, getMyAppointment, cancelAppointment } from '../api/appointmentApi';
import { useAuthContext, type User } from '../context/AuthContext';
import type { Doctor, TimeSlot } from './BookingFlow';

interface Specialty {
  _id: string;
  name: string;
  description: string;
}

export interface Appointment {
  _id: string;
  appointmentNumber: string;
  doctorId: Doctor;
  specialtyId: Specialty;
  patientId: User;
  slotId: TimeSlot[];
  duration: number; // phút
  type: 'online' | 'offline' | 'emergency';
  status: "pending" | "confirmed" | "cancelled" | "completed";
  symptoms: string[];
  suspectedDiseases?: string[];
  description?: string;
  prescription?: string;
  price: number;
  paymentStatus: 'paid' | 'pending' | 'refunded';
  rating?: number;
  review?: string;
  createdAt: string;
  updatedAt: string;
}

interface AppointmentStats {
  total: number;
  upcoming: number;
  completed: number;
  cancelled: number;
  totalSpent: number;
  averageRating?: number;
}

interface AppointmentFilter {
  status: string;
  dateRange: 'all' | 'today' | 'week' | 'month' | 'custom';
  startDate?: string;
  endDate?: string;
  searchQuery: string;
  type: 'all' | 'online' | 'offline' | 'emergency';
}

const Appointments = () => {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const [activeTab, setActiveTab] = useState<string>('upcoming');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filteredAppointments, setFilteredAppointments] = useState<Appointment[]>([]);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [cancellationReason, setCancellationReason] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [prescriptionText, setPrescriptionText] = useState('');
  const [reviewData, setReviewData] = useState({
    rating: 5,
    review: ''
  });
  const [filter, setFilter] = useState<AppointmentFilter>({
    status: 'all',
    dateRange: 'all',
    searchQuery: '',
    type: 'all'
  });
  const [stats, setStats] = useState<AppointmentStats>({
    total: 0,
    upcoming: 0,
    completed: 0,
    cancelled: 0,
    totalSpent: 0,
    averageRating: 0
  });
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const appointmentsPerPage = 10;

useEffect(() => {
  const fetchAppointments = async () => {
    try {
      setLoading(true);

      let data;

      if (user?.role === "doctor") {
        data = await getDoctorAppointments();
      } else {
        data = await getMyAppointment();
      }

      setAppointments(data || []);

    } catch (error) {
      console.error("Fetch appointments failed:", error);
    } finally {
      setLoading(false);
    }
  };

  if (user?.role) {
    fetchAppointments();
  }

}, [user?.role]);

  useEffect(() => {
    filterAppointments();
    calculateStats();
  }, [appointments, activeTab, filter]);

  const filterAppointments = () => {
    let filtered = [...appointments];

    // Filter by tab status
    if (activeTab !== 'all') {
      if (activeTab === 'upcoming') {
        filtered = filtered.filter(a => 
          ['pending', 'confirmed'].includes(a.status) && 
          new Date(a.slotId[0].date) >= new Date()
        );
      } else if (activeTab === 'completed') {
        filtered = filtered.filter(a => a.status === 'completed');
      } else if (activeTab === 'cancelled') {
        filtered = filtered.filter(a => ['cancelled', 'no-show'].includes(a.status));
      } else if (activeTab === 'today') {
        const today = new Date().toISOString().split('T')[0];
        filtered = filtered.filter(a => a.slotId[0].date === today);
      }
    }

    // Filter by type
    if (filter.type !== 'all') {
      filtered = filtered.filter(a => a.type === filter.type);
    }

    // Filter by date range
    if (filter.dateRange !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      filtered = filtered.filter(appointment => {
        const appointmentDate = new Date(appointment.slotId[0].date);
        
        switch (filter.dateRange) {
          case 'today':
            return appointmentDate >= today;
          case 'week':
            const weekAgo = new Date(today);
            weekAgo.setDate(weekAgo.getDate() - 7);
            return appointmentDate >= weekAgo;
          case 'month':
            const monthAgo = new Date(today);
            monthAgo.setMonth(monthAgo.getMonth() - 1);
            return appointmentDate >= monthAgo;
          default:
            return true;
        }
      });
    }

    // Filter by search query
    if (filter.searchQuery) {
      const query = filter.searchQuery.toLowerCase();
      filtered = filtered.filter(a =>
        a._id.toLowerCase().includes(query) ||
        (user?.role === 'patient' ? a.doctorId.userId.fullName.toLowerCase().includes(query) : a.patientId.fullName.toLowerCase().includes(query)) ||
        a.symptoms.some(s => s.toLowerCase().includes(query))
      );
    }

    // Sort by date (newest first for upcoming, oldest first for history)
    if (activeTab === 'upcoming') {
      filtered.sort((a, b) => new Date(a.slotId[0].date).getTime() - new Date(b.slotId[0].date).getTime());
    } else {
      filtered.sort((a, b) => new Date(b.slotId[0].date).getTime() - new Date(a.slotId[0].date).getTime());
    }

    setFilteredAppointments(filtered);
  };

  const calculateStats = () => {
    const total = appointments.length;
    const upcoming = appointments.filter(a => 
      ['pending', 'confirmed'].includes(a.status) && 
      new Date(a.slotId[0].date) >= new Date()
    ).length;
    const completed = appointments.filter(a => a.status === 'completed').length;
    const cancelled = appointments.filter(a => ['cancelled', 'no-show'].includes(a.status)).length;
    const totalSpent = appointments
      .filter(a => a.status === 'completed' && a.paymentStatus === 'paid')
      .reduce((sum, a) => sum + a.price, 0);
    const completedWithRating = appointments.filter(a => a.status === 'completed' && a.rating);
    const averageRating = completedWithRating.length > 0
      ? completedWithRating.reduce((sum, a) => sum + (a.rating || 0), 0) / completedWithRating.length
      : 0;

    setStats({ total, upcoming, completed, cancelled, totalSpent, averageRating });
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const formatDateTime = (dateString: string, time: string) => {
    const date = new Date(dateString);
    return `${date.toLocaleDateString('vi-VN')} ${time}`;
  };

  const formatTime = (time: string) => {
    return time;
  };

  // Format price
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN').format(price) + '₫';
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    const statusMap: { [key: string]: { text: string; icon: string; className: string } } = {
      pending: { text: 'Chờ xác nhận', icon: 'fas fa-clock', className: 'status-pending' },
      confirmed: { text: 'Đã xác nhận', icon: 'fas fa-check-circle', className: 'status-confirmed' },
      completed: { text: 'Đã khám', icon: 'fas fa-check-double', className: 'status-completed' },
      cancelled: { text: 'Đã hủy', icon: 'fas fa-times-circle', className: 'status-cancelled' },
      'no-show': { text: 'Không đến', icon: 'fas fa-user-slash', className: 'status-no-show' }
    };
    return statusMap[status] || statusMap.pending;
  };

  // Get type badge
  const getTypeBadge = (type: string) => {
    const typeMap: { [key: string]: { text: string; icon: string; className: string } } = {
      online: { text: 'Trực tuyến', icon: 'fas fa-video', className: 'type-online' },
      offline: { text: 'Trực tiếp', icon: 'fas fa-hospital', className: 'type-offline' },
      emergency: { text: 'Cấp cứu', icon: 'fas fa-ambulance', className: 'type-emergency' }
    };
    return typeMap[type] || typeMap.offline;
  };

  // Handle cancel appointment
  const handleCancelAppointment = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setShowCancelModal(true);
  };

  const submitCancellation = async () => {
    if (!cancellationReason) {
      alert('Vui lòng chọn lý do hủy lịch');
      return;
    }

    if (!selectedAppointment) {
      return;
    }

    const data = await cancelAppointment(selectedAppointment._id, "")

    setAppointments(prevAppointments =>
      prevAppointments.map(a =>
        a._id === selectedAppointment?._id
          ? { ...a, status: 'cancelled', updatedAt: new Date().toISOString() }
          : a
      )
    );

    setShowCancelModal(false);
    setSelectedAppointment(null);
    setCancellationReason('');
  };

  // Handle reschedule
  const handleReschedule = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setSelectedDate(appointment.slotId[0].date);
    setSelectedTime(appointment.slotId[0].startTime);
    setShowRescheduleModal(true);
  };

  const submitReschedule = () => {
    if (!selectedDate || !selectedTime) {
      alert('Vui lòng chọn ngày và giờ mới');
      return;
    }

    setAppointments(prevAppointments =>
      prevAppointments.map(a =>
        a._id === selectedAppointment?._id
          ? { ...a, slotId: [{ ...a.slotId[0], date: selectedDate, startTime: selectedTime }], status: 'pending', updatedAt: new Date().toISOString() }
          : a
      )
    );

    setShowRescheduleModal(false);
    setSelectedAppointment(null);
    setSelectedDate('');
    setSelectedTime('');
  };

  // Handle join meeting (for online appointments)
  const handleJoinMeeting = (appointment: Appointment) => {
    // Trong thực tế, sẽ mở link meeting
    window.open(`https://meet.medicare.com/${appointment._id}`, '_blank');
  };

  // Handle view prescription
  const handleViewPrescription = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setPrescriptionText(appointment.prescription || '');
    setShowPrescriptionModal(true);
  };

  // Handle review
  const handleReview = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setReviewData({
      rating: 5,
      review: ''
    });
    setShowReviewModal(true);
  };

  const submitReview = () => {
    setAppointments(prevAppointments =>
      prevAppointments.map(a =>
        a._id === selectedAppointment?._id
          ? { ...a, rating: reviewData.rating, review: reviewData.review }
          : a
      )
    );

    setShowReviewModal(false);
    setSelectedAppointment(null);
  };
  // Render appointment card
  const renderAppointmentCard = (appointment: Appointment) => {
    const statusBadge = getStatusBadge(appointment.status);
    const typeBadge = getTypeBadge(appointment.type);
    const isUpcoming = ['pending', 'confirmed'].includes(appointment.status) && 
                       new Date(appointment.slotId[0].date) >= new Date();
    const isOnline = appointment.type === 'online';

    return (
      <div key={appointment._id} className="appointment-card">
        <div className="appointment-header">
          <div className="appointment-info">
            <div className="appointment-number">
              <i className="fas fa-calendar-check"></i>
              Mã lịch: <strong>{appointment._id}</strong>
            </div>
            <div className="appointment-date">
              <i className="fas fa-clock"></i>
              {formatDateTime(appointment.slotId[0].date, appointment.slotId[0].startTime)} ({appointment.duration} phút)
            </div>
          </div>
          <div className="appointment-badges">
            <span className={`type-badge ${typeBadge.className}`}>
              <i className={typeBadge.icon}></i>
              {typeBadge.text}
            </span>
            <span className={`status-badge ${statusBadge.className}`}>
              <i className={statusBadge.icon}></i>
              {statusBadge.text}
            </span>
          </div>
        </div>

        <div className="appointment-body">
          {/* Doctor/Patient Info */}
          <div className="person-info">
            <div className="person-avatar">
              <img 
                src={appointment.doctorId.userId.image} 
                alt={user?.role === 'patient' ? appointment.doctorId.userId.fullName : appointment.patientId.fullName}
              />
            </div>
            <div className="person-details">
              <div className="person-name">
                {user?.role === 'patient' ? appointment.doctorId.userId.fullName : appointment.patientId.fullName}
              </div>
              <div className="person-specialty">
                {user?.role === 'patient' ? appointment.specialtyId.name : `Phone: ${appointment.patientId.phone}`}
              </div>
            </div>
          </div>

          {/* Symptoms */}
          <div className="symptoms-preview">
            <div className="symptoms-label">
              <i className="fas fa-stethoscope"></i>
              Triệu chứng:
            </div>
            <div className="symptoms-tags">
              {appointment.symptoms.slice(0, 2).map((symptom, index) => (
                <span key={index} className="symptom-tag">{symptom}</span>
              ))}
              {appointment.symptoms.length > 2 && (
                <span className="symptom-tag more">+{appointment.symptoms.length - 2}</span>
              )}
            </div>
          </div>

          {/* Price */}
          <div className="appointment-price">
            <span className="price-label">Phí khám:</span>
            <span className="price-value">{formatPrice(appointment.price)}</span>
            <span className={`payment-status ${appointment.paymentStatus}`}>
              {appointment.paymentStatus === 'paid' ? 'Đã thanh toán' :
               appointment.paymentStatus === 'pending' ? 'Chưa thanh toán' : 'Đã hoàn tiền'}
            </span>
          </div>
        </div>

        <div className="appointment-footer">
          <div className="footer-actions">
            <button 
              className="action-btn view"
              onClick={() => {
                setSelectedAppointment(appointment);
                setShowDetailModal(true);
              }}
            >
              <i className="fas fa-eye"></i>
              Chi tiết
            </button>

            {isUpcoming && (
              <>
                {isOnline && (
                  <button 
                    className="action-btn join"
                    onClick={() => handleJoinMeeting(appointment)}
                  >
                    <i className="fas fa-video"></i>
                    Tham gia
                  </button>
                )}
                <button 
                  className="action-btn reschedule"
                  onClick={() => handleReschedule(appointment)}
                >
                  <i className="fas fa-calendar-alt"></i>
                  Đổi lịch
                </button>
                <button 
                  className="action-btn cancel"
                  onClick={() => handleCancelAppointment(appointment)}
                >
                  <i className="fas fa-ban"></i>
                  Hủy lịch
                </button>
              </>
            )}

            {appointment.status === 'completed' && appointment.prescription && (
              <button 
                className="action-btn prescription"
                onClick={() => handleViewPrescription(appointment)}
              >
                <i className="fas fa-prescription"></i>
                Đơn thuốc
              </button>
            )}

            {appointment.status === 'completed' && !appointment.rating && (
              <button 
                className="action-btn review"
                onClick={() => handleReview(appointment)}
              >
                <i className="fas fa-star"></i>
                Đánh giá
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Render detail modal
  const renderDetailModal = () => {
    if (!selectedAppointment) return null;

    const statusBadge = getStatusBadge(selectedAppointment.status);
    const typeBadge = getTypeBadge(selectedAppointment.type);

    return (
      <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
        <div className="modal-content detail-modal" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h3>
              <i className="fas fa-calendar-check"></i>
              Chi tiết lịch hẹn
            </h3>
            <button className="close-btn" onClick={() => setShowDetailModal(false)}>
              <i className="fas fa-times"></i>
            </button>
          </div>

          <div className="modal-body">
            <div className="detail-header">
              <div className="detail-number">
                Mã lịch hẹn: <strong>{selectedAppointment._id}</strong>
              </div>
              <div className="detail-badges">
                <span className={`type-badge ${typeBadge.className}`}>
                  <i className={typeBadge.icon}></i>
                  {typeBadge.text}
                </span>
                <span className={`status-badge ${statusBadge.className}`}>
                  <i className={statusBadge.icon}></i>
                  {statusBadge.text}
                </span>
              </div>
            </div>

            <div className="detail-section">
              <h4>
                <i className="fas fa-user-md"></i>
                {user?.role === 'patient' ? 'Thông tin bác sĩ' : 'Thông tin bệnh nhân'}
              </h4>
              <div className="info-card">
                <div className="info-row">
                  <span className="label">Họ tên:</span>
                  <span className="value">
                    {user?.role === 'patient' ? selectedAppointment.doctorId.userId.fullName : selectedAppointment.patientId.fullName}
                  </span>
                </div>
                {user?.role === 'patient' ? (
                  <>
                    <div className="info-row">
                      <span className="label">Chuyên khoa:</span>
                      <span className="value">{selectedAppointment.specialtyId.name}</span>
                    </div>
                  </>
                ) : (
                  <div className="info-row">
                    <span className="label">Số điện thoại:</span>
                    <span className="value">{selectedAppointment.patientId.phone}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="detail-section">
              <h4>
                <i className="fas fa-clock"></i>
                Thời gian
              </h4>
              <div className="info-card">
                <div className="info-row">
                  <span className="label">Ngày khám:</span>
                  <span className="value">{formatDate(selectedAppointment.slotId[0].date)}</span>
                </div>
                <div className="info-row">
                  <span className="label">Giờ khám:</span>
                  <span className="value">{selectedAppointment.slotId[0].startTime}</span>
                </div>
                <div className="info-row">
                  <span className="label">Thời lượng:</span>
                  <span className="value">{selectedAppointment.duration} phút</span>
                </div>
              </div>
            </div>

            <div className="detail-section">
              <h4>
                <i className="fas fa-stethoscope"></i>
                Triệu chứng
              </h4>
              <div className="info-card">
                <div className="symptoms-list">
                  {selectedAppointment.symptoms.map((symptom, index) => (
                    <span key={index} className="symptom-item">{symptom}</span>
                  ))}
                </div>
                {selectedAppointment.suspectedDiseases && (
                  <>
                    <div className="sub-section">
                      <span className="label">Có thể liên quan:</span>
                      <div className="disease-list">
                        {selectedAppointment.suspectedDiseases.map((disease, index) => (
                          <span key={index} className="disease-item">{disease}</span>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {selectedAppointment.description && (
              <div className="detail-section">
                <h4>
                  <i className="fas fa-notes-medical"></i>
                  Ghi chú
                </h4>
                <div className="info-card">
                  <p className="notes-text">{selectedAppointment.description}</p>
                </div>
              </div>
            )}

            <div className="detail-section">
              <h4>
                <i className="fas fa-credit-card"></i>
                Thông tin thanh toán
              </h4>
              <div className="info-card">
                <div className="info-row">
                  <span className="label">Phí khám:</span>
                  <span className="value price">{formatPrice(selectedAppointment.price)}</span>
                </div>
                <div className="info-row">
                  <span className="label">Trạng thái:</span>
                  <span className={`payment-status ${selectedAppointment.paymentStatus}`}>
                    {selectedAppointment.paymentStatus === 'paid' ? 'Đã thanh toán' :
                     selectedAppointment.paymentStatus === 'pending' ? 'Chưa thanh toán' : 'Đã hoàn tiền'}
                  </span>
                </div>
              </div>
            </div>

            {selectedAppointment.status === 'completed' && selectedAppointment.prescription && (
              <div className="detail-section">
                <h4>
                  <i className="fas fa-prescription"></i>
                  Đơn thuốc
                </h4>
                <div className="info-card">
                  <p className="prescription-text">{selectedAppointment.prescription}</p>
                </div>
              </div>
            )}

            {selectedAppointment.status === 'completed' && selectedAppointment.rating && (
              <div className="detail-section">
                <h4>
                  <i className="fas fa-star"></i>
                  Đánh giá của bạn
                </h4>
                <div className="info-card">
                  <div className="rating-display">
                    {[...Array(5)].map((_, i) => (
                      <i 
                        key={i} 
                        className={`fas fa-star ${i < (selectedAppointment.rating || 0) ? 'filled' : ''}`}
                      ></i>
                    ))}
                    <span className="rating-value">{selectedAppointment.rating}/5</span>
                  </div>
                  {selectedAppointment.review && (
                    <p className="review-text">{selectedAppointment.review}</p>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button className="close-modal-btn" onClick={() => setShowDetailModal(false)}>
              Đóng
            </button>
            {selectedAppointment.status === 'pending' && (
              <>
                <button 
                  className="reschedule-btn"
                  onClick={() => {
                    setShowDetailModal(false);
                    handleReschedule(selectedAppointment);
                  }}
                >
                  <i className="fas fa-calendar-alt"></i>
                  Đổi lịch
                </button>
                <button 
                  className="cancel-btn"
                  onClick={() => {
                    setShowDetailModal(false);
                    handleCancelAppointment(selectedAppointment);
                  }}
                >
                  <i className="fas fa-ban"></i>
                  Hủy lịch
                </button>
              </>
            )}
            {selectedAppointment.type === 'online' && 
             ['confirmed', 'pending'].includes(selectedAppointment.status) && (
              <button 
                className="join-btn"
                onClick={() => handleJoinMeeting(selectedAppointment)}
              >
                <i className="fas fa-video"></i>
                Tham gia phòng khám
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Render cancel modal
  const renderCancelModal = () => {
    if (!showCancelModal) return null;

    return (
      <div className="modal-overlay" onClick={() => setShowCancelModal(false)}>
        <div className="modal-content cancel-modal" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h3>
              <i className="fas fa-exclamation-triangle"></i>
              Xác nhận hủy lịch hẹn
            </h3>
            <button className="close-btn" onClick={() => setShowCancelModal(false)}>
              <i className="fas fa-times"></i>
            </button>
          </div>

          <div className="modal-body">
            <div className="cancel-info">
              <p>Bạn có chắc chắn muốn hủy lịch hẹn <strong>{selectedAppointment?.appointmentNumber}</strong>?</p>
              <p className="warning-text">
                <i className="fas fa-info-circle"></i>
                Nếu hủy trong vòng 2 giờ trước giờ hẹn, phí khám sẽ không được hoàn lại.
              </p>
            </div>

            <div className="form-group">
              <label>Lý do hủy *</label>
              <select 
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
              >
                <option value="">Chọn lý do hủy</option>
                <option value="Thay đổi kế hoạch cá nhân">Thay đổi kế hoạch cá nhân</option>
                <option value="Đã khỏi bệnh, không cần khám">Đã khỏi bệnh, không cần khám</option>
                <option value="Muốn đặt lịch với bác sĩ khác">Muốn đặt lịch với bác sĩ khác</option>
                <option value="Không thể sắp xếp thời gian">Không thể sắp xếp thời gian</option>
                <option value="Lý do khác">Lý do khác</option>
              </select>
            </div>
          </div>

          <div className="modal-footer">
            <button className="close-modal-btn" onClick={() => setShowCancelModal(false)}>
              Không, giữ lại
            </button>
            <button className="confirm-cancel-btn" onClick={submitCancellation}>
              <i className="fas fa-check"></i>
              Xác nhận hủy
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Render reschedule modal
  const renderRescheduleModal = () => {
    if (!showRescheduleModal) return null;

    // Mock available time slots
    const timeSlots = [
      '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
      '11:00', '13:30', '14:00', '14:30', '15:00', '15:30',
      '16:00', '16:30'
    ];

    return (
      <div className="modal-overlay" onClick={() => setShowRescheduleModal(false)}>
        <div className="modal-content reschedule-modal" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h3>
              <i className="fas fa-calendar-alt"></i>
              Đổi lịch hẹn
            </h3>
            <button className="close-btn" onClick={() => setShowRescheduleModal(false)}>
              <i className="fas fa-times"></i>
            </button>
          </div>

          <div className="modal-body">
            <div className="appointment-summary">
              <p>Đổi lịch cho: <strong>{selectedAppointment?.appointmentNumber}</strong></p>
              <p>Bác sĩ: {selectedAppointment?.doctorId.userId.fullName}</p>
            </div>

            <div className="form-group">
              <label>Chọn ngày mới *</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            {selectedDate && (
              <div className="form-group">
                <label>Chọn giờ mới *</label>
                <div className="time-slots">
                  {timeSlots.map(time => (
                    <button
                      key={time}
                      className={`time-slot ${selectedTime === time ? 'selected' : ''}`}
                      onClick={() => setSelectedTime(time)}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="reschedule-note">
              <i className="fas fa-info-circle"></i>
              <p>Lịch hẹn mới sẽ được gửi xác nhận sau khi bác sĩ chấp thuận.</p>
            </div>
          </div>

          <div className="modal-footer">
            <button className="close-modal-btn" onClick={() => setShowRescheduleModal(false)}>
              Hủy
            </button>
            <button className="confirm-reschedule-btn" onClick={submitReschedule}>
              <i className="fas fa-check"></i>
              Xác nhận đổi lịch
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Render prescription modal
  const renderPrescriptionModal = () => {
    if (!showPrescriptionModal) return null;

    return (
      <div className="modal-overlay" onClick={() => setShowPrescriptionModal(false)}>
        <div className="modal-content prescription-modal" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h3>
              <i className="fas fa-prescription"></i>
              Đơn thuốc
            </h3>
            <button className="close-btn" onClick={() => setShowPrescriptionModal(false)}>
              <i className="fas fa-times"></i>
            </button>
          </div>

          <div className="modal-body">
            <div className="prescription-header">
              <div className="prescription-info">
                <p><strong>Mã lịch:</strong> {selectedAppointment?.appointmentNumber}</p>
                <p><strong>Bác sĩ:</strong> {selectedAppointment?.doctorId.userId.fullName}</p>
                <p><strong>Ngày khám:</strong> {formatDate(selectedAppointment?.slotId[0].date || '')}</p>
              </div>
            </div>

            <div className="prescription-content">
              <h4>Đơn thuốc chi tiết</h4>
              <div className="prescription-text-box">
                {prescriptionText}
              </div>
            </div>

            <div className="prescription-actions">
              <button className="download-prescription-btn">
                <i className="fas fa-download"></i>
                Tải đơn thuốc
              </button>
              <button className="print-prescription-btn">
                <i className="fas fa-print"></i>
                In đơn thuốc
              </button>
            </div>
          </div>

          <div className="modal-footer">
            <button className="close-modal-btn" onClick={() => setShowPrescriptionModal(false)}>
              Đóng
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Render review modal
  const renderReviewModal = () => {
    if (!showReviewModal) return null;

    return (
      <div className="modal-overlay" onClick={() => setShowReviewModal(false)}>
        <div className="modal-content review-modal" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h3>
              <i className="fas fa-star"></i>
              Đánh giá buổi khám
            </h3>
            <button className="close-btn" onClick={() => setShowReviewModal(false)}>
              <i className="fas fa-times"></i>
            </button>
          </div>

          <div className="modal-body">
            <div className="review-info">
              <p>Đánh giá cho bác sĩ: <strong>{selectedAppointment?.doctorId.userId.fullName}</strong></p>
            </div>

            <div className="form-group">
              <label>Đánh giá của bạn *</label>
              <div className="rating-input">
                {[1, 2, 3, 4, 5].map(star => (
                  <i
                    key={star}
                    className={`fas fa-star ${star <= reviewData.rating ? 'filled' : ''}`}
                    onClick={() => setReviewData({ ...reviewData, rating: star })}
                  ></i>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>Nhận xét (tùy chọn)</label>
              <textarea
                placeholder="Chia sẻ trải nghiệm của bạn về buổi khám..."
                value={reviewData.review}
                onChange={(e) => setReviewData({ ...reviewData, review: e.target.value })}
                rows={4}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button className="close-modal-btn" onClick={() => setShowReviewModal(false)}>
              Hủy
            </button>
            <button className="submit-review-btn" onClick={submitReview}>
              <i className="fas fa-check"></i>
              Gửi đánh giá
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="appointments-container">
      {/* Header */}
      <div className="appointments-header">
        <div className="container">
          <div className="header-content">
            <h1>
              <i className="fas fa-calendar-alt"></i>
              {user?.role === 'patient' ? 'Lịch hẹn của tôi' : 'Lịch hẹn với bệnh nhân'}
            </h1>
            <p>
              {user?.role === 'patient' 
                ? 'Quản lý lịch hẹn với bác sĩ và theo dõi lịch sử khám bệnh'
                : 'Quản lý lịch hẹn với bệnh nhân và cập nhật trạng thái khám'}
            </p>
          </div>
        </div>
      </div>

      <div className="container">
        {/* Stats Cards */}
        <div className="stats-cards">
          <div className="stat-card">
            <div className="stat-icon total">
              <i className="fas fa-calendar-check"></i>
            </div>
            <div className="stat-info">
              <div className="stat-value">{stats.total}</div>
              <div className="stat-label">Tổng lịch hẹn</div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon upcoming">
              <i className="fas fa-clock"></i>
            </div>
            <div className="stat-info">
              <div className="stat-value">{stats.upcoming}</div>
              <div className="stat-label">Sắp tới</div>
            </div>
          </div>
          
          <div className="stat-card">
            <div className="stat-icon completed">
              <i className="fas fa-check-circle"></i>
            </div>
            <div className="stat-info">
              <div className="stat-value">{stats.completed}</div>
              <div className="stat-label">Đã khám</div>
            </div>
          </div>
          
          {user?.role === 'doctor' && (
            <div className="stat-card">
              <div className="stat-icon rating">
                <i className="fas fa-star"></i>
              </div>
              <div className="stat-info">
                <div className="stat-value">{stats.averageRating?.toFixed(1)}</div>
                <div className="stat-label">Đánh giá TB</div>
              </div>
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="appointments-filters">
          <div className="search-box">
            <i className="fas fa-search"></i>
            <input
              type="text"
              placeholder={user?.role === 'patient' 
                ? "Tìm kiếm theo mã lịch, tên bác sĩ, triệu chứng..."
                : "Tìm kiếm theo mã lịch, tên bệnh nhân, triệu chứng..."}
              value={filter.searchQuery}
              onChange={(e) => setFilter({...filter, searchQuery: e.target.value})}
            />
          </div>
          
          <div className="filter-controls">
            <select 
              value={filter.type}
              onChange={(e) => setFilter({...filter, type: e.target.value as any})}
            >
              <option value="all">Tất cả hình thức</option>
              <option value="offline">Trực tiếp</option>
              <option value="online">Trực tuyến</option>
              <option value="emergency">Cấp cứu</option>
            </select>

            <select 
              value={filter.dateRange}
              onChange={(e) => setFilter({...filter, dateRange: e.target.value as any})}
            >
              <option value="all">Tất cả thời gian</option>
              <option value="today">Hôm nay</option>
              <option value="week">7 ngày qua</option>
              <option value="month">30 ngày qua</option>
            </select>
          </div>
        </div>

        {/* Tabs */}
        <div className="appointments-tabs">
          <button 
            className={`tab ${activeTab === 'upcoming' ? 'active' : ''}`}
            onClick={() => setActiveTab('upcoming')}
          >
            <i className="fas fa-clock"></i>
            Sắp tới ({stats.upcoming})
          </button>
          <button 
            className={`tab ${activeTab === 'today' ? 'active' : ''}`}
            onClick={() => setActiveTab('today')}
          >
            <i className="fas fa-calendar-day"></i>
            Hôm nay
          </button>
          <button 
            className={`tab ${activeTab === 'completed' ? 'active' : ''}`}
            onClick={() => setActiveTab('completed')}
          >
            <i className="fas fa-check-circle"></i>
            Đã khám ({stats.completed})
          </button>
          <button 
            className={`tab ${activeTab === 'cancelled' ? 'active' : ''}`}
            onClick={() => setActiveTab('cancelled')}
          >
            <i className="fas fa-times-circle"></i>
            Đã hủy ({stats.cancelled})
          </button>
          <button 
            className={`tab ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            <i className="fas fa-list"></i>
            Tất cả ({stats.total})
          </button>
        </div>

        {/* Appointments List */}
        <div className="appointments-list">
          {loading ? (
            <div className="loading-state">
              <i className="fas fa-spinner fa-spin"></i>
              <p>Đang tải lịch hẹn...</p>
            </div>
          ) : filteredAppointments.length > 0 ? (
            <>
              {filteredAppointments
                .slice((currentPage - 1) * appointmentsPerPage, currentPage * appointmentsPerPage)
                .map(appointment => renderAppointmentCard(appointment))}
              
              {/* Pagination */}
              {Math.ceil(filteredAppointments.length / appointmentsPerPage) > 1 && (
                <div className="pagination">
                  <button 
                    className={`page-btn ${currentPage === 1 ? 'disabled' : ''}`}
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  >
                    <i className="fas fa-chevron-left"></i>
                  </button>
                  
                  {Array.from(
                    { length: Math.ceil(filteredAppointments.length / appointmentsPerPage) }, 
                    (_, i) => i + 1
                  ).map(page => (
                    <button
                      key={page}
                      className={`page-btn ${currentPage === page ? 'active' : ''}`}
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </button>
                  ))}
                  
                  <button 
                    className={`page-btn ${currentPage === Math.ceil(filteredAppointments.length / appointmentsPerPage) ? 'disabled' : ''}`}
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(filteredAppointments.length / appointmentsPerPage)))}
                  >
                    <i className="fas fa-chevron-right"></i>
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="empty-state">
              <div className="empty-icon">
                <i className="fas fa-calendar-times"></i>
              </div>
              <h3>Chưa có lịch hẹn nào</h3>
              <p>
                {user?.role === 'patient' 
                  ? 'Bạn chưa có lịch hẹn nào trong mục này'
                  : 'Chưa có bệnh nhân đặt lịch trong mục này'}
              </p>
              {user?.role === 'patient' && (
                <button 
                  className="book-now-btn"
                  onClick={() => navigate('/dat-lich')}
                >
                  <i className="fas fa-calendar-plus"></i>
                  Đặt lịch ngay
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showDetailModal && renderDetailModal()}
      {showCancelModal && renderCancelModal()}
      {showRescheduleModal && renderRescheduleModal()}
      {showPrescriptionModal && renderPrescriptionModal()}
      {showReviewModal && renderReviewModal()}
    </div>
  );
};

export default Appointments;