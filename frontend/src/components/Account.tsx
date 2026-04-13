import React, { useState, useEffect } from 'react';
import '../assets/account.css';
import { changePassword, updateAvatar, updateProfile } from '../api/authApi'
import { getDoctor, updateDoctor } from '../api/doctorApi'
import { useAuthContext } from '../context/AuthContext';
import { useNotify } from '../hooks/useNotification';
import { useNavigate } from 'react-router-dom';
import type { Order } from './Order';
import { getMyOrder } from '../api/orderApi';

interface AccountStats {
  totalAppointments: number;
  completedAppointments: number;
  upcomingAppointments: number;
  totalOrders: number;
  totalSpent: number;
  memberSince: string;
}

const Account = () => {
  const { user, setUser, doctor, isLoading } = useAuthContext();
  const notify = useNotify();
  const navigate = useNavigate();
  // State cho account stats
  const [orders, setOrders] = useState<Order[]>([]);
  
  const [stats, setStats] = useState<AccountStats>({
    totalAppointments: 24,
    completedAppointments: 18,
    upcomingAppointments: 6,
    totalOrders: 12,
    totalSpent: 8500000,
    memberSince: '15/01/2024'
  });

  // State cho edit mode
  const [editMode, setEditMode] = useState<'profile' | 'password' | 'doctor' | null>(null);
  const [EditLoading, setEditLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [loading, setLoading] = useState(false);

  // Form states
    const [profileForm, setProfileForm] = useState({
    name: '',
    phone: '',
    gender: '',
    email: '',
    });


  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [doctorForm, setDoctorForm] = useState<any>({
    specialtyId: '',
    description: '',
    experienceYears: 0,
    price: 0,
    qualifications: '',
  });

  // Avatar upload
  const [avatarPreview, setAvatarPreview] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  console.log(profileForm)
  // Initialize forms
  useEffect(() => {
    if(!user) return;
    setProfileForm({
        name: user.fullName || '',
        phone: user.phone || '',
        email: user.email || '',
        gender: user.gender || ''
    });
    setAvatarPreview(user.image || '');
  }, [user]);

  useEffect(() => {
    if(!doctor) return;
    setDoctorForm({
        specialty: doctor.specialtyId.name || '',
        description: doctor.description || '',
        experienceYears: doctor.experienceYears || 0,
        price: doctor.price || 0,
        qualifications: doctor.qualifications.join('\n') || ''
    });
    setAvatarPreview(doctor.userId.image || '');
  }, [user]);

    useEffect(() => {
      const fetchOrders = async () => {
        try {
          setLoading(true);
          const data = await getMyOrder();
  
          // Nếu backend trả mảng orders
          setOrders(data || []);
        } catch (error) {
          console.error("Fetch orders failed:", error);
        } finally {
          setLoading(false);
        }
      };
  
      fetchOrders();
    }, []);
  

  // Handle profile form change
  const handleProfileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setProfileForm((prev: any) => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle doctor form change
  const handleDoctorChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
  setDoctorForm((prev: any) => ({
    ...prev,
    [name]: value
  }));
  };

  // Handle avatar change
  const handleAvatarChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      notify.warning("Ảnh không được vượt quá 5MB", "Thông báo");
      return;
    }

    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  // Save profile changes
  const handleSaveProfile = async () => {
    if (!profileForm.name.trim() || 
        !profileForm.email.trim() || 
        !profileForm.phone.trim() ||
        !profileForm.gender.trim()
        ) {
      notify.warning("Vui lòng điền đầy đủ thông tin", "Thông báo");
      return;
    }

    if (!/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(profileForm.email)) {
      notify.warning("Email không hợp lệ", "Thông báo");
      return;
    }

    if (!/(84|0[3|5|7|8|9])+([0-9]{8})\b/.test(profileForm.phone.replace(/\s/g, ""))) {
      notify.warning("Số điện thoại không hợp lệ", "Thông báo");
      return;
    }

    if (!["nam", "nữ", "khác"].includes(profileForm.gender?.trim()?.toLowerCase())) {
       notify.warning("thông báo","Giới tính chỉ được nhập: nam, nữ hoặc khác");
    }
    try {
      setEditLoading(true);

      // update thông tin trước
      await updateProfile(
        profileForm.name,
        profileForm.phone,
        profileForm.email,
        profileForm.gender
      );

      // nếu có avatar thì update tiếp
      if (avatarFile) {
        const formData = new FormData();
        formData.append("image", avatarFile);
        const data = await updateAvatar(formData);
      }

      notify.success("Cập nhật thành công", "Thông báo");
      setEditMode(null)
      setUser((prev: any) => ({
        ...prev,
        fullName: profileForm.name,
        phone: profileForm.phone,
        email: profileForm.email,
        gender: profileForm.gender,
        image: avatarPreview,
      }));
    } catch (error) {
      console.error(error);
      notify.error("Cập nhật thất bại", "Thông báo");
    } finally {
      setEditLoading(false);
    }
  };

  // Change password
  const handleChangePassword = async () => {
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      notify.warning('Vui lòng điền đầy đủ thông tin', "Thông báo");
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      notify.warning('Mật khẩu mới phải có ít nhất 6 ký tự', "Thông báo");
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      notify.warning('Mật khẩu xác nhận không khớp', "Thông báo");
      return;
    }

    try {
        setEditLoading(true);
        await changePassword(passwordForm.currentPassword, passwordForm.newPassword)
        setEditLoading(false);
    } catch (e) {
        console.log(e)
    } finally {
        setEditLoading(false);
    }
  };

  // Save doctor info
  const handleSaveDoctorInfo = async () => {
    if (!doctorForm.specialty.trim() || !doctorForm.description.trim()) {
      notify.warning('Vui lòng điền đầy đủ thông tin', "Thông báo");
      return;
    }

    if (doctorForm.experience < 0) {
      notify.warning('Số năm kinh nghiệm không hợp lệ', "Thông báo");
      return;
    }

    if (doctorForm.consultationFee < 0) {
      notify.warning('Phí tư vấn không hợp lệ', "Thông báo");
      return;
    }
    try {
        setEditLoading(true);
        await updateDoctor(
            doctor._id,
            doctorForm.specialtyId,
            doctorForm.experienceYears,
            doctorForm.qualifications,
            doctorForm.description,
            doctorForm.price,
            )

    } catch (e) {
        console.log(e)
    } finally {
        setEditLoading(false);
        setEditMode(null)
    }
  };

  // Cancel edit
  const handleCancelEdit = () => {
    if(!user) return;
    setEditMode(null);
    setProfileForm({
      name: user.fullName || '',
      phone: user.phone || '',
      email: user.email || '',
      gender: user.gender || ''
    });
    setAvatarPreview(user.image || '');
    setAvatarFile(null);
    setPasswordForm({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setDoctorForm({
      specialty: doctor.specialtyId.name,
      description: doctor.description,
      experienceYears: doctor.experienceYears,
      price: doctor.price,
      qualifications: doctor.qualifications.join('\n')
    });
  };

  // Render rating stars
  const renderRatingStars = (rating: number) => {
    return (
      <div className="rating-stars">
        {[...Array(5)].map((_, i) => (
          <i 
            key={i} 
            className={`fas fa-star ${i < Math.floor(rating) ? 'filled' : ''} ${i === Math.floor(rating) && rating % 1 >= 0.5 ? 'half' : ''}`}
          ></i>
        ))}
        <span className="rating-value">{rating?.toFixed(1)}</span>
        <span className="rating-count">({doctor?.totalReviews} đánh giá)</span>
      </div>
    );
  };

  // Render account stats
  const renderStats = () => (
    <div className="stats-grid">
      <div className="stat-card">
        <div className="stat-icon appointments">
          <i className="fas fa-calendar-check"></i>
        </div>
        <div className="stat-info">
          <div className="stat-value">{stats.totalAppointments}</div>
          <div className="stat-label">Tổng cuộc hẹn</div>
        </div>
      </div>
      
      <div className="stat-card">
        <div className="stat-icon completed">
          <i className="fas fa-check-circle"></i>
        </div>
        <div className="stat-info">
          <div className="stat-value">{stats.completedAppointments}</div>
          <div className="stat-label">Đã hoàn thành</div>
        </div>
      </div>
      
      <div className="stat-card">
        <div className="stat-icon upcoming">
          <i className="fas fa-clock"></i>
        </div>
        <div className="stat-info">
          <div className="stat-value">{stats.upcomingAppointments}</div>
          <div className="stat-label">Sắp tới</div>
        </div>
      </div>
      
      <div className="stat-card">
        <div className="stat-icon orders">
          <i className="fas fa-shopping-bag"></i>
        </div>
        <div className="stat-info">
          <div className="stat-value">{orders.length}</div>
          <div className="stat-label">Đơn hàng</div>
        </div>
      </div>
      
      <div className="stat-card">
        <div className="stat-icon spent">
          <i className="fas fa-wallet"></i>
        </div>
        <div className="stat-info">
          <div className="stat-value">{new Intl.NumberFormat('vi-VN').format(stats.totalSpent)} ₫</div>
          <div className="stat-label">Tổng chi tiêu</div>
        </div>
      </div>
      
      <div className="stat-card">
        <div className="stat-icon member">
          <i className="fas fa-user-clock"></i>
        </div>
        <div className="stat-info">
          <div className="stat-value">Thành viên</div>
          <div className="stat-label">Từ {user?.createdAt.slice(0,10)}</div>
        </div>
      </div>
    </div>
  );

  // Render profile section
  const renderProfileSection = () => (
    <div className="profile-section">
      <div className="section-header">
        <h3>
          <i className="fas fa-user-circle"></i>
          Thông tin cá nhân
        </h3>
        {editMode !== 'profile' && (
          <button 
            className="edit-btn"
            onClick={() => setEditMode('profile')}
          >
            <i className="fas fa-edit"></i>
            Chỉnh sửa
          </button>
        )}
      </div>

      {editMode === 'profile' ? (
        <div className="edit-form">
          {/* Avatar Upload */}
          <div className="avatar-upload">
            <div className="avatar-preview">
              <img src={avatarPreview} alt="Avatar preview" />
              <div className="avatar-overlay">
                <i className="fas fa-camera"></i>
                <span>Đổi ảnh</span>
              </div>
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleAvatarChange}
                className="avatar-input"
              />
            </div>
            <div className="avatar-notes">
              <p><i className="fas fa-info-circle"></i> Kích thước tối đa 5MB</p>
              <p><i className="fas fa-info-circle"></i> Định dạng: JPG, PNG, GIF</p>
            </div>
          </div>

          {uploadProgress > 0 && uploadProgress < 100 && (
            <div className="upload-progress">
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
              <span>{uploadProgress}%</span>
            </div>
          )}

          {/* Form Fields */}
          <div className="form-fields">
            <div className="form-group">
              <label>
                <i className="fas fa-user"></i>
                Họ và tên *
              </label>
              <input
                type="text"
                name="name"
                value={profileForm.name}
                onChange={handleProfileChange}
                placeholder="Nhập họ và tên"
              />
            </div>

            <div className="form-group">
              <label>
                <i className="fas fa-envelope"></i>
                Email *
              </label>
              <input
                type="email"
                name="email"
                value={profileForm.email}
                onChange={handleProfileChange}
                placeholder="example@email.com"
              />
            </div>

            <div className="form-group">
              <label>
                <i className="fas fa-envelope"></i>
                Giới tính *
              </label>
              <input
                type="gender"
                name="gender"
                value={profileForm.gender}
                onChange={handleProfileChange}
                placeholder="Nam/Nữ/Khác"
              />
            </div>

            <div className="form-group">
              <label>
                <i className="fas fa-phone"></i>
                Số điện thoại *
              </label>
              <input
                type="tel"
                name="phone"
                value={profileForm.phone}
                onChange={handleProfileChange}
                placeholder="0987 654 321"
              />
            </div>


            <div className="form-actions">
              <button 
                className="cancel-btn"
                onClick={handleCancelEdit}
                disabled={EditLoading}
              >
                <i className="fas fa-times"></i>
                Hủy
              </button>
              <button 
                className="save-btn"
                onClick={handleSaveProfile}
                disabled={EditLoading}
              >
                {EditLoading ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i>
                    Đang lưu...
                  </>
                ) : (
                  <>
                    <i className="fas fa-save" onClick={handleSaveProfile}></i>
                    Lưu thay đổi
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      ) : ( isLoading ? (
            <div className="stat-value">Loading...</div>
            ) : (user && 
            <div className="profile-info">
            <div className="profile-avatar">
                <img src={user.image} alt={user.fullName} />
                {user.role === 'doctor' && (
                <div className="doctor-badge">
                    <i className="fas fa-user-md"></i>
                </div>
                )}
            </div>
            
            <div className="profile-details">
                <div className="detail-row">
                <div className="detail-label">
                    <i className="fas fa-user"></i>
                    Họ và tên:
                </div>
                <div className="detail-value">{user.fullName}</div>
                </div>
                
                <div className="detail-row">
                <div className="detail-label">
                    <i className="fas fa-envelope"></i>
                    Email:
                </div>
                <div className="detail-value">{user.email}</div>
                </div>
                
                <div className="detail-row">
                <div className="detail-label">
                    <i className="fas fa-phone"></i>
                    Số điện thoại:
                </div>
                {user.phone ? (
                <div className="detail-value">{user.phone}</div> ) : (
                <div className="detail-value-warning">Vui lòng cập nhập thông tin</div>
                )}
                </div>
                <div className="detail-row">
                <div className="detail-label">
                    <i className="fas fa-user-tag"></i>
                    Vai trò:
                </div>
                <div className="detail-value">
                    <span className={`role-badge ${user.role}`}>
                    {user.role === 'patient' ? 'Bệnh nhân' : 'Bác sĩ'}
                    </span>
                </div>
                </div>
                
                                <div className="detail-row">
                <div className="detail-label">
                    <i className="fas fa-user-tag"></i>
                    Giới tính:
                </div>
                <div className="detail-value">
                    <span className={`role-badge ${user.role}`}>
                    {user.gender?.toLocaleLowerCase() === 'male' || 'nam' ? 'Nam' : user.gender?.toLocaleLowerCase() === 'female' || 'nữ' ? 'Nữ' : 'Khác'}
                    </span>
                </div>
                </div>

                <div className="detail-row">
                <div className="detail-label">
                    <i className="fas fa-calendar-alt"></i>
                    Tham gia:
                </div>
                <div className="detail-value">{user.createdAt.slice(0,10)}</div>
                </div>
                
                <div className="detail-row">
                <div className="detail-label">
                    <i className="fas fa-sign-in-alt"></i>
                    Đăng nhập cuối:
                </div>
                <div className="detail-value">
                    {user.updatedAt.slice(0,10)}
                </div>
                </div>
            </div>
            </div>
            )
      )}
    </div>
  );

  // Render password section
  const renderPasswordSection = () => (
    <div className="password-section">
      <div className="section-header">
        <h3>
          <i className="fas fa-lock"></i>
          Bảo mật & Mật khẩu
        </h3>
        {editMode !== 'password' && (
          <button 
            className="edit-btn"
            onClick={() => setEditMode('password')}
          >
            <i className="fas fa-key"></i>
            Đổi mật khẩu
          </button>
        )}
      </div>

      {editMode === 'password' ? (
        <div className="edit-form">
          <div className="form-fields">
            <div className="form-group">
              <label>
                <i className="fas fa-lock"></i>
                Mật khẩu hiện tại *
              </label>
              <input
                type="password"
                name="currentPassword"
                value={passwordForm.currentPassword}
                onChange={handlePasswordChange}
                placeholder="Nhập mật khẩu hiện tại"
              />
            </div>

            <div className="form-group">
              <label>
                <i className="fas fa-key"></i>
                Mật khẩu mới *
              </label>
              <input
                type="password"
                name="newPassword"
                value={passwordForm.newPassword}
                onChange={handlePasswordChange}
                placeholder="Nhập mật khẩu mới (ít nhất 6 ký tự)"
              />
            </div>

            <div className="form-group">
              <label>
                <i className="fas fa-key"></i>
                Xác nhận mật khẩu *
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={passwordForm.confirmPassword}
                onChange={handlePasswordChange}
                placeholder="Nhập lại mật khẩu mới"
              />
            </div>

            <div className="password-requirements">
              <h4>
                <i className="fas fa-shield-alt"></i>
                Yêu cầu mật khẩu an toàn:
              </h4>
              <ul>
                <li className={passwordForm.newPassword.length >= 6 ? 'met' : ''}>
                  <i className={`fas ${passwordForm.newPassword.length >= 6 ? 'fa-check-circle' : 'fa-circle'}`}></i>
                  Ít nhất 6 ký tự
                </li>
                <li className={/(?=.*[a-z])/.test(passwordForm.newPassword) ? 'met' : ''}>
                  <i className={`fas ${/(?=.*[a-z])/.test(passwordForm.newPassword) ? 'fa-check-circle' : 'fa-circle'}`}></i>
                  Chữ thường
                </li>
                <li className={/(?=.*[A-Z])/.test(passwordForm.newPassword) ? 'met' : ''}>
                  <i className={`fas ${/(?=.*[A-Z])/.test(passwordForm.newPassword) ? 'fa-check-circle' : 'fa-circle'}`}></i>
                  Chữ hoa
                </li>
                <li className={/(?=.*\d)/.test(passwordForm.newPassword) ? 'met' : ''}>
                  <i className={`fas ${/(?=.*\d)/.test(passwordForm.newPassword) ? 'fa-check-circle' : 'fa-circle'}`}></i>
                  Số
                </li>
              </ul>
            </div>

            <div className="form-actions">
              <button 
                className="cancel-btn"
                onClick={handleCancelEdit}
                disabled={EditLoading}
              >
                <i className="fas fa-times"></i>
                Hủy
              </button>
              <button 
                className="save-btn"
                onClick={handleChangePassword}
                disabled={EditLoading}
              >
                {EditLoading ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i>
                    Đang đổi mật khẩu...
                  </>
                ) : (
                  <>
                    <i className="fas fa-save"></i>
                    Đổi mật khẩu
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="security-info">
          <div className="security-status">
            <div className="status-item">
              <div className="status-icon secure">
                <i className="fas fa-shield-alt"></i>
              </div>
              <div className="status-info">
                <h4>Tài khoản được bảo vệ</h4>
                <p>Mật khẩu của bạn đang được mã hóa và bảo mật</p>
              </div>
            </div>
            
            <div className="status-item">
              <div className="status-icon active">
                <i className="fas fa-check-circle"></i>
              </div>
              <div className="status-info">
                <h4>Đã xác thực email</h4>
                <p>Email của bạn đã được xác thực</p>
              </div>
            </div>
            
            <div className="status-item">
              <div className="status-icon warning">
                <i className="fas fa-clock"></i>
              </div>
              <div className="status-info">
                <h4>Đổi mật khẩu định kỳ</h4>
                <p>Nên đổi mật khẩu 90 ngày một lần</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Render doctor section (only for doctors)
  const renderDoctorSection = () => {
    if(!user) return;
    if (user.role !== 'doctor') return null;
    if(!doctor) return null;

    return (
      <div className="doctor-section">
        <div className="section-header">
          <h3>
            <i className="fas fa-user-md"></i>
            Thông tin bác sĩ
          </h3>
          {editMode !== 'doctor' && (
            <button 
              className="edit-btn"
              onClick={() => setEditMode('doctor')}
            >
              <i className="fas fa-edit"></i>
              Chỉnh sửa
            </button>
          )}
        </div>

        {editMode === 'doctor' ? (
          <div className="edit-form">
            <div className="form-fields">
              <div className="form-group">
                <label>
                  <i className="fas fa-stethoscope"></i>
                  Chuyên khoa *
                </label>
                <select
                  name="specialty"
                  value={doctorForm.specialty}
                  onChange={handleDoctorChange}
                >
                  <option value="Tim mạch">Tim mạch</option>
                  <option value="Nội khoa">Nội khoa</option>
                  <option value="Nhi khoa">Nhi khoa</option>
                  <option value="Da liễu">Da liễu</option>
                  <option value="Tâm thần">Tâm thần</option>
                  <option value="Ngoại khoa">Ngoại khoa</option>
                  <option value="Sản phụ khoa">Sản phụ khoa</option>
                  <option value="Mắt">Mắt</option>
                  <option value="Tai Mũi Họng">Tai Mũi Họng</option>
                  <option value="Răng Hàm Mặt">Răng Hàm Mặt</option>
                </select>
              </div>

              <div className="form-group">
                <label>
                  <i className="fas fa-history"></i>
                  Số năm kinh nghiệm *
                </label>
                <div className="experience-input">
                  <input
                    type="number"
                    name="experienceYears"
                    value={doctorForm.experienceYears}
                    onChange={handleDoctorChange}
                    min="0"
                    max="50"
                  />
                  <span className="input-suffix">năm</span>
                </div>
              </div>

              <div className="form-group">
                <label>
                  <i className="fas fa-money-bill-wave"></i>
                  Phí tư vấn *
                </label>
                <div className="price-input">
                  <input
                    type="number"
                    name="price"
                    value={doctorForm.price}
                    onChange={handleDoctorChange}
                    min="0"
                  />
                  <span className="input-suffix">₫</span>
                </div>
              </div>

              <div className="form-group">
                <label>
                  <i className="fas fa-file-alt"></i>
                  Mô tả chuyên môn *
                </label>
                <textarea
                  name="description"
                  value={doctorForm.description}
                  onChange={handleDoctorChange}
                  rows={4}
                  placeholder="Mô tả về chuyên môn, kinh nghiệm và phương pháp điều trị của bạn..."
                />
              </div>

              <div className="form-group">
                <label>
                  <i className="fas fa-graduation-cap"></i>
                  Bằng cấp & Chứng chỉ
                </label>
                <textarea
                  name="qualifications"
                  value={doctorForm.qualifications}
                  onChange={handleDoctorChange}
                  rows={4}
                  placeholder="Mỗi bằng cấp/chứng chỉ trên một dòng..."
                />
              </div>

              <div className="form-actions">
                <button 
                  className="cancel-btn"
                  onClick={handleCancelEdit}
                  disabled={EditLoading}
                >
                  <i className="fas fa-times"></i>
                  Hủy
                </button>
                <button 
                  className="save-btn"
                  onClick={handleSaveDoctorInfo}
                  disabled={EditLoading}
                >
                  {EditLoading ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i>
                      Đang lưu...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-save"></i>
                      Lưu thông tin
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        ) : (
        isLoading ? (
            <div className="stat-value">Loading...</div>
        ) : ( 
          <div className="doctor-info">
            {/* Rating */}
            <div className="doctor-rating">
              <h4>
                <i className="fas fa-star"></i>
                Đánh giá của bệnh nhân
              </h4>
              {renderRatingStars(doctor?.rating)}
            </div>

            {/* Doctor Details */}
            <div className="doctor-details">
              <div className="detail-grid">
                <div className="detail-item">
                  <div className="detail-label">
                    <i className="fas fa-stethoscope"></i>
                    Chuyên khoa:
                  </div>
                  <div className="detail-value">{doctor.specialtyId.name}</div>
                </div>
                
                <div className="detail-item">
                  <div className="detail-label">
                    <i className="fas fa-history"></i>
                    Kinh nghiệm:
                  </div>
                  <div className="detail-value">{doctor.experienceYears} năm</div>
                </div>
                
                <div className="detail-item">
                  <div className="detail-label">
                    <i className="fas fa-money-bill-wave"></i>
                    Phí tư vấn:
                  </div>
                  <div className="detail-value">
                    {new Intl.NumberFormat('vi-VN').format(doctor.price)} ₫
                  </div>
                </div>
                
                <div className="detail-item">
                  <div className="detail-label">
                    <i className="fas fa-user-friends"></i>
                    Tổng đánh giá:
                  </div>
                  <div className="detail-value">{doctor?.totalReviews} đánh giá</div>
                </div>
              </div>

              {/* Description */}
              <div className="description-box">
                <h5>
                  <i className="fas fa-file-alt"></i>
                  Mô tả chuyên môn
                </h5>
                <p>{doctor.description}</p>
              </div>

              {/* Qualifications */}
              <div className="qualifications-box">
                <h5>
                  <i className="fas fa-graduation-cap"></i>
                  Bằng cấp & Chứng chỉ
                </h5>
                <ul>
                  {doctor.qualifications.map((qual: any, index: any) => (
                    <li key={index}>
                      <i className="fas fa-check-circle"></i>
                      {qual}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Available Hours */}
              <div className="availability-box">
                <h5>
                  <i className="fas fa-clock"></i>
                  Lịch làm việc tuần này 
                </h5>
                {/* <div className="availability-grid">
                  {Object.entries(doctor?.availableHours).map(([day, hours]: any) => (
                    <div key={day} className="availability-day">
                      <div className="day-name">{day}</div>
                      <div className="day-hours">
                        {hours.map((hour: any, idx: any) => (
                          <span key={idx} className="hour-slot">{hour}</span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div> */}
              </div>
            </div>
          </div>)
        )}
      </div>
    );
  };

  return (
    <div className="account-container">
      {/* Header */}
      <div className="account-header">
        <div className="container">
          <div className="header-content">
            <h1>
              <i className="fas fa-user-cog"></i>
              Tài khoản của tôi
            </h1>
            <p>Quản lý thông tin cá nhân, bảo mật và các thiết lập tài khoản</p>
          </div>
        </div>
      </div>

      <div className="container main-content">
        <div className="content-wrapper">
          {/* Left Sidebar - Navigation */}
          <div className="account-sidebar">
            <div className="sidebar-card">
            {user &&
              <div className="user-summary">
                <img src={user.image} alt={user?.fullName} className="sidebar-avatar" />
                <div className="sidebar-user-info">
                  <h3>{user.fullName}</h3>
                  <span className={`user-role ${user.role}`}>
                    {user.role === 'patient' ? 'Bệnh nhân' : 'Bác sĩ'}
                  </span>
                </div>
              </div>
            }

              <nav className="account-nav">
                <button 
                  className={`nav-item ${editMode === 'profile' ? 'active' : ''}`}
                  onClick={() => setEditMode('profile')}
                >
                  <i className="fas fa-user-circle"></i>
                  Thông tin cá nhân
                </button>
                
                <button 
                  className={`nav-item ${editMode === 'password' ? 'active' : ''}`}
                  onClick={() => setEditMode('password')}
                >
                  <i className="fas fa-lock"></i>
                  Đổi mật khẩu
                </button>
                
                {user && user.role === 'doctor' && (
                  <button 
                    className={`nav-item ${editMode === 'doctor' ? 'active' : ''}`}
                    onClick={() => setEditMode('doctor')}
                  >
                    <i className="fas fa-user-md"></i>
                    Thông tin bác sĩ
                  </button>
                )}
                
                <button className="nav-item" onClick={() => {navigate("/appoinments")}}>
                  <i className="fas fa-calendar-alt"></i>
                  Lịch hẹn của tôi
                </button>
                
                <button className="nav-item" onClick={() => {navigate("/orders")}}>
                  <i className="fas fa-prescription"></i>
                  Đơn thuốc
                </button>
                
                {/* <button className="nav-item">
                  <i className="fas fa-shopping-bag"></i>
                  Đơn hàng
                </button>
                
                <button className="nav-item">
                  <i className="fas fa-heart"></i>
                  Yêu thích
                </button>
                
                <button className="nav-item">
                  <i className="fas fa-cog"></i>
                  Cài đặt
                </button> */}
              </nav>

              <div className="sidebar-actions">
                <button className="logout-btn">
                  <i className="fas fa-sign-out-alt"></i>
                  Đăng xuất
                </button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="account-main">
            {/* Stats Overview */}
            <div className="stats-overview">
              {renderStats()}
            </div>

            {/* Profile Section */}
            {renderProfileSection()}

            {/* Doctor Section (if doctor) */}
            {renderDoctorSection()}

            {/* Password Section */}
            {renderPasswordSection()}
            {/* Danger Zone */}
            <div className="danger-zone">
              <div className="section-header">
                <h3>
                  <i className="fas fa-exclamation-triangle"></i>
                  Vùng nguy hiểm
                </h3>
              </div>
              
              <div className="danger-actions">
                <div className="danger-action">
                  <div className="action-info">
                    <h4>Xóa tài khoản</h4>
                    <p>Xóa vĩnh viễn tài khoản và tất cả dữ liệu liên quan</p>
                  </div>
                  <button className="danger-btn delete">
                    <i className="fas fa-trash-alt"></i>
                    Xóa tài khoản
                  </button>
                </div>
                
                <div className="danger-action">
                  <div className="action-info">
                    <h4>Tải xuống dữ liệu</h4>
                    <p>Tải xuống tất cả dữ liệu cá nhân của bạn</p>
                  </div>
                  <button className="danger-btn download">
                    <i className="fas fa-download"></i>
                    Tải dữ liệu
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Account;