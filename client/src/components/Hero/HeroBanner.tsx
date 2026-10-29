import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import heroBg from '../../assets/hero-bg.png';
import './HeroBanner.css';

export const HeroBanner: React.FC = () => {
  return (
    <section className="hero-section" aria-label="Giới thiệu CareLink">
      {/* Background visual - covers 100% viewport width edge-to-edge */}
      <img
        src={heroBg}
        alt=""
        aria-hidden="true"
        className="hero-bg-visual"
      />

      {/* Content wrapper aligned with standard content grid */}
      <div className="hero-content-wrapper">
        <div className="hero-content-layer">
          <div className="tag-badge hero-tag">
            <span>CHĂM SÓC TẬN TÂM • KẾT NỐI YÊU THƯƠNG</span>
          </div>

          <h1 className="hero-title">
            Sức khỏe của bạn, <br />
            <span className="hero-title-highlight">chúng tôi quan tâm.</span>
          </h1>

          <p className="hero-subtitle">
            Kết nối với người chăm sóc phù hợp để bạn và gia đình an tâm hơn mỗi ngày.
          </p>

          <div className="hero-buttons">
            <Link
              to="/caregivers"
              className="hero-btn-primary"
            >
              <span>Tìm người chăm sóc</span>
              <ArrowRight size={18} aria-hidden="true" />
            </Link>

            <Link
              to="/services"
              className="hero-btn-secondary"
            >
              <span>Khám phá dịch vụ</span>
            </Link>
          </div>

          {/* Value props */}
          <div className="hero-features">
            <div className="feature-item">
              <CheckCircle2 size={18} className="feature-check-icon" aria-hidden="true" />
              <span>Đặt lịch thuận tiện</span>
            </div>
            <div className="feature-item">
              <CheckCircle2 size={18} className="feature-check-icon" aria-hidden="true" />
              <span>Thông tin rõ ràng</span>
            </div>
            <div className="feature-item">
              <CheckCircle2 size={18} className="feature-check-icon" aria-hidden="true" />
              <span>Chăm sóc tận tâm</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
