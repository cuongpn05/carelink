import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axiosClient from '../api/axiosClient';
import { Navbar } from '../components/Navbar';
import { CaregiverHeader } from '../components/CaregiverHeaderComponent';
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
  Plus,
  Edit2,
  Trash2,
  Navigation,
  Compass,
  Star,
  X,
  MapPinned,
} from 'lucide-react';
import * as userService from '../services/userService';
import './ProfilePage.css';

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
  'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=200&q=80',
  'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=200&q=80',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
];

const VIETNAMESE_PHONE_REGEX = /^(0|\+84)(3[2-9]|5[2689]|7[06-9]|8[1-9]|9[0-9])[0-9]{7}$/;

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

  // Form states - Change Password
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Address Book states
  const [addresses, setAddresses] = useState([]);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [addressModalOpen, setAddressModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null); // null if adding new
  const [savingAddress, setSavingAddress] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [addressToDelete, setAddressToDelete] = useState(null);
  const [deletingAddress, setDeletingAddress] = useState(false);
  const [settingDefaultId, setSettingDefaultId] = useState(null);

  // Address Modal Form fields
  const [formLabel, setFormLabel] = useState('Nhà riêng');
  const [formRecipientName, setFormRecipientName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formProvinceCode, setFormProvinceCode] = useState('');
  const [formProvinceName, setFormProvinceName] = useState('');
  const [formWardCode, setFormWardCode] = useState('');
  const [formWardName, setFormWardName] = useState('');
  const [formDetail, setFormDetail] = useState('');
  const [formCoordinates, setFormCoordinates] = useState(null); // [lng, lat]
  const [formIsDefault, setFormIsDefault] = useState(false);
  const [fetchingGeo, setFetchingGeo] = useState(false);

  // Administrative Master Data
  const [provincesList, setProvincesList] = useState([]);
  const [wardsList, setWardsList] = useState([]);
  const [loadingWards, setLoadingWards] = useState(false);

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

  // Đồng bộ thông tin từ AuthContext vào Form Thông tin cá nhân
  useEffect(() => {
    if (user) {
      setFullName(user.fullName || '');
      setPhone(user.phone || '');
      setGender(user.gender || 'OTHER');
      setAvatarUrl(user.avatarUrl || '');
      if (user.dateOfBirth) {
        try {
          setDateOfBirth(new Date(user.dateOfBirth).toISOString().split('T')[0]);
        } catch {
          setDateOfBirth('');
        }
      }
    }
  }, [user]);

  // Tải danh sách địa chỉ và danh mục 63 tỉnh/thành khi đăng nhập
  useEffect(() => {
    if (isAuthenticated) {
      fetchAddresses();
      fetchProvinces();
    }
  }, [isAuthenticated]);

  const fetchAddresses = async () => {
    try {
      setLoadingAddresses(true);
      const list = await userService.getUserAddresses();
      setAddresses(list);
    } catch (err) {
      console.warn('Lỗi khi tải sổ địa chỉ:', err?.message);
    } finally {
      setLoadingAddresses(false);
    }
  };

  const fetchProvinces = async () => {
    try {
      const list = await userService.getAdministrativeProvinces();
      setProvincesList(list);
    } catch (err) {
      console.warn('Lỗi khi tải danh mục tỉnh/thành:', err?.message);
    }
  };

  // Tải danh sách phường/xã khi tỉnh thành thay đổi
  const handleProvinceChange = async (provCode) => {
    setFormProvinceCode(provCode);
    const prov = provincesList.find((p) => p.code === provCode);
    setFormProvinceName(prov ? prov.name : '');
    setFormWardCode('');
    setFormWardName('');
    setWardsList([]);

    if (!provCode) return;

    try {
      setLoadingWards(true);
      const list = await userService.getAdministrativeWards(provCode);
      setWardsList(list);
    } catch (err) {
      console.warn('Lỗi khi tải phường xã:', err?.message);
    } finally {
      setLoadingWards(false);
    }
  };

  // Mở modal thêm địa chỉ mới
  const handleOpenAddModal = () => {
    setEditingAddress(null);
    setFormLabel('Nhà riêng');
    setFormRecipientName(fullName || '');
    setFormPhone(phone || '');
    setFormProvinceCode('');
    setFormProvinceName('');
    setFormWardCode('');
    setFormWardName('');
    setFormDetail('');
    setFormCoordinates(null);
    // Nếu chưa có địa chỉ nào, tự động chọn làm mặc định
    setFormIsDefault(addresses.length === 0);
    setWardsList([]);
    setAddressModalOpen(true);
  };

  // Mở modal chỉnh sửa địa chỉ
  const handleOpenEditModal = async (addr) => {
    setEditingAddress(addr);
    setFormLabel(addr.label || 'Nhà riêng');
    setFormRecipientName(addr.recipientName || '');
    setFormPhone(addr.phone || '');
    setFormProvinceCode(addr.provinceCode || '');
    setFormProvinceName(addr.provinceName || '');
    setFormWardCode(addr.wardCode || '');
    setFormWardName(addr.wardName || '');
    setFormDetail(addr.detail || '');
    setFormCoordinates(addr.location?.coordinates || null);
    setFormIsDefault(Boolean(addr.isDefault));

    setAddressModalOpen(true);

    if (addr.provinceCode) {
      try {
        setLoadingWards(true);
        const list = await userService.getAdministrativeWards(addr.provinceCode);
        setWardsList(list);
      } catch (err) {
        console.warn('Lỗi tải phường xã cho địa chỉ:', err?.message);
      } finally {
        setLoadingWards(false);
      }
    } else {
      setWardsList([]);
    }
  };

  // Lấy tọa độ GPS thiết bị hiện tại (HTML5 Geolocation)
  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Trình duyệt của bạn không hỗ trợ định vị GPS.');
      return;
    }

    setFetchingGeo(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setFormCoordinates([longitude, latitude]);
        setFetchingGeo(false);
        toast.success(`Đã lấy vị trí GPS thành công! (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`);
      },
      (err) => {
        setFetchingGeo(false);
        let errorMsg = 'Không thể lấy tọa độ vị trí.';
        if (err.code === 1) errorMsg = 'Bạn đã từ chối cấp quyền truy cập vị trí.';
        else if (err.code === 2) errorMsg = 'Vị trí hiện tại không khả dụng.';
        else if (err.code === 3) errorMsg = 'Hết thời gian chờ lấy vị trí.';
        toast.error(errorMsg);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Lưu địa chỉ (Thêm mới hoặc Cập nhật)
  const handleSaveAddress = async (e) => {
    e.preventDefault();

    if (!formRecipientName.trim()) {
      toast.error('Vui lòng nhập họ tên người nhận.');
      return;
    }

    if (!formPhone.trim()) {
      toast.error('Vui lòng nhập số điện thoại người nhận.');
      return;
    }

    if (!VIETNAMESE_PHONE_REGEX.test(formPhone.trim())) {
      toast.error('Số điện thoại không đúng định dạng Việt Nam (VD: 0901234567 hoặc +84901234567).');
      return;
    }

    if (!formProvinceName) {
      toast.error('Vui lòng chọn Tỉnh / Thành phố.');
      return;
    }

    if (!formWardName) {
      toast.error('Vui lòng chọn hoặc nhập Phường / Xã.');
      return;
    }

    if (!formDetail.trim()) {
      toast.error('Vui lòng nhập địa chỉ chi tiết (số nhà, tên đường...).');
      return;
    }

    const payload = {
      label: formLabel,
      recipientName: formRecipientName.trim(),
      phone: formPhone.trim(),
      provinceCode: formProvinceCode,
      provinceName: formProvinceName,
      wardCode: formWardCode,
      wardName: formWardName,
      detail: formDetail.trim(),
      isDefault: formIsDefault,
    };

    if (formCoordinates && formCoordinates.length === 2) {
      payload.location = {
        coordinates: formCoordinates,
      };
    }

    try {
      setSavingAddress(true);
      if (editingAddress) {
        const res = await userService.updateUserAddress(editingAddress._id, payload);
        toast.success(res?.message || 'Cập nhật địa chỉ thành công!');
      } else {
        const res = await userService.addUserAddress(payload);
        toast.success(res?.message || 'Thêm địa chỉ mới thành công!');
      }

      setAddressModalOpen(false);
      await fetchAddresses();

      // Cập nhật lại user trong AuthContext để đồng bộ defaultAddress
      const updatedProfile = await userService.getUserProfile();
      if (updatedProfile?.user) {
        updateUserData(updatedProfile.user);
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Không thể lưu địa chỉ. Vui lòng thử lại.';
      toast.error(msg);
    } finally {
      setSavingAddress(false);
    }
  };

  // Đặt làm địa chỉ mặc định
  const handleSetDefault = async (addressId) => {
    try {
      setSettingDefaultId(addressId);
      const res = await userService.setDefaultUserAddress(addressId);
      toast.success(res?.message || 'Đã đặt làm địa chỉ mặc định!');
      await fetchAddresses();

      const updatedProfile = await userService.getUserProfile();
      if (updatedProfile?.user) {
        updateUserData(updatedProfile.user);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi khi đặt địa chỉ mặc định.');
    } finally {
      setSettingDefaultId(null);
    }
  };

  // Xóa địa chỉ
  const handleConfirmDelete = async () => {
    if (!addressToDelete) return;
    try {
      setDeletingAddress(true);
      const res = await userService.deleteUserAddress(addressToDelete._id);
      toast.success(res?.message || 'Đã xóa địa chỉ thành công!');
      setDeleteModalOpen(false);
      setAddressToDelete(null);
      await fetchAddresses();

      const updatedProfile = await userService.getUserProfile();
      if (updatedProfile?.user) {
        updateUserData(updatedProfile.user);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi khi xóa địa chỉ.');
    } finally {
      setDeletingAddress(false);
    }
  };

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

    if (!fullName.trim() || fullName.trim().length < 2) {
      toast.error('Họ và tên phải có ít nhất 2 ký tự.');
      return;
    }

    if (!phone.trim()) {
      toast.error('Số điện thoại không được để trống.');
      return;
    }

    if (!VIETNAMESE_PHONE_REGEX.test(phone.trim())) {
      toast.error('Số điện thoại không hợp lệ (VD: 0901234567 hoặc +84901234567).');
      return;
    }

    if (dateOfBirth) {
      const dob = new Date(dateOfBirth);
      if (isNaN(dob.getTime()) || dob > new Date()) {
        toast.error('Ngày sinh không hợp lệ hoặc đang ở tương lai.');
        return;
      }
    }

    try {
      setSavingProfile(true);
      const payload = {
        fullName: fullName.trim(),
        phone: phone.trim(),
        avatarUrl: avatarUrl.trim(),
        gender,
        dateOfBirth: dateOfBirth || null,
      };

      const res = await userService.updateUserProfile(payload);
      if (res.user) {
        toast.success('Cập nhật thông tin cá nhân thành công!');
        updateUserData(res.user);
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

  // Label tag color helper
  const getLabelTagClass = (label) => {
    if (label === 'Nhà riêng') return 'home';
    if (label === 'Công ty') return 'work';
    return 'other';
  };

  return (
    <div style={{ backgroundColor: '#f8fafc', minHeight: '100vh', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {account?.role === 'CAREGIVER' ? <CaregiverHeader /> : <Navbar />}

      <main style={{ maxWidth: '1200px', width: '92%', margin: '36px auto', padding: '0 0 60px' }}>
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
            <span>Thông tin cá nhân & Địa chỉ</span>
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
        {/* TAB 1: THÔNG TIN CÁ NHÂN & SỔ ĐỊA CHỈ (INFO) */}
        {/* ========================================================= */}
        {activeTab === 'INFO' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
            {/* KHU VỰC 1: THÔNG TIN HỒ SƠ CÁ NHÂN */}
            <div className="profile-section-card">
              <div className="profile-section-header">
                <div className="profile-section-title-wrap">
                  <User size={20} className="text-blue-600" />
                  <div>
                    <h3 className="profile-section-title">Thông tin cá nhân</h3>
                    <p className="profile-section-desc">Cập nhật họ tên, liên hệ và thông tin cơ bản để nhận diện tài khoản</p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSaveProfile}>
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
                        max={new Date().toISOString().split('T')[0]}
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

                {/* Nút lưu hồ sơ */}
                <div style={{ marginTop: '24px', textAlign: 'right' }}>
                  <button
                    type="submit"
                    disabled={savingProfile}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '11px 24px',
                      backgroundColor: savingProfile ? '#93c5fd' : '#2563eb',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '10px',
                      fontSize: '14px',
                      fontWeight: 700,
                      cursor: savingProfile ? 'not-allowed' : 'pointer',
                      boxShadow: '0 2px 8px rgba(37,99,235,0.2)',
                    }}
                  >
                    <Save size={16} />
                    <span>{savingProfile ? 'Đang lưu...' : 'Lưu thông tin cá nhân'}</span>
                  </button>
                </div>
              </form>
            </div>

            {/* KHU VỰC 2: SỔ ĐỊA CHỈ (ADDRESS BOOK) */}
            <div className="profile-section-card">
              <div className="profile-section-header">
                <div className="profile-section-title-wrap">
                  <MapPin size={20} className="text-blue-600" />
                  <div>
                    <h3 className="profile-section-title">Sổ địa chỉ nhận dịch vụ</h3>
                    <p className="profile-section-desc">
                      Quản lý các địa chỉ gia đình để đặt lịch chăm sóc người thân nhanh chóng và thuận tiện
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  className="btn-add-address"
                  onClick={handleOpenAddModal}
                >
                  <Plus size={16} />
                  <span>Thêm địa chỉ mới</span>
                </button>
              </div>

              {/* Danh sách địa chỉ */}
              {loadingAddresses ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748b' }}>
                  Đang tải danh sách địa chỉ...
                </div>
              ) : addresses.length === 0 ? (
                <div className="address-empty-state">
                  <MapPinned size={48} style={{ color: '#94a3b8', margin: '0 auto 12px' }} />
                  <h4 style={{ margin: '0 0 6px 0', color: '#1e293b', fontSize: '16px', fontWeight: 700 }}>
                    Bạn chưa lưu địa chỉ nào
                  </h4>
                  <p style={{ margin: '0 0 16px 0', color: '#64748b', fontSize: '13.5px' }}>
                    Thêm địa chỉ nhà riêng hoặc nơi người thân đang sinh sống để CareLink kết nối người chăm sóc gần nhất.
                  </p>
                  <button
                    type="button"
                    className="btn-add-address"
                    onClick={handleOpenAddModal}
                  >
                    <Plus size={16} />
                    <span>Thêm địa chỉ đầu tiên</span>
                  </button>
                </div>
              ) : (
                <div className="address-grid">
                  {addresses.map((addr) => {
                    const tagClass = getLabelTagClass(addr.label);
                    const hasCoordinates =
                      addr.location?.coordinates &&
                      Array.isArray(addr.location.coordinates) &&
                      addr.location.coordinates.length === 2 &&
                      addr.location.coordinates[0] !== 0;

                    return (
                      <div
                        key={addr._id}
                        className={`address-card ${addr.isDefault ? 'is-default' : ''}`}
                      >
                        <div>
                          <div className="address-card-header">
                            <div className="address-card-tags">
                              <span className={`address-tag ${tagClass}`}>
                                {addr.label || 'Nhà riêng'}
                              </span>
                              {addr.isDefault && (
                                <span className="address-default-badge">
                                  <Star size={11} fill="#ffffff" />
                                  <span>Mặc định</span>
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="address-card-body">
                            <div className="address-recipient-name">
                              {addr.recipientName}
                            </div>
                            <div className="address-phone">
                              <Phone size={13} style={{ color: '#64748b' }} />
                              <span>{addr.phone}</span>
                            </div>
                            <p className="address-full-text">
                              {addr.fullAddress || `${addr.detail}, ${addr.wardName}, ${addr.provinceName}`}
                            </p>

                            {/* Badges bổ trợ */}
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
                              {hasCoordinates && (
                                <div className="address-geo-badge">
                                  <Navigation size={12} />
                                  <span>
                                    GPS: {addr.location.coordinates[1].toFixed(4)},{' '}
                                    {addr.location.coordinates[0].toFixed(4)}
                                  </span>
                                </div>
                              )}
                              {addr.isLegacyMigrated && (
                                <div className="address-legacy-badge">
                                  <History size={12} />
                                  <span>Đồng bộ từ tài khoản cũ</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Thanh thao tác card */}
                        <div className="address-card-actions">
                          {addr.isDefault ? (
                            <span style={{ fontSize: '12.5px', fontWeight: 600, color: '#16a34a', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <CheckCircle2 size={14} />
                              <span>Địa chỉ nhận mặc định</span>
                            </span>
                          ) : (
                            <button
                              type="button"
                              className="btn-address-default-action"
                              disabled={settingDefaultId === addr._id}
                              onClick={() => handleSetDefault(addr._id)}
                            >
                              <Star size={13} />
                              <span>{settingDefaultId === addr._id ? 'Đang đặt...' : 'Đặt làm mặc định'}</span>
                            </button>
                          )}

                          <div className="address-card-btn-group">
                            <button
                              type="button"
                              className="btn-address-icon"
                              title="Chỉnh sửa địa chỉ"
                              onClick={() => handleOpenEditModal(addr)}
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              type="button"
                              className="btn-address-icon delete"
                              title="Xóa địa chỉ"
                              onClick={() => {
                                setAddressToDelete(addr);
                                setDeleteModalOpen(true);
                              }}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* MODAL THÊM / SỬA ĐỊA CHỈ */}
        {addressModalOpen && (
          <div className="address-modal-overlay">
            <div className="address-modal-box">
              <div className="address-modal-header">
                <h3>{editingAddress ? 'Cập nhật địa chỉ' : 'Thêm địa chỉ mới'}</h3>
                <button
                  type="button"
                  onClick={() => setAddressModalOpen(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    padding: '4px',
                    borderRadius: '6px',
                  }}
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSaveAddress}>
                <div className="address-modal-body">
                  {/* Chọn nhãn địa chỉ */}
                  <div style={{ marginBottom: '18px' }}>
                    <label className="address-form-label">Loại địa chỉ</label>
                    <div className="address-chips-group" style={{ marginBottom: 0 }}>
                      {['Nhà riêng', 'Công ty', 'Khác'].map((lbl) => (
                        <button
                          key={lbl}
                          type="button"
                          className={`address-chip-btn ${formLabel === lbl ? 'active' : ''}`}
                          onClick={() => setFormLabel(lbl)}
                        >
                          {lbl}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Họ tên và SĐT người nhận */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '16px' }}>
                    <div>
                      <label className="address-form-label">
                        Họ tên người nhận <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <input
                        type="text"
                        required
                        className="address-form-input"
                        placeholder="VD: Nguyễn Văn A"
                        value={formRecipientName}
                        onChange={(e) => setFormRecipientName(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="address-form-label">
                        Số điện thoại người nhận <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <input
                        type="tel"
                        required
                        className="address-form-input"
                        placeholder="VD: 0901234567"
                        value={formPhone}
                        onChange={(e) => setFormPhone(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Tỉnh/Thành và Phường/Xã */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '16px' }}>
                    <div>
                      <label className="address-form-label">
                        Tỉnh / Thành phố <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      <select
                        className="address-form-select"
                        value={formProvinceCode}
                        onChange={(e) => handleProvinceChange(e.target.value)}
                        required
                      >
                        <option value="">-- Chọn Tỉnh / Thành phố --</option>
                        {provincesList.map((p) => (
                          <option key={p.code} value={p.code}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="address-form-label">
                        Phường / Xã <span style={{ color: '#ef4444' }}>*</span>
                      </label>
                      {wardsList.length > 0 ? (
                        <select
                          className="address-form-select"
                          value={formWardCode}
                          onChange={(e) => {
                            setFormWardCode(e.target.value);
                            const w = wardsList.find((item) => item.code === e.target.value);
                            setFormWardName(w ? w.name : '');
                          }}
                          required
                          disabled={!formProvinceCode || loadingWards}
                        >
                          <option value="">
                            {loadingWards ? '-- Đang tải danh sách...' : '-- Chọn Phường / Xã --'}
                          </option>
                          {wardsList.map((w) => (
                            <option key={w.code} value={w.code}>
                              {w.name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          className="address-form-input"
                          placeholder={
                            !formProvinceCode
                              ? 'Vui lòng chọn Tỉnh/Thành trước'
                              : loadingWards
                              ? 'Đang tải danh sách...'
                              : 'Nhập Phường / Xã'
                          }
                          value={formWardName}
                          onChange={(e) => setFormWardName(e.target.value)}
                          required
                          disabled={!formProvinceCode || loadingWards}
                        />
                      )}
                    </div>
                  </div>

                  {/* Địa chỉ chi tiết */}
                  <div style={{ marginBottom: '18px' }}>
                    <label className="address-form-label">
                      Địa chỉ cụ thể (Số nhà, tên đường, tòa nhà...) <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="text"
                      required
                      className="address-form-input"
                      placeholder="VD: Số 123 Đường 30/4, Tòa nhà A"
                      value={formDetail}
                      onChange={(e) => setFormDetail(e.target.value)}
                    />
                  </div>

                  {/* Định vị GPS */}
                  <div
                    style={{
                      padding: '14px',
                      backgroundColor: '#f8fafc',
                      borderRadius: '12px',
                      border: '1px solid #e2e8f0',
                      marginBottom: '18px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Compass size={18} className="text-blue-600" />
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b' }}>
                            Tọa độ vị trí địa lý (GPS)
                          </div>
                          <div style={{ fontSize: '12px', color: '#64748b' }}>
                            Hỗ trợ thuật toán tìm Caregiver gần nhất và tính khoảng cách di chuyển chính xác
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleGetCurrentLocation}
                        disabled={fetchingGeo}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '7px 14px',
                          backgroundColor: '#ffffff',
                          color: '#2563eb',
                          border: '1px solid #bfdbfe',
                          borderRadius: '8px',
                          fontSize: '12.5px',
                          fontWeight: 600,
                          cursor: fetchingGeo ? 'not-allowed' : 'pointer',
                        }}
                      >
                        <Navigation size={13} />
                        <span>{fetchingGeo ? 'Đang định vị...' : 'Lấy vị trí hiện tại'}</span>
                      </button>
                    </div>

                    {formCoordinates && (
                      <div
                        style={{
                          marginTop: '10px',
                          padding: '8px 12px',
                          backgroundColor: '#eff6ff',
                          borderRadius: '8px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          fontSize: '12.5px',
                          color: '#1e40af',
                        }}
                      >
                        <span>
                          📍 Tọa độ đã lưu: Kinh độ {formCoordinates[0].toFixed(5)}, Vĩ độ {formCoordinates[1].toFixed(5)}
                        </span>
                        <button
                          type="button"
                          onClick={() => setFormCoordinates(null)}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: '#ef4444',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: 600,
                          }}
                        >
                          Xóa tọa độ
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Đặt làm mặc định checkbox */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="checkbox"
                      id="defaultCheckbox"
                      checked={formIsDefault}
                      onChange={(e) => setFormIsDefault(e.target.checked)}
                      style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                    />
                    <label
                      htmlFor="defaultCheckbox"
                      style={{ fontSize: '13.5px', fontWeight: 600, color: '#334155', cursor: 'pointer' }}
                    >
                      Đặt địa chỉ này làm địa chỉ nhận dịch vụ mặc định
                    </label>
                  </div>
                </div>

                <div className="address-modal-footer">
                  <button
                    type="button"
                    onClick={() => setAddressModalOpen(false)}
                    style={{
                      padding: '9px 18px',
                      backgroundColor: '#ffffff',
                      border: '1px solid #cbd5e1',
                      borderRadius: '8px',
                      fontSize: '13.5px',
                      fontWeight: 600,
                      color: '#475569',
                      cursor: 'pointer',
                    }}
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    disabled={savingAddress}
                    style={{
                      padding: '9px 20px',
                      backgroundColor: savingAddress ? '#93c5fd' : '#2563eb',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '13.5px',
                      fontWeight: 700,
                      cursor: savingAddress ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {savingAddress ? 'Đang lưu...' : editingAddress ? 'Cập nhật địa chỉ' : 'Lưu địa chỉ'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL XÁC NHẬN XÓA ĐỊA CHỈ */}
        {deleteModalOpen && addressToDelete && (
          <div className="address-modal-overlay">
            <div className="address-modal-box" style={{ maxWidth: '440px' }}>
              <div className="address-modal-header">
                <h3 style={{ color: '#dc2626' }}>Xác nhận xóa địa chỉ</h3>
                <button
                  type="button"
                  onClick={() => setDeleteModalOpen(false)}
                  style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                >
                  <X size={20} />
                </button>
              </div>

              <div className="address-modal-body">
                <p style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#334155', lineHeight: 1.5 }}>
                  Bạn có chắc chắn muốn xóa địa chỉ:
                </p>
                <div style={{ backgroundColor: '#f8fafc', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '14px' }}>
                  <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '14px' }}>
                    {addressToDelete.recipientName} ({addressToDelete.label})
                  </div>
                  <div style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>
                    {addressToDelete.fullAddress}
                  </div>
                </div>

                {addressToDelete.isDefault && (
                  <div style={{ fontSize: '12.5px', color: '#b45309', backgroundColor: '#fffbeb', padding: '10px 12px', borderRadius: '8px', border: '1px solid #fde68a' }}>
                    ⚠️ Đây là địa chỉ mặc định hiện tại. Nếu xóa, hệ thống sẽ tự động gán địa chỉ tiếp theo trong danh sách làm mặc định.
                  </div>
                )}
              </div>

              <div className="address-modal-footer">
                <button
                  type="button"
                  onClick={() => setDeleteModalOpen(false)}
                  style={{
                    padding: '9px 18px',
                    backgroundColor: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    fontSize: '13.5px',
                    fontWeight: 600,
                    color: '#475569',
                    cursor: 'pointer',
                  }}
                >
                  Hủy
                </button>
                <button
                  type="button"
                  disabled={deletingAddress}
                  onClick={handleConfirmDelete}
                  style={{
                    padding: '9px 20px',
                    backgroundColor: deletingAddress ? '#fca5a5' : '#dc2626',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '13.5px',
                    fontWeight: 700,
                    cursor: deletingAddress ? 'not-allowed' : 'pointer',
                  }}
                >
                  {deletingAddress ? 'Đang xóa...' : 'Đồng ý xóa'}
                </button>
              </div>
            </div>
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
                    color: '#94a3b8',
                    backgroundColor: '#f8fafc',
                    borderRadius: '12px',
                    border: '1px dashed #cbd5e1',
                  }}
                >
                  <History size={36} style={{ margin: '0 auto 10px', opacity: 0.6 }} />
                  <p style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>
                    Chưa có lịch sử thay đổi điểm nào. Tài khoản của bạn luôn giữ trạng thái uy tín tốt nhất!
                  </p>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #f1f5f9', color: '#64748b' }}>
                        <th style={{ padding: '12px 16px', fontWeight: 600 }}>Thời gian</th>
                        <th style={{ padding: '12px 16px', fontWeight: 600 }}>Hành vi / Nguyên nhân</th>
                        <th style={{ padding: '12px 16px', fontWeight: 600 }}>Biến động</th>
                        <th style={{ padding: '12px 16px', fontWeight: 600 }}>Điểm sau biến động</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reputationLogs.map((log, index) => {
                        const isPositive = log.delta > 0;
                        return (
                          <tr key={index} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '14px 16px', color: '#64748b', fontSize: '13px' }}>
                              {new Date(log.createdAt).toLocaleString('vi-VN')}
                            </td>
                            <td style={{ padding: '14px 16px', color: '#1e293b', fontWeight: 500 }}>
                              {log.reason || 'Cập nhật hệ thống'}
                            </td>
                            <td style={{ padding: '14px 16px', fontWeight: 700 }}>
                              <span
                                style={{
                                  color: isPositive ? '#16a34a' : '#dc2626',
                                  backgroundColor: isPositive ? '#f0fdf4' : '#fef2f2',
                                  padding: '4px 10px',
                                  borderRadius: '9999px',
                                  fontSize: '13px',
                                }}
                              >
                                {isPositive ? `+${log.delta}` : log.delta} điểm
                              </span>
                            </td>
                            <td style={{ padding: '14px 16px', fontWeight: 700, color: '#0f172a' }}>
                              {log.scoreAfter} / 100
                            </td>
                          </tr>
                        );
                      })}
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
              maxWidth: '680px',
              boxShadow: '0 4px 20px -2px rgba(0,0,0,0.04)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <KeyRound size={20} className="text-blue-600" />
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>
                Thay đổi mật khẩu đăng nhập
              </h3>
            </div>
            <p style={{ margin: '0 0 24px 0', color: '#64748b', fontSize: '14px' }}>
              Để bảo mật tài khoản, vui lòng sử dụng mật khẩu mạnh kết hợp chữ cái, số và ký tự đặc biệt.
            </p>

            <form onSubmit={handleChangePassword}>
              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '13.5px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Mật khẩu hiện tại <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input
                    type="password"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    required
                    placeholder="••••••••"
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
                  Mật khẩu mới (Tối thiểu 6 ký tự) <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    placeholder="••••••••"
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

              <div style={{ marginBottom: '26px' }}>
                <label style={{ display: 'block', fontSize: '13.5px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                  Xác nhận lại mật khẩu mới <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    placeholder="••••••••"
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
