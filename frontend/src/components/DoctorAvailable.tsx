import React, { useState, useEffect, useMemo } from 'react';
import '../assets/doctorAvailable.css';
import { useAuthContext } from '../context/AuthContext';
import { createTimeSlotApi, deleteTimeSlotApi, getSlotsByDoctorAndDateApi,getSlotsByDoctorAndWeekApi, updateTimeSlotApi } from '../api/timeSlotApi';
import { useNotify } from '../hooks/useNotification';

const DoctorSchedule = () => {
  const [editSlot, setEditSlot] = useState<any>(null);
  const { doctor } = useAuthContext();
  const [selectedDate, setSelectedDate] = useState('');
  const [timeSlots, setTimeSlots] = useState<any[]>([]);
  const [currentWeek, setCurrentWeek] = useState(0);
  const [week ,setWeek] = useState<any>();
  //loading
  const [loadingDay, setLoadingDay] = useState(false);
  const [loadingWeek, setLoadingWeek] = useState(false);
  const notify = useNotify();

  const [formData, setFormdata] = useState({
    doctorId: doctor ? doctor._id : null, 
    date: '',
    startTime: '',
    endTime: '',
    maxPatients: 1
  });
  //lấy lịch ngày
  useEffect(() => {
    if (!doctor?._id || !selectedDate) return;

    const fetchSlots = async () => {
      try {
        setLoadingDay(true);
        const res = await getSlotsByDoctorAndDateApi(
          doctor._id,
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
  }, [doctor?._id, selectedDate]);
  // lấy cả tuần
  useEffect(() => {
    if (!doctor?._id || !weekDays) return;

    const fetchWeek = async () => {
      try {
        setLoadingWeek(true);             

        const startDate = weekDays[0].date;
        const slots = await getSlotsByDoctorAndWeekApi(
          doctor._id,
          startDate
        );

        const schedule = buildSchedulesFromSlots(slots);
        setWeek(schedule);
      } catch (err) {
        console.error(err);
        setWeek([]);
      } finally {
        setLoadingWeek(false);   
      }
    };

    fetchWeek();
  }, [doctor?._id, currentWeek]);


  // lịch làm việc 1 ngày
  const schedules: any = useMemo(() => {
    const map: any = {};

    timeSlots.forEach(slot => {
      console.log(slot.status)
      const date = slot.date.split('T')[0];

      if (!map[date]) {
        map[date] = {
          date,
          dayOfWeek: getDayOfWeek(date),
          slots: [],
          totalSlots: 0,
          bookedSlots: 0
        };
      }

      map[date].slots.push(slot);
      map[date].totalSlots++;

      if (slot.status=== 'booked') {
        map[date].bookedSlots++;
      }
    });

    return Object.values(map);
  }, [timeSlots]);

  // Tạo danh sách ngày trong tuần
  const generateWeekDays = () => {
    const days = [];
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + 1 + (currentWeek * 7)); // Start from Monday
    
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
  // Xử lý thay đổi form thêm slot mới
  const handleNewSlotChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormdata(prev => ({
      ...prev,
      [name]: name === 'maxPatients' ? parseInt(value) || 1 : value
    }));
  };

  // Validate time slot
  const validateTimeSlot = (date: string, startTime: string, endTime: string) => {
    if (!date || !startTime || !endTime) {
      notify.warning('Vui lòng nhập đầy đủ ngày và giờ');
      return false;
    }

    if (startTime >= endTime) {
      notify.warning('Giờ kết thúc phải sau giờ bắt đầu');
      return false;
    }

    // Check if slot overlaps with existing slots
    const existingSlots = schedules
      .find((day: any) => day.date === date)?.slots || [];

    const newStart = new Date(`${date}T${startTime}`);
    const newEnd = new Date(`${date}T${endTime}`);

    for (const slot of existingSlots) {
      if (slot._id === editSlot?._id) continue; // Skip the slot being edited
      
      const existingStart = new Date(`${date}T${slot.startTime}`);
      const existingEnd = new Date(`${date}T${slot.endTime}`);
      
      if (newStart < existingEnd && newEnd > existingStart) {
        notify.info(`Khung giờ này trùng với khung giờ đã có: ${slot.startTime} - ${slot.endTime}`);
        return false;
      }
    }

    return true;
  };
  // Thêm slot mới
  const handleAddSlot = async () => {
    if (!doctor?._id) {
      notify.warning("Không tìm thấy thông tin bác sĩ");
      return;
    }

    if (!validateTimeSlot(formData.date, formData.startTime, formData.endTime)) {
      return;
    }

    try {
      const res = await createTimeSlotApi(
        doctor._id,
        formData.date,
        formData.startTime,
        formData.endTime
      );

      const slots = res.data;

      let updatedSchedules = [...schedules];

      slots.forEach((slot: any) => {
        const newTimeSlot = {
          _id: slot._id,
          date: slot.date.split("T")[0],
          startTime: slot.startTime,
          endTime: slot.endTime,
          status: slot.status || "available",
        };

        const existingDayIndex = updatedSchedules.findIndex(
          (day: any) => day.date === newTimeSlot.date
        );

        if (existingDayIndex >= 0) {
          updatedSchedules[existingDayIndex] = {
            ...updatedSchedules[existingDayIndex],
            slots: [...updatedSchedules[existingDayIndex].slots, newTimeSlot],
            totalSlots: updatedSchedules[existingDayIndex].totalSlots + 1,
          };
        } else {
          updatedSchedules.push({
            date: newTimeSlot.date,
            dayOfWeek: getDayOfWeek(newTimeSlot.date),
            slots: [newTimeSlot],
            totalSlots: 1,
            bookedSlots: 0,
          });
        }
      });

      setTimeSlots(updatedSchedules);

      setFormdata({
        doctorId: doctor._id,
        date: "",
        startTime: "",
        endTime: "",
        maxPatients: 1,
      });

      notify.success("Đã thêm khung giờ thành công!");
    } catch (error) {
      console.error(error);
      notify.error("Thêm khung giờ thất bại");
    }
  };

  // Sửa slot
  const handleEditSlot = (slot: any) => {
    setEditSlot(slot);
    setFormdata({
      doctorId: doctor._id,
      date: slot.date,
      startTime: slot.startTime,
      endTime: slot.endTime,
      maxPatients: slot.maxPatients
    });
  };

  // Cập nhật slot
  const handleUpdateSlot = () => {
    if (!editSlot || !validateTimeSlot(formData.date, formData.startTime, formData.endTime)) {
      return;
    }

    const updatedSchedules = schedules.map((day: any) => {
      if (day.date === editSlot.date) {
        const updatedSlots = day.slots.map((slot:any) =>
          slot._id === editSlot._id
            ? {
                ...slot,
                date: formData.date,
                startTime: formData.startTime,
                endTime: formData.endTime,
                maxPatients: formData.maxPatients
              }
            : slot
        );

        // Nếu thay đổi ngày, cần xóa slot khỏi ngày cũ và thêm vào ngày mới
        if (formData.date !== editSlot.date) {
          // Xóa khỏi ngày cũ
          const filteredSlots = day.slots.filter((slot:any) => slot._id !== editSlot._id);
          
          // Thêm vào ngày mới
          const newDayIndex = schedules.findIndex((d: any) => d.date === formData.date);
          if (newDayIndex >= 0) {
            schedules[newDayIndex].slots.push({
              ...editSlot,
              date: formData.date,
              startTime: formData.startTime,
              endTime: formData.endTime,
              maxPatients: formData.maxPatients
            });
            schedules[newDayIndex].totalSlots += 1;
          } else {
            // Thêm ngày mới
            schedules.push({
              date: formData.date,
              dayOfWeek: getDayOfWeek(formData.date),
              slots: [{
                ...editSlot,
                date: formData.date,
                startTime: formData.startTime,
                endTime: formData.endTime,
                maxPatients: formData.maxPatients
              }],
              totalSlots: 1,
              bookedSlots: 0
            });
          }

          return {
            ...day,
            slots: filteredSlots,
            totalSlots: day.totalSlots - 1,
            bookedSlots: day.slots.filter((s:any) => s.status === 'booked').length
          };
        }

        return {
          ...day,
          slots: updatedSlots,
          bookedSlots: updatedSlots.filter((s:any) => s.status === 'booked').length
        };
      }
      return day;
    });

    setTimeSlots(updatedSchedules);
    setEditSlot(null);
    setFormdata({
      doctorId: doctor._id,
      date: '',
      startTime: '',
      endTime: '',
      maxPatients: 1
    });

    notify.success('Đã cập nhật khung giờ thành công!');
  };

  // Xóa slot
  const handleDeleteSlot = async (slotId: string) => {
    await deleteTimeSlotApi(slotId);

    setTimeSlots(prev =>
      prev.filter(slot => slot._id !== slotId)
    );
  };

  // Hủy edit
  const handleCancelEdit = () => {
    setEditSlot(null);
    setFormdata({
      doctorId: doctor._id,
      date: '',
      startTime: '',
      endTime: '',
      maxPatients: 1
    });
  };

  // Lấy tên thứ trong tuần
  function getDayOfWeek(dateString: string) {
    const date = new Date(dateString);
    const days = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
    return days[date.getDay()];
  };

  // Tạo danh sách giờ
  const generateTimeOptions = () => {
    const times = [];
    for (let hour = 7; hour <= 20; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        times.push(time);
      }
    }
    return times;
  };

  const timeOptions = generateTimeOptions();

  // Toggle slot status
    const toggleSlotStatus = async (slot: any) => {
      try{
        const newStatus = slot.status === 'available' ? 'cancelled' : 'available';

        await updateTimeSlotApi(slot._id, newStatus);

        setTimeSlots(prev =>
          prev.map(s =>
            s._id === slot._id ? { ...s, status: newStatus } : s
          )
        );
        notify.success("Đã thay đổi trạng thái thành công", 'thông báo')
      } catch (e) {
        notify.error("Có lỗi xảy ra, vui lòng thử lại sau", 'thông báo')
        console.log(e)
      }
    };

  // Tính tổng số slot
  const getStats = () => {
    let totalSlots = 0;
    let availableSlots = 0;
    let bookedSlots = 0;
    let cancelledSlots = 0;

    schedules?.forEach((day: any) => {
      day.slots.forEach((slot:any) => {
        totalSlots++;
        if (slot.status === 'available') availableSlots++;
        if (slot.status === 'booked') bookedSlots++;
        if (slot.status === 'cancelled') cancelledSlots++;
      });
    });

    return { totalSlots, availableSlots, bookedSlots, cancelledSlots };
  };

  const stats = getStats();

  // Lấy schedule cho ngày được chọn
  const getSelectedDaySchedule = (): any => {
    return schedules.find((day: any) => day.date === selectedDate) || { slots: [], date: '', dayOfWeek: '', totalSlots: 0, bookedSlots: 0 };
  };

  // Copy schedule từ ngày này sang ngày khác
  const handleCopySchedule = (fromDate: string, toDate: string) => {
    const sourceDay = schedules.find((day: any) => day.date === fromDate) as any;
    if (!sourceDay) {
      notify.warning('Không tìm thấy lịch cho ngày nguồn');
      return;
    }

    if (!confirm(`Sao chép lịch từ ${fromDate} sang ${toDate}?`)) {
      return;
    }

    const formDatas = sourceDay.slots.map((slot:any) => ({
      ...slot,
      id: `copy_${Date.now()}_${slot._id}`,
      date: toDate,
      status: 'available',
      patientCount: 0
    }));

    const existingDayIndex = schedules.findIndex((day: any) => day.date === toDate);
    
    if (existingDayIndex >= 0) {
      // Cập nhật ngày đã tồn tại
      const updatedSchedules = [...schedules];
      updatedSchedules[existingDayIndex] = {
        ...updatedSchedules[existingDayIndex],
        slots: [...updatedSchedules[existingDayIndex].slots, ...formDatas],
        totalSlots: updatedSchedules[existingDayIndex].totalSlots + formDatas.length
      };
      setTimeSlots(updatedSchedules);
    } else {
      // Thêm ngày mới
      const newDay: any = {
        date: toDate,
        dayOfWeek: getDayOfWeek(toDate),
        slots: formDatas,
        totalSlots: formDatas.length,
        bookedSlots: 0
      };
      setTimeSlots(prev => [...prev, newDay]);
    }

    notify.success(`Đã sao chép ${formDatas.length} khung giờ sang ${toDate}`);
  };

  // Format date để hiển thị
  const formatDisplayDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}`;
  };

  //map data lại
  const buildSchedulesFromSlots = (slots: any[]) => {
    const map: Record<string, any> = {};

    slots.forEach(slot => {
      const dateKey = slot.date.split('T')[0];

      if (!map[dateKey]) {
        map[dateKey] = {
          date: dateKey,
          slots: [],
          bookedSlots: 0
        };
      }

      map[dateKey].slots.push(slot);

      if (slot.status === 'booked') {
        map[dateKey].bookedSlots++;
      }
    });

    return Object.values(map);
  };

  // Render calendar view
  const renderCalendarView = () => {
    return (
      <div className="calendar-view">
        <div className="calendar-header">
          <button className="nav-btn" onClick={() => setCurrentWeek(prev => prev - 1)}>
            <i className="fas fa-chevron-left"></i> Tuần trước
          </button>
          <h3>
            Tuần {currentWeek >= 0 ? currentWeek + 1 : 'trước'} -{' '}
            {weekDays[0].dayNumber}/{weekDays[0].month} - {weekDays[6].dayNumber}/{weekDays[6].month}
          </h3>
          <button className="nav-btn" onClick={() => setCurrentWeek(prev => prev + 1)}>
            Tuần sau <i className="fas fa-chevron-right"></i>
          </button>
        </div>
      {loadingWeek ? (
        <>
          <div className="calendar-header">
            <h3>loading...</h3>
          </div>
        </>
      ) : (
        <div className="week-grid">
          {weekDays.map(day => {
            const daySchedule = week ? week.find((s: any) => s.date === day.date) : null;
            const slotCount = daySchedule?.slots?.length ?? 0;
            const bookedCount = daySchedule?.bookedSlots ?? 0;

            return (
              <div 
                key={day.date} 
                className={`day-cell ${selectedDate === day.date ? 'selected' : ''} ${day.date === new Date().toISOString().split('T')[0] ? 'today' : ''}`}
                onClick={() => setSelectedDate(day.date)}
              >
                <div className="day-header">
                  <div className="day-name">{day.dayOfWeek}</div>
                  <div className="day-date">{formatDisplayDate(day.date)}</div>
                </div>
                <div className="day-stats">
                  {slotCount > 0 ? (
                    <>
                      <div className="stat">
                        <i className="fas fa-clock"></i>
                        <span>{slotCount} khung giờ</span>
                      </div>
                      <div className="stat">
                        <i className="fas fa-user-check"></i>
                        <span>{bookedCount} đã đặt</span>
                      </div>
                    </>
                  ) : (
                    <div className="no-slots">
                      <i className="fas fa-calendar-times"></i>
                      <span>Chưa có lịch</span>
                    </div>
                  )}
                </div>
                {daySchedule && (
                  <button 
                    className="copy-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      const nextDay = new Date(day.date);
                      nextDay.setDate(nextDay.getDate() + 1);
                      const nextDayStr = nextDay.toISOString().split('T')[0];
                      handleCopySchedule(day.date, nextDayStr);
                    }}
                    title="Sao chép sang ngày mai"
                  >
                    <i className="fas fa-copy"></i>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      </div>
    );
  };

  // Render time slots cho ngày được chọn
  const renderTimeSlots = () => {
    const selectedDay = getSelectedDaySchedule();

    return (
      <div className="time-slots-section">
        <div className="section-header">
          <h3>
            <i className="fas fa-clock"></i>
            Khung giờ - {selectedDate ? `${getDayOfWeek(selectedDate)} ${formatDisplayDate(selectedDate)}` : 'Chọn ngày'}
          </h3>
          {selectedDate && (
            <button 
              className="add-slot-btn"
              onClick={() => setFormdata(prev => ({ ...prev, date: selectedDate }))}
            >
              <i className="fas fa-plus"></i>
              Thêm khung giờ
            </button>
          )}
        </div>
      {loadingDay ? (
        <>
          <div className="calendar-header">
            <h3>loading...</h3>
          </div>
        </>
      ) : (
        <>
        {selectedDate ? (
          selectedDay.slots.length > 0 ? (
            <div className="slots-list">
              {selectedDay.slots.map((slot: any) => (
                <div key={slot._id} className={`time-slot-card ${slot.status}`}>
                  <div className="slot-time">
                    <div className="time-range">
                      <i className="fas fa-clock"></i>
                      {slot.startTime} - {slot.endTime}
                    </div>
                    <div className="duration">
                      {calculateDuration(slot.startTime, slot.endTime)} phút
                    </div>
                  </div>

                  <div className="slot-info">
                    <div className="slot-status">
                      <span className={`status-badge ${slot.status}`}>
                        {slot.status === 'available' ? 'Có sẵn' : 
                         slot.status === 'booked' ? 'Đã đặt' : 'Đã hủy'}
                      </span>
                    </div>
                    
                    <div className="slot-patients">
                      <i className="fas fa-users"></i>
                      <span>{slot.patientCount}/{slot.maxPatients} bệnh nhân</span>
                    </div>

                    <div className="slot-actions">
                      <button 
                        className="action-btn edit-btn"
                        onClick={() => handleEditSlot(slot)}
                        title="Sửa khung giờ"
                      >
                        <i className="fas fa-edit"></i>
                      </button>
                      
                      <button 
                        className={`action-btn toggle-btn ${slot.status === 'cancelled' ? 'activate' : 'cancel'}`}
                        onClick={() => toggleSlotStatus(slot._id)}
                        title={slot.status === 'cancelled' ? 'Kích hoạt lại' : 'Hủy khung giờ'}
                      >
                        <i className={slot.status === 'cancelled' ? 'fas fa-check' : 'fas fa-ban'}></i>
                      </button>
                      
                      <button 
                        className="action-btn delete-btn"
                        onClick={() => handleDeleteSlot(slot._id)}
                        title="Xóa khung giờ"
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  </div>

                  {slot.status === 'booked' && (
                    <div className="booked-info">
                      <i className="fas fa-exclamation-circle"></i>
                      <span>Không thể chỉnh sửa khi đã có bệnh nhân đặt lịch</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-slots">
              <i className="fas fa-calendar-plus"></i>
              <p>Chưa có khung giờ nào cho ngày này</p>
              <button 
                className="add-first-slot-btn"
                onClick={() => setFormdata(prev => ({ ...prev, date: selectedDate }))}
              >
                <i className="fas fa-plus"></i>
                Thêm khung giờ đầu tiên
              </button>
            </div>
          )
        ) : (
          <div className="select-day-prompt">
            <i className="fas fa-calendar-alt"></i>
            <p>Vui lòng chọn một ngày để xem và quản lý khung giờ</p>
          </div>
        )}
        </>
      )}

      </div>
    );
  };

  // Tính thời lượng
  const calculateDuration = (startTime: string, endTime: string) => {
    if (!startTime || !endTime) return 0;
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);
    return (endHour * 60 + endMinute) - (startHour * 60 + startMinute);
  };

  // Xuất lịch
  const handleExportSchedule = () => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Ngày,Thứ,Giờ bắt đầu,Giờ kết thúc,Trạng thái,Số bệnh nhân,Tối đa\n"
      + schedules.flatMap((day: any) => 
          day.slots.map((slot:any) => 
            `${day.date},${day.dayOfWeek},${slot.startTime},${slot.endTime},${slot.status},${slot.patientCount},${slot.maxPatients}`
          )
        ).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `lich-bac-si-${doctor.name.replace(/\s+/g, '-')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    notify.success('Đã xuất lịch thành công!');
  };
  return (
    <div className="doctor-schedule-container">
      {/* Header */}
      <div className="schedule-header">
        <div className="container">
          <div className="header-content">
            {!doctor ? (
                'Đang tải hồ sơ bác sĩ...'
            ) : (
            <div className="doctor-info-header">
              <div className="doctor-avatar">
                <img src={doctor.image} alt="" />
              </div>
              <div className="doctor-details">
                <h1>{doctor.userId.fullName}</h1>
                <div className="doctor-specialty">{doctor.specialtyId.name}</div>
                <div className="doctor-contact">
                  <span><i className="fas fa-envelope"></i> {doctor.userId.email}</span>
                  <span><i className="fas fa-phone"></i> {doctor.userId.phone}</span>
                </div>
              </div>
            </div>
                   
            )}
            <div className="header-actions">
              <button className="export-btn" onClick={handleExportSchedule}>
                <i className="fas fa-file-export"></i>
                Xuất lịch
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container main-content">
        <div className="content-wrapper">
          {/* Left Side - Add/Edit Form & Stats */}
          <div className="left-sidebar">
            {/* Stats Card */}
            <div className="stats-card">
              <h3>
                <i className="fas fa-chart-bar"></i>
                Thống kê lịch làm việc
              </h3>
              <div className="stats-grid">
                <div className="stat-item total">
                  <div className="stat-icon">
                    <i className="fas fa-calendar-alt"></i>
                  </div>
                  <div className="stat-content">
                    <div className="stat-value">{stats.totalSlots}</div>
                    <div className="stat-label">Tổng khung giờ</div>
                  </div>
                </div>
                
                <div className="stat-item available">
                  <div className="stat-icon">
                    <i className="fas fa-check-circle"></i>
                  </div>
                  <div className="stat-content">
                    <div className="stat-value">{stats.availableSlots}</div>
                    <div className="stat-label">Có sẵn</div>
                  </div>
                </div>
                
                <div className="stat-item booked">
                  <div className="stat-icon">
                    <i className="fas fa-user-check"></i>
                  </div>
                  <div className="stat-content">
                    <div className="stat-value">{stats.bookedSlots}</div>
                    <div className="stat-label">Đã đặt</div>
                  </div>
                </div>
                
                <div className="stat-item cancelled">
                  <div className="stat-icon">
                    <i className="fas fa-ban"></i>
                  </div>
                  <div className="stat-content">
                    <div className="stat-value">{stats.cancelledSlots}</div>
                    <div className="stat-label">Đã hủy</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Add/Edit Form */}
            <div className="form-card">
              <h3>
                <i className={editSlot ? "fas fa-edit" : "fas fa-plus-circle"}></i>
                {editSlot ? 'Sửa khung giờ' : 'Thêm khung giờ mới'}
              </h3>
              
              <div className="form-group">
                <label htmlFor="date">
                  <i className="fas fa-calendar-day"></i>
                  Ngày *
                </label>
                <input
                  type="date"
                  id="date"
                  name="date"
                  value={formData.date}
                  onChange={handleNewSlotChange}
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>

              <div className="time-inputs">
                <div className="form-group">
                  <label htmlFor="startTime">
                    <i className="fas fa-play-circle"></i>
                    Giờ bắt đầu *
                  </label>
                  <select
                    id="startTime"
                    name="startTime"
                    value={formData.startTime}
                    onChange={handleNewSlotChange}
                    required
                  >
                    <option value="">Chọn giờ bắt đầu</option>
                    {timeOptions.map(time => (
                      <option key={time} value={time}>{time}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="endTime">
                    <i className="fas fa-stop-circle"></i>
                    Giờ kết thúc *
                  </label>
                  <select
                    id="endTime"
                    name="endTime"
                    value={formData.endTime}
                    onChange={handleNewSlotChange}
                    required
                  >
                    <option value="">Chọn giờ kết thúc</option>
                    {timeOptions
                      .filter(time => time > formData.startTime)
                      .map(time => (
                        <option key={time} value={time}>{time}</option>
                      ))
                    }
                  </select>
                </div>
              </div>
              <div className="form-actions">
                {editSlot ? (
                  <>
                    <button className="action-btn cancel-btn" onClick={handleCancelEdit}>
                      <i className="fas fa-times"></i>
                      Hủy
                    </button>
                    <button className="action-btn update-btn" onClick={handleUpdateSlot}>
                      <i className="fas fa-save"></i>
                      Cập nhật
                    </button>
                  </>
                ) : (
                  <button className="action-btn add-btn" onClick={handleAddSlot}>
                    <i className="fas fa-plus"></i>
                    Thêm khung giờ
                  </button>
                )}
              </div>

              <div className="form-tips">
                <h4>
                  <i className="fas fa-lightbulb"></i>
                  Gợi ý thêm lịch:
                </h4>
                <ul>
                  <li>Mỗi khung giờ nên kéo dài 30-60 phút</li>
                  <li>Nên có 15 phút nghỉ giữa các khung giờ</li>
                  <li>Có thể sao chép lịch từ ngày này sang ngày khác</li>
                  <li>Hủy khung giờ trước 24h nếu không thể tiếp nhận</li>
                </ul>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="quick-actions-card">
              <h3>
                <i className="fas fa-bolt"></i>
                Thao tác nhanh
              </h3>
              <div className="quick-actions">
                <button 
                  className="quick-action"
                  onClick={() => {
                    const today = new Date().toISOString().split('T')[0];
                    setSelectedDate(today);
                  }}
                >
                  <i className="fas fa-calendar-day"></i>
                  Xem lịch hôm nay
                </button>
                <button 
                  className="quick-action"
                  onClick={() => {
                    const tomorrow = new Date();
                    tomorrow.setDate(tomorrow.getDate() + 1);
                    const tomorrowStr = tomorrow.toISOString().split('T')[0];
                    setSelectedDate(tomorrowStr);
                  }}
                >
                  <i className="fas fa-forward"></i>
                  Xem lịch ngày mai
                </button>
                <button 
                  className="quick-action"
                  onClick={() => {
                    // Tạo lịch cho cả tuần sau
                    const nextWeekDates = weekDays.map(day => day.date);
                    notify.info('Tính năng tạo lịch cho cả tuần đang phát triển');
                  }}
                >
                  <i className="fas fa-calendar-week"></i>
                  Tạo lịch cả tuần
                </button>
              </div>
            </div>
          </div>

          {/* Main Content - Calendar & Time Slots */}
          <div className="main-content-area">
            {/* Calendar View */}
            {renderCalendarView()}

            {/* Time Slots */}
            {renderTimeSlots()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorSchedule;