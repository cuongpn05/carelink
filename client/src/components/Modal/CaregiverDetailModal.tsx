import React, { FormEvent, useEffect, useMemo, useState } from 'react';
import { Caregiver } from '../../types';
import { getCaregiverById } from '../../services/caregiverService';
import { Booking, BookingPackage, createBooking } from '../../services/bookingService';
import {
  getAdministrativeProvinces,
  getAdministrativeWards,
  ProvinceItem,
  WardItem,
} from '../../services/userService';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  X, 
  Star, 
  Clock, 
  MapPin, 
  ChevronDown,
  ShieldCheck, 
  Check, 
  Phone, 
  Calendar 
} from 'lucide-react';
import toast from 'react-hot-toast';
import { ElderlyBookingModal } from './ElderlyBookingModal';
import { Heart } from 'lucide-react';
import './CaregiverDetailModal.css';

const packageUnitByType: Record<BookingPackage, string> = {
  HOURLY: 'giờ',
  DAILY: 'ngày',
  WEEKLY: 'tuần',
  MONTHLY: 'tháng',
};

const packageDurationMs: Record<BookingPackage, number> = {
  HOURLY: 60 * 60 * 1000,
  DAILY: 24 * 60 * 60 * 1000,
  WEEKLY: 7 * 24 * 60 * 60 * 1000,
  MONTHLY: 30 * 24 * 60 * 60 * 1000,
};

const normalizeLocationSearch = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();

interface LocationOption {
  code: string;
  name: string;
}

interface SearchableLocationSelectProps {
  id: string;
  label: string;
  placeholder: string;
  options: LocationOption[];
  value: string;
  disabled?: boolean;
  loading?: boolean;
  onChange: (value: string) => void;
}

