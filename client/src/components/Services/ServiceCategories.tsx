import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Home, User, BriefcaseMedical, Baby, ArrowRight } from 'lucide-react';
import { serviceCategories } from '../../data/mockData';
import { ServiceCategory } from '../../types';
import './ServiceCategories.css';

interface ServiceCategoriesProps {
  onSelectCategory?: (category: ServiceCategory) => void;
}

export const ServiceCategories: React.FC<ServiceCategoriesProps> = ({ onSelectCategory }) => {
  const navigate = useNavigate();

  const renderIcon = (type: ServiceCategory['iconType'], colorClass: string) => {
    switch (type) {
      case 'home':
        return <Home size={28} className={colorClass} />;
      case 'elderly':
        return <User size={28} className={colorClass} />;
      case 'medical':
        return <BriefcaseMedical size={28} className={colorClass} />;
      case 'baby':
        return <Baby size={28} className={colorClass} />;
      default:
        return <Home size={28} className={colorClass} />;
    }
  };

  const handleCardClick = (category: ServiceCategory) => {
    if (onSelectCategory) {
      onSelectCategory(category);
    } else {
      navigate(`/caregivers?service=${category.id}`);
    }
  };

  return (
    <section className="services-section">
      <div className="container">
        {/* Section Header */}
        <div className="section-header">
          <div className="section-header-left">
            <div className="tag-badge">
              <span>DỊCH VỤ CỦA CHÚNG TÔI</span>
            </div>
            <h2 className="section-title">Chăm sóc theo nhu cầu</h2>
            <p className="section-subtitle">
              Lựa chọn dịch vụ phù hợp với bạn và gia đình.
            </p>
          </div>
          <Link to="/services" className="section-link-more">
            <span>Xem tất cả</span>
            <ArrowRight size={18} />
          </Link>
        </div>

        {/* Categories Grid (4 cards in a row on desktop) */}
        <div className="categories-grid">
          {serviceCategories.map((category) => (
            <div
              key={category.id}
              className={`category-card theme-${category.themeColor}`}
              onClick={() => handleCardClick(category)}
              role="button"
              tabIndex={0}
              aria-label={`Dịch vụ ${category.title}: ${category.description}`}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleCardClick(category);
                }
              }}
            >
              <div className={`category-icon-box bg-tint-${category.themeColor}`} aria-hidden="true">
                {renderIcon(category.iconType, `icon-${category.themeColor}`)}
              </div>

              <div className="category-info">
                <h3 className="category-title">{category.title}</h3>
                <p className="category-description">{category.description}</p>
              </div>

              <div className="category-arrow-action" aria-hidden="true">
                <div className={`arrow-circle-btn btn-tint-${category.themeColor}`}>
                  <ArrowRight size={18} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
