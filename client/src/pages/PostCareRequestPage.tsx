import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Navbar } from '../components/Navbar';
import { createCareRequest } from '../services/careRequestService';
import {
  CareServiceCategory,
  CareFrequency,
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
  User,
  DollarSign,
  CheckCircle2,
  Sparkles,
  ArrowLeft,
} from 'lucide-react';

const CATEGORIES: {
  id: CareServiceCategory;
  title: string;
  desc: string;
  icon: React.ReactNode;
}[] = [
  {
    id: 'elderly-care',
    title: 'Chăm sóc người cao tuổi',
    desc: 'Hỗ trợ sinh hoạt, nhắc thuốc, trò chuyện',
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

export const PostCareRequestPage: React.FC = () => {
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
      navigate('/auth?redirect=/post-care-request');
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

      <main style={{ width: '92%', maxWidth: '960px', margin: '36px auto 60px', flex: 1 }}>
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
          <div
            style={{
              padding: '24px 32px',
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
              <Sparkles size={24} />
            </div>
            <div>
              <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                Đăng yêu cầu chăm sóc
              </h1>
              <p style={{ fontSize: '14px', color: '#64748b', margin: '4px 0 0' }}>
                Mô tả chi tiết nhu cầu để CareLink giúp bạn kết nối người chăm sóc chuyên nghiệp và phù hợp nhất
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '26px' }}>
            {/* Service Category */}
            <div>
              <label style={{ display: 'block', fontSize: '15px', fontWeight: 700, color: '#0f172a', marginBottom: '12px' }}>
                1. Loại dịch vụ chăm sóc <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
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
                        padding: '14px',
                        borderRadius: '14px',
                        border: isSelected ? '2px solid #2563eb' : '1px solid #e2e8f0',
                        backgroundColor: isSelected ? '#eff6ff' : '#ffffff',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: '8px' }}>
                        {cat.icon}
                        {isSelected && <CheckCircle2 size={18} className="text-blue-600" />}
                      </div>
                      <span style={{ fontSize: '14px', fontWeight: 700, color: isSelected ? '#1d4ed8' : '#0f172a' }}>
                        {cat.title}
                      </span>
                      <span style={{ fontSize: '12px', color: '#64748b', marginTop: '3px' }}>
                        {cat.desc}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Title & Desc */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <label style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', margin: 0 }}>
                2. Tiêu đề & Mô tả nhu cầu <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                placeholder="VD: Cần tìm người chăm sóc bà 75 tuổi tại nhà (Quận Ninh Kiều)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}
                required
              />
              <textarea
                placeholder="Mô tả cụ thể nhu cầu chăm sóc, tình trạng sức khỏe, các việc cần làm trong ca..."
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                style={{ width: '100%', padding: '12px 16px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box', resize: 'vertical' }}
                required
              />
            </div>

            {/* Recipient Details */}
            <div style={{ padding: '20px', borderRadius: '14px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px', fontWeight: 700, color: '#0f172a', marginBottom: '14px' }}>
                <User size={18} className="text-blue-600" />
                3. Thông tin người được chăm sóc <span style={{ color: '#ef4444' }}>*</span>
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '14px' }}>
                <div>
                  <label style={{ fontSize: '13px', color: '#64748b', display: 'block', marginBottom: '4px' }}>
                    Họ và tên <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="VD: Trần Thị Mơ"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}
                    required
                  />
                </div>
                <div>
                  <label style={{ fontSize: '13px', color: '#64748b', display: 'block', marginBottom: '4px' }}>
                    Tuổi <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="number"
                    placeholder="VD: 75"
                    min="0"
                    max="120"
                    value={recipientAge}
                    onChange={(e) => setRecipientAge(e.target.value ? Number(e.target.value) : '')}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}
                    required
                  />
                </div>
                <div>
                  <label style={{ fontSize: '13px', color: '#64748b', display: 'block', marginBottom: '4px' }}>
                    Giới tính
                  </label>
                  <select
                    value={recipientGender}
                    onChange={(e) => setRecipientGender(e.target.value as 'MALE' | 'FEMALE' | 'OTHER')}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', backgroundColor: '#fff', boxSizing: 'border-box' }}
                  >
                    <option value="FEMALE">Nữ</option>
                    <option value="MALE">Nam</option>
                    <option value="OTHER">Khác</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '13px', color: '#64748b', display: 'block', marginBottom: '4px' }}>
                    Mối quan hệ <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="VD: Mẹ, Bố, Con, Bản thân"
                    value={relationship}
                    onChange={(e) => setRelationship(e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}
                    required
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '13px', color: '#64748b', display: 'block', marginBottom: '4px' }}>
                  Ghi chú bệnh lý hoặc tình trạng sức khỏe
                </label>
                <input
                  type="text"
                  placeholder="VD: Khó đi lại sau phẫu thuật mổ gối, huyết áp cần theo dõi..."
                  value={conditionNotes}
                  onChange={(e) => setConditionNotes(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            {/* Location */}
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px', fontWeight: 700, color: '#0f172a', marginBottom: '12px' }}>
                <MapPin size={18} className="text-blue-600" />
                4. Địa chỉ & Khu vực cần chăm sóc <span style={{ color: '#ef4444' }}>*</span>
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                <div style={{ gridColumn: 'span 2' }}>
                  <input
                    type="text"
                    placeholder="Số nhà, tên đường, phường/xã cụ thể..."
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    style={{ width: '100%', padding: '11px 16px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}
                    required
                  />
                </div>
                <div>
                  <select
                    value={area}
                    onChange={(e) => setArea(e.target.value)}
                    style={{ width: '100%', padding: '11px 16px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', backgroundColor: '#fff', boxSizing: 'border-box' }}
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
                    style={{ width: '100%', padding: '11px 16px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}
                  />
                </div>
              </div>
            </div>

            {/* Schedule & Budget */}
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px', fontWeight: 700, color: '#0f172a', marginBottom: '12px' }}>
                <Calendar size={18} className="text-blue-600" />
                5. Lịch trình & Ngân sách dự kiến <span style={{ color: '#ef4444' }}>*</span>
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '13px', color: '#64748b', display: 'block', marginBottom: '4px' }}>
                    Ngày bắt đầu <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}
                    required
                  />
                </div>
                <div>
                  <label style={{ fontSize: '13px', color: '#64748b', display: 'block', marginBottom: '4px' }}>
                    Ngày kết thúc (tùy chọn)
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '13px', color: '#64748b', display: 'block', marginBottom: '4px' }}>
                    Khung giờ chăm sóc <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="VD: 08:00 - 12:00 (Sáng)"
                    value={timeSlot}
                    onChange={(e) => setTimeSlot(e.target.value)}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}
                    required
                  />
                </div>
                <div>
                  <label style={{ fontSize: '13px', color: '#64748b', display: 'block', marginBottom: '4px' }}>
                    Số giờ / ngày <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <select
                    value={dailyHours}
                    onChange={(e) => setDailyHours(Number(e.target.value))}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', backgroundColor: '#fff', boxSizing: 'border-box' }}
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
                  <label style={{ fontSize: '13px', color: '#64748b', display: 'block', marginBottom: '4px' }}>
                    Tần suất chăm sóc
                  </label>
                  <select
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value as CareFrequency)}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', backgroundColor: '#fff', boxSizing: 'border-box' }}
                  >
                    <option value="DAILY">Hàng ngày (Cả tuần)</option>
                    <option value="WEEKDAYS">Thứ 2 - Thứ 6</option>
                    <option value="WEEKLY">Hàng tuần</option>
                    <option value="ONE_TIME">Một lần duy nhất</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '13px', color: '#64748b', display: 'block', marginBottom: '4px' }}>
                    Ngân sách dự kiến (VNĐ/ngày) <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="number"
                    step="50000"
                    min="0"
                    placeholder="VD: 350000"
                    value={expectedBudget}
                    onChange={(e) => setExpectedBudget(e.target.value ? Number(e.target.value) : '')}
                    style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', boxSizing: 'border-box' }}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Special requirements */}
            <div>
              <label style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', display: 'block', marginBottom: '10px' }}>
                6. Yêu cầu đặc biệt đối với người chăm sóc
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                {COMMON_REQUIREMENTS.map((req) => {
                  const selected = specialReqs.includes(req);
                  return (
                    <button
                      type="button"
                      key={req}
                      onClick={() => toggleSpecialReq(req)}
                      style={{
                        padding: '7px 14px',
                        borderRadius: '999px',
                        fontSize: '13px',
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

              <div style={{ display: 'flex', gap: '10px' }}>
                <input
                  type="text"
                  placeholder="Nhập yêu cầu khác (nhấn Enter)..."
                  value={customReq}
                  onChange={(e) => setCustomReq(e.target.value)}
                  onKeyDown={addCustomReq}
                  style={{ flex: 1, padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px' }}
                />
                <button
                  type="button"
                  onClick={addCustomReq}
                  style={{ padding: '10px 20px', borderRadius: '8px', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', fontSize: '14px', fontWeight: 600, color: '#334155', cursor: 'pointer' }}
                >
                  Thêm
                </button>
              </div>
            </div>

            {/* Submit CTA */}
            <div style={{ paddingTop: '20px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '14px' }}>
              <button
                type="button"
                onClick={() => navigate(-1)}
                disabled={loading}
                style={{ padding: '12px 24px', borderRadius: '12px', border: '1px solid #cbd5e1', backgroundColor: '#fff', fontSize: '15px', fontWeight: 600, color: '#475569', cursor: 'pointer' }}
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={loading}
                style={{
                  padding: '12px 32px',
                  borderRadius: '12px',
                  border: 'none',
                  backgroundColor: '#2563eb',
                  color: '#fff',
                  fontSize: '15px',
                  fontWeight: 700,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 16px rgba(37, 99, 235, 0.3)',
                }}
              >
                {loading ? 'Đang gửi yêu cầu...' : 'Đăng yêu cầu ngay'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default PostCareRequestPage;

