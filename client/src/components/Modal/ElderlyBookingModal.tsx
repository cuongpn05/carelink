import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Heart, ShieldCheck, CheckCircle2, AlertCircle, Calendar, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { Caregiver } from '../../types';
import { createBooking, BookingPackage } from '../../services/bookingService';
import { LocationPicker, LocationPickerValue } from '../LocationPicker';
import './ElderlyBookingModal.css';

interface ElderlyBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  caregiver: Caregiver;
}

interface PackageOption {
  id: BookingPackage;
  name: string;
  durationValue: number;
  desc: string;
}

const PACKAGES: PackageOption[] = [
  { id: 'HOURLY', name: 'Ca 2 tiếng', durationValue: 2, desc: 'Hỗ trợ sinh hoạt nhanh' },
  { id: 'HOURLY', name: 'Ca 4 tiếng', durationValue: 4, desc: 'Chăm sóc nửa ngày' },
  { id: 'HOURLY', name: 'Ca 6 tiếng', durationValue: 6, desc: 'Chăm sóc buổi trưa / chiều' },
  { id: 'HOURLY', name: 'Ca 8 tiếng', durationValue: 8, desc: 'Ca ban ngày / ban đêm' },
  { id: 'HOURLY', name: 'Ca 12 tiếng', durationValue: 12, desc: 'Ca ngày dài hoặc trông đêm' },
  { id: 'DAILY', name: 'Theo ngày (24h)', durationValue: 1, desc: 'Nuôi bệnh nội trú 24/24' },
];

