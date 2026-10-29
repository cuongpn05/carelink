import React from 'react';
import { Link } from 'react-router-dom';
import { Star, Clock, ArrowRight } from 'lucide-react';
import { Caregiver } from '../../types';
import './FeaturedCaregivers.css';

interface FeaturedCaregiversProps {
  onViewDetails: (caregiver: Caregiver) => void;
  caregivers: Caregiver[];
  showSectionHeader?: boolean;
  loading?: boolean;
  error?: boolean;
  onRetry?: () => void;
}

export const FeaturedCaregivers: React.FC<FeaturedCaregiversProps> = ({
  onViewDetails,
  caregivers,
  showSectionHeader = true,
  loading = false,
  error = false,
  onRetry,
}) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN').format(price) + 'đ/giờ';
  };

  return (
    <section className="caregivers-section">
      <div className="container">
        {/* Section Header */}
        {showSectionHeader && (
          <div className="section-header">
            <div className="section-header-left">
              <div className="tag-badge">
                <span>ĐỘI NGŨ CHĂM SÓC</span>
              </div>
              <h2 className="section-title">Người chăm sóc nổi bật</h2>
              <p className="section-subtitle">
                Tham khảo hồ sơ và lựa chọn người phù hợp với nhu cầu.
              </p>
            </div>
            <Link to="/caregivers" className="section-link-more">
              <span>Xem tất cả</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        )}

        {/* Caregiver Cards */}
        <div className="caregivers-grid">
          {loading ? (
            <div className="caregiver-list-state" role="status">Đang tải người chăm sóc nổi bật...</div>
          ) : error ? (
            <div className="caregiver-list-state" role="alert">
              <span>Không thể tải danh sách người chăm sóc.</span>
              {onRetry && (
                <button type="button" onClick={onRetry}>Thử tải lại</button>
              )}
            </div>
          ) : caregivers.length === 0 ? (
            <div className="caregiver-list-state">Hiện chưa có người chăm sóc nổi bật.</div>
          ) : caregivers.map((cg) => (
            <div key={cg.id} className="caregiver-card">
              <div className="caregiver-card-inner">
                {/* Avatar Left */}
                <div className="caregiver-avatar-container">
                  <img
                    src={cg.avatar}
                    alt={cg.name}
                    className="caregiver-avatar"
                  />
                  {cg.isAvailable && (
                    <span
                      className="available-badge"
                      title="Đang sẵn sàng nhận lịch"
                      role="status"
                      aria-label="Đang sẵn sàng nhận lịch"
                    >
                      <span className="available-dot" aria-hidden="true" />
                    </span>
                  )}
                </div>

                {/* Details Right */}
                <div className="caregiver-details">
                  <div className="caregiver-header-info">
                    <h3 className="caregiver-name">{cg.name}</h3>
                    <p className="caregiver-role">{cg.title}</p>
                  </div>

                  {/* Experience */}
                  <div className="caregiver-meta-row">
                    <Clock size={14} className="meta-icon text-muted" aria-hidden="true" />
                    <span>{cg.experienceYears} năm kinh nghiệm</span>
                  </div>

                  {/* Rating */}
                  <div className="caregiver-meta-row rating-row">
                    <Star size={14} className="star-icon" fill="#f59e0b" color="#f59e0b" aria-hidden="true" />
                    <span className="rating-score">{cg.rating}</span>
                    <span className="review-count">({cg.reviewCount} đánh giá)</span>
                  </div>

                  {/* Price & Action */}
                  <div className="caregiver-footer">
                    <div className="caregiver-rate">
                      {formatPrice(cg.hourlyRate)}
                    </div>
                    <button
                      type="button"
                      className="btn-view-profile"
                      onClick={() => onViewDetails(cg)}
                    >
                      Xem chi tiết
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

