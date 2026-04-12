import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import '../assets/news.css';
import { useAuthContext } from '../context/AuthContext';
import { useNotify } from '../hooks/useNotification';
import { getAllNews, getNewsBySlug } from '../api/newsApi';
import { getCategories } from '../api/categoryApi';
import { getDoctor } from '../api/doctorApi';
import { getAllFaqs, type FaqItem } from '../api/faqApi';

const DEFAULT_FAQS: FaqItem[] = [
  { _id: '1', question: 'Làm thế nào để đặt lịch khám với bác sĩ?', answer: 'Bạn có thể đặt lịch trực tuyến qua trang Đặt lịch: chọn chuyên khoa, bác sĩ, ngày giờ phù hợp và điền thông tin. Hệ thống sẽ gửi xác nhận qua email/SMS.' },
  { _id: '2', question: 'Tôi có thể hủy hoặc đổi lịch khám không?', answer: 'Có. Bạn vào mục Lịch hẹn của tôi, chọn lịch cần hủy/đổi và thao tác. Nên hủy hoặc đổi trước ít nhất 24 giờ để người khác có thể đặt lịch.' },
  { _id: '3', question: 'Chi phí khám và thanh toán như thế nào?', answer: 'Mức phí tùy từng chuyên khoa và bác sĩ, hiển thị khi bạn chọn bác sĩ. Bạn có thể thanh toán trực tuyến (chuyển khoản, ví điện tử) hoặc thanh toán tại phòng khám.' },
  { _id: '4', question: 'Kết quả khám và đơn thuốc có được gửi online không?', answer: 'Sau khám, bác sĩ có thể gửi đơn thuốc và tóm tắt kết quả qua ứng dụng/email. Bạn có thể xem lại trong mục Hồ sơ khám bệnh.' },
  { _id: '5', question: 'Tư vấn từ xa (video/chat) có được hỗ trợ không?', answer: 'Một số bác sĩ hỗ trợ tư vấn từ xa. Khi đặt lịch bạn có thể chọn hình thức khám trực tiếp hoặc trực tuyến tùy từng bác sĩ.' },
];


const News = () => {
  
  const [news, setNews] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [faqs, setFaqs] = useState<FaqItem[]>(DEFAULT_FAQS);
  const [openFaqId, setOpenFaqId] = useState<string | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<any | null>(null);

  const [showDetailModal, setShowDetailModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [doctorLoading, setDoctorLoading] = useState(false);
  const [faqLoading, setFaqLoading] = useState(false);
  const [sortBy, setSortBy] = useState<'latest' | 'popular' | 'trending'>('latest');

  const [filters, setFilters] = useState({
    category: "all",
    date: "all",
    status: "all",
    search: "",
  });

  
  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const { user } = useAuthContext();
  const notify = useNotify();
  const navigate = useNavigate();
  
  useEffect(() => {
    const fetchDoctor = async () => {
      try {
        setDoctorLoading(true);
        const data = await getDoctor();

        if (data) {
          setDoctors(data);
        }
      } catch (err) {
        console.error("Lỗi load doctor:", err);
        notify.error("Không thể tải danh bác sĩ");
      } finally {
        setDoctorLoading(false)
      }
    };

    fetchDoctor();

  }, []);

  useEffect(() => {
    const fetchFaqs = async () => {
      try {
        setFaqLoading(true);
        const data = await getAllFaqs();
        if (data && data.length > 0) {
          setFaqs(data);
        } else {
          setFaqs(DEFAULT_FAQS);
        }
      } catch {
        setFaqs(DEFAULT_FAQS);
      } finally {
        setFaqLoading(false);
      }
    };
    fetchFaqs();
  }, []);

  useEffect(() => {
    const fetchCategory = async () => {
      try {
        setCategoryLoading(true)
        const data = await getCategories();

        if (data) {
          setCategories(data);
        }
      } catch (err) {
        console.error("Lỗi load categories:", err);
        notify.error("Không thể tải danh sách danh mục");
      } finally {
        setCategoryLoading(false)
      }
    };

    fetchCategory();

  }, []);

  useEffect(() => {
    fetchNews();
  }, [filters.status, filters.search, filters.date, filters.category, currentPage]);

  const fetchNews = async () => {
    try {
      setLoading(true);
      const data = await getAllNews(
        `?page=${currentPage}&date=${filters.date}&category=${filters.category}&status=${filters.status}&search=${filters.search}`
      );

      setNews(data.news);
      setTotalPages(data.totalPages)
    } catch (err) {
      notify.error("Không thể tải danh sách tin tức");
    } finally {
      setLoading(false)
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'Hôm nay';
    } else if (diffDays === 1) {
      return 'Hôm qua';
    } else if (diffDays < 7) {
      return `${diffDays} ngày trước`;
    } else {
      return date.toLocaleDateString('vi-VN');
    }
  };

  // Handle article click
  const handleArticleClick = async (article: any) => {
    try {
      const data = await getNewsBySlug(article.slug)

      setSelectedArticle(data);
      setShowDetailModal(true);
      navigate(`/news/${article.slug}`, { replace: true });
    } catch (e) {
      console.log(e)
    }
  };

  // Handle close modal
  const handleCloseModal = () => {
    setShowDetailModal(false);
    setSelectedArticle(null);
    navigate('/news', { replace: true });
  };

  const renderContent = (content: string, images: string[]) => {
    if (!content) return null;

    const lines = content.split("\n").filter((l) => l.trim() !== "");
    let imageIndex = 0;

    return lines.map((line, index) => {
      const text = line.trim();

      // Heading
      if (/^\d+\./.test(text)) {
        return (
          <h2 key={index} className="article-heading">
            {text}
          </h2>
        );
      }

      // Bullet
      if (
        text.startsWith("Vitamin") ||
        text.startsWith("Kẽm") ||
        text.startsWith("Probiotic") ||
        text.startsWith("Tỏi") ||
        text.startsWith("Gừng") ||
        text.startsWith("Nghệ") ||
        text.startsWith("Nhân sâm")
      ) {
        return <li key={index}>{text}</li>;
      }

      const showImage = index % 3 === 2 && images && images[imageIndex];

      if (showImage) {
        const img = images[imageIndex];
        imageIndex++;

        return (
          <div key={index}>
            <p>{text}</p>
            <img src={img} className="article-inline-image" alt="article" />
          </div>
        );
      }

      return <p key={index}>{text}</p>;
    });
  };
  
  const renderGridCard = (article: any) => (
    <div
      key={article._id}
      className="article-card"
      onClick={() => handleArticleClick(article)}
    >
      <div className="article-image">
        <img
          src={article.thumbnail || article.images?.[0]}
          alt={article.title}
        />

        {article.featured && <span className="featured-badge">Nổi bật</span>}
        {article.trending && <span className="trending-badge">Xu hướng</span>}
      </div>

      <div className="article-content">
        <div className="article-meta">
          <span className="article-category">
            <i className="fas fa-folder"></i>
            {article.category?.name}
          </span>

          <span className="article-date">
            <i className="far fa-calendar-alt"></i>
            {formatDate(article.createdAt)}
          </span>
        </div>

        <h3 className="article-title">{article.title}</h3>

        <p className="article-excerpt">{article.summary}</p>

        <div className="article-footer">
          <div className="article-stats">
            <span>
              <i className="far fa-eye"></i> {article.views}
            </span>

            <span>
              <i className="far fa-heart"></i> {article.like}
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  // Render detail modal
  const renderDetailModal = () => {
    if (!selectedArticle) return null;

    return (
      <div className="modal-overlay" onClick={handleCloseModal}>
        <div className="modal-content article-detail-modal" onClick={e => e.stopPropagation()}>
          <button className="modal-close-btn" onClick={handleCloseModal}>
            <i className="fas fa-times"></i>
          </button>

          <div className="article-detail">
            <div className="article-detail-header">
              <img src={selectedArticle.thumbnail} alt={selectedArticle.title} className="detail-image" />
              <div className="detail-overlay">
                <div className="detail-categories">
                  {/* <span className="detail-category" style={{ backgroundColor: categories.find(c => c.id === selectedArticle.categoryId)?.color }}>
                    <i className={categories.find(c => c.id === selectedArticle.categoryId)?.icon}></i> */}
                    {selectedArticle.category.name}
                  {/* </span> */}
                  {selectedArticle.trending && (
                    <span className="detail-trending">
                      <i className="fas fa-fire"></i> Xu hướng
                    </span>
                  )}
                </div>
                <h1 className="detail-title">{selectedArticle.title}</h1>
                <div className="detail-meta">
                  {/* <div className="detail-author">
                    <img src={selectedArticle.authorAvatar} alt={selectedArticle.author} />
                    <div>
                      <span className="author-name">{selectedArticle.author}</span>
                      <span className="publish-date">
                        <i className="far fa-calendar-alt"></i>
                        {new Date(selectedArticle.publishedAt).toLocaleDateString('vi-VN')}
                      </span>
                    </div>
                  </div> */}
                  <div className="detail-stats">
                    <span><i className="far fa-eye"></i> {selectedArticle.views} lượt xem</span>
                    <span><i className="far fa-heart"></i> {selectedArticle.like}</span>
                    {/* <span><i className="far fa-clock"></i> {selectedArticle.readingTime} phút đọc</span> */}
                  </div>
                </div>
              </div>
            </div>

            <div className="article-detail-body">
              {/* <div className="article-content" dangerouslySetInnerHTML={{ __html: selectedArticle.content }} /> */}
              {renderContent(selectedArticle?.content, selectedArticle?.images)}
              {selectedArticle.sources && (
                <div className="article-sources">
                  <h4>Nguồn tham khảo:</h4>
                  <ul>
                    {selectedArticle.sources.map((source: any, index: any) => (
                      <li key={index}>{source}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* <div className="article-tags">
                {selectedArticle.tags.map((tag:any) => (
                  <span key={tag} className="article-tag">#{tag}</span>
                ))}
              </div> */}

              <div className="article-share">
                <span>Chia sẻ bài viết:</span>
                <button className="share-btn facebook">
                  <i className="fab fa-facebook-f"></i>
                </button>
                <button className="share-btn copy" onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  notify.success("đã sao chép liên kết thành công")
                }}>
                  <i className="fas fa-link"></i>
                </button>
              </div>

              {/* {selectedArticle.relatedDoctors && (
                <div className="related-doctors">
                  <h4>Bác sĩ tư vấn:</h4>
                  <div className="doctors-list">
                    {selectedArticle.relatedDoctors.map((doctor: any )=> (
                      <div key={doctor.id} className="doctor-mini-card">
                        <i className="fas fa-user-md"></i>
                        <div>
                          <strong>{doctor.name}</strong>
                          <span>{doctor.specialty}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )} */}

              {/* Comments Section */}
              {/* <div className="article-comments">
                <h4>Bình luận ({comments.filter(c => c.articleId === selectedArticle.id).length})</h4>
                
                <div className="add-comment">
                  <textarea placeholder="Viết bình luận của bạn..." rows={3} />
                  <button className="submit-comment">Gửi bình luận</button>
                </div>

                <div className="comments-list">
                  {comments
                    .filter(c => c.articleId === selectedArticle.id)
                    .map(comment => (
                      <div key={comment.id} className="comment-item">
                        <img src={comment.userAvatar} alt={comment.userName} className="comment-avatar" />
                        <div className="comment-content">
                          <div className="comment-header">
                            <strong>{comment.userName}</strong>
                            <span className="comment-date">{formatDate(comment.createdAt)}</span>
                          </div>
                          <p>{comment.content}</p>
                          <div className="comment-actions">
                            <button className="comment-like">
                              <i className="far fa-heart"></i> {comment.likes}
                            </button>
                            <button className="comment-reply">
                              <i className="far fa-comment"></i> Trả lời
                            </button>
                          </div>
                          
                          {comment.replies && comment.replies.map((reply: any) => (
                            <div key={reply.id} className="comment-reply">
                              <img src={reply.userAvatar} alt={reply.userName} className="comment-avatar" />
                              <div className="comment-content">
                                <div className="comment-header">
                                  <strong>{reply.userName}</strong>
                                  <span className="comment-date">{formatDate(reply.createdAt)}</span>
                                </div>
                                <p>{reply.content}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                </div>
              </div> */}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="news-container">
      {/* Header */}
      <div className="news-header">
        <div className="container">
          <div className="header-content">
            <h1>
              <i className="fas fa-newspaper"></i>
              Tin tức y tế
            </h1>
            <p>Cập nhật kiến thức sức khỏe mới nhất từ đội ngũ chuyên gia</p>
          </div>
        </div>
      </div>

      <div className="container main-content">
        {/* Search Bar */}
        <div className="news-search">
          <div className="search-wrapper">
            <i className="fas fa-search"></i>
            <input
              type="text"
              placeholder="Tìm kiếm bài viết, chủ đề sức khỏe..."
              value={filters.search}
              onChange={(e) => setFilters({...filters, search: e.target.value})}
            />
          </div>
        </div>

        {/* Categories */}
        <div className="news-categories">
          <button
            className={`category-btn ${filters.category === 'all' ? 'active' : ''}`}
            onClick={() => handleFilterChange("category", 'all')}
          >
            <i className="fas fa-th-large"></i>
            Tất cả
          </button>
          {categoryLoading ? (
            "loading"
          ) : (
          categories.map(category => (
            <button
              key={category._id}
              className={`category-btn ${filters.category === category._id ? 'active' : ''}`}
              onClick={() => handleFilterChange("category", category._id)}
            >
              {category.name}
            </button>
          ) 
          ))}
        </div>

        {/* Controls */}
        <div className="news-controls">
          <div className="results-info">
            <span>Hiển thị {news.length} bài viết</span>
          </div>
          
          <div className="controls-right">
            <div className="sort-controls">
              <label>Sắp xếp:</label>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)}>
                <option value="latest">Mới nhất</option>
                <option value="popular">Phổ biến nhất</option>
                <option value="trending">Xu hướng</option>
              </select>
            </div>
          </div>
        </div>

        {/* Articles Grid/List */}
        {loading ? (
          <div className="loading-state">
            <i className="fas fa-spinner fa-spin"></i>
            <p>Đang tải bài viết...</p>
          </div>
        ) : news.length > 0 ? (
          <>
            <div className={`news-container grid`}>
              {news.map(article => 
                renderGridCard(article)
              )}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="pagination">
                <button
                  className={`page-btn ${currentPage === 1 ? 'disabled' : ''}`}
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  <i className="fas fa-chevron-left"></i>
                </button>
                
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    className={`page-btn ${currentPage === page ? 'active' : ''}`}
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </button>
                ))}
                
                <button
                  className={`page-btn ${currentPage === totalPages ? 'disabled' : ''}`}
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  <i className="fas fa-chevron-right"></i>
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="empty-state">
            <i className="fas fa-newspaper"></i>
            <h3>Không tìm thấy bài viết</h3>
            <p>Không có bài viết nào phù hợp với tìm kiếm của bạn</p>
            <button className="reset-btn" onClick={() => {
              handleFilterChange("search", "")
              handleFilterChange("category", "all")
            }}>
              Xóa bộ lọc
            </button>
          </div>
        )}

        {/* Featured Doctors */}
        <div className="featured-doctors">
          <h2>
            <i className="fas fa-user-md"></i>
            Đội ngũ chuyên gia tư vấn
          </h2>
          {doctorLoading ? (
              <div className="loading-state">
                <i className="fas fa-spinner fa-spin"></i>
                <p>Đang tải danh sách...</p>
              </div>
            ) : (
            <div className="doctors-scroll">
              {doctors.map((doctor) => (
                  <div key={doctor._id} className="doctor-feature-card">
                    <img src={doctor.userId?.image} alt={doctor.userId?.image} />
                    <h4 className="doctor-name">{doctor.userId?.fullName}</h4>
                    <p>{doctor.specialtyId?.name}</p>
                  </div>
                ))}
            </div>
            )
          }
        </div>

        {/* Câu hỏi thường gặp */}
        <section id="cau-hoi-thuong-gap" className="news-faq-section" aria-label="Câu hỏi thường gặp">
          <h2>
            <i className="fas fa-question-circle"></i>
            Câu hỏi thường gặp
          </h2>
          {faqLoading ? (
            <div className="loading-state">
              <i className="fas fa-spinner fa-spin"></i>
              <p>Đang tải...</p>
            </div>
          ) : (
            <div className="faq-list">
              {faqs.map((faq) => (
                <div
                  key={faq._id}
                  className={`faq-item ${openFaqId === faq._id ? 'open' : ''}`}
                >
                  <button
                    type="button"
                    className="faq-question"
                    onClick={() => setOpenFaqId(openFaqId === faq._id ? null : faq._id)}
                  >
                    <span>{faq.question}</span>
                    <i className={`fas fa-chevron-${openFaqId === faq._id ? 'up' : 'down'}`}></i>
                  </button>
                  <div className="faq-answer">
                    <p>{faq.answer}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Article Detail Modal */}
      {showDetailModal && renderDetailModal()}
    </div>
  );
};

export default News;