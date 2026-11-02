import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CaregiverHeader } from '../components/CaregiverHeader';
import {
  getOpenCareRequests,
  acceptCareRequest,
  declineCareRequest,
} from '../services/careRequestService';
import {
  CareRequestItem,
  CareServiceCategory,
  CareFrequency,
} from '../types/careRequest';
import toast from 'react-hot-toast';
import './CaregiverMarketplacePage.css';
import {
  Search,
  MapPin,
  Calendar,
  Clock,
  Heart,
  Baby,
  Home,
  Cross,
  User,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Sparkles,
  RotateCcw,
  X,
} from 'lucide-react';

const CATEGORIES: {
  id: CareServiceCategory | 'ALL';
  label: string;
  icon: React.ReactNode;
}[] = [
  { id: 'ALL', label: 'Tất cả dịch vụ', icon: <Sparkles size={14} /> },
  { id: 'elderly-care', label: 'Người cao tuổi', icon: <Heart size={14} /> },
  { id: 'child-care', label: 'Trẻ em', icon: <Baby size={14} /> },
  { id: 'home-care', label: 'Chăm sóc tại nhà', icon: <Home size={14} /> },
  { id: 'post-treatment-care', label: 'Sau điều trị', icon: <Cross size={14} /> },
];

const CATEGORY_LABELS: Record<string, { label: string; icon: React.ReactNode }> = {
  'elderly-care': { label: 'Chăm sóc người cao tuổi', icon: <Heart size={13} /> },
  'child-care': { label: 'Chăm sóc trẻ em', icon: <Baby size={13} /> },
  'home-care': { label: 'Chăm sóc tại nhà', icon: <Home size={13} /> },
  'post-treatment-care': { label: 'Chăm sóc sau điều trị', icon: <Cross size={13} /> },
};

const FREQUENCY_LABELS: Record<string, string> = {
  DAILY: 'Hàng ngày',
  WEEKDAYS: 'Thứ 2 - Thứ 6',
  WEEKLY: 'Hàng tuần',
  ONE_TIME: '1 lần duy nhất',
};

const AREAS = [
  'ALL',
  'Ninh Kiều',
  'Bình Thủy',
  'Cái Răng',
  'Ô Môn',
  'Thốt Nốt',
  'Quận 1',
  'Quận 3',
  'Quận 7',
  'Bình Thạnh',
  'Thủ Đức',
];

