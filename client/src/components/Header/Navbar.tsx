import React, { useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import carelinkLogo from '../../assets/images/carelink-logo.png';
import { 
  User as UserIcon, 
  LogOut, 
  Calendar, 
  ChevronDown, 
  Menu, 
  X,
  Sparkles
} from 'lucide-react';
import './Navbar.css';

interface NavbarProps {
  onOpenLoginModal?: () => void;
  onOpenRegisterModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  onOpenLoginModal, 
  onOpenRegisterModal 
}) => {
  const { user, isAuthenticated, logout, toggleDemoAuth } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    setDropdownOpen(false);
  };

  return (
    <header className="navbar-header">
      <div className="container navbar-container">
        {/* Brand Logo with Official CareLink Icon */}
        <Link to="/" className="navbar-logo" title="CareLink - Trang chủ">
          <img
            src={carelinkLogo}
            alt="CareLink Logo"
            className="navbar-brand-logo-img"
          />
          <span className="logo-text">CareLink</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="navbar-nav">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              `nav-link ${isActive ? 'nav-link-active' : ''}`
            }
          >
            Trang chủ
            <span className="active-indicator" />
          </NavLink>
          <NavLink
            to="/services"
            className={({ isActive }) =>
              `nav-link ${isActive ? 'nav-link-active' : ''}`
            }
          >
            Dịch vụ
            <span className="active-indicator" />
          </NavLink>
          <NavLink
            to="/caregivers"
            className={({ isActive }) =>
              `nav-link ${isActive ? 'nav-link-active' : ''}`
            }
          >
            Người chăm sóc
            <span className="active-indicator" />
          </NavLink>
          <NavLink
            to="/about"
            className={({ isActive }) =>
              `nav-link ${isActive ? 'nav-link-active' : ''}`
            }
          >
            Về chúng tôi
            <span className="active-indicator" />
          </NavLink>
        </nav>

        {/* Right Section: Auth buttons or User Profile */}
        <div className="navbar-actions">
          {/* Quick Demo Switcher */}
          <button
            type="button"
            className="demo-toggle-btn"
            onClick={toggleDemoAuth}
            title="Nhấn để đổi trạng thái Đã đăng nhập / Khách để thử nghiệm"
          >
            <Sparkles size={14} />
            <span>{isAuthenticated ? 'Xem dạng Khách' : 'Thử Đã đăng nhập'}</span>
          </button>

          {!isAuthenticated ? (
            <div className="auth-buttons">
              <button
                type="button"
                className="btn-login"
                onClick={() => (onOpenLoginModal ? onOpenLoginModal() : navigate('/login'))}
              >
                Đăng nhập
              </button>
              <button
                type="button"
                className="btn-register"
                onClick={() => (onOpenRegisterModal ? onOpenRegisterModal() : navigate('/register'))}
              >
                Đăng ký
              </button>
            </div>
          ) : (
            <div className="user-profile-wrapper">
              <button
                type="button"
                className="user-profile-btn"
                aria-haspopup="true"
                aria-expanded={dropdownOpen}
                aria-label={`Menu người dùng: ${user?.name}`}
                onClick={() => setDropdownOpen(!dropdownOpen)}
              >
                <img
                  src={
                    user?.avatar ||
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'
                  }
                  alt={user?.name}
                  className="user-avatar"
                />
                <div className="user-meta">
                  <span className="user-name">{user?.name}</span>
                  <span className="user-role">
                    {user?.role === 'caregiver' ? 'Người chăm sóc' : 'Khách hàng'}
                  </span>
                </div>
                <ChevronDown size={16} className={`chevron-icon ${dropdownOpen ? 'rotate' : ''}`} aria-hidden="true" />
              </button>

              {dropdownOpen && (
                <div className="profile-dropdown animate-fade-in" role="menu">
                  <div className="dropdown-user-header">
                    <p className="dropdown-user-name">{user?.name}</p>
                    <p className="dropdown-user-email">{user?.email}</p>
                  </div>
                  <div className="dropdown-divider" />
                  <Link
                    to="/profile"
                    className="dropdown-item"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <UserIcon size={16} />
                    <span>Hồ sơ cá nhân</span>
                  </Link>
                  <Link
                    to="/my-bookings"
                    className="dropdown-item"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <Calendar size={16} />
                    <span>Lịch hẹn đã đặt</span>
                  </Link>
                  <div className="dropdown-divider" />
                  <button
                    type="button"
                    className="dropdown-item dropdown-item-logout"
                    onClick={handleLogout}
                  >
                    <LogOut size={16} />
                    <span>Đăng xuất</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Mobile hamburger menu toggle */}
          <button
            type="button"
            className="mobile-menu-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Đóng menu' : 'Mở menu điều hướng'}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X size={24} aria-hidden="true" /> : <Menu size={24} aria-hidden="true" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="mobile-drawer animate-fade-in">
          <nav className="mobile-nav">
            <NavLink
              to="/"
              end
              className="mobile-nav-link"
              onClick={() => setMobileMenuOpen(false)}
            >
              Trang chủ
            </NavLink>
            <NavLink
              to="/services"
              className="mobile-nav-link"
              onClick={() => setMobileMenuOpen(false)}
            >
              Dịch vụ
            </NavLink>
            <NavLink
              to="/caregivers"
              className="mobile-nav-link"
              onClick={() => setMobileMenuOpen(false)}
            >
              Người chăm sóc
            </NavLink>
            <NavLink
              to="/about"
              className="mobile-nav-link"
              onClick={() => setMobileMenuOpen(false)}
            >
              Về chúng tôi
            </NavLink>
          </nav>

          <div className="mobile-auth">
            {!isAuthenticated ? (
              <div className="mobile-auth-btns">
                <button
                  type="button"
                  className="btn-login w-full"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenLoginModal?.();
                  }}
                >
                  Đăng nhập
                </button>
                <button
                  type="button"
                  className="btn-register w-full"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenRegisterModal?.();
                  }}
                >
                  Đăng ký
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="btn-login w-full text-red"
                onClick={handleLogout}
              >
                Đăng xuất ({user?.name})
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
