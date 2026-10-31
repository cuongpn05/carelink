import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CalendarClock, CheckCircle2, Clock3, MapPin, RefreshCw, UserRound, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer/Footer';
import { useAuth } from '../context/AuthContext';
import {
  Booking,
  confirmCaregiverBooking,
  getIncomingCaregiverBookings,
  rejectCaregiverBooking,
} from '../services/bookingService';
import './CaregiverBookingsPage.css';

const formatDate = (value: string) =>
  new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));

const formatPrice = (value: number) =>
  `${new Intl.NumberFormat('vi-VN').format(value)}đ`;

const packageLabel: Record<Booking['packageType'], string> = {
  HOURLY: 'Theo giờ',
  DAILY: 'Theo ngày',
  WEEKLY: 'Theo tuần',
  MONTHLY: 'Theo tháng',
};

const packageDurationUnit: Record<Booking['packageType'], string> = {
  HOURLY: 'giờ',
  DAILY: 'ngày',
  WEEKLY: 'tuần',
  MONTHLY: 'tháng',
};

const statusLabel: Record<string, string> = {
  PENDING: 'Chờ xác nhận',
  CONFIRMED: 'Đã xác nhận',
  IN_PROGRESS: 'Đang thực hiện',
  COMPLETED: 'Hoàn thành',
  CANCELLED: 'Đã hủy',
};

export const CaregiverBookingsPage: React.FC = () => {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const knownBookingIds = useRef<Set<string> | null>(null);
  const visibleBookings = [...bookings].sort((first, second) => {
    if (first.status === 'PENDING' && second.status !== 'PENDING') return -1;
    if (first.status !== 'PENDING' && second.status === 'PENDING') return 1;
    return new Date(second.startTime).getTime() - new Date(first.startTime).getTime();
  });
  const pendingBookingCount = visibleBookings.filter((booking) => booking.status === 'PENDING').length;

  const loadBookings = useCallback(async (silent = false) => {
    if (!silent) {
      setLoading(true);
      setError('');
    }

    try {
      const incomingBookings = await getIncomingCaregiverBookings();
      const currentIds = new Set(incomingBookings.map((booking) => booking._id));
      const statusCounts = incomingBookings.reduce<Record<string, number>>((counts, booking) => {
        counts[booking.status] = (counts[booking.status] || 0) + 1;
        return counts;
      }, {});

      if (process.env.NODE_ENV === 'development') {
        console.info('[caregiver bookings] API list received', {
          endpoint: 'GET /api/bookings/incoming',
          count: incomingBookings.length,
          statusCounts,
        });
      }

      if (knownBookingIds.current) {
        incomingBookings
          .filter((booking) => !knownBookingIds.current?.has(booking._id))
          .forEach((booking) => {
            toast.success(`Bạn có lịch đặt mới từ ${booking.customer?.fullName || 'khách hàng'}.`);
          });
      }

      knownBookingIds.current = currentIds;
      setBookings(incomingBookings);
      setLastUpdated(new Date());
    } catch (requestError) {
      const message = requestError instanceof Error
        ? requestError.message
        : 'Không thể tải lịch đặt.';
      if (silent) {
        console.error('Không thể tự động cập nhật lịch đặt của caregiver:', requestError);
      } else {
        setError(message);
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/auth?redirect=/caregiver/bookings', { replace: true });
    }
  }, [authLoading, isAuthenticated, navigate]);

  useEffect(() => {
    if (isAuthenticated) {
      void loadBookings();
      const intervalId = window.setInterval(() => {
        void loadBookings(true);
      }, 15000);

      return () => window.clearInterval(intervalId);
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [authLoading, isAuthenticated, loadBookings]);

  const handleConfirm = async (bookingId: string) => {
    setConfirmingId(bookingId);
    try {
      const confirmedBooking = await confirmCaregiverBooking(bookingId);
      setBookings((current) =>
        current.map((booking) =>
          booking._id === bookingId ? { ...booking, ...confirmedBooking } : booking,
        ),
      );
      toast.success('Đã xác nhận lịch đặt. Khách hàng sẽ nhận được thông báo.');
    } catch (requestError) {
      const message = requestError instanceof Error
        ? requestError.message
        : 'Không thể xác nhận lịch đặt.';
      toast.error(message);
    } finally {
      setConfirmingId(null);
    }
  };

  const handleReject = async (bookingId: string) => {
    setConfirmingId(bookingId);
    try {
      const rejectedBooking = await rejectCaregiverBooking(bookingId);
      setBookings((current) =>
        current.map((booking) =>
          booking._id === bookingId ? { ...booking, ...rejectedBooking } : booking,
        ),
      );
      toast.success('Đã từ chối lịch đặt. Khách hàng sẽ nhận được thông báo.');
    } catch (requestError) {
      const message = requestError instanceof Error
        ? requestError.message
        : 'Không thể từ chối lịch đặt.';
      toast.error(message);
    } finally {
      setConfirmingId(null);
    }
  };

  return (
    <div className="caregiver-bookings-layout">
      <Navbar />
      <main className="caregiver-bookings-page">
        <div className="container">
          <header className="caregiver-bookings-heading">
            <span className="tag-badge">KHU VỰC ĐỐI TÁC</span>
            <h1>Lịch khách đặt</h1>
            <p>Xem tất cả lịch khách đặt, sau đó xác nhận hoặc từ chối các yêu cầu đang chờ.</p>
          </header>

          {authLoading && (
            <section className="caregiver-bookings-state" role="status">
              Đang kiểm tra phiên đăng nhập...
            </section>
          )}

          {isAuthenticated && (
            <section className="caregiver-bookings-list" aria-live="polite">
              <div className="caregiver-bookings-list-heading">
                <div>
                  <h2>Tất cả lịch khách đặt</h2>
                  <p>{visibleBookings.length} lịch · {pendingBookingCount} chờ caregiver xác nhận</p>
                  <small className="caregiver-bookings-debug">
                    GET /api/bookings/incoming
                    {lastUpdated && ` · Tải lúc ${lastUpdated.toLocaleTimeString('vi-VN')}`}
                  </small>
                </div>
                <button
                  type="button"
                  className="caregiver-bookings-refresh"
                  onClick={() => void loadBookings()}
                  disabled={loading}
                >
                  <RefreshCw size={16} />
                  Tải lại
                </button>
              </div>

              {loading && <div className="caregiver-bookings-state">Đang tải lịch đặt...</div>}

              {!loading && error && (
                <div className="caregiver-bookings-state caregiver-bookings-error" role="alert">
                  <p>{error}</p>
                  <button type="button" onClick={() => void loadBookings()}>Thử lại</button>
                </div>
              )}

              {!loading && !error && bookings.length === 0 && (
                <div className="caregiver-bookings-state">
                  API hiện không tìm thấy booking gắn với tài khoản caregiver này.
                  <br />
                  Mở Console và xem mục <strong>[caregiver bookings] API diagnostics</strong>,
                  rồi đối chiếu <code>searchedCaregiverIds</code> với <code>caregiverId</code> trong database.
                </div>
              )}

              {!loading && !error && visibleBookings.map((booking) => (
                <article className="caregiver-booking-card" key={booking._id}>
                  <div className="caregiver-booking-card-heading">
                    <div className="caregiver-booking-customer">
                      <span className="caregiver-booking-avatar"><UserRound size={20} /></span>
                      <div>
                        <h3>{booking.customer?.fullName || 'Khách hàng'}</h3>
                        <p>{booking.customer?.phone || booking.customer?.email || 'Chưa có thông tin liên hệ'}</p>
                      </div>
                    </div>
                    <span className={`caregiver-booking-status status-${booking.status.toLowerCase()}`}>
                      {booking.status === 'CANCELLED' && booking.cancellationInfo?.cancelledByRole === 'CAREGIVER'
                        ? 'Bạn đã từ chối'
                        : statusLabel[booking.status] || booking.status}
                    </span>
                  </div>

                  <div className="caregiver-booking-details">
                    <p><CalendarClock size={17} /> {formatDate(booking.startTime)}</p>
                    <p><Clock3 size={17} /> {packageLabel[booking.packageType]} · {booking.durationValue} {packageDurationUnit[booking.packageType]}</p>
                    <p><MapPin size={17} /> {booking.serviceAddress}{booking.serviceArea ? `, ${booking.serviceArea}` : ''}</p>
                  </div>

                  {booking.note && <p className="caregiver-booking-note">Ghi chú: {booking.note}</p>}

                  <footer className="caregiver-booking-footer">
                    <div>
                      <span>Tổng phí</span>
                      <strong>{formatPrice(booking.totalPrice)}</strong>
                      <small>{booking.paymentMethod === 'CASH' ? 'Tiền mặt' : 'Chuyển khoản'}</small>
                    </div>
                    {booking.status === 'PENDING' ? (
                      <div className="caregiver-booking-actions">
                        <button
                          type="button"
                          className="caregiver-booking-reject"
                          onClick={() => void handleReject(booking._id)}
                          disabled={confirmingId === booking._id}
                        >
                          <XCircle size={17} />
                          {confirmingId === booking._id ? 'Đang xử lý...' : 'Từ chối'}
                        </button>
                        <button
                          type="button"
                          className="caregiver-booking-confirm"
                          onClick={() => void handleConfirm(booking._id)}
                          disabled={confirmingId === booking._id}
                        >
                          <CheckCircle2 size={17} />
                          {confirmingId === booking._id ? 'Đang xử lý...' : 'Xác nhận lịch'}
                        </button>
                      </div>
                    ) : (
                      <span className="caregiver-booking-status-text">
                        {statusLabel[booking.status] || booking.status}
                      </span>
                    )}
                  </footer>
                </article>
              ))}
            </section>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};
