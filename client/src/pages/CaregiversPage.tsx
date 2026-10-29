import React, { FormEvent, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Search, Users } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { Navbar } from '../components/Header/Navbar';
import { Footer } from '../components/Footer/Footer';
import { FeaturedCaregivers } from '../components/Caregivers/FeaturedCaregivers';
import { CaregiverDetailModal } from '../components/Modal/CaregiverDetailModal';
import {
  CaregiverFilters,
  CaregiverSortField,
  getCaregivers,
} from '../services/caregiverService';
import { Caregiver } from '../types';
import './CaregiversPage.css';

interface FilterFormValues {
  keyword: string;
  minExperience: string;
  minPrice: string;
  maxPrice: string;
  minRating: string;
  area: string;
  skill: string;
  sortBy: CaregiverSortField;
  order: 'asc' | 'desc';
  limit: string;
}

const emptyFilters: FilterFormValues = {
  keyword: '',
  minExperience: '',
  minPrice: '',
  maxPrice: '',
  minRating: '',
  area: '',
  skill: '',
  sortBy: 'createdAt',
  order: 'desc',
  limit: '9',
};

const optionalNumber = (value: string): number | undefined =>
  value === '' ? undefined : Number(value);

export const CaregiversPage: React.FC = () => {
  const [selectedCaregiver, setSelectedCaregiver] = useState<Caregiver | null>(null);
  const [searchParams] = useSearchParams();
  const [formValues, setFormValues] = useState<FilterFormValues>(emptyFilters);
  const [appliedFilters, setAppliedFilters] = useState<FilterFormValues>(emptyFilters);
  const [page, setPage] = useState(1);
  const [caregivers, setCaregivers] = useState<Caregiver[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  const serviceFilter = searchParams.get('service');

  useEffect(() => {
    let active = true;
    const filters: CaregiverFilters = {
      keyword: appliedFilters.keyword.trim() || undefined,
      minExperience: optionalNumber(appliedFilters.minExperience),
      minPrice: optionalNumber(appliedFilters.minPrice),
      maxPrice: optionalNumber(appliedFilters.maxPrice),
      minRating: optionalNumber(appliedFilters.minRating),
      area: appliedFilters.area.trim() || undefined,
      skill: appliedFilters.skill.trim() || undefined,
      page,
      limit: Number(appliedFilters.limit),
      sortBy: appliedFilters.sortBy,
      order: appliedFilters.order,
    };

    const loadCaregivers = async () => {
      setLoading(true);
      setError(false);

      try {
        const result = await getCaregivers(filters);
        if (!active) return;
        setCaregivers(result.caregivers);
        setTotal(result.pagination.total);
        setTotalPages(result.pagination.totalPages);
      } catch {
        if (active) setError(true);
      } finally {
        if (active) setLoading(false);
      }
    };

    void loadCaregivers();
    return () => {
      active = false;
    };
  }, [appliedFilters, page, retryCount]);

  const updateField = <K extends keyof FilterFormValues>(
    field: K,
    value: FilterFormValues[K],
  ) => {
    setFormValues((current) => ({ ...current, [field]: value }));
  };

  const handleApplyFilters = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const minPrice = optionalNumber(formValues.minPrice);
    const maxPrice = optionalNumber(formValues.maxPrice);
    const minRating = optionalNumber(formValues.minRating);

    if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) {
      setValidationError('Giá tối thiểu không được lớn hơn giá tối đa.');
      return;
    }
    if (minRating !== undefined && (minRating < 0 || minRating > 5)) {
      setValidationError('Đánh giá phải nằm trong khoảng 0 đến 5.');
      return;
    }

    setValidationError('');
    setPage(1);
    setAppliedFilters({ ...formValues });
  };

  const handleResetFilters = () => {
    setFormValues(emptyFilters);
    setAppliedFilters(emptyFilters);
    setValidationError('');
    setPage(1);
  };

  return (
    <div className="caregivers-page-layout">
      <Navbar />
      <main className="caregivers-page">
        <section className="caregivers-page-heading">
          <div className="container">
            <div className="caregivers-page-copy">
              <span className="tag-badge">ĐỘI NGŨ ĐÃ XÁC MINH</span>
              <h1>Chọn người chăm sóc phù hợp</h1>
              <p>
                Lọc hồ sơ theo kinh nghiệm, mức phí, đánh giá, khu vực và kỹ năng.
              </p>
            </div>
          </div>
        </section>

        <section className="caregivers-filter-section">
          <div className="container">
            <form className="caregivers-filter-form" onSubmit={handleApplyFilters}>
              <label className="caregiver-filter-field caregiver-filter-keyword">
                <span>Tên người chăm sóc</span>
                <div className="caregiver-filter-input-wrap">
                  <Search size={17} aria-hidden="true" />
                  <input
                    value={formValues.keyword}
                    onChange={(event) => updateField('keyword', event.target.value)}
                    placeholder="Ví dụ: An"
                  />
                </div>
              </label>

              <label className="caregiver-filter-field">
                <span>Kinh nghiệm tối thiểu</span>
                <div className="caregiver-filter-input-wrap">
                  <input
                    type="number"
                    min="0"
                    value={formValues.minExperience}
                    onChange={(event) => updateField('minExperience', event.target.value)}
                    placeholder="0"
                  />
                  <span className="filter-unit">năm</span>
                </div>
              </label>

              <label className="caregiver-filter-field">
                <span>Giá tối thiểu</span>
                <div className="caregiver-filter-input-wrap">
                  <input
                    type="number"
                    min="0"
                    value={formValues.minPrice}
                    onChange={(event) => updateField('minPrice', event.target.value)}
                    placeholder="0"
                  />
                  <span className="filter-unit">đ/giờ</span>
                </div>
              </label>

              <label className="caregiver-filter-field">
                <span>Giá tối đa</span>
                <div className="caregiver-filter-input-wrap">
                  <input
                    type="number"
                    min="0"
                    value={formValues.maxPrice}
                    onChange={(event) => updateField('maxPrice', event.target.value)}
                    placeholder="Không giới hạn"
                  />
                  <span className="filter-unit">đ/giờ</span>
                </div>
              </label>

              <label className="caregiver-filter-field">
                <span>Đánh giá tối thiểu</span>
                <div className="caregiver-filter-input-wrap">
                  <input
                    type="number"
                    min="0"
                    max="5"
                    step="0.1"
                    value={formValues.minRating}
                    onChange={(event) => updateField('minRating', event.target.value)}
                    placeholder="0 - 5"
                  />
                  <span className="filter-unit">/ 5</span>
                </div>
              </label>

              <label className="caregiver-filter-field">
                <span>Khu vực</span>
                <input
                  value={formValues.area}
                  onChange={(event) => updateField('area', event.target.value)}
                  placeholder="Ví dụ: Ninh Kieu"
                />
              </label>

              <label className="caregiver-filter-field">
                <span>Kỹ năng</span>
                <input
                  value={formValues.skill}
                  onChange={(event) => updateField('skill', event.target.value)}
                  placeholder="Ví dụ: Chăm sóc người cao tuổi"
                />
              </label>

              <label className="caregiver-filter-field">
                <span>Sắp xếp theo</span>
                <select
                  value={formValues.sortBy}
                  onChange={(event) => updateField('sortBy', event.target.value as CaregiverSortField)}
                >
                  <option value="createdAt">Mới nhất</option>
                  <option value="hourlyRate">Giá dịch vụ</option>
                  <option value="experienceYears">Kinh nghiệm</option>
                  <option value="ratingAvg">Đánh giá</option>
                  <option value="reviewCount">Số lượt đánh giá</option>
                </select>
              </label>

              <label className="caregiver-filter-field">
                <span>Thứ tự</span>
                <select
                  value={formValues.order}
                  onChange={(event) => updateField('order', event.target.value as 'asc' | 'desc')}
                >
                  <option value="desc">Giảm dần</option>
                  <option value="asc">Tăng dần</option>
                </select>
              </label>

              <label className="caregiver-filter-field caregiver-page-size">
                <span>Số kết quả mỗi trang</span>
                <select
                  value={formValues.limit}
                  onChange={(event) => updateField('limit', event.target.value)}
                >
                  <option value="6">6</option>
                  <option value="9">9</option>
                  <option value="12">12</option>
                  <option value="24">24</option>
                </select>
              </label>

              <div className="caregiver-filter-actions">
                <button className="caregiver-filter-submit" type="submit">
                  <Search size={17} aria-hidden="true" />
                  Lọc danh sách
                </button>
                <button className="caregiver-filter-reset" type="button" onClick={handleResetFilters}>
                  Xóa bộ lọc
                </button>
              </div>
              {validationError && <p className="caregiver-filter-error" role="alert">{validationError}</p>}
            </form>
          </div>
        </section>

        <section className="caregivers-results" aria-live="polite">
          <div className="container">
            <div className="caregivers-results-heading">
              <div>
                <h2>Danh sách người chăm sóc</h2>
                <p>
                  {loading
                    ? 'Đang tải hồ sơ...'
                    : `${total} hồ sơ phù hợp${totalPages ? ` · Trang ${page}/${totalPages}` : ''}`}
                </p>
              </div>
              {!loading && !error && (
                <span className="caregivers-total">
                  <Users size={16} aria-hidden="true" />
                  {caregivers.length} người trên trang này
                </span>
              )}
            </div>

            {serviceFilter && (
              <p className="caregivers-filter-note">
                API hiện chưa có bộ lọc theo dịch vụ; bạn có thể lọc bằng các tiêu chí bên dưới.
              </p>
            )}

            {loading && <div className="caregivers-state">Đang tải danh sách caregiver...</div>}

            {!loading && error && (
              <div className="caregivers-state caregivers-state-error" role="alert">
                <p>Không thể tải danh sách caregiver. Hãy kiểm tra kết nối API rồi thử lại.</p>
                <button type="button" onClick={() => setRetryCount((count) => count + 1)}>
                  Thử tải lại
                </button>
              </div>
            )}

            {!loading && !error && caregivers.length === 0 && (
              <div className="caregivers-state">Không tìm thấy caregiver phù hợp với bộ lọc.</div>
            )}

            {!loading && !error && caregivers.length > 0 && (
              <FeaturedCaregivers
                caregivers={caregivers}
                onViewDetails={setSelectedCaregiver}
                showSectionHeader={false}
              />
            )}

            {!loading && !error && totalPages > 1 && (
              <nav className="caregivers-pagination" aria-label="Phân trang danh sách caregiver">
                <button
                  type="button"
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  disabled={page <= 1}
                  aria-label="Trang trước"
                >
                  <ChevronLeft size={18} />
                  Trước
                </button>
                <span>Trang {page} / {totalPages}</span>
                <button
                  type="button"
                  onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                  disabled={page >= totalPages}
                  aria-label="Trang tiếp theo"
                >
                  Sau
                  <ChevronRight size={18} />
                </button>
              </nav>
            )}
          </div>
        </section>
      </main>

      <Footer />
      <CaregiverDetailModal
        caregiver={selectedCaregiver}
        onClose={() => setSelectedCaregiver(null)}
      />
    </div>
  );
};