import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import '../assets/news.css';

interface NewsArticle {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  categoryId: string;
  author: string;
  authorAvatar?: string;
  publishedAt: string;
  updatedAt?: string;
  imageUrl: string;
  thumbnailUrl: string;
  tags: string[];
  views: number;
  likes: number;
  comments: number;
  featured: boolean;
  trending: boolean;
  readingTime: number; // phút
  sources?: string[];
  relatedDoctors?: {
    id: string;
    name: string;
    specialty: string;
  }[];
}

interface NewsCategory {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  count: number;
  color: string;
}

interface NewsComment {
  id: string;
  articleId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  createdAt: string;
  likes: number;
  replies?: NewsComment[];
}

const News = () => {
  const navigate = useNavigate();
  const { slug } = useParams<{ slug: string }>();
  
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [filteredArticles, setFilteredArticles] = useState<NewsArticle[]>([]);
  const [categories, setCategories] = useState<NewsCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedArticle, setSelectedArticle] = useState<NewsArticle | null>(null);
  const [relatedArticles, setRelatedArticles] = useState<NewsArticle[]>([]);
  const [comments, setComments] = useState<NewsComment[]>([]);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<'latest' | 'popular' | 'trending'>('latest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const articlesPerPage = 9;

  // Mock data - Danh mục tin tức
  const mockCategories: NewsCategory[] = [
    {
      id: 'cat1',
      name: 'Sức khỏe tổng quát',
      slug: 'suc-khoe-tong-quat',
      description: 'Các bài viết về sức khỏe tổng quát, chăm sóc sức khỏe hàng ngày',
      icon: 'fas fa-heartbeat',
      count: 24,
      color: '#0E7490'
    },
    {
      id: 'cat2',
      name: 'Dinh dưỡng',
      slug: 'dinh-duong',
      description: 'Chia sẻ kiến thức về dinh dưỡng, thực phẩm tốt cho sức khỏe',
      icon: 'fas fa-utensils',
      count: 18,
      color: '#F97316'
    },
    {
      id: 'cat3',
      name: 'Bệnh thường gặp',
      slug: 'benh-thuong-gap',
      description: 'Thông tin về các bệnh thường gặp và cách phòng ngừa',
      icon: 'fas fa-stethoscope',
      count: 32,
      color: '#06B6D4'
    },
    {
      id: 'cat4',
      name: 'Thuốc và điều trị',
      slug: 'thuoc-va-dieu-tri',
      description: 'Cập nhật thông tin về thuốc và phương pháp điều trị mới',
      icon: 'fas fa-pills',
      count: 15,
      color: '#10b981'
    },
    {
      id: 'cat5',
      name: 'Sức khỏe tâm thần',
      slug: 'suc-khoe-tam-than',
      description: 'Chăm sóc sức khỏe tinh thần, giảm stress, cân bằng cuộc sống',
      icon: 'fas fa-brain',
      count: 12,
      color: '#8b5cf6'
    },
    {
      id: 'cat6',
      name: 'Tin tức y tế',
      slug: 'tin-tuc-y-te',
      description: 'Cập nhật tin tức y tế mới nhất trong và ngoài nước',
      icon: 'fas fa-newspaper',
      count: 28,
      color: '#ef4444'
    }
  ];

  // Mock data - Bài viết
  const mockArticles: NewsArticle[] = [
    {
      id: 'art1',
      title: '10 thực phẩm vàng cho người bệnh tim mạch',
      slug: '10-thuc-pham-vang-cho-nguoi-benh-tim-mach',
      excerpt: 'Chế độ dinh dưỡng đóng vai trò quan trọng trong việc kiểm soát và cải thiện sức khỏe tim mạch. Dưới đây là 10 loại thực phẩm được các chuyên gia khuyên dùng.',
      content: `
        <h2>1. Cá hồi và các loại cá béo</h2>
        <p>Cá hồi, cá thu, cá trích giàu omega-3, giúp giảm viêm và triglyceride trong máu. Omega-3 còn giúp điều hòa nhịp tim và giảm nguy cơ hình thành cục máu đông.</p>
        
        <h2>2. Yến mạch</h2>
        <p>Yến mạch chứa nhiều chất xơ hòa tan, giúp giảm cholesterol xấu LDL. Một bát yến mạch mỗi ngày có thể giảm nguy cơ mắc bệnh tim đến 20%.</p>
        
        <h2>3. Quả óc chó</h2>
        <p>Giàu axit béo không bão hòa, chất xơ và vitamin E, quả óc chó giúp bảo vệ thành mạch máu và giảm viêm.</p>
        
        <h2>4. Dầu ô liu</h2>
        <p>Dầu ô liu nguyên chất chứa nhiều chất chống oxy hóa, giúp giảm cholesterol xấu và tăng cholesterol tốt.</p>
        
        <h2>5. Quả mọng</h2>
        <p>Việt quất, dâu tây, mâm xôi giàu anthocyanin - chất chống oxy hóa mạnh, giúp giảm huyết áp và cải thiện chức năng mạch máu.</p>
        
        <h2>6. Rau lá xanh</h2>
        <p>Cải bó xôi, cải xoăn, rau muống giàu vitamin K, kali và magie, giúp điều hòa huyết áp và bảo vệ động mạch.</p>
        
        <h2>7. Đậu và các loại hạt</h2>
        <p>Đậu lăng, đậu xanh, đậu đen chứa nhiều chất xơ, protein thực vật và khoáng chất, giúp kiểm soát đường huyết và cholesterol.</p>
        
        <h2>8. Sô cô la đen</h2>
        <p>Sô cô la đen (trên 70% cacao) giàu flavonoid, giúp cải thiện lưu thông máu và giảm huyết áp.</p>
        
        <h2>9. Cà chua</h2>
        <p>Lycopene trong cà chua giúp giảm viêm và ngăn ngừa xơ vữa động mạch.</p>
        
        <h2>10. Trà xanh</h2>
        <p>Catechin trong trà xanh giúp giảm cholesterol và cải thiện chức năng nội mô mạch máu.</p>
        
        <p><strong>Lưu ý:</strong> Bên cạnh chế độ ăn uống lành mạnh, người bệnh tim mạch cần kết hợp với lối sống tích cực, tập thể dục đều đặn và tuân thủ điều trị của bác sĩ.</p>
      `,
      category: 'Dinh dưỡng',
      categoryId: 'cat2',
      author: 'TS.BS. Nguyễn Văn An',
      authorAvatar: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=100&h=100&fit=crop',
      publishedAt: '2024-12-20T08:30:00',
      imageUrl: 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=800&h=500&fit=crop',
      thumbnailUrl: 'https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=400&h=250&fit=crop',
      tags: ['tim mạch', 'dinh dưỡng', 'thực phẩm vàng', 'sức khỏe tim'],
      views: 1234,
      likes: 89,
      comments: 23,
      featured: true,
      trending: true,
      readingTime: 8,
      sources: ['WHO', 'American Heart Association'],
      relatedDoctors: [
        { id: 'doc1', name: 'TS.BS. Nguyễn Văn An', specialty: 'Tim mạch' },
        { id: 'doc2', name: 'PGS.TS. Trần Thị Bình', specialty: 'Dinh dưỡng' }
      ]
    },
    {
      id: 'art2',
      title: 'Cách nhận biết sớm dấu hiệu đột quỵ',
      slug: 'cach-nhan-biet-som-dau-hieu-dot-quy',
      excerpt: 'Đột quỵ là nguyên nhân hàng đầu gây tử vong và tàn tật. Nhận biết sớm các dấu hiệu có thể cứu sống người bệnh.',
      content: `
        <h2>Dấu hiệu F.A.S.T - Quy tắc vàng nhận biết đột quỵ</h2>
        
        <h3>F - Face (Khuôn mặt)</h3>
        <p>Yêu cầu người bệnh cười. Nếu một bên mặt bị méo, không cân xứng, đó là dấu hiệu của đột quỵ.</p>
        
        <h3>A - Arm (Cánh tay)</h3>
        <p>Yêu cầu người bệnh giơ hai tay lên. Nếu một tay bị yếu hoặc không thể giơ lên, đó là dấu hiệu nguy hiểm.</p>
        
        <h3>S - Speech (Lời nói)</h3>
        <p>Yêu cầu người bệnh nói một câu đơn giản. Nếu họ nói ngọng, khó nói hoặc không hiểu lời bạn, đó là dấu hiệu của đột quỵ.</p>
        
        <h3>T - Time (Thời gian)</h3>
        <p>Nếu xuất hiện bất kỳ dấu hiệu nào trên, hãy gọi cấp cứu ngay lập tức. Thời gian là vàng trong điều trị đột quỵ.</p>
        
        <h2>Các dấu hiệu khác cần lưu ý</h2>
        <ul>
          <li><strong>Đau đầu dữ dội:</strong> Đau đầu đột ngột, không rõ nguyên nhân</li>
          <li><strong>Chóng mặt:</strong> Mất thăng bằng, khó đi lại</li>
          <li><strong>Rối loạn thị giác:</strong> Mờ mắt, mất thị lực một bên</li>
          <li><strong>Tê liệt:</strong> Tê hoặc yếu một bên cơ thể</li>
        </ul>
        
        <h2>Xử trí khi gặp người bị đột quỵ</h2>
        <ol>
          <li>Gọi cấp cứu 115 ngay lập tức</li>
          <li>Đặt người bệnh nằm nghiêng, đầu cao</li>
          <li>Không cho ăn uống bất cứ thứ gì</li>
          <li>Ghi lại thời điểm khởi phát triệu chứng</li>
          <li>Nới lỏng quần áo, giữ ấm cho bệnh nhân</li>
          <li>Không tự ý cho uống thuốc hạ huyết áp</li>
        </ol>
        
        <p><strong>Lưu ý:</strong> Đột quỵ có thể xảy ra ở bất kỳ ai, bất kỳ lúc nào. Việc nhận biết sớm và xử trí kịp thời có thể cứu sống tính mạng và giảm thiểu di chứng.</p>
      `,
      category: 'Bệnh thường gặp',
      categoryId: 'cat3',
      author: 'ThS.BS. Trần Thị Bình',
      authorAvatar: 'https://images.unsplash.com/photo-1594824434340-7e7dfc37cabb?w=100&h=100&fit=crop',
      publishedAt: '2024-12-19T14:15:00',
      imageUrl: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800&h=500&fit=crop',
      thumbnailUrl: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=250&fit=crop',
      tags: ['đột quỵ', 'cấp cứu', 'dấu hiệu nhận biết', 'FAST'],
      views: 2567,
      likes: 156,
      comments: 45,
      featured: true,
      trending: true,
      readingTime: 5,
      sources: ['Bộ Y tế', 'Hội Đột quỵ Việt Nam']
    },
    {
      id: 'art3',
      title: 'Vitamin D - "Mặt trời" của sức khỏe xương',
      slug: 'vitamin-d-mat-troi-cua-suc-khoe-xuong',
      excerpt: 'Vitamin D đóng vai trò thiết yếu trong hấp thu canxi và duy trì sức khỏe xương. Tìm hiểu cách bổ sung vitamin D hiệu quả.',
      content: `
        <h2>Vai trò của vitamin D với cơ thể</h2>
        <p>Vitamin D là một vitamin tan trong dầu, có vai trò quan trọng trong:</p>
        <ul>
          <li>Hấp thu canxi và phospho ở ruột</li>
          <li>Hình thành và duy trì xương chắc khỏe</li>
          <li>Tăng cường hệ miễn dịch</li>
          <li>Điều hòa tế bào</li>
          <li>Giảm viêm</li>
        </ul>
        
        <h2>Nguồn cung cấp vitamin D</h2>
        
        <h3>1. Ánh nắng mặt trời</h3>
        <p>Da tổng hợp vitamin D khi tiếp xúc với ánh nắng. Nên tắm nắng 15-20 phút mỗi ngày vào buổi sáng (trước 9h).</p>
        
        <h3>2. Thực phẩm</h3>
        <ul>
          <li>Cá béo: cá hồi, cá thu, cá trích</li>
          <li>Lòng đỏ trứng</li>
          <li>Gan bò</li>
          <li>Sữa và các sản phẩm từ sữa</li>
          <li>Nấm</li>
        </ul>
        
        <h3>3. Thực phẩm chức năng</h3>
        <p>Viên uống bổ sung vitamin D được khuyên dùng cho người có nguy cơ thiếu hụt: người cao tuổi, phụ nữ mang thai, trẻ em, người ít tiếp xúc nắng.</p>
        
        <h2>Triệu chứng thiếu vitamin D</h2>
        <ul>
          <li>Đau nhức xương khớp</li>
          <li>Yếu cơ</li>
          <li>Mệt mỏi</li>
          <li>Dễ gãy xương</li>
          <li>Suy giảm miễn dịch</li>
        </ul>
        
        <h2>Liều lượng khuyến nghị</h2>
        <table>
          <tr>
            <th>Đối tượng</th>
            <th>Liều khuyến nghị (IU/ngày)</th>
          </tr>
          <tr>
            <td>Trẻ 0-12 tháng</td>
            <td>400</td>
          </tr>
          <tr>
            <td>Trẻ 1-18 tuổi</td>
            <td>600</td>
          </tr>
          <tr>
            <td>Người 19-70 tuổi</td>
            <td>600</td>
          </tr>
          <tr>
            <td>Người >70 tuổi</td>
            <td>800</td>
          </tr>
          <tr>
            <td>Phụ nữ mang thai</td>
            <td>600</td>
          </tr>
        </table>
      `,
      category: 'Sức khỏe tổng quát',
      categoryId: 'cat1',
      author: 'PGS.TS. Phạm Đức Dũng',
      authorAvatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=100&h=100&fit=crop',
      publishedAt: '2024-12-18T11:45:00',
      imageUrl: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800&h=500&fit=crop',
      thumbnailUrl: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&h=250&fit=crop',
      tags: ['vitamin D', 'sức khỏe xương', 'bổ sung vitamin', 'dinh dưỡng'],
      views: 1890,
      likes: 112,
      comments: 28,
      featured: false,
      trending: true,
      readingTime: 6
    },
    {
      id: 'art4',
      title: 'Cập nhật phác đồ điều trị COVID-19 mới nhất',
      slug: 'cap-nhat-phac-do-dieu-tri-covid-19-moi-nhat',
      excerpt: 'Bộ Y tế vừa ban hành phác đồ điều trị COVID-19 cập nhật với nhiều điểm mới trong chẩn đoán và điều trị.',
      content: `
        <h2>Những điểm mới trong phác đồ điều trị</h2>
        
        <h3>1. Phân loại mức độ bệnh</h3>
        <ul>
          <li><strong>Mức độ nhẹ:</strong> Không có dấu hiệu viêm phổi</li>
          <li><strong>Mức độ trung bình:</strong> Có dấu hiệu viêm phổi nhưng không suy hô hấp</li>
          <li><strong>Mức độ nặng:</strong> Viêm phổi nặng, suy hô hấp</li>
          <li><strong>Mức độ nguy kịch:</strong> Suy hô hấp nặng, sốc nhiễm trùng</li>
        </ul>
        
        <h3>2. Thuốc kháng virus</h3>
        <p>Paxlovid (nirmatrelvir + ritonavir) được khuyến cáo sử dụng sớm trong vòng 5 ngày đầu cho bệnh nhân có nguy cơ cao.</p>
        
        <h3>3. Kháng viêm</h3>
        <p>Corticoid được chỉ định cho bệnh nhân viêm phổi nặng có chỉ định oxy hỗ trợ.</p>
        
        <h3>4. Kháng đông</h3>
        <p>Heparin trọng lượng phân tử thấp được sử dụng để dự phòng và điều trị huyết khối.</p>
        
        <h2>Hướng dẫn chăm sóc tại nhà</h2>
        <ol>
          <li>Theo dõi SpO2 hàng ngày, nếu dưới 95% cần báo ngay cho nhân viên y tế</li>
          <li>Uống đủ nước, dinh dưỡng hợp lý</li>
          <li>Vận động nhẹ nhàng, tránh nằm nhiều</li>
          <li>Uống thuốc theo đúng chỉ định</li>
          <li>Cách ly tuyệt đối với người thân</li>
        </ol>
      `,
      category: 'Tin tức y tế',
      categoryId: 'cat6',
      author: 'BS. Lê Minh Châu',
      authorAvatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=100&h=100&fit=crop',
      publishedAt: '2024-12-17T09:30:00',
      imageUrl: 'https://images.unsplash.com/photo-1584036561566-baf8f5f1b144?w=800&h=500&fit=crop',
      thumbnailUrl: 'https://images.unsplash.com/photo-1584036561566-baf8f5f1b144?w=400&h=250&fit=crop',
      tags: ['COVID-19', 'phác đồ điều trị', 'Bộ Y tế', 'cập nhật y tế'],
      views: 3456,
      likes: 234,
      comments: 67,
      featured: true,
      trending: true,
      readingTime: 7,
      sources: ['Bộ Y tế', 'WHO']
    },
    {
      id: 'art5',
      title: '7 cách giảm stress hiệu quả tại nhà',
      slug: '7-cach-giam-stress-hieu-qua-tai-nha',
      excerpt: 'Stress kéo dài ảnh hưởng nghiêm trọng đến sức khỏe thể chất và tinh thần. Áp dụng ngay 7 cách đơn giản để xua tan căng thẳng.',
      content: `
        <h2>1. Tập thở sâu</h2>
        <p>Kỹ thuật thở 4-7-8: Hít vào 4 giây, giữ 7 giây, thở ra 8 giây. Lặp lại 5 lần giúp làm dịu hệ thần kinh.</p>
        
        <h2>2. Thiền định</h2>
        <p>Dành 10-15 phút mỗi ngày để ngồi thiền, tập trung vào hơi thở. Thiền giúp giảm cortisol - hormone gây stress.</p>
        
        <h2>3. Tập thể dục</h2>
        <p>Vận động 30 phút mỗi ngày giải phóng endorphin, cải thiện tâm trạng và giấc ngủ.</p>
        
        <h2>4. Nghe nhạc</h2>
        <p>Nhạc cổ điển hoặc nhạc không lời có tác dụng thư giãn, giảm huyết áp và nhịp tim.</p>
        
        <h2>5. Viết nhật ký</h2>
        <p>Ghi lại những suy nghĩ, cảm xúc giúp giải tỏa tâm lý và nhìn nhận vấn đề rõ ràng hơn.</p>
        
        <h2>6. Kết nối với người thân</h2>
        <p>Chia sẻ với gia đình, bạn bè về những lo lắng giúp bạn cảm thấy được hỗ trợ và thấu hiểu.</p>
        
        <h2>7. Làm vườn</h2>
        <p>Tiếp xúc với thiên nhiên, chăm sóc cây cối có tác dụng trị liệu tinh thần tuyệt vời.</p>
      `,
      category: 'Sức khỏe tâm thần',
      categoryId: 'cat5',
      author: 'ThS. Tâm lý Nguyễn Thị Hương',
      authorAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop',
      publishedAt: '2024-12-16T16:20:00',
      imageUrl: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&h=500&fit=crop',
      thumbnailUrl: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400&h=250&fit=crop',
      tags: ['stress', 'sức khỏe tâm thần', 'giảm căng thẳng', 'thư giãn'],
      views: 2345,
      likes: 178,
      comments: 34,
      featured: false,
      trending: false,
      readingTime: 4
    },
    {
      id: 'art6',
      title: 'Thuốc kháng sinh: Sử dụng đúng cách để tránh kháng thuốc',
      slug: 'thuoc-khang-sinh-su-dung-dung-cach',
      excerpt: 'Kháng kháng sinh đang là vấn đề y tế toàn cầu. Tìm hiểu cách sử dụng kháng sinh an toàn và hiệu quả.',
      content: `
        <h2>Nguy cơ kháng kháng sinh</h2>
        <p>Kháng kháng sinh xảy ra khi vi khuẩn thay đổi để chống lại thuốc. Hậu quả:</p>
        <ul>
          <li>Điều trị khó khăn, kéo dài</li>
          <li>Tăng nguy cơ biến chứng</li>
          <li>Chi phí điều trị cao hơn</li>
          <li>Tử vong cao hơn</li>
        </ul>
        
        <h2>Nguyên nhân chính</h2>
        <ul>
          <li>Lạm dụng kháng sinh không cần thiết</li>
          <li>Không tuân thủ liệu trình điều trị</li>
          <li>Tự ý mua thuốc không đơn</li>
          <li>Sử dụng kháng sinh trong chăn nuôi</li>
        </ul>
        
        <h2>Nguyên tắc sử dụng kháng sinh an toàn</h2>
        <ol>
          <li>Chỉ dùng khi có chỉ định của bác sĩ</li>
          <li>Mua thuốc theo đơn, không tự ý mua</li>
          <li>Uống đúng liều, đúng giờ</li>
          <li>Hoàn thành liệu trình, không bỏ dở</li>
          <li>Không dùng lại đơn cũ cho lần sau</li>
          <li>Không chia sẻ thuốc với người khác</li>
          <li>Báo cho bác sĩ nếu có tác dụng phụ</li>
        </ol>
      `,
      category: 'Thuốc và điều trị',
      categoryId: 'cat4',
      author: 'DS. Phạm Thị Lan',
      authorAvatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=100&h=100&fit=crop',
      publishedAt: '2024-12-15T10:45:00',
      imageUrl: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=800&h=500&fit=crop',
      thumbnailUrl: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=400&h=250&fit=crop',
      tags: ['kháng sinh', 'kháng kháng sinh', 'thuốc', 'sử dụng thuốc'],
      views: 1678,
      likes: 98,
      comments: 21,
      featured: true,
      trending: false,
      readingTime: 5
    }
  ];

  // Mock comments
  const mockComments: NewsComment[] = [
    {
      id: 'com1',
      articleId: 'art1',
      userName: 'Nguyễn Thị Mai',
      userAvatar: 'https://images.unsplash.com/photo-1494790108777-766fd1f4f856?w=50&h=50&fit=crop',
      content: 'Bài viết rất hữu ích! Tôi đã thêm yến mạch vào bữa sáng và thấy sức khỏe cải thiện rõ rệt.',
      createdAt: '2024-12-21T09:30:00',
      likes: 12,
      replies: [
        {
          id: 'com1-rep1',
          articleId: 'art1',
          userName: 'BS. Nguyễn Văn An',
          userAvatar: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=50&h=50&fit=crop',
          content: 'Cảm ơn bạn đã chia sẻ. Yến mạch thực sự rất tốt cho sức khỏe tim mạch.',
          createdAt: '2024-12-21T10:15:00',
          likes: 5
        }
      ]
    },
    {
      id: 'com2',
      articleId: 'art1',
      userName: 'Trần Văn Nam',
      userAvatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=50&h=50&fit=crop',
      content: 'Có thể ăn sô cô la đen mỗi ngày không bác sĩ?',
      createdAt: '2024-12-21T14:20:00',
      likes: 3
    }
  ];

  // Load data
  useEffect(() => {
    setCategories(mockCategories);
    setArticles(mockArticles);
    setComments(mockComments);
    setFilteredArticles(mockArticles);
    setLoading(false);
  }, []);

  // Load article by slug
  useEffect(() => {
    if (slug) {
      const article = articles.find(a => a.slug === slug);
      if (article) {
        setSelectedArticle(article);
        setShowDetailModal(true);
        
        // Find related articles
        const related = articles
          .filter(a => 
            a.id !== article.id && 
            (a.category === article.category || 
             a.tags.some(tag => article.tags.includes(tag)))
          )
          .slice(0, 3);
        setRelatedArticles(related);
      }
    }
  }, [slug, articles]);

  // Apply filters and search
  useEffect(() => {
    let filtered = [...articles];

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(a => a.categoryId === selectedCategory);
    }

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(a =>
        a.title.toLowerCase().includes(query) ||
        a.excerpt.toLowerCase().includes(query) ||
        a.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Sort
    switch (sortBy) {
      case 'latest':
        filtered.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
        break;
      case 'popular':
        filtered.sort((a, b) => b.views - a.views);
        break;
      case 'trending':
        filtered.sort((a, b) => (b.trending ? 1 : 0) - (a.trending ? 1 : 0));
        break;
    }

    setFilteredArticles(filtered);
    setCurrentPage(1);
  }, [articles, selectedCategory, searchQuery, sortBy]);

  // Pagination
  const indexOfLastArticle = currentPage * articlesPerPage;
  const indexOfFirstArticle = indexOfLastArticle - articlesPerPage;
  const currentArticles = filteredArticles.slice(indexOfFirstArticle, indexOfLastArticle);
  const totalPages = Math.ceil(filteredArticles.length / articlesPerPage);

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
  const handleArticleClick = (article: NewsArticle) => {
    setSelectedArticle(article);
    setShowDetailModal(true);
    navigate(`/news/${article.slug}`, { replace: true });

    // Find related articles
    const related = articles
      .filter(a => 
        a.id !== article.id && 
        (a.category === article.category || 
         a.tags.some(tag => article.tags.includes(tag)))
      )
      .slice(0, 3);
    setRelatedArticles(related);
  };

  // Handle close modal
  const handleCloseModal = () => {
    setShowDetailModal(false);
    setSelectedArticle(null);
    navigate('/news', { replace: true });
  };

  // Render article card (grid view)
  const renderGridCard = (article: NewsArticle) => (
    <div key={article.id} className="article-card" onClick={() => handleArticleClick(article)}>
      <div className="article-image">
        <img src={article.imageUrl} alt={article.title} />
        {article.featured && <span className="featured-badge">Nổi bật</span>}
        {article.trending && <span className="trending-badge">Xu hướng</span>}
      </div>
      <div className="article-content">
        <div className="article-meta">
          <span className="article-category" style={{ backgroundColor: categories.find(c => c.id === article.categoryId)?.color + '20', color: categories.find(c => c.id === article.categoryId)?.color }}>
            <i className={categories.find(c => c.id === article.categoryId)?.icon}></i>
            {article.category}
          </span>
          <span className="article-date">
            <i className="far fa-calendar-alt"></i>
            {formatDate(article.publishedAt)}
          </span>
        </div>
        <h3 className="article-title">{article.title}</h3>
        <p className="article-excerpt">{article.excerpt}</p>
        <div className="article-footer">
          <div className="article-author">
            <img src={article.authorAvatar} alt={article.author} />
            <span>{article.author}</span>
          </div>
          <div className="article-stats">
            <span><i className="far fa-eye"></i> {article.views}</span>
            <span><i className="far fa-heart"></i> {article.likes}</span>
            <span><i className="far fa-comment"></i> {article.comments}</span>
            <span className="reading-time">
              <i className="far fa-clock"></i> {article.readingTime} phút
            </span>
          </div>
        </div>
      </div>
    </div>
  );

  // Render article card (list view)
  const renderListCard = (article: NewsArticle) => (
    <div key={article.id} className="article-card list-view" onClick={() => handleArticleClick(article)}>
      <div className="article-image">
        <img src={article.thumbnailUrl} alt={article.title} />
        {article.featured && <span className="featured-badge">Nổi bật</span>}
      </div>
      <div className="article-content">
        <div className="article-meta">
          <span className="article-category" style={{ backgroundColor: categories.find(c => c.id === article.categoryId)?.color + '20', color: categories.find(c => c.id === article.categoryId)?.color }}>
            <i className={categories.find(c => c.id === article.categoryId)?.icon}></i>
            {article.category}
          </span>
          <span className="article-date">
            <i className="far fa-calendar-alt"></i>
            {formatDate(article.publishedAt)}
          </span>
        </div>
        <h3 className="article-title">{article.title}</h3>
        <p className="article-excerpt">{article.excerpt}</p>
        <div className="article-tags">
          {article.tags.slice(0, 3).map(tag => (
            <span key={tag} className="article-tag">#{tag}</span>
          ))}
        </div>
        <div className="article-footer">
          <div className="article-author">
            <img src={article.authorAvatar} alt={article.author} />
            <span>{article.author}</span>
          </div>
          <div className="article-stats">
            <span><i className="far fa-eye"></i> {article.views}</span>
            <span><i className="far fa-heart"></i> {article.likes}</span>
            <span className="reading-time">
              <i className="far fa-clock"></i> {article.readingTime} phút
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
              <img src={selectedArticle.imageUrl} alt={selectedArticle.title} className="detail-image" />
              <div className="detail-overlay">
                <div className="detail-categories">
                  <span className="detail-category" style={{ backgroundColor: categories.find(c => c.id === selectedArticle.categoryId)?.color }}>
                    <i className={categories.find(c => c.id === selectedArticle.categoryId)?.icon}></i>
                    {selectedArticle.category}
                  </span>
                  {selectedArticle.trending && (
                    <span className="detail-trending">
                      <i className="fas fa-fire"></i> Xu hướng
                    </span>
                  )}
                </div>
                <h1 className="detail-title">{selectedArticle.title}</h1>
                <div className="detail-meta">
                  <div className="detail-author">
                    <img src={selectedArticle.authorAvatar} alt={selectedArticle.author} />
                    <div>
                      <span className="author-name">{selectedArticle.author}</span>
                      <span className="publish-date">
                        <i className="far fa-calendar-alt"></i>
                        {new Date(selectedArticle.publishedAt).toLocaleDateString('vi-VN')}
                      </span>
                    </div>
                  </div>
                  <div className="detail-stats">
                    <span><i className="far fa-eye"></i> {selectedArticle.views} lượt xem</span>
                    <span><i className="far fa-heart"></i> {selectedArticle.likes}</span>
                    <span><i className="far fa-clock"></i> {selectedArticle.readingTime} phút đọc</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="article-detail-body">
              <div className="article-content" dangerouslySetInnerHTML={{ __html: selectedArticle.content }} />

              {selectedArticle.sources && (
                <div className="article-sources">
                  <h4>Nguồn tham khảo:</h4>
                  <ul>
                    {selectedArticle.sources.map((source, index) => (
                      <li key={index}>{source}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="article-tags">
                {selectedArticle.tags.map(tag => (
                  <span key={tag} className="article-tag">#{tag}</span>
                ))}
              </div>

              <div className="article-share">
                <span>Chia sẻ bài viết:</span>
                <button className="share-btn facebook">
                  <i className="fab fa-facebook-f"></i>
                </button>
                <button className="share-btn twitter">
                  <i className="fab fa-twitter"></i>
                </button>
                <button className="share-btn linkedin">
                  <i className="fab fa-linkedin-in"></i>
                </button>
                <button className="share-btn copy" onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  alert('Đã sao chép liên kết!');
                }}>
                  <i className="fas fa-link"></i>
                </button>
              </div>

              {selectedArticle.relatedDoctors && (
                <div className="related-doctors">
                  <h4>Bác sĩ tư vấn:</h4>
                  <div className="doctors-list">
                    {selectedArticle.relatedDoctors.map(doctor => (
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
              )}

              {/* Comments Section */}
              <div className="article-comments">
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
                          
                          {comment.replies && comment.replies.map(reply => (
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
              </div>
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
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Categories */}
        <div className="news-categories">
          <button
            className={`category-btn ${selectedCategory === 'all' ? 'active' : ''}`}
            onClick={() => setSelectedCategory('all')}
          >
            <i className="fas fa-th-large"></i>
            Tất cả
          </button>
          {categories.map(category => (
            <button
              key={category.id}
              className={`category-btn ${selectedCategory === category.id ? 'active' : ''}`}
              onClick={() => setSelectedCategory(category.id)}
              style={{ '--category-color': category.color } as React.CSSProperties}
            >
              <i className={category.icon}></i>
              {category.name}
            </button>
          ))}
        </div>

        {/* Controls */}
        <div className="news-controls">
          <div className="results-info">
            <span>Hiển thị {filteredArticles.length} bài viết</span>
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

            <div className="view-controls">
              <button
                className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                onClick={() => setViewMode('grid')}
              >
                <i className="fas fa-th-large"></i>
              </button>
              <button
                className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
                onClick={() => setViewMode('list')}
              >
                <i className="fas fa-list"></i>
              </button>
            </div>
          </div>
        </div>

        {/* Articles Grid/List */}
        {loading ? (
          <div className="loading-state">
            <i className="fas fa-spinner fa-spin"></i>
            <p>Đang tải bài viết...</p>
          </div>
        ) : filteredArticles.length > 0 ? (
          <>
            <div className={`articles-container ${viewMode}`}>
              {currentArticles.map(article => 
                viewMode === 'grid' ? renderGridCard(article) : renderListCard(article)
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
              setSearchQuery('');
              setSelectedCategory('all');
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
          <div className="doctors-scroll">
            {Array.from(new Set(articles.map(a => a.author))).map(author => {
              const article = articles.find(a => a.author === author);
              return (
                <div key={author} className="doctor-feature-card">
                  <img src={article?.authorAvatar} alt={author} />
                  <h4>{author}</h4>
                  <p>{article?.category}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Article Detail Modal */}
      {showDetailModal && renderDetailModal()}
    </div>
  );
};

export default News;