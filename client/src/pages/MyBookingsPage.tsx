import React, { useCallback, useEffect, useState } from 'react';
import {
  Bell,
  CalendarClock,
  CheckCircle2,
  Clock3,
  MapPin,
  RotateCcw,
  RefreshCw,
  Star,
  UserRound,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer/Footer';
import { CaregiverDetailModal } from '../components/Modal/CaregiverDetailModal';
import { useAuth } from '../context/AuthContext';
import { getCaregiverById } from '../services/caregiverService';
import {
  Booking,
  BookingNotification,
  getBookingNotifications,
  getCustomerBookings,
  markBookingNotificationRead,
} from '../services/bookingService';
import { Caregiver } from '../types';
import './MyBookingsPage.css';

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
  PENDING: 'Chờ người chăm sóc xác nhận',
  CONFIRMED: 'Đã xác nhận',
  IN_PROGRESS: 'Đang thực hiện',
  COMPLETED: 'Hoàn thành',
  CANCELLED: 'Đã hủy',
};

export const MyBookingsPage: React.FC = () => {
  const { account, isAuthenticated, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [notifications, setNotifications] = useState<BookingNotification[]>([]);
  const [notificationsLoaded, setNotificationsLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [readingId, setReadingId] = useState<string | null>(null);
  const [rebookingId, setRebookingId] = useState<string | null>(null);
  const [selectedCaregiver, setSelectedCaregiver] = useState<Caregiver | null>(null);

  const loadBookings = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setBookings(await getCustomerBookings());
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Không thể tải lịch của bạn.');
    } finally {
      setLoading(false);
    }

    try {
      setNotifications(await getBookingNotifications());
      setNotificationsLoaded(true);
    } catch (requestError) {
      setNotificationsLoaded(true);
      const message = requestError instanceof Error ? requestError.message : 'Không thể tải thông báo.';
      toast.error(message);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/auth?redirect=/bookings', { replace: true });
    } else if (!authLoading && account?.role !== 'CUSTOMER') {
      navigate(account?.role === 'CAREGIVER' ? '/caregiver/bookings' : '/', { replace: true });
    }
  }, [account?.role, authLoading, isAuthenticated, navigate]);

  useEffect(() => {
    if (isAuthenticated && account?.role === 'CUSTOMER') {
      void loadBookings();
    }
  }, [account?.role, isAuthenticated, loadBookings]);

  useEffect(() => {
    if (!isAuthenticated || account?.role !== 'CUSTOMER') return undefined;

    const intervalId = window.setInterval(async () => {
      try {
        const [customerBookings, bookingNotifications] = await Promise.all([
          getCustomerBookings(),
          getBookingNotifications(),
        ]);
        setBookings(customerBookings);
        setNotifications(bookingNotifications);
      } catch (requestError) {
        console.error('Không thể tự động cập nhật lịch của khách hàng:', requestError);
      }
    }, 20000);

    return () => window.clearInterval(intervalId);
  }, [account?.role, isAuthenticated]);

  const handleMarkRead = async (bookingId: string) => {
    setReadingId(bookingId);
    try {
      await markBookingNotificationRead(bookingId);
      setNotifications((current) =>
        current.map((notification) =>
          notification.bookingId === bookingId ? { ...notification, isRead: true } : notification,
        ),
      );
    } catch (requestError) {
      toast.error(requestError instanceof Error ? requestError.message : 'Không thể cập nhật thông báo.');
    } finally {
      setReadingId(null);
    }
  };

  const handleRebook = async (booking: Booking) => {
    const caregiverProfileId = booking.caregiver?.profileId;
    if (!caregiverProfileId) {
      toast.error('Không tìm thấy hồ sơ người chăm sóc cho lịch này.');
      return;
    }

    setRebookingId(booking._id);
    try {
      setSelectedCaregiver(await getCaregiverById(caregiverProfileId));
    } catch (requestError) {
      toast.error(
        requestError instanceof Error
          ? requestError.message
          : 'Không thể tải hồ sơ người chăm sóc.',
      );
    } finally {
      setRebookingId(null);
    }
  };

  return (
    <div className="my-bookings-layout">
      <Navbar />
      <main className="my-bookings-page">
        <div className="container">
          <header className="my-bookings-heading">
            <span className="tag-badge">TÀI KHOẢN KHÁCH HÀNG</span>
            <h1>Lịch sử người chăm sóc</h1>
            <p>Xem lại người chăm sóc bạn đã đặt cùng thông tin và trạng thái từng lịch.</p>
          </header>

          <section className="my-bookings-section" aria-live="polite">
            <div className="my-bookings-section-heading">
              <div>
                <h2><Bell size={20} /> Thông báo</h2>
                <p>Thông báo sẽ xuất hiện khi người chăm sóc xác nhận lịch.</p>
              </div>
            </div>

            {notifications.length === 0 && notificationsLoaded && (
              <div className="my-bookings-empty">Chưa có thông báo xác nhận lịch.</div>
            )}

            {notifications.map((notification) => (
              <article
                className={`my-booking-notification${notification.isRead ? ' is-read' : ''}`}
                key={notification.bookingId}
              >
                <div>
                  <strong>{notification.message}</strong>
                  <p>Lịch bắt đầu lúc {formatDate(notification.startTime)}.</p>
                </div>
                {!notification.isRead && (
                  <button
                    type="button"
                    onClick={() => void handleMarkRead(notification.bookingId)}
                    disabled={readingId === notification.bookingId}
                  >
                    {readingId === notification.bookingId ? 'Đang cập nhật...' : 'Đã đọc'}
                  </button>
                )}
              </article>
            ))}
          </section>

          <section className="my-bookings-section">
            <div className="my-bookings-section-heading">
              <div>
                <h2>Lịch sử đặt lịch</h2>
                <p>{bookings.length} lịch</p>
              </div>
              <button
                type="button"
                className="my-bookings-refresh"
                onClick={() => void loadBookings()}
                disabled={loading}
              >
                <RefreshCw size={16} />
                Tải lại
              </button>
            </div>

            {loading && <div className="my-bookings-empty">Đang tải lịch của bạn...</div>}
            {!loading && error && (
              <div className="my-bookings-empty my-bookings-error" role="alert">
                <p>{error}</p>
                <button type="button" onClick={() => void loadBookings()}>Thử lại</button>
              </div>
            )}
            {!loading && !error && bookings.length === 0 && (
              <div className="my-bookings-empty">
                Bạn chưa đặt lịch nào. Hãy xem danh sách người chăm sóc để bắt đầu.
                <button type="button" onClick={() => navigate('/caregivers')}>Tìm người chăm sóc</button>
              </div>
            )}

            {!loading && !error && bookings.map((booking) => (
              <article className="my-booking-card" key={booking._id}>
                <div className="my-booking-card-heading">
                  <div>
                    <h3>{packageLabel[booking.packageType]}</h3>
                    <p>
                      {booking.durationValue} {packageDurationUnit[booking.packageType]} · Bắt đầu {formatDate(booking.startTime)}
                    </p>
                  </div>
                  <span className={`my-booking-status status-${booking.status.toLowerCase()}`}>
                    {booking.status === 'CANCELLED' && booking.cancellationInfo?.cancelledByRole === 'CAREGIVER'
                      ? 'Người chăm sóc đã từ chối'
                      : statusLabel[booking.status] || booking.status}
                  </span>
                </div>

                <div className="my-booking-caregiver">
                  {booking.caregiver?.avatarUrl ? (
                    <img
                      src={booking.caregiver.avatarUrl}
                      alt={booking.caregiver.fullName || 'Người chăm sóc'}
                    />
                  ) : (
                    <div className="my-booking-caregiver-avatar-placeholder" aria-hidden="true">
                      <UserRound size={20} />
                    </div>
                  )}
                  <div className="my-booking-caregiver-info">
                    <span>Người chăm sóc</span>
                    <strong>{booking.caregiver?.fullName || 'Chưa có thông tin'}</strong>
                    {booking.caregiver && (
                      <span className="my-booking-caregiver-rating">
                        <Star size={14} fill="currentColor" />
                        {booking.caregiver.ratingAvg.toFixed(1)}
                        {' · '}
                        {booking.caregiver.experienceYears} năm kinh nghiệm
                      </span>
                    )}
                  </div>
                </div>

                <div className="my-booking-details">
                  <p><Clock3 size={17} /> Kết thúc {formatDate(booking.endTime)}</p>
                  <p><MapPin size={17} /> {booking.serviceAddress}{booking.serviceArea ? `, ${booking.serviceArea}` : ''}</p>
                  <p><CalendarClock size={17} /> Thanh toán: {booking.paymentMethod === 'CASH' ? 'Tiền mặt' : 'Chuyển khoản'}</p>
                </div>

                {booking.status === 'CONFIRMED' && (
                  <p className="my-booking-confirmed">
                    <CheckCircle2 size={17} />
                    Người chăm sóc đã nhận lịch của bạn.
                  </p>
                )}
                {booking.note && <p className="my-booking-note">Ghi chú: {booking.note}</p>}

                <footer className="my-booking-footer">
                  <span>Tổng phí</span>
                  <strong>{formatPrice(booking.totalPrice)}</strong>
                  {booking.caregiver?.profileId && (
                    <button
                      type="button"
                      className="my-booking-rebook"
                      onClick={() => void handleRebook(booking)}
                      disabled={rebookingId === booking._id}
                    >
                      <RotateCcw size={16} />
                      {rebookingId === booking._id ? 'Đang tải...' : 'Đặt lại dịch vụ này'}
                    </button>
                  )}
                </footer>
              </article>
            ))}
          </section>
        </div>
      </main>
      <Footer />
      <CaregiverDetailModal
        caregiver={selectedCaregiver}
        onClose={() => setSelectedCaregiver(null)}
        startWithBookingForm
      />
    </div>
  );
};
