import React, { useEffect, useState } from 'react';
import { Caregiver } from '../../types';
import { getCaregiverById } from '../../services/caregiverService';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
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
import { ElderlyBookingModal } from './ElderlyBookingModal';
import './CaregiverDetailModal.css';

interface CaregiverDetailModalProps {
  caregiver: Caregiver | null;
  onClose: () => void;
  startWithBookingForm?: boolean;
  onBook?: (caregiver: Caregiver) => void;
}

export const CaregiverDetailModal: React.FC<CaregiverDetailModalProps> = ({ 
  caregiver, 
  onClose,
  startWithBookingForm = false,
  onBook,
}) => {
  const { account, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [detailCaregiver, setDetailCaregiver] = useState<Caregiver | null>(caregiver);
  const [detailLoading, setDetailLoading] = useState(false);
  const [elderlyModalOpen, setElderlyModalOpen] = useState(startWithBookingForm);

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

  useEffect(() => {
    if (!caregiver) {
      setDetailCaregiver(null);
      return;
    }

    let active = true;
    setDetailCaregiver(caregiver);
    setDetailLoading(true);

    getCaregiverById(caregiver.id)
      .then((result) => {
        if (active) {
          setDetailCaregiver(result);
        }
      })
      .catch(() => {
        // Fallback to initial caregiver object
      })
      .finally(() => {
        if (active) setDetailLoading(false);
      });

    return () => {
      active = false;
    };
  }, [caregiver]);

  if (!caregiver) return null;

  const displayedCaregiver = detailCaregiver?.id === caregiver.id ? detailCaregiver : caregiver;

  const handleBookNow = () => {
    if (!isAuthenticated) {
      toast.error('Vui lòng đăng nhập để đặt lịch chăm sóc.');
      navigate('/login');
      return;
    }

    if (account?.role !== 'CUSTOMER') {
      toast.error('Chỉ tài khoản khách hàng mới có thể đặt lịch.');
      return;
    }

    if (onBook && displayedCaregiver) {
      onBook(displayedCaregiver);
      return;
    }

    setElderlyModalOpen(true);
  };

  const hourlyRateFormatted = new Intl.NumberFormat('vi-VN').format(
    displayedCaregiver.pricing?.hourlyRate || displayedCaregiver.hourlyRate || 100000
  );
  const price8hFormatted = new Intl.NumberFormat('vi-VN').format(
    (displayedCaregiver.pricing?.hourlyRate || displayedCaregiver.hourlyRate || 100000) * 8
  );

  return (
    <>
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
                  src={displayedCaregiver.avatar} 
                  alt={displayedCaregiver.name} 
                  className="modal-avatar"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src =
                      'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=400&q=80';
                  }}
                />
                {displayedCaregiver.isAvailable && (
                  <span className="modal-status-pill">
                    <span className="modal-status-dot" aria-hidden="true" />
                    Sẵn sàng nhận lịch
                  </span>
                )}
              </div>

              <div className="modal-caregiver-meta">
                <div className="tag-badge modal-tag">HỒ SƠ ĐÃ XÁC THỰC</div>
                <h2 id="modal-caregiver-name" className="modal-caregiver-name">{displayedCaregiver.name}</h2>
                <p className="modal-caregiver-role">{displayedCaregiver.title}</p>

                <div className="modal-stats-row">
                  <div className="modal-stat">
                    <Clock size={15} className="text-muted" />
                    <span>{displayedCaregiver.experienceYears} năm kinh nghiệm</span>
                  </div>
                  <div className="modal-stat">
                    <Star size={15} fill="#f59e0b" color="#f59e0b" />
                    <span className="stat-bold">{displayedCaregiver.rating || '4.9'}</span>
                    <span className="text-muted">({displayedCaregiver.reviewCount || 25} đánh giá)</span>
                  </div>
                  <div className="modal-stat">
                    <MapPin size={15} className="text-muted" />
                    <span>{displayedCaregiver.location || 'Cần Thơ'}</span>
                  </div>
                </div>

                <div className="modal-price-highlight" style={{ marginTop: 12 }}>
                  <span style={{ fontSize: 13, color: '#64748b' }}>Chi phí tham khảo: </span>
                  <strong style={{ fontSize: 16, color: '#16a34a' }}>{hourlyRateFormatted}đ / giờ</strong>
                  <span style={{ fontSize: 13, color: '#64748b' }}> (~{price8hFormatted}đ / ca 8h)</span>
                </div>
              </div>
            </div>

            {/* Bio */}
            <div className="modal-section">
              <h4 className="modal-section-title">Giới thiệu bản thân</h4>
              <p className="modal-bio-text">{displayedCaregiver.bio || 'Chăm chỉ, tận tâm và chu đáo trong việc chăm sóc người cao tuổi.'}</p>
            </div>

            {/* Skills */}
            <div className="modal-section">
              <h4 className="modal-section-title">Kỹ năng chuyên môn</h4>
              <div className="skills-badge-list">
                {(displayedCaregiver.skills && displayedCaregiver.skills.length > 0
                  ? displayedCaregiver.skills
                  : ['Chăm sóc người cao tuổi', 'Hỗ trợ sinh hoạt', 'Đồng hành']
                ).map((skill, index) => (
                  <span key={index} className="skill-pill">
                    <Check size={14} className="skill-check" />
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Certifications */}
            {displayedCaregiver.certifications && displayedCaregiver.certifications.length > 0 && (
              <div className="modal-section">
                <h4 className="modal-section-title">Chứng chỉ & Bằng cấp</h4>
                <div className="cert-list">
                  {displayedCaregiver.certifications.map((cert, index) => (
                    <div key={index} className="cert-item">
                      <ShieldCheck size={16} className="cert-icon" />
                      <span>{cert}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Footer Actions */}
            <div className="modal-footer-actions">
              {displayedCaregiver.phone && (
                <a href={`tel:${displayedCaregiver.phone}`} className="btn-modal-phone">
                  <Phone size={16} />
                  <span>{displayedCaregiver.phone}</span>
                </a>
              )}
              <button
                type="button"
                className="btn-modal-book"
                onClick={handleBookNow}
                disabled={detailLoading}
              >
                <Calendar size={18} />
                <span>
                  {!isAuthenticated
                    ? 'Đăng nhập để đặt lịch'
                    : account?.role === 'CUSTOMER'
                      ? 'Đặt lịch chăm sóc ngay'
                      : 'Chỉ khách hàng được đặt lịch'}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Synchronized Elderly Booking Modal (identical to direct "Đặt dịch vụ") */}
      {displayedCaregiver && (
        <ElderlyBookingModal
          isOpen={elderlyModalOpen}
          onClose={() => {
            setElderlyModalOpen(false);
            if (startWithBookingForm) {
              onClose();
            }
          }}
          caregiver={displayedCaregiver}
        />
      )}
    </>
  );
};
