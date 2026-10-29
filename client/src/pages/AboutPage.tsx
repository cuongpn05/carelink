import React from 'react';
import { Navbar } from '../components/Header/Navbar';
import { Footer } from '../components/Footer/Footer';
import { TrustBanner } from '../components/Trust/TrustBanner';

export const AboutPage: React.FC = () => {
  return (
    <div>
      <Navbar />
      <main style={{ padding: '60px 0' }}>
        <div className="container" style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
          <div className="tag-badge" style={{ marginBottom: '16px' }}>VỀ CARELINK</div>
          <h1 style={{ fontSize: '36px', fontWeight: 800, color: '#0f172a', marginBottom: '16px' }}>
            Sứ mệnh chăm sóc sức khỏe gia đình Việt
          </h1>
          <p style={{ color: '#475569', fontSize: '16px', lineHeight: 1.7, marginBottom: '32px' }}>
            CareLink ra đời với mục tiêu giải quyết bài toán chăm sóc người thân trong nhịp sống hiện đại. 
            Chúng tôi ứng dụng công nghệ để kết nối các gia đình với đội ngũ người chăm sóc, điều dưỡng viên uy tín, 
            được kiểm duyệt lý lịch và đào tạo chuyên môn bài bản.
          </p>
        </div>
        <TrustBanner />
      </main>
      <Footer />
    </div>
  );
};

