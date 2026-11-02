import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CalendarClock, CheckCircle2, Clock3, MapPin, RefreshCw, UserRound, XCircle, Heart, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { CaregiverHeader } from '../components/CaregiverHeader';
import { useAuth } from '../context/AuthContext';
import { getMyAcceptedCareRequests, updateCareRequestStatus } from '../services/careRequestService';
import { CareRequestItem } from '../types/careRequest';
import {
  Booking,
  cancelBooking,
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

const careRequestStatusLabel: Record<CareRequestItem['status'], string> = {
  OPEN: 'Đang tìm người chăm sóc',
  ACCEPTED: 'Đã nhận việc',
  IN_PROGRESS: 'Đang chăm sóc',
  COMPLETED: 'Đã hoàn thành',
  CANCELLED: 'Đã hủy',
};

type WorkFilter = 'ALL' | 'CARE_REQUEST' | 'BOOKING';

export const CaregiverBookingsPage: React.FC = () => {
  const { account, isAuthenticated, loading: authLoading, refreshAuthProfile } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [careRequests, setCareRequests] = useState<CareRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [careRequestsLoading, setCareRequestsLoading] = useState(true);
  const [error, setError] = useState('');
  const [careRequestsError, setCareRequestsError] = useState('');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [updatingCareRequestId, setUpdatingCareRequestId] = useState<string | null>(null);
  const [workFilter, setWorkFilter] = useState<WorkFilter>('ALL');
  const [bookingToCancel, setBookingToCancel] = useState<Booking | null>(null);
  const [cancellationReason, setCancellationReason] = useState('');
  const [cancellingBooking, setCancellingBooking] = useState(false);
  const knownBookingIds = useRef<Set<string> | null>(null);
  const visibleBookings = [...bookings].sort((first, second) => {
    if (first.status === 'PENDING' && second.status !== 'PENDING') return -1;
    if (first.status !== 'PENDING' && second.status === 'PENDING') return 1;
    return new Date(second.startTime).getTime() - new Date(first.startTime).getTime();
  });
  const pendingBookingCount = visibleBookings.filter((booking) => booking.status === 'PENDING').length;
  const totalWorkCount = careRequests.length + visibleBookings.length;
  const showCareRequests = workFilter !== 'BOOKING';
  const showBookings = workFilter !== 'CARE_REQUEST';

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

  const loadCareRequests = useCallback(async (silent = false) => {
    if (!silent) {
      setCareRequestsLoading(true);
      setCareRequestsError('');
    }

    try {
      setCareRequests(await getMyAcceptedCareRequests());
    } catch (requestError) {
      const message = requestError instanceof Error
        ? requestError.message
        : 'Không thể tải yêu cầu chăm sóc đã nhận.';
      if (silent) {
        console.error('Không thể tự động cập nhật yêu cầu chăm sóc của caregiver:', requestError);
      } else {
        setCareRequestsError(message);
      }
    } finally {
      if (!silent) setCareRequestsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/auth?redirect=/caregiver/bookings', { replace: true });
    } else if (!authLoading && account?.role !== 'CAREGIVER') {
      navigate('/', { replace: true });
    }
  }, [account?.role, authLoading, isAuthenticated, navigate]);

  useEffect(() => {
    if (isAuthenticated && account?.role === 'CAREGIVER') {
      void loadBookings();
      void loadCareRequests();
      const intervalId = window.setInterval(() => {
        void loadBookings(true);
        void loadCareRequests(true);
      }, 15000);

      return () => window.clearInterval(intervalId);
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [account?.role, authLoading, isAuthenticated, loadBookings, loadCareRequests]);

  const handleUpdateCareRequest = async (
    request: CareRequestItem,
    newStatus: 'IN_PROGRESS' | 'COMPLETED'
  ) => {
    setUpdatingCareRequestId(request._id);
    try {
      const updatedRequest = await updateCareRequestStatus(request._id, newStatus);
      setCareRequests((current) =>
        current.map((item) => item._id === request._id ? updatedRequest : item)
      );
      toast.success(
        newStatus === 'IN_PROGRESS'
          ? 'Đã bắt đầu chăm sóc. Khách hàng sẽ thấy trạng thái mới.'
          : 'Đã hoàn thành yêu cầu chăm sóc.'
      );
    } catch (requestError) {
      const message = requestError instanceof Error
        ? requestError.message
        : 'Không thể cập nhật tiến độ chăm sóc.';
      toast.error(message);
    } finally {
      setUpdatingCareRequestId(null);
    }
  };

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

  const handleCancelBooking = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!bookingToCancel) return;

    const reason = cancellationReason.trim();
    if (reason.length < 3) {
      toast.error('Vui lòng nhập lý do hủy lịch (ít nhất 3 ký tự).');
      return;
    }

    setCancellingBooking(true);
    try {
      const response = await cancelBooking(bookingToCancel._id, reason);
      setBookings((current) =>
        current.map((booking) =>
          booking._id === bookingToCancel._id
            ? { ...booking, ...response.data.booking }
            : booking
        )
      );
      await refreshAuthProfile();

      const { caregiverCancellationCount, penaltyPointsDeducted } = response.data;
      if (caregiverCancellationCount !== null && caregiverCancellationCount <= 2) {
        toast.success(
          `Đã hủy lịch. Đây là lần ${caregiverCancellationCount}, chưa bị trừ điểm uy tín.`
        );
      } else if (penaltyPointsDeducted > 0) {
        toast.success(`Đã hủy lịch và bị trừ ${penaltyPointsDeducted} điểm uy tín.`);
      } else {
        toast.success('Đã hủy lịch thành công.');
      }

      setBookingToCancel(null);
      setCancellationReason('');
    } catch (requestError) {
      const message = requestError instanceof Error
        ? requestError.message
        : 'Không thể hủy lịch đặt.';
      toast.error(message);
    } finally {
      setCancellingBooking(false);
    }
  };

  return (
    <div className="caregiver-bookings-layout">
      {authLoading ? null : isAuthenticated && account?.role === 'CAREGIVER' ? (
        <CaregiverHeader />
      ) : null}
      <main className="caregiver-bookings-page">
        <div className="container">
          <header className="caregiver-bookings-heading">
            <span className="tag-badge">KHU VỰC NGƯỜI CHĂM SÓC</span>
            <h1>Công việc của tôi</h1>
            <p>Theo dõi yêu cầu chăm sóc đã nhận và lịch khách đặt tại cùng một nơi.</p>
          </header>

          {isAuthenticated && (
            <section className="caregiver-work-overview" aria-label="Lọc công việc">
              <div className="caregiver-work-summary">
                <strong>{totalWorkCount}</strong>
                <span>công việc</span>
                <small>
                  {careRequests.length} yêu cầu chăm sóc · {visibleBookings.length} lịch đặt dịch vụ
                </small>
              </div>
              <div className="caregiver-work-filters" role="group" aria-label="Loại công việc">
                <button
                  type="button"
                  className={workFilter === 'ALL' ? 'active' : ''}
                  aria-pressed={workFilter === 'ALL'}
                  onClick={() => setWorkFilter('ALL')}
                >
                  Tất cả
                </button>
                <button
                  type="button"
                  className={workFilter === 'CARE_REQUEST' ? 'active' : ''}
                  aria-pressed={workFilter === 'CARE_REQUEST'}
                  onClick={() => setWorkFilter('CARE_REQUEST')}
                >
                  Yêu cầu chăm sóc
                </button>
                <button
                  type="button"
                  className={workFilter === 'BOOKING' ? 'active' : ''}
                  aria-pressed={workFilter === 'BOOKING'}
                  onClick={() => setWorkFilter('BOOKING')}
                >
                  Lịch đặt dịch vụ
                </button>
              </div>
            </section>
          )}

          {authLoading && (
            <section className="caregiver-bookings-state" role="status">
              Đang kiểm tra phiên đăng nhập...
            </section>
          )}

          {isAuthenticated && (
            <>
            {showCareRequests && (
            <section className="caregiver-bookings-list caregiver-care-requests" aria-live="polite">
              <div className="caregiver-bookings-list-heading">
                <div>
                  <h2>Yêu cầu chăm sóc đã nhận</h2>
                  <p>{careRequests.length} yêu cầu đang được giao cho bạn</p>
                </div>
                <button
                  type="button"
                  className="caregiver-bookings-refresh"
                  onClick={() => void loadCareRequests()}
                  disabled={careRequestsLoading}
                >
                  <RefreshCw size={16} />
                  Tải yêu cầu
                </button>
              </div>

              {careRequestsLoading && (
                <div className="caregiver-bookings-state">Đang tải yêu cầu chăm sóc...</div>
              )}
              {!careRequestsLoading && careRequestsError && (
                <div className="caregiver-bookings-state caregiver-bookings-error" role="alert">
                  <p>{careRequestsError}</p>
                  <button type="button" onClick={() => void loadCareRequests()}>Thử lại</button>
                </div>
              )}
              {!careRequestsLoading && !careRequestsError && careRequests.length === 0 && (
                <div className="caregiver-bookings-state">
                  Bạn chưa nhận yêu cầu chăm sóc nào.
                  <br />
                  Các yêu cầu bạn tiếp nhận từ bảng tin sẽ xuất hiện tại đây.
                </div>
              )}

              {!careRequestsLoading && !careRequestsError && careRequests.map((request) => (
                <article className="caregiver-booking-card" key={request._id}>
                  <div className="caregiver-booking-card-heading">
                    <div className="caregiver-booking-customer">
                      <span className="caregiver-booking-avatar"><Heart size={20} /></span>
                      <div>
                        <h3>{request.title}</h3>
                        <p>
                          Người cần chăm sóc: {request.recipient.name}
                          {request.customer?.fullName ? ` · ${request.customer.fullName}` : ''}
                        </p>
                      </div>
                    </div>
                    <span className={`caregiver-booking-status status-${request.status.toLowerCase()}`}>
                      {careRequestStatusLabel[request.status]}
                    </span>
                  </div>

                  <div className="caregiver-booking-details">
                    <p><CalendarClock size={17} /> Bắt đầu: {formatDate(request.schedule.startDate)}</p>
                    <p><Clock3 size={17} /> {request.schedule.timeSlot} · {request.schedule.dailyHours} giờ/ngày</p>
                    <p><MapPin size={17} /> {request.location.address}, {request.location.area}{request.location.city ? `, ${request.location.city}` : ''}</p>
                    {request.customer?.phone && (
                      <p><UserRound size={17} /> Liên hệ: {request.customer.phone}</p>
                    )}
                  </div>

                  <p className="caregiver-booking-note">{request.description}</p>

                  <footer className="caregiver-booking-footer">
                    <div>
                      <span>Ngân sách dự kiến</span>
                      <strong>{formatPrice(request.expectedBudget)}</strong>
                      <small>{request.recipient.age} tuổi · {request.recipient.relationship}</small>
                    </div>
                    <div className="caregiver-booking-actions">
                      {request.status === 'ACCEPTED' && (
                        <button
                          type="button"
                          className="caregiver-booking-confirm"
                          onClick={() => void handleUpdateCareRequest(request, 'IN_PROGRESS')}
                          disabled={updatingCareRequestId === request._id}
                        >
                          <ArrowRight size={17} />
                          {updatingCareRequestId === request._id ? 'Đang cập nhật...' : 'Bắt đầu chăm sóc'}
                        </button>
                      )}
                      {request.status === 'IN_PROGRESS' && (
                        <button
                          type="button"
                          className="caregiver-booking-confirm"
                          onClick={() => void handleUpdateCareRequest(request, 'COMPLETED')}
                          disabled={updatingCareRequestId === request._id}
                        >
                          <CheckCircle2 size={17} />
                          {updatingCareRequestId === request._id ? 'Đang cập nhật...' : 'Hoàn thành'}
                        </button>
                      )}
                    </div>
                  </footer>
                </article>
              ))}
            </section>
            )}

            {showBookings && (
            <section className="caregiver-bookings-list" aria-live="polite">
              <div className="caregiver-bookings-list-heading">
                <div>
                  <h2>Lịch khách đặt dịch vụ</h2>
                  <p>{visibleBookings.length} lịch · {pendingBookingCount} chờ caregiver xác nhận</p>
                  <small className="caregiver-bookings-debug">
                    GET /api/bookings/incoming
                    {lastUpdated && ` · Tải lúc ${lastUpdated.toLocaleTimeString('vi-VN')}`}
                  </small>
                </div>
                <button
                  type="button"
                  className="caregiver-bookings-refresh"
                  onClick={() => {
                    void loadBookings();
                    void loadCareRequests();
                  }}
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

              {!loading && !error && bookings.length === 0 && careRequests.length === 0 && (
                <div className="caregiver-bookings-state">
                  Chưa có lịch đặt dịch vụ nào.
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
                    ) : booking.status === 'CONFIRMED' ? (
                      <div className="caregiver-booking-actions">
                        <span className="caregiver-booking-status-text">
                          {statusLabel[booking.status]}
                        </span>
                        <button
                          type="button"
                          className="caregiver-booking-reject"
                          onClick={() => {
                            setBookingToCancel(booking);
                            setCancellationReason('');
                          }}
                        >
                          <XCircle size={17} />
                          Hủy lịch
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
            </>
          )}
        </div>
      </main>

      {bookingToCancel && (
        <div
          className="caregiver-cancel-modal-backdrop"
          onClick={() => !cancellingBooking && setBookingToCancel(null)}
        >
          <form
            className="caregiver-cancel-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="caregiver-cancel-title"
            onSubmit={handleCancelBooking}
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id="caregiver-cancel-title">Xác nhận hủy lịch</h2>
            <p>
              Hủy lịch đã xác nhận có thể ảnh hưởng đến điểm uy tín. Hai lần hủy đầu tiên
              không bị trừ điểm; từ lần thứ ba, hệ thống sẽ trừ 5 hoặc 15 điểm tùy thời
              gian còn lại trước giờ bắt đầu.
            </p>
            <label htmlFor="caregiver-cancel-reason">Lý do hủy</label>
            <textarea
              id="caregiver-cancel-reason"
              value={cancellationReason}
              onChange={(event) => setCancellationReason(event.target.value)}
              placeholder="Nhập lý do để khách hàng nắm được thông tin..."
              minLength={3}
              required
              rows={4}
            />
            <div className="caregiver-cancel-modal-actions">
              <button
                type="button"
                className="caregiver-cancel-modal-back"
                onClick={() => setBookingToCancel(null)}
                disabled={cancellingBooking}
              >
                Quay lại
              </button>
              <button
                type="submit"
                className="caregiver-cancel-modal-submit"
                disabled={cancellingBooking || cancellationReason.trim().length < 3}
              >
                {cancellingBooking ? 'Đang hủy...' : 'Xác nhận hủy lịch'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
