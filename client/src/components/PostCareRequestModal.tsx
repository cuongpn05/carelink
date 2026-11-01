import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { createCareRequest } from '../services/careRequestService';
import {
  CareServiceCategory,
  CareFrequency,
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
  User,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  Sparkles,
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
    title: 'Chăm sóc người cao tuổi',
    desc: 'Hỗ trợ sinh hoạt, nhắc thuốc, đồng hành',
    icon: <Heart size={20} className="text-blue-600" />,
  },
  {
    id: 'child-care',
    title: 'Chăm sóc trẻ em',
    desc: 'Trông trẻ, vui chơi, phát triển kỹ năng',
    icon: <Baby size={20} className="text-amber-500" />,
  },
  {
    id: 'home-care',
    title: 'Chăm sóc tại nhà',
    desc: 'Nấu ăn, vệ sinh phòng, chăm sóc toàn diện',
    icon: <Home size={20} className="text-emerald-500" />,
  },
  {
    id: 'post-treatment-care',
    title: 'Chăm sóc sau điều trị',
    desc: 'Hỗ trợ hồi phục, thay băng, tập vật lý',
    icon: <Cross size={20} className="text-rose-500" />,
  },
];

const COMMON_REQUIREMENTS = [
  'Có chứng chỉ điều dưỡng',
  'Kỹ năng sơ cứu cơ bản',
  'Biết đo huyết áp, tiểu đường',
  'Nấu ăn dinh dưỡng',
  'Thay băng vô trùng',
  'Vật lý trị liệu cơ bản',
  'Không hút thuốc',
  'Có phương tiện đi lại',
  'Giao tiếp nhẹ nhàng, kiên nhẫn',
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

export const PostCareRequestModal: React.FC<PostCareRequestModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { isAuthenticated, account } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [category, setCategory] = useState<CareServiceCategory>('elderly-care');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  // Recipient
  const [recipientName, setRecipientName] = useState('');
  const [recipientAge, setRecipientAge] = useState<number | ''>('');
  const [recipientGender, setRecipientGender] = useState<'MALE' | 'FEMALE' | 'OTHER'>('FEMALE');
  const [relationship, setRelationship] = useState('Mẹ');
  const [conditionNotes, setConditionNotes] = useState('');

  // Location
  const [address, setAddress] = useState('');
  const [area, setArea] = useState('Ninh Kiều');
  const [city, setCity] = useState('Cần Thơ');

  // Schedule
  const [startDate, setStartDate] = useState(
    new Date(Date.now() + 24 * 3600 * 1000).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState('');
  const [timeSlot, setTimeSlot] = useState('08:00 - 12:00 (Ca sáng)');
  const [dailyHours, setDailyHours] = useState(4);
  const [frequency, setFrequency] = useState<CareFrequency>('DAILY');

  // Budget & Special
  const [expectedBudget, setExpectedBudget] = useState<number | ''>(350000);
  const [specialReqs, setSpecialReqs] = useState<string[]>([
    'Giao tiếp nhẹ nhàng, kiên nhẫn',
  ]);
  const [customReq, setCustomReq] = useState('');

  if (!isOpen) return null;

  const toggleSpecialReq = (req: string) => {
    setSpecialReqs((prev) =>
      prev.includes(req) ? prev.filter((r) => r !== req) : [...prev, req]
    );
  };

  const addCustomReq = (e: React.KeyboardEvent | React.MouseEvent) => {
    if ('key' in e && e.key !== 'Enter') return;
    e.preventDefault();
    const trimmed = customReq.trim();
    if (trimmed && !specialReqs.includes(trimmed)) {
      setSpecialReqs((prev) => [...prev, trimmed]);
      setCustomReq('');
    }
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
      toast.error('Chỉ tài khoản khách hàng mới có thể đăng yêu cầu chăm sóc.');
      return;
    }

    // Client-side validations
    if (!title.trim()) {
      toast.error('Vui lòng nhập tiêu đề yêu cầu.');
      return;
    }
    if (!description.trim() || description.trim().length < 10) {
      toast.error('Vui lòng mô tả chi tiết nhu cầu chăm sóc (ít nhất 10 ký tự).');
      return;
    }
    if (!recipientName.trim()) {
      toast.error('Vui lòng nhập tên người được chăm sóc.');
      return;
    }
    if (recipientAge === '' || Number(recipientAge) < 0) {
      toast.error('Vui lòng nhập tuổi hợp lệ.');
      return;
    }
    if (!address.trim()) {
      toast.error('Vui lòng nhập địa chỉ cụ thể.');
      return;
    }
    if (!area.trim()) {
      toast.error('Vui lòng chọn hoặc nhập khu vực / quận.');
      return;
    }
    if (!startDate) {
      toast.error('Vui lòng chọn ngày bắt đầu.');
      return;
    }
    if (expectedBudget === '' || Number(expectedBudget) < 0) {
      toast.error('Vui lòng nhập ngân sách dự kiến.');
      return;
    }

    const payload: CreateCareRequestDto = {
      serviceCategory: category,
      title: title.trim(),
      description: description.trim(),
      recipient: {
        name: recipientName.trim(),
        age: Number(recipientAge),
        gender: recipientGender,
        relationship: relationship.trim(),
        conditionNotes: conditionNotes.trim(),
      },
      location: {
        address: address.trim(),
        area: area.trim(),
        city: city.trim(),
      },
      schedule: {
        startDate,
        endDate: endDate ? endDate : null,
        timeSlot: timeSlot.trim(),
        dailyHours: Number(dailyHours),
        frequency,
      },
      expectedBudget: Number(expectedBudget),
      specialRequirements: specialReqs,
    };

    setLoading(true);
    try {
      await createCareRequest(payload);
      toast.success('Đăng yêu cầu chăm sóc thành công! Yêu cầu của bạn đang mở trên bảng tin.');
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
          maxWidth: '820px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          animation: 'fadeInUp 0.25s ease-out',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '20px 24px',
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
                width: '40px',
                height: '40px',
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
              <h2
                style={{
                  fontSize: '20px',
                  fontWeight: 700,
                  color: '#0f172a',
                  margin: 0,
                }}
              >
                Đăng yêu cầu chăm sóc mới
              </h2>
              <p
                style={{
                  fontSize: '13px',
                  color: '#64748b',
                  margin: 0,
                  marginTop: '2px',
                }}
              >
                Mô tả chi tiết nhu cầu để CareLink kết nối người chăm sóc phù hợp nhất
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '8px',
              borderRadius: '999px',
              border: 'none',
              backgroundColor: '#f1f5f9',
              color: '#64748b',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.2s',
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body Form */}
        <form
          onSubmit={handleSubmit}
          style={{
            padding: '24px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
          }}
        >
          {/* 1. Chọn loại dịch vụ */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: 600,
                color: '#1e293b',
                marginBottom: '10px',
              }}
            >
              1. Loại dịch vụ chăm sóc <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '10px',
              }}
            >
              {CATEGORIES.map((cat) => {
                const isSelected = category === cat.id;
                return (
                  <button
                    type="button"
                    key={cat.id}
                    onClick={() => setCategory(cat.id)}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      padding: '12px 14px',
                      borderRadius: '12px',
                      border: isSelected ? '2px solid #2563eb' : '1px solid #e2e8f0',
                      backgroundColor: isSelected ? '#eff6ff' : '#ffffff',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        width: '100%',
                        marginBottom: '6px',
                      }}
                    >
                      {cat.icon}
                      {isSelected && (
                        <CheckCircle2 size={16} className="text-blue-600" />
                      )}
                    </div>
                    <span
                      style={{
                        fontSize: '13px',
                        fontWeight: 600,
                        color: isSelected ? '#1e40af' : '#1e293b',
                      }}
                    >
                      {cat.title}
                    </span>
                    <span
                      style={{
                        fontSize: '11px',
                        color: '#64748b',
                        marginTop: '2px',
                        lineHeight: 1.3,
                      }}
                    >
                      {cat.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Tiêu đề và Mô tả nhu cầu */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <label
              style={{
                fontSize: '14px',
                fontWeight: 600,
                color: '#1e293b',
                margin: 0,
              }}
            >
              2. Tiêu đề & Mô tả nhu cầu <span style={{ color: '#ef4444' }}>*</span>
            </label>

            <div>
              <input
                type="text"
                placeholder="VD: Cần người chăm sóc bà cụ 78 tuổi tại nhà (Quận Ninh Kiều)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
                required
              />
            </div>

            <div>
              <textarea
                placeholder="Mô tả chi tiết tình trạng sức khỏe, các công việc cần hỗ trợ hàng ngày (ăn uống, đi lại, vệ sinh cá nhân, uống thuốc, v.v.)..."
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  fontSize: '14px',
                  outline: 'none',
                  boxSizing: 'border-box',
                  resize: 'vertical',
                }}
                required
              />
            </div>
          </div>

          {/* 3. Thông tin người được chăm sóc */}
          <div
            style={{
              padding: '16px',
              borderRadius: '14px',
              backgroundColor: '#f8fafc',
              border: '1px solid #e2e8f0',
            }}
          >
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '14px',
                fontWeight: 600,
                color: '#1e293b',
                marginBottom: '12px',
              }}
            >
              <User size={16} className="text-blue-600" />
              3. Người được chăm sóc
            </label>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '12px',
                marginBottom: '12px',
              }}
            >
              <div>
                <label style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '4px' }}>
                  Họ và tên <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="VD: Nguyễn Thị Lan"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    boxSizing: 'border-box',
                  }}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '4px' }}>
                  Tuổi <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="number"
                  placeholder="VD: 75"
                  min="0"
                  max="120"
                  value={recipientAge}
                  onChange={(e) => setRecipientAge(e.target.value ? Number(e.target.value) : '')}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    boxSizing: 'border-box',
                  }}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '4px' }}>
                  Giới tính
                </label>
                <select
                  value={recipientGender}
                  onChange={(e) => setRecipientGender(e.target.value as 'MALE' | 'FEMALE' | 'OTHER')}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    backgroundColor: '#fff',
                    boxSizing: 'border-box',
                  }}
                >
                  <option value="FEMALE">Nữ</option>
                  <option value="MALE">Nam</option>
                  <option value="OTHER">Khác</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '4px' }}>
                  Mối quan hệ <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="VD: Mẹ, Bố, Con, Bản thân"
                  value={relationship}
                  onChange={(e) => setRelationship(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    boxSizing: 'border-box',
                  }}
                  required
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '4px' }}>
                Lưu ý bệnh lý / Tình trạng đặc biệt
              </label>
              <input
                type="text"
                placeholder="VD: Khó đi lại sau phẫu thuật, huyết áp cao cần theo dõi..."
                value={conditionNotes}
                onChange={(e) => setConditionNotes(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '13px',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          {/* 4. Địa điểm cần chăm sóc */}
          <div>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '14px',
                fontWeight: 600,
                color: '#1e293b',
                marginBottom: '10px',
              }}
            >
              <MapPin size={16} className="text-blue-600" />
              4. Địa chỉ & Khu vực cần chăm sóc <span style={{ color: '#ef4444' }}>*</span>
            </label>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '12px',
              }}
            >
              <div style={{ gridColumn: 'span 2' }}>
                <input
                  type="text"
                  placeholder="Số nhà, tên đường, phường/xã cụ thể..."
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    boxSizing: 'border-box',
                  }}
                  required
                />
              </div>

              <div>
                <select
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
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

              <div>
                <input
                  type="text"
                  placeholder="Tỉnh / Thành phố"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>
          </div>

          {/* 5. Lịch trình & Thời gian */}
          <div>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '14px',
                fontWeight: 600,
                color: '#1e293b',
                marginBottom: '10px',
              }}
            >
              <Calendar size={16} className="text-blue-600" />
              5. Thời gian & Lịch chăm sóc <span style={{ color: '#ef4444' }}>*</span>
            </label>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '12px',
              }}
            >
              <div>
                <label style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '4px' }}>
                  Ngày bắt đầu <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    boxSizing: 'border-box',
                  }}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '4px' }}>
                  Ngày kết thúc (tùy chọn)
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '4px' }}>
                  Khung giờ chăm sóc <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="VD: 08:00 - 12:00 (Sáng)"
                  value={timeSlot}
                  onChange={(e) => setTimeSlot(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    boxSizing: 'border-box',
                  }}
                  required
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '4px' }}>
                  Số giờ / ngày <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <select
                  value={dailyHours}
                  onChange={(e) => setDailyHours(Number(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
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

              <div>
                <label style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '4px' }}>
                  Tần suất chăm sóc
                </label>
                <select
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value as CareFrequency)}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    backgroundColor: '#fff',
                    boxSizing: 'border-box',
                  }}
                >
                  <option value="DAILY">Hàng ngày (Cả tuần)</option>
                  <option value="WEEKDAYS">Thứ 2 - Thứ 6 (Ngày làm việc)</option>
                  <option value="WEEKLY">Hàng tuần (Vài ngày định kỳ)</option>
                  <option value="ONE_TIME">Một lần duy nhất</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '12px', color: '#64748b', display: 'block', marginBottom: '4px' }}>
                  Ngân sách dự kiến (VNĐ/ngày) <span style={{ color: '#ef4444' }}>*</span>
                </label>
                <input
                  type="number"
                  step="50000"
                  min="0"
                  placeholder="VD: 350000"
                  value={expectedBudget}
                  onChange={(e) => setExpectedBudget(e.target.value ? Number(e.target.value) : '')}
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    boxSizing: 'border-box',
                  }}
                  required
                />
              </div>
            </div>
          </div>

          {/* 6. Yêu cầu đặc biệt */}
          <div>
            <label
              style={{
                fontSize: '14px',
                fontWeight: 600,
                color: '#1e293b',
                display: 'block',
                marginBottom: '8px',
              }}
            >
              6. Yêu cầu đặc biệt dành cho người chăm sóc
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
              {COMMON_REQUIREMENTS.map((req) => {
                const selected = specialReqs.includes(req);
                return (
                  <button
                    type="button"
                    key={req}
                    onClick={() => toggleSpecialReq(req)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '999px',
                      fontSize: '12px',
                      fontWeight: selected ? 600 : 400,
                      backgroundColor: selected ? '#eff6ff' : '#f8fafc',
                      color: selected ? '#1d4ed8' : '#475569',
                      border: selected ? '1px solid #93c5fd' : '1px solid #e2e8f0',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {selected ? '✓ ' : '+ '}
                    {req}
                  </button>
                );
              })}
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="text"
                placeholder="Thêm yêu cầu khác (nhấn Enter)..."
                value={customReq}
                onChange={(e) => setCustomReq(e.target.value)}
                onKeyDown={addCustomReq}
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
                onClick={addCustomReq}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  backgroundColor: '#f1f5f9',
                  border: '1px solid #cbd5e1',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#334155',
                  cursor: 'pointer',
                }}
              >
                Thêm
              </button>
            </div>
          </div>

          {/* Footer Submit */}
          <div
            style={{
              paddingTop: '16px',
              borderTop: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '12px',
            }}
          >
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              style={{
                padding: '10px 20px',
                borderRadius: '10px',
                border: '1px solid #cbd5e1',
                backgroundColor: '#ffffff',
                color: '#475569',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                padding: '10px 24px',
                borderRadius: '10px',
                border: 'none',
                backgroundColor: '#2563eb',
                color: '#ffffff',
                fontSize: '14px',
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
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
