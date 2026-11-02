import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Navbar } from '../components/Navbar';
import { createCareRequest } from '../services/careRequestService';
import {
  CareServiceCategory,
  CareFrequency,
  CareBudgetUnit,
  CreateCareRequestDto,
} from '../types/careRequest';
import toast from 'react-hot-toast';
import {
  Heart,
  Baby,
  Home,
  Cross,
  Calendar,
  Clock,
  MapPin,
  Sparkles,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Info,
} from 'lucide-react';

const CATEGORIES: {
  id: CareServiceCategory;
  title: string;
  desc: string;
  icon: React.ReactNode;
}[] = [
  {
    id: 'elderly-care',
    title: 'Người cao tuổi',
    desc: 'Hỗ trợ sinh hoạt, nhắc thuốc, trò chuyện',
    icon: <Heart size={20} className="text-blue-600" />,
  },
  {
    id: 'child-care',
    title: 'Trẻ em',
    desc: 'Trông giữ, vui chơi, phát triển kỹ năng',
    icon: <Baby size={20} className="text-amber-500" />,
  },
  {
    id: 'home-care',
    title: 'Tại nhà',
    desc: 'Nấu ăn, vệ sinh phòng, chăm sóc cơ bản',
    icon: <Home size={20} className="text-emerald-500" />,
  },
  {
    id: 'post-treatment-care',
    title: 'Sau điều trị',
    desc: 'Hỗ trợ hồi phục, thay băng, vật lý trị liệu',
    icon: <Cross size={20} className="text-rose-500" />,
  },
];

const TIME_SLOT_OPTIONS = [
  '08:00 - 12:00 (Ca sáng)',
  '13:00 - 17:00 (Ca chiều)',
  '08:00 - 17:00 (Giờ hành chính)',
  '18:00 - 21:00 (Ca tối)',
  'Theo ca 12 tiếng',
  'Cả ngày & đêm (24/24)',
  'Khung giờ linh hoạt',
];

const COMMON_AREAS = [
  'Ninh Kiều',
  'Bình Thủy',
  'Cái Răng',
  'Ô Môn',
  'Thốt Nốt',
  'Quận 1',
  'Quận 3',
  'Quận 7',
  'Bình Thạnh',
  'Thủ Đức',
];

const CITIES = ['Cần Thơ', 'TP. Hồ Chí Minh', 'Hà Nội', 'Đà Nẵng', 'Bình Dương'];

const SPECIAL_TAGS = [
  'Có chứng chỉ điều dưỡng',
  'Sơ cứu cơ bản',
  'Đo huyết áp / đường huyết',
  'Biết nấu ăn dinh dưỡng',
  'Thay băng vô trùng',
  'Vật lý trị liệu cơ bản',
  'Không hút thuốc',
  'Có xe máy đi lại',
];

export const PostCareRequestPage: React.FC = () => {
  const { isAuthenticated, account } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);

  // Group 1: Loại dịch vụ & Đối tượng
  const [category, setCategory] = useState<CareServiceCategory>('elderly-care');
  const [age, setAge] = useState<number | ''>(75);
  const [gender, setGender] = useState<'FEMALE' | 'MALE' | 'OTHER'>('FEMALE');

  // Group 2: Nhu cầu & Sức khỏe
  const [description, setDescription] = useState('');

  // Group 3: Thời gian & Địa điểm
  const [city, setCity] = useState('Cần Thơ');
  const [area, setArea] = useState('Ninh Kiều');
  const [startDate, setStartDate] = useState(
    new Date(Date.now() + 24 * 3600 * 1000).toISOString().split('T')[0]
  );
  const [timeSlot, setTimeSlot] = useState(TIME_SLOT_OPTIONS[0]);
  const [dailyHours, setDailyHours] = useState(4);
  const [frequency, setFrequency] = useState<CareFrequency>('DAILY');

  // Group 4: Ngân sách & Đơn vị tính
  const [budget, setBudget] = useState<number | ''>(350000);
  const [budgetUnit, setBudgetUnit] = useState<CareBudgetUnit>('PER_DAY');

  // Collapsible: Thông tin bổ sung
  const [showAdditional, setShowAdditional] = useState(false);
  const [endDate, setEndDate] = useState('');
  const [specificAddress, setSpecificAddress] = useState('');
  const [specialReqs, setSpecialReqs] = useState<string[]>([]);

  const toggleSpecialTag = (tag: string) => {
    setSpecialReqs((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated) {
      toast.error('Vui lòng đăng nhập để đăng yêu cầu chăm sóc!');
      navigate('/auth?redirect=/post-care-request');
      return;
    }

    if (account?.role !== 'CUSTOMER') {
      toast.error('Chỉ tài khoản Khách hàng mới có thể đăng yêu cầu chăm sóc.');
      return;
    }

    if (age === '' || Number(age) < 0 || Number(age) > 130) {
      toast.error('Vui lòng nhập độ tuổi hợp lệ (0 - 130).');
      return;
    }

    if (!description.trim() || description.trim().length < 10) {
      toast.error('Vui lòng mô tả chi tiết nhu cầu chăm sóc (tối thiểu 10 ký tự).');
      return;
    }

    if (!area.trim()) {
      toast.error('Vui lòng chọn hoặc nhập khu vực (quận/huyện).');
      return;
    }

    if (!startDate) {
      toast.error('Vui lòng chọn ngày bắt đầu.');
      return;
    }

    if (budget === '' || Number(budget) < 0) {
      toast.error('Vui lòng nhập ngân sách dự kiến.');
      return;
    }

    const payload: CreateCareRequestDto = {
      serviceCategory: category,
      description: description.trim(),
      recipient: {
        age: Number(age),
        gender,
      },
      location: {
        city: city.trim(),
        area: area.trim(),
        address: specificAddress.trim() || undefined,
      },
      schedule: {
        startDate,
        endDate: endDate ? endDate : null,
        timeSlot,
        dailyHours: Number(dailyHours),
        frequency,
      },
      expectedBudget: Number(budget),
      budgetUnit,
      specialRequirements: specialReqs.length > 0 ? specialReqs : undefined,
    };

    setLoading(true);
    try {
      await createCareRequest(payload);
      toast.success('Đăng yêu cầu chăm sóc thành công! Yêu cầu của bạn đã sẵn sàng trên bảng tin.');
      navigate('/my-care-requests');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Đăng yêu cầu thất bại. Vui lòng thử lại.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', display: 'flex', flexDirection: 'column' }}>
      <Navbar />

      <main style={{ width: '92%', maxWidth: '820px', margin: '32px auto 60px', flex: 1 }}>
        <button
          type="button"
          onClick={() => navigate(-1)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: 'none',
            border: 'none',
            color: '#64748b',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            marginBottom: '16px',
          }}
        >
          <ArrowLeft size={16} /> Quay lại
        </button>

        <div
          style={{
            backgroundColor: '#ffffff',
            borderRadius: '20px',
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 20px rgba(15, 23, 42, 0.06)',
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '24px 30px',
              borderBottom: '1px solid #e2e8f0',
              background: 'linear-gradient(135deg, #eff6ff 0%, #ffffff 100%)',
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
            }}
          >
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                backgroundColor: '#2563eb',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Sparkles size={22} />
            </div>
            <div>
              <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                Đăng yêu cầu chăm sóc nhanh
              </h1>
              <p style={{ fontSize: '13.5px', color: '#64748b', margin: '3px 0 0' }}>
                Điền nhanh 4 mục bên dưới để kết nối với Người chăm sóc phù hợp nhất
              </p>
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            style={{
              padding: '28px 30px',
              display: 'flex',
              flexDirection: 'column',
              gap: '22px',
            }}
          >
            {/* 1. Loại dịch vụ & Đối tượng */}
            <div>
              <span
                style={{
                  fontSize: '14.5px',
                  fontWeight: 700,
                  color: '#0f172a',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '12px',
                }}
              >
                <span
                  style={{
                    width: '22px',
                    height: '22px',
                    borderRadius: '50%',
                    backgroundColor: '#2563eb',
                    color: '#fff',
                    fontSize: '12px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                  }}
                >
                  1
                </span>
                Loại dịch vụ chăm sóc & Đối tượng <span style={{ color: '#ef4444' }}>*</span>
              </span>

              {/* 4 Cards */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: '10px',
                  marginBottom: '14px',
                }}
              >
                {CATEGORIES.map((cat) => {
                  const isSelected = category === cat.id;
                  return (
                    <button
                      type="button"
                      key={cat.id}
                      onClick={() => {
                        setCategory(cat.id);
                        if (cat.id === 'child-care' && (age === '' || Number(age) > 15)) {
                          setAge(3);
                        } else if (cat.id === 'elderly-care' && (age === '' || Number(age) < 50)) {
                          setAge(75);
                        }
                      }}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        padding: '14px 10px',
                        borderRadius: '14px',
                        border: isSelected ? '2px solid #2563eb' : '1px solid #e2e8f0',
                        backgroundColor: isSelected ? '#eff6ff' : '#ffffff',
                        cursor: 'pointer',
                        textAlign: 'center',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{ marginBottom: '6px' }}>{cat.icon}</div>
                      <span
                        style={{
                          fontSize: '13px',
                          fontWeight: 700,
                          color: isSelected ? '#1d4ed8' : '#0f172a',
                        }}
                      >
                        {cat.title}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Age & Gender */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '12.5px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>
                    Độ tuổi người được chăm sóc <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="number"
                      min="0"
                      max="130"
                      placeholder="VD: 75"
                      value={age}
                      onChange={(e) => setAge(e.target.value ? Number(e.target.value) : '')}
                      style={{
                        width: '100%',
                        padding: '10px 40px 10px 14px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        fontSize: '14px',
                        boxSizing: 'border-box',
                        outline: 'none',
                      }}
                      required
                    />
                    <span style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', fontSize: '13px', color: '#94a3b8', pointerEvents: 'none' }}>
                      tuổi
                    </span>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '12.5px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>
                    Giới tính (tùy chọn)
                  </label>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(3, 1fr)',
                      gap: '4px',
                      backgroundColor: '#f1f5f9',
                      padding: '4px',
                      borderRadius: '8px',
                    }}
                  >
                    {[
                      { id: 'FEMALE', label: 'Nữ' },
                      { id: 'MALE', label: 'Nam' },
                      { id: 'OTHER', label: 'Không yêu cầu' },
                    ].map((g) => {
                      const active = gender === g.id;
                      return (
                        <button
                          type="button"
                          key={g.id}
                          onClick={() => setGender(g.id as 'FEMALE' | 'MALE' | 'OTHER')}
                          style={{
                            padding: '7px 4px',
                            border: 'none',
                            borderRadius: '6px',
                            fontSize: '12.5px',
                            fontWeight: active ? 700 : 500,
                            backgroundColor: active ? '#ffffff' : 'transparent',
                            color: active ? '#1d4ed8' : '#64748b',
                            boxShadow: active ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                            cursor: 'pointer',
                          }}
                        >
                          {g.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Nhu cầu & Tình trạng sức khỏe */}
            <div>
              <span
                style={{
                  fontSize: '14.5px',
                  fontWeight: 700,
                  color: '#0f172a',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '8px',
                }}
              >
                <span
                  style={{
                    width: '22px',
                    height: '22px',
                    borderRadius: '50%',
                    backgroundColor: '#2563eb',
                    color: '#fff',
                    fontSize: '12px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                  }}
                >
                  2
                </span>
                Mô tả nhu cầu & Tình trạng sức khỏe <span style={{ color: '#ef4444' }}>*</span>
              </span>

              <textarea
                placeholder="Mô tả cụ thể tình trạng sức khỏe và các công việc cần hỗ trợ (VD: Cần người hỗ trợ bà 75 tuổi sau mổ mắt, nhắc uống thuốc đúng giờ, trò chuyện, dìu đi bộ và chuẩn bị bữa ăn nhẹ buổi chiều...)"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  fontSize: '14px',
                  lineHeight: 1.5,
                  outline: 'none',
                  boxSizing: 'border-box',
                  resize: 'vertical',
                }}
                required
              />
            </div>

            {/* 3. Khu vực & Thời gian chăm sóc */}
            <div>
              <span
                style={{
                  fontSize: '14.5px',
                  fontWeight: 700,
                  color: '#0f172a',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '10px',
                }}
              >
                <span
                  style={{
                    width: '22px',
                    height: '22px',
                    borderRadius: '50%',
                    backgroundColor: '#2563eb',
                    color: '#fff',
                    fontSize: '12px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                  }}
                >
                  3
                </span>
                Khu vực & Thời gian chăm sóc <span style={{ color: '#ef4444' }}>*</span>
              </span>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '12px',
                }}
              >
                <div>
                  <label style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '4px' }}>
                    Tỉnh / Thành phố
                  </label>
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px', backgroundColor: '#fff', boxSizing: 'border-box' }}
                  >
                    {CITIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '4px' }}>
                    Quận / Huyện <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <select
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px', backgroundColor: '#fff', boxSizing: 'border-box' }}
                  >
                    {COMMON_AREAS.map((a) => (
                      <option key={a} value={a}>
                        {a}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '4px' }}>
                    Ngày bắt đầu <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px', boxSizing: 'border-box' }}
                    required
                  />
                </div>

                <div>
                  <label style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '4px' }}>
                    Khung giờ chăm sóc <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <select
                    value={timeSlot}
                    onChange={(e) => setTimeSlot(e.target.value)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px', backgroundColor: '#fff', boxSizing: 'border-box' }}
                  >
                    {TIME_SLOT_OPTIONS.map((slot) => (
                      <option key={slot} value={slot}>
                        {slot}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '4px' }}>
                    Số giờ / ngày <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <select
                    value={dailyHours}
                    onChange={(e) => setDailyHours(Number(e.target.value))}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px', backgroundColor: '#fff', boxSizing: 'border-box' }}
                  >
                    <option value={2}>2 giờ / ngày</option>
                    <option value={4}>4 giờ / ngày (Nửa ngày)</option>
                    <option value={6}>6 giờ / ngày</option>
                    <option value={8}>8 giờ / ngày (Cả ngày)</option>
                    <option value={10}>10 giờ / ngày</option>
                    <option value={12}>12 giờ / ngày (Theo ca)</option>
                    <option value={24}>24 giờ / ngày (Ở lại)</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '4px' }}>
                    Tần suất chăm sóc <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <select
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value as CareFrequency)}
                    style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px', backgroundColor: '#fff', boxSizing: 'border-box' }}
                  >
                    <option value="DAILY">Hàng ngày (Cả tuần)</option>
                    <option value="WEEKDAYS">Thứ 2 - Thứ 6</option>
                    <option value="WEEKLY">Hàng tuần</option>
                    <option value="ONE_TIME">Một lần duy nhất</option>
                  </select>
                </div>
              </div>
            </div>

            {/* 4. Ngân sách & Thông tin bổ sung */}
            <div>
              <span
                style={{
                  fontSize: '14.5px',
                  fontWeight: 700,
                  color: '#0f172a',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '10px',
                }}
              >
                <span
                  style={{
                    width: '22px',
                    height: '22px',
                    borderRadius: '50%',
                    backgroundColor: '#2563eb',
                    color: '#fff',
                    fontSize: '12px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                  }}
                >
                  4
                </span>
                Ngân sách dự kiến <span style={{ color: '#ef4444' }}>*</span>
              </span>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <input
                  type="number"
                  step="50000"
                  min="0"
                  placeholder="VD: 350000"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value ? Number(e.target.value) : '')}
                  style={{
                    width: '100%',
                    padding: '11px 14px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '15px',
                    fontWeight: 700,
                    color: '#16a34a',
                    boxSizing: 'border-box',
                    outline: 'none',
                  }}
                  required
                />

                <select
                  value={budgetUnit}
                  onChange={(e) => setBudgetUnit(e.target.value as CareBudgetUnit)}
                  style={{ width: '100%', padding: '11px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px', backgroundColor: '#fff', boxSizing: 'border-box' }}
                >
                  <option value="PER_DAY">VNĐ / ngày</option>
                  <option value="PER_HOUR">VNĐ / giờ</option>
                  <option value="PER_MONTH">VNĐ / tháng</option>
                  <option value="TOTAL">Trọn gói</option>
                </select>
              </div>

              {/* Accordion: Thông tin bổ sung */}
              <div
                style={{
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  backgroundColor: showAdditional ? '#f8fafc' : '#ffffff',
                  overflow: 'hidden',
                  transition: 'all 0.2s ease',
                }}
              >
                <button
                  type="button"
                  onClick={() => setShowAdditional(!showAdditional)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    border: 'none',
                    backgroundColor: 'transparent',
                    cursor: 'pointer',
                    fontSize: '13.5px',
                    fontWeight: 600,
                    color: '#334155',
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Info size={16} className="text-blue-600" />
                    Thông tin bổ sung (Ngày kết thúc, yêu cầu đặc biệt)
                  </span>
                  {showAdditional ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>

                {showAdditional && (
                  <div
                    style={{
                      padding: '16px',
                      borderTop: '1px solid #e2e8f0',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '14px',
                    }}
                  >
                    <div>
                      <label style={{ fontSize: '12.5px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>
                        Ngày kết thúc (tùy chọn)
                      </label>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px', boxSizing: 'border-box' }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '12.5px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '6px' }}>
                        Yêu cầu đặc biệt đối với người chăm sóc
                      </label>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {SPECIAL_TAGS.map((tag) => {
                          const isTagSelected = specialReqs.includes(tag);
                          return (
                            <button
                              type="button"
                              key={tag}
                              onClick={() => toggleSpecialTag(tag)}
                              style={{
                                padding: '6px 12px',
                                borderRadius: '999px',
                                fontSize: '12.5px',
                                fontWeight: isTagSelected ? 600 : 400,
                                backgroundColor: isTagSelected ? '#eff6ff' : '#ffffff',
                                color: isTagSelected ? '#1d4ed8' : '#475569',
                                border: isTagSelected ? '1px solid #93c5fd' : '1px solid #e2e8f0',
                                cursor: 'pointer',
                              }}
                            >
                              {isTagSelected ? '✓ ' : '+ '}
                              {tag}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <label style={{ fontSize: '12.5px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>
                        Địa chỉ chi tiết (tùy chọn)
                      </label>
                      <input
                        type="text"
                        placeholder="Số nhà, tên đường (chỉ hiển thị cho người chăm sóc sau khi tiếp nhận)"
                        value={specificAddress}
                        onChange={(e) => setSpecificAddress(e.target.value)}
                        style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px', boxSizing: 'border-box' }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Submit Buttons */}
            <div
              style={{
                paddingTop: '16px',
                borderTop: '1px solid #e2e8f0',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '12px',
              }}
            >
              <button
                type="button"
                onClick={() => navigate(-1)}
                disabled={loading}
                style={{
                  padding: '11px 22px',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#ffffff',
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#475569',
                  cursor: 'pointer',
                }}
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={loading}
                style={{
                  padding: '11px 28px',
                  borderRadius: '10px',
                  border: 'none',
                  backgroundColor: '#2563eb',
                  color: '#ffffff',
                  fontSize: '14px',
                  fontWeight: 700,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 14px rgba(37, 99, 235, 0.28)',
                }}
              >
                {loading ? 'Đang gửi...' : 'Đăng yêu cầu ngay'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default PostCareRequestPage;
