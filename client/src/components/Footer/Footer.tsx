import React from 'react';
import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin, Shield } from 'lucide-react';
import carelinkLogo from '../../assets/images/carelink-logo.png';
import './Footer.css';

export const Footer: React.FC = () => {
  return (
    <footer className="footer-root">
      <div className="container footer-container">
        <div className="footer-grid">
          {/* Brand Col */}
          <div className="footer-brand-col">
            <Link to="/" className="footer-logo">
              <img
                src={carelinkLogo}
                alt="CareLink Logo"
                className="footer-brand-logo-img"
              />
              <span className="footer-brand-name">CareLink</span>
            </Link>
            <p className="footer-slogan">
              Nền tảng kết nối người chăm sóc sức khỏe uy tín, tận tâm, mang đến sự an tâm cho mọi gia đình Việt.
            </p>
            <div className="footer-verified-badge">
              <Shield size={16} className="text-blue" />
              <span>Nền tảng xác thực thông tin 100%</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="footer-col">
            <h4 className="footer-heading">Khám phá</h4>
            <ul className="footer-nav-list">
              <li><Link to="/">Trang chủ</Link></li>
              <li><Link to="/services">Dịch vụ chăm sóc</Link></li>
              <li><Link to="/caregivers">Đội ngũ người chăm sóc</Link></li>
              <li><Link to="/about">Về chúng tôi</Link></li>
            </ul>
          </div>

          {/* Services Col */}
          <div className="footer-col">
            <h4 className="footer-heading">Dịch vụ chính</h4>
            <ul className="footer-nav-list">
              <li><Link to="/caregivers?service=home-care">Chăm sóc tại nhà</Link></li>
              <li><Link to="/caregivers?service=elderly-care">Chăm sóc người cao tuổi</Link></li>
              <li><Link to="/caregivers?service=post-treatment-care">Chăm sóc sau điều trị</Link></li>
              <li><Link to="/caregivers?service=child-care">Chăm sóc trẻ em</Link></li>
            </ul>
          </div>

          {/* Contact Col */}
          <div className="footer-col">
            <h4 className="footer-heading">Liên hệ & Hỗ trợ</h4>
            <ul className="footer-contact-list">
              <li>
                <Phone size={16} className="contact-icon" />
                <span>Hotline: 1900 6868 (24/7)</span>
              </li>
              <li>
                <Mail size={16} className="contact-icon" />
                <span>hotro@carelink.vn</span>
              </li>
              <li>
                <MapPin size={16} className="contact-icon" />
                <span>Khu Công nghệ cao, TP. Thủ Đức, TP. Hồ Chí Minh</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom-row">
          <p className="copyright-text">
            © {new Date().getFullYear()} CareLink. Nền tảng chăm sóc sức khỏe kết nối yêu thương.
          </p>
          <div className="footer-legal-links">
            <a href="#privacy">Chính sách bảo mật</a>
            <span className="dot-sep">•</span>
            <a href="#terms">Điều khoản sử dụng</a>
            <span className="dot-sep">•</span>
            <a href="#safety">Cam kết chất lượng</a>
          </div>
        </div>
      </div>
    </footer>
  );
};
