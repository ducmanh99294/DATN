import { useState, useEffect, useRef } from "react";
import "../../assets/admin/product.css";
import { createNews, deleteNews, getAllNews, getNewsBySlug, updateNews, importNews } from "../../api/newsApi";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "../../context/AuthContext";
import { useNotify } from "../../hooks/useNotification";
import { getCategories } from "../../api/categoryApi";
import { exportToExcel, parseExcelFile } from "../../utils/excelUtils";


const AdminNews = () => {
  const [newsList, setNewsList] = useState<any[]>([]);
  const [selectedNews, setSelectedNews] = useState<any | null>(null);
  const [newsDetail, setNewsDetail] = useState<any | null>(null);
  const [activeModal, setActiveModal] = useState<"detail" | "create" | "edit" | "delete" | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [filters, setFilters] = useState({
    category: "all",
    date: "all",
    status: "all",
    search: "",
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { user } = useAuthContext();
  const notify = useNotify();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: "",
    summary: "",
    content: "",
    category: "",
    isPublished: true,
    thumbnail: null,
    images: [],
  });


  useEffect(() => {
    if (!user) return;

    if (user.role !== "admin") {
      notify.warning("Bạn không có quyền truy cập trang này!");
      navigate("/");
      return;
    }

    const fetchCategory = async () => {
      try {
        const data = await getCategories();

        if (data) {
          setCategories(data);
        }
      } catch (err) {
        console.error("Lỗi load categories:", err);
        notify.error("Không thể tải danh sách danh mục");
      }
    };

    fetchCategory();

  }, [user]);

  useEffect(() => {
    if (!user) return;

    if (user.role !== "admin") {
      notify.warning("Bạn không có quyền truy cập!");
      navigate("/");
      return;
    }

    fetchNews();
  }, [user, filters.status, filters.search, filters.date, filters.category, currentPage]);

  const fetchNews = async () => {
    try {
      const data = await getAllNews(
        `?page=${currentPage}&date=${filters.date}&category=${filters.category}&status=${filters.status}&search=${filters.search}`
      );

      setNewsList(data.news);
    } catch (err) {
      notify.error("Không thể tải danh sách tin tức");
    }
  };

  // 🔹 Xem chi tiết
  useEffect(() => {
    if (!selectedNews?._id) return;

    const fetchDetail = async () => {
      const data = await getNewsBySlug(selectedNews._id);
      setNewsDetail(data[0]);
    };

    fetchDetail();
  }, [selectedNews?._id]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  // console.log(formData)
  const handleCreateNews = async (e: any) => {
    e.preventDefault();
    try {
      setLoading(true);
      const form = new FormData();

      form.append("title", formData.title);
      form.append("summary", formData.summary);
      form.append("content", formData.content);
      form.append("category", formData.category);
      form.append("isPublished", String(formData.isPublished));
      
      if (thumbnailFile) {
        form.append("thumbnail", thumbnailFile);
      }

      files.forEach((img: File) => {
        form.append("images", img);
      });

      const data = await createNews(form);
  
      if (data) {
        setNewsList((pre: any) => [...pre, data]);
        setActiveModal(null);

        setFormData({
          title: "",
          summary: "",
          content: "",
          category: "",
          isPublished: true,
          thumbnail: null,
          images: []
        });

        setFiles([]);
      }
      notify.success("Thêm tin tức thành công");
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteNews = async (id: string) => {
    try {
      await deleteNews(id);
      setNewsList((prev) => prev.filter((n) => n._id !== id));
      notify.success("Xóa thành công!");
      setActiveModal(null);
    } catch {
      notify.error("Xóa thất bại!");
    }
  };
  // console.log(formData)
  const handleUpdateNews = async (e: any) => {
    e.preventDefault();
    try {
      setLoading(true);
      const form = new FormData();

      form.append("title", formData.title);
      form.append("summary", formData.summary);
      form.append("content", formData.content);
      form.append("category", formData.category);
      form.append("isPublished", String(formData.isPublished));
      
      if (thumbnailFile) {
        form.append("thumbnail", thumbnailFile);
      }

      files.forEach((file: File) => {
        form.append("images", file); 
      });

      const data = await updateNews(selectedNews._id, form);
      setNewsList((prev) =>
        prev.map((n) => (n._id === selectedNews._id ? { ...data } : n))
      );

      setActiveModal(null);

        setFormData({
          title: "",
          summary: "",
          content: "",
          category: "",
          isPublished: true,
          thumbnail: null,
          images: []
        });
        setFiles([]);

      notify.success("Cập nhật tin tức thành công!");
    } catch (err) {
      notify.error("Cập nhật thất bại!");
    } finally {
      setLoading(false);
    }
  };
// console.log(files);
// console.log(thumbnailFile);
  const handleChange = (e: any) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const thumb = e.target.files?.[0];
    if (!thumb) return;
    
    setThumbnailFile(thumb);
    const previewthumb = URL.createObjectURL(thumb);

      setFormData((prev: any) => ({
        ...prev,
        thumbnail: previewthumb,
      }));
    
  };

  const handleImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const fileArray = Array.from(files);

    setFiles(prev => [...prev, ...fileArray]);
    
    const previewUrls = fileArray.map(file => URL.createObjectURL(file));

    setFormData((prev: any) => ({
      ...prev,
      images: [...prev.images, ...previewUrls], 
    }));
  };

const openDetailModal = (news: any, active: any) => {
  if(active === "edit"){
    setFormData({
      title: news.title,
      summary: news.summary,
      content: news.content,
      category: news.category._id,
      isPublished: news.isPublished,
      thumbnail: news.thumbnail ,
      images: news.images || []
    });
  }
  setSelectedNews(news);
  setActiveModal(active);
};

  const formatPrice = (price: any) => {
    new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  const handleExportExcel = async () => {
    try {
      setExporting(true);
      const data = await getAllNews(`?page=1&limit=5000&date=${filters.date}&category=${filters.category}&status=${filters.status}&search=${filters.search}`);
      const list = (data as any).news || [];
      const rows = list.map((n: any) => ({
        "Tiêu đề": n.title,
        "Danh mục": n.category?.name ?? "",
        "Tóm tắt": n.summary ?? "",
        "Nội dung": (n.content ?? "").slice(0, 200),
        "Lượt xem": n.views ?? 0,
        "Lượt thích": n.like ?? 0,
        "Xuất bản": n.isPublished ? "Có" : "Không",
        "Ngày tạo": n.createdAt ? new Date(n.createdAt).toLocaleString("vi-VN") : "",
      }));
      exportToExcel(rows, `tin-tuc-${new Date().toISOString().slice(0, 10)}`, "Tin tức");
      notify.success("Xuất Excel thành công!");
    } catch (err) {
      console.error(err);
      notify.error("Xuất Excel thất bại!");
    } finally {
      setExporting(false);
    }
  };

  const handleDownloadTemplateNews = () => {
    const template = [
      { title: "Tiêu đề bài viết", summary: "Tóm tắt", content: "Nội dung", category: "ID_DANH_MỤC" },
    ];
    exportToExcel(template, "mau-nhap-tin-tuc", "Mẫu");
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
        return;
      }
      const newsPayload = rows.map((row: any) => {
        const title = row.title ?? row["title"] ?? row["Tiêu đề"] ?? "";
        const summary = row.summary ?? row["summary"] ?? row["Tóm tắt"] ?? "";
        const content = row.content ?? row["content"] ?? row["Nội dung"] ?? "";
        const category = row.category ?? row["category"] ?? row["Danh mục"] ?? "";
        const catId = typeof category === "string" && category.length === 24 ? category : (categories.find((c: any) => c.name === category || c._id === category)?._id ?? category);
        return { title: String(title).trim(), summary: String(summary), content: String(content), category: catId };
      }).filter((n: any) => n.title && n.category);
      if (newsPayload.length === 0) {
        notify.error("Không có dòng hợp lệ. Cần cột: title, category (ID hoặc tên danh mục).");
        return;
      }
      await importNews(newsPayload);
      notify.success(`Đã nhập ${newsPayload.length} tin tức!`);
      fetchNews();
    } catch (err: any) {
      notify.error(err?.message || "Nhập Excel thất bại!");
    } finally {
      setImporting(false);
      e.target.value = "";
    }
  };

  // console.log(newsDetail);
  return (
    <div className="admin-products">
        <main className="dashboard-main">
          <div className="products-main">
            <div className="products-header">
              <h2 className="products-title">Quản Lý Tin Tức</h2>
              <div className="products-actions">
                <button type="button" className="export-btn" onClick={handleExportExcel} disabled={exporting} style={{ marginRight: 8 }}>
                  {exporting ? "⏳ Đang xuất..." : "📤 Xuất Excel"}
                </button>
                <button type="button" className="filter-btn" onClick={handleDownloadTemplateNews} style={{ marginRight: 8 }}>
                  📥 Tải mẫu
                </button>
                <button type="button" className="filter-btn" onClick={() => fileInputRef.current?.click()} disabled={importing} style={{ marginRight: 8 }}>
                  {importing ? "⏳ Đang nhập..." : "📂 Nhập Excel"}
                </button>
                <input ref={fileInputRef} type="file" accept=".xlsx,.xls" onChange={handleImportExcel} style={{ display: "none" }} />
                <button className="add-product-btn" onClick={() => openDetailModal(null, "create")}>
                  ➕ Thêm Tin Tức
                </button>
              </div>
            </div>

            {/* Filters */}
            <div className="products-filter">
              <div className="filter-group">
                <label className="filter-label">Danh mục</label>
                <select 
                  className="filter-select"
                  value={filters.category}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                >
                  {categories.map(category => (
                    <option key={category.id} value={category}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* <div className="filter-group">
                <label className="filter-label">Trạng thái</label>
                <select 
                  className="filter-select"
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                >
                  <option value="all">Tất cả trạng thái</option>
                  <option value="active">Đang bán</option>
                  <option value="inactive">Ngừng bán</option>
                </select>
              </div> */}

              <div className="filter-group">
                <label className="filter-label">Tìm kiếm</label>
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Tìm kiếm tin tức theo tiêu đề, nội dung..."
            value={filters.search}
            onChange={(e) => setFilters({...filters, search: e.target.value})}
          />
        </div>
              </div>
            </div>

            {/* Products Grid */}
            {newsList && newsList.length > 0 ? (
              <div className="products-grid">
                {newsList.map((news: any) => (
                  <div key={news._id} className="product-card">
                    <div 
                      className="product-image"
                      style={{
                        backgroundImage: news.thumbnail ? `url(${news.thumbnail})` : 'none'
                      }}
                    >
                        <span className={`product-status status-active`}>
                          {news.category.name}
                        </span>
                    </div>
                    <div className="product-content">
                      <div className="product-category">
                        {news.category.fullName}
                      </div>
                      <h3 className="product-name">{news.title}</h3>
                      <p className="product-description">{news.summary}</p>
                      <div className="product-actions">
                        <button 
                          className="action-btn edit-btn"
                          onClick={() => openDetailModal(news, "edit")}
                        >
                          ✏️ Sửa
                        </button>
                        <button 
                          className="action-btn delete-btn"
                          onClick={() => openDetailModal(news, "delete")}
                        >
                          🗑️ Xóa
                        </button>
                        <button 
                          className={`action-btn toggle-btn ${news.isSelling ? 'inactive' : ''}`}
                          onClick={() => openDetailModal(news, "detail")}
                        >
                          Xem
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-products">
                <div className="empty-icon">📰</div>
                <h3 className="empty-title">Không tìm thấy tin tức</h3>
                <p className="empty-description">            
                    Hãy thử điều chỉnh bộ lọc hoặc từ khóa tìm kiếm
                </p>
                <button className="add-product-btn" onClick={handleCreateNews}>
                  ➕ Thêm Tin Tức Đầu Tiên
                </button>
              </div>
            )}
          </div>
        </main>

      {/* Delete Confirmation Modal */}
      {activeModal === "delete" && (
        <div className="delete-modal">
          <div className="confirm-content">
            <div className="confirm-icon">🗑️</div>
            <h3 className="confirm-title">Xác nhận xóa</h3>
            <p className="confirm-message">
              Bạn có chắc chắn muốn xóa sản phẩm?
              <br />
              Hành động này không thể hoàn tác.
            </p>
            <div className="confirm-actions">
              <button 
                className="cancel-delete-btn"
                onClick={() => setActiveModal(null)}
              >
                Hủy
              </button>
              <button 
                className="confirm-delete-btn"
                onClick={() => handleDeleteNews(selectedNews._id)}
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {(activeModal === "create" || activeModal === "edit") && (
      <div className="product-modal">
        <div className="modal-content">
          <div className="modal-header">
            <h2 className="modal-title">
              {activeModal === 'edit' ? 'Chỉnh sửa Tin tức' : 'Thêm Tin tức Mới'}
            </h2>
            <button className="close-btn" onClick={() => setActiveModal(null)}>×</button>
          </div>

          <form className="product-form" 
          onSubmit={activeModal === 'edit' ? handleUpdateNews : handleCreateNews}>
            <div className="form-group full-width">
              <label className="form-label required">Tên tin tức</label>
              <input
                type="text"
                className="form-input"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label required">Danh mục</label>
              <select
                className="form-select"
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
              >
                {categories.filter(cat => cat.id !== 'all').map(category => (
                  <option key={category._id} value={category._id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group full-width">
              <label className="form-label">Tóm tắt</label>
              <textarea
                className="form-textarea"
                name="summary"
                value={formData.summary}
                onChange={handleChange}
              />
            </div>

            <div className="form-group full-width">
              <label className="form-label required">Nội dung</label>
              <textarea
                className="form-textarea"
                name="content"
                value={formData.content}
                onChange={handleChange}
                required
                rows={6}
              />
            </div>

            <div className="form-group full-width">
              <label className="form-label">Hình ảnh</label>
              <div className="image-upload">
                <div className="image-preview">
                  {formData.images.length > 0 ? (
                    formData.images.map((img, index) => (
                      <img
                        key={index}
                        src={
                          img
                        }
                        alt={`Preview ${index}`}
                      />
                    ))
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
                  multiple
                  onChange={handleImagesChange}
                  style={{ display: 'none' }}
                />
                <label htmlFor="image-upload" className="upload-btn">
                  Chọn hình ảnh
                </label>
              </div>
            </div>

            <div className="form-group full-width">
              <label className="form-label">Thumbnail</label>

              <div className="image-preview">
                {formData.thumbnail ? (
                  <img
                    src={
                      formData.thumbnail
                    }
                    alt="Thumbnail"
                  />
                ) : (
                  <div className="upload-placeholder">Chưa có thumbnail</div>
                )}
              </div>

              <input
                type="file"
                accept="image/*"
                id="thumbnail-upload"
                onChange={handleThumbnailChange}
                style={{ display: 'none' }}
              />
              <label htmlFor="thumbnail-upload" className="upload-btn">
                Chọn hình ảnh
              </label>
            </div>
               
            <div className="form-actions">
              <button type="button" className="cancel-btn" onClick={() => setActiveModal(null)}>
                Hủy
              </button>
              <button
                type="submit"
                className="save-btn"
                disabled={loading}
              >
                {loading
                  ? "Đang xử lý..."
                  : activeModal === "edit"
                    ? "Cập nhật"
                    : "Thêm tin tức"}
              </button>
            </div>
          </form>
        </div>
      </div>
      )}

      {newsDetail && selectedNews && activeModal === "detail" && (
            <div 
                className="product-modal"
                onClick={(e) => {
                if (e.target === e.currentTarget) {
                    setActiveModal(null);
                }
                }}
            >
                <div className="modal-content">
                <div className="modal-header">
                    {/* <h2 className="modal-title">Chi Tiết Đơn Hàng {newsDetail._id.slice(0,8).toUpperCase()}</h2> */}
                    <button className="close-btn" onClick={() => setActiveModal(null)}>×</button>
                </div>

                <div style={{ display: 'grid', gap: '25px' }}>
                    {/* --- Thông tin khách hàng --- */}
                    <div>
                    <h3 style={{ color: '#e6e6e6', marginBottom: '15px', fontSize: '1.2rem' }}>Thông tin</h3>
                    <div style={{ color: '#ffffff' }}>
                        <div><strong>Tiêu đề:</strong> {newsDetail.title}</div>
                        <div><strong>Slug:</strong> {newsDetail.slug}</div>
                        <div><strong>Tóm tắt:</strong> {newsDetail.summary}</div>
                        <div><strong>Nội dung:</strong>{newsDetail.content}</div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                 </div>
                    </div>

                    {/* --- Hình ảnh --- */}
                    <div>
                    <h3 style={{ color: '#e6e6e6', marginBottom: '15px', fontSize: '1.2rem' }}>Hình ảnh</h3>
                    <div style={{ color: '#ffffff' }}>
                        <div><strong>Thumbnail:</strong> {<img src={newsDetail.thumbnail} alt="Thumbnail" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}</div>
                        <div><strong>Hình ảnh:</strong> 
                        {newsDetail.images && newsDetail.images.length > 0 ? (
                          newsDetail.images.map((img: any, index: any) => (
                            <img key={index} src={img} alt={`Image ${index}`} style={{ width: '100%', height: '100%', objectFit: 'cover', margin: '5px 0' }} />
                          ))
                        ) : (
                          <p>Không có hình ảnh</p>
                        )}
                        </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                 </div>
                    <div style={{ color: '#ffffff', marginTop: '10px' }}>
                      <strong>Ngày đăng: </strong>
                        {new Date(newsDetail.createdAt).toLocaleString('vi-VN')}
                      </div>
                    </div>
                    {/* --- Nút hành động --- */}
                    <div style={{ display: 'flex', gap: '15px', justifyContent: 'flex-end' }}>
                        <button 
                            className="action-btn edit"
                            onClick={() => openDetailModal(selectedNews, "edit")}
                        >
                            Chỉnh sửa
                        </button>
                        <button 
                            className="action-btn cancel"
                            onClick={() => setActiveModal(null)}
                        >
                            Đóng
                        </button>
                    </div>
                </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default AdminNews;