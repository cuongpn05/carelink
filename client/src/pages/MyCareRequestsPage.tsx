import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Navbar } from '../components/Navbar';
import { PostCareRequestModal } from '../components/PostCareRequestModal';
import {
  getMyCareRequests,
  cancelCareRequest,
  updateCareRequestStatus,
} from '../services/careRequestService';
import {
  CareRequestItem,
  CareRequestStatus,
  CareRequestStats,
} from '../types/careRequest';
import toast from 'react-hot-toast';
import './MyCareRequestsPage.css';
import {
  Plus,
  Clock,
  Calendar,
  MapPin,
  User,
  Heart,
  Baby,
  Home,
  Cross,
  Phone,
  Star,
  CheckCircle2,
  AlertCircle,
  XCircle,
  FileText,
  DollarSign,
  ChevronRight,
  ShieldCheck,
  Check,
} from 'lucide-react';

const CATEGORY_NAMES: Record<string, { label: string; icon: React.ReactNode }> = {
  'elderly-care': { label: 'Chăm sóc người cao tuổi', icon: <Heart size={14} /> },
  'child-care': { label: 'Chăm sóc trẻ em', icon: <Baby size={14} /> },
  'home-care': { label: 'Chăm sóc tại nhà', icon: <Home size={14} /> },
  'post-treatment-care': { label: 'Chăm sóc sau điều trị', icon: <Cross size={14} /> },
};

const STATUS_LABELS: Record<CareRequestStatus, { label: string; icon: React.ReactNode }> = {
  OPEN: { label: 'Đang chờ tiếp nhận', icon: <Clock size={12} /> },
  ACCEPTED: { label: 'Đã có người nhận', icon: <CheckCircle2 size={12} /> },
  IN_PROGRESS: { label: 'Đang thực hiện', icon: <Clock size={12} /> },
  COMPLETED: { label: 'Đã hoàn thành', icon: <Check size={12} /> },
  CANCELLED: { label: 'Đã hủy', icon: <XCircle size={12} /> },
};

