// AdminUsers.js
import React, { useState, useEffect, useRef } from 'react';
import '../../assets/admin/user.css';
import { useAuthContext, type User } from '../../context/AuthContext';
import { useNotify } from '../../hooks/useNotification';
import { banUser, createUser, deleteUser, getAllUsers, unbanUser, updateProfile, updateUser } from '../../api/authApi';
import { useNavigate } from 'react-router-dom';
import { exportToExcel, parseExcelFile } from '../../utils/excelUtils';

const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<any>([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [banReason, setBanReason] = useState("");
  const [showBanModal, setShowBanModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState<any>('');
  const [editingUser, setEditingUser] = useState<any>(null);
  const [reason, setReason] = useState<any>('');
  const { user } = useAuthContext();
  const notify = useNotify()
  const navigate = useNavigate();
  const [filters, setFilters] = useState({
    role: 'all',
    status: 'all',
    search: ''
  });
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [profileForm, setProfileForm] = useState({
    fullName: '',
    phone: '',
    gender: '',
    dateOfBirth: new Date(),
    email: '',
    role: 'patient',
  });  
  
  const roles = [
    { id: 'admin', name: 'Quản trị viên'},
    { id: 'patient', name: 'người dùng / bệnh nhân' },
    { id: 'doctor', name: 'Bác sĩ' },
    { id: 'banner', name: 'Khóa tài khoản' },
  ];

  const statuses = [
    { id: 'all', name: 'Tất cả trạng thái' },
    { id: 'active', name: 'Hoạt động' },
    { id: 'inactive', name: 'Không hoạt động' },
    { id: 'banned', name: 'Đã khóa' }
  ];

  useEffect(() => {
    if (!user) return;

    if (user.role !== "admin") {
      notify.warning("Bạn không có quyền truy cập trang này!");
      navigate("/");
      return;
    }
    const fetchUsers = async () => {
      try {
        setLoading(true)
        const data = await getAllUsers(
          `?role=all&status=all&search=${searchTerm}`
        );

        if (data) {
          setUsers(data.users);
        }
      } catch (err) {
        console.error("Lỗi load user:", err);
        notify.error("Không thể tải danh sách người dùng");
      } finally {
        setLoading(false)

      }
    };

    fetchUsers();
  }, [user, searchTerm]);

  const filteredUsers = users ? users.filter((user: any) =>
    user?.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user?.role?.toLowerCase().includes(searchTerm.toLowerCase())
  ) : [];

  const handleFilterChange = (key: any, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleExportExcel = async () => {
    try {
      setExporting(true);
      const data = await getAllUsers(`?role=all&status=all&search=${searchTerm}`);
      const list = (data as any).users || [];
      const rows = list.map((u: any) => ({
        "Họ tên": u.fullName,
        "Email": u.email,
        "SĐT": u.phone ?? "",
        "Giới tính": u.gender === "male" ? "Nam" : u.gender === "female" ? "Nữ" : "Khác",
        "Ngày sinh": u.dateOfBirth ? new Date(u.dateOfBirth).toLocaleDateString("vi-VN") : "",
        "Vai trò": u.role,
        "Ngày tạo": u.createdAt ? new Date(u.createdAt).toLocaleString("vi-VN") : "",
      }));
      exportToExcel(rows, `nguoi-dung-${new Date().toISOString().slice(0, 10)}`, "Người dùng");
      notify.success("Xuất Excel thành công!");
    } catch (err) {
      console.error(err);
      notify.error("Xuất Excel thất bại!");
    } finally {
      setExporting(false);
    }
  };

  const handleDownloadTemplateUser = () => {
    const template = [
      { email: "email@example.com", fullName: "Họ tên", password: "Mật khẩu", role: "patient" },
    ];
    exportToExcel(template, "mau-nhap-nguoi-dung", "Mẫu");
    notify.success("Đã tải mẫu Excel!");
  };

  const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setImporting(true);
      const rows = await parseExcelFile(file);
      if (rows.length === 0) {
        notify.error("File không có dữ liệu.");
        e.target.value = "";
        return;
      }
      notify.info("Chức năng nhập user từ Excel: dùng mẫu với cột email, fullName, password, role. Backend import có thể bổ sung sau.");
    } catch (err: any) {
      notify.error(err?.message || "Đọc file thất bại!");
    } finally {
      setImporting(false);
      e.target.value = "";
    }
  };

  const handleSetAddUser = () => {
    setEditingUser(null);
    setProfileForm({
      fullName: '',
      phone: '',
      gender: '',
      dateOfBirth: new Date(),
      email: '',
      role: 'patient',
      })
    setShowModal(true);
  };

  // console.log(profileForm)
  const handleAddEditUser = (user: any) => {
    setEditingUser(user);
      setProfileForm({
      fullName: user.fullName,
      phone: user.phone,
      gender: user.gender,
      dateOfBirth: user.dateOfBirth,
      email: user.email,
      role: user.role,
    })
    setShowModal(true);
  };

  const handleAddUser = async (e: any) => {
    e.preventDefault();
    try {
      const data = await createUser(profileForm);
      setUsers((pre: any) => [...pre, data]);
      setShowModal(false);
      notify.success("Thêm người dùng thành công");
    } catch (err) {
      console.log(err);
    }
  }

  const handleUpdateUser = async (e: any) => {
    e.preventDefault();
    try {
      setShowModal(true);
      const data = await updateUser(editingUser._id, profileForm.fullName, profileForm.phone, profileForm.email, profileForm.gender, profileForm.role);
      setUsers((prev: any) =>
        prev.map((order: any) =>
          order._id === editingUser._id  ? { ...order, ...data } : editingUser
      ))

      setShowModal(false);
      notify.success("Cập nhật thông tin người dùng thành công");
    } catch (err) {
      console.log(err);
    }
  }

  const handleClose = () => {
    setShowBanModal(false);
  }

  const handleInputChange = (e: any) => {
    const { name, value } = e.target;
    setProfileForm((prevState: any) => ({
      ...prevState,
      [name]: value
    }));
  }

  const handleImageUpload = (e: any) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setFormData((prev: any) => ({
          ...prev,
          image: ev.target?.result,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBanUser = async (e:any) => {
    e.preventDefault()
    if (!selectedUser) return;
    try {
      await banUser(selectedUser._id, banReason);

      setUsers((prev: any) =>
        prev.map((u: any) =>
          u._id === selectedUser._id
            ? { ...u, isBanned: true, banReason }
            : u
        )
      );

      notify.success(
        `Đã khóa tài khoản ${selectedUser.fullName}`
      );

      setShowBanModal(false);
      setSelectedUser(null);
      setBanReason("");

    } catch (err) {
      console.error(err);
      notify.error("Khóa tài khoản thất bại");
    }
  };

  const handleUnbanUser = async (user: User) => {
    try {
      await unbanUser(user._id);
      setUsers((prev: any) =>
        prev.map((u: any) =>
          u._id === user._id
            ? { ...u, isBanned: false, banReason: null }
            : u
        )
      );
      notify.success(`Đã mở khóa tài khoản người dùng ${user.fullName}`);
    } catch (err) {
      console.log(err);
    }
  };

  const handleDeleteUser = async (id: any) => {
    const confirmed = window.confirm('Bạn có chắc muốn xóa tài khoản này?');
    if (!confirmed) return;
    try {
      await deleteUser(id);
      setUsers((pre: any) => pre.filter((e: any) => e._id !== id));
      notify.success("Xóa người dùng thành công");
    } catch (err) {
      console.log(err)
    }    
  };

  const openBanModal = (user: User) => {
    setSelectedUser(user);
    setBanReason("");
    setShowBanModal(true);
  };

  const formatPrice = (price: any) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(price);
  };

  const formatDate = (dateString: any) => {
    if (!dateString) return 'Chưa Có';
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const getInitials = (username: any) => {
    return username?.split(' ').map((word: any) => word[0]).join('').toUpperCase();
  };

  return (
    <div className="admin-users">
        <main className="dashboard-main">
          <div className="users-main">
            <div className="users-header">
              <h2 className="users-title">Quản Lý Người Dùng</h2>
              <div className="users-actions">
                <button type="button" className="export-btn" onClick={handleExportExcel} disabled={exporting}>
                  {exporting ? "⏳ Đang xuất..." : "📤 Xuất Excel"}
                </button>
                <button type="button" className="filter-btn" onClick={handleDownloadTemplateUser} style={{ marginRight: 8 }}>
                  📥 Tải mẫu
                </button>
                <button type="button" className="filter-btn" onClick={() => fileInputRef.current?.click()} disabled={importing} style={{ marginRight: 8 }}>
                  {importing ? "⏳ Đang nhập..." : "📂 Nhập Excel"}
                </button>
                <input ref={fileInputRef} type="file" accept=".xlsx,.xls" onChange={handleImportExcel} style={{ display: "none" }} />
                <button className="add-user-btn" onClick={handleSetAddUser}>
                  ➕ Thêm Người Dùng
                </button>
              </div>
            </div>

            {/* Filters */}
            <div className="users-filter">
              <div className="filter-group">
                <label className="filter-label">Vai trò</label>
                <select 
                  className="filter-select"
                  value={filters.role}
                  onChange={(e) => handleFilterChange('role', e.target.value)}
                >
                  {roles.map(role => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="filter-group">
                <label className="filter-label">Trạng thái</label>
                <select 
                  className="filter-select"
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                >
                  {statuses.map(status => (
                    <option key={status.id} value={status.id}>
                      {status.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="filter-group">
                <label className="filter-label">Tìm kiếm</label>
                <div className="search-box">
                  <span className="search-icon">🔍</span>
                  <input
                    className="search-input"
                    type="text"
                    placeholder="Tìm kiếm nhân viên theo tên, vai trò,..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Users Table */}
            {loading ? (
            <div className="empty-products">
              <div className="empty-icon">👥</div>
              <h3 className="empty-title">Đang tải Người dùng...</h3>
              <p className="empty-description">            
                Vui lòng đợi trong giây lát
              </p>
            </div>
            ) : (
              <>
            {filteredUsers.length > 0 ? (
              <div className="users-table-container">
                <table className="users-table">
                  <thead>
                    <tr>
                      <th>Người Dùng</th>
                      <th>Giới tính</th>
                      <th>Ngày sinh</th>
                      <th>Vai Trò</th>
                      <th>Thông tin</th>
                      <th>Lần Đăng Nhập Cuối</th>
                      <th>Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user:any) => (
                      <tr key={user._id}>
                        <td>
                          <div className="user-avatar">
                            <div className="avatar-image">
                              {user.image ? (
                                <img src={user.image} alt={user.fullName} />
                              ) : (
                                getInitials(user.fullName)
                              )}
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="user-stats">
                            <div className="stat-value">{user.gender === 'male' ? 'Nam' : user.gender === 'female' ? 'Nữ' : 'Khác'}</div>
                          </div>
                        </td>
                        <td>
                          <div className="user-stats">
                            <div className="stat-label">{formatDate(user.dateOfBirth)}</div>
                          </div>
                        </td>
                        <td>
                          <span className={`user-role role-${user.role}`}>
                            {user.role}
                          </span>
                        </td>
                        <td>
                            <div className="user-info">
                              <div className="user-name">{user.username}</div>
                              <div className="user-email">{user.email}</div>
                              <div className="user-email">{user.phone}</div>
                            </div>
                        </td>
                        <td className="user-email">
                          {formatDate(user.lastLogin)}
                        </td>
                        <td>
                          <div className="user-actions">
                            <button 
                              className="action-btn edit-btn"
                              onClick={() => handleAddEditUser(user)}
                            >
                              Sửa
                            </button>
                            {user.isBanned === true ? (
                              <button 
                                className="action-btn unban-btn"
                                onClick={() => handleUnbanUser(user)}
                              >
                                Mở khóa
                              </button>
                            ) : (
                              <button 
                                className="action-btn ban-btn"
                                onClick={() => openBanModal(user)}
                              >
                                Khóa
                              </button>
                            )}
                            <button 
                              className="action-btn delete-btn"
                              onClick={() => handleDeleteUser(user._id)}
                            >
                              🗑️ Xóa
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-users">
                <div className="empty-icon">👥</div>
                <h3 className="empty-title">Không tìm thấy người dùng</h3>
                <p className="empty-description">
                  {filters.search || filters.role !== 'all' || filters.status !== 'all'
                    ? 'Hãy thử điều chỉnh bộ lọc hoặc từ khóa tìm kiếm'
                    : 'Hãy thêm người dùng đầu tiên vào hệ thống'
                  }
                </p>
              </div>
            )}
              </>
            )}

          </div>
        </main>
     
      {showModal && (
      <div className="product-modal">
        <div className="modal-content">
          <div className="modal-header">
            <h2 className="modal-title">
              {editingUser ? 'Chỉnh sửa thông tin người dùng' : 'Thêm người dùng Mới'}
            </h2>
            <button className="close-btn" onClick={()=>setShowModal(false)}>×</button>
          </div>

          <form className="product-form" onSubmit={editingUser ? (handleUpdateUser) : (handleAddUser)}>
            <div className="form-group full-width">
              <label className="form-label required">Họ và tên</label>
              <input
                type="text"
                className="form-input"
                name="fullName"
                value={profileForm.fullName}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label required">Trạng thái</label>
              <select
                className="form-select"
                name="role"
                value={profileForm.role}
                onChange={handleInputChange}
                required
              >
                {roles.filter(r => r.id !== 'all').map(role => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label required">email</label>
              <input
                type="text"
                className="form-input"
                name="email"
                value={profileForm.email}
                onChange={handleInputChange}
                min="0"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">phone</label>
              <input
                type="text"
                className="form-input"
                name="phone"
                value={profileForm.phone}
                onChange={handleInputChange}
                min="0"
              />
            </div>

            <div className="form-group full-width">
              <label className="form-label">Hình ảnh</label>
              <div className="image-upload">
                <div className="image-preview">
                  {profileForm.image ? (
                    <img src={profileForm.image} alt="Preview" />
                  ) : (
                    <div className="upload-placeholder">
                      <div>📷</div>
                      <div>Chưa có hình ảnh</div>
                    </div>
                  )}
                </div>
                <input
                  type="file"
                  id="image-upload"
                  accept="image/*"
                  onChange={handleImageUpload}
                  style={{ display: 'none' }}
                />
                <label htmlFor="image-upload" className="upload-btn">
                  Chọn hình ảnh
                </label>
              </div>
            </div>


            <div className="form-actions">
              <button type="button" className="cancel-btn" onClick={()=>setShowModal(false)}>
                Hủy
              </button>
              <button type="submit" className="save-btn">
                {editingUser ? 'Cập nhật' : 'Thêm người dùng'}
              </button>
            </div>
          </form>
        </div>
      </div>
      )}

      {showBanModal && (
      <div className="product-modal">
        <div className="modal-content">
          <div className="modal-header">
            <h2 className="modal-title">
              Vui lòng nhập lý do
            </h2>
            <button className="close-btn" onClick={handleClose}>×</button>
          </div>

          <form className="product-form">
            <div className="form-group full-width">
              <label className="form-label required">Lý do</label>
              <input
                type="text"
                className="form-input"
                name="banReason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
              />
            </div>
            <div className="form-actions">
              <button type="button" className="cancel-btn" onClick={handleClose}>
                Hủy
              </button>
              <button type="submit" className="save-btn" onClick={handleBanUser}>
                Xác nhận
              </button>
            </div>
          </form>
        </div>
      </div>
      )}
    </div>
  );
};


export default AdminUsers;