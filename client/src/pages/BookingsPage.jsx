import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Navbar } from '../components/Navbar';
import {
  getMyBookings,
  cancelBooking,
  updateBookingStatus,
} from '../services/bookingService';
import toast from 'react-hot-toast';
import {
  Calendar,
  Clock,
  MapPin,
  User,
  Shield,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Phone,
  AlertTriangle,
  RefreshCw,
  Star,
  ArrowRight,
  Info,
  CalendarCheck2,
  FileText,
  DollarSign,
  X,
} from 'lucide-react';

export const BookingsPage = () => {
  const navigate = useNavigate();
  const { account, user, isAuthenticated, loading: authLoading, updateUserData } = useAuth();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('ALL');

  // Cancel Modal states
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [submittingCancel, setSubmittingCancel] = useState(false);

  // Status Action Loading
  const [updatingStatusId, setUpdatingStatusId] = useState(null);

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/auth?redirect=/bookings');
    }
  }, [authLoading, isAuthenticated, navigate]);

  const fetchBookings = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);

    try {
      const data = await getMyBookings();
      setBookings(data);
    } catch (err) {
      console.error('Fetch bookings error:', err);
      toast.error(err.message || 'Không thể tải danh sách lịch đặt.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchBookings();
    }
  }, [isAuthenticated]);

  // Tab Filtering
  const filteredBookings = bookings.filter((b) => {
    if (activeTab === 'ALL') return true;
    return b.status === activeTab;
  });

  const countByStatus = {
    ALL: bookings.length,
    PENDING: bookings.filter((b) => b.status === 'PENDING').length,
    CONFIRMED: bookings.filter((b) => b.status === 'CONFIRMED').length,
    IN_PROGRESS: bookings.filter((b) => b.status === 'IN_PROGRESS').length,
    COMPLETED: bookings.filter((b) => b.status === 'COMPLETED').length,
    CANCELLED: bookings.filter((b) => b.status === 'CANCELLED').length,
  };

  // Helper format currency
  const formatVND = (amount) => {
    if (typeof amount !== 'number') return '0 đ';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  // Helper format date
  const formatDateTime = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  // Tính số giờ còn lại từ bây giờ đến giờ hẹn
  const getHoursUntilStart = (startTime) => {
    const diffMs = new Date(startTime).getTime() - new Date().getTime();
    return diffMs / (1000 * 60 * 60);
  };

  // Ước tính số điểm uy tín bị trừ nếu hủy
  const estimatePenalty = (booking) => {
    if (!booking) return 0;
    if (booking.status === 'PENDING') return 0;

    const hours = getHoursUntilStart(booking.startTime);
    const isCaregiver = account?.role === 'CAREGIVER';

    if (isCaregiver) {
      return hours < 12 ? 15 : 5;
    } else {
      return hours < 2 ? 15 : 5;
    }
  };

  // Xử lý mở Modal Hủy
  const handleOpenCancelModal = (booking) => {
    setSelectedBooking(booking);
    setCancelReason('');
    setCancelModalOpen(true);
  };

  // Xác nhận hủy lịch
  const handleConfirmCancel = async () => {
    if (!selectedBooking) return;
    if (!cancelReason.trim() || cancelReason.trim().length < 3) {
      toast.error('Vui lòng nhập lý do hủy lịch rõ ràng (tối thiểu 3 ký tự).');
      return;
    }

    try {
      setSubmittingCancel(true);
      const res = await cancelBooking(selectedBooking._id, cancelReason.trim());

      toast.success(res.message || 'Đã hủy lịch thành công.');
      setCancelModalOpen(false);
      setSelectedBooking(null);

      // Cập nhật lại số điểm uy tín trong Auth Context nếu có trả về
      if (res?.data?.currentReputationScore !== undefined && account) {
        updateUserData({
          account: {
            ...account,
            reputationScore: res.data.currentReputationScore,
          },
        });
      }

      await fetchBookings(true);
    } catch (err) {
      console.error('Cancel booking error:', err);
      toast.error(err.message || 'Lỗi khi hủy lịch.');
    } finally {
      setSubmittingCancel(false);
    }
  };

  // Xử lý chuyển trạng thái (Nhận việc / Bắt đầu / Hoàn thành)
  const handleUpdateStatus = async (bookingId, nextStatus, label) => {
    try {
      setUpdatingStatusId(bookingId);
      await updateBookingStatus(bookingId, nextStatus);
      toast.success(`Đã cập nhật trạng thái: ${label}!`);
      await fetchBookings(true);
    } catch (err) {
      console.error('Update status error:', err);
      toast.error(err.message || 'Lỗi khi cập nhật trạng thái.');
    } finally {
      setUpdatingStatusId(null);
    }
  };

  // Render Status Badge
  const renderStatusBadge = (status) => {
    switch (status) {
      case 'PENDING':
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '4px 12px',
              borderRadius: '9999px',
              fontSize: '12.5px',
              fontWeight: 600,
              backgroundColor: '#fef3c7',
              color: '#b45309',
              border: '1px solid #fde68a',
            }}
          >
            <Clock size={13} /> Chờ xác nhận
          </span>
        );
      case 'CONFIRMED':
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '4px 12px',
              borderRadius: '9999px',
              fontSize: '12.5px',
              fontWeight: 600,
              backgroundColor: '#e0f2fe',
              color: '#0369a1',
              border: '1px solid #bae6fd',
            }}
          >
            <ShieldCheck size={13} /> Đã nhận lịch
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '4px 12px',
              borderRadius: '9999px',
              fontSize: '12.5px',
              fontWeight: 600,
              backgroundColor: '#f3e8ff',
              color: '#7e22ce',
              border: '1px solid #e9d5ff',
            }}
          >
            <RefreshCw size={13} className="animate-spin" /> Đang thực hiện
          </span>
        );
      case 'COMPLETED':
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '4px 12px',
              borderRadius: '9999px',
              fontSize: '12.5px',
              fontWeight: 600,
              backgroundColor: '#ecfdf5',
              color: '#047857',
              border: '1px solid #a7f3d0',
            }}
          >
            <CheckCircle2 size={13} /> Hoàn thành
          </span>
        );
      case 'CANCELLED':
        return (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              padding: '4px 12px',
              borderRadius: '9999px',
              fontSize: '12.5px',
              fontWeight: 600,
              backgroundColor: '#fee2e2',
              color: '#b91c1c',
              border: '1px solid #fecaca',
            }}
          >
            <XCircle size={13} /> Đã hủy
          </span>
        );
      default:
        return null;
    }
  };

  const isCaregiver = account?.role === 'CAREGIVER';

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', color: '#0f172a' }}>
      <Navbar />

      <main style={{ maxWidth: '1560px', width: '92%', margin: '0 auto', padding: '32px 0 80px' }}>
        {/* Header Section */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            marginBottom: '28px',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  backgroundColor: '#e0f2fe',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#0284c7',
                }}
              >
                <CalendarCheck2 size={24} />
              </div>
              <div>
                <h1 style={{ fontSize: '24px', fontWeight: 800, margin: 0, color: '#0f172a' }}>
                  {isCaregiver ? 'Quản lý Ca Chăm Sóc' : 'Lịch Đặt Của Tôi'}
                </h1>
                <p style={{ margin: '4px 0 0', fontSize: '14px', color: '#64748b' }}>
                  {isCaregiver
                    ? 'Xem danh sách yêu cầu chăm sóc, xác nhận nhận ca và báo cáo tiến độ công việc'
                    : 'Theo dõi tiến trình ca chăm sóc, thông tin liên hệ và quản lý hủy lịch hẹn'}
                </p>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
              type="button"
              onClick={() => fetchBookings(true)}
              disabled={refreshing}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '9px 16px',
                borderRadius: '10px',
                border: '1px solid #cbd5e1',
                backgroundColor: '#ffffff',
                color: '#334155',
                fontSize: '13.5px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              <RefreshCw size={15} className={refreshing ? 'animate-spin' : ''} />
              <span>Làm mới</span>
            </button>

            {!isCaregiver && (
              <Link
                to="/caregivers"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '9px 18px',
                  borderRadius: '10px',
                  backgroundColor: '#2563eb',
                  color: '#ffffff',
                  fontSize: '13.5px',
                  fontWeight: 600,
                  textDecoration: 'none',
                  boxShadow: '0 2px 4px rgba(37, 99, 235, 0.2)',
                }}
              >
                <span>+ Đặt lịch mới</span>
              </Link>
            )}
          </div>
        </div>

        {/* Status Tabs Filter */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            overflowX: 'auto',
            paddingBottom: '8px',
            marginBottom: '24px',
            borderBottom: '1px solid #e2e8f0',
          }}
        >
          {[
            { key: 'ALL', label: 'Tất cả' },
            { key: 'PENDING', label: 'Chờ xác nhận' },
            { key: 'CONFIRMED', label: 'Đã nhận lịch' },
            { key: 'IN_PROGRESS', label: 'Đang làm' },
            { key: 'COMPLETED', label: 'Hoàn thành' },
            { key: 'CANCELLED', label: 'Đã hủy' },
          ].map((tab) => {
            const count = countByStatus[tab.key] || 0;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 18px',
                  borderRadius: '10px',
                  border: 'none',
                  backgroundColor: isActive ? '#0f172a' : '#ffffff',
                  color: isActive ? '#ffffff' : '#64748b',
                  fontSize: '14px',
                  fontWeight: isActive ? 700 : 500,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  boxShadow: isActive ? '0 2px 8px rgba(15, 23, 42, 0.15)' : 'none',
                  transition: 'all 0.2s',
                }}
              >
                <span>{tab.label}</span>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: '20px',
                    height: '20px',
                    padding: '0 6px',
                    borderRadius: '9999px',
                    fontSize: '11.5px',
                    fontWeight: 700,
                    backgroundColor: isActive ? '#334155' : '#f1f5f9',
                    color: isActive ? '#ffffff' : '#475569',
                  }}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Content Body */}
        {loading ? (
          <div
            style={{
              padding: '60px 20px',
              textAlign: 'center',
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              border: '1px solid #e2e8f0',
            }}
          >
            <RefreshCw size={32} className="animate-spin text-blue-600" style={{ margin: '0 auto 12px' }} />
            <p style={{ color: '#64748b', fontSize: '15px' }}>Đang tải danh sách lịch đặt...</p>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div
            style={{
              padding: '60px 20px',
              textAlign: 'center',
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              border: '1px solid #e2e8f0',
            }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: '#f1f5f9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                color: '#94a3b8',
              }}
            >
              <Calendar size={30} />
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', margin: '0 0 8px' }}>
              Không có lịch đặt nào ở trạng thái này
            </h3>
            <p style={{ fontSize: '14px', color: '#64748b', margin: '0 0 20px' }}>
              {activeTab === 'ALL'
                ? 'Bạn chưa có đơn đặt lịch nào trong hệ thống.'
                : 'Hiện không có ca chăm sóc nào thuộc mục này.'}
            </p>
            {!isCaregiver && (
              <Link
                to="/caregivers"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px 22px',
                  borderRadius: '10px',
                  backgroundColor: '#2563eb',
                  color: '#ffffff',
                  fontSize: '14px',
                  fontWeight: 600,
                  textDecoration: 'none',
                }}
              >
                <span>Khám phá Người chăm sóc</span>
                <ArrowRight size={16} />
              </Link>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            {filteredBookings.map((b) => {
              const hoursUntil = getHoursUntilStart(b.startTime);
              const partner = isCaregiver ? b.customer : b.caregiver;
              const isStatusUpdating = updatingStatusId === b._id;

              return (
                <div
                  key={b._id}
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '16px',
                    border: '1px solid #e2e8f0',
                    padding: '24px',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                    transition: 'all 0.2s',
                  }}
                >
                  {/* Top Bar: Booking ID + Status Badge */}
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '12px',
                      paddingBottom: '16px',
                      borderBottom: '1px solid #f1f5f9',
                      marginBottom: '18px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span
                        style={{
                          fontSize: '14px',
                          fontWeight: 700,
                          color: '#0f172a',
                          letterSpacing: '-0.3px',
                        }}
                      >
                        Đơn #{b._id.slice(-8).toUpperCase()}
                      </span>
                      <span style={{ fontSize: '13px', color: '#94a3b8' }}>•</span>
                      <span style={{ fontSize: '13px', color: '#64748b' }}>
                        Tạo lúc: {formatDateTime(b.createdAt)}
                      </span>
                    </div>

                    <div>{renderStatusBadge(b.status)}</div>
                  </div>

                  {/* Body Grid: Partner Info + Work Details + Pricing */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                      gap: '24px',
                      marginBottom: '20px',
                    }}
                  >
                    {/* Partner Card */}
                    <div
                      style={{
                        backgroundColor: '#f8fafc',
                        padding: '16px',
                        borderRadius: '12px',
                        border: '1px solid #f1f5f9',
                      }}
                    >
                      <div
                        style={{
                          fontSize: '12px',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          color: '#64748b',
                          letterSpacing: '0.5px',
                          marginBottom: '10px',
                        }}
                      >
                        {isCaregiver ? 'Thông tin Khách hàng' : 'Người chăm sóc đảm nhận'}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <img
                          src={
                            partner?.avatarUrl ||
                            (isCaregiver
                              ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80'
                              : 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=120&q=80')
                          }
                          alt={partner?.fullName || 'Avatar'}
                          style={{
                            width: '52px',
                            height: '52px',
                            borderRadius: '50%',
                            objectFit: 'cover',
                            border: '2px solid #ffffff',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.06)',
                          }}
                        />

                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a' }}>
                            {partner?.fullName || 'Thành viên CareLink'}
                          </div>

                          {/* Ratings for Caregiver OR Reputation for Customer */}
                          {isCaregiver ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                              <Shield size={13} className="text-emerald-600" />
                              <span style={{ fontSize: '12.5px', fontWeight: 600, color: '#059669' }}>
                                Uy tín khách: {partner?.reputationScore ?? 100}/100
                              </span>
                              {partner?.isLowReputation && (
                                <span
                                  style={{
                                    fontSize: '11px',
                                    padding: '2px 6px',
                                    borderRadius: '4px',
                                    backgroundColor: '#fee2e2',
                                    color: '#b91c1c',
                                    fontWeight: 600,
                                  }}
                                >
                                  ⚠️ Thường hủy
                                </span>
                              )}
                            </div>
                          ) : (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '3px', color: '#f59e0b' }}>
                                <Star size={13} fill="#f59e0b" />
                                <span style={{ fontSize: '13px', fontWeight: 700 }}>
                                  {partner?.ratingAvg?.toFixed(1) || '5.0'}
                                </span>
                              </div>
                              <span style={{ fontSize: '12px', color: '#64748b' }}>
                                ({partner?.experienceYears || 1} năm KN)
                              </span>
                            </div>
                          )}

                          {/* Phone Section (Revealed vs Masked) */}
                          <div style={{ marginTop: '6px' }}>
                            {partner?.isPhoneRevealed ? (
                              <a
                                href={`tel:${partner?.phone}`}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '5px',
                                  fontSize: '13px',
                                  fontWeight: 600,
                                  color: '#0284c7',
                                  textDecoration: 'none',
                                }}
                              >
                                <Phone size={13} />
                                <span>{partner?.phone}</span>
                              </a>
                            ) : (
                              <div
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '5px',
                                  fontSize: '12px',
                                  color: '#94a3b8',
                                }}
                              >
                                <Phone size={12} />
                                <span>{partner?.phone}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Work Details */}
                    <div>
                      <div
                        style={{
                          fontSize: '12px',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          color: '#64748b',
                          letterSpacing: '0.5px',
                          marginBottom: '10px',
                        }}
                      >
                        Thời gian & Địa điểm ca làm
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                          <Clock size={16} style={{ color: '#64748b', marginTop: '2px', flexShrink: 0 }} />
                          <div style={{ fontSize: '13.5px' }}>
                            <span style={{ fontWeight: 600, color: '#0f172a' }}>
                              {formatDateTime(b.startTime)}
                            </span>
                            <span style={{ color: '#64748b' }}> đến </span>
                            <span style={{ fontWeight: 600, color: '#0f172a' }}>
                              {formatDateTime(b.endTime)}
                            </span>
                            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                              Gói:{' '}
                              <strong>
                                {b.packageType === 'HOURLY'
                                  ? `Ca ${b.durationValue} Giờ`
                                  : b.packageType === 'DAILY'
                                  ? `${b.durationValue} Ngày`
                                  : b.packageType === 'WEEKLY'
                                  ? `${b.durationValue} Tuần`
                                  : `${b.durationValue} Tháng`}
                              </strong>
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                          <MapPin size={16} style={{ color: '#64748b', marginTop: '2px', flexShrink: 0 }} />
                          <div style={{ fontSize: '13.5px', color: '#334155' }}>
                            {b.serviceAddress}, {b.serviceArea}
                          </div>
                        </div>

                        {b.note && (
                          <div
                            style={{
                              fontSize: '12.5px',
                              color: '#64748b',
                              backgroundColor: '#f8fafc',
                              padding: '8px 12px',
                              borderRadius: '8px',
                              borderLeft: '3px solid #cbd5e1',
                              marginTop: '4px',
                            }}
                          >
                            <strong>Ghi chú:</strong> {b.note}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Price and Payment Method */}
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        backgroundColor: '#f8fafc',
                        padding: '16px',
                        borderRadius: '12px',
                        border: '1px solid #f1f5f9',
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontSize: '12px',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            color: '#64748b',
                            letterSpacing: '0.5px',
                            marginBottom: '6px',
                          }}
                        >
                          Tổng chi phí
                        </div>
                        <div style={{ fontSize: '22px', fontWeight: 800, color: '#0f766e' }}>
                          {formatVND(b.totalPrice)}
                        </div>
                        <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                          Thanh toán:{' '}
                          <span style={{ fontWeight: 600 }}>
                            {b.paymentMethod === 'BANK_TRANSFER' ? 'Chuyển khoản' : 'Tiền mặt'}
                          </span>
                        </div>
                      </div>

                      {/* Reminder countdown for starting */}
                      {b.status === 'CONFIRMED' && (
                        <div
                          style={{
                            fontSize: '12px',
                            fontWeight: 600,
                            color: hoursUntil <= 2 ? '#b91c1c' : '#0369a1',
                            marginTop: '12px',
                          }}
                        >
                          {hoursUntil > 0 ? (
                            <span>⏳ Còn khoảng {Math.round(hoursUntil)} giờ nữa sẽ đến ca hẹn</span>
                          ) : (
                            <span>⚡ Đã đến giờ ca làm việc</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Cancellation Record Info (If CANCELLED) */}
                  {b.status === 'CANCELLED' && b.cancellationInfo && (
                    <div
                      style={{
                        padding: '12px 16px',
                        borderRadius: '10px',
                        backgroundColor: '#fff1f2',
                        border: '1px solid #ffe4e6',
                        color: '#9f1239',
                        fontSize: '13px',
                        marginBottom: '16px',
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '10px',
                      }}
                    >
                      <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                      <div>
                        <strong>Đã hủy bởi:</strong>{' '}
                        {b.cancellationInfo.cancelledByRole === 'CUSTOMER' ? 'Khách hàng' : 'Người chăm sóc'} (
                        {formatDateTime(b.cancellationInfo.cancelledAt)})
                        <div>
                          <strong>Lý do:</strong> {b.cancellationInfo.reason || 'Không nêu rõ'}
                        </div>
                        <div>
                          <strong>Điểm uy tín bị trừ:</strong>{' '}
                          <span style={{ fontWeight: 700 }}>
                            {b.cancellationInfo.penaltyPointsDeducted > 0
                              ? `-${b.cancellationInfo.penaltyPointsDeducted} điểm`
                              : '0 điểm (Hủy theo điều kiện miễn trừ)'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Actions Footer */}
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      alignItems: 'center',
                      justifyContent: 'flex-end',
                      gap: '10px',
                      paddingTop: '16px',
                      borderTop: '1px solid #f1f5f9',
                    }}
                  >
                    {/* Role: CAREGIVER Actions */}
                    {isCaregiver && (
                      <>
                        {b.status === 'PENDING' && (
                          <>
                            <button
                              type="button"
                              disabled={isStatusUpdating}
                              onClick={() => handleOpenCancelModal(b)}
                              style={{
                                padding: '8px 18px',
                                borderRadius: '8px',
                                border: '1px solid #cbd5e1',
                                backgroundColor: '#ffffff',
                                color: '#475569',
                                fontSize: '13.5px',
                                fontWeight: 600,
                                cursor: 'pointer',
                              }}
                            >
                              Từ chối
                            </button>
                            <button
                              type="button"
                              disabled={isStatusUpdating}
                              onClick={() => handleUpdateStatus(b._id, 'CONFIRMED', 'Đã nhận việc')}
                              style={{
                                padding: '8px 20px',
                                borderRadius: '8px',
                                border: 'none',
                                backgroundColor: '#059669',
                                color: '#ffffff',
                                fontSize: '13.5px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                boxShadow: '0 2px 4px rgba(5, 150, 105, 0.2)',
                              }}
                            >
                              {isStatusUpdating ? 'Đang xử lý...' : '✓ Nhận ca chăm sóc'}
                            </button>
                          </>
                        )}

                        {b.status === 'CONFIRMED' && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleOpenCancelModal(b)}
                              style={{
                                padding: '8px 16px',
                                borderRadius: '8px',
                                border: '1px solid #fecaca',
                                backgroundColor: '#fff5f5',
                                color: '#b91c1c',
                                fontSize: '13.5px',
                                fontWeight: 600,
                                cursor: 'pointer',
                              }}
                            >
                              Hủy ca làm
                            </button>
                            <button
                              type="button"
                              disabled={isStatusUpdating}
                              onClick={() => handleUpdateStatus(b._id, 'IN_PROGRESS', 'Bắt đầu ca làm')}
                              style={{
                                padding: '8px 20px',
                                borderRadius: '8px',
                                border: 'none',
                                backgroundColor: '#0284c7',
                                color: '#ffffff',
                                fontSize: '13.5px',
                                fontWeight: 600,
                                cursor: 'pointer',
                              }}
                            >
                              {isStatusUpdating ? 'Đang xử lý...' : '▶ Bắt đầu ca làm việc'}
                            </button>
                          </>
                        )}

                        {b.status === 'IN_PROGRESS' && (
                          <button
                            type="button"
                            disabled={isStatusUpdating}
                            onClick={() => handleUpdateStatus(b._id, 'COMPLETED', 'Hoàn thành ca làm')}
                            style={{
                              padding: '9px 22px',
                              borderRadius: '8px',
                              border: 'none',
                              backgroundColor: '#059669',
                              color: '#ffffff',
                              fontSize: '13.5px',
                              fontWeight: 700,
                              cursor: 'pointer',
                            }}
                          >
                            {isStatusUpdating ? 'Đang cập nhật...' : '✓ Báo cáo hoàn thành ca'}
                          </button>
                        )}
                      </>
                    )}

                    {/* Role: CUSTOMER Actions */}
                    {!isCaregiver && (
                      <>
                        {b.status === 'PENDING' && (
                          <button
                            type="button"
                            onClick={() => handleOpenCancelModal(b)}
                            style={{
                              padding: '8px 18px',
                              borderRadius: '8px',
                              border: '1px solid #cbd5e1',
                              backgroundColor: '#ffffff',
                              color: '#b91c1c',
                              fontSize: '13.5px',
                              fontWeight: 600,
                              cursor: 'pointer',
                            }}
                          >
                            Hủy đơn (Không trừ điểm)
                          </button>
                        )}

                        {b.status === 'CONFIRMED' && (
                          <button
                            type="button"
                            onClick={() => handleOpenCancelModal(b)}
                            style={{
                              padding: '8px 18px',
                              borderRadius: '8px',
                              border: '1px solid #fecaca',
                              backgroundColor: '#fff5f5',
                              color: '#b91c1c',
                              fontSize: '13.5px',
                              fontWeight: 600,
                              cursor: 'pointer',
                            }}
                          >
                            Hủy lịch hẹn
                          </button>
                        )}

                        {b.status === 'IN_PROGRESS' && (
                          <button
                            type="button"
                            disabled={isStatusUpdating}
                            onClick={() => handleUpdateStatus(b._id, 'COMPLETED', 'Xác nhận hoàn thành')}
                            style={{
                              padding: '8px 20px',
                              borderRadius: '8px',
                              border: 'none',
                              backgroundColor: '#059669',
                              color: '#ffffff',
                              fontSize: '13.5px',
                              fontWeight: 600,
                              cursor: 'pointer',
                            }}
                          >
                            {isStatusUpdating ? 'Đang xử lý...' : '✓ Xác nhận hoàn thành ca'}
                          </button>
                        )}

                        {b.status === 'COMPLETED' && (
                          <button
                            type="button"
                            onClick={() => {
                              toast.info('Tính năng đánh giá sẽ mở ngay sau bước này!');
                            }}
                            style={{
                              padding: '8px 18px',
                              borderRadius: '8px',
                              border: '1px solid #fde68a',
                              backgroundColor: '#fffbeb',
                              color: '#b45309',
                              fontSize: '13.5px',
                              fontWeight: 600,
                              cursor: 'pointer',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                            }}
                          >
                            <Star size={14} fill="#b45309" />
                            <span>Đánh giá dịch vụ</span>
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* CANCEL MODAL WITH REPUTATION PENALTY WARNING */}
      {cancelModalOpen && selectedBooking && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            zIndex: 100,
          }}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '20px',
              maxWidth: '520px',
              width: '100%',
              padding: '28px',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.2)',
              position: 'relative',
              animation: 'fadeIn 0.2s ease-out',
            }}
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={() => {
                setCancelModalOpen(false);
                setSelectedBooking(null);
              }}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                background: 'none',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
              }}
            >
              <X size={20} />
            </button>

            {/* Title */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  backgroundColor: '#fee2e2',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#b91c1c',
                }}
              >
                <AlertTriangle size={22} />
              </div>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  Xác nhận Hủy Lịch Hẹn
                </h3>
                <p style={{ margin: '2px 0 0', fontSize: '13px', color: '#64748b' }}>
                  Đơn #{selectedBooking._id.slice(-8).toUpperCase()}
                </p>
              </div>
            </div>

            {/* Reputation Rule Alert */}
            {(() => {
              const penalty = estimatePenalty(selectedBooking);
              const hours = getHoursUntilStart(selectedBooking.startTime);

              return (
                <div
                  style={{
                    backgroundColor: penalty > 0 ? '#fff1f2' : '#f0fdf4',
                    border: `1px solid ${penalty > 0 ? '#fecdd3' : '#bbf7d0'}`,
                    padding: '14px 16px',
                    borderRadius: '12px',
                    marginBottom: '18px',
                  }}
                >
                  <div
                    style={{
                      fontSize: '13.5px',
                      fontWeight: 700,
                      color: penalty > 0 ? '#9f1239' : '#15803d',
                      marginBottom: '6px',
                    }}
                  >
                    {penalty > 0
                      ? `⚠️ Cảnh báo: Bạn sẽ bị trừ -${penalty} Điểm Uy Tín`
                      : '✓ Hủy miễn trừ: Không bị trừ điểm uy tín'}
                  </div>

                  <div style={{ fontSize: '12.5px', color: penalty > 0 ? '#881337' : '#166534', lineHeight: 1.5 }}>
                    {selectedBooking.status === 'PENDING' ? (
                      <span>Đơn hàng đang ở trạng thái chờ xác nhận. Bạn có thể hủy miễn phí mà không ảnh hưởng điểm uy tín.</span>
                    ) : isCaregiver ? (
                      <span>
                        Ca hẹn bắt đầu lúc {formatDateTime(selectedBooking.startTime)} (còn{' '}
                        {Math.max(0, Math.round(hours))} giờ). Theo quy định CTV, hủy trước 12h trừ 5 điểm; hủy sát giờ
                        (&lt; 12h) trừ 15 điểm uy tín.
                      </span>
                    ) : (
                      <span>
                        Ca hẹn bắt đầu lúc {formatDateTime(selectedBooking.startTime)} (còn{' '}
                        {Math.max(0, Math.round(hours))} giờ). Theo quy định, hủy trước 6h trừ 5 điểm; hủy sát giờ (&lt;
                        2h) trừ 15 điểm uy tín.
                      </span>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Reason Textarea */}
            <div style={{ marginBottom: '18px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '13.5px',
                  fontWeight: 600,
                  color: '#334155',
                  marginBottom: '8px',
                }}
              >
                Lý do hủy lịch <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <textarea
                rows={3}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Vui lòng cung cấp lý do hủy để đối tác và hệ thống nắm thông tin..."
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: '1.5px solid #cbd5e1',
                  fontSize: '13.5px',
                  outline: 'none',
                  fontFamily: 'inherit',
                }}
              />

              {/* Quick Reason Chips */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
                {[
                  'Bận việc đột xuất',
                  'Thay đổi kế hoạch gia đình',
                  'Trùng lịch hẹn cá nhân',
                  'Khoảng cách di chuyển quá xa',
                ].map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    onClick={() => setCancelReason(chip)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '6px',
                      border: '1px solid #e2e8f0',
                      backgroundColor: '#f8fafc',
                      fontSize: '12px',
                      color: '#475569',
                      cursor: 'pointer',
                    }}
                  >
                    + {chip}
                  </button>
                ))}
              </div>
            </div>

            {/* Modal Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => {
                  setCancelModalOpen(false);
                  setSelectedBooking(null);
                }}
                disabled={submittingCancel}
                style={{
                  padding: '10px 18px',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#ffffff',
                  color: '#475569',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Giữ lại lịch
              </button>
              <button
                type="button"
                onClick={handleConfirmCancel}
                disabled={submittingCancel}
                style={{
                  padding: '10px 22px',
                  borderRadius: '10px',
                  border: 'none',
                  backgroundColor: '#b91c1c',
                  color: '#ffffff',
                  fontSize: '14px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                {submittingCancel ? 'Đang xử lý...' : 'Xác nhận hủy'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingsPage;

