import React, { useEffect } from 'react';
import { Caregiver } from '../../types';
import { 
  X, 
  Star, 
  Clock, 
  MapPin, 
  ShieldCheck, 
  Check, 
  Phone, 
  Calendar 
} from 'lucide-react';
import toast from 'react-hot-toast';
import './CaregiverDetailModal.css';

interface CaregiverDetailModalProps {
  caregiver: Caregiver | null;
  onClose: () => void;
}

export const CaregiverDetailModal: React.FC<CaregiverDetailModalProps> = ({ 
  caregiver, 
  onClose 
}) => {
  useEffect(() => {
    if (!caregiver) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [caregiver, onClose]);

  if (!caregiver) return null;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN').format(price) + 'đ/giờ';
  };

  const handleBookNow = () => {
    toast.success(`Đã chọn yêu cầu đặt lịch với ${caregiver.name}! Chức năng thanh toán & xếp lịch đang được hoàn thiện.`);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-container caregiver-modal-box animate-fade-in" 
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-caregiver-name"
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          type="button" 
          className="modal-close-btn" 
          onClick={onClose}
          aria-label="Đóng cửa sổ chi tiết (Phím ESC)"
          title="Đóng (ESC)"
        >
          <X size={20} aria-hidden="true" />
        </button>

        <div className="modal-body">
          {/* Header row with avatar and basic info */}
          <div className="caregiver-modal-header">
            <div className="modal-avatar-wrapper">
              <img 
                src={caregiver.avatar} 
                alt={caregiver.name} 
                className="modal-avatar"
              />
              {caregiver.isAvailable && (
                <span className="modal-status-pill">
                  <span className="modal-status-dot" aria-hidden="true" />
                  Sẵn sàng nhận lịch
                </span>
              )}
            </div>

            <div className="modal-caregiver-meta">
              <div className="tag-badge modal-tag">HỒ SƠ ĐÃ XÁC THỰC</div>
              <h2 id="modal-caregiver-name" className="modal-caregiver-name">{caregiver.name}</h2>
              <p className="modal-caregiver-role">{caregiver.title}</p>

              <div className="modal-stats-row">
                <div className="modal-stat">
                  <Clock size={15} className="text-muted" />
                  <span>{caregiver.experienceYears} năm kinh nghiệm</span>
                </div>
                <div className="modal-stat">
                  <Star size={15} fill="#f59e0b" color="#f59e0b" />
                  <span className="stat-bold">{caregiver.rating}</span>
                  <span className="text-muted">({caregiver.reviewCount} đánh giá)</span>
                </div>
                <div className="modal-stat">
                  <MapPin size={15} className="text-muted" />
                  <span>{caregiver.location}</span>
                </div>
              </div>

              <div className="modal-pricing-box">
                <span className="price-label">Giá dịch vụ:</span>
                <span className="modal-price-val">{formatPrice(caregiver.hourlyRate)}</span>
              </div>
            </div>
          </div>

          <div className="modal-divider" />

          {/* Bio */}
          <div className="modal-section">
            <h4 className="modal-section-title">Giới thiệu bản thân</h4>
            <p className="modal-bio-text">{caregiver.bio}</p>
          </div>

          {/* Skills */}
          <div className="modal-section">
            <h4 className="modal-section-title">Kỹ năng chuyên môn</h4>
            <div className="skills-badge-list">
              {caregiver.skills.map((skill, index) => (
                <span key={index} className="skill-pill">
                  <Check size={14} className="skill-check" />
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Certifications */}
          <div className="modal-section">
            <h4 className="modal-section-title">Chứng chỉ & Bằng cấp</h4>
            <div className="cert-list">
              {caregiver.certifications.map((cert, index) => (
                <div key={index} className="cert-item">
                  <ShieldCheck size={16} className="cert-icon" />
                  <span>{cert}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="modal-footer-actions">
            {caregiver.phone && (
              <a href={`tel:${caregiver.phone}`} className="btn-modal-phone">
                <Phone size={16} />
                <span>{caregiver.phone}</span>
              </a>
            )}
            <button
              type="button"
              className="btn-modal-book"
              onClick={handleBookNow}
            >
              <Calendar size={18} />
              <span>Đặt lịch chăm sóc ngay</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

