import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import carelinkLogo from '../assets/images/carelink-logo.png';
import toast from 'react-hot-toast';
import { getBookingNotifications } from '../services/bookingService';
import { getCareRequestNotifications } from '../services/careRequestService';
import {
  Bell,
  HeartHandshake,
  Shield,
  ShieldAlert,
  ShieldX,
  LogOut,
  User as UserIcon,
  Calendar,
  ChevronDown,
  Menu,
  X,
  FileText,
  PlusCircle,
  Briefcase,
} from 'lucide-react';
import './Navbar.css';

export const Navbar = () => {
  const { account, user, caregiverProfile, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const knownCustomerId = useRef(null);
  const knownNotificationIds = useRef(null);
  const isApprovedCaregiver =
    caregiverProfile?.approvalStatus === 'APPROVED' ||
    caregiverProfile?.verificationStatus === 'VERIFIED';

  const refreshNotifications = useCallback(async () => {
    if (!isAuthenticated || account?.role !== 'CUSTOMER') {
      setUnreadNotifications(0);
      knownCustomerId.current = null;
      knownNotificationIds.current = null;
      return;
    }

    const customerId = String(account?._id || '');
    if (knownCustomerId.current !== customerId) {
      knownCustomerId.current = customerId;
      knownNotificationIds.current = null;
    }

    try {
      const [bookingRes, requestRes] = await Promise.allSettled([
        getBookingNotifications(),
        getCareRequestNotifications(),
      ]);

      const bookingNotifs = bookingRes.status === 'fulfilled' ? bookingRes.value : [];
      const requestNotifs = requestRes.status === 'fulfilled' ? requestRes.value : [];

      const currentIds = new Set([
        ...bookingNotifs.map((n) => `b_${n.bookingId}`),
        ...requestNotifs.map((n) => `r_${n.requestId}`),
      ]);

      if (knownNotificationIds.current) {
        requestNotifs
          .filter((n) => !knownNotificationIds.current.has(`r_${n.requestId}`) && !n.isRead)
          .forEach((n) => toast.success(n.message, { duration: 6000 }));

        bookingNotifs
          .filter((n) => !knownNotificationIds.current.has(`b_${n.bookingId}`) && !n.isRead)
          .forEach((n) => toast.success(n.message));
      }

      knownNotificationIds.current = currentIds;
      const unreadB = bookingNotifs.filter((n) => !n.isRead).length;
      const unreadR = requestNotifs.filter((n) => !n.isRead).length;
      setUnreadNotifications(unreadB + unreadR);
    } catch (error) {
      console.error('Không thể cập nhật thông báo:', error);
    }
  }, [account?._id, account?.role, isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated || account?.role !== 'CUSTOMER') {
      setUnreadNotifications(0);
      knownCustomerId.current = null;
      knownNotificationIds.current = null;
      return undefined;
    }

    void refreshNotifications();
    const intervalId = window.setInterval(() => {
      void refreshNotifications();
    }, 20000);

    return () => window.clearInterval(intervalId);
  }, [account?.role, isAuthenticated, refreshNotifications]);

  const handleBecomeCaregiverClick = () => {
    if (!isAuthenticated) {
      navigate('/auth?redirect=/become-caregiver');
    } else if (isApprovedCaregiver || account?.role === 'CAREGIVER') {
      navigate('/caregiver/bookings');
    } else {
      navigate('/become-caregiver');
    }
  };

  // Render Thanh Uy Tín (Reputation Bar)
  const renderReputationBar = () => {
    if (!isAuthenticated || !account) return null;

    const score = account.reputationScore ?? 100;

    let badgeBg = '#ecfdf5';
    let badgeText = '#047857';
    let badgeBorder = '#a7f3d0';
    let icon = <Shield size={14} color="#059669" />;
    let text = `${score}/100 Uy tín`;

    if (score < 50) {
      badgeBg = '#fff1f2';
      badgeText = '#be123c';
      badgeBorder = '#fecdd3';
      icon = <ShieldX size={14} color="#e11d48" />;
      text = `${score}/100 Tạm khóa`;
    } else if (score < 70) {
      badgeBg = '#fffbeb';
      badgeText = '#b45309';
      badgeBorder = '#fde68a';
      icon = <ShieldAlert size={14} color="#d97706" />;
      text = `${score}/100 Cảnh báo`;
    }

    return (
      <div
        className="navbar-reputation-badge"
        title={`Điểm uy tín tài khoản: ${score}/100. Bấm để xem chi tiết hồ sơ & lịch sử uy tín.`}
        onClick={() => navigate('/profile')}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '5px 12px',
          borderRadius: '9999px',
          fontSize: '12px',
          fontWeight: 600,
          backgroundColor: badgeBg,
          color: badgeText,
          border: `1px solid ${badgeBorder}`,
          cursor: 'pointer',
        }}
      >
        {icon}
        <span>{text}</span>
      </div>
    );
  };

  return (
    <header className="navbar-header">
      <div className="navbar-container">
        {/* Brand Logo */}
        <Link to="/" className="navbar-brand">
          {carelinkLogo ? (
            <img
              src={carelinkLogo}
              alt="CareLink Logo"
              className="navbar-brand-logo"
            />
          ) : (
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                backgroundColor: '#1d4ed8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontWeight: 'bold',
              }}
            >
              CL
            </div>
          )}
          <span className="navbar-brand-text">
            Care<span className="navbar-brand-highlight">Link</span>
          </span>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="navbar-desktop-nav">
          <NavLink
            to="/"
            end
            className={({ isActive }) => `navbar-nav-link ${isActive ? 'active' : ''}`}
          >
            Trang chủ
          </NavLink>

          <NavLink
            to="/services"
            className={({ isActive }) => `navbar-nav-link ${isActive ? 'active' : ''}`}
          >
            Dịch vụ
          </NavLink>

          <NavLink
            to="/caregivers"
            className={({ isActive }) => `navbar-nav-link ${isActive ? 'active' : ''}`}
          >
            Người chăm sóc
          </NavLink>

          {isAuthenticated && account?.role === 'CUSTOMER' && (
            <>
              <NavLink
                to="/my-care-requests"
                className={({ isActive }) => `navbar-nav-link ${isActive ? 'active' : ''}`}
              >
                Yêu cầu của tôi
              </NavLink>
              <NavLink
                to="/bookings"
                className={({ isActive }) => `navbar-nav-link ${isActive ? 'active' : ''}`}
              >
                Lịch đã đặt
              </NavLink>
            </>
          )}

          {isAuthenticated && (account?.role === 'CAREGIVER' || isApprovedCaregiver) && (
            <>
              <NavLink
                to="/caregiver/marketplace"
                className={({ isActive }) => `navbar-nav-link ${isActive ? 'active' : ''}`}
              >
                Yêu cầu phù hợp
              </NavLink>
              <NavLink
                to="/caregiver/bookings"
                className={({ isActive }) => `navbar-nav-link ${isActive ? 'active' : ''}`}
              >
                Lịch nhận việc
              </NavLink>
            </>
          )}
        </nav>

        {/* Right Section Actions */}
        <div className="navbar-actions">
          {isAuthenticated && account?.role === 'CUSTOMER' && (
            <button
              type="button"
              onClick={() => navigate('/bookings')}
              aria-label={`Thông báo lịch đặt${unreadNotifications ? `, ${unreadNotifications} chưa đọc` : ''}`}
              title="Thông báo và lịch của tôi"
              style={{
                position: 'relative',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '40px',
                height: '40px',
                border: '1px solid #e2e8f0',
                borderRadius: '50%',
                backgroundColor: '#fff',
                color: '#334155',
                cursor: 'pointer',
              }}
            >
              <Bell size={19} />
              {unreadNotifications > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '-4px',
                    right: '-5px',
                    minWidth: '18px',
                    height: '18px',
                    padding: '0 4px',
                    borderRadius: '999px',
                    backgroundColor: '#ef4444',
                    color: '#fff',
                    fontSize: '11px',
                    fontWeight: 700,
                    lineHeight: '18px',
                  }}
                >
                  {unreadNotifications > 9 ? '9+' : unreadNotifications}
                </span>
              )}
            </button>
          )}

          {/* Nút Trở thành đối tác */}
          <button
            type="button"
            onClick={handleBecomeCaregiverClick}
            className="navbar-partner-btn"
          >
            <HeartHandshake size={16} />
            <span>
              {isApprovedCaregiver || account?.role === 'CAREGIVER'
                ? 'Khu vực Đối tác'
                : 'Trở thành đối tác'}
            </span>
          </button>

          {/* Thanh Uy Tín */}
          {renderReputationBar()}

          {/* Auth Section */}
          {!isAuthenticated ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Link to="/auth?mode=login" className="navbar-login-btn">
                Đăng nhập
              </Link>
              <Link to="/auth?mode=register" className="navbar-register-btn">
                Đăng ký
              </Link>
            </div>
          ) : (
            /* User Profile & Dropdown */
            <div style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '5px 12px 5px 6px',
                  borderRadius: '9999px',
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  cursor: 'pointer',
                }}
              >
                <img
                  src={
                    user?.avatarUrl ||
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80'
                  }
                  alt={user?.fullName || 'Avatar'}
                  style={{
                    width: '34px',
                    height: '34px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                  }}
                />
                <div style={{ textAlign: 'left', lineHeight: '1.2' }}>
                  <div
                    style={{
                      fontSize: '13.5px',
                      fontWeight: 700,
                      color: '#0f172a',
                    }}
                  >
                    {user?.fullName || account?.email?.split('@')[0]}
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>
                    {isApprovedCaregiver || account?.role === 'CAREGIVER'
                      ? 'Cộng tác viên'
                      : account?.role === 'ADMIN'
                      ? 'Quản trị viên'
                      : 'Khách hàng'}
                  </div>
                </div>
                <ChevronDown size={14} style={{ color: '#64748b' }} />
              </button>

              {/* Dropdown Menu */}
              {dropdownOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: '115%',
                    right: 0,
                    width: '230px',
                    backgroundColor: '#ffffff',
                    borderRadius: '14px',
                    boxShadow: '0 10px 25px -3px rgba(0,0,0,0.1), 0 4px 6px -4px rgba(0,0,0,0.05)',
                    border: '1px solid #e2e8f0',
                    padding: '8px',
                    zIndex: 100,
                  }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setDropdownOpen(false);
                      navigate('/profile');
                    }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: 'none',
                      backgroundColor: 'transparent',
                      color: '#0f172a',
                      fontSize: '13.5px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f1f5f9')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <UserIcon size={16} color="#2563eb" />
                    <span>Xem profile & Điểm uy tín</span>
                  </button>

                  {(isApprovedCaregiver || account?.role === 'CAREGIVER') && (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setDropdownOpen(false);
                          navigate('/caregiver/marketplace');
                        }}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          border: 'none',
                          backgroundColor: 'transparent',
                          color: '#334155',
                          fontSize: '13.5px',
                          fontWeight: 500,
                          cursor: 'pointer',
                          textAlign: 'left',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                      >
                        <Briefcase size={16} color="#2563eb" />
                        <span>Yêu cầu phù hợp (Chợ việc)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setDropdownOpen(false);
                          navigate('/caregiver/bookings');
                        }}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          border: 'none',
                          backgroundColor: 'transparent',
                          color: '#334155',
                          fontSize: '13.5px',
                          fontWeight: 500,
                          cursor: 'pointer',
                          textAlign: 'left',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                      >
                        <Calendar size={16} color="#059669" />
                        <span>Lịch khách đặt</span>
                      </button>
                    </>
                  )}

                  {account?.role === 'CUSTOMER' && (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setDropdownOpen(false);
                          navigate('/my-care-requests');
                        }}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          border: 'none',
                          backgroundColor: 'transparent',
                          color: '#334155',
                          fontSize: '13.5px',
                          fontWeight: 500,
                          cursor: 'pointer',
                          textAlign: 'left',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                      >
                        <FileText size={16} color="#2563eb" />
                        <span>Yêu cầu chăm sóc của tôi</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setDropdownOpen(false);
                          navigate('/post-request');
                        }}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          border: 'none',
                          backgroundColor: 'transparent',
                          color: '#334155',
                          fontSize: '13.5px',
                          fontWeight: 500,
                          cursor: 'pointer',
                          textAlign: 'left',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                      >
                        <PlusCircle size={16} color="#059669" />
                        <span>Đăng yêu cầu mới</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setDropdownOpen(false);
                          navigate('/bookings');
                        }}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          border: 'none',
                          backgroundColor: 'transparent',
                          color: '#334155',
                          fontSize: '13.5px',
                          fontWeight: 500,
                          cursor: 'pointer',
                          textAlign: 'left',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                      >
                        <Bell size={16} color="#2563eb" />
                        <span>Lịch và thông báo của tôi</span>
                      </button>
                    </>
                  )}

                  <hr style={{ margin: '6px 0', borderColor: '#f1f5f9' }} />

                  <button
                    type="button"
                    onClick={() => {
                      setDropdownOpen(false);
                      logout();
                      navigate('/');
                    }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: 'none',
                      backgroundColor: 'transparent',
                      color: '#ef4444',
                      fontSize: '13.5px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#fef2f2')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                  >
                    <LogOut size={16} color="#ef4444" />
                    <span>Đăng xuất</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Mobile Menu Toggle Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="navbar-mobile-toggle"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="navbar-mobile-drawer">
          <NavLink
            to="/"
            end
            onClick={() => setMobileMenuOpen(false)}
            className={({ isActive }) => `navbar-mobile-link ${isActive ? 'active' : ''}`}
          >
            Trang chủ
          </NavLink>
          <NavLink
            to="/services"
            onClick={() => setMobileMenuOpen(false)}
            className={({ isActive }) => `navbar-mobile-link ${isActive ? 'active' : ''}`}
          >
            Dịch vụ
          </NavLink>
          <NavLink
            to="/caregivers"
            onClick={() => setMobileMenuOpen(false)}
            className={({ isActive }) => `navbar-mobile-link ${isActive ? 'active' : ''}`}
          >
            Người chăm sóc
          </NavLink>

          {isAuthenticated && account?.role === 'CUSTOMER' && (
            <>
              <NavLink
                to="/my-care-requests"
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) => `navbar-mobile-link ${isActive ? 'active' : ''}`}
              >
                Yêu cầu của tôi
              </NavLink>
              <NavLink
                to="/bookings"
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) => `navbar-mobile-link ${isActive ? 'active' : ''}`}
              >
                Lịch đã đặt
              </NavLink>
            </>
          )}

          {isAuthenticated && (account?.role === 'CAREGIVER' || isApprovedCaregiver) && (
            <>
              <NavLink
                to="/caregiver/marketplace"
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) => `navbar-mobile-link ${isActive ? 'active' : ''}`}
              >
                Yêu cầu phù hợp
              </NavLink>
              <NavLink
                to="/caregiver/bookings"
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) => `navbar-mobile-link ${isActive ? 'active' : ''}`}
              >
                Lịch nhận việc
              </NavLink>
            </>
          )}
        </div>
      )}
    </header>
  );
};

export default Navbar;