export const CaregiverMarketplacePage: React.FC = () => {
  const {
    isAuthenticated,
    account,
    loading: authLoading,
  } = useAuth();
  const navigate = useNavigate();

  const [requests, setRequests] = useState<CareRequestItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const latestRequestId = useRef(0);

  // Filters State
  const [category, setCategory] = useState<CareServiceCategory | 'ALL'>('ALL');
  const [area, setArea] = useState<string>('ALL');
  const [budgetRange, setBudgetRange] = useState<string>('ALL');
  const [frequency, setFrequency] = useState<CareFrequency | 'ALL'>('ALL');
  const [searchInput, setSearchInput] = useState<string>('');
  const [keyword, setKeyword] = useState<string>('');

  // Selected Detail Modal
  const [detailItem, setDetailItem] = useState<CareRequestItem | null>(null);

  // Confirmation Modal
  const [confirmItem, setConfirmItem] = useState<CareRequestItem | null>(null);
  const [confirmAction, setConfirmAction] = useState<'accept' | 'decline'>('accept');
  const [submittingDecision, setSubmittingDecision] = useState(false);

  const fetchRequests = useCallback(async () => {
    const requestId = latestRequestId.current + 1;
    latestRequestId.current = requestId;

    try {
      setLoading(true);

      let budgetMin: number | undefined;
      let budgetMax: number | undefined;

      if (budgetRange === 'UNDER_300K') {
        budgetMax = 300000;
      } else if (budgetRange === '300K_500K') {
        budgetMin = 300000;
        budgetMax = 500000;
      } else if (budgetRange === '500K_1M') {
        budgetMin = 500000;
        budgetMax = 1000000;
      } else if (budgetRange === 'ABOVE_1M') {
        budgetMin = 1000000;
      }

      const res = await getOpenCareRequests({
        serviceCategory: category,
        area: area === 'ALL' ? undefined : area,
        frequency: frequency === 'ALL' ? undefined : frequency,
        budgetMin,
        budgetMax,
        keyword: keyword.trim() || undefined,
      });

      if (requestId === latestRequestId.current) {
        setRequests(res.requests);
        setTotalCount(res.total);
      }
    } catch (err: unknown) {
      if (requestId === latestRequestId.current) {
        const msg = err instanceof Error ? err.message : 'Không thể tải danh sách yêu cầu.';
        toast.error(msg);
      }
    } finally {
      if (requestId === latestRequestId.current) {
        setLoading(false);
      }
    }
  }, [category, area, budgetRange, frequency, keyword]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/auth?redirect=/caregiver/marketplace', { replace: true });
      return;
    }

    if (!authLoading && account?.role !== 'CAREGIVER') {
      navigate('/', { replace: true });
    }
  }, [account?.role, authLoading, isAuthenticated, navigate]);

  useEffect(() => {
    if (!authLoading && isAuthenticated && account?.role === 'CAREGIVER') {
      void fetchRequests();
    }
  }, [account?.role, authLoading, fetchRequests, isAuthenticated]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setKeyword(searchInput.trim());
    }, 350);

    return () => window.clearTimeout(timeoutId);
  }, [searchInput]);

  const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setKeyword(searchInput.trim());
  };

  const handleResetFilters = () => {
    setCategory('ALL');
    setArea('ALL');
    setBudgetRange('ALL');
    setFrequency('ALL');
    setSearchInput('');
    setKeyword('');
  };

  const activeFilterCount = [
    category !== 'ALL',
    area !== 'ALL',
    budgetRange !== 'ALL',
    frequency !== 'ALL',
    keyword.length > 0,
  ].filter(Boolean).length;

  const handleInitiateDecision = (
    item: CareRequestItem,
    action: 'accept' | 'decline'
  ) => {
    if (!isAuthenticated) {
      toast.error('Vui lòng đăng nhập với tài khoản Người chăm sóc để chọn yêu cầu.');
      navigate('/auth?redirect=/caregiver/marketplace');
      return;
    }

    if (account?.role === 'CUSTOMER') {
      toast.error('Bạn đang đăng nhập tài khoản Khách hàng. Vui lòng đăng nhập bằng tài khoản Người chăm sóc.');
      return;
    }

    setConfirmAction(action);
    setConfirmItem(item);
  };

  const handleConfirmDecision = async () => {
    if (!confirmItem) return;
    setSubmittingDecision(true);
    try {
      if (confirmAction === 'accept') {
        await acceptCareRequest(confirmItem._id);
        toast.success(
          'Chúc mừng! Bạn đã tiếp nhận yêu cầu chăm sóc thành công. Khách hàng đã nhận được thông tin của bạn!'
        );
      } else {
        await declineCareRequest(confirmItem._id);
        toast.success('Đã từ chối yêu cầu. Yêu cầu vẫn được hiển thị với người chăm sóc khác.');
      }

      setConfirmItem(null);
      setDetailItem(null);
      await fetchRequests();
      if (confirmAction === 'accept') {
        navigate('/caregiver/bookings');
      }
    } catch (err: unknown) {
      const errorObj = err as { status?: number; message?: string };
      if (errorObj?.status === 409) {
        toast.error('Yêu cầu này vừa được người khác tiếp nhận hoặc không còn mở.');
      } else {
        toast.error(errorObj?.message || 'Không thể cập nhật lựa chọn của bạn.');
      }
      setConfirmItem(null);
      setDetailItem(null);
      await fetchRequests();
    } finally {
      setSubmittingDecision(false);
    }
  };

  const formatVND = (num: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(num);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const timeAgo = (dateStr: string) => {
    if (!dateStr) return '';
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return 'Vừa xong';
    if (mins < 60) return `${mins} phút trước`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours} giờ trước`;
    const days = Math.floor(hours / 24);
    return `${days} ngày trước`;
  };

  return (
    <div className="marketplace-page">
      {authLoading ? (
        <div className="caregiver-access-loading">Đang kiểm tra tài khoản...</div>
      ) : isAuthenticated && account?.role === 'CAREGIVER' ? (
        <>
          <CaregiverHeader />

      {/* Hero Header */}
      <section className="marketplace-hero">
        <div className="marketplace-hero-inner">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                color: '#fff',
                fontSize: '12px',
                fontWeight: 700,
                padding: '4px 12px',
                borderRadius: '999px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Sparkles size={14} /> Chợ việc làm chăm sóc CareLink
            </span>
          </div>
          <h1>Yêu cầu chăm sóc phù hợp</h1>
          <p>
            Khám phá các ca làm việc đang tìm kiếm người chăm sóc tại khu vực của bạn. Nhận việc ngay, thu nhập minh bạch và trực tiếp.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <main className="marketplace-container">
        {/* Filter Card */}
        <div className="marketplace-filter-card">
          <div className="marketplace-filter-heading">
            <div>
              <span className="marketplace-filter-eyebrow">TÌM CÔNG VIỆC PHÙ HỢP</span>
              <h2>Tìm yêu cầu chăm sóc</h2>
              <p>Tìm theo nhu cầu, khu vực hoặc thông tin người cần chăm sóc.</p>
            </div>
            <span className="marketplace-filter-count">
              {activeFilterCount > 0 ? `${activeFilterCount} bộ lọc đang dùng` : 'Tất cả yêu cầu'}
            </span>
          </div>

          <div className="filter-row-top">
            <form className="filter-search-form" onSubmit={handleSearch} role="search">
              <div className="filter-input-box">
                <Search size={18} aria-hidden="true" />
                <input
                  type="text"
                  aria-label="Tìm yêu cầu chăm sóc"
                  placeholder="Ví dụ: chăm sóc người cao tuổi, Ninh Kiều..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                />
                {searchInput && (
                  <button
                    type="button"
                    className="filter-search-clear"
                    aria-label="Xóa từ khóa tìm kiếm"
                    onClick={() => setSearchInput('')}
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
              <button type="submit" className="filter-search-submit">
                <Search size={16} />
                <span>Tìm kiếm</span>
              </button>
            </form>

            <div className="marketplace-filter-controls">
              <label className="marketplace-filter-control">
                <span>Khu vực</span>
                <select
                  className="filter-select"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                >
                  <option value="ALL">Tất cả khu vực</option>
                  {AREAS.filter((a) => a !== 'ALL').map((a) => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </label>

              <label className="marketplace-filter-control">
                <span>Ngân sách</span>
                <select
                  className="filter-select"
                  value={budgetRange}
                  onChange={(e) => setBudgetRange(e.target.value)}
                >
                  <option value="ALL">Mọi mức giá</option>
                  <option value="UNDER_300K">Dưới 300.000đ</option>
                  <option value="300K_500K">300.000đ - 500.000đ</option>
                  <option value="500K_1M">500.000đ - 1.000.000đ</option>
                  <option value="ABOVE_1M">Trên 1.000.000đ</option>
                </select>
              </label>

              <label className="marketplace-filter-control">
                <span>Lịch chăm sóc</span>
                <select
                  className="filter-select"
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value as CareFrequency | 'ALL')}
                >
                  <option value="ALL">Mọi lịch</option>
                  <option value="DAILY">Hàng ngày</option>
                  <option value="WEEKDAYS">Thứ 2 - Thứ 6</option>
                  <option value="WEEKLY">Hàng tuần</option>
                  <option value="ONE_TIME">Một lần duy nhất</option>
                </select>
              </label>
            </div>
            <button
              type="button"
              className="filter-reset-btn"
              onClick={handleResetFilters}
              disabled={activeFilterCount === 0 && !searchInput}
            >
              <RotateCcw size={14} />
              <span>Xóa bộ lọc</span>
            </button>
          </div>

          {/* Quick Category Pills */}
          <div className="category-pills-row">
            {CATEGORIES.map((cat) => (
              <button
                type="button"
                key={cat.id}
                className={`cat-pill-btn ${category === cat.id ? 'active' : ''}`}
                onClick={() => setCategory(cat.id)}
              >
                {cat.icon}
                <span>{cat.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* List Header Count */}
        <div className="marketplace-list-header">
          <div className="result-count">
            Tìm thấy <span>{totalCount}</span> yêu cầu chăm sóc
            {keyword && <> cho “{keyword}”</>}
          </div>
        </div>

        {/* Loading Spinner */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748b' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                border: '3px solid #e2e8f0',
                borderTopColor: '#2563eb',
                borderRadius: '50%',
                margin: '0 auto 12px',
                animation: 'spin 0.8s linear infinite',
              }}
            />
            <p style={{ fontSize: '14px' }}>Đang tìm kiếm các yêu cầu phù hợp...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && requests.length === 0 && (
          <div
            style={{
              backgroundColor: '#fff',
              borderRadius: '16px',
              border: '1px dashed #cbd5e1',
              padding: '60px 20px',
              textAlign: 'center',
            }}
          >
            <AlertCircle size={40} className="text-blue-600" style={{ margin: '0 auto 14px' }} />
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', margin: '0 0 6px' }}>
              Không tìm thấy yêu cầu chăm sóc nào phù hợp
            </h3>
            <p style={{ fontSize: '14px', color: '#64748b', margin: '0 0 16px' }}>
              Hãy thử chọn lại danh mục, khu vực hoặc khoảng ngân sách để xem thêm các cơ hội khác.
            </p>
            <button
              type="button"
              className="filter-reset-btn"
              onClick={handleResetFilters}
            >
              Xem tất cả yêu cầu
            </button>
          </div>
        )}

        {/* Requests Grid */}
        {!loading && requests.length > 0 && (
          <div className="marketplace-grid">
            {requests.map((item) => {
              const cat = CATEGORY_LABELS[item.serviceCategory] || {
                label: item.serviceCategory,
                icon: <Heart size={13} />,
              };

              return (
                <div key={item._id} className="mp-card">
                  <div>
                    {/* Top Row: Category + Time ago */}
                    <div className="mp-card-top">
                      <span className={`service-badge ${item.serviceCategory}`}>
                        {cat.icon}
                        <span>{cat.label}</span>
                      </span>
                      <span className="time-ago">
                        <Clock size={12} />
                        {timeAgo(item.createdAt)}
                      </span>
                    </div>

                    {/* Card Title & Desc */}
                    <h3 className="mp-card-title">{item.title}</h3>
                    <p className="mp-card-desc">{item.description}</p>

                    {/* Info Box */}
                    <div className="mp-info-box">
                      <div className="mp-info-line">
                        <User size={14} />
                        <span>
                          <strong>{item.recipient.name}</strong> ({item.recipient.age} tuổi •{' '}
                          {item.recipient.gender === 'MALE' ? 'Nam' : 'Nữ'})
                        </span>
                      </div>
                      <div className="mp-info-line">
                        <MapPin size={14} />
                        <span>
                          {item.location.area}, {item.location.city}
                        </span>
                      </div>
                      <div className="mp-info-line">
                        <Calendar size={14} />
                        <span>
                          Bắt đầu: {formatDate(item.schedule.startDate)} •{' '}
                          {FREQUENCY_LABELS[item.schedule.frequency] || item.schedule.frequency}
                        </span>
                      </div>
                      <div className="mp-info-line">
                        <Clock size={14} />
                        <span>
                          {item.schedule.timeSlot} ({item.schedule.dailyHours}h/ngày)
                        </span>
                      </div>
                    </div>

                    {/* Special Requirements */}
                    {item.specialRequirements && item.specialRequirements.length > 0 && (
                      <div className="special-req-tags">
                        {item.specialRequirements.slice(0, 3).map((r) => (
                          <span key={r} className="special-tag">
                            ✓ {r}
                          </span>
                        ))}
                        {item.specialRequirements.length > 3 && (
                          <span className="special-tag" style={{ color: '#64748b', background: '#f1f5f9' }}>
                            +{item.specialRequirements.length - 3} khác
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Card Footer */}
                  <div className="mp-card-footer">
                    <div className="mp-budget-group">
                      <span className="mp-budget-lbl">Ngân sách dự kiến</span>
                      <span className="mp-budget-val">{formatVND(item.expectedBudget)}</span>
                    </div>

                    <button
                      type="button"
                      className="btn-accept-cta"
                      onClick={() => setDetailItem(item)}
                    >
                      <span>Xem chi tiết</span>
                      <ArrowRight size={15} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Detail Modal */}
      {detailItem && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
          onClick={() => setDetailItem(null)}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '20px',
              width: '100%',
              maxWidth: '680px',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '28px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span className={`service-badge ${detailItem.serviceCategory}`}>
                  {CATEGORY_LABELS[detailItem.serviceCategory]?.label}
                </span>
                <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', margin: '10px 0 4px' }}>
                  {detailItem.title}
                </h2>
                <span style={{ fontSize: '13px', color: '#64748b' }}>
                  Đăng {timeAgo(detailItem.createdAt)} • Khu vực: {detailItem.location.area}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setDetailItem(null)}
                style={{
                  border: 'none',
                  background: '#f1f5f9',
                  borderRadius: '50%',
                  width: '36px',
                  height: '36px',
                  cursor: 'pointer',
                  fontSize: '16px',
                }}
              >
                ✕
              </button>
            </div>

            {/* Description */}
            <div>
              <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', marginBottom: '6px' }}>
                Mô tả chi tiết nhu cầu chăm sóc:
              </h4>
              <p style={{ fontSize: '14px', color: '#334155', lineHeight: 1.6, margin: 0 }}>
                {detailItem.description}
              </p>
            </div>

            {/* Recipient & Health details */}
            <div
              style={{
                backgroundColor: '#f8fafc',
                borderRadius: '14px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                fontSize: '13.5px',
                border: '1px solid #e2e8f0',
              }}
            >
              <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
                Người được chăm sóc:
              </h4>
              <div>Họ tên: <strong>{detailItem.recipient.name}</strong></div>
              <div>
                Tuổi: {detailItem.recipient.age} • Giới tính:{' '}
                {detailItem.recipient.gender === 'MALE' ? 'Nam' : 'Nữ'} • Mối quan hệ:{' '}
                {detailItem.recipient.relationship}
              </div>
              {detailItem.recipient.conditionNotes && (
                <div style={{ color: '#b45309', fontWeight: 500 }}>
                  Ghi chú sức khỏe: {detailItem.recipient.conditionNotes}
                </div>
              )}
            </div>

            {/* Schedule & Location */}
            <div
              style={{
                backgroundColor: '#f8fafc',
                borderRadius: '14px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                fontSize: '13.5px',
                border: '1px solid #e2e8f0',
              }}
            >
              <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
                Lịch trình & Địa điểm làm việc:
              </h4>
              <div>
                Địa chỉ: {detailItem.location.address}, {detailItem.location.area},{' '}
                {detailItem.location.city}
              </div>
              <div>
                Thời gian: Từ {formatDate(detailItem.schedule.startDate)}
                {detailItem.schedule.endDate ? ` đến ${formatDate(detailItem.schedule.endDate)}` : ''}
              </div>
              <div>
                Khung giờ: {detailItem.schedule.timeSlot} • {detailItem.schedule.dailyHours} giờ/ngày •{' '}
                {FREQUENCY_LABELS[detailItem.schedule.frequency]}
              </div>
              <div>
                Ngân sách dự kiến:{' '}
                <strong style={{ fontSize: '16px', color: '#16a34a' }}>
                  {formatVND(detailItem.expectedBudget)}
                </strong>
              </div>
            </div>

            {/* Special Requirements */}
            {detailItem.specialRequirements && detailItem.specialRequirements.length > 0 && (
              <div>
                <h4 style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
                  Yêu cầu đối với người chăm sóc:
                </h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {detailItem.specialRequirements.map((r) => (
                    <span
                      key={r}
                      style={{
                        padding: '5px 12px',
                        backgroundColor: '#eff6ff',
                        color: '#1d4ed8',
                        borderRadius: '999px',
                        fontSize: '12.5px',
                        fontWeight: 500,
                      }}
                    >
                      ✓ {r}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Customer Trust info */}
            {detailItem.customer && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  backgroundColor: '#f0fdf4',
                  borderRadius: '12px',
                  border: '1px solid #bbf7d0',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <ShieldCheck size={20} className="text-emerald-600" />
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#14532d' }}>
                      Đăng bởi: {detailItem.customer.fullName}
                    </div>
                    <div style={{ fontSize: '12px', color: '#166534' }}>
                      Điểm uy tín khách hàng: {detailItem.customer.reputationScore ?? 100}/100
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '10px' }}>
              <button
                type="button"
                onClick={() => setDetailItem(null)}
                style={{
                  padding: '11px 20px',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  background: '#fff',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={() => handleInitiateDecision(detailItem, 'accept')}
                style={{
                  padding: '11px 26px',
                  borderRadius: '10px',
                  border: 'none',
                  backgroundColor: '#2563eb',
                  color: '#fff',
                  fontSize: '14px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(37, 99, 235, 0.3)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <CheckCircle2 size={18} />
                Tiếp nhận yêu cầu này
              </button>
              <button
                type="button"
                onClick={() => handleInitiateDecision(detailItem, 'decline')}
                style={{
                  padding: '11px 20px',
                  borderRadius: '10px',
                  border: '1px solid #fecaca',
                  background: '#fff',
                  color: '#b91c1c',
                  fontSize: '14px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Từ chối yêu cầu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmItem && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 10000,
            backgroundColor: 'rgba(15, 23, 42, 0.7)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
          onClick={() => setConfirmItem(null)}
        >
          <div
            style={{
              backgroundColor: '#fff',
              borderRadius: '18px',
              padding: '26px',
              maxWidth: '500px',
              width: '100%',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  backgroundColor: confirmAction === 'accept' ? '#eff6ff' : '#fef2f2',
                  color: confirmAction === 'accept' ? '#2563eb' : '#dc2626',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {confirmAction === 'accept' ? <CheckCircle2 size={24} /> : <AlertCircle size={24} />}
              </div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
                {confirmAction === 'accept'
                  ? 'Xác nhận tiếp nhận yêu cầu?'
                  : 'Xác nhận từ chối yêu cầu?'}
              </h3>
            </div>

            <p style={{ fontSize: '14px', color: '#475569', lineHeight: 1.6, margin: '0 0 16px' }}>
              {confirmAction === 'accept' ? (
                <>
                  Bạn đang nhận công việc: <strong>"{confirmItem.title}"</strong>.
                  <br />
                  Ngân sách: <strong>{formatVND(confirmItem.expectedBudget)}</strong> tại {confirmItem.location.area}.
                  <br />
                  Sau khi xác nhận, hệ thống sẽ kết nối trực tiếp bạn với khách hàng và cung cấp số điện thoại liên lạc.
                </>
              ) : (
                <>
                  Bạn không nhận công việc: <strong>"{confirmItem.title}"</strong>.
                  <br />
                  Yêu cầu sẽ không còn xuất hiện trong bảng tin của bạn nhưng vẫn mở cho người chăm sóc khác.
                </>
              )}
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setConfirmItem(null)}
                disabled={submittingDecision}
                style={{
                  padding: '10px 18px',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  background: '#fff',
                  fontSize: '13.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmDecision}
                disabled={submittingDecision}
                style={{
                  padding: '10px 22px',
                  borderRadius: '10px',
                  border: 'none',
                  backgroundColor: confirmAction === 'accept' ? '#2563eb' : '#dc2626',
                  color: '#fff',
                  fontSize: '13.5px',
                  fontWeight: 700,
                  cursor: submittingDecision ? 'not-allowed' : 'pointer',
                  boxShadow: confirmAction === 'accept'
                    ? '0 4px 12px rgba(37, 99, 235, 0.25)'
                    : '0 4px 12px rgba(220, 38, 38, 0.2)',
                }}
              >
                {submittingDecision
                  ? 'Đang cập nhật...'
                  : confirmAction === 'accept'
                  ? 'Đồng ý tiếp nhận'
                  : 'Xác nhận từ chối'}
              </button>
            </div>
          </div>
        </div>
      )}
        </>
      ) : null}
    </div>
  );
};

export default CaregiverMarketplacePage;
