import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { Footer } from '../components/Footer/Footer';
import { CaregiverDetailModal } from '../components/Modal/CaregiverDetailModal';
import { getCaregivers } from '../services/caregiverService';
import { Caregiver } from '../types';
import toast from 'react-hot-toast';
import {
  Heart,
  MapPin,
  Calendar,
  Search,
  ArrowRight,
  Clock,
  Home,
  Baby,
  Plus,
  Users,
  FileCheck2,
  FileText,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';
import './HomePage.css';

// Default mock caregivers matching exact names and roles from the user's design image
const SCREENSHOT_DEFAULT_CAREGIVERS: Caregiver[] = [
  {
    id: 'cg-mai-01',
    name: 'Nguyễn Thị Mai',
    title: 'Điều dưỡng viên',
    experienceYears: 5,
    rating: 5.0,
    reviewCount: 38,
    hourlyRate: 150000,
    pricing: {
      hourlyRate: 150000,
      dailyRate: 900000,
      weeklyRate: 5400000,
      monthlyRate: 21000000,
    },
    avatar: 'https://images.unsplash.com/photo-1594824813583-0599a0937a34?auto=format&fit=crop&w=400&q=80',
    bio: 'Tận tâm, chu đáo và kiên nhẫn. Tôi có 5 năm kinh nghiệm điều dưỡng chuyên khoa, hỗ trợ phục hồi sức khỏe và chăm sóc bệnh nhân tại nhà.',
    skills: ['Đo sinh hiệu', 'Hỗ trợ ăn uống qua ống', 'Vật lý trị liệu nhẹ', 'Vệ sinh chuyên khoa'],
    certifications: ['Chứng chỉ Điều dưỡng đa khoa', 'Chứng chỉ Sơ cấp cứu hồi sức'],
    serviceCategoryIds: ['post-treatment-care', 'elderly-care'],
    location: 'TP. Hồ Chí Minh',
    isAvailable: true,
  },
  {
    id: 'cg-minh-02',
    name: 'Trần Văn Minh',
    title: 'Chăm sóc người cao tuổi',
    experienceYears: 7,
    rating: 4.9,
    reviewCount: 52,
    hourlyRate: 140000,
    pricing: {
      hourlyRate: 140000,
      dailyRate: 850000,
      weeklyRate: 5100000,
      monthlyRate: 19500000,
    },
    avatar: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=400&q=80',
    bio: 'Nhiều năm gắn bó với công việc chăm sóc người cao tuổi, có kinh nghiệm xử lý các bệnh lý lão khoa (tai biến, đãng trí, hỗ trợ vận động).',
    skills: ['Trò chuyện tâm lý', 'Nấu ăn dinh dưỡng người già', 'Hỗ trợ tắm rửa an toàn', 'Xoa bóp bấm huyệt'],
    certifications: ['Chứng chỉ Chăm sóc Lão khoa', 'Kỹ thuật viên xoa bóp dưỡng sinh'],
    serviceCategoryIds: ['elderly-care', 'home-care'],
    location: 'TP. Hồ Chí Minh',
    isAvailable: true,
  },
  {
    id: 'cg-huong-03',
    name: 'Lê Thị Hương',
    title: 'Chăm sóc trẻ em',
    experienceYears: 4,
    rating: 5.0,
    reviewCount: 29,
    hourlyRate: 130000,
    pricing: {
      hourlyRate: 130000,
      dailyRate: 800000,
      weeklyRate: 4800000,
      monthlyRate: 18000000,
    },
    avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=400&q=80',
    bio: 'Yêu trẻ, kiên nhẫn và cẩn trọng. Có chuyên môn mầm non và chăm sóc trẻ sơ sinh, đồng hành giúp cha mẹ an tâm trong công việc.',
    skills: ['Tắm bé sơ sinh', 'Rèn nếp sinh hoạt EASY', 'Chế biến ăn dặm', 'Sơ cứu hóc sặc trẻ em'],
    certifications: ['Cử nhân Giáo dục mầm non', 'Chứng chỉ Chăm sóc Trẻ sơ sinh quốc tế'],
    serviceCategoryIds: ['child-care', 'home-care'],
    location: 'TP. Hồ Chí Minh',
    isAvailable: true,
  },
];

export const HomePage: React.FC = () => {
  const navigate = useNavigate();

  // Search states
  const [selectedService, setSelectedService] = useState('all');
  const [selectedLocation, setSelectedLocation] = useState('TP. Hồ Chí Minh');
  const [selectedTime, setSelectedTime] = useState('all');

  // Caregiver states
  const [selectedCaregiver, setSelectedCaregiver] = useState<Caregiver | null>(null);
  const [featuredCaregivers, setFeaturedCaregivers] = useState<Caregiver[]>(SCREENSHOT_DEFAULT_CAREGIVERS);
  const [loadingCaregivers, setLoadingCaregivers] = useState(false);

  // Load real caregivers if available
  useEffect(() => {
    let active = true;

    const loadCaregivers = async () => {
      try {
        setLoadingCaregivers(true);
        const result = await getCaregivers({
          page: 1,
          limit: 3,
          sortBy: 'ratingAvg',
          order: 'desc',
        });
        if (active && result?.caregivers && result.caregivers.length >= 3) {
          setFeaturedCaregivers(result.caregivers.slice(0, 3));
        }
      } catch (err) {
        // Fallback to the screenshot default caregivers gracefully
        console.warn('Using default featured caregivers:', err);
      } finally {
        if (active) setLoadingCaregivers(false);
      }
    };

    void loadCaregivers();
    return () => {
      active = false;
    };
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (selectedService !== 'all') params.append('service', selectedService);
    if (selectedLocation) params.append('area', selectedLocation);
    if (selectedTime !== 'all') params.append('time', selectedTime);

    navigate(`/caregivers?${params.toString()}`);
  };

  const handleSelectCategory = (categoryId: string) => {
    navigate(`/caregivers?service=${categoryId}`);
  };

  return (
    <div className="home-page-container">
      {/* 1. Header Navigation */}
      <Navbar />

      {/* 2. Sleek Top Hero Header */}
      <header className="home-hero-header">
        <div className="home-hero-header-inner">
          <div className="home-hero-pill-badge">
            <Heart size={14} className="text-blue-600" />
            <span>NỀN TẢNG KẾT NỐI NGƯỜI CHĂM SÓC UY TÍN #1</span>
          </div>
          <h1 className="home-hero-headline">
            Chăm sóc tận tâm, <span>kết nối an tâm</span> cho gia đình bạn
          </h1>
          <p className="home-hero-desc">
            Tìm kiếm và đặt lịch người chăm sóc người cao tuổi, trẻ nhỏ, bệnh nhân chuyên nghiệp, minh bạch điểm uy tín.
          </p>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="home-content-wrapper">
        {/* 3. Floating Search / Filter Bar */}
        <section className="floating-search-bar-container" aria-label="Bộ lọc tìm kiếm nhanh">
          <form onSubmit={handleSearchSubmit} className="floating-search-bar">
            {/* Field 1: Loại chăm sóc */}
            <div className="search-field-item">
              <div className="search-field-icon">
                <Heart size={18} fill="#2563eb" color="#2563eb" />
              </div>
              <div className="search-field-texts">
                <span className="search-field-label">Loại chăm sóc</span>
                <select
                  aria-label="Chọn loại chăm sóc"
                  className="search-field-select"
                  value={selectedService}
                  onChange={(e) => setSelectedService(e.target.value)}
                >
                  <option value="all">Tất cả dịch vụ</option>
                  <option value="elderly-care">Chăm sóc người cao tuổi</option>
                  <option value="child-care">Chăm sóc trẻ em</option>
                  <option value="home-care">Chăm sóc tại nhà</option>
                  <option value="post-treatment-care">Chăm sóc sau điều trị</option>
                </select>
              </div>
            </div>

            <div className="search-divider" />

            {/* Field 2: Địa điểm */}
            <div className="search-field-item">
              <div className="search-field-icon">
                <MapPin size={18} />
              </div>
              <div className="search-field-texts">
                <span className="search-field-label">Địa điểm</span>
                <select
                  aria-label="Chọn địa điểm"
                  className="search-field-select"
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                >
                  <option value="TP. Hồ Chí Minh">TP. Hồ Chí Minh</option>
                  <option value="Cần Thơ">Cần Thơ</option>
                  <option value="Hà Nội">Hà Nội</option>
                  <option value="Đà Nẵng">Đà Nẵng</option>
                </select>
              </div>
            </div>

            <div className="search-divider" />

            {/* Field 3: Thời gian */}
            <div className="search-field-item">
              <div className="search-field-icon">
                <Calendar size={18} />
              </div>
              <div className="search-field-texts">
                <span className="search-field-label">Thời gian</span>
                <select
                  aria-label="Chọn thời gian"
                  className="search-field-select"
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                >
                  <option value="all">Chọn thời gian</option>
                  <option value="hourly">Theo ca giờ</option>
                  <option value="daily">Theo ngày (24h)</option>
                  <option value="weekly">Theo tuần</option>
                  <option value="monthly">Theo tháng</option>
                </select>
              </div>
            </div>

            {/* Submit Button */}
            <button type="submit" className="search-submit-btn">
              <Search size={17} />
              <span>Tìm kiếm</span>
            </button>
          </form>
        </section>

        {/* 4. Section: Danh mục dịch vụ */}
        <section className="home-section" aria-label="Danh mục dịch vụ">
          <div className="home-section-header">
            <h2 className="home-section-title">Danh mục dịch vụ</h2>
            <Link to="/services" className="home-section-link">
              <span>Xem tất cả</span>
              <ArrowRight size={16} />
            </Link>
          </div>

          <div className="services-category-grid">
            {/* Card 1: Chăm sóc người cao tuổi */}
            <div
              className="service-cat-card"
              onClick={() => handleSelectCategory('elderly-care')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && handleSelectCategory('elderly-care')}
            >
              <div className="service-cat-icon-wrapper" style={{ backgroundColor: '#e0f2fe' }}>
                <span style={{ fontSize: '28px', lineHeight: 1 }}>👵👴</span>
              </div>
              <h3 className="service-cat-title">
                Chăm sóc <br /> người cao tuổi
              </h3>
            </div>

            {/* Card 2: Chăm sóc trẻ em */}
            <div
              className="service-cat-card"
              onClick={() => handleSelectCategory('child-care')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && handleSelectCategory('child-care')}
            >
              <div className="service-cat-icon-wrapper" style={{ backgroundColor: '#fef3c7' }}>
                <span style={{ fontSize: '28px', lineHeight: 1 }}>👶</span>
              </div>
              <h3 className="service-cat-title">Chăm sóc trẻ em</h3>
            </div>

            {/* Card 3: Chăm sóc tại nhà */}
            <div
              className="service-cat-card"
              onClick={() => handleSelectCategory('home-care')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && handleSelectCategory('home-care')}
            >
              <div className="service-cat-icon-wrapper" style={{ backgroundColor: '#e0f2fe', color: '#2563eb' }}>
                <Home size={30} fill="#2563eb" color="#2563eb" />
              </div>
              <h3 className="service-cat-title">Chăm sóc tại nhà</h3>
            </div>

            {/* Card 4: Chăm sóc sau điều trị */}
            <div
              className="service-cat-card"
              onClick={() => handleSelectCategory('post-treatment-care')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && handleSelectCategory('post-treatment-care')}
            >
              <div className="service-cat-icon-wrapper" style={{ backgroundColor: '#e0f2fe', color: '#0284c7' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    backgroundColor: '#0284c7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#ffffff',
                  }}
                >
                  <Plus size={22} strokeWidth={3} />
                </div>
              </div>
              <h3 className="service-cat-title">Chăm sóc sau điều trị</h3>
            </div>
          </div>
        </section>

        {/* 5. Section: Người chăm sóc nổi bật */}
        <section className="home-section" aria-label="Người chăm sóc nổi bật">
          <div className="home-section-header">
            <h2 className="home-section-title">Người chăm sóc nổi bật</h2>
            <Link to="/caregivers" className="home-section-link">
              <span>Xem tất cả</span>
              <ArrowRight size={16} />
            </Link>
          </div>

          <div className="featured-caregivers-grid">
            {featuredCaregivers.map((cg) => (
              <div key={cg.id} className="caregiver-custom-card">
                <div className="caregiver-card-top">
                  <img
                    src={cg.avatar}
                    alt={cg.name}
                    className="caregiver-avatar-round"
                  />
                  <div className="caregiver-info-box">
                    <h3 className="caregiver-card-name">{cg.name}</h3>
                    <p className="caregiver-card-role">{cg.title}</p>
                    <div className="caregiver-card-exp">
                      <Clock size={13} className="text-slate-400" />
                      <span>Kinh nghiệm: {cg.experienceYears} năm</span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  className="caregiver-detail-pill-btn"
                  onClick={() => setSelectedCaregiver(cg)}
                >
                  <span>Xem chi tiết</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* 6. Section: Call to action banner "Đăng yêu cầu chăm sóc ngay" */}
        <section className="post-request-banner" aria-label="Đăng yêu cầu">
          <div className="post-request-left">
            <div className="post-request-icon-box">
              <FileCheck2 size={26} />
            </div>
            <div>
              <h3 className="post-request-title">Đăng yêu cầu chăm sóc ngay</h3>
              <p className="post-request-subtitle">
                Mô tả nhu cầu của bạn, chúng tôi sẽ giúp bạn tìm người phù hợp nhất!
              </p>
            </div>
          </div>

          <Link to="/caregivers" className="post-request-btn">
            <span>Đăng yêu cầu</span>
            <ArrowRight size={15} />
          </Link>
        </section>

        {/* 7. Section: Quy trình sử dụng CareLink */}
        <section className="workflow-section" aria-label="Quy trình sử dụng">
          <div className="home-section-header">
            <h2 className="home-section-title">Quy trình sử dụng CareLink</h2>
            <Link to="/about" className="home-section-link">
              <span>Tìm hiểu thêm</span>
              <ArrowRight size={16} />
            </Link>
          </div>

          <div className="workflow-steps-box">
            {/* Step 1 */}
            <div className="workflow-step-item">
              <div className="workflow-step-icon">
                <FileText size={24} />
              </div>
              <h4 className="workflow-step-title">1. Đăng yêu cầu</h4>
              <p className="workflow-step-desc">Mô tả nhu cầu chăm sóc</p>
            </div>

            {/* Arrow Divider */}
            <div className="workflow-arrow-divider" aria-hidden="true">
              <ChevronRight size={22} />
            </div>

            {/* Step 2 */}
            <div className="workflow-step-item">
              <div className="workflow-step-icon">
                <Users size={24} />
              </div>
              <h4 className="workflow-step-title">2. Caregiver tiếp nhận</h4>
              <p className="workflow-step-desc">Xem và phản hồi</p>
            </div>

            {/* Arrow Divider */}
            <div className="workflow-arrow-divider" aria-hidden="true">
              <ChevronRight size={22} />
            </div>

            {/* Step 3 */}
            <div className="workflow-step-item">
              <div className="workflow-step-icon">
                <ShieldCheck size={24} />
              </div>
              <h4 className="workflow-step-title">3. Xác nhận dịch vụ</h4>
              <p className="workflow-step-desc">Bắt đầu chăm sóc</p>
            </div>
          </div>
        </section>
      </main>

      {/* 8. Footer */}
      <Footer />

      {/* 9. Caregiver Detail Modal for direct booking */}
      <CaregiverDetailModal
        caregiver={selectedCaregiver}
        onClose={() => setSelectedCaregiver(null)}
      />
    </div>
  );
};

export default HomePage;
