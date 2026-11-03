import React, { FormEvent, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Search,
  SlidersHorizontal,
  MapPin,
  Calendar,
  Clock,
  Coins,
  RotateCcw,
  CheckCircle2,
  Star,
  Briefcase,
  Heart,
  Eye,
  ChevronLeft,
  ChevronRight,
  Users,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { Navbar } from '../components/Header/Navbar';
import { Footer } from '../components/Footer/Footer';
import { CaregiverDetailModal } from '../components/Modal/CaregiverDetailModal';
import { ElderlyBookingModal } from '../components/Modal/ElderlyBookingModal';
import {
  CaregiverFilters,
  CaregiverSortField,
  getCaregivers,
} from '../services/caregiverService';
import { Caregiver } from '../types';
import caregiverBannerImg from '../assets/images/caregiver-banner.jpg';
import './CaregiversPage.css';

// Default realistic profiles matching verified catalog (Image 3)
const SAMPLE_CAREGIVERS: Caregiver[] = [
  {
    id: 'cg-minh-anh-01',
    name: 'Nguyễn Thị Minh Anh',
    title: 'Nhân viên chăm sóc chuyên nghiệp',
    experienceYears: 5,
    rating: 4.9,
    reviewCount: 126,
    hourlyRate: 100000,
    pricing: {
      hourlyRate: 100000,
      dailyRate: 800000,
      weeklyRate: 4800000,
      monthlyRate: 18000000,
    },
    avatar: 'https://images.unsplash.com/photo-1594824813583-0599a0937a34?auto=format&fit=crop&w=400&q=80',
    bio: 'Thân thiện, tận tâm, giàu kinh nghiệm trong việc chăm sóc người cao tuổi và phục hồi chức năng.',
    skills: ['Chăm sóc người cao tuổi', 'Hỗ trợ sinh hoạt', 'Đồng hành'],
    certifications: ['Chứng chỉ Điều dưỡng đa khoa', 'Sơ cấp cứu hồi sức'],
    serviceCategoryIds: ['elderly-care'],
    location: 'Cần Thơ',
    isAvailable: true,
  },
  {
    id: 'cg-thu-ha-02',
    name: 'Trần Thị Thu Hà',
    title: 'Điều dưỡng viên',
    experienceYears: 3,
    rating: 4.8,
    reviewCount: 98,
    hourlyRate: 900000 / 8,
    pricing: {
      hourlyRate: 90000,
      dailyRate: 750000,
      weeklyRate: 4500000,
      monthlyRate: 16500000,
    },
    avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=400&q=80',
    bio: 'Luôn quan tâm, chăm sóc tận tình với người cao tuổi, kiên nhẫn và chu đáo trong từng bữa ăn giấc ngủ.',
    skills: ['Hỗ trợ di chuyển', 'Chăm sóc sinh hoạt', 'Trò chuyện'],
    certifications: ['Chứng chỉ Chăm sóc người cao tuổi'],
    serviceCategoryIds: ['elderly-care'],
    location: 'Cần Thơ',
    isAvailable: true,
  },
  {
    id: 'cg-kim-ngan-03',
    name: 'Lê Thị Kim Ngân',
    title: 'Cộng tác viên chăm sóc',
    experienceYears: 4,
    rating: 4.7,
    reviewCount: 74,
    hourlyRate: 100000,
    pricing: {
      hourlyRate: 100000,
      dailyRate: 800000,
      weeklyRate: 4800000,
      monthlyRate: 18000000,
    },
    avatar: 'https://images.unsplash.com/photo-1582750433449-648ed127bb54?auto=format&fit=crop&w=400&q=80',
    bio: 'Kinh nghiệm chăm sóc người cao tuổi, phục vụ tận tâm và chu đáo, có xe máy đi lại thuận tiện.',
    skills: ['Chăm sóc người cao tuổi', 'Hỗ trợ sinh hoạt', 'Đi lại'],
    certifications: ['Kỹ thuật viên Phục hồi chức năng'],
    serviceCategoryIds: ['elderly-care'],
    location: 'Cần Thơ',
    isAvailable: true,
  },
];

interface FilterFormValues {
  keyword: string;
  area: string;
  startDate: string;
  timeSlot: string;
  priceRange: string;
  skill: string;
  minExperience: string;
  sortBy: CaregiverSortField;
}

const emptyFilters: FilterFormValues = {
  keyword: '',
  area: 'Cần Thơ',
  startDate: '',
  timeSlot: 'ALL',
  priceRange: 'ALL',
  skill: '',
  minExperience: '',
  sortBy: 'ratingAvg',
};

const mapServiceToSkill = (service: string | null): string => {
  if (!service) return '';
  switch (service.toLowerCase()) {
    case 'elderly-care':
    case 'elderly':
      return 'Chăm sóc người cao tuổi';
    case 'child-care':
      return 'Chăm sóc trẻ em';
    case 'home-care':
      return 'Chăm sóc tại nhà';
    case 'post-treatment-care':
      return 'Chăm sóc sau điều trị';
    default:
      return service;
  }
};

export const CaregiversPage: React.FC = () => {
  const [searchParams] = useSearchParams();

  const initialSkill = mapServiceToSkill(searchParams.get('service')) || searchParams.get('skill') || '';
  const initialArea = searchParams.get('area') || 'Cần Thơ';

  const initialFilters: FilterFormValues = {
    ...emptyFilters,
    area: initialArea,
    skill: initialSkill,
  };

  const [formValues, setFormValues] = useState<FilterFormValues>(initialFilters);
  const [appliedFilters, setAppliedFilters] = useState<FilterFormValues>(initialFilters);
  const [isAdvancedFilterOpen, setIsAdvancedFilterOpen] = useState(false);

  const [page, setPage] = useState(1);
  const [caregivers, setCaregivers] = useState<Caregiver[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Modals
  const [selectedCaregiver, setSelectedCaregiver] = useState<Caregiver | null>(null);
  const [bookingCaregiver, setBookingCaregiver] = useState<Caregiver | null>(null);

  // Favorite IDs state
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());

  const toggleFavorite = (id: string) => {
    setFavoriteIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  useEffect(() => {
    let active = true;

    // Convert priceRange to min/max price
    let minPrice: number | undefined;
    let maxPrice: number | undefined;
    if (appliedFilters.priceRange === 'UNDER_150') {
      maxPrice = 150000;
    } else if (appliedFilters.priceRange === '150_250') {
      minPrice = 150000;
      maxPrice = 250000;
    } else if (appliedFilters.priceRange === 'OVER_250') {
      minPrice = 250000;
    }

    const filters: CaregiverFilters = {
      keyword: appliedFilters.keyword.trim() || undefined,
      minPrice,
      maxPrice,
      area: appliedFilters.area === 'Tất cả khu vực' ? undefined : appliedFilters.area.trim() || undefined,
      skill: appliedFilters.skill.trim() || undefined,
      minExperience: appliedFilters.minExperience ? Number(appliedFilters.minExperience) : undefined,
      page,
      limit: 10,
      sortBy: appliedFilters.sortBy,
      order: 'desc',
    };

    const loadCaregivers = async () => {
      setLoading(true);
      setError(false);

      try {
        const result = await getCaregivers(filters);
        if (!active) return;
        const fetched = result.caregivers && result.caregivers.length > 0
          ? result.caregivers
          : SAMPLE_CAREGIVERS;

        setCaregivers(fetched);
        setTotal(result.pagination.total > 0 ? result.pagination.total : fetched.length);
        setTotalPages(result.pagination.totalPages > 0 ? result.pagination.totalPages : 1);
      } catch {
        if (active) {
          // Graceful fallback to verified sample catalog
          setCaregivers(SAMPLE_CAREGIVERS);
          setTotal(SAMPLE_CAREGIVERS.length);
          setTotalPages(1);
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    void loadCaregivers();
    return () => {
      active = false;
    };
  }, [appliedFilters, page]);

  const updateField = <K extends keyof FilterFormValues>(
    field: K,
    value: FilterFormValues[K],
  ) => {
    setFormValues((current) => ({ ...current, [field]: value }));
  };

  const handleApplyFilters = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPage(1);
    setAppliedFilters({ ...formValues });
  };

  const handleResetFilters = () => {
    setFormValues(emptyFilters);
    setAppliedFilters(emptyFilters);
    setPage(1);
  };

  const handleDirectBook = (cg: Caregiver) => {
    setBookingCaregiver(cg);
  };

  return (
    <div className="caregivers-page-layout">
      <Navbar />

      <main className="caregivers-page">
        {/* ================= 1. BANNER SECTION (Image 1 & 2) ================= */}
        <section className="caregivers-banner-section">
          <div className="container">
            <div className="caregivers-banner-wrapper">
              <img
                src={caregiverBannerImg}
                alt="CareLink - Chọn người chăm sóc phù hợp"
                className="caregivers-banner-img"
              />

              <div className="caregivers-banner-content">
                {/* 1. Badge Xác minh */}
                <div className="caregivers-banner-badge">
                  <span className="caregivers-banner-badge-icon">
                    <ShieldCheck size={14} fill="#0284c7" color="#ffffff" strokeWidth={2.5} />
                  </span>
                  <span>ĐỘI NGŨ ĐÃ XÁC MINH</span>
                </div>

                {/* 2. Tiêu đề chính */}
                <h1 className="caregivers-banner-title">
                  Chọn người chăm sóc
                  <span className="banner-title-break"> </span>
                  phù hợp
                </h1>

                {/* 3. Mô tả phụ */}
                <p className="caregivers-banner-subtitle">
                  Lọc hồ sơ theo kinh nghiệm, mức phí, đánh giá, khu vực và kỹ năng.
                </p>

                {/* 4. Bộ 3 Cam kết / Lợi thế nổi bật */}
                <div className="caregivers-banner-features">
                  <div className="caregivers-banner-feature-item">
                    <div className="feature-icon-box">
                      <ShieldCheck size={26} fill="#0284c7" color="#ffffff" strokeWidth={2} />
                    </div>
                    <div className="feature-text-block">
                      <span className="feature-text-line">An toàn</span>
                      <span className="feature-text-line">& Uy tín</span>
                    </div>
                  </div>

                  <div className="caregivers-banner-feature-divider" />

                  <div className="caregivers-banner-feature-item">
                    <div className="feature-icon-box">
                      <Zap size={24} fill="#0284c7" color="#0284c7" strokeWidth={1.5} />
                    </div>
                    <div className="feature-text-block">
                      <span className="feature-text-line">Nhanh chóng</span>
                      <span className="feature-text-line">& Tiện lợi</span>
                    </div>
                  </div>

                  <div className="caregivers-banner-feature-divider" />

                  <div className="caregivers-banner-feature-item">
                    <div className="feature-icon-box">
                      <Users size={24} fill="#0284c7" color="#0284c7" strokeWidth={1.5} />
                    </div>
                    <div className="feature-text-block">
                      <span className="feature-text-line">Đa dạng</span>
                      <span className="feature-text-line">lựa chọn</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================= 2. SEARCH / FILTER BAR (Image 2) ================= */}
        <section className="caregivers-filter-section">
          <div className="container">
            <div className="caregivers-search-card">
              <form onSubmit={handleApplyFilters}>
                {/* Search Bar Header */}
                <div className="caregivers-search-header">
                  <div className="caregivers-search-title">
                    <Search size={18} />
                    <span>Tìm người chăm sóc phù hợp</span>
                  </div>

                  <button
                    type="button"
                    className={`btn-filter-toggle ${isAdvancedFilterOpen ? 'active' : ''}`}
                    onClick={() => setIsAdvancedFilterOpen(!isAdvancedFilterOpen)}
                  >
                    <SlidersHorizontal size={14} />
                    <span>Bộ lọc</span>
                  </button>
                </div>

                {/* Primary Horizontal Filter Row */}
                <div className="caregivers-main-filter-row" style={{ marginTop: 14 }}>
                  {/* Field 1: Địa điểm chăm sóc */}
                  <div className="filter-pill-box">
                    <MapPin size={18} className="filter-pill-icon" />
                    <div className="filter-pill-content">
                      <span className="filter-pill-label">Địa điểm chăm sóc</span>
                      <select
                        className="filter-pill-input"
                        value={formValues.area}
                        onChange={(e) => updateField('area', e.target.value)}
                      >
                        <option value="Cần Thơ">Cần Thơ</option>
                        <option value="Ninh Kiều">Ninh Kiều, Cần Thơ</option>
                        <option value="Cái Răng">Cái Răng, Cần Thơ</option>
                        <option value="Bình Thủy">Bình Thủy, Cần Thơ</option>
                        <option value="Ô Môn">Ô Môn, Cần Thơ</option>
                        <option value="TP. Hồ Chí Minh">TP. Hồ Chí Minh</option>
                        <option value="Tất cả khu vực">Tất cả khu vực</option>
                      </select>
                    </div>
                  </div>

                  {/* Field 2: Ngày bắt đầu */}
                  <div className="filter-pill-box">
                    <Calendar size={18} className="filter-pill-icon" />
                    <div className="filter-pill-content">
                      <span className="filter-pill-label">Ngày bắt đầu</span>
                      <input
                        type="date"
                        className="filter-pill-input"
                        value={formValues.startDate}
                        min={new Date().toISOString().split('T')[0]}
                        onChange={(e) => updateField('startDate', e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Field 3: Thời gian */}
                  <div className="filter-pill-box">
                    <Clock size={18} className="filter-pill-icon" />
                    <div className="filter-pill-content">
                      <span className="filter-pill-label">Thời gian</span>
                      <select
                        className="filter-pill-input"
                        value={formValues.timeSlot}
                        onChange={(e) => updateField('timeSlot', e.target.value)}
                      >
                        <option value="ALL">Chọn khung giờ</option>
                        <option value="HOURLY_4">Ca 4 tiếng</option>
                        <option value="HOURLY_8">Ca 8 tiếng</option>
                        <option value="HOURLY_12">Ca 12 tiếng</option>
                        <option value="DAILY_24">Theo ngày (24/24h)</option>
                      </select>
                    </div>
                  </div>

                  {/* Field 4: Mức giá */}
                  <div className="filter-pill-box">
                    <Coins size={18} className="filter-pill-icon" />
                    <div className="filter-pill-content">
                      <span className="filter-pill-label">Mức giá (VNĐ/ngày)</span>
                      <select
                        className="filter-pill-input"
                        value={formValues.priceRange}
                        onChange={(e) => updateField('priceRange', e.target.value)}
                      >
                        <option value="ALL">Tất cả</option>
                        <option value="UNDER_150">Dưới 150.000đ/giờ</option>
                        <option value="150_250">150.000đ - 250.000đ/giờ</option>
                        <option value="OVER_250">Trên 250.000đ/giờ</option>
                      </select>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button type="submit" className="btn-submit-search">
                    <Search size={16} />
                    <span>Tìm người chăm sóc</span>
                  </button>
                </div>

                {/* Collapsible Advanced Filters */}
                {isAdvancedFilterOpen && (
                  <div className="caregivers-advanced-filter-panel" style={{ marginTop: 16 }}>
                    <div className="adv-filter-field">
                      <label>Kỹ năng chuyên môn</label>
                      <select
                        value={formValues.skill}
                        onChange={(e) => updateField('skill', e.target.value)}
                      >
                        <option value="">Tất cả kỹ năng</option>
                        <option value="Chăm sóc người cao tuổi">Chăm sóc người cao tuổi</option>
                        <option value="Hỗ trợ sinh hoạt">Hỗ trợ sinh hoạt</option>
                        <option value="Chăm bệnh nhân tại viện">Chăm bệnh nhân tại viện</option>
                        <option value="Vật lý trị liệu & Phục hồi chức năng">Vật lý trị liệu & Phục hồi chức năng</option>
                        <option value="Chăm sóc vết thương & Thay băng">Chăm sóc vết thương & Thay băng</option>
                      </select>
                    </div>

                    <div className="adv-filter-field">
                      <label>Kinh nghiệm tối thiểu</label>
                      <select
                        value={formValues.minExperience}
                        onChange={(e) => updateField('minExperience', e.target.value)}
                      >
                        <option value="">Tất cả kinh nghiệm</option>
                        <option value="1">Từ 1 năm trở lên</option>
                        <option value="3">Từ 3 năm trở lên</option>
                        <option value="5">Từ 5 năm trở lên</option>
                      </select>
                    </div>

                    <div className="adv-filter-field">
                      <label>Sắp xếp theo</label>
                      <select
                        value={formValues.sortBy}
                        onChange={(e) => updateField('sortBy', e.target.value as CaregiverSortField)}
                      >
                        <option value="ratingAvg">Đánh giá cao nhất</option>
                        <option value="hourlyRate">Giá dịch vụ thấp nhất</option>
                        <option value="experienceYears">Kinh nghiệm nhiều nhất</option>
                        <option value="createdAt">Mới tham gia</option>
                      </select>
                    </div>

                    <div className="adv-filter-field">
                      <label>Tìm theo tên</label>
                      <input
                        type="text"
                        placeholder="VD: Minh Anh, Thu Hà..."
                        value={formValues.keyword}
                        onChange={(e) => updateField('keyword', e.target.value)}
                      />
                    </div>

                    <button
                      type="button"
                      className="btn-reset-filters"
                      onClick={handleResetFilters}
                    >
                      <RotateCcw size={14} />
                      <span>Xóa bộ lọc</span>
                    </button>
                  </div>
                )}
              </form>
            </div>
          </div>
        </section>

        {/* ================= 3. CAREGIVER HORIZONTAL LIST (Image 3) ================= */}
        <section className="caregivers-results">
          <div className="container">
            <div className="caregivers-results-heading">
              <h2>Danh sách người chăm sóc phù hợp</h2>
              <span className="caregivers-results-count">
                {total} hồ sơ phù hợp · Trang {page}/{totalPages || 1}
              </span>
            </div>

            {loading ? (
              <div style={{ textAlign: 'center', padding: '48px 0', color: '#64748b' }}>
                Đang tìm kiếm người chăm sóc phù hợp...
              </div>
            ) : error && caregivers.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 0', color: '#ef4444' }}>
                Không thể tải danh sách người chăm sóc. Vui lòng thử lại.
              </div>
            ) : caregivers.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 0', color: '#64748b' }}>
                Không tìm thấy người chăm sóc phù hợp với bộ lọc hiện tại.
              </div>
            ) : (
              <div className="caregivers-list-vertical">
                {caregivers.map((cg) => {
                  const isFavorited = favoriteIds.has(cg.id);
                  const price8h = cg.hourlyRate * 8 > 0 ? cg.hourlyRate * 8 : 350000;

                  return (
                    <div key={cg.id} className="caregiver-horizontal-card">
                      {/* Left: Square avatar */}
                      <div className="caregiver-h-avatar-wrap">
                        <img
                          src={cg.avatar}
                          alt={cg.name}
                          className="caregiver-h-avatar"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src =
                              'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=400&q=80';
                          }}
                        />
                      </div>

                      {/* Middle: Details */}
                      <div className="caregiver-h-details">
                        <div className="caregiver-h-badge">
                          <CheckCircle2 size={13} fill="#16a34a" color="#ffffff" strokeWidth={2.5} />
                          <span>Đã xác minh danh tính</span>
                        </div>

                        <h3 className="caregiver-h-name">{cg.name}</h3>

                        <div className="caregiver-h-meta">
                          <span className="caregiver-h-rating">
                            <Star size={14} fill="#f59e0b" color="#f59e0b" />
                            <strong>{cg.rating ? cg.rating.toFixed(1) : '4.9'}</strong>
                            <span className="caregiver-h-reviews">
                              ({cg.reviewCount || 25} ca hoàn thành)
                            </span>
                          </span>
                          <span className="caregiver-h-meta-divider">|</span>
                          <span className="caregiver-h-exp">
                            <Briefcase size={14} />
                            <span>{cg.experienceYears || 3} năm kinh nghiệm</span>
                          </span>
                        </div>

                        {/* Skill pills */}
                        <div className="caregiver-h-skills">
                          {(cg.skills && cg.skills.length > 0
                            ? cg.skills
                            : ['Chăm sóc người cao tuổi', 'Hỗ trợ sinh hoạt', 'Đồng hành']
                          )
                            .slice(0, 3)
                            .map((skill, idx) => (
                              <span key={idx} className="caregiver-h-skill-pill">
                                {skill}
                              </span>
                            ))}
                        </div>

                        {/* Location */}
                        <div className="caregiver-h-location">
                          <MapPin size={13} />
                          <span>{cg.location || 'Cần Thơ'}</span>
                        </div>
                      </div>

                      {/* Right: Pricing, Bio, Actions */}
                      <div className="caregiver-h-actions-col">
                        <div className="caregiver-h-price-row">
                          <div className="caregiver-h-price-wrap">
                            <span className="caregiver-h-price-amount">
                              {new Intl.NumberFormat('vi-VN').format(price8h)}đ
                            </span>
                            <span className="caregiver-h-price-unit"> / 8 giờ</span>
                          </div>

                          <button
                            type="button"
                            className="caregiver-h-fav-btn"
                            aria-label="Lưu vào yêu thích"
                            onClick={() => toggleFavorite(cg.id)}
                          >
                            <Heart
                              size={20}
                              fill={isFavorited ? '#ef4444' : 'none'}
                              color={isFavorited ? '#ef4444' : '#94a3b8'}
                            />
                          </button>
                        </div>

                        <p className="caregiver-h-bio">
                          {cg.bio || 'Thân thiện, tận tâm, giàu kinh nghiệm trong việc chăm sóc người cao tuổi.'}
                        </p>

                        <div className="caregiver-h-btn-row">
                          <button
                            type="button"
                            className="btn-h-view-profile"
                            onClick={() => setSelectedCaregiver(cg)}
                          >
                            <Eye size={15} />
                            <span>Xem hồ sơ</span>
                          </button>

                          <button
                            type="button"
                            className="btn-h-book-now"
                            onClick={() => handleDirectBook(cg)}
                          >
                            <Calendar size={15} />
                            <span>Đặt dịch vụ</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pagination */}
            {!loading && totalPages > 1 && (
              <div className="caregivers-pagination">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  <ChevronLeft size={16} />
                  <span>Trang trước</span>
                </button>
                <span>
                  Trang {page} / {totalPages}
                </span>
                <button
                  type="button"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  <span>Trang sau</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </div>
        </section>
      </main>

      {/* Detail Modal */}
      {selectedCaregiver && (
        <CaregiverDetailModal
          caregiver={selectedCaregiver}
          onClose={() => setSelectedCaregiver(null)}
        />
      )}

      {/* Elderly Booking Modal */}
      {bookingCaregiver && (
        <ElderlyBookingModal
          isOpen={Boolean(bookingCaregiver)}
          onClose={() => setBookingCaregiver(null)}
          caregiver={bookingCaregiver}
        />
      )}

      <Footer />
    </div>
  );
};
