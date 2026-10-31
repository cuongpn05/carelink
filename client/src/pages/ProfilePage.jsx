import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axiosClient from '../api/axiosClient';
import { Navbar } from '../components/Navbar';
import toast from 'react-hot-toast';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Shield,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  Lock,
  CheckCircle2,
  AlertCircle,
  HeartHandshake,
  Camera,
  History,
  KeyRound,
  Save,
  Check,
} from 'lucide-react';

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
  'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=200&q=80',
  'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=200&q=80',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
];

export const ProfilePage = () => {
  const navigate = useNavigate();
  const { account, user, caregiverProfile, updateUserData, isAuthenticated, loading: authLoading } = useAuth();

  // Tabs: 'INFO' | 'REPUTATION' | 'SECURITY' | 'CAREGIVER'
  const [activeTab, setActiveTab] = useState('INFO');

  // Form states - Personal Info
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState('OTHER');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [city, setCity] = useState('');
  const [district, setDistrict] = useState('');
  const [ward, setWard] = useState('');
  const [detailAddress, setDetailAddress] = useState('');

  // Form states - Change Password
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // UI states
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [reputationLogs, setReputationLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);

  // Chuyển hướng nếu chưa đăng nhập
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/auth?redirect=/profile', { replace: true });
    }
  }, [isAuthenticated, authLoading, navigate]);

  // Đồng bộ thông tin từ AuthContext vào Form
  useEffect(() => {
    if (user) {
      setFullName(user.fullName || '');
      setPhone(user.phone || '');
      setGender(user.gender || 'OTHER');
      setAvatarUrl(user.avatarUrl || '');
      if (user.dateOfBirth) {
        setDateOfBirth(new Date(user.dateOfBirth).toISOString().split('T')[0]);
      }
      if (user.defaultAddress) {
        setCity(user.defaultAddress.city || '');
        setDistrict(user.defaultAddress.district || '');
        setWard(user.defaultAddress.ward || '');
        setDetailAddress(user.defaultAddress.detail || '');
      }
    }
  }, [user]);

  // Tải lịch sử biến động điểm uy tín khi mở tab REPUTATION
  useEffect(() => {
    if (activeTab === 'REPUTATION' && isAuthenticated) {
      const fetchLogs = async () => {
        try {
          setLoadingLogs(true);
          const res = await axiosClient.get('/user/reputation-logs');
          if (res.success && res.data?.logs) {
            setReputationLogs(res.data.logs);
          }
        } catch (err) {
          console.warn('Không thể tải lịch sử uy tín:', err.message);
        } finally {
          setLoadingLogs(false);
        }
      };
      fetchLogs();
    }
  }, [activeTab, isAuthenticated]);

  // 1. Xử lý lưu thông tin cá nhân
  const handleSaveProfile = async (e) => {
    e.preventDefault();

    if (!fullName.trim()) {
      toast.error('Họ và tên không được để trống.');
      return;
    }

    if (!phone.trim()) {
      toast.error('Số điện thoại không được để trống.');
      return;
    }

    try {
      setSavingProfile(true);
      const payload = {
        fullName: fullName.trim(),
        phone: phone.trim(),
        avatarUrl: avatarUrl.trim(),
        gender,
        dateOfBirth: dateOfBirth || null,
        defaultAddress: {
          city: city.trim(),
          district: district.trim(),
          ward: ward.trim(),
          detail: detailAddress.trim(),
        },
      };

      const res = await axiosClient.put('/user/profile', payload);
      if (res.success && res.data?.user) {
        toast.success('Cập nhật hồ sơ cá nhân thành công!');
        updateUserData(res.data.user);
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Có lỗi khi cập nhật hồ sơ.';
      toast.error(msg);
    } finally {
      setSavingProfile(false);
    }
  };

  // 2. Xử lý đổi mật khẩu
  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (!oldPassword || !newPassword) {
      toast.error('Vui lòng nhập mật khẩu hiện tại và mật khẩu mới.');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('Mật khẩu mới phải có ít nhất 6 ký tự.');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Mật khẩu xác nhận không khớp.');
      return;
    }

    try {
      setSavingPassword(true);
      const res = await axiosClient.put('/user/change-password', {
        oldPassword,
        newPassword,
      });

      if (res.success) {
        toast.success(res.message || 'Đổi mật khẩu thành công!');
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Đổi mật khẩu thất bại.';
      toast.error(msg);
    } finally {
      setSavingPassword(false);
    }
  };

  if (authLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0', color: '#64748b' }}>
        Đang tải thông tin tài khoản...
      </div>
    );
  }

  const score = account?.reputationScore ?? 100;
  const isSuspended = score < 50 || account?.status === 'SUSPENDED';
  const isWarning = score >= 50 && score < 70;

  let repBadgeColor = '#10b981'; // Green
  let repBgColor = '#ecfdf5';
  let repText = 'Uy tín cao (Hoạt động tốt)';
  let repIcon = <ShieldCheck size={20} className="text-emerald-600" />;

  if (isSuspended) {
    repBadgeColor = '#ef4444'; // Red
    repBgColor = '#fef2f2';
    repText = 'Tạm khóa tính năng tạo lịch (Uy tín < 50)';
    repIcon = <ShieldX size={20} className="text-rose-600" />;
  } else if (isWarning) {
    repBadgeColor = '#f59e0b'; // Amber
    repBgColor = '#fffbeb';
    repText = 'Cảnh báo mức uy tín (50 - 69 điểm)';
    repIcon = <ShieldAlert size={20} className="text-amber-600" />;
  }

  return (
    <div style={{ backgroundColor: '#f8fafc', minHeight: '100vh', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* Header Navbar */}
      <Navbar />

      <main style={{ maxWidth: '1080px', margin: '36px auto', padding: '0 20px' }}>
        {/* BANNER THÔNG TIN TỔNG QUAN & ĐIỂM UY TÍN */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '20px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 20px -2px rgba(0,0,0,0.05)',
            padding: '28px',
            marginBottom: '28px',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '24px',
          }}
        >
          {/* Cột trái: Avatar & Thông tin */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ position: 'relative' }}>
              <img
                src={
                  avatarUrl ||
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'
                }
                alt="Avatar"
                style={{
                  width: '84px',
                  height: '84px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '3px solid #e2e8f0',
                }}
              />
              <button
                type="button"
                onClick={() => setShowAvatarPicker(!showAvatarPicker)}
                title="Thay đổi ảnh đại diện"
                style={{
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                  backgroundColor: '#2563eb',
                  color: '#ffffff',
                  border: '2px solid #ffffff',
                  borderRadius: '50%',
                  width: '28px',
                  height: '28px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                }}
              >
                <Camera size={14} />
              </button>
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                  {fullName || 'Người dùng CareLink'}
                </h1>
                <span
                  style={{
                    backgroundColor: account?.role === 'CAREGIVER' ? '#f0fdf4' : '#eff6ff',
                    color: account?.role === 'CAREGIVER' ? '#166534' : '#1d4ed8',
                    border: `1px solid ${account?.role === 'CAREGIVER' ? '#bbf7d0' : '#bfdbfe'}`,
                    padding: '2px 10px',
                    borderRadius: '9999px',
                    fontSize: '12px',
                    fontWeight: 700,
                  }}
                >
                  {account?.role === 'CAREGIVER' ? 'Cộng tác viên' : 'Khách hàng'}
                </span>
              </div>
              <div style={{ fontSize: '14px', color: '#64748b', marginTop: '4px' }}>
                {account?.email} • {phone || 'Chưa cập nhật SĐT'}
              </div>
            </div>
          </div>

          {/* Cột phải: Thẻ Điểm Uy Tín */}
          <div
            style={{
              backgroundColor: repBgColor,
              border: `1.5px solid ${repBadgeColor}40`,
              borderRadius: '16px',
              padding: '16px 20px',
              minWidth: '260px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {repIcon}
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#334155' }}>
                  Điểm Uy Tín Tài Khoản
                </span>
              </div>
              <span style={{ fontSize: '18px', fontWeight: 800, color: repBadgeColor }}>
                {score}/100
              </span>
            </div>

            {/* Thanh tiến trình */}
            <div
              style={{
                width: '100%',
                height: '7px',
                backgroundColor: '#e2e8f0',
                borderRadius: '9999px',
                overflow: 'hidden',
                marginBottom: '8px',
              }}
            >
              <div
                style={{
                  width: `${score}%`,
                  height: '100%',
                  backgroundColor: repBadgeColor,
                  borderRadius: '9999px',
                  transition: 'width 0.4s ease',
                }}
              />
            </div>
            <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 500 }}>
              {repText}
            </div>
          </div>
        </div>

        {/* Modal chọn ảnh đại diện nhanh */}
        {showAvatarPicker && (
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              border: '1px solid #e2e8f0',
              padding: '16px 20px',
              marginBottom: '24px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
            }}
          >
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a', marginBottom: '10px' }}>
              Chọn ảnh đại diện mẫu hoặc dán đường dẫn ảnh:
            </div>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '12px' }}>
              {PRESET_AVATARS.map((url, idx) => (
                <img
                  key={idx}
                  src={url}
                  alt={`Preset ${idx}`}
                  onClick={() => {
                    setAvatarUrl(url);
                    setShowAvatarPicker(false);
                  }}
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    cursor: 'pointer',
                    border: avatarUrl === url ? '3px solid #2563eb' : '2px solid #e2e8f0',
                    transition: 'transform 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.1)')}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                />
              ))}
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="url"
                placeholder="Dán link ảnh (https://...)"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '13px',
                }}
              />
              <button
                type="button"
                onClick={() => setShowAvatarPicker(false)}
                style={{
                  padding: '8px 14px',
                  backgroundColor: '#2563eb',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Xong
              </button>
            </div>
          </div>
        )}

        {/* TAB NAVIGATION */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            borderBottom: '1px solid #e2e8f0',
            marginBottom: '28px',
            overflowX: 'auto',
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('INFO')}
            style={{
              padding: '12px 18px',
              backgroundColor: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'INFO' ? '2.5px solid #2563eb' : '2.5px solid transparent',
              color: activeTab === 'INFO' ? '#2563eb' : '#64748b',
              fontWeight: activeTab === 'INFO' ? 700 : 500,
              fontSize: '14.5px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              whiteSpace: 'nowrap',
            }}
          >
            <User size={16} />
            <span>Thông tin cá nhân</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('REPUTATION')}
            style={{
              padding: '12px 18px',
              backgroundColor: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'REPUTATION' ? '2.5px solid #2563eb' : '2.5px solid transparent',
              color: activeTab === 'REPUTATION' ? '#2563eb' : '#64748b',
              fontWeight: activeTab === 'REPUTATION' ? 700 : 500,
              fontSize: '14.5px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              whiteSpace: 'nowrap',
            }}
          >
            <Shield size={16} />
            <span>Thanh Uy Tín & Lịch sử ({score}đ)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('SECURITY')}
            style={{
              padding: '12px 18px',
              backgroundColor: 'transparent',
              border: 'none',
              borderBottom: activeTab === 'SECURITY' ? '2.5px solid #2563eb' : '2.5px solid transparent',
              color: activeTab === 'SECURITY' ? '#2563eb' : '#64748b',
              fontWeight: activeTab === 'SECURITY' ? 700 : 500,
              fontSize: '14.5px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              whiteSpace: 'nowrap',
            }}
          >
            <Lock size={16} />
            <span>Bảo mật & Mật khẩu</span>
          </button>

          {account?.role === 'CAREGIVER' && (
            <button
              type="button"
              onClick={() => setActiveTab('CAREGIVER')}
              style={{
                padding: '12px 18px',
                backgroundColor: 'transparent',
                border: 'none',
                borderBottom: activeTab === 'CAREGIVER' ? '2.5px solid #16a34a' : '2.5px solid transparent',
                color: activeTab === 'CAREGIVER' ? '#16a34a' : '#64748b',
                fontWeight: activeTab === 'CAREGIVER' ? 700 : 500,
                fontSize: '14.5px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                whiteSpace: 'nowrap',
              }}
            >
              <HeartHandshake size={16} />
              <span>Hồ sơ Đối tác Chuyên nghiệp</span>
            </button>
          )}
        </div>

        {/* ========================================================= */}
        {/* TAB 1: THÔNG TIN CÁ NHÂN (INFO) */}
        {/* ========================================================= */}
        {activeTab === 'INFO' && (
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '20px',
              border: '1px solid #e2e8f0',
              padding: '32px',
              boxShadow: '0 4px 20px -2px rgba(0,0,0,0.04)',
            }}
          >
            <form onSubmit={handleSaveProfile}>
              <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#0f172a', margin: '0 0 20px 0' }}>
                Hồ sơ tài khoản
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                {/* Họ và tên */}
                <div>
                  <label style={{ display: 'block', fontSize: '13.5px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    Họ và tên <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <User size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      placeholder="Nguyễn Văn A"
                      style={{
                        width: '100%',
                        padding: '11px 12px 11px 40px',
                        borderRadius: '10px',
                        border: '1px solid #cbd5e1',
                        fontSize: '14px',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                </div>

                {/* Số điện thoại */}
                <div>
                  <label style={{ display: 'block', fontSize: '13.5px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    Số điện thoại <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Phone size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                      placeholder="0901234567"
                      style={{
                        width: '100%',
                        padding: '11px 12px 11px 40px',
                        borderRadius: '10px',
                        border: '1px solid #cbd5e1',
                        fontSize: '14px',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                </div>

                {/* Email (Read-only) */}
                <div>
                  <label style={{ display: 'block', fontSize: '13.5px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    Địa chỉ Email (Đã xác thực)
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <input
                      type="email"
                      value={account?.email || ''}
                      disabled
                      style={{
                        width: '100%',
                        padding: '11px 12px 11px 40px',
                        borderRadius: '10px',
                        border: '1px solid #e2e8f0',
                        backgroundColor: '#f1f5f9',
                        color: '#64748b',
                        fontSize: '14px',
                        boxSizing: 'border-box',
                        cursor: 'not-allowed',
                      }}
                    />
                  </div>
                </div>

                {/* Giới tính */}
                <div>
                  <label style={{ display: 'block', fontSize: '13.5px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    Giới tính
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '11px 12px',
                      borderRadius: '10px',
                      border: '1px solid #cbd5e1',
                      fontSize: '14px',
                      backgroundColor: '#ffffff',
                      boxSizing: 'border-box',
                    }}
                  >
                    <option value="MALE">Nam</option>
                    <option value="FEMALE">Nữ</option>
                    <option value="OTHER">Khác</option>
                  </select>
                </div>

                {/* Ngày sinh */}
                <div>
                  <label style={{ display: 'block', fontSize: '13.5px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    Ngày sinh
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Calendar size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                    <input
                      type="date"
                      value={dateOfBirth}
                      onChange={(e) => setDateOfBirth(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '11px 12px 11px 40px',
                        borderRadius: '10px',
                        border: '1px solid #cbd5e1',
                        fontSize: '14px',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Địa chỉ mặc định */}
              <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: '1px solid #f1f5f9' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                  <MapPin size={20} className="text-blue-600" />
                  <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
                    Địa chỉ mặc định (Phục vụ đặt lịch & hỗ trợ tận nơi)
                  </h4>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                      Tỉnh / Thành phố
                    </label>
                    <input
                      type="text"
                      placeholder="VD: Cần Thơ"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                      Quận / Huyện
                    </label>
                    <input
                      type="text"
                      placeholder="VD: Ninh Kiều"
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                      Phường / Xã
                    </label>
                    <input
                      type="text"
                      placeholder="VD: An Khánh"
                      value={ward}
                      onChange={(e) => setWard(e.target.value)}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>

                <div style={{ marginTop: '16px' }}>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '4px' }}>
                    Địa chỉ chi tiết (Số nhà, tên đường, tòa nhà)
                  </label>
                  <input
                    type="text"
                    placeholder="VD: Số 123 Đường 30/4, Phường Hưng Lợi"
                    value={detailAddress}
                    onChange={(e) => setDetailAddress(e.target.value)}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              {/* Nút lưu */}
              <div style={{ marginTop: '32px', textAlign: 'right' }}>
                <button
                  type="submit"
                  disabled={savingProfile}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '12px 28px',
                    backgroundColor: savingProfile ? '#93c5fd' : '#2563eb',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '10px',
                    fontSize: '14.5px',
                    fontWeight: 700,
                    cursor: savingProfile ? 'not-allowed' : 'pointer',
                    boxShadow: '0 2px 8px rgba(37,99,235,0.25)',
                  }}
                >
                  <Save size={18} />
                  <span>{savingProfile ? 'Đang lưu...' : 'Lưu thay đổi hồ sơ'}</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: THANH UY TÍN & LỊCH SỬ (REPUTATION) */}
        {/* ========================================================= */}
        {activeTab === 'REPUTATION' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Thẻ giải thích cơ chế Uy Tín */}
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '20px',
                border: '1px solid #e2e8f0',
                padding: '28px',
                boxShadow: '0 4px 20px -2px rgba(0,0,0,0.04)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                <Shield size={22} className="text-blue-600" />
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
                  Cơ chế Thanh Điểm Uy Tín (CareLink Trust Score)
                </h3>
              </div>
              <p style={{ color: '#475569', fontSize: '14.5px', lineHeight: 1.6, margin: '0 0 16px 0' }}>
                Thanh điểm uy tín là thước đo độ tin cậy được hệ thống CareLink thiết kế để bảo vệ quyền lợi của cả Khách hàng và Người chăm sóc.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
                <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '16px' }}>
                  <div style={{ fontWeight: 700, color: '#166534', marginBottom: '6px' }}>
                    🟢 Mức Xanh: 70 - 100 Điểm
                  </div>
                  <div style={{ fontSize: '13px', color: '#15803d', lineHeight: 1.5 }}>
                    Tài khoản hoạt động uy tín và ưu tiên ghép lịch nhanh nhất. Mọi tính năng đặt và nhận lịch được kích hoạt đầy đủ.
                  </div>
                </div>

                <div style={{ backgroundColor: '#fffbeb', border: '1px solid #fde68a', borderRadius: '12px', padding: '16px' }}>
                  <div style={{ fontWeight: 700, color: '#92400e', marginBottom: '6px' }}>
                    🟡 Mức Vàng: 50 - 69 Điểm (Cảnh báo)
                  </div>
                  <div style={{ fontSize: '13px', color: '#b45309', lineHeight: 1.5 }}>
                    Tài khoản đã có tiền lệ hủy lịch hẹn sát giờ. Vui lòng hoàn thành tốt các ca chăm sóc tiếp theo để phục hồi điểm số.
                  </div>
                </div>

                <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px', padding: '16px' }}>
                  <div style={{ fontWeight: 700, color: '#991b1b', marginBottom: '6px' }}>
                    🔴 Mức Đỏ: Dưới 50 Điểm (Tạm khóa)
                  </div>
                  <div style={{ fontSize: '13px', color: '#b91c1c', lineHeight: 1.5 }}>
                    Tài khoản bị tạm khóa chức năng tạo ca hẹn mới hoặc ứng tuyển nhận việc. Bạn cần liên hệ Ban Quản Trị để được hỗ trợ.
                  </div>
                </div>
              </div>
            </div>

            {/* Bảng lịch sử biến động điểm uy tín */}
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '20px',
                border: '1px solid #e2e8f0',
                padding: '28px',
                boxShadow: '0 4px 20px -2px rgba(0,0,0,0.04)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                <History size={20} className="text-blue-600" />
                <h4 style={{ margin: 0, fontSize: '17px', fontWeight: 700, color: '#0f172a' }}>
                  Nhật ký biến động điểm uy tín
                </h4>
              </div>

              {loadingLogs ? (
                <div style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                  Đang tải lịch sử điểm uy tín...
                </div>
              ) : reputationLogs.length === 0 ? (
                <div
                  style={{
                    textAlign: 'center',
                    padding: '36px 20px',
                    backgroundColor: '#f8fafc',
                    borderRadius: '12px',
                    border: '1px dashed #cbd5e1',
                  }}
                >
                  <CheckCircle2 size={36} className="text-emerald-500" style={{ margin: '0 auto 10px' }} />
                  <div style={{ fontWeight: 700, color: '#334155', fontSize: '15px' }}>
                    Tài khoản của bạn đang có điểm uy tín tuyệt đối (100/100)
                  </div>
                  <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
                    Chưa có bất kỳ vi phạm hay lịch sử trừ điểm nào được ghi nhận.
                  </div>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13.5px' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#64748b' }}>
                        <th style={{ padding: '10px 12px' }}>Thời gian</th>
                        <th style={{ padding: '10px 12px' }}>Biến động</th>
                        <th style={{ padding: '10px 12px' }}>Điểm số</th>
                        <th style={{ padding: '10px 12px' }}>Lý do chi tiết</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reputationLogs.map((log) => (
                        <tr key={log._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                          <td style={{ padding: '12px', color: '#64748b', whiteSpace: 'nowrap' }}>
                            {new Date(log.createdAt).toLocaleString('vi-VN')}
                          </td>
                          <td style={{ padding: '12px', fontWeight: 700 }}>
                            <span
                              style={{
                                color: log.changeAmount >= 0 ? '#16a34a' : '#dc2626',
                                backgroundColor: log.changeAmount >= 0 ? '#dcfce7' : '#fee2e2',
                                padding: '3px 8px',
                                borderRadius: '6px',
                              }}
                            >
                              {log.changeAmount > 0 ? `+${log.changeAmount}` : log.changeAmount}
                            </span>
                          </td>
                          <td style={{ padding: '12px', color: '#334155', fontWeight: 600 }}>
                            {log.previousScore} → {log.newScore}
                          </td>
                          <td style={{ padding: '12px', color: '#1e293b' }}>
                            {log.reason}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: BẢO MẬT & MẬT KHẨU (SECURITY) */}
        {/* ========================================================= */}
        {activeTab === 'SECURITY' && (
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '20px',
              border: '1px solid #e2e8f0',
              padding: '32px',
              boxShadow: '0 4px 20px -2px rgba(0,0,0,0.04)',
              maxWidth: '600px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <KeyRound size={22} className="text-blue-600" />
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>
                Đổi mật khẩu đăng nhập
              </h3>
            </div>

            <form onSubmit={handleChangePassword}>
              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '13.5px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Mật khẩu hiện tại
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input
                    type="password"
                    placeholder="Nhập mật khẩu đang dùng"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '11px 12px 11px 40px',
                      borderRadius: '10px',
                      border: '1px solid #cbd5e1',
                      fontSize: '14px',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '13.5px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Mật khẩu mới
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input
                    type="password"
                    placeholder="Ít nhất 6 ký tự"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '11px 12px 11px 40px',
                      borderRadius: '10px',
                      border: '1px solid #cbd5e1',
                      fontSize: '14px',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '13.5px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Xác nhận lại mật khẩu mới
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input
                    type="password"
                    placeholder="Nhập lại mật khẩu mới"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      padding: '11px 12px 11px 40px',
                      borderRadius: '10px',
                      border: '1px solid #cbd5e1',
                      fontSize: '14px',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={savingPassword}
                style={{
                  padding: '12px 24px',
                  backgroundColor: savingPassword ? '#93c5fd' : '#2563eb',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '14.5px',
                  fontWeight: 700,
                  cursor: savingPassword ? 'not-allowed' : 'pointer',
                }}
              >
                {savingPassword ? 'Đang cập nhật...' : 'Cập nhật mật khẩu'}
              </button>
            </form>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 4: HỒ SƠ ĐỐI TÁC (Dành riêng cho Caregiver) */}
        {/* ========================================================= */}
        {activeTab === 'CAREGIVER' && account?.role === 'CAREGIVER' && (
          <div
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '20px',
              border: '1px solid #e2e8f0',
              padding: '32px',
              boxShadow: '0 4px 20px -2px rgba(0,0,0,0.04)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div>
                <h3 style={{ margin: '0 0 6px 0', fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>
                  Thông tin Chuyên môn & Bảng giá
                </h3>
                <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>
                  Hồ sơ đối tác đã được Ban Quản Trị phê duyệt chính thức
                </p>
              </div>

              <button
                type="button"
                onClick={() => navigate('/become-caregiver')}
                style={{
                  padding: '9px 18px',
                  backgroundColor: '#f0fdf4',
                  color: '#166534',
                  border: '1.5px solid #bbf7d0',
                  borderRadius: '9999px',
                  fontSize: '13.5px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Cập nhật bảng giá & chuyên môn
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '24px' }}>
              <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '13px', color: '#64748b' }}>Kinh nghiệm làm việc</div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', marginTop: '4px' }}>
                  {caregiverProfile?.experienceYears || 1} Năm
                </div>
              </div>

              <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '13px', color: '#64748b' }}>Đánh giá trung bình</div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#f59e0b', marginTop: '4px' }}>
                  ⭐ {caregiverProfile?.ratingAvg?.toFixed(1) || '5.0'} / 5.0
                </div>
              </div>

              <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '13px', color: '#64748b' }}>Mức giá theo giờ</div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#2563eb', marginTop: '4px' }}>
                  {caregiverProfile?.pricing?.hourlyRate?.toLocaleString('vi-VN') || '80.000'} đ/giờ
                </div>
              </div>
            </div>

            {/* Kỹ năng */}
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>
                Kỹ năng chuyên môn đã đăng ký:
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {(caregiverProfile?.skills || ['Chăm sóc người cao tuổi']).map((skill, i) => (
                  <span
                    key={i}
                    style={{
                      backgroundColor: '#eff6ff',
                      color: '#1d4ed8',
                      padding: '5px 12px',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: 600,
                    }}
                  >
                    ✓ {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Khu vực nhận việc */}
            <div>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#334155', marginBottom: '8px' }}>
                Khu vực nhận việc tại Cần Thơ:
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {(caregiverProfile?.serviceAreas || ['Ninh Kiều']).map((area, i) => (
                  <span
                    key={i}
                    style={{
                      backgroundColor: '#f1f5f9',
                      color: '#334155',
                      padding: '5px 12px',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: 600,
                    }}
                  >
                    📍 {area}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default ProfilePage;