export const ElderlyBookingModal: React.FC<ElderlyBookingModalProps> = ({
  isOpen,
  onClose,
  caregiver,
}) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Step 1: Package & Schedule
  const [selectedPkgIndex, setSelectedPkgIndex] = useState(0);
  const [startDate, setStartDate] = useState(
    new Date(Date.now() + 24 * 3600 * 1000).toISOString().split('T')[0]
  );
  const [startHour, setStartHour] = useState('08:00');

  // Step 2: Care notes
  const [careNotes, setCareNotes] = useState(
    'Cụ ông 78 tuổi bị tai biến nhẹ, đi lại cần dìu, ăn uống theo chế độ tiểu đường.'
  );

  // Step 3: Location
  const [locationValue, setLocationValue] = useState<LocationPickerValue>({
    placeType: 'home',
    recipientName: '',
    recipientPhone: '',
    provinceCode: '92',
    provinceName: 'Cần Thơ',
    wardCode: 'NK',
    wardName: 'Ninh Kiều',
    detail: '',
    fullAddress: '',
    coordinates: [105.7825, 10.0342],
  });

  const selectedPkg = PACKAGES[selectedPkgIndex];

  // Pricing calculation
  const hourlyRate = caregiver.pricing?.hourlyRate || caregiver.hourlyRate || 100000;
  const dailyRate = caregiver.pricing?.dailyRate || hourlyRate * 10 || 800000;
  const baseRate = selectedPkg.id === 'DAILY' ? dailyRate : hourlyRate;
  const servicePrice = baseRate * selectedPkg.durationValue;

  // Haversine distance client-side estimate for cost breakdown
  const caregiverCoords = (caregiver as any).serviceLocation?.coordinates || [105.7825, 10.0342];
  const destCoords = locationValue.coordinates || [105.7825, 10.0342];

  const distanceKm = useMemo(() => {
    const [lon1, lat1] = caregiverCoords;
    const [lon2, lat2] = destCoords;
    const R = 6371;
    const toRad = (d: number) => (d * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 10) / 10;
  }, [caregiverCoords, destCoords]);

  const distanceFee = distanceKm <= 5 ? 0 : Math.ceil(distanceKm - 5) * 10000;
  const totalPrice = servicePrice + distanceFee;

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!locationValue.recipientName || !locationValue.recipientPhone) {
      setError('Vui lòng nhập họ tên và số điện thoại người liên hệ.');
      return;
    }

    if (!locationValue.detail) {
      setError('Vui lòng nhập số nhà, tên đường hoặc chọn từ Sổ địa chỉ.');
      return;
    }

    const startDateTime = new Date(`${startDate}T${startHour}`);
    if (startDateTime <= new Date()) {
      setError('Thời gian bắt đầu phải ở trong tương lai.');
      return;
    }

    try {
      setLoading(true);
      await createBooking({
        caregiverId: caregiver.id,
        packageType: selectedPkg.id,
        durationValue: selectedPkg.durationValue,
        startTime: startDateTime.toISOString(),
        serviceArea: locationValue.wardName || locationValue.provinceName || 'Cần Thơ',
        serviceAddress: locationValue.fullAddress || locationValue.detail,
        careNotes: careNotes.trim(),
        note: careNotes.trim(),
        paymentMethod: 'CASH',
        location: {
          placeType: 'home',
          recipientName: locationValue.recipientName,
          recipientPhone: locationValue.recipientPhone,
          provinceCode: locationValue.provinceCode,
          provinceName: locationValue.provinceName,
          wardCode: locationValue.wardCode,
          wardName: locationValue.wardName,
          detail: locationValue.detail,
          fullAddress: locationValue.fullAddress || locationValue.detail,
          coordinates: locationValue.coordinates,
        },
      });

      toast.success('Đã gửi yêu cầu đặt lịch chăm sóc người cao tuổi thành công!');
      onClose();
      navigate('/bookings');
    } catch (err: any) {
      console.error('Booking submission error:', err);
      setError(err?.response?.data?.message || err?.message || 'Có lỗi xảy ra khi tạo lịch đặt.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="elderly-modal-overlay">
      <div className="elderly-modal-card">
        {/* Header */}
        <div className="elderly-modal-header">
          <div className="elderly-modal-title-wrap">
            <div className="elderly-modal-icon">
              <Heart size={22} />
            </div>
            <div>
              <h2 className="elderly-modal-title">Đặt lịch Chăm sóc Người cao tuổi</h2>
              <p className="elderly-modal-subtitle">
                Định vị vị trí địa lý & Tính phí di chuyển minh bạch
              </p>
            </div>
          </div>
          <button type="button" className="elderly-modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit}>
          <div className="elderly-modal-body">
            {/* Caregiver Mini Profile */}
            <div className="elderly-caregiver-summary">
              <img src={caregiver.avatar} alt={caregiver.name} className="elderly-cg-avatar" />
              <div>
                <div className="elderly-cg-name">{caregiver.name}</div>
                <div className="elderly-cg-rate">
                  Giá gốc: {new Intl.NumberFormat('vi-VN').format(hourlyRate)} đ/giờ
                </div>
              </div>
            </div>

            {error && (
              <div
                style={{
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: 8,
                  padding: '10px 14px',
                  color: '#b91c1c',
                  fontSize: 13,
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            {/* Bước 1: Gói thời gian */}
            <div className="elderly-step-card">
              <div className="elderly-step-title">
                <span className="elderly-step-number">1</span>
                <span>Chọn gói thời gian phục vụ</span>
              </div>
              <div className="package-buttons-grid">
                {PACKAGES.map((pkg, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className={`package-btn ${selectedPkgIndex === idx ? 'active' : ''}`}
                    onClick={() => setSelectedPkgIndex(idx)}
                  >
                    <span className="package-btn-name">{pkg.name}</span>
                    <span className="package-btn-desc">{pkg.desc}</span>
                  </button>
                ))}
              </div>

              <div className="datetime-row">
                <div className="datetime-input-group">
                  <label>
                    <Calendar size={13} style={{ display: 'inline', marginRight: 4 }} />
                    Ngày bắt đầu
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                  />
                </div>
                <div className="datetime-input-group">
                  <label>
                    <Clock size={13} style={{ display: 'inline', marginRight: 4 }} />
                    Giờ bắt đầu
                  </label>
                  <input
                    type="time"
                    value={startHour}
                    onChange={(e) => setStartHour(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Bước 2: Tình trạng sức khỏe */}
            <div className="elderly-step-card">
              <div className="elderly-step-title">
                <span className="elderly-step-number">2</span>
                <span>Ghi chú tình trạng sức khỏe & yêu cầu chăm sóc</span>
              </div>
              <textarea
                className="care-notes-textarea"
                rows={3}
                placeholder="VD: Cụ ông 78 tuổi bị tai biến nhẹ, đi lại cần dìu, ăn uống theo chế độ tiểu đường..."
                value={careNotes}
                onChange={(e) => setCareNotes(e.target.value)}
                required
              />
            </div>

            {/* Bước 3: Địa điểm qua LocationPicker */}
            <div className="elderly-step-card">
              <div className="elderly-step-title">
                <span className="elderly-step-number">3</span>
                <span>Địa điểm chăm sóc (Tại Nhà hoặc Bệnh viện)</span>
              </div>
              <LocationPicker
                value={locationValue}
                onChange={setLocationValue}
                caregiverCoords={caregiverCoords}
                caregiverServiceRadius={(caregiver as any).serviceRadius || 15}
              />
            </div>

            {/* Bước 4: Tóm tắt chi phí minh bạch */}
            <div className="elderly-step-card">
              <div className="elderly-step-title">
                <span className="elderly-step-number">4</span>
                <span>Tóm tắt chi phí dịch vụ</span>
              </div>
              <div className="cost-summary-card">
                <div className="cost-row">
                  <span>Phí dịch vụ chăm sóc ({selectedPkg.name}):</span>
                  <strong>{new Intl.NumberFormat('vi-VN').format(servicePrice)} đ</strong>
                </div>

                <div className="cost-row">
                  <span>
                    Phụ phí di chuyển ({distanceKm} km
                    {distanceKm > 5
                      ? ` - Vượt ${(distanceKm - 5).toFixed(1)} km`
                      : ' - Miễn phí dưới 5 km'}
                    ):
                  </span>
                  <strong style={{ color: distanceFee > 0 ? '#d97706' : '#16a34a' }}>
                    {distanceFee > 0
                      ? `+ ${new Intl.NumberFormat('vi-VN').format(distanceFee)} đ`
                      : '0 đ (Miễn phí)'}
                  </strong>
                </div>

                <div className="cost-row total-row">
                  <span>TỔNG CỘNG:</span>
                  <span className="cost-total-amount">
                    {new Intl.NumberFormat('vi-VN').format(totalPrice)} đ
                  </span>
                </div>

                <div className="payment-note-box">
                  💡 <strong>Hình thức thanh toán:</strong> Thanh toán trực tiếp bằng tiền mặt cho người chăm sóc sau khi kết thúc ca làm việc.
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="elderly-modal-footer">
            <button type="button" className="elderly-cancel-btn" onClick={onClose} disabled={loading}>
              Hủy
            </button>
            <button type="submit" className="elderly-submit-btn" disabled={loading}>
              <CheckCircle2 size={16} />
              <span>{loading ? 'Đang gửi yêu cầu...' : 'Xác nhận đặt lịch'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