export const MyCareRequestsPage: React.FC = () => {
  const { isAuthenticated, account } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<string>('ALL');
  const [requests, setRequests] = useState<CareRequestItem[]>([]);
  const [stats, setStats] = useState<CareRequestStats>({
    ALL: 0,
    OPEN: 0,
    ACCEPTED: 0,
    IN_PROGRESS: 0,
    COMPLETED: 0,
    CANCELLED: 0,
  });
  const [loading, setLoading] = useState(true);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);

  // Detail Modal State
  const [selectedRequest, setSelectedRequest] = useState<CareRequestItem | null>(null);

  // Cancel Modal State
  const [cancelModalItem, setCancelModalItem] = useState<CareRequestItem | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  const fetchRequests = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      setLoading(true);
      const res = await getMyCareRequests(activeTab);
      setRequests(res.requests);
      setStats(res.stats);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể tải danh sách yêu cầu.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [activeTab, isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth?redirect=/my-care-requests');
      return;
    }
    fetchRequests();
  }, [isAuthenticated, navigate, fetchRequests]);

  const handleCancel = async () => {
    if (!cancelModalItem) return;
    setCancelling(true);
    try {
      await cancelCareRequest(cancelModalItem._id, cancelReason);
      toast.success('Hủy yêu cầu chăm sóc thành công!');
      setCancelModalItem(null);
      setCancelReason('');
      fetchRequests();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Hủy yêu cầu thất bại.';
      toast.error(msg);
    } finally {
      setCancelling(false);
    }
  };

  const handleStatusUpdate = async (id: string, newStatus: 'IN_PROGRESS' | 'COMPLETED') => {
    try {
      await updateCareRequestStatus(id, newStatus);
      toast.success(`Cập nhật trạng thái thành ${newStatus === 'IN_PROGRESS' ? 'Đang thực hiện' : 'Hoàn thành'}!`);
      fetchRequests();
      if (selectedRequest && selectedRequest._id === id) {
        setSelectedRequest(null);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Không thể cập nhật trạng thái.';
      toast.error(msg);
    }
  };

  const formatVND = (num: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(num);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  return (
    <div className="my-requests-page">
      <Navbar />

      <main className="my-requests-container">
        {/* Top Header */}
        <div className="my-requests-header">
          <div className="my-requests-title-group">
            <h1>Yêu cầu chăm sóc của tôi</h1>
            <p>
              Theo dõi và quản lý các yêu cầu chăm sóc bạn đã đăng tải trên CareLink
            </p>
          </div>

          <button
            type="button"
            className="post-new-btn"
            onClick={() => setIsPostModalOpen(true)}
          >
            <Plus size={18} />
            <span>Đăng yêu cầu mới</span>
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="requests-filter-tabs">
          {[
            { id: 'ALL', label: 'Tất cả', count: stats.ALL },
            { id: 'OPEN', label: 'Đang chờ tiếp nhận', count: stats.OPEN },
            { id: 'ACCEPTED', label: 'Đã tiếp nhận', count: stats.ACCEPTED },
            { id: 'IN_PROGRESS', label: 'Đang thực hiện', count: stats.IN_PROGRESS },
            { id: 'COMPLETED', label: 'Hoàn thành', count: stats.COMPLETED },
            { id: 'CANCELLED', label: 'Đã hủy', count: stats.CANCELLED },
          ].map((tab) => (
            <button
              type="button"
              key={tab.id}
              className={`request-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span>{tab.label}</span>
              <span className="tab-badge">{tab.count}</span>
            </button>
          ))}
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748b' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                border: '3px solid #e2e8f0',
                borderTopColor: '#2563eb',
                borderRadius: '50%',
                margin: '0 auto 12px',
                animation: 'spin 0.8s linear infinite',
              }}
            />
            <p style={{ fontSize: '14px' }}>Đang tải danh sách yêu cầu...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && requests.length === 0 && (
          <div className="empty-requests-box">
            <div className="empty-requests-icon">
              <FileText size={32} />
            </div>
            <h3>Chưa có yêu cầu chăm sóc nào</h3>
            <p>
              Bạn chưa có yêu cầu nào trong mục này. Hãy đăng yêu cầu ngay để CareLink kết nối người chăm sóc tận tâm cho gia đình bạn!
            </p>
            <button
              type="button"
              className="post-new-btn"
              onClick={() => setIsPostModalOpen(true)}
            >
              <Plus size={18} />
              <span>Đăng yêu cầu chăm sóc ngay</span>
            </button>
          </div>
        )}

        {/* Request Grid */}
        {!loading && requests.length > 0 && (
          <div className="requests-grid">
            {requests.map((item) => {
              const cat = CATEGORY_NAMES[item.serviceCategory] || {
                label: item.serviceCategory,
                icon: <Heart size={14} />,
              };
              const statusCfg = STATUS_LABELS[item.status] || {
                label: item.status,
                icon: <Clock size={12} />,
              };

              return (
                <div key={item._id} className="care-request-card">
                  <div>
                    {/* Top Row: Service Category + Status */}
                    <div className="card-top-row">
                      <span className={`service-badge ${item.serviceCategory}`}>
                        {cat.icon}
                        <span>{cat.label}</span>
                      </span>
                      <span className={`status-badge ${item.status}`}>
                        {statusCfg.icon}
                        <span>{statusCfg.label}</span>
                      </span>
                    </div>

                    {/* Title & Desc */}
                    <h3 className="card-title">{item.title}</h3>
                    <p className="card-desc">{item.description}</p>

                    {/* Recipient & Location info */}
                    <div className="card-info-list">
                      <div className="info-item">
                        <User size={14} />
                        <span>
                          <strong>{item.recipient.name}</strong> ({item.recipient.age} tuổi -{' '}
                          {item.recipient.relationship})
                        </span>
                      </div>
                      <div className="info-item">
                        <MapPin size={14} />
                        <span>
                          {item.location.address}, {item.location.area}
                        </span>
                      </div>
                      <div className="info-item">
                        <Calendar size={14} />
                        <span>
                          Từ {formatDate(item.schedule.startDate)}
                          {item.schedule.endDate ? ` đến ${formatDate(item.schedule.endDate)}` : ''} •{' '}
                          {item.schedule.timeSlot}
                        </span>
                      </div>
                    </div>

                    {/* Assigned Caregiver Box if Accepted */}
                    {item.acceptedCaregiver && (
                      <div className="caregiver-assigned-box">
                        <img
                          src={
                            item.acceptedCaregiver.avatarUrl ||
                            'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=150&q=80'
                          }
                          alt={item.acceptedCaregiver.fullName}
                          className="caregiver-avatar"
                        />
                        <div className="caregiver-info">
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <h5>{item.acceptedCaregiver.fullName}</h5>
                            <ShieldCheck size={14} className="text-emerald-600" />
                          </div>
                          <p>
                            ⭐ {item.acceptedCaregiver.ratingAvg?.toFixed(1) || '5.0'} •{' '}
                            {item.acceptedCaregiver.experienceYears || 1} năm kinh nghiệm
                          </p>
                          {item.acceptedCaregiver.phone && (
                            <a
                              href={`tel:${item.acceptedCaregiver.phone}`}
                              className="caregiver-phone"
                            >
                              <Phone size={12} />
                              <span>{item.acceptedCaregiver.phone}</span>
                            </a>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Card Bottom Actions */}
                  <div className="card-actions">
                    <div className="budget-highlight">
                      <span className="budget-label">Ngân sách dự kiến</span>
                      <span className="budget-val">{formatVND(item.expectedBudget)}</span>
                    </div>

                    <div className="btn-group">
                      {item.status === 'OPEN' && (
                        <button
                          type="button"
                          className="btn-cancel"
                          onClick={() => {
                            setCancelModalItem(item);
                            setCancelReason('');
                          }}
                        >
                          Hủy yêu cầu
                        </button>
                      )}

                      <button
                        type="button"
                        className="btn-detail"
                        onClick={() => setSelectedRequest(item)}
                      >
                        Chi tiết
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Post Modal */}
      <PostCareRequestModal
        isOpen={isPostModalOpen}
        onClose={() => setIsPostModalOpen(false)}
        onSuccess={fetchRequests}
      />

      {/* Detail Modal */}
      {selectedRequest && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
          onClick={() => setSelectedRequest(null)}
        >
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '20px',
              width: '100%',
              maxWidth: '680px',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '24px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                marginBottom: '16px',
              }}
            >
              <div>
                <span className={`status-badge ${selectedRequest.status}`}>
                  {STATUS_LABELS[selectedRequest.status]?.label}
                </span>
                <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', margin: '8px 0 4px' }}>
                  {selectedRequest.title}
                </h2>
                <span style={{ fontSize: '12px', color: '#64748b' }}>
                  Đăng ngày {formatDate(selectedRequest.createdAt)}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRequest(null)}
                style={{
                  border: 'none',
                  background: '#f1f5f9',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                ✕
              </button>
            </div>

            <p style={{ fontSize: '14px', color: '#334155', lineHeight: 1.6, marginBottom: '20px' }}>
              {selectedRequest.description}
            </p>

            {/* Recipient Details */}
            <div
              style={{
                backgroundColor: '#f8fafc',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                fontSize: '13px',
              }}
            >
              <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
                Thông tin người được chăm sóc
              </h4>
              <div>Họ tên: <strong>{selectedRequest.recipient.name}</strong></div>
              <div>Tuổi: {selectedRequest.recipient.age} • Giới tính: {selectedRequest.recipient.gender === 'MALE' ? 'Nam' : 'Nữ'}</div>
              <div>Mối quan hệ: {selectedRequest.recipient.relationship}</div>
              {selectedRequest.recipient.conditionNotes && (
                <div style={{ color: '#b45309' }}>
                  Tình trạng sức khỏe: {selectedRequest.recipient.conditionNotes}
                </div>
              )}
            </div>

            {/* Schedule & Location */}
            <div
              style={{
                backgroundColor: '#f8fafc',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                fontSize: '13px',
              }}
            >
              <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
                Địa điểm & Lịch làm việc
              </h4>
              <div>Địa chỉ: {selectedRequest.location.address}, {selectedRequest.location.area}, {selectedRequest.location.city}</div>
              <div>Ngày bắt đầu: {formatDate(selectedRequest.schedule.startDate)}</div>
              {selectedRequest.schedule.endDate && (
                <div>Ngày kết thúc: {formatDate(selectedRequest.schedule.endDate)}</div>
              )}
              <div>Khung giờ: {selectedRequest.schedule.timeSlot} ({selectedRequest.schedule.dailyHours} giờ/ngày)</div>
              <div>Ngân sách: <strong style={{ color: '#2563eb' }}>{formatVND(selectedRequest.expectedBudget)}</strong></div>
            </div>

            {/* Special Requirements */}
            {selectedRequest.specialRequirements && selectedRequest.specialRequirements.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
                  Yêu cầu đặc biệt
                </h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {selectedRequest.specialRequirements.map((r) => (
                    <span
                      key={r}
                      style={{
                        padding: '4px 10px',
                        backgroundColor: '#eff6ff',
                        color: '#1d4ed8',
                        borderRadius: '999px',
                        fontSize: '12px',
                        fontWeight: 500,
                      }}
                    >
                      ✓ {r}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Accepted Caregiver Info */}
            {selectedRequest.acceptedCaregiver && (
              <div
                style={{
                  backgroundColor: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderRadius: '14px',
                  padding: '16px',
                  marginBottom: '20px',
                }}
              >
                <h4 style={{ margin: '0 0 10px', fontSize: '14px', fontWeight: 700, color: '#166534' }}>
                  Người chăm sóc đã tiếp nhận yêu cầu
                </h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <img
                    src={
                      selectedRequest.acceptedCaregiver.avatarUrl ||
                      'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=150&q=80'
                    }
                    alt={selectedRequest.acceptedCaregiver.fullName}
                    style={{ width: '56px', height: '56px', borderRadius: '50%', objectFit: 'cover' }}
                  />
                  <div>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#14532d' }}>
                      {selectedRequest.acceptedCaregiver.fullName}
                    </h3>
                    <p style={{ margin: '2px 0 0', fontSize: '13px', color: '#166534' }}>
                      Kinh nghiệm: {selectedRequest.acceptedCaregiver.experienceYears || 1} năm • ⭐{' '}
                      {selectedRequest.acceptedCaregiver.ratingAvg?.toFixed(1) || '5.0'}
                    </p>
                    {selectedRequest.acceptedCaregiver.phone && (
                      <p style={{ margin: '4px 0 0', fontSize: '14px', fontWeight: 700, color: '#15803d' }}>
                        Điện thoại liên hệ: <a href={`tel:${selectedRequest.acceptedCaregiver.phone}`}>{selectedRequest.acceptedCaregiver.phone}</a>
                      </p>
                    )}
                  </div>
                </div>

                {/* Status action buttons */}
                {selectedRequest.status === 'ACCEPTED' && (
                  <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => handleStatusUpdate(selectedRequest._id, 'IN_PROGRESS')}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: '#2563eb',
                        color: '#fff',
                        borderRadius: '8px',
                        border: 'none',
                        fontSize: '13px',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Bắt đầu thực hiện chăm sóc
                    </button>
                  </div>
                )}

                {selectedRequest.status === 'IN_PROGRESS' && (
                  <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => handleStatusUpdate(selectedRequest._id, 'COMPLETED')}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: '#16a34a',
                        color: '#fff',
                        borderRadius: '8px',
                        border: 'none',
                        fontSize: '13px',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Xác nhận đã hoàn thành
                    </button>
                  </div>
                )}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => setSelectedRequest(null)}
                style={{
                  padding: '9px 18px',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  background: '#fff',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {cancelModalItem && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
          onClick={() => setCancelModalItem(null)}
        >
          <div
            style={{
              backgroundColor: '#fff',
              borderRadius: '16px',
              padding: '24px',
              maxWidth: '480px',
              width: '100%',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: '0 0 10px', fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>
              Xác nhận hủy yêu cầu chăm sóc?
            </h3>
            <p style={{ fontSize: '14px', color: '#64748b', margin: '0 0 16px', lineHeight: 1.5 }}>
              Yêu cầu <strong>"{cancelModalItem.title}"</strong> sẽ được đóng lại và không còn xuất hiện trên bảng tin tìm người chăm sóc.
            </p>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '6px' }}>
                Lý do hủy yêu cầu (tùy chọn):
              </label>
              <textarea
                rows={2}
                placeholder="VD: Thay đổi kế hoạch, đã tìm được người thân chăm sóc..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '13px',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setCancelModalItem(null)}
                style={{
                  padding: '9px 16px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  background: '#fff',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Quay lại
              </button>
              <button
                type="button"
                disabled={cancelling}
                onClick={handleCancel}
                style={{
                  padding: '9px 18px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: '#ef4444',
                  color: '#fff',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: cancelling ? 'not-allowed' : 'pointer',
                }}
              >
                {cancelling ? 'Đang xử lý...' : 'Xác nhận hủy'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyCareRequestsPage;

