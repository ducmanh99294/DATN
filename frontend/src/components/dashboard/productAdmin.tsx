// AdminProducts.js
import React, { useState, useEffect, useRef } from 'react';

import '../../assets/admin/product.css';
import { useAuthContext } from '../../context/AuthContext';
import { useNotify } from '../../hooks/useNotification';
import { useNavigate } from 'react-router-dom';
import { createProducts, deleteProduct, getAllProducts, updateProduct, updateStatusProduct, importProducts } from '../../api/productApi';
import type { Product } from '../Product';
import { getCategories } from '../../api/categoryApi';
import { exportToExcel, parseExcelFile } from '../../utils/excelUtils';


const AdminProducts: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState<any>('');
  const [files, setFiles] = useState<File[]>([]);

  const [formData, setFormData] = useState({
    name: '',
    category: '',
    description: '',
    price: 0,
    discount: 0,
    stock: 0,
    useFors: '',
    uses:'',
    sideEffects:'',
    images: [] as string[],
  });
  const [filters, setFilters] = useState({
    category: "all",
    search: "",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { user } = useAuthContext();
  const notify = useNotify()
  const navigate = useNavigate();

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
      notify.warning("Bạn không có quyền truy cập trang này!");
      navigate("/");
      return;
    }

    const fetchOrders = async () => {
      try {
        const data = await getAllProducts(
          `?page=${currentPage}&category=${filters.category}&search=${filters.search}`
        );

        if (data) {
          setProducts(data.products);
          setTotalPages(data.totalPages);
        }

      } catch (err) {
        console.error("Lỗi load products:", err);
        notify.error("Không thể tải danh sách sản phẩm");
      }
    };

    fetchOrders();

  }, [user, filters.category, filters.search, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filters.search, filters.category]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));

    setCurrentPage(1);
  };

  // hàm xử lí
  const handleAddProduct = async (e: any) => {
    e.preventDefault();
    try {
      
      const form = new FormData();

      // append text fields
      form.append("name", formData.name);
      form.append("category", formData.category);
      form.append("description", formData.description);
      form.append("price", String(formData.price));
      form.append("discount", String(formData.discount));
      form.append("stock", String(formData.stock));
      form.append("useFors", formData.useFors);
      form.append("uses", formData.uses);
      form.append("sideEffects", formData.sideEffects);

      // append files
      files.forEach((file: File) => {
        form.append("images", file); 
      });

      const data = await createProducts(form);

      if (data) {
        setProducts((pre: any) => [...pre, data]);
        setShowModal(false);

        setFormData({
          name: '',
          category: '',
          description: '',
          price: 0,
          discount: 0,
          stock: 0,
          useFors: '',
          uses: '',
          sideEffects: '',
          images: [],
        });

        setFiles([]);
      }
      notify.success("Thêm sản phẩm thành công");
    } catch (err) {
      console.log(err);
    }
  };
  
  const handleEditProduct = async (e: any) => {
    e.preventDefault()
    try {
      const form = new FormData();

      // append text fields
      form.append("name", formData.name);
      form.append("category", formData.category);
      form.append("description", formData.description);
      form.append("price", String(formData.price));
      form.append("discount", String(formData.discount));
      form.append("stock", String(formData.stock));
      form.append("useFors", formData.useFors);
      form.append("uses", formData.uses);
      form.append("sideEffects", formData.sideEffects);

      // append files
      files.forEach((file: File) => {
        form.append("images", file); 
      });

      const data = await updateProduct(editingProduct._id, form);
      setProducts((pre: any) => pre.map((e: any) => e._id === editingProduct._id ? {...data } : e))
      notify.success("Cập nhật sản phẩm thành công");
      setShowModal(false);
      setEditingProduct(null);
      } catch (err) {
      console.log(err)
    }
  }

  const handleDeleteProduct = async (id: any) => {
    try {
      setLoading(true);
      await deleteProduct(id);
      setProducts((pre: any) => pre.filter((e: any) => e._id !== id));
      notify.success("Xóa sản phẩm thành công");
      setShowDeleteModal(false)
    } catch (err) {
      console.error('Lỗi khi xóa sản phẩm:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProductStatus = async (product: any) => {
    try {
      await updateStatusProduct(product._id)
        setProducts((prev: any) =>
          prev.map((e: any) =>
            e._id === product._id ? { ...e, isSelling: !e.isSelling } : e
          )
        );
        notify.success(`Cập nhật trạng thái sản phẩm ${product.name} thành công`);
    } catch (err) {
      console.error("Lỗi cập nhật trạng thái:", err);
    }
  };

  const handleClose = () => {
    setShowModal(false)
    setSelectedProduct(null); 
  }

  const handleShowDelete = (product: Product) => {
    setShowDeleteModal(true);
    setSelectedProduct(product); 
  }
  // form dữ diệu 
  const handleSetAddProduct = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      category: '',
      description: '',
      price:  0,
      discount: 0,
      images: [],
      stock: 0,
      useFors: '',
      uses: '',
      sideEffects: '',
    });
    setShowModal(true);
  };

  const handleSetEditProduct = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name || '',
      category: product.category?.name || '',
      description: product.description || '',
      price: product.price || 0,
      discount: product.discount || 0,
      images: product.images || [],
      stock: product.stock || 0,
      useFors: product.useFors || '',
      uses: product.uses || '',
      sideEffects: product.sideEffects || '',
    });
    setShowModal(true);
  };  

  const handleInputChange = (e: any) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles) return;

    const fileArray = Array.from(selectedFiles);

    setFiles(prev => [...prev, ...fileArray]);

    const previewUrls = fileArray.map(file => URL.createObjectURL(file));

    setFormData(prev => ({
      ...prev,
      images: [...prev.images, ...previewUrls], 
    }));
  };

  const formatPrice = (price: any) =>
    new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);

  const handleExportExcel = async () => {
    try {
      setExporting(true);
      const data = await getAllProducts(`?page=1&limit=5000&category=${filters.category}&search=${filters.search}`);
      const list = (data as any).products || [];
      const rows = list.map((p: any) => ({
        "Tên": p.name,
        "Danh mục": p.category?.name ?? p.category ?? "",
        "Mô tả": p.description ?? "",
        "Giá": p.price ?? 0,
        "Giảm giá (%)": p.discount ?? 0,
        "Tồn kho": p.stock ?? 0,
        "Công dụng": p.uses ?? "",
        "Hướng dẫn": p.useFors ?? "",
        "Tác dụng phụ": p.sideEffects ?? "",
        "Đang bán": p.isSelling ? "Có" : "Không",
      }));
      exportToExcel(rows, `san-pham-${new Date().toISOString().slice(0, 10)}`, "Sản phẩm");
      notify.success("Xuất Excel thành công!");
    } catch (err) {
      console.error(err);
      notify.error("Xuất Excel thất bại!");
    } finally {
      setExporting(false);
    }
  };

  const handleDownloadTemplateProduct = () => {
    const template = [
      { name: "Tên SP", category: "ID_DANH_MỤC", description: "", price: 0, discount: 0, stock: 0, useFors: "", uses: "", sideEffects: "" },
    ];
    exportToExcel(template, "mau-nhap-san-pham", "Mẫu");
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
      const productsPayload = rows.map((row: any) => {
        const name = row.name ?? row["name"] ?? row["Tên"] ?? "";
        const category = row.category ?? row["category"] ?? row["Danh mục"] ?? "";
        const catId = typeof category === "string" && category.length === 24 ? category : (categories.find((c: any) => c.name === category || c._id === category)?._id ?? category);
        return {
          name: String(name).trim(),
          category: catId,
          description: String(row.description ?? row["description"] ?? row["Mô tả"] ?? ""),
          price: Number(row.price ?? row["price"] ?? row["Giá"]) || 0,
          discount: Number(row.discount ?? row["discount"] ?? row["Giảm giá (%)"]) || 0,
          stock: Number(row.stock ?? row["stock"] ?? row["Tồn kho"]) || 0,
          useFors: String(row.useFors ?? row["useFors"] ?? row["Hướng dẫn"] ?? ""),
          uses: String(row.uses ?? row["uses"] ?? row["Công dụng"] ?? ""),
          sideEffects: String(row.sideEffects ?? row["sideEffects"] ?? row["Tác dụng phụ"] ?? ""),
        };
      }).filter((p: any) => p.name);
      if (productsPayload.length === 0) {
        notify.error("Không có dòng nào hợp lệ. Cần ít nhất cột: name, category (ID hoặc tên danh mục).");
        return;
      }
      await importProducts(productsPayload);
      notify.success(`Đã nhập ${productsPayload.length} sản phẩm!`);
      const data = await getAllProducts(`?page=${currentPage}&category=${filters.category}&search=${filters.search}`);
      if (data) {
        setProducts((data as any).products ?? []);
        setTotalPages((data as any).totalPages ?? 1);
      }
    } catch (err: any) {
      notify.error(err?.message || "Nhập Excel thất bại!");
    } finally {
      setImporting(false);
      e.target.value = "";
    }
  };

  // console.log(formData)
  return (
    <div className="admin-products">
        <main className="dashboard-main">
          <div className="products-main">
            <div className="products-header">
              <h2 className="products-title">Quản Lý Sản Phẩm</h2>
              <div className="products-actions">
                <button type="button" className="export-btn" onClick={handleExportExcel} disabled={exporting} style={{ marginRight: 8 }}>
                  {exporting ? "⏳ Đang xuất..." : "📤 Xuất Excel"}
                </button>
                <button type="button" className="filter-btn" onClick={handleDownloadTemplateProduct} style={{ marginRight: 8 }}>
                  📥 Tải mẫu
                </button>
                <button type="button" className="filter-btn" onClick={() => fileInputRef.current?.click()} disabled={importing} style={{ marginRight: 8 }}>
                  {importing ? "⏳ Đang nhập..." : "📂 Nhập Excel"}
                </button>
                <input ref={fileInputRef} type="file" accept=".xlsx,.xls" onChange={handleImportExcel} style={{ display: "none" }} />
                <button className="add-product-btn" onClick={handleSetAddProduct}>
                  ➕ Thêm Sản Phẩm
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
            className="search-input"
            placeholder="Tìm kiếm sản phẩm theo tên, mã..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
              </div>
            </div>

            {/* Products Grid */}
            {products && products.length > 0 ? (
              <div className="products-grid">
                {products.map((product) => (
                  <div key={product._id} className="product-card">
                    <div 
                      className="product-image"
                      style={{
                        backgroundImage: product.images?.[0]
                          ? `url(${product.images[0]})`
                          : product.name
                      }}
                    >
                        <span className={`product-status ${product.isSelling ? 'status-active' : 'status-inactive'}`}>
                          {product.isSelling ? 'Đang bán' : 'Ngừng bán'}
                        </span>
                    </div>
                    <div className="product-content">
                      <div className="product-category">
                        {product.category.name}
                      </div>
                      <h3 className="product-name">{product.name}</h3>
                      <p className="product-description">{product.description}</p>
                      <div className="product-details">
                        <div className="product-price">
                          {product.discount ? (
                            <div>
                            <span className="current-price">{formatPrice(product.price * (100 - product.discount) / 100)} </span>
                            <span className="original-price">{formatPrice(product.price)}</span>
                            </div>
                          ) : (
                            <span className="current-price">{formatPrice(product.price)}</span>
                          )}
                        </div>
                      </div>
                      <div className="product-actions">
                        <button 
                          className="action-btn edit-btn"
                          onClick={() => handleSetEditProduct(product)}
                        >
                          Sửa
                        </button>
                        <button 
                          className="action-btn delete-btn"
                          onClick={() => handleShowDelete(product)}
                        >
                          Xóa
                        </button>
                        <button 
                          className={`action-btn toggle-btn ${product.isSelling ? 'inactive' : ''}`}
                          onClick={() => handleUpdateProductStatus(product)}
                        >
                          {product.isSelling ? 'Tắt' : 'Bật'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-products">
                <div className="empty-icon">☕</div>
                <h3 className="empty-title">Không tìm thấy sản phẩm</h3>
                <p className="empty-description">            
                    Hãy thử điều chỉnh bộ lọc hoặc từ khóa tìm kiếm
                </p>
                <button className="add-product-btn" onClick={handleAddProduct}>
                  ➕ Thêm Sản Phẩm Đầu Tiên
                </button>
              </div>
            )}
          </div>
        </main>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
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
                onClick={() => setShowDeleteModal(false)}
              >
                Hủy
              </button>
              <button 
                className="confirm-delete-btn"
                onClick={() => handleDeleteProduct(selectedProduct._id)}
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {showModal && (
      <div className="product-modal">
        <div className="modal-content">
          <div className="modal-header">
            <h2 className="modal-title">
              {editingProduct ? 'Chỉnh sửa Sản phẩm' : 'Thêm Sản phẩm Mới'}
            </h2>
            <button className="close-btn" onClick={handleClose}>×</button>
          </div>

          <form className="product-form" onSubmit={editingProduct ? (handleEditProduct) : (handleAddProduct)}>
            <div className="form-group full-width">
              <label className="form-label required">Tên sản phẩm</label>
              <input
                type="text"
                className="form-input"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label required">Danh mục</label>
              <select
                className="form-select"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                required
              >
                {categories.filter(cat => cat.id !== 'all').map(category => (
                  <option key={category._id} value={category._id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Giá (VND)</label>
              <input
                type="number"
                className="form-input"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                min="0"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Giảm giá (%)</label>
              <input
                type="number"
                className="form-input"
                name="discount"
                value={formData.discount}
                onChange={handleInputChange}
                min="0"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Hướng dẫn sử dụng</label>
              <input
                type="text"
                className="form-input"
                name="useFors"
                value={formData.useFors}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Công dụng</label>
              <input
                type="text"
                className="form-input"
                name="uses"
                value={formData.uses}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Tác dụng phụ</label>
              <input
                type="text"
                className="form-input"
                name="sideEffects"
                value={formData.sideEffects}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Kho</label>
              <input
                type="number"
                className="form-input"
                name="stock"
                value={formData.stock}
                onChange={handleInputChange}
                min="0"
              />
            </div>

            <div className="form-group full-width">
              <label className="form-label required">Mô tả</label>
              <textarea
                className="form-textarea"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="form-group full-width">
              <label className="form-label">Hình ảnh</label>
              <div className="image-upload">
                <div className="image-preview">
                  {formData.images.length > 0 ? (
                    formData.images.map((img, index) => (
                      <img key={index} src={img} alt={`Preview ${index}`} />
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
                  onChange={handleImageUpload}
                  style={{ display: 'none' }}
                />
                <label htmlFor="image-upload" className="upload-btn">
                  Chọn hình ảnh
                </label>
              </div>
            </div>

            <div className="form-actions">
              <button type="button" className="cancel-btn" onClick={handleClose}>
                Hủy
              </button>
              <button type="submit" className="save-btn">
                {editingProduct ? 'Cập nhật' : 'Thêm sản phẩm'}
              </button>
            </div>
          </form>
        </div>
      </div>
      )}
    </div>
  );
};


export default AdminProducts;