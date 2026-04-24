import React, { useState, useEffect } from 'react';
import '../assets/bookingFlow.css';
import { useAuthContext, type User } from '../context/AuthContext';
import { getDoctor } from '../api/doctorApi';
import { getSlotsByDoctorAndDateApi, holdSlot, releaseSlot } from '../api/timeSlotApi';
import { createAppoinmentApi } from '../api/appointmentApi';
import { getPaymentUrl } from '../api/paymentApi';
import { useNotify } from '../hooks/useNotification';
import { useRef } from "react";

interface BookingData {
  patientId: string;
  symptoms: string[];
  price: number;
  // suspectedDiseases: string[];
  doctorId: any | null;
  slotId: any | null;
  description: string;
  paymentMethod: string;
  // appointmentType: string;
}

export interface Doctor {
  _id: number;
  userId: User;
  specialty: string;
  rating: number;
  experienceYears: string;
  price: number;
  availableDates: string[];
  bookedSlots: string[];
  image: string;
  description: string;
  qualifications: string[];
  isActive: boolean;
}

export interface TimeSlot {
  _id: string,
  slotId: string,
  time: string;
  date: string,
  appointmentId: string;
  startTime: string;
  available: boolean;
  isSelected: boolean;
  status: string;
}

const BookingFlow = () => {
  const notify = useNotify();
  const [currentStep, setCurrentStep] = useState(1);
  const [symptom, setSymptom] = useState('');
  const [description, setDescription] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [suggestedSymptoms, setSuggestedSymptoms] = useState<string[]>([]);
  const [suggestedDiseases, setSuggestedDiseases] = useState<string[]>([]);
  const [doctors, setDoctors] = useState<any[]>([])
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const dateOptionsRef = useRef<HTMLDivElement>(null);
  const [cooldown, setCooldown] = useState(0);
  const [cooldownEnd, setCooldownEnd] = useState<number | null>(null);

  //loading
  const [loadingDay, setLoadingDay] = useState(false);
  const [loading, setLoading] = useState(false);

  const { user } = useAuthContext();
  const [formData, setFormData] = useState<BookingData>({
    patientId: user?._id || '',
    symptoms: [],
    doctorId: null,
    slotId: null,
    description: '',
    price: 0,
    paymentMethod: ""
  });
  // Danh sách triệu chứng mẫu
  const symptomDatabase = [
    'Sốt cao', 'Ho khan', 'Đau đầu', 'Mệt mỏi', 'Đau họng', 'Khó thở',
    'Đau bụng', 'Buồn nôn', 'Chóng mặt', 'Đau ngực', 'Sổ mũi', 'Nghẹt mũi',
    'Đau cơ', 'Ớn lạnh', 'Mất vị giác', 'Mất khứu giác', 'Tiêu chảy',
    'Đau lưng', 'Đau khớp', 'Phát ban', 'Chán ăn', 'Mất ngủ', 'Hoa mắt'
  ];

  // Database triệu chứng - bệnh
  const diseaseDatabase = [
    {
      name: 'Cảm cúm',
      symptoms: ['Sốt cao', 'Ho khan', 'Đau đầu', 'Mệt mỏi', 'Đau họng', 'Đau cơ', 'Ớn lạnh']
    },
    {
      name: 'Viêm họng',
      symptoms: ['Đau họng', 'Sốt cao', 'Ho khan', 'Khó thở', 'Đau đầu']
    },
    {
      name: 'Viêm phổi',
      symptoms: ['Sốt cao', 'Ho khan', 'Khó thở', 'Đau ngực', 'Mệt mỏi', 'Ớn lạnh']
    },
    {
      name: 'COVID-19',
      symptoms: ['Sốt cao', 'Ho khan', 'Mệt mỏi', 'Mất vị giác', 'Mất khứu giác', 'Khó thở']
    },
    {
      name: 'Rối loạn tiêu hóa',
      symptoms: ['Đau bụng', 'Buồn nôn', 'Tiêu chảy', 'Chán ăn']
    },
    {
      name: 'Đau nửa đầu',
      symptoms: ['Đau đầu', 'Chóng mặt', 'Buồn nôn', 'Hoa mắt']
    }
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
  const interval = setInterval(() => {
    const savedEnd = localStorage.getItem("slotCooldownEnd");

    if (!savedEnd) return;

    const remaining = Math.max(0, Math.floor((+savedEnd - Date.now()) / 1000));

    setCooldown(remaining);

    if (remaining <= 0) {
      localStorage.removeItem("slotCooldownEnd");
    }
  }, 1000);

  return () => clearInterval(interval);
}, []);

  // Các bước trong flow
  const steps = [
    { number: 1, title: 'Triệu chứng', icon: 'fas fa-stethoscope' },
    { number: 2, title: 'Chọn bác sĩ', icon: 'fas fa-user-md' },
    { number: 3, title: 'Chọn giờ', icon: 'fas fa-clock' },
    { number: 4, title: 'Xác nhận', icon: 'fas fa-check-circle' }
  ];

  // Khởi tạo ngày
  useEffect(() => {
    if (!formData.doctorId?._id) return;

    const fetchSlots = async () => {
      try {
        setLoadingDay(true);
        const res = await getSlotsByDoctorAndDateApi(
          formData.doctorId._id,
          selectedDate
        );
        setTimeSlots(res);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingDay(false);            
      }
    };

    fetchSlots();
  }, [formData.doctorId?._id, selectedDate]);

  useEffect(() => {
  const handleLeave = () => {
    if (formData.slotId) {
      navigator.sendBeacon(
        "/api/timeSlot/release",
        JSON.stringify({ slotId: formData.slotId })
      );
    }
  };

  window.addEventListener("beforeunload", handleLeave);

  return () => {
    window.removeEventListener("beforeunload", handleLeave);
  };
}, [formData.slotId]);

  // Tìm triệu chứng gợi ý khi nhập
  useEffect(() => {
    if (symptom.trim()) {
      const suggestions = symptomDatabase.filter(symptom =>
        symptom.toLowerCase().includes(symptom.toLowerCase())
      ).slice(0, 5);
      setSuggestedSymptoms(suggestions);
      
      // Tìm bệnh liên quan
      findRelatedDiseases();
    } else {
      setSuggestedSymptoms([]);
      setSuggestedDiseases([]);
    }
  }, [symptom]);

  // Tìm bệnh liên quan đến triệu chứng
  const findRelatedDiseases = () => {
    const currentSymptoms = formData.symptoms;
    if (currentSymptoms.length === 0) return;
    
    const relatedDiseases = diseaseDatabase
      .filter(disease => 
        disease.symptoms.some(symptom => 
          currentSymptoms.some(s => s.includes(symptom) || symptom.includes(s))
        )
      )
      .map(disease => disease.name)
      .slice(0, 3);
    
    setSuggestedDiseases(relatedDiseases);
    setFormData(prev => ({ ...prev, suspectedDiseases: relatedDiseases }));
  };

  // Thêm triệu chứng
  const addSymptom = (symptom: string) => {
    if (!formData.symptoms.includes(symptom)) {
      const updatedSymptoms = [...formData.symptoms, symptom];
      setFormData(prev => ({ ...prev, symptoms: updatedSymptoms }));
      setSymptom('');
      setSuggestedSymptoms([]);
    }
  };

  // Xóa triệu chứng
  const removeSymptom = (symptomToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      symptoms: prev.symptoms.filter(s => s !== symptomToRemove)
    }));
  };

  // Chọn bác sĩ
  const selectDoctor = (doctor: Doctor) => {
    setFormData(prev => ({ ...prev, doctorId: doctor }));
    // Chuyển sang bước tiếp theo sau 0.5s
    setTimeout(() => {
      setCurrentStep(3);
    }, 500);
  };

  const generateWeekDays = () => {
    const days = [];
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + 1 + 7); // Start from Monday
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      
      const formattedDate = date.toISOString().split('T')[0];
      const dayNames = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
      
      days.push({
        date: formattedDate,
        dayOfWeek: dayNames[date.getDay()],
        dayNumber: date.getDate(),
        month: date.getMonth() + 1
      });
    }
    
    return days;
  };

  const weekDays = generateWeekDays();

  // Chuyển bước tiếp theo
  const nextStep = () => {
    if (validateCurrentStep()) {
      if (currentStep < 4) {
        setCurrentStep(currentStep + 1);
        window.scrollTo(0, 0);
      } else {
        if (!formData.paymentMethod) {
          setShowPaymentModal(true);
          return;
        }

        completeBooking();
      }
    }
  };

  const handleClosePayment = () => {
    setShowPaymentModal(false);
    setFormData(prev => ({
      ...prev,
      paymentMethod: ""
    }));
  };

  // Quay lại bước trước
  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo(0, 0);
    }
  };

  // Validate từng bước
  const validateCurrentStep = () => {
    switch (currentStep) {
      case 1:
        if (formData.symptoms.length === 0) {
          notify.info('Vui lòng nhập ít nhất một triệu chứng', 'thông báo');
          return false;
        }
        return true;
        
      case 2:
        if (!formData.doctorId) {
          notify.info('Vui lòng chọn bác sĩ', 'thông báo');
          return false;
        }
        return true;
        
      case 3:
        if (!formData.slotId) {
          notify.info('Vui lòng chọn giờ khám', 'thông báo');
          return false;
        }
        return true;
      
      case 4:
        return true;

      default:
        return false;
    }
    return true;
  };

const handleProcessTimeSlot = async (slot: TimeSlot) => {
  console.log(cooldown)
  if (cooldown > 0) {
    notify.warning(`Vui lòng đợi ${cooldown}s trước khi đổi khung giờ`);
    return;
  }

  if (slot.status !== "available") {
    notify.error("thông báo", "Khung giờ đang được đặt hoặc đang xử lí, vui lòng chọn khung giờ khác hoặc thử lại sau 5p");
    return;
  }

  try {
    setLoading(true);

    // 🔴 release slot cũ
    if (formData.slotId) {
      await releaseSlot(formData.slotId);

      setTimeSlots(prev =>
        prev.map(s =>
          s._id === formData.slotId
            ? { ...s, status: "available" }
            : s
        )
      );
    }

    // 🟢 giữ slot mới
    const res = await holdSlot(slot._id);

    if (!res.success) {
      notify.error("thông báo","Khung giờ đang được người khác chọn");
      return;
    }

    // ✅ set state
    setFormData(prev => ({
      ...prev,
      slotId: slot._id,
    }));

    setSelectedTime(slot.startTime);

    // 🔥 set cooldown SAU KHI thành công
    const end = Date.now() + 30000;
    setCooldownEnd(end);
    localStorage.setItem("slotCooldownEnd", end.toString());

  } catch (err) {
    notify.error("Có lỗi xảy ra");
    console.log(err);
  } finally {
    setLoading(false);
  }
};

  // Hoàn tất đặt lịch
  const completeBooking = async () => {
    if (!formData.paymentMethod) {
      notify.warning("Vui lòng chọn phương thức thanh toán");
      return;
    }
    try {
      if (formData.paymentMethod === "vnpay") {
      const res = await getPaymentUrl({
        type: "appointment",
        amount: formData.doctorId.price,
        orderInfo: `Dat lich voi ${formData.doctorId.userId.fullName}`,
        slotId: formData.slotId,
        doctorId: formData.doctorId._id,
      });

      // 🔥 redirect sang VNPay
      window.location.href = res.paymentUrl;

      return;
    }

      await createAppoinmentApi(
        formData.doctorId._id,
        formData.patientId,
        formData.doctorId.specialtyId._id,
        formData.slotId,
        formData.symptoms,
        formData.description,
        formData.price = formData.doctorId.price,
        // formData.price,
      )
      
      // Hiển thị thông báo thành công
      notify.success(`Đặt lịch thành công!\nMã đặt lịch: \nBác sĩ: ${formData.doctorId.userId.fullName}\nThời gian: ${selectedDate} ${selectedTime}`, "thông báo")
      // Reset form
      setFormData({
      patientId: user?._id || '',
      symptoms: [],
      doctorId: null,
      slotId: null,
      description: '',
      price: 0,
      paymentMethod: ""
      });
      setCurrentStep(1);
      setSymptom('');
      setSelectedDate('');
    } catch (e) {
      console.log(e)
    }
  };
console.log(cooldown)
  // Format giá tiền
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN').format(price) + ' VNĐ';
  };

  // Tính ngày trong tuần
  const getDayName = (dateString: string) => {
    const date = new Date(dateString);
    const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    return days[date.getDay()];
  };

  //scroll trái phải 
  const scrollDates = (direction: "left" | "right") => {
    if (!dateOptionsRef.current) return;

    const scrollAmount = 200;

    dateOptionsRef.current.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth"
    });
  };

  // Render từng bước
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return renderSymptomsStep();
      case 2:
        return renderDoctorsStep();
      case 3:
        return renderTimeStep();
      case 4:
        return renderConfirmationStep();
      default:
        return null;
    }
  };

  const renderSymptomsStep = () => (
    <div className="step-content symptoms-step">
      <div className="step-header">
        <h3>
          <i className="fas fa-stethoscope"></i>
          Mô tả triệu chứng của bạn
        </h3>
        <p>Nhập các triệu chứng bạn đang gặp phải để chúng tôi gợi ý bác sĩ phù hợp</p>
      </div>

      <div className="symptom-input-section">
        <div className="input-group">
          <div className="input-wrapper">
            <i className="fas fa-search"></i>
            <input
              type="text"
              placeholder="Nhập triệu chứng (ví dụ: sốt cao, đau đầu, ho...)"
              value={symptom}
              onChange={(e) => setSymptom(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && symptom.trim()) {
                  addSymptom(symptom.trim());
                }
              }}
            />
            {symptom && (
              <button 
                className="clear-input"
                onClick={() => setSymptom('')}
              >
                <i className="fas fa-times"></i>
              </button>
            )}
          </div>
          <button 
            className="add-symptom-btn"
            onClick={() => {
              if (symptom.trim()) {
                addSymptom(symptom.trim());
              }
            }}
          >
            <i className="fas fa-plus"></i>
            Thêm
          </button>
        </div>

        {suggestedSymptoms.length > 0 && (
          <div className="symptom-suggestions">
            <p className="suggestion-title">Gợi ý triệu chứng:</p>
            <div className="suggestion-tags">
              {suggestedSymptoms.map((symptom, index) => (
                <button
                  key={index}
                  className="suggestion-tag"
                  onClick={() => addSymptom(symptom)}
                >
                  {symptom}
                </button>
              ))}
            </div>
          </div>
        )}

        {formData.symptoms.length > 0 && (
          <div className="selected-symptoms">
            <p className="selected-title">Triệu chứng đã chọn:</p>
            <div className="symptom-tags">
              {formData.symptoms.map((symptom, index) => (
                <div key={index} className="symptom-tag">
                  <span>{symptom}</span>
                  <button onClick={() => removeSymptom(symptom)}>
                    <i className="fas fa-times"></i>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {suggestedDiseases.length > 0 && (
          <div className="disease-suggestions">
            <div className="disease-header">
              <i className="fas fa-info-circle"></i>
              <h4>Có thể bạn đang gặp:</h4>
            </div>
            <div className="disease-tags">
              {suggestedDiseases.map((disease, index) => (
                <div key={index} className="disease-tag">
                  <i className="fas fa-exclamation-triangle"></i>
                  <span>{disease}</span>
                </div>
              ))}
            </div>
            <p className="disease-note">
              <i className="fas fa-lightbulb"></i>
              Đây chỉ là gợi ý dựa trên triệu chứng. Hãy tham khảo ý kiến bác sĩ để có chẩn đoán chính xác.
            </p>
          </div>
        )}

        <div className="notes-section">
          <h4>
            <i className="fas fa-edit"></i>
            Ghi chú thêm (tùy chọn)
          </h4>
          <textarea
            placeholder="Mô tả chi tiết hơn về tình trạng của bạn, tiền sử bệnh, hoặc bất kỳ thông tin nào khác..."
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              setFormData(prev => ({ ...prev, description: e.target.value }));
            }}
            rows={4}
          />
        </div>
      </div>
    </div>
  );

  const renderDoctorsStep = () => (
    <div className="step-content doctors-step">
      <div className="step-header">
        <h3>
          <i className="fas fa-user-md"></i>
          Chọn bác sĩ phù hợp
        </h3>
        <p>Dựa trên triệu chứng của bạn, chúng tôi gợi ý những bác sĩ chuyên khoa phù hợp</p>
      </div>

      <div className="specialty-filter">
        <button className="filter-btn active">Tất cả</button>
        <button className="filter-btn">Tim mạch</button>
        <button className="filter-btn">Nhi khoa</button>
        <button className="filter-btn">Tâm lý</button>
        <button className="filter-btn">Thần kinh</button>
      </div>
      {loading ? (
        <>
        loading...
        </>
      ) : (
        <div className="doctors-list">
          {doctors
            .filter(doctor => doctor.isActive)
            .map(doctor => (
              <div 
                key={doctor._id} 
                className={`doctor-card ${formData.doctorId?._id === doctor._id ? 'selected' : ''}`}
                onClick={() => selectDoctor(doctor)}
              >
                <div className="doctor-header">
                  <img src={doctor.image} alt={doctor?.userId?.fullName} className="doctor-avatar" />
                  <div className="doctor-main-info">
                    <h4>{doctor?.userId?.fullName}</h4>
                    <div className="doctor-specialty">{doctor.specialtyId.name}</div>
                    <div className="doctor-rating">
                      <i className="fas fa-star"></i>
                      <span>{doctor.rating}</span>
                    </div>
                  </div>
                  <div className="doctor-price">
                    <div className="price-label">Phí khám</div>
                    <div className="price-value">{formatPrice(doctor.price)}</div>
                  </div>
                </div>

                <div className="doctor-details">
                  <p className="doctor-description">{doctor.description}</p>
                  
                  <div className="doctor-qualifications">
                    <h5>
                      <i className="fas fa-graduation-cap"></i>
                      Bằng cấp & Chứng chỉ
                    </h5>
                    <ul>
                      {doctor.qualifications.map((qual: any, idx: any) => (
                        <li key={idx}>
                          <i className="fas fa-check"></i>
                          {qual}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="doctor-availability">
                    <h5>
                      <i className="fas fa-calendar-check"></i>
                      Lịch có sẵn
                    </h5>
                    <div className="available-dates">
                      {/* {doctor.availableDates.slice(0, 3).map(date => (
                        <div key={date} className="date-badge">
                          {getDayName(date)} {date.split('-')[2]}/{date.split('-')[1]}
                        </div>
                      ))}
                      {doctor.availableDates.length > 3 && (
                        <div className="date-badge more">
                          +{doctor.availableDates.length - 3} ngày
                        </div>
                      )} */}
                    </div>
                  </div>

                  <div className="doctor-actions">
                    <button 
                      className="view-profile-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        alert(`Thông tin chi tiết về ${doctor.userId.fullName}`);
                      }}
                    >
                      <i className="fas fa-eye"></i>
                      Xem hồ sơ
                    </button>
                    <button 
                      className={`select-doctor-btn ${formData.doctorId?._id === doctor._id ? 'selected' : ''}`}
                    >
                      {formData.doctorId?._id === doctor._id ? (
                        <>
                          <i className="fas fa-check"></i>
                          Đã chọn
                        </>
                      ) : (
                        <>
                          <i className="fas fa-calendar-plus"></i>
                          Chọn bác sĩ này
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {formData.doctorId?._id === doctor._id && (
                  <div className="selection-indicator">
                    <i className="fas fa-check-circle"></i>
                    <span>Bạn đã chọn bác sĩ này</span>
                  </div>
                )}
              </div>
            ))}
        </div>
      )}

    </div>
  );
  const renderTimeStep = () => (
    <div className="step-content time-step">
      <div className="step-header">
        <h3>
          <i className="fas fa-clock"></i>
          Chọn thời gian khám
        </h3>
        <p>Chọn ngày và giờ phù hợp với lịch của bạn</p>
      </div>

      {formData.doctorId && (
        <div className="selected-doctor-info">
          <div className="doctor-summary">
            <img src={formData.doctorId.image} alt={formData.doctorId.userId.fullName} />
            <div className="summary-info">
              <h4>{formData.doctorId.userId.fullName}</h4>
              <div className="summary-specialty">{formData.doctorId.specialtyId.name}</div>
              <div className="summary-price">{formatPrice(formData.doctorId.price)}</div>
            </div>
          </div>
        </div>
      )}

      <div className="date-selection">
        <h4>
          <i className="fas fa-calendar-day"></i>
          Chọn ngày khám
        </h4>
        <div className="date-picker">
          <button className="nav-btn prev-date" onClick={() => scrollDates("left")}>
            <i className="fas fa-chevron-left"></i>
          </button>
          
          <div className="date-options">
            {weekDays.map(day => (
              <button
                key={day.date}
                className={`date-option ${selectedDate === day.date ? 'selected' : ''}`}
                onClick={() => {
                  setSelectedDate(day.date)
                  setSelectedTime('')
                }}
              >
                <div className="day-name">{getDayName(day.date)}</div>
                <div className="day-date">{day.date.split('-')[2]}/{day.date.split('-')[1]}</div>
              </button>
            ))}
          </div>
          
          <button className="nav-btn next-date" onClick={() => scrollDates("right")}>
            <i className="fas fa-chevron-right"></i>
          </button>
        </div>
      </div>

      <div className="time-selection">
        <h4>
          <i className="fas fa-clock"></i>
          Chọn giờ khám
        </h4>
        <p className="time-info">
          <i className="fas fa-info-circle"></i>
          Mỗi khung giờ dài 30 phút. Giờ đã được đặt ký hiệu bằng
          <span className="booked-slot"></span>
        </p>
        {!selectedDate ? (
          <>
            <p className="time-info">
            Hãy chọn một ngày.
            </p>
          </>
        ) : (
          <>
            {loadingDay ? (
              <div className="time-selection"><h4>Loaing...</h4></div>
            ) : timeSlots.length === 0 ? (
              <div className="no-slots">
                <i className="fas fa-calendar-times"></i>
                <p>Không có lịch khám cho ngày này</p>
              </div>
            ) : (
              <div className="time-slots-grid">
                {timeSlots.map((slot, index) => (
                  <button
                    key={index}
                className={`time-slot 
                  ${slot.status === 'booked' ? 'booked' : ''}
                  ${slot.status === 'pending' ? 'pending' : ''}
                  ${formData.slotId === slot._id ? 'selected' : ''}
                `}
                    // onClick={() => {!slot.appointmentId && 
                    //     setFormData(prev => ({
                    //       ...prev,
                    //       slotId: slot._id,
                    //     }))
                    //     setSelectedTime(slot.startTime)
                    //     setTimeSlots(prev =>
                    //       prev.map(slot => ({
                    //         ...slot,
                    //         isSelected: slot.startTime === slot.startTime
                    //       }))
                    //     );
                    //   }
                    // }
                    onClick={() => handleProcessTimeSlot(slot)}
                    disabled={!!slot.appointmentId}
                  >
                    {slot.appointmentId && <i className="fas fa-ban"></i>}
                    {slot.startTime}
                  </button>
                ))}
              </div>
            )}
          </>
        )}

      </div>

      <div className="time-note">
        <i className="fas fa-exclamation-triangle"></i>
        <p>Vui lòng đến trước 15 phút để hoàn tất thủ tục. Nếu không thể đến, vui lòng hủy trước 2 giờ.</p>
      </div>
    </div>
  );

  const renderConfirmationStep = () => (
    <div className="step-content confirmation-step">
      <div className="step-header">
        <h3>
          <i className="fas fa-check-circle"></i>
          Xác nhận đặt lịch
        </h3>
        <p>Vui lòng kiểm tra thông tin đặt lịch trước khi xác nhận</p>
      </div>

      <div className="detail-section appointment-info">
        <h4>
          <i className="fas fa-calendar-check"></i>
          Thông tin lịch khám
        </h4>

        <div className="appointment-summary">
          <div className="summary-item">
            <span>Bác sĩ</span>
            <strong>{formData.doctorId?.userId.fullName}</strong>
          </div>

          <div className="summary-item">
            <span>Chuyên khoa</span>
            <strong>{formData.doctorId?.specialtyId?.name}</strong>
          </div>

          <div className="summary-item">
            <span>Ngày khám</span>
            <strong>
              {getDayName(selectedDate)} {selectedDate.split('-').reverse().join('/')}
            </strong>
          </div>

          <div className="summary-item">
            <span>Giờ khám</span>
            <strong>{selectedTime}</strong>
          </div>
        </div>
      </div>

      <div className="doctor-confirmation">
        <img
          src={formData.doctorId?.userId.image}
          alt={formData.doctorId?.userId.fullName}
        />

        <div className="doctor-info">
          <h3>{formData.doctorId?.userId.fullName}</h3>

          <span className="doctor-specialty">
            {formData.doctorId?.specialtyId?.name}
          </span>

          <div className="doctor-rating">
            ⭐ {formData.doctorId?.rating}
          </div>

          <div className="doctor-specialty">
            {formatPrice(formData.doctorId?.price)}
          </div>
        </div>
      </div>

      <div className="payment-summary">
        <div className="payment-row">
          <span>Phí khám: </span>
          <span>{formatPrice(formData.doctorId?.price)}</span>
        </div>

        <div className="payment-row total">
          <span>Tổng thanh toán: </span>
          <strong>{formatPrice(formData.doctorId?.price)}</strong>
        </div>
      </div>

        <div className="payment-method">
          <span>Phương thức thanh toán: </span>
          <strong>{formData.paymentMethod ? formData.paymentMethod : " Vui lòng chọn phương thức "}</strong>

          {formData.paymentMethod ?
           <button
              onClick={() => setShowPaymentModal(true)}
              className='change-btn'
            > Thay đổi</button> 
           : ""}
        </div>

      <div className="confirmation-note">
        <div className="note-icon">
          <i className="fas fa-lightbulb"></i>
        </div>
        <div className="note-content">
          <h6>Lưu ý quan trọng:</h6>
          <ul>
            <li>Vui lòng đến trước 15 phút giờ hẹn để làm thủ tục</li>
            <li>Mang theo CMND/CCCD và thẻ bảo hiểm y tế (nếu có)</li>
            <li>Hủy lịch trước 2 giờ để không bị tính phí</li>
            <li>Bạn sẽ nhận được SMS/Email xác nhận trong vòng 5 phút</li>
          </ul>
        </div>
      </div>
    </div>
  );

  return (
    <div className="booking-flow-container">
      <div className="booking-header">
        <div className="container">
          <div className="header-content">
            <button className="back-home-btn" onClick={() => window.location.href = '/'}>
              <i className="fas fa-arrow-left"></i>
              Về trang chủ
            </button>
            <h1>Đặt lịch khám bệnh</h1>
            <p>Hoàn thành 4 bước đơn giản để đặt lịch khám với bác sĩ chuyên khoa</p>
          </div>
        </div>
      </div>

      <div className="container main-content">
        {/* Progress Bar */}
        <div className="progress-bar">
          {steps.map((step) => (
            <div key={step.number} className="progress-step">
              <div className={`step-indicator ${currentStep >= step.number ? 'active' : ''}`}>
                <i className={step.icon}></i>
              </div>
              <div className="step-info">
                <div className="step-number">Bước {step.number}</div>
                <div className="step-title">{step.title}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Main Content */}
        <div className="booking-content">
          {renderStepContent()}

          {/* Navigation Buttons */}
          <div className="navigation-buttons">
            {currentStep > 1 && (
              <button className="nav-btn prev-btn" onClick={prevStep}>
                <i className="fas fa-arrow-left"></i>
                Quay lại
              </button>
            )}
            
            <button className="nav-btn next-btn" onClick={nextStep}>
              {currentStep < 4 ? (
                <>
                  Tiếp theo
                  <i className="fas fa-arrow-right"></i>
                </>
              ) : (
                <>
                  <i className="fas fa-check"></i>
                  Xác nhận đặt lịch
                </>
              )}
            </button>
          </div>
        </div>

        {/* Sidebar - Summary */}
        <div className="booking-sidebar">
          <div className="sidebar-card summary-card">
            <h3>
              <i className="fas fa-clipboard-list"></i>
              Tóm tắt đặt lịch
            </h3>
            
            <div className="summary-content">
              {currentStep >= 2 && formData.doctorId && (
                <div className="summary-item">
                  <div className="item-label">
                    <i className="fas fa-user-md"></i>
                    Bác sĩ:
                  </div>
                  <div className="item-value">{formData.doctorId.userId.fullName}</div>
                </div>
              )}
              
              {currentStep >= 3 && selectedTime && (
                <div className="summary-item">
                  <div className="item-label">
                    <i className="fas fa-clock"></i>
                    Thời gian:
                  </div>
                  <div className="item-value">
                    {getDayName(selectedDate)} {selectedDate.split('-').reverse().join('/')} 
                    <br />
                    {selectedTime}
                  </div>
                </div>
              )}
              
              {currentStep >= 1 && formData.symptoms.length > 0 && (
                <div className="summary-item">
                  <div className="item-label">
                    <i className="fas fa-stethoscope"></i>
                    Triệu chứng:
                  </div>
                  <div className="item-value">
                    {formData.symptoms.slice(0, 2).join(', ')}
                    {formData.symptoms.length > 2 && ` +${formData.symptoms.length - 2} triệu chứng khác`}
                  </div>
                </div>
              )}

              {currentStep >= 1 && formData.description && (
                <div className="summary-item">
                  <div className="item-label">
                    <i className="fas fa-stethoscope"></i>
                    Ghi chú:
                  </div>
                  <div className="item-value">
                    {formData.description}
                  </div>
                </div>
              )}

              {formData.doctorId && (
                <div className="summary-item total">
                  <div className="item-label">
                    <i className="fas fa-money-bill-wave"></i>
                    Tổng chi phí:
                  </div>
                  <div className="item-value total-price">
                    {formatPrice(formData.doctorId.price)}
                  </div>
                </div>
              )}
            </div>

            <div className="help-section">
              <div className="help-item">
                <i className="fas fa-headset"></i>
                <div className="help-content">
                  <h5>Cần hỗ trợ?</h5>
                  <p>Gọi ngay: <strong>1900 1234</strong></p>
                </div>
              </div>
            </div>
          </div>

          <div className="sidebar-card tips-card">
            <h3>
              <i className="fas fa-lightbulb"></i>
              Mẹo hữu ích
            </h3>
            <ul className="tips-list">
              <li>
                <i className="fas fa-check-circle"></i>
                Mô tả triệu chứng chi tiết giúp bác sĩ chuẩn bị tốt hơn
              </li>
              <li>
                <i className="fas fa-check-circle"></i>
                Đến sớm 15 phút để hoàn tất thủ tục
              </li>
              <li>
                <i className="fas fa-check-circle"></i>
                Mang theo các kết quả xét nghiệm cũ (nếu có)
              </li>
              <li>
                <i className="fas fa-check-circle"></i>
                Chuẩn bị sẵn các câu hỏi muốn hỏi bác sĩ
              </li>
            </ul>
          </div>
        </div>

        {showPaymentModal && 
          <div className="modal-overlay">
          <div className="modal-content order-detail-modal" onClick={e => e.stopPropagation()}>
            
            <div className="payment-methods">
            <div className="modal-header">
              <h3 className="payment-title">Chọn phương thức thanh toán</h3>
              <button className="close-btn" onClick={() => handleClosePayment()}>
                <i className="fas fa-times"></i>
              </button>
          </div>

              <div className="method-options">

                <label className="payment-card">
                  <input type="radio" name="payment" value="cash" defaultChecked />

                  <div className="card-content" 
                  onClick={() => {
                    setFormData(prev => ({ ...prev, paymentMethod: "cash" }))
                    setShowPaymentModal(false)
                  }
                    }>
                    <i className="fas fa-money-bill-wave"></i>
                    <span>Thanh toán tại phòng khám</span>
                  </div>
                </label>

                <label className="payment-card">
                  <input type="radio" name="payment" value="card" />

                  <div className="card-content" 
                  onClick={() => {
                    setFormData(prev => ({ ...prev, paymentMethod: "card" }))
                    setShowPaymentModal(false)
                  }
                  }>
                    <i className="fas fa-credit-card"></i>
                    <span>Thẻ tín dụng / ghi nợ</span>
                  </div>
                </label>

              </div>
            </div>

            <div className="terms-agreement">
              <label className="terms-checkbox">
                <input type="checkbox" />
                Tôi đồng ý với
                <button type="button" className="terms-link"> Điều khoản sử dụng </button>
                và
                <button type="button" className="terms-link"> Chính sách hủy lịch </button>
              </label>
            </div>

          </div>
        </div>
        }
      </div>
    </div>
  );
};

export default BookingFlow;