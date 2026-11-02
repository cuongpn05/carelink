import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { Footer } from '../components/Footer/Footer';
import { CaregiverDetailModal } from '../components/Modal/CaregiverDetailModal';
import { PostCareRequestModal } from '../components/PostCareRequestModal';
import { RatingStars } from '../components/common';
import { getCaregivers } from '../services/caregiverService';
import { Caregiver } from '../types';
import heroBg from '../assets/hero-bg.png';
import homeCareImg from '../assets/services/home-care.jpg';
import elderlyCareImg from '../assets/services/elderly-care.jpg';
import postTreatmentCareImg from '../assets/services/post-treatment-care.jpg';
import childCareImg from '../assets/services/child-care.jpg';
import {
  ArrowRight,
  Clock,
  Home,
  Users,
  CheckCircle2,
  ChevronDown,
  Baby,
  HeartHandshake,
  Activity,
  Pencil,
  Check,
  Search,
  MapPin,
} from 'lucide-react';
import './HomePage.css';

// Default mock caregivers matching exact names and roles from the verified caregiver catalog
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

interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

const FAQ_ITEMS: FaqItem[] = [
  {
    id: 'faq-1',
    question: 'Tôi có thể chọn người chăm sóc không?',
    answer:
      'Có. Bạn hoàn toàn có thể chủ động xem xét hồ sơ, kinh nghiệm, kỹ năng và đánh giá của từng caregiver để chọn người phù hợp nhất, hoặc đăng yêu cầu để CareLink kết nối caregiver phù hợp với nhu cầu của bạn.',
  },
  {
    id: 'faq-2',
    question: 'Tôi có thể thay đổi lịch chăm sóc không?',
    answer:
      'Có. Bạn có thể linh hoạt điều chỉnh ngày, khung giờ hoặc hủy lịch hẹn trước thời gian bắt đầu ca chăm sóc thông qua mục Quản lý yêu cầu hoặc trao đổi trực tiếp với người chăm sóc.',
  },
  {
    id: 'faq-3',
    question: 'Chi phí chăm sóc được tính như thế nào?',
    answer:
      'Chi phí được tính minh bạch theo giờ (từ 90.000đ - 150.000đ/giờ), theo ngày hoặc theo gói dịch vụ chăm sóc dài hạn. Mọi mức giá đều hiển thị công khai trên hồ sơ và không có phụ phí ẩn.',
  },
  {
    id: 'faq-4',
    question: 'Làm thế nào để đăng yêu cầu?',
    answer:
      'Bạn chỉ cần nhấn nút "Đăng yêu cầu chăm sóc", chọn loại dịch vụ, độ tuổi người được chăm sóc, thời gian và khu vực. Yêu cầu sẽ được gửi tới các caregiver phù hợp để họ tiếp nhận và liên hệ với bạn.',
  },
];

const formatVND = (amount?: number) => {
  if (!amount) return 'Liên hệ';
  return new Intl.NumberFormat('vi-VN').format(amount) + ' đ';
};

export const HomePage: React.FC = () => {
  const navigate = useNavigate();

  // Caregiver states
  const [selectedCaregiver, setSelectedCaregiver] = useState<Caregiver | null>(null);
  const [featuredCaregivers, setFeaturedCaregivers] = useState<Caregiver[]>(SCREENSHOT_DEFAULT_CAREGIVERS);
  const [loadingCaregivers, setLoadingCaregivers] = useState(false);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);

  // FAQ accordion state
  const [openFaqId, setOpenFaqId] = useState<string | null>(null);

  const toggleFaq = (id: string) => {
    setOpenFaqId((prev) => (prev === id ? null : id));
  };

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

  const handleSelectCategory = (categoryId: string) => {
    navigate(`/caregivers?service=${categoryId}`);
  };

  return (
    <div className="home-page-container">
      {/* 1. Header Navigation */}
      <Navbar />

      {/* 2. Top Hero Banner */}
      <section className="home-hero-section" aria-label="Giới thiệu CareLink">
        {/* Background Visual */}
        <img
          src={heroBg}
          alt="CareLink - Sức khỏe của bạn, chúng tôi quan tâm."
          className="home-hero-bg-visual"
        />

        <div className="home-hero-inner">
          <div className="home-hero-content">
            <div className="home-hero-tag">
              <span>CHĂM SÓC TẬN TÂM • KẾT NỐI YÊU THƯƠNG</span>
            </div>

            <h1 className="home-hero-heading">
              Sức khỏe của bạn, <br />
              <span className="home-hero-heading-highlight">chúng tôi quan tâm.</span>
            </h1>

            <p className="home-hero-subtitle">
              Kết nối với người chăm sóc phù hợp để bạn và gia đình an tâm hơn mỗi ngày.
            </p>

            <div className="home-hero-actions">
              <Link to="/caregivers" className="hero-btn-primary">
                <span>Tìm người chăm sóc</span>
                <ArrowRight size={18} />
              </Link>
              <Link to="/services" className="hero-btn-secondary">
                <span>Khám phá dịch vụ</span>
              </Link>
            </div>

            <div className="home-hero-features">
              <div className="home-feature-item">
                <CheckCircle2 size={19} className="feature-check-icon" />
                <span>Đặt lịch thuận tiện</span>
              </div>
              <div className="home-feature-item">
                <CheckCircle2 size={19} className="feature-check-icon" />
                <span>Thông tin rõ ràng</span>
              </div>
              <div className="home-feature-item">
                <CheckCircle2 size={19} className="feature-check-icon" />
                <span>Chăm sóc tận tâm</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="home-content-wrapper">
        {/* 3. Section: DANH MỤC DỊCH VỤ - Các dịch vụ chăm sóc nổi bật */}
        <section className="home-section" aria-label="Các dịch vụ chăm sóc nổi bật">
          <div className="section-title-wrap">
            <span className="section-pill-tag">DANH MỤC DỊCH VỤ</span>
            <h2 className="section-main-heading">Các dịch vụ chăm sóc nổi bật</h2>
          </div>

          <div className="services-highlight-grid">
            {/* Card 1: Chăm sóc tại nhà */}
            <div
              className="service-card-item"
              onClick={() => handleSelectCategory('home-care')}
              role="button"
              tabIndex={0}
              aria-label="Chọn dịch vụ Chăm sóc tại nhà"
              onKeyDown={(e) => e.key === 'Enter' && handleSelectCategory('home-care')}
            >
              <div className="service-card-photo-wrap">
                <img src={homeCareImg} alt="Chăm sóc tại nhà" className="service-card-photo" />
              </div>
              <div className="service-card-content">
                <div className="service-card-icon-box" style={{ backgroundColor: '#eff6ff', color: '#2563eb' }}>
                  <Home size={22} strokeWidth={2.2} />
                </div>
                <div className="service-card-text">
                  <h3 className="service-card-name">Chăm sóc tại nhà</h3>
                  <p className="service-card-desc">Hỗ trợ sinh hoạt và chăm sóc hàng ngày.</p>
                </div>
                <div className="service-card-arrow-btn">
                  <ArrowRight size={16} />
                </div>
              </div>
            </div>

            {/* Card 2: Chăm sóc người cao tuổi */}
            <div
              className="service-card-item"
              onClick={() => handleSelectCategory('elderly-care')}
              role="button"
              tabIndex={0}
              aria-label="Chọn dịch vụ Chăm sóc người cao tuổi"
              onKeyDown={(e) => e.key === 'Enter' && handleSelectCategory('elderly-care')}
            >
              <div className="service-card-photo-wrap">
                <img src={elderlyCareImg} alt="Chăm sóc người cao tuổi" className="service-card-photo" />
              </div>
              <div className="service-card-content">
                <div className="service-card-icon-box" style={{ backgroundColor: '#faf5ff', color: '#9333ea' }}>
                  <Users size={22} strokeWidth={2.2} />
                </div>
                <div className="service-card-text">
                  <h3 className="service-card-name">Chăm sóc người cao tuổi</h3>
                  <p className="service-card-desc">Đồng hành và hỗ trợ người lớn tuổi.</p>
                </div>
                <div className="service-card-arrow-btn" style={{ borderColor: '#e9d5ff', color: '#9333ea' }}>
                  <ArrowRight size={16} />
                </div>
              </div>
            </div>

            {/* Card 3: Chăm sóc sau điều trị */}
            <div
              className="service-card-item"
              onClick={() => handleSelectCategory('post-treatment-care')}
              role="button"
              tabIndex={0}
              aria-label="Chọn dịch vụ Chăm sóc sau điều trị"
              onKeyDown={(e) => e.key === 'Enter' && handleSelectCategory('post-treatment-care')}
            >
              <div className="service-card-photo-wrap">
                <img src={postTreatmentCareImg} alt="Chăm sóc sau điều trị" className="service-card-photo" />
              </div>
              <div className="service-card-content">
                <div className="service-card-icon-box" style={{ backgroundColor: '#f0fdf4', color: '#16a34a' }}>
                  <Activity size={22} strokeWidth={2.2} />
                </div>
                <div className="service-card-text">
                  <h3 className="service-card-name">Chăm sóc sau điều trị</h3>
                  <p className="service-card-desc">Hỗ trợ phục hồi sau xuất viện.</p>
                </div>
                <div className="service-card-arrow-btn" style={{ borderColor: '#bbf7d0', color: '#16a34a' }}>
                  <ArrowRight size={16} />
                </div>
              </div>
            </div>

            {/* Card 4: Chăm sóc trẻ em */}
            <div
              className="service-card-item"
              onClick={() => handleSelectCategory('child-care')}
              role="button"
              tabIndex={0}
              aria-label="Chọn dịch vụ Chăm sóc trẻ em"
              onKeyDown={(e) => e.key === 'Enter' && handleSelectCategory('child-care')}
            >
              <div className="service-card-photo-wrap">
                <img src={childCareImg} alt="Chăm sóc trẻ em" className="service-card-photo" />
              </div>
              <div className="service-card-content">
                <div className="service-card-icon-box" style={{ backgroundColor: '#fff7ed', color: '#ea580c' }}>
                  <Baby size={22} strokeWidth={2.2} />
                </div>
                <div className="service-card-text">
                  <h3 className="service-card-name">Chăm sóc trẻ em</h3>
                  <p className="service-card-desc">Hỗ trợ chăm sóc trẻ an toàn.</p>
                </div>
                <div className="service-card-arrow-btn" style={{ borderColor: '#fed7aa', color: '#ea580c' }}>
                  <ArrowRight size={16} />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 4. Section: QUY TRÌNH SỬ DỤNG - Chỉ 4 bước đơn giản */}
        <section className="workflow-section" aria-label="Quy trình sử dụng">
          <div className="section-title-wrap">
            <span className="section-pill-tag">QUY TRÌNH SỬ DỤNG</span>
            <h2 className="section-main-heading">Chỉ 4 bước đơn giản</h2>
          </div>

          <div className="workflow-cards-row">
            {/* Step 1 */}
            <div className="workflow-card-step">
              <div className="workflow-card-number">1</div>
              <div className="workflow-card-icon-wrap">
                <Search size={22} />
              </div>
              <h4 className="workflow-card-title">Chọn dịch vụ</h4>
              <p className="workflow-card-desc">Lựa chọn loại chăm sóc phù hợp với nhu cầu</p>
            </div>

            <div className="workflow-card-arrow" aria-hidden="true">
              <ArrowRight size={18} />
            </div>

            {/* Step 2 */}
            <div className="workflow-card-step">
              <div className="workflow-card-number">2</div>
              <div className="workflow-card-icon-wrap">
                <Pencil size={20} />
              </div>
              <h4 className="workflow-card-title">Đăng yêu cầu</h4>
              <p className="workflow-card-desc">Cung cấp thông tin cần thiết</p>
            </div>

            <div className="workflow-card-arrow" aria-hidden="true">
              <ArrowRight size={18} />
            </div>

            {/* Step 3 */}
            <div className="workflow-card-step">
              <div className="workflow-card-number">3</div>
              <div className="workflow-card-icon-wrap">
                <Users size={22} />
              </div>
              <h4 className="workflow-card-title">Caregiver tiếp nhận</h4>
              <p className="workflow-card-desc">Người chăm sóc phù hợp sẽ liên hệ với bạn</p>
            </div>

            <div className="workflow-card-arrow" aria-hidden="true">
              <ArrowRight size={18} />
            </div>

            {/* Step 4 */}
            <div className="workflow-card-step">
              <div className="workflow-card-number">4</div>
              <div className="workflow-card-icon-wrap">
                <Check size={22} strokeWidth={2.6} />
              </div>
              <h4 className="workflow-card-title">Xác nhận dịch vụ</h4>
              <p className="workflow-card-desc">Bắt đầu hành trình chăm sóc</p>
            </div>
          </div>
        </section>

        {/* 5. Banner CTA: Bạn đang cần người chăm sóc? (Nằm ngay trên Người chăm sóc nổi bật) */}
        <section className="home-banner-cta-container" aria-label="Đăng yêu cầu chăm sóc">
          <div className="home-banner-cta-card">
            <div className="home-banner-cta-left">
              <div className="home-banner-cta-icon-box">
                <HeartHandshake size={30} strokeWidth={2.2} />
              </div>
              <div>
                <h3 className="home-banner-cta-title">Bạn đang cần người chăm sóc?</h3>
                <p className="home-banner-cta-subtitle">
                  Hãy chia sẻ nhu cầu của bạn để CareLink kết nối với người chăm sóc phù hợp.
                </p>
              </div>
            </div>

            <button
              type="button"
              className="home-banner-cta-btn"
              onClick={() => setIsPostModalOpen(true)}
            >
              <Pencil size={16} />
              <span>Đăng yêu cầu chăm sóc</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </section>

        {/* 6. Section: Người chăm sóc nổi bật */}
        <section className="home-section" aria-label="Người chăm sóc nổi bật">
          <div className="home-section-header">
            <div>
              <span className="section-pill-tag">ĐỘI NGŨ CHĂM SÓC</span>
              <h2 className="section-main-heading" style={{ marginTop: '8px' }}>Người chăm sóc nổi bật</h2>
              <p className="home-section-subtitle">Đội ngũ điều dưỡng viên và người chăm sóc được xác thực chuyên môn cao</p>
            </div>
            <Link to="/caregivers" className="home-section-link">
              <span>Xem tất cả người chăm sóc</span>
              <ArrowRight size={16} />
            </Link>
          </div>

          <div className="featured-caregivers-grid">
            {featuredCaregivers.map((cg) => (
              <div key={cg.id} className="caregiver-custom-card">
                <div>
                  <div className="caregiver-card-top">
                    <img
                      src={cg.avatar}
                      alt={cg.name}
                      className="caregiver-avatar-round"
                    />
                    <div className="caregiver-info-box">
                      <div className="caregiver-name-row">
                        <h3 className="caregiver-card-name">{cg.name}</h3>
                        <span title="Đã xác thực hồ sơ" className="caregiver-verified-icon-wrap">
                          <CheckCircle2 size={16} className="caregiver-verified-icon" />
                        </span>
                      </div>
                      <p className="caregiver-card-role">{cg.title}</p>
                      <div className="caregiver-card-rating">
                        <RatingStars rating={cg.rating} reviewCount={cg.reviewCount} size={14} />
                      </div>
                    </div>
                  </div>

                  <div className="caregiver-card-meta">
                    <div className="caregiver-meta-item">
                      <Clock size={14} className="text-slate-400" />
                      <span>Kinh nghiệm: <strong>{cg.experienceYears} năm</strong></span>
                    </div>
                    <div className="caregiver-meta-item">
                      <MapPin size={14} className="text-slate-400" />
                      <span>{cg.location || 'TP. Hồ Chí Minh'}</span>
                    </div>
                  </div>

                  <div className="caregiver-price-row">
                    <span className="caregiver-price-label">Giá dịch vụ:</span>
                    <span className="caregiver-price-val">
                      {formatVND(cg.pricing?.hourlyRate || cg.hourlyRate)} / giờ
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  className="caregiver-detail-pill-btn"
                  onClick={() => setSelectedCaregiver(cg)}
                >
                  <span>Xem chi tiết & Đặt lịch</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* 7. Section: CÂU HỎI THƯỜNG GẶP - Những câu hỏi thường gặp */}
        <section className="faq-section" aria-label="Những câu hỏi thường gặp">
          <div className="section-title-wrap">
            <span className="section-pill-tag">CÂU HỎI THƯỜNG GẶP</span>
            <h2 className="section-main-heading">Những câu hỏi thường gặp</h2>
          </div>

          <div className="faq-grid-2col">
            {FAQ_ITEMS.map((item) => {
              const isOpen = openFaqId === item.id;
              return (
                <div key={item.id} className={`faq-card-item ${isOpen ? 'open' : ''}`}>
                  <button
                    type="button"
                    className="faq-card-trigger"
                    onClick={() => toggleFaq(item.id)}
                    aria-expanded={isOpen}
                  >
                    <div className="faq-trigger-left">
                      <div className="faq-question-icon">?</div>
                      <span className="faq-question-text">{item.question}</span>
                    </div>
                    <ChevronDown size={18} className="faq-chevron" />
                  </button>
                  {isOpen && (
                    <div className="faq-card-content">
                      <p>{item.answer}</p>
                    </div>
                  )}
                </div>
              );
            })}
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

      {/* 10. Post Care Request Modal */}
      <PostCareRequestModal
        isOpen={isPostModalOpen}
        onClose={() => setIsPostModalOpen(false)}
      />
    </div>
  );
};

export default HomePage;