const SearchableLocationSelect: React.FC<SearchableLocationSelectProps> = ({
  id,
  label,
  placeholder,
  options,
  value,
  disabled = false,
  loading = false,
  onChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const selectedOption = options.find((option) => option.code === value);
  const filteredOptions = useMemo(() => {
    const query = normalizeLocationSearch(search);
    return query
      ? options.filter((option) => normalizeLocationSearch(option.name).includes(query))
      : options;
  }, [options, search]);

  const selectOption = (option: LocationOption) => {
    onChange(option.code);
    setSearch('');
    setIsOpen(false);
  };

  const openDropdown = () => {
    if (disabled || loading) return;
    setSearch('');
    setActiveIndex(Math.max(options.findIndex((option) => option.code === value), 0));
    setIsOpen(true);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setIsOpen(true);
      if (filteredOptions.length > 0) {
        setActiveIndex((index) => Math.min(index + 1, filteredOptions.length - 1));
      }
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, 0));
    } else if (event.key === 'Enter' && isOpen && filteredOptions[activeIndex]) {
      event.preventDefault();
      selectOption(filteredOptions[activeIndex]);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      setIsOpen(false);
      setSearch('');
    }
  };

  return (
    <div className="booking-location-field">
      <label htmlFor={id}>{label}</label>
      <div
        className="searchable-location-select"
        onBlur={(event) => {
          if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;
          setIsOpen(false);
          setSearch('');
        }}
      >
        <input
          id={id}
          type="text"
          className="searchable-location-input"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={isOpen}
          aria-controls={`${id}-options`}
          aria-activedescendant={
            isOpen && filteredOptions[activeIndex]
              ? `${id}-option-${filteredOptions[activeIndex].code}`
              : undefined
          }
          autoComplete="off"
          value={isOpen ? search : selectedOption?.name || ''}
          onFocus={openDropdown}
          onClick={() => {
            if (!isOpen) openDropdown();
          }}
          onChange={(event) => {
            setSearch(event.target.value);
            setActiveIndex(0);
            setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder={loading ? 'Đang tải danh sách...' : placeholder}
          disabled={disabled || loading}
        />
        <ChevronDown className="searchable-location-chevron" size={16} aria-hidden="true" />
        {isOpen && !disabled && !loading && (
          <div className="searchable-location-menu">
            <div className="searchable-location-options" id={`${id}-options`} role="listbox">
              {filteredOptions.length > 0 ? filteredOptions.map((option, index) => (
                <button
                  type="button"
                  id={`${id}-option-${option.code}`}
                  key={option.code}
                  role="option"
                  aria-selected={option.code === value}
                  className={index === activeIndex ? 'active' : ''}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => selectOption(option)}
                >
                  {option.name}
                </button>
              )) : (
                <span className="location-search-empty" role="status">
                  Không tìm thấy kết quả phù hợp
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

interface CaregiverDetailModalProps {
  caregiver: Caregiver | null;
  onClose: () => void;
  startWithBookingForm?: boolean;
}

export const CaregiverDetailModal: React.FC<CaregiverDetailModalProps> = ({ 
  caregiver, 
  onClose,
  startWithBookingForm = false,
}) => {
  const { account, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [detailCaregiver, setDetailCaregiver] = useState<Caregiver | null>(caregiver);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  const [bookingFormOpen, setBookingFormOpen] = useState(false);
  const [elderlyModalOpen, setElderlyModalOpen] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState('');
  const [createdBooking, setCreatedBooking] = useState<Booking | null>(null);
  const [packageType, setPackageType] = useState<BookingPackage>('HOURLY');
  const [durationValue, setDurationValue] = useState(2);
  const [startDate, setStartDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return toLocalDateInput(tomorrow);
  });
  const [startHour, setStartHour] = useState('08:00');
  const [provinces, setProvinces] = useState<ProvinceItem[]>([]);
  const [wards, setWards] = useState<WardItem[]>([]);
  const [provinceCode, setProvinceCode] = useState('');
  const [wardCode, setWardCode] = useState('');
  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingWards, setLoadingWards] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [serviceAddress, setServiceAddress] = useState('');
  const [note, setNote] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'BANK_TRANSFER'>('CASH');

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
      setBookingFormOpen(false);
      setCreatedBooking(null);
      return;
    }

    let active = true;
    setDetailCaregiver(caregiver);
    setBookingFormOpen(startWithBookingForm);
    setCreatedBooking(null);
    setBookingError('');
    setDetailLoading(true);
    setDetailError('');

    getCaregiverById(caregiver.id)
      .then((result) => {
        if (active) {
          setDetailCaregiver(result);
        }
      })
      .catch((error: unknown) => {
        if (active) {
          setDetailError(error instanceof Error ? error.message : 'Không thể tải chi tiết caregiver.');
        }
      })
      .finally(() => {
        if (active) setDetailLoading(false);
      });

    return () => {
      active = false;
    };
  }, [caregiver, retryCount, startWithBookingForm]);

  useEffect(() => {
    if (!caregiver || !bookingFormOpen) return undefined;

    let active = true;
    setLoadingProvinces(true);
    setLocationError('');
    getAdministrativeProvinces()
      .then((items) => {
        if (active) setProvinces(items);
      })
      .catch((error: unknown) => {
        if (active) {
          setLocationError(
            error instanceof Error ? error.message : 'Không thể tải danh sách tỉnh/thành.',
          );
        }
      })
      .finally(() => {
        if (active) setLoadingProvinces(false);
      });

    return () => {
      active = false;
    };
  }, [caregiver, bookingFormOpen]);

  useEffect(() => {
    if (!provinceCode || !bookingFormOpen) {
      setWards([]);
      setWardCode('');
      return undefined;
    }

    let active = true;
    setLoadingWards(true);
    setWards([]);
    setLocationError('');
    getAdministrativeWards(provinceCode)
      .then((items) => {
        if (active) setWards(items);
      })
      .catch((error: unknown) => {
        if (active) {
          setLocationError(
            error instanceof Error ? error.message : 'Không thể tải danh sách phường/xã.',
          );
        }
      })
      .finally(() => {
        if (active) setLoadingWards(false);
      });

    return () => {
      active = false;
    };
  }, [provinceCode, bookingFormOpen]);

  const displayedCaregiver = caregiver
    ? detailCaregiver?.id === caregiver.id ? detailCaregiver : caregiver
    : null;
  const availablePackages = useMemo(() => {
    const pricing = displayedCaregiver?.pricing;
    return [
      {
        value: 'HOURLY' as const,
        label: 'Theo giờ',
        rate: pricing?.hourlyRate ?? displayedCaregiver?.hourlyRate,
      },
      { value: 'DAILY' as const, label: 'Theo ngày', rate: pricing?.dailyRate },
      { value: 'WEEKLY' as const, label: 'Theo tuần', rate: pricing?.weeklyRate },
      { value: 'MONTHLY' as const, label: 'Theo tháng (30 ngày)', rate: pricing?.monthlyRate },
    ].filter((item) => typeof item.rate === 'number' && item.rate >= 0);
  }, [displayedCaregiver]);
  useEffect(() => {
    if (!availablePackages.some((item) => item.value === packageType) && availablePackages[0]) {
      setPackageType(availablePackages[0].value);
      setDurationValue(availablePackages[0].value === 'HOURLY' ? 2 : 1);
    }
  }, [availablePackages, packageType]);
  const selectedPackage = availablePackages.find((item) => item.value === packageType);
  const packageUnit = packageUnitByType[packageType];
  const estimatedEndTime = useMemo(() => {
    if (!startDate || !startHour || !Number.isInteger(durationValue) || durationValue < 1) {
      return null;
    }

    const start = new Date(`${startDate}T${startHour}`);
    if (!Number.isFinite(start.getTime())) return null;

    return new Date(start.getTime() + packageDurationMs[packageType] * durationValue);
  }, [durationValue, packageType, startDate, startHour]);
  const estimatedTotal = typeof selectedPackage?.rate === 'number'
    ? selectedPackage.rate * durationValue
    : null;

  if (!caregiver || !displayedCaregiver) return null;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN').format(price) + 'đ';
  };

  const handleBookNow = () => {
    if (!isAuthenticated) {
      navigate('/auth?redirect=/caregivers');
      return;
    }

    if (account?.role !== 'CUSTOMER') {
      toast.error('Chỉ tài khoản khách hàng mới có thể đặt lịch.');
      return;
    }

    setBookingError('');
    setCreatedBooking(null);
    setBookingFormOpen(true);
  };

  const handleBookAnother = () => {
    setCreatedBooking(null);
    setBookingError('');
    setBookingFormOpen(true);
  };

  const handlePackageChange = (nextPackage: BookingPackage) => {
    setPackageType(nextPackage);
    setDurationValue(nextPackage === 'HOURLY' ? 2 : 1);
  };

  const handleBookingSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBookingError('');

    const trimmedServiceAddress = serviceAddress.trim();
    const selectedProvince = provinces.find((province) => province.code === provinceCode);
    const selectedWard = wards.find((ward) => ward.code === wardCode);
    if (!selectedProvince || !selectedWard || !trimmedServiceAddress) {
      setBookingError('Vui lòng chọn tỉnh/thành, phường/xã và nhập địa chỉ chăm sóc.');
      return;
    }

    if (
      !Number.isInteger(durationValue) ||
      durationValue < 1 ||
      (packageType === 'HOURLY' && ![2, 4, 6, 8, 10, 12].includes(durationValue))
    ) {
      setBookingError('Vui lòng chọn thời lượng dịch vụ hợp lệ.');
      return;
    }

    if (!selectedPackage || typeof selectedPackage.rate !== 'number') {
      setBookingError('Gói dịch vụ này hiện chưa có giá. Vui lòng chọn gói khác.');
      return;
    }

    const selectedStart = new Date(`${startDate}T${startHour}`);
    if (
      !startDate ||
      !startHour ||
      !Number.isFinite(selectedStart.getTime()) ||
      selectedStart <= new Date()
    ) {
      setBookingError('Vui lòng chọn ngày và giờ bắt đầu trong tương lai.');
      return;
    }

    try {
      setBookingLoading(true);
      const booking = await createBooking({
        caregiverId: displayedCaregiver.id,
        packageType,
        durationValue,
        startTime: selectedStart.toISOString(),
        serviceArea: selectedWard.name,
        serviceAddress: `${trimmedServiceAddress}, ${selectedWard.name}, ${selectedProvince.shortName}`,
        location: {
          placeType: 'home',
          provinceCode: selectedProvince.code,
          provinceName: selectedProvince.name,
          wardCode: selectedWard.code,
          wardName: selectedWard.name,
          detail: trimmedServiceAddress,
          fullAddress: `${trimmedServiceAddress}, ${selectedWard.name}, ${selectedProvince.shortName}`,
        },
        note: note.trim(),
        paymentMethod,
      });
      setCreatedBooking(booking);
      toast.success('Đặt lịch thành công!');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Không thể tạo lịch đặt.';
      setBookingError(message);
      toast.error(message);
    } finally {
      setBookingLoading(false);
    }
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
                src={displayedCaregiver.avatar} 
                alt={displayedCaregiver.name} 
                className="modal-avatar"
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
                  <span className="stat-bold">{displayedCaregiver.rating}</span>
                  <span className="text-muted">({displayedCaregiver.reviewCount} đánh giá)</span>
                </div>
                <div className="modal-stat">
                  <MapPin size={15} className="text-muted" />
                  <span>{displayedCaregiver.location}</span>
                </div>
              </div>

              <div className="modal-pricing-box">
                <span className="price-label">Giá dịch vụ:</span>
                <span className="modal-price-val">{formatPrice(displayedCaregiver.hourlyRate)}/giờ</span>
              </div>
            </div>
          </div>

          <div className="modal-divider" />

          {detailLoading && (
            <p className="caregiver-detail-status" role="status">Đang tải hồ sơ chi tiết...</p>
          )}
          {detailError && (
            <div className="caregiver-detail-error" role="alert">
              <p>{detailError}</p>
              <button type="button" onClick={() => setRetryCount((count) => count + 1)}>
                Thử tải lại
              </button>
            </div>
          )}

          {bookingFormOpen && (
            <section className="booking-form-section" aria-labelledby="booking-form-title">
              <h3 id="booking-form-title" className="modal-section-title">Thông tin đặt lịch</h3>
              {createdBooking ? (
                <div className="booking-success" role="status">
                  <h4>Đã gửi yêu cầu đặt lịch</h4>
                  <p>Người chăm sóc cần xác nhận trước khi lịch được chấp nhận.</p>
                  <p>Thời gian: {formatBookingDate(createdBooking.startTime)} – {formatBookingDate(createdBooking.endTime)}</p>
                  <p>Tổng phí: <strong>{formatPrice(createdBooking.totalPrice)}</strong></p>
                  <p>Thanh toán: {createdBooking.paymentMethod === 'CASH' ? 'Tiền mặt' : 'Chuyển khoản'}</p>
                  <button
                    type="button"
                    className="btn-modal-book"
                    onClick={handleBookAnother}
                  >
                    Đặt thêm lịch khác
                  </button>
                </div>
              ) : (
                <form className="booking-form" onSubmit={handleBookingSubmit}>
                  <label>
                    Gói dịch vụ
                    <select
                      value={packageType}
                      onChange={(event) => handlePackageChange(event.target.value as BookingPackage)}
                      required
                    >
                      {availablePackages.map((item) => (
                        <option key={item.value} value={item.value}>
                          {item.label} · {formatPrice(item.rate as number)}/{packageUnitByType[item.value]}
                        </option>
                      ))}
                    </select>
                  </label>
                  <div className="booking-form-row">
                    <label>
                      Thời lượng ({packageUnit})
                      {packageType === 'HOURLY' ? (
                        <select
                          value={durationValue}
                          onChange={(event) => setDurationValue(Number(event.target.value))}
                        >
                          {[2, 4, 6, 8, 10, 12].map((duration) => (
                            <option key={duration} value={duration}>{duration} giờ</option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="number"
                          min="1"
                          step="1"
                          value={durationValue}
                          onChange={(event) => setDurationValue(Number(event.target.value))}
                          required
                        />
                      )}
                    </label>
                    <label>
                      Ngày bắt đầu
                      <input
                        type="date"
                        className="booking-start-date-input"
                        value={startDate}
                        min={toLocalDateInput(new Date())}
                        onChange={(event) => setStartDate(event.target.value)}
                        onClick={(event) => {
                          const dateInput = event.currentTarget as HTMLInputElement & {
                            showPicker?: () => void;
                          };
                          dateInput.showPicker?.();
                        }}
                        required
                      />
                    </label>
                  </div>
                  <div className="booking-form-row">
                    <label>
                      Giờ bắt đầu
                      <input
                        type="time"
                        value={startHour}
                        onChange={(event) => setStartHour(event.target.value)}
                        required
                      />
                    </label>
                  </div>
                  <label>
                    Thời gian kết thúc dự kiến
                    <input
                      type="text"
                      value={estimatedEndTime
                        ? new Intl.DateTimeFormat('vi-VN', {
                            dateStyle: 'medium',
                            timeStyle: 'short',
                          }).format(estimatedEndTime)
                        : ''}
                      placeholder="Chọn ngày, giờ và thời lượng để xem giờ kết thúc"
                      readOnly
                    />
                  </label>
                  <div className="booking-form-row">
                    <SearchableLocationSelect
                      id="booking-province"
                      label="Tỉnh / Thành phố"
                      placeholder="Chọn hoặc nhập tỉnh/thành"
                      options={provinces}
                      value={provinceCode}
                      loading={loadingProvinces}
                      onChange={(code) => {
                        setProvinceCode(code);
                        setWardCode('');
                        setWards([]);
                      }}
                    />
                    <SearchableLocationSelect
                      id="booking-ward"
                      label="Phường / Xã"
                      placeholder={provinceCode ? 'Chọn hoặc nhập phường/xã' : 'Chọn tỉnh/thành trước'}
                      options={wards}
                      value={wardCode}
                      disabled={!provinceCode}
                      loading={loadingWards}
                      onChange={setWardCode}
                    />
                  </div>
                  {locationError && <p className="booking-error" role="alert">{locationError}</p>}
                  <label>
                    Số nhà, tên đường
                    <input
                      value={serviceAddress}
                      onChange={(event) => setServiceAddress(event.target.value)}
                      placeholder="Ví dụ: 12 đường 30/4"
                      required
                    />
                  </label>
                  <label>
                    Ghi chú
                    <textarea
                      value={note}
                      onChange={(event) => setNote(event.target.value)}
                      rows={2}
                      placeholder="Thông tin thêm cho người chăm sóc"
                    />
                  </label>
                  <label>
                    Phương thức thanh toán
                    <select
                      value={paymentMethod}
                      onChange={(event) => setPaymentMethod(event.target.value as 'CASH' | 'BANK_TRANSFER')}
                    >
                      <option value="CASH">Tiền mặt</option>
                      <option value="BANK_TRANSFER">Chuyển khoản</option>
                    </select>
                  </label>
                  {estimatedTotal !== null && (
                    <p className="booking-estimate">
                      Phí dự kiến: <strong>{formatPrice(estimatedTotal)}</strong>
                      <small>Phí chính thức do server tính khi xác nhận đặt lịch.</small>
                    </p>
                  )}
                  {bookingError && <p className="booking-error" role="alert">{bookingError}</p>}
                  <div className="booking-form-actions">
                    <button
                      type="button"
                      className="booking-cancel-btn"
                      onClick={() => setBookingFormOpen(false)}
                      disabled={bookingLoading}
                    >
                      Đóng
                    </button>
                    <button
                      type="submit"
                      className="btn-modal-book"
                      disabled={bookingLoading || detailLoading || availablePackages.length === 0}
                    >
                      {bookingLoading ? 'Đang gửi...' : 'Xác nhận đặt lịch'}
                    </button>
                  </div>
                </form>
              )}
            </section>
          )}

          {/* Bio */}
          <div className="modal-section">
            <h4 className="modal-section-title">Giới thiệu bản thân</h4>
            <p className="modal-bio-text">{displayedCaregiver.bio}</p>
          </div>

          {/* Skills */}
          <div className="modal-section">
            <h4 className="modal-section-title">Kỹ năng chuyên môn</h4>
            <div className="skills-badge-list">
              {displayedCaregiver.skills.map((skill, index) => (
                <span key={index} className="skill-pill">
                  <Check size={14} className="skill-check" />
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Certifications */}
          {displayedCaregiver.certifications.length > 0 && (
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
              disabled={detailLoading || availablePackages.length === 0 || bookingLoading}
            >
              <Calendar size={18} />
              <span>
                {!isAuthenticated
                  ? 'Đăng nhập để đặt lịch'
                  : account?.role === 'CUSTOMER'
                    ? createdBooking ? 'Đặt lịch khác' : 'Đặt lịch chăm sóc ngay'
                    : 'Chỉ khách hàng được đặt lịch'}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const toLocalDateInput = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatBookingDate = (date: string) =>
  new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(date));
