import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { createCareRequest } from '../services/careRequestService';
import {
  CareServiceCategory,
  CareFrequency,
  CareBudgetUnit,
  CreateCareRequestDto,
} from '../types/careRequest';
import toast from 'react-hot-toast';
import {
  X,
  Heart,
  Baby,
  Home,
  Cross,
  Calendar,
  Clock,
  MapPin,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Check,
  Shield,
  Info,
} from 'lucide-react';

interface PostCareRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

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

export const PostCareRequestModal: React.FC<PostCareRequestModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
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

  if (!isOpen) return null;

  const toggleSpecialTag = (tag: string) => {
    setSpecialReqs((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isAuthenticated) {
      toast.error('Vui lòng đăng nhập để đăng yêu cầu chăm sóc!');
      navigate('/auth?redirect=/my-care-requests');
      onClose();
      return;
    }

    if (account?.role !== 'CUSTOMER') {
      toast.error('Chỉ tài khoản Khách hàng mới có thể đăng yêu cầu chăm sóc.');
      return;
    }

    // Validation
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
      if (onSuccess) {
        onSuccess();
      }
      onClose();
      navigate('/my-care-requests');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Đăng yêu cầu thất bại. Vui lòng thử lại.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        overflowY: 'auto',
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '20px',
          width: '100%',
          maxWidth: '740px',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          animation: 'fadeInUp 0.2s ease-out',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(135deg, #eff6ff 0%, #ffffff 100%)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                backgroundColor: '#2563eb',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Sparkles size={20} />
            </div>
            <div>
              <h2
                style={{
                  fontSize: '18px',
                  fontWeight: 800,
                  color: '#0f172a',
                  margin: 0,
                }}
              >
                Đăng yêu cầu chăm sóc mới
              </h2>
              <p style={{ fontSize: '12.5px', color: '#64748b', margin: '2px 0 0' }}>
                Chỉ mất 1 phút để kết nối người chăm sóc phù hợp nhất
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '6px',
              borderRadius: '999px',
              border: 'none',
              backgroundColor: '#f1f5f9',
              color: '#64748b',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body: 4 Clean Groups */}
        <form
          onSubmit={handleSubmit}
          style={{
            padding: '20px 24px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '18px',
          }}
        >
          {/* Nhóm 1: Loại dịch vụ & Đối tượng */}
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '10px',
              }}
            >
              <span
                style={{
                  fontSize: '13.5px',
                  fontWeight: 700,
                  color: '#0f172a',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span
                  style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    backgroundColor: '#2563eb',
                    color: '#fff',
                    fontSize: '11px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                  }}
                >
                  1
                </span>
                Loại dịch vụ & Đối tượng <span style={{ color: '#ef4444' }}>*</span>
              </span>
            </div>

            {/* Radio Cards */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '8px',
                marginBottom: '12px',
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
                      padding: '10px 8px',
                      borderRadius: '12px',
                      border: isSelected ? '2px solid #2563eb' : '1px solid #e2e8f0',
                      backgroundColor: isSelected ? '#eff6ff' : '#ffffff',
                      cursor: 'pointer',
                      textAlign: 'center',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ marginBottom: '4px' }}>{cat.icon}</div>
                    <span
                      style={{
                        fontSize: '12.5px',
                        fontWeight: 700,
                        color: isSelected ? '#1d4ed8' : '#1e293b',
                        lineHeight: 1.2,
                      }}
                    >
                      {cat.title}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Age & Gender Row */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1.5fr',
                gap: '12px',
              }}
            >
              <div>
                <label
                  style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#475569',
                    display: 'block',
                    marginBottom: '4px',
                  }}
                >
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
                      padding: '9px 40px 9px 12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '13.5px',
                      boxSizing: 'border-box',
                      outline: 'none',
                    }}
                    required
                  />
                  <span
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      fontSize: '12px',
                      color: '#94a3b8',
                      pointerEvents: 'none',
                    }}
                  >
                    tuổi
                  </span>
                </div>
              </div>

              <div>
                <label
                  style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#475569',
                    display: 'block',
                    marginBottom: '4px',
                  }}
                >
                  Giới tính (tùy chọn)
                </label>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '4px',
                    backgroundColor: '#f1f5f9',
                    padding: '3px',
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
                          padding: '6px 4px',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: active ? 700 : 500,
                          backgroundColor: active ? '#ffffff' : 'transparent',
                          color: active ? '#1d4ed8' : '#64748b',
                          boxShadow: active ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
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

          {/* Nhóm 2: Nhu cầu & Tình trạng sức khỏe */}
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '6px',
              }}
            >
              <span
                style={{
                  fontSize: '13.5px',
                  fontWeight: 700,
                  color: '#0f172a',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span
                  style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    backgroundColor: '#2563eb',
                    color: '#fff',
                    fontSize: '11px',
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
            </div>

            <textarea
              placeholder="Mô tả cụ thể tình trạng sức khỏe và các công việc cần hỗ trợ (VD: Đi lại chậm sau mổ mắt, cần người trò chuyện, hỗ trợ ăn uống nhẹ, nhắc thuốc đúng giờ và dìu đi bộ mỗi chiều...)"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '13.5px',
                lineHeight: 1.5,
                outline: 'none',
                boxSizing: 'border-box',
                resize: 'vertical',
              }}
              required
            />
          </div>

          {/* Nhóm 3: Thời gian & Khu vực chăm sóc */}
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '8px',
              }}
            >
              <span
                style={{
                  fontSize: '13.5px',
                  fontWeight: 700,
                  color: '#0f172a',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span
                  style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    backgroundColor: '#2563eb',
                    color: '#fff',
                    fontSize: '11px',
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
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '10px',
                marginBottom: '10px',
              }}
            >
              {/* City */}
              <div>
                <label
                  style={{
                    fontSize: '11.5px',
                    color: '#64748b',
                    display: 'block',
                    marginBottom: '3px',
                  }}
                >
                  Tỉnh / Thành phố
                </label>
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    backgroundColor: '#fff',
                    boxSizing: 'border-box',
                  }}
                >
                  {CITIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* Area */}
              <div>
                <label
                  style={{
                    fontSize: '11.5px',
                    color: '#64748b',
                    display: 'block',
                    marginBottom: '3px',
                  }}
                >
                  Quận / Huyện <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <select
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    backgroundColor: '#fff',
                    boxSizing: 'border-box',
                  }}
                >
                  {COMMON_AREAS.map((a) => (
                    <option key={a} value={a}>
                      {a}
                    </option>
                  ))}
                </select>
              </div>

              {/* Start Date */}
              <div>
                <label
                  style={{
                    fontSize: '11.5px',
                    color: '#64748b',
                    display: 'block',
                    marginBottom: '3px',
                  }}
                >
                  Ngày bắt đầu <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    boxSizing: 'border-box',
                  }}
                  required
                />
              </div>

              {/* Time Slot */}
              <div>
                <label
                  style={{
                    fontSize: '11.5px',
                    color: '#64748b',
                    display: 'block',
                    marginBottom: '3px',
                  }}
                >
                  Khung giờ chăm sóc <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <select
                  value={timeSlot}
                  onChange={(e) => setTimeSlot(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    backgroundColor: '#fff',
                    boxSizing: 'border-box',
                  }}
                >
                  {TIME_SLOT_OPTIONS.map((slot) => (
                    <option key={slot} value={slot}>
                      {slot}
                    </option>
                  ))}
                </select>
              </div>

              {/* Daily Hours */}
              <div>
                <label
                  style={{
                    fontSize: '11.5px',
                    color: '#64748b',
                    display: 'block',
                    marginBottom: '3px',
                  }}
                >
                  Số giờ / ngày <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <select
                  value={dailyHours}
                  onChange={(e) => setDailyHours(Number(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    backgroundColor: '#fff',
                    boxSizing: 'border-box',
                  }}
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

              {/* Frequency */}
              <div>
                <label
                  style={{
                    fontSize: '11.5px',
                    color: '#64748b',
                    display: 'block',
                    marginBottom: '3px',
                  }}
                >
                  Tần suất chăm sóc <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <select
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value as CareFrequency)}
                  style={{
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    backgroundColor: '#fff',
                    boxSizing: 'border-box',
                  }}
                >
                  <option value="DAILY">Hàng ngày (Cả tuần)</option>
                  <option value="WEEKDAYS">Thứ 2 - Thứ 6</option>
                  <option value="WEEKLY">Hàng tuần</option>
                  <option value="ONE_TIME">Một lần duy nhất</option>
                </select>
              </div>
            </div>
          </div>

          {/* Nhóm 4: Ngân sách & Thông tin bổ sung */}
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '8px',
              }}
            >
              <span
                style={{
                  fontSize: '13.5px',
                  fontWeight: 700,
                  color: '#0f172a',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <span
                  style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    backgroundColor: '#2563eb',
                    color: '#fff',
                    fontSize: '11px',
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
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '2fr 1.2fr',
                gap: '10px',
                marginBottom: '14px',
              }}
            >
              <div>
                <input
                  type="number"
                  step="50000"
                  min="0"
                  placeholder="VD: 350000"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value ? Number(e.target.value) : '')}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '14px',
                    fontWeight: 700,
                    color: '#16a34a',
                    boxSizing: 'border-box',
                    outline: 'none',
                  }}
                  required
                />
              </div>

              <div>
                <select
                  value={budgetUnit}
                  onChange={(e) => setBudgetUnit(e.target.value as CareBudgetUnit)}
                  style={{
                    width: '100%',
                    padding: '9px 10px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    backgroundColor: '#fff',
                    boxSizing: 'border-box',
                  }}
                >
                  <option value="PER_DAY">VNĐ / ngày</option>
                  <option value="PER_HOUR">VNĐ / giờ</option>
                  <option value="PER_MONTH">VNĐ / tháng</option>
                  <option value="TOTAL">Trọn gói</option>
                </select>
              </div>
            </div>

            {/* Accordion: Thông tin bổ sung */}
            <div
              style={{
                border: '1px solid #e2e8f0',
                borderRadius: '10px',
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
                  padding: '10px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  border: 'none',
                  backgroundColor: 'transparent',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#475569',
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Info size={15} className="text-blue-600" />
                  Thông tin bổ sung (Ngày kết thúc, yêu cầu đặc biệt)
                </span>
                {showAdditional ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>

              {showAdditional && (
                <div
                  style={{
                    padding: '12px 14px 16px',
                    borderTop: '1px solid #e2e8f0',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                  }}
                >
                  {/* End Date */}
                  <div>
                    <label
                      style={{
                        fontSize: '12px',
                        fontWeight: 600,
                        color: '#475569',
                        display: 'block',
                        marginBottom: '4px',
                      }}
                    >
                      Ngày kết thúc (tùy chọn)
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        fontSize: '13px',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>

                  {/* Special requirements tags */}
                  <div>
                    <label
                      style={{
                        fontSize: '12px',
                        fontWeight: 600,
                        color: '#475569',
                        display: 'block',
                        marginBottom: '6px',
                      }}
                    >
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
                              padding: '5px 10px',
                              borderRadius: '999px',
                              fontSize: '12px',
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

                  {/* Specific address (optional) */}
                  <div>
                    <label
                      style={{
                        fontSize: '12px',
                        fontWeight: 600,
                        color: '#475569',
                        display: 'block',
                        marginBottom: '4px',
                      }}
                    >
                      Địa chỉ cụ thể (tùy chọn)
                    </label>
                    <input
                      type="text"
                      placeholder="Số nhà, tên đường (chỉ hiển thị cho người chăm sóc sau khi tiếp nhận)"
                      value={specificAddress}
                      onChange={(e) => setSpecificAddress(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        fontSize: '12.5px',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer Submit */}
          <div
            style={{
              paddingTop: '12px',
              borderTop: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '10px',
            }}
          >
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              style={{
                padding: '9px 18px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                backgroundColor: '#ffffff',
                color: '#475569',
                fontSize: '13.5px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '9px 24px',
                borderRadius: '8px',
                border: 'none',
                backgroundColor: '#2563eb',
                color: '#ffffff',
                fontSize: '13.5px',
                fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              {loading ? 'Đang gửi...' : 'Đăng yêu cầu ngay'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
