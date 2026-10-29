import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axiosClient from '../api/axiosClient';
import { Navbar } from '../components/Navbar';
import toast from 'react-hot-toast';
import {
  HeartHandshake,
  Clock,
  MapPin,
  Award,
  DollarSign,
  FileText,
  AlertCircle,
  CheckCircle,
  ShieldCheck,
  Send,
} from 'lucide-react';

const AVAILABLE_AREAS = [
  'Ninh Kiều',
  'Cái Răng',
  'Bình Thủy',
  'Ô Môn',
  'Thốt Nốt',
  'Phong Điền',
  'Thới Lai',
  'Cờ Đỏ',
];

const AVAILABLE_SKILLS = [
  'Chăm sóc người cao tuổi',
  'Chăm bệnh nhân tại viện',
  'Vật lý trị liệu & Phục hồi chức năng',
  'Nấu ăn dinh dưỡng & Cho ăn qua sonde',
  'Chăm sóc vết thương & Thay băng',
  'Chăm sóc mẹ & bé sau sinh',
  'Hỗ trợ vệ sinh cá nhân & Tắm gội',
  'Túc trực ca đêm',
];

export const BecomeCaregiverPage = () => {
  const navigate = useNavigate();
  const { account, user, caregiverProfile, updateCaregiverProfile, isAuthenticated, loading } = useAuth();

  // Form states
  const [idCardNumber, setIdCardNumber] = useState('');
  const [experienceYears, setExperienceYears] = useState(1);
  const [serviceAreas, setServiceAreas] = useState([]);
  const [skills, setSkills] = useState([]);
  const [bio, setBio] = useState('');
  const [pricing, setPricing] = useState({
    hourlyRate: 100000,
    dailyRate: 800000,
    weeklyRate: 4500000,
    monthlyRate: 15000000,
  });

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Protected Route: Nếu chưa đăng nhập thì đẩy về /auth kèm param redirect
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      toast.error('Vui lòng đăng nhập để đăng ký làm Cộng tác viên.');
      navigate('/auth?redirect=/become-caregiver', { replace: true });
    }
  }, [loading, isAuthenticated, navigate]);

  // Nếu đã có hồ sơ trước đó thì tự điền dữ liệu
  useEffect(() => {
    if (caregiverProfile) {
      setIdCardNumber(caregiverProfile.idCardNumber || '');
      setExperienceYears(caregiverProfile.experienceYears || 1);
      setServiceAreas(caregiverProfile.serviceAreas || []);
      setSkills(caregiverProfile.skills || []);
      setBio(caregiverProfile.bio || '');
      if (caregiverProfile.pricing) {
        setPricing({
          hourlyRate: caregiverProfile.pricing.hourlyRate || 100000,
          dailyRate: caregiverProfile.pricing.dailyRate || 800000,
          weeklyRate: caregiverProfile.pricing.weeklyRate || 4500000,
          monthlyRate: caregiverProfile.pricing.monthlyRate || 15000000,
        });
      }
    }
  }, [caregiverProfile]);

  // Toggle chọn khu vực
  const handleToggleArea = (area) => {
    setServiceAreas((prev) =>
      prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area]
    );
  };

  // Toggle chọn kỹ năng
  const handleToggleSkill = (skill) => {
    setSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  // Xử lý gửi hồ sơ
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!idCardNumber.trim()) {
      setErrorMessage('Vui lòng nhập số CMND/CCCD.');
      return;
    }

    if (serviceAreas.length === 0) {
      setErrorMessage('Vui lòng chọn ít nhất 1 khu vực bạn có thể nhận ca làm việc.');
      return;
    }

    if (skills.length === 0) {
      setErrorMessage('Vui lòng chọn ít nhất 1 kỹ năng chuyên môn của bạn.');
      return;
    }

    if (!pricing.hourlyRate || !pricing.dailyRate) {
      setErrorMessage('Vui lòng nhập giá theo giờ và giá theo ngày.');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        idCardNumber: idCardNumber.trim(),
        experienceYears: Number(experienceYears),
        serviceAreas,
        skills,
        pricing: {
          hourlyRate: Number(pricing.hourlyRate),
          dailyRate: Number(pricing.dailyRate),
          weeklyRate: pricing.weeklyRate ? Number(pricing.weeklyRate) : null,
          monthlyRate: pricing.monthlyRate ? Number(pricing.monthlyRate) : null,
        },
        bio: bio.trim(),
      };

      const res = await axiosClient.post('/auth/register-caregiver', payload);

      if (res.success && res.data) {
        toast.success(res.message || 'Gửi hồ sơ thành công!');
        updateCaregiverProfile(res.data);
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Có lỗi xảy ra khi gửi hồ sơ. Vui lòng thử lại.';
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 0', color: '#64748b' }}>
        Đang tải dữ liệu tài khoản...
      </div>
    );
  }

  const isPending = caregiverProfile?.approvalStatus === 'PENDING';
  const isApproved = caregiverProfile?.approvalStatus === 'APPROVED';

  return (
    <div style={{ backgroundColor: '#f8fafc', minHeight: '100vh', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* Header */}
      <Navbar />

      <main style={{ maxWidth: '860px', margin: '40px auto', padding: '0 20px' }}>
        {/* Tiêu đề & Giới thiệu */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 16px',
              borderRadius: '9999px',
              backgroundColor: '#eff6ff',
              color: '#1d4ed8',
              fontSize: '13px',
              fontWeight: 700,
              marginBottom: '12px',
            }}
          >
            <HeartHandshake size={16} />
            <span>ĐỐI TÁC CHĂM SÓC SỨC KHỎE</span>
          </div>
          <h1 style={{ fontSize: '32px', fontWeight: 800, color: '#0f172a', margin: '0 0 10px 0' }}>
            Đăng ký trở thành Cộng tác viên CareLink
          </h1>
          <p style={{ color: '#64748b', fontSize: '15.5px', maxWidth: '620px', margin: '0 auto', lineHeight: 1.6 }}>
            Kết nối với hàng nghìn gia đình có nhu cầu chăm sóc người thân. Tự do sắp xếp thời gian làm việc và tối ưu thu nhập minh bạch.
          </p>
        </div>

        {/* THÔNG BÁO TRẠNG THÁI NẾU ĐÃ NỘP HỒ SƠ */}
        {isPending && (
          <div
            style={{
              backgroundColor: '#eff6ff',
              border: '1.5px solid #93c5fd',
              borderRadius: '16px',
              padding: '24px',
              marginBottom: '32px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '16px',
            }}
          >
            <Clock size={28} className="text-blue-600" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <h3 style={{ margin: '0 0 6px 0', color: '#1e3a8a', fontSize: '17px', fontWeight: 700 }}>
                Hồ sơ đối tác đang ở trạng thái Chờ duyệt (PENDING)
              </h3>
              <p style={{ margin: 0, color: '#334155', fontSize: '14.5px', lineHeight: 1.55 }}>
                Đội ngũ chuyên môn CareLink đang tiến hành xác minh số CCCD, bằng cấp chuyên môn và kinh nghiệm thực tế. Chúng tôi sẽ thông báo kết quả trong vòng 24 giờ làm việc.
              </p>
            </div>
          </div>
        )}

        {isApproved && (
          <div
            style={{
              backgroundColor: '#ecfdf5',
              border: '1.5px solid #a7f3d0',
              borderRadius: '16px',
              padding: '24px',
              marginBottom: '32px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '16px',
            }}
          >
            <ShieldCheck size={28} className="text-emerald-600" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <h3 style={{ margin: '0 0 6px 0', color: '#065f46', fontSize: '17px', fontWeight: 700 }}>
                Hồ sơ của bạn đã được PHÊ DUYỆT chính thức!
              </h3>
              <p style={{ margin: 0, color: '#047857', fontSize: '14.5px', lineHeight: 1.55 }}>
                Chúc mừng bạn đã gia nhập đội ngũ đối tác CareLink. Hồ sơ của bạn đã xuất hiện trên trang danh sách tìm kiếm và sẵn sàng nhận các ca chăm sóc từ khách hàng.
              </p>
            </div>
          </div>
        )}

        {/* FORM ĐĂNG KÝ */}
        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '20px',
            boxShadow: '0 4px 20px -2px rgba(0,0,0,0.06)',
            border: '1px solid #e2e8f0',
            padding: '36px',
          }}
        >
          {errorMessage && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px 16px',
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '10px',
                color: '#dc2626',
                fontSize: '14px',
                marginBottom: '24px',
              }}
            >
              <AlertCircle size={18} />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* 1. Thông tin tài khoản liên kết (Read-only) */}
            <div style={{ marginBottom: '28px', paddingBottom: '24px', borderBottom: '1px solid #f1f5f9' }}>
              <h3 style={{ fontSize: '16.5px', fontWeight: 700, color: '#0f172a', marginBottom: '14px' }}>
                1. Thông tin cá nhân cơ bản
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#64748b', marginBottom: '6px' }}>
                    Họ và tên (Từ tài khoản)
                  </label>
                  <input
                    type="text"
                    value={user?.fullName || ''}
                    disabled
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      backgroundColor: '#f8fafc',
                      color: '#475569',
                      fontSize: '14px',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#64748b', marginBottom: '6px' }}>
                    Số điện thoại
                  </label>
                  <input
                    type="text"
                    value={user?.phone || ''}
                    disabled
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      backgroundColor: '#f8fafc',
                      color: '#475569',
                      fontSize: '14px',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#64748b', marginBottom: '6px' }}>
                    Email đăng ký
                  </label>
                  <input
                    type="text"
                    value={account?.email || ''}
                    disabled
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                      backgroundColor: '#f8fafc',
                      color: '#475569',
                      fontSize: '14px',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>
            </div>

            {/* 2. Giấy tờ định danh & Kinh nghiệm */}
            <div style={{ marginBottom: '28px', paddingBottom: '24px', borderBottom: '1px solid #f1f5f9' }}>
              <h3 style={{ fontSize: '16.5px', fontWeight: 700, color: '#0f172a', marginBottom: '14px' }}>
                2. Định danh & Kinh nghiệm nghề nghiệp
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13.5px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    Số CMND / Căn cước công dân *
                  </label>
                  <input
                    type="text"
                    placeholder="VD: 079123456789"
                    value={idCardNumber}
                    onChange={(e) => setIdCardNumber(e.target.value)}
                    disabled={isPending || isApproved}
                    required
                    style={{
                      width: '100%',
                      padding: '11px 14px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '14px',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13.5px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    Số năm kinh nghiệm chăm sóc / y tế *
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={50}
                    value={experienceYears}
                    onChange={(e) => setExperienceYears(e.target.value)}
                    disabled={isPending || isApproved}
                    required
                    style={{
                      width: '100%',
                      padding: '11px 14px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '14px',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>
            </div>

            {/* 3. Khu vực hoạt động (Service Areas) */}
            <div style={{ marginBottom: '28px', paddingBottom: '24px', borderBottom: '1px solid #f1f5f9' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <MapPin size={18} className="text-blue-600" />
                <h3 style={{ fontSize: '16.5px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                  3. Khu vực nhận việc (Chọn các quận/huyện) *
                </h3>
              </div>
              <p style={{ color: '#64748b', fontSize: '13px', margin: '0 0 14px 0' }}>
                Hệ thống sẽ lọc bài đăng tìm người phù hợp tại những khu vực bạn đã tích chọn:
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '10px' }}>
                {AVAILABLE_AREAS.map((area) => (
                  <label
                    key={area}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: serviceAreas.includes(area) ? '1.5px solid #2563eb' : '1px solid #cbd5e1',
                      backgroundColor: serviceAreas.includes(area) ? '#eff6ff' : '#ffffff',
                      cursor: isPending || isApproved ? 'not-allowed' : 'pointer',
                      fontSize: '13.5px',
                      fontWeight: serviceAreas.includes(area) ? 600 : 400,
                      color: serviceAreas.includes(area) ? '#1d4ed8' : '#334155',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={serviceAreas.includes(area)}
                      onChange={() => handleToggleArea(area)}
                      disabled={isPending || isApproved}
                      style={{ cursor: 'pointer' }}
                    />
                    <span>{area}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* 4. Kỹ năng chuyên môn (Skills) */}
            <div style={{ marginBottom: '28px', paddingBottom: '24px', borderBottom: '1px solid #f1f5f9' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <Award size={18} className="text-blue-600" />
                <h3 style={{ fontSize: '16.5px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                  4. Kỹ năng chuyên môn *
                </h3>
              </div>
              <p style={{ color: '#64748b', fontSize: '13px', margin: '0 0 14px 0' }}>
                Tích chọn những công việc bạn thành thạo để khách hàng tin tưởng lựa chọn:
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '10px' }}>
                {AVAILABLE_SKILLS.map((skill) => (
                  <label
                    key={skill}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: skills.includes(skill) ? '1.5px solid #2563eb' : '1px solid #cbd5e1',
                      backgroundColor: skills.includes(skill) ? '#eff6ff' : '#ffffff',
                      cursor: isPending || isApproved ? 'not-allowed' : 'pointer',
                      fontSize: '13.5px',
                      fontWeight: skills.includes(skill) ? 600 : 400,
                      color: skills.includes(skill) ? '#1d4ed8' : '#334155',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={skills.includes(skill)}
                      onChange={() => handleToggleSkill(skill)}
                      disabled={isPending || isApproved}
                      style={{ cursor: 'pointer' }}
                    />
                    <span>{skill}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* 5. Cấu hình bảng giá (Pricing) */}
            <div style={{ marginBottom: '28px', paddingBottom: '24px', borderBottom: '1px solid #f1f5f9' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <DollarSign size={18} className="text-blue-600" />
                <h3 style={{ fontSize: '16.5px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                  5. Bảng giá mong muốn của bạn (VNĐ)
                </h3>
              </div>
              <p style={{ color: '#64748b', fontSize: '13px', margin: '0 0 16px 0' }}>
                Mức giá bạn đề xuất cho từng gói chăm sóc (Khách hàng sẽ nhìn thấy mức giá này):
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    Giá theo giờ (VNĐ/giờ) *
                  </label>
                  <input
                    type="number"
                    step={10000}
                    value={pricing.hourlyRate}
                    onChange={(e) => setPricing({ ...pricing, hourlyRate: e.target.value })}
                    disabled={isPending || isApproved}
                    required
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '14px',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    Giá trọn ngày (24h) *
                  </label>
                  <input
                    type="number"
                    step={50000}
                    value={pricing.dailyRate}
                    onChange={(e) => setPricing({ ...pricing, dailyRate: e.target.value })}
                    disabled={isPending || isApproved}
                    required
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '14px',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    Gói 1 tuần (Tùy chọn)
                  </label>
                  <input
                    type="number"
                    step={100000}
                    value={pricing.weeklyRate || ''}
                    onChange={(e) => setPricing({ ...pricing, weeklyRate: e.target.value })}
                    disabled={isPending || isApproved}
                    placeholder="VD: 4500000"
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '14px',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                    Gói 1 tháng (Tùy chọn)
                  </label>
                  <input
                    type="number"
                    step={500000}
                    value={pricing.monthlyRate || ''}
                    onChange={(e) => setPricing({ ...pricing, monthlyRate: e.target.value })}
                    disabled={isPending || isApproved}
                    placeholder="VD: 16000000"
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '14px',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
              </div>
            </div>

            {/* 6. Giới thiệu bản thân (Bio) */}
            <div style={{ marginBottom: '32px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <FileText size={18} className="text-blue-600" />
                <h3 style={{ fontSize: '16.5px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                  6. Giới thiệu bản thân & Điểm mạnh
                </h3>
              </div>
              <textarea
                rows={4}
                placeholder="Chia sẻ về tính cách, kinh nghiệm chăm sóc người cao tuổi, tính chu đáo, cẩn thận của bạn để tăng độ tin cậy..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                disabled={isPending || isApproved}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box',
                  lineHeight: 1.5,
                }}
              />
            </div>

            {/* Submit button */}
            {!isApproved && (
              <button
                type="submit"
                disabled={submitting || isPending}
                style={{
                  width: '100%',
                  padding: '15px',
                  borderRadius: '12px',
                  backgroundColor: isPending ? '#cbd5e1' : submitting ? '#93c5fd' : '#2563eb',
                  color: '#ffffff',
                  fontSize: '16px',
                  fontWeight: 700,
                  border: 'none',
                  cursor: isPending || submitting ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px',
                  boxShadow: isPending ? 'none' : '0 4px 14px rgba(37,99,235,0.3)',
                  transition: 'all 0.2s',
                }}
              >
                <Send size={18} />
                <span>
                  {isPending
                    ? 'Hồ sơ đang chờ duyệt (Không thể gửi lại)'
                    : submitting
                    ? 'Đang gửi hồ sơ...'
                    : 'Gửi hồ sơ đăng ký Cộng tác viên'}
                </span>
              </button>
            )}
          </form>
        </div>
      </main>
    </div>
  );
};

export default BecomeCaregiverPage;

