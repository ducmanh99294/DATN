import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import '../assets/product.css';
import { getAllProducts } from '../api/productApi';
import { getCategories } from '../api/categoryApi';
import { useCart } from '../context/CartContext';

interface Category {
  _id: string;
  name: string;
}

export interface Product {
  _id: string;
  name: string;
  category: Category; 
  description?: string;
  price: number;
  discount?: number;
  images: string[];
  stock: number;
  rating: number;
  reviewCount: number;
  sellCount: number;
  useFors?: string;
  uses?: string;
  sideEffects?: string;
  isSelling: boolean;
  prescriptionRequired: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface FilterOptions {
  categories: string[];
  priceRange: [number, number];
  prescriptionOnly: boolean;
  inStock: boolean;
  sortBy: 'name-asc' | 'name-desc' | 'price-asc' | 'price-desc' | 'rating';
}

const Products = () => {
  const navigate = useNavigate();
  
  const location = useLocation();
  const { addToCart } = useCart(); 
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Product[]>([]);
  const [keyword, setKeyword] = useState('');
  const [activeFilters, setActiveFilters] = useState<FilterOptions>({
    categories: [],
    priceRange: [0, 500000],
    prescriptionOnly: false,
    inStock: false,
    sortBy: 'name-asc'
  });
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({
    category: "all",
    search: "",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [categoryLoading, setCategoryLoading] = useState(false);
  const queryParams = new URLSearchParams(location.search);
  const searchFromURL = queryParams.get("search") || "";

  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      search: searchFromURL
    }));
    setKeyword(searchFromURL)
  }, [location.search]);

  useEffect(() => {
  const fetchData = async () => {
    try{
      setLoading(true);
      const res = await getAllProducts(`?page=${page}&category=${filters.category}&search=${filters.search}&minPrice=${activeFilters.priceRange[0]}&maxPrice=${activeFilters.priceRange[1]}&sortBy=${activeFilters.sortBy}`);
      setProducts(res.products);
      setTotalPages(res.totalPages)
      setTotal(res.total)
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  fetchData();
}, [page, filters.category, filters.search, activeFilters.priceRange, activeFilters.sortBy]);

  useEffect(() => {
    const fetchCategories = async () => {
    try {
      setCategoryLoading(true)
        const res = await getCategories();
        setCategories(res);
    } catch (e) {
        console.log(e)
    } finally {
      setCategoryLoading(false)
    }
  }
    fetchCategories();
  }, []);

  // Handle search from Home page
   const handleSearch = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const categoryOptions = [
    { _id: "all", name: "Tất cả" },
    ...categories
  ];

  // Handle price range change
  const handlePriceRangeChange = (min: number, max: number) => {
    setActiveFilters(prev => ({
      ...prev,
      priceRange: [min, max]
    }));
  };

  // Handle sort change
  const handleSortChange = (sortBy: FilterOptions['sortBy']) => {
    setActiveFilters(prev => ({
      ...prev,
      sortBy
    }));
  };

  // Handle filter reset
  const handleResetFilters = () => {
    setKeyword('');
    setSelectedCategory('all')
    setFilters(prev => ({ ...prev, category: 'all', search: '' }));
    setActiveFilters({
      categories: [],
      priceRange: [0, 500000],
      prescriptionOnly: false,
      inStock: false,
      sortBy: 'name-asc'
    });
    navigate('/products');
  };

  // Format price
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN').format(price) + ' ₫';
  };

  // Render rating stars
  const renderRating = (rating: number) => {
    return (
      <div className="product-rating">
        {[...Array(5)].map((_, i) => (
          <i 
            key={i} 
            className={`fas fa-star ${i < Math.floor(rating) ? 'filled' : ''}`}
          ></i>
        ))}
        <span className="rating-text">{rating.toFixed(1)}</span>
        <span className="review-count">({rating.toFixed(1)})</span>
      </div>
    );
  };

  return (
    <div className="products-container">
      {/* Hero Section */}
      <div className="products-hero">
        <div className="container">
          <div className="hero-content">
            <h1>Nhà thuốc trực tuyến</h1>
            <p>Hơn 10.000 sản phẩm thuốc và thiết bị y tế chính hãng</p>
            
            {/* Search Bar */}
            <div className="search-container">
              <div className="search-input-wrapper">
                <i className="fas fa-search"></i>
                <input
                  type="text"
                  placeholder="Tìm kiếm thuốc, thiết bị y tế, thương hiệu..."
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleSearch("search", keyword);
                    }
                  }}
                />
                {keyword && (
                  <button 
                    className="clear-search"
                    onClick={() => {
                      setKeyword('');
                      navigate('/products');
                    }}
                  >
                    <i className="fas fa-times"></i>
                  </button>
                )}
              </div>
              <button 
                className="search-btn"
                onClick={() => handleSearch("search", keyword)}
              >
                <i className="fas fa-search"></i>
                Tìm kiếm
              </button>
            </div>

            {/* Quick Categories */}
            <div className="quick-categories">
            {categoryLoading ? (
                <p>Đang tải danh mục...</p>
            ) : (
              <>
              <button 
                className={`quick-category ${selectedCategory === 'all' ? 'active' : ''}`}
                onClick={() => handleSearch('category','all')}
              >
                <i className="fas fa-th-large"></i>
                Tất cả
              </button>
              {categoryOptions.slice(1, 6).map(category => (
                <button
                  key={category._id}
                  className={`quick-category ${selectedCategory === category.name ? 'active' : ''}`}
                  onClick={() => [handleSearch('category', category._id),setSelectedCategory(category.name)]}
                >
                  <i className="fas fa-pills"></i>
                  {category.name}
                </button>
              ))}
              </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container main-content">
        <div className="content-wrapper">
          {/* Filters Sidebar */}
          <div className={`filters-sidebar ${showFilters ? 'mobile-show' : ''}`}>
            <div className="filters-header">
              <h3>
                <i className="fas fa-filter"></i>
                Bộ lọc
              </h3>
              <button 
                className="close-filters"
                onClick={() => setShowFilters(false)}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            {/* Categories Filter */}
            <div className="filter-section">
              <h4>
                <i className="fas fa-tags"></i>
                Danh mục
              </h4>
            {categoryLoading ? (
              <div className="loading-category-container">
                <div className="spinner"></div>
                <p>Đang tải danh mục...</p>
              </div>
            ) : (
              <div className="category-list">
                {categories.map(category => (
                  <button
                    key={category._id}
                    className={`category-item ${selectedCategory === category.name ? 'active' : ''}`}
                    onClick={() => {
                      handleSearch('category', category._id);
                      setSelectedCategory(category.name);
                    }}
                  >
                    {category.name === 'all' ? (
                      <>
                        <i className="fas fa-th-large"></i>
                        Tất cả sản phẩm
                      </>
                    ) : (
                      <>
                        <i className="fas fa-pills"></i>
                        {category.name}
                      </>
                    )}
                  </button>
                ))}
              </div>
              )}
            </div>

            {/* Price Filter */}
            <div className="filter-section">
              <h4>
                <i className="fas fa-tag"></i>
                Khoảng giá
              </h4>
              <div className="price-filter">
                <div className="price-inputs">
                  <div className="price-input">
                    <span>Từ</span>
                    <input
                      type="number"
                      value={activeFilters.priceRange[0]}
                      onChange={(e) => handlePriceRangeChange(Number(e.target.value), activeFilters.priceRange[1])}
                      min="0"
                      max="1000000"
                    />
                    <span>₫</span>
                  </div>
                  <div className="price-input">
                    <span>Đến</span>
                    <input
                      type="number"
                      value={activeFilters.priceRange[1]}
                      onChange={(e) => handlePriceRangeChange(activeFilters.priceRange[0], Number(e.target.value))}
                      min="0"
                      max="1000000"
                    />
                    <span>₫</span>
                  </div>
                </div>
                <div className="price-slider">
                  <input
                    type="range"
                    min="0"
                    max="500000"
                    step="10000"
                    value={activeFilters.priceRange[0]}
                    onChange={(e) => handlePriceRangeChange(Number(e.target.value), activeFilters.priceRange[1])}
                    className="slider min"
                  />
                  <input
                    type="range"
                    min="0"
                    max="500000"
                    step="10000"
                    value={activeFilters.priceRange[1]}
                    onChange={(e) => handlePriceRangeChange(activeFilters.priceRange[0], Number(e.target.value))}
                    className="slider max"
                  />
                </div>
                <div className="price-display">
                  {formatPrice(activeFilters.priceRange[0])} - {formatPrice(activeFilters.priceRange[1])}
                </div>
              </div>
            </div>

            {/* Other Filters */}
            <div className="filter-section">
              <h4>
                <i className="fas fa-sliders-h"></i>
                Lọc khác
              </h4>
              <div className="checkbox-filters">
                <label className="checkbox-filter">
                  <input
                    type="checkbox"
                    checked={activeFilters.prescriptionOnly}
                    onChange={(e) => setActiveFilters(prev => ({
                      ...prev,
                      prescriptionOnly: e.target.checked
                    }))}
                  />
                  <span className="checkmark"></span>
                  <div className="filter-content">
                    <i className="fas fa-prescription"></i>
                    <span>Chỉ thuốc kê đơn</span>
                  </div>
                </label>
                <label className="checkbox-filter">
                  <input
                    type="checkbox"
                    checked={activeFilters.inStock}
                    onChange={(e) => setActiveFilters(prev => ({
                      ...prev,
                      inStock: e.target.checked
                    }))}
                  />
                  <span className="checkmark"></span>
                  <div className="filter-content">
                    <i className="fas fa-check-circle"></i>
                    <span>Còn hàng</span>
                  </div>
                </label>
              </div>
            </div>

            {/* Reset Filters */}
            <button className="reset-filters-btn" onClick={handleResetFilters}>
              <i className="fas fa-redo"></i>
              Xóa bộ lọc
            </button>
          </div>

          {/* Main Content */}
          <div className="products-main">
            {loading ? (
              <div className="loading-container">
                <div className="spinner"></div>
                <p>Đang tải sản phẩm...</p>
              </div>
            ) : (
            <>
              <div className="products-header">
                <div className="results-info">
                  <h2>Tất cả sản phẩm</h2>
                </div>
                
                <div className="header-controls">
                  <button 
                    className="mobile-filter-btn"
                    onClick={() => setShowFilters(true)}
                  >
                    <i className="fas fa-filter"></i>
                    Bộ lọc
                  </button>
                  
                  <div className="sort-controls">
                    <span className="sort-label">
                      <i className="fas fa-sort-amount-down"></i>
                      Sắp xếp:
                    </span>
                    <select
                      value={activeFilters.sortBy}
                      onChange={(e) => handleSortChange(e.target.value as FilterOptions['sortBy'])}
                      className="sort-select"
                    >
                      <option value="name-asc">Tên A-Z</option>
                      <option value="name-desc">Tên Z-A</option>
                      <option value="price-asc">Giá thấp đến cao</option>
                      <option value="price-desc">Giá cao đến thấp</option>
                      <option value="rating">Đánh giá cao nhất</option>
                    </select>
                  </div>
                </div>
              </div> 

              {/* Active Filters Display */}
              {selectedCategory !== 'all' && (
                <div className="active-filters">
                  <div className="active-filter">
                    <span>Danh mục: {selectedCategory}</span>
                    <button onClick={() => [setSelectedCategory('all'),handleSearch('category','all')]}>
                      <i className="fas fa-times"></i>
                    </button>
                  </div>
                  {activeFilters.prescriptionOnly && (
                    <div className="active-filter">
                      <span>Chỉ thuốc kê đơn</span>
                      <button onClick={() => setActiveFilters(prev => ({ ...prev, prescriptionOnly: false }))}>
                        <i className="fas fa-times"></i>
                      </button>
                    </div>
                  )}
                  {activeFilters.inStock && (
                    <div className="active-filter">
                      <span>Chỉ còn hàng</span>
                      <button onClick={() => setActiveFilters(prev => ({ ...prev, inStock: false }))}>
                        <i className="fas fa-times"></i>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Products Grid */}
              {products.length > 0 ? (
                <>
                  <div className="products-grid">
                    {products.map(product => (
                      <div key={product._id} className="product-card">
                        {/* Product Image */}
                        <div className="product-image">
                          <img src={product.images[0]} alt={product.name} />
                          {product.discount && (
                            <div className="discount-badge">
                              -{product.discount}%
                            </div>
                          )}
                          {product.prescriptionRequired && (
                            <div className="prescription-badge">
                              <i className="fas fa-prescription"></i>
                              Kê đơn
                            </div>
                          )}
                          {product.stock === 0 && (
                            <div className="out-of-stock">
                              <i className="fas fa-times-circle"></i>
                              Hết hàng
                            </div>
                          )}
                          <div className="image-overlay">
                            {/* <button 
                              className="quick-view-btn"
                              onClick={() => handleQuickView(product)}
                            >
                              <i className="fas fa-eye"></i>
                              Xem nhanh
                            </button> */}
                            <button 
                              className="add-to-cart-btn"
                              onClick={() => addToCart(product._id)}
                              disabled={product.stock === 0}
                            >
                              <i className="fas fa-cart-plus"></i>
                              Thêm vào giỏ
                            </button>
                          </div>
                        </div>

                        {/* Product Info */}
                        <div className="product-info">
                          <div className="product-category">
                            <i className="fas fa-tag"></i>
                            {product.category.name}
                          </div>
                          
                          <h3 className="product-name">{product.name}</h3>
                          
                          <div className="product-manufacturer">
                            <i className="fas fa-industry"></i>
                            {/* {product.manufacturer} */}test
                          </div>
                          
                          {renderRating(product.rating)}
                          
                          <div className="product-description">
                            {product.description}
                          </div>
                          
                        <div className="product-uses">
                        <strong>Công dụng:</strong>
                        <div className="uses-tags">
                          {product?.uses
                            ?.split(",")
                            .map((item) => item.trim())
                            .slice(0, 3)
                            .map((use, idx) => (
                              <span key={idx} className="use-tag">
                                {use}
                              </span>
                            ))}

                          {product.uses && product.uses.split(",").length > 3 && (
                            <span className="use-tag more">
                              +{product.uses.split(",").length - 3}
                            </span>
                          )}
                        </div>
                      </div>
                        </div>

                        {/* Product Price & Actions */}
                        <div className="product-footer">
                          <div className="product-price">
                            {product.discount ? (
                              <div className="product-price">
                                <div className="current-price">
                                  {formatPrice(product.price * (100 - product.discount)/100)}
                                </div>
                                <div className="original-price">
                                  {formatPrice(product.price)}
                                </div>
                              </div>
                            ) : (
                              <div className="current-price">
                                {formatPrice(product.price)}
                              </div>
                            )}
                          </div>
                          
                          <div className="product-stock">
                            <i className={`fas ${product.stock > 0 ? 'fa-check-circle' : 'fa-times-circle'}`}></i>
                            {product.stock > 0 ? `Còn ${product.stock} sản phẩm` : 'Hết hàng'}
                          </div>
                          
                          <div className="product-actions">
                            <button 
                              className="buy-now-btn"
                              onClick={() => addToCart(product._id)}
                              disabled={product.stock === 0}
                            >
                              <i className="fas fa-shopping-cart"></i>
                              Mua ngay
                            </button>
                            <button 
                              className="details-btn"
                              onClick={() => navigate(`/product/${product._id}`)}
                            >
                              <i className="fas fa-info-circle"></i>
                              Chi tiết
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="pagination">
                      <button 
                        className={`page-btn ${currentPage === 1 ? 'disabled' : ''}`}
                        onClick={() => setCurrentPage(prev => prev - 1)} disabled={currentPage === 1}
                      >
                        <i className="fas fa-chevron-left"></i>
                        Trước
                      </button>
                      
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (page <= 3) {
                          pageNum = i + 1;
                        } else if (page >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = page - 2 + i;
                        }
                        
                        return (
                          <button
                            key={pageNum}
                            className={`page-btn ${page === pageNum ? 'active' : ''}`}
                            onClick={() => setPage(pageNum)}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                      
                      <button 
                        className={`page-btn ${currentPage === totalPages ? 'disabled' : ''}`}
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, currentPage))}
                        disabled={currentPage === totalPages}
                      >
                        Sau
                        <i className="fas fa-chevron-right"></i>
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="no-results">
                  <div className="no-results-icon">
                    <i className="fas fa-search"></i>
                  </div>
                  <h3>Không tìm thấy sản phẩm</h3>
                  <p>Không có sản phẩm nào phù hợp với tiêu chí tìm kiếm của bạn.</p>
                  <button className="reset-search-btn" onClick={handleResetFilters}>
                    <i className="fas fa-redo"></i>
                    Xóa tìm kiếm & bộ lọc
                  </button>
                </div>
              )}
            </>
            )}
            {/* Category Banner */}
            <div className="category-banner">
              <div className="banner-content">
                <h3>
                  <i className="fas fa-shield-alt"></i>
                  Mua sắm an toàn với MediCare
                </h3>
                <div className="banner-features">
                  <div className="feature">
                    <i className="fas fa-check-circle"></i>
                    <span>Thuốc chính hãng 100%</span>
                  </div>
                  <div className="feature">
                    <i className="fas fa-shipping-fast"></i>
                    <span>Giao hàng toàn quốc</span>
                  </div>
                  <div className="feature">
                    <i className="fas fa-headset"></i>
                    <span>Tư vấn dược sĩ 24/7</span>
                  </div>
                  <div className="feature">
                    <i className="fas fa-undo"></i>
                    <span>Đổi trả trong 7 ngày</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Products;