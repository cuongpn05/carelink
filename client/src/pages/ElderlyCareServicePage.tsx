import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { Footer } from '../components/Footer/Footer';
import { PostCareRequestModal } from '../components/PostCareRequestModal';
import elderlyCareImg from '../assets/services/elderly-care.jpg';
import {
  CheckCircle2,
  Heart,
  ShieldCheck,
  Clock,
  MapPin,
  ArrowRight,
  HelpCircle,
  ChevronDown,
  XCircle,
  Activity,
  UserCheck,
  Sparkles,
  PhoneCall,
  Search,
  Building2,
  Calendar,
  Utensils,
  Pill,
  Smile,
  AlertTriangle,
} from 'lucide-react';
import './ElderlyCareServicePage.css';

interface FaqItem {
  q: string;
  a: string;
}

const FAQ_LIST: FaqItem[] = [
  {
    q: 'Chi phí chăm sóc người già được tính như thế nào?',
    a: 'Chi phí bao gồm giá gói thời gian (từ 100.000đ/giờ hoặc 800.000đ/ngày) cộng với phụ phí di chuyển theo khoảng cách GPS thực tế. Cự ly dưới 5km hoàn toàn miễn phí, cự ly trên 5km phụ thu 10.000đ/km. Giá được hệ thống tự động tính minh bạch trước khi bạn bấm xác nhận.',
  },
  {
    q: 'Tôi có thể chọn người chăm sóc theo yêu cầu không?',
    a: 'Hoàn toàn có thể! Bạn có thể xem danh sách hồ sơ người chăm sóc, lọc theo cự ly gần nhà, số năm kinh nghiệm, đánh giá sao của các gia đình khác, hoặc đăng bài yêu cầu để người chăm sóc phù hợp ứng tuyển.',
  },
  {
    q: 'Người chăm sóc của CareLink có được xác minh lý lịch và chuyên môn không?',
    a: '100% người chăm sóc trên CareLink đều được xác minh danh tính qua Căn cước công dân gắn chip, kiểm tra lý lịch tư pháp, phỏng vấn kỹ năng và có chứng chỉ đào tạo điều dưỡng hoặc chăm sóc người già bài bản.',
  },
  {
    q: 'Nếu gia đình cảm thấy người chăm sóc chưa phù hợp thì sao?',
    a: 'CareLink hỗ trợ gia đình đổi người chăm sóc khác hoàn toàn miễn phí hoặc hoàn tiền ca làm việc nếu người chăm sóc vi phạm quy chế ứng xử và đạo đức nghề nghiệp.',
  },
  {
    q: 'CareLink có nhận chăm sóc người già tại bệnh viện không?',
    a: 'Có. CareLink hỗ trợ chăm sóc nuôi bệnh nội trú tại các bệnh viện lớn (như BV ĐK Trung ương Cần Thơ, BV Quân Y 121, Chợ Rẫy, ĐHYD...). Bạn chỉ cần chọn Tab "Tại Bệnh viện", nhập Khoa, Phòng và Số giường bệnh.',
  },
  {
    q: 'Hình thức thanh toán diễn ra như thế nào?',
    a: 'Để gia đình an tâm nhất, CareLink không yêu cầu trả trước toàn bộ. Bạn thanh toán trực tiếp bằng tiền mặt hoặc chuyển khoản cho người chăm sóc sau khi kết thúc ca làm việc.',
  },
];

export const ElderlyCareServicePage: React.FC = () => {
  const navigate = useNavigate();
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);

  const toggleFaq = (index: number) => {
    setOpenFaqIndex((prev) => (prev === index ? null : index));
  };

  const handleBookNow = () => {
    navigate('/caregivers?skill=Chăm+sóc+người+cao+tuổi');
  };

  const scrollToPricing = () => {
    const el = document.getElementById('pricing');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="elderly-page">
      <Navbar />

      <main className="elderly-main">
        {/* ================= 1. HERO SECTION ================= */}
        <section className="elderly-hero-section">
          <div className="container">
            <div className="elderly-hero-grid">
              <div className="elderly-hero-text">
                <div className="elderly-hero-badge">
                  <Heart size={14} fill="#2563eb" color="#2563eb" />
                  <span>DỊCH VỤ CỐT LÕI · CARELINK</span>
                </div>
                <h1 className="elderly-hero-title">
                  Chăm sóc người lớn tuổi <br />
                  <span>tại nhà & tại bệnh viện</span>
                </h1>
                <p className="elderly-hero-desc">
                  CareLink mang đến giải pháp chăm sóc tận tâm, chu đáo cho ông bà, cha mẹ.
                  Đội ngũ người chăm sóc uy tín, xác minh lý lịch rõ ràng và có chuyên môn y tế bài bản,
                  giúp gia đình luôn an tâm khi bận rộn công tác.
                </p>

                <div className="elderly-hero-highlights">
                  <div className="elderly-highlight-item">
                    <CheckCircle2 size={18} className="elderly-highlight-icon" />
                    <span>Hỗ trợ sinh hoạt & vệ sinh cá nhân</span>
                  </div>
                  <div className="elderly-highlight-item">
                    <CheckCircle2 size={18} className="elderly-highlight-icon" />
                    <span>Nhắc uống thuốc & đo sinh hiệu</span>
                  </div>
                  <div className="elderly-highlight-item">
                    <CheckCircle2 size={18} className="elderly-highlight-icon" />
                    <span>Định vị GPS & Phụ phí minh bạch</span>
                  </div>
                  <div className="elderly-highlight-item">
                    <CheckCircle2 size={18} className="elderly-highlight-icon" />
                    <span>Đổi người nếu không phù hợp</span>
                  </div>
                </div>

                <div className="elderly-hero-actions">
                  <button type="button" className="btn-primary-hero" onClick={handleBookNow}>
                    <span>Tìm người chăm sóc ngay</span>
                    <ArrowRight size={18} />
                  </button>
                  <button type="button" className="btn-secondary-hero" onClick={scrollToPricing}>
                    <span>Xem bảng giá dịch vụ</span>
                  </button>
                </div>
              </div>

              <div className="elderly-hero-image-wrap">
                <img
                  src={elderlyCareImg}
                  alt="Chăm sóc người cao tuổi tại nhà"
                  className="elderly-hero-img"
                />
                <div className="elderly-hero-floating-badge">
                  <div className="floating-badge-icon">
                    <ShieldCheck size={22} />
                  </div>
                  <div className="floating-badge-text">
                    <strong>Được tin chọn bởi 1.000+ gia đình</strong>
                    <span>Tại Cần Thơ, TP.HCM & các tỉnh lân cận</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ================= 2. THUÊ GIÁ BAO NHIÊU ================= */}
        <section className="elderly-section alt-bg">
          <div className="container">
            <div className="elderly-section-header">
              <div className="elderly-badge-pill">
                <Clock size={13} />
                <span>HÌNH THỨC & MỨC GIÁ</span>
              </div>
              <h2 className="elderly-section-title">Thuê người chăm sóc người già giá bao nhiêu?</h2>
              <p className="elderly-section-desc">
                CareLink cung cấp các gói dịch vụ chăm sóc linh hoạt, đáp ứng chính xác nhu cầu
                chăm sóc theo ca ban ngày, trông đêm hoặc nuôi bệnh 24/24h.
              </p>
            </div>

            <div className="price-overview-cards">
              {/* Option 1: Theo ca */}
              <div className="price-overview-card">
                <h3 className="price-card-title">Gói Theo Ca Linh Hoạt</h3>
                <p className="price-card-subtitle">Ca 4 tiếng · Ca 8 tiếng · Ca 12 tiếng</p>
                <div className="price-card-amount">
                  <span className="price-number">100.000đ</span>
                  <span className="price-unit">/ giờ</span>
                </div>
                <ul className="price-features-list">
                  <li>
                    <CheckCircle2 size={16} />
                    <span>Phù hợp khi con cháu đi làm ban ngày hoặc cần người trông đỡ một buổi.</span>
                  </li>
                  <li>
                    <CheckCircle2 size={16} />
                    <span>Nấu cháo/cơm dinh dưỡng, tắm rửa vệ sinh cá nhân, cho ăn uống.</span>
                  </li>
                  <li>
                    <CheckCircle2 size={16} />
                    <span>Nhắc uống thuốc đúng giờ, đo huyết áp, theo dõi thân nhiệt.</span>
                  </li>
                  <li>
                    <CheckCircle2 size={16} />
                    <span>Đồng hành tâm lý, nói chuyện, đọc báo giúp các cụ vui vẻ.</span>
                  </li>
                </ul>
              </div>

              {/* Option 2: 24/24h */}
              <div className="price-overview-card featured">
                <span className="price-card-badge">Được chọn nhiều nhất</span>
                <h3 className="price-card-title">Gói Toàn Thời Gian (24/24h)</h3>
                <p className="price-card-subtitle">Tại nhà riêng hoặc Nuôi bệnh tại bệnh viện</p>
                <div className="price-card-amount">
                  <span className="price-number">800.000đ</span>
                  <span className="price-unit">/ ngày (24h)</span>
                </div>
                <ul className="price-features-list">
                  <li>
                    <CheckCircle2 size={16} />
                    <span>Chăm sóc toàn diện 24/7 cho cụ già yếu, tai biến hoặc sau xuất viện.</span>
                  </li>
                  <li>
                    <CheckCircle2 size={16} />
                    <span>Túc trực tại giường bệnh bệnh viện, hỗ trợ làm thủ tục xét nghiệm.</span>
                  </li>
                  <li>
                    <CheckCircle2 size={16} />
                    <span>Xoay trở tư thế mỗi 2 tiếng phòng ngừa loét tì đè đối với bệnh nhân nằm liệt.</span>
                  </li>
                  <li>
                    <CheckCircle2 size={16} />
                    <span>Hỗ trợ tập vật lý trị liệu phục hồi chức năng nhẹ nhàng hàng ngày.</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Slogan Quote */}
            <div className="slogan-quote-box">
              <p className="slogan-quote-text">
                “CareLink mang đến sự chăm sóc <span>tận tâm, kiên nhẫn và chuyên nghiệp</span> cho ông bà,
                cha mẹ ngay tại ngôi nhà thân quen — để gia đình bạn luôn an tâm công tác.”
              </p>
            </div>
          </div>
        </section>

        {/* ================= 3. BẢNG GIÁ MINH BẠCH ================= */}
        <section id="pricing" className="elderly-section">
          <div className="container">
            <div className="elderly-section-header">
              <div className="elderly-badge-pill">
                <Sparkles size={13} />
                <span>BẢNG GIÁ NIÊM YẾT</span>
              </div>
              <h2 className="elderly-section-title">Chi phí chăm sóc minh bạch</h2>
              <p className="elderly-section-desc">
                Giá dịch vụ được công khai minh bạch. Phụ phí di chuyển tự động đo bằng GPS độc lập, không phí ẩn.
              </p>
            </div>

            <div className="pricing-table-container">
              <table className="pricing-table">
                <thead>
                  <tr>
                    <th>Gói dịch vụ</th>
                    <th>Thời lượng</th>
                    <th>Giá dịch vụ</th>
                    <th>Phụ phí di chuyển</th>
                    <th>Phạm vi chăm sóc</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="package-name-cell">
                      <strong>Ca 4 tiếng</strong>
                      <span>Ca sáng hoặc ca chiều</span>
                    </td>
                    <td>4 giờ</td>
                    <td className="package-price-cell">400.000 đ</td>
                    <td className="package-distance-cell">
                      <span className="free-distance-badge">Miễn phí ≤ 5km</span>
                      <br />
                      <small>&gt; 5km: +10.000đ/km</small>
                    </td>
                    <td>Vệ sinh, nấu ăn, nhắc thuốc, dìu đi lại</td>
                  </tr>

                  <tr>
                    <td className="package-name-cell">
                      <strong>Ca 8 tiếng</strong>
                      <span>Ca hành chính hoặc trông đêm</span>
                    </td>
                    <td>8 giờ</td>
                    <td className="package-price-cell">750.000 đ</td>
                    <td className="package-distance-cell">
                      <span className="free-distance-badge">Miễn phí ≤ 5km</span>
                      <br />
                      <small>&gt; 5km: +10.000đ/km</small>
                    </td>
                    <td>Chăm sóc trọn buổi, đo sinh hiệu, vận động nhẹ</td>
                  </tr>

                  <tr>
                    <td className="package-name-cell">
                      <strong>Ca 12 tiếng</strong>
                      <span>Ca ngày dài hoặc trực đêm viện</span>
                    </td>
                    <td>12 giờ</td>
                    <td className="package-price-cell">1.100.000 đ</td>
                    <td className="package-distance-cell">
                      <span className="free-distance-badge">Miễn phí ≤ 5km</span>
                      <br />
                      <small>&gt; 5km: +10.000đ/km</small>
                    </td>
                    <td>Theo dõi đêm, xoay trở chống loét, thay bỉm</td>
                  </tr>

                  <tr>
                    <td className="package-name-cell">
                      <strong>Trọn gói 24/24h</strong>
                      <span>Tại nhà riêng hoặc Bệnh viện</span>
                    </td>
                    <td>24 giờ</td>
                    <td className="package-price-cell">1.200.000 đ</td>
                    <td className="package-distance-cell">
                      <span className="free-distance-badge">Miễn phí ≤ 5km</span>
                      <br />
                      <small>&gt; 5km: +10.000đ/km</small>
                    </td>
                    <td>Ăn uống, ngủ nghỉ cùng cụ, chăm sóc toàn diện 24/7</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="pricing-notes-box">
              <div className="pricing-note-item">
                <CheckCircle2 size={16} />
                <span>
                  <strong>Quy tắc phụ phí di chuyển:</strong> Khoảng cách đo chính xác theo bán kính GPS giữa người chăm sóc và điểm hẹn. Miễn phí di chuyển dưới 5km; cự ly trên 5km phụ thu 10.000đ cho mỗi km vượt thêm.
                </span>
              </div>
              <div className="pricing-note-item">
                <CheckCircle2 size={16} />
                <span>
                  <strong>Phương thức thanh toán:</strong> Thanh toán trực tiếp bằng tiền mặt hoặc chuyển khoản cho người chăm sóc sau khi kết thúc ca làm việc.
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ================= 4. VIỆC LÀM & KHÔNG LÀM ================= */}
        <section className="elderly-section alt-bg">
          <div className="container">
            <div className="elderly-section-header">
              <div className="elderly-badge-pill">
                <ShieldCheck size={13} />
                <span>PHẠM VI TRÁCH NHIỆM</span>
              </div>
              <h2 className="elderly-section-title">Rõ ràng việc làm — và không làm</h2>
              <p className="elderly-section-desc">
                Quy định minh bạch giúp gia đình và người chăm sóc thấu hiểu nhau, đảm bảo chất lượng phục vụ tốt nhất.
              </p>
            </div>

            <div className="scope-grid">
              {/* Left Column: Việc LÀM */}
              <div className="scope-do-col">
                <div className="scope-do-card">
                  <div className="scope-do-icon-wrap">
                    <Utensils size={22} />
                  </div>
                  <div className="scope-do-content">
                    <h3>1. Hỗ trợ sinh hoạt & Vệ sinh cá nhân</h3>
                    <ul>
                      <li>Tắm rửa, gội đầu, vệ sinh thân thể an toàn trong phòng tắm hoặc tại giường.</li>
                      <li>Thay tã, bỉm, hỗ trợ đi vệ sinh, rửa ráy sạch sẽ, tránh viêm nhiễm.</li>
                      <li>Nấu cháo, súp hoặc chuẩn bị khẩu phần ăn theo chế độ bệnh lý (tiểu đường, mỡ máu).</li>
                      <li>Dìu đi lại, hỗ trợ nâng đỡ nhẹ nhàng, chống té ngã.</li>
                    </ul>
                  </div>
                </div>

                <div className="scope-do-card">
                  <div className="scope-do-icon-wrap">
                    <Pill size={22} />
                  </div>
                  <div className="scope-do-content">
                    <h3>2. Chăm sóc sức khỏe & Đo sinh hiệu</h3>
                    <ul>
                      <li>Đo huyết áp, đo đường huyết mao mạch, SpO2 và thân nhiệt định kỳ.</li>
                      <li>Nhắc nhở và cho cụ uống thuốc đúng giờ, đúng liều lượng theo đơn của bác sĩ.</li>
                      <li>Hỗ trợ tập các bài vật lý trị liệu cơ bản, xoa bóp tay chân chống teo cơ.</li>
                      <li>Ghi nhật ký sức khỏe hàng ngày để báo cáo tình hình cho gia đình.</li>
                    </ul>
                  </div>
                </div>

                <div className="scope-do-card">
                  <div className="scope-do-icon-wrap">
                    <Smile size={22} />
                  </div>
                  <div className="scope-do-content">
                    <h3>3. Chăm sóc tinh thần & Đồng hành</h3>
                    <ul>
                      <li>Trò chuyện, tâm sự, đọc sách báo, nghe đài cùng cụ già.</li>
                      <li>Đưa cụ đi dạo ngoài trời, tập thể dục dưỡng sinh nhẹ nhàng.</li>
                      <li>Tạo không khí ấm cúng, kiên nhẫn lắng nghe, xua tan cảm giác buồn chán, cô đơn.</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Right Column: Việc KHÔNG LÀM */}
              <div className="scope-dont-card">
                <div className="scope-dont-header">
                  <div className="scope-dont-icon">
                    <AlertTriangle size={22} />
                  </div>
                  <h3>Những việc Caregiver KHÔNG làm</h3>
                </div>
                <ul className="scope-dont-list">
                  <li>
                    <XCircle size={18} />
                    <span><strong>Không làm thủ thuật xâm lấn trái phép:</strong> Tuyệt đối không tự ý tiêm truyền tĩnh mạch hay kê đơn thuốc khi không có chỉ định chuyên môn của bác sĩ.</span>
                  </li>
                  <li>
                    <XCircle size={18} />
                    <span><strong>Không thay thế người giúp việc nhà toàn thời gian:</strong> Caregiver tập trung 100% thời gian chăm sóc cụ, không dọn dẹp tổng vệ sinh cả ngôi nhà hoặc nấu ăn cho gia đình đông người.</span>
                  </li>
                  <li>
                    <XCircle size={18} />
                    <span><strong>Không giữ tiền bạc, tài sản có giá trị:</strong> Không mượn tiền, giữ sổ tiết kiệm hay tài sản quý giá của gia đình để đảm bảo tính minh bạch.</span>
                  </li>
                  <li>
                    <XCircle size={18} />
                    <span><strong>Không làm việc quá sức khi thiếu an toàn:</strong> Không bồng bế cụ một mình nếu thể trạng cụ quá nặng mà không có sự trợ giúp hoặc thiết bị chuyên dụng.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* ================= 5. TÌNH TRẠNG NGƯỜI THÂN ================= */}
        <section className="elderly-section">
          <div className="container">
            <div className="elderly-section-header">
              <div className="elderly-badge-pill">
                <Activity size={13} />
                <span>CHĂM SÓC CHUYÊN BIỆT</span>
              </div>
              <h2 className="elderly-section-title">Chăm sóc đúng theo tình trạng của người thân</h2>
              <p className="elderly-section-desc">
                Mỗi thể trạng của người lớn tuổi cần phương pháp chăm sóc và kỹ năng điều dưỡng tương thích.
              </p>
            </div>

            <div className="conditions-grid">
              <div className="condition-card">
                <div className="condition-icon-box">
                  <Heart size={24} />
                </div>
                <h3 className="condition-title">Người cao tuổi tự chủ sinh hoạt</h3>
                <p className="condition-desc">
                  Cần người bầu bạn, trò chuyện, nhắc uống thuốc, phụ giúp nấu ăn và cùng đi dạo để phòng tránh cô đơn tuổi xế chiều.
                </p>
              </div>

              <div className="condition-card">
                <div className="condition-icon-box">
                  <Sparkles size={24} />
                </div>
                <h3 className="condition-title">Suy giảm trí nhớ / Sa sút trí tuệ</h3>
                <p className="condition-desc">
                  Người bệnh Alzheimer hoặc lú lẫn cần người túc trực giám sát an toàn 24/7, kiên nhẫn nhắc nhở việc ăn uống, vệ sinh.
                </p>
              </div>

              <div className="condition-card">
                <div className="condition-icon-box">
                  <Building2 size={24} />
                </div>
                <h3 className="condition-title">Sau phẫu thuật & Xuất viện</h3>
                <p className="condition-desc">
                  Hỗ trợ hồi phục chức năng, thay băng vô trùng, theo dõi dấu hiệu sốt, nhiễm trùng và chế độ dinh dưỡng lành sẹo.
                </p>
              </div>

              <div className="condition-card">
                <div className="condition-icon-box">
                  <UserCheck size={24} />
                </div>
                <h3 className="condition-title">Đi lại khó khăn / Sử dụng xe lăn</h3>
                <p className="condition-desc">
                  Kỹ năng nâng đỡ chuyên nghiệp chống trượt ngã, hỗ trợ di chuyển an toàn giữa giường và xe lăn, tập co duỗi khớp.
                </p>
              </div>

              <div className="condition-card">
                <div className="condition-icon-box">
                  <Activity size={24} />
                </div>
                <h3 className="condition-title">Nằm liệt giường / Chăm sóc toàn diện</h3>
                <p className="condition-desc">
                  Kỹ thuật xoay trở 2 giờ/lần tránh loét tì đè, vệ sinh tại chỗ, vỗ rung long đờm và hỗ trợ ăn uống an toàn.
                </p>
              </div>

              <div className="condition-card">
                <div className="condition-icon-box">
                  <Building2 size={24} />
                </div>
                <h3 className="condition-title">Nuôi bệnh tại các Bệnh viện</h3>
                <p className="condition-desc">
                  Túc trực tại giường bệnh, thay người nhà trông nom ban đêm, hỗ trợ lấy thuốc và phối hợp cùng y bác sĩ khoa điều trị.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ================= 6. QUY TRÌNH 4 BƯỚC ================= */}
        <section className="elderly-section alt-bg">
          <div className="container">
            <div className="elderly-section-header">
              <div className="elderly-badge-pill">
                <Calendar size={13} />
                <span>QUY TRÌNH ĐƠN GIẢN</span>
              </div>
              <h2 className="elderly-section-title">Đặt dịch vụ chỉ với 4 bước</h2>
              <p className="elderly-section-desc">
                Trải nghiệm đặt lịch nhanh chóng, tiện lợi trực tiếp trên điện thoại hoặc máy tính.
              </p>
            </div>

            <div className="process-steps-row">
              <div className="process-step-card">
                <div className="process-step-number">1</div>
                <h3 className="process-step-name">Chọn dịch vụ & thời gian</h3>
                <p className="process-step-desc">
                  Lựa chọn ca 4h, 8h, 12h hoặc 24h và thời gian bắt đầu mong muốn.
                </p>
              </div>

              <div className="process-step-card">
                <div className="process-step-number">2</div>
                <h3 className="process-step-name">Cung cấp tình trạng sức khỏe</h3>
                <p className="process-step-desc">
                  Nhập ghi chú sức khỏe của cụ và địa điểm (Tại nhà riêng hoặc Bệnh viện).
                </p>
              </div>

              <div className="process-step-card">
                <div className="process-step-number">3</div>
                <h3 className="process-step-name">CareLink kết nối Caregiver</h3>
                <p className="process-step-desc">
                  Hệ thống quét GPS tìm người chăm sóc gần nhất, hiển thị phụ phí minh bạch.
                </p>
              </div>

              <div className="process-step-card">
                <div className="process-step-number">4</div>
                <h3 className="process-step-name">Bắt đầu & Thanh toán an tâm</h3>
                <p className="process-step-desc">
                  Caregiver đến tận nơi phục vụ chu đáo. Bạn thanh toán sau ca làm việc.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ================= 7. FAQ ACCORDION ================= */}
        <section className="elderly-section">
          <div className="container">
            <div className="elderly-section-header">
              <div className="elderly-badge-pill">
                <HelpCircle size={13} />
                <span>CÂU HỎI THƯỜNG GẶP</span>
              </div>
              <h2 className="elderly-section-title">Giải đáp thắc mắc về dịch vụ</h2>
              <p className="elderly-section-desc">
                Những điều khách hàng thường quan tâm khi thuê người chăm sóc người già tại CareLink.
              </p>
            </div>

            <div className="faq-grid">
              {FAQ_LIST.map((faq, idx) => {
                const isOpen = openFaqIndex === idx;
                return (
                  <div key={idx} className={`faq-card ${isOpen ? 'open' : ''}`}>
                    <button
                      type="button"
                      className="faq-question-btn"
                      onClick={() => toggleFaq(idx)}
                      aria-expanded={isOpen}
                    >
                      <div className="faq-question-left">
                        <HelpCircle size={18} className="faq-icon" />
                        <span>{faq.q}</span>
                      </div>
                      <ChevronDown size={18} className="faq-chevron" />
                    </button>
                    {isOpen && <div className="faq-answer">{faq.a}</div>}
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ================= 8. BOTTOM CTA BANNER ================= */}
        <section className="elderly-section" style={{ paddingTop: 0 }}>
          <div className="container">
            <div className="elderly-cta-banner">
              <h2 className="elderly-cta-title">
                Bạn đang tìm người chăm sóc chu đáo cho ông bà, cha mẹ?
              </h2>
              <p className="elderly-cta-subtitle">
                Hãy để CareLink đồng hành san sẻ gánh nặng yêu thương cùng gia đình bạn với đội ngũ người chăm sóc tận tâm nhất.
              </p>
              <div className="elderly-cta-buttons">
                <button type="button" className="btn-cta-white" onClick={handleBookNow}>
                  <Search size={18} />
                  <span>Tìm người chăm sóc người cao tuổi ngay</span>
                </button>
                <button
                  type="button"
                  className="btn-cta-outline"
                  onClick={() => setIsPostModalOpen(true)}
                >
                  <span>Đăng yêu cầu chăm sóc</span>
                  <ArrowRight size={18} />
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Modal đăng yêu cầu */}
      {isPostModalOpen && (
        <PostCareRequestModal
          isOpen={isPostModalOpen}
          onClose={() => setIsPostModalOpen(false)}
        />
      )}

      <Footer />
    </div>
  );
};

