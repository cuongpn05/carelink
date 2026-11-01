import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import carelinkLogo from '../assets/images/carelink-logo.png';
import toast from 'react-hot-toast';
import { getBookingNotifications } from '../services/bookingService';
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
} from 'lucide-react';

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
      const notifications = await getBookingNotifications();
      const currentIds = new Set(notifications.map((notification) => notification.bookingId));

      if (knownNotificationIds.current) {
        notifications
          .filter((notification) => !knownNotificationIds.current.has(notification.bookingId))
          .forEach((notification) => toast.success(notification.message));
      }

      knownNotificationIds.current = currentIds;
      setUnreadNotifications(notifications.filter((notification) => !notification.isRead).length);
    } catch (error) {
      console.error('Không thể cập nhật thông báo lịch đặt:', error);
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

  // Xử lý nút "Trở thành đối tác"
  const handleBecomeCaregiverClick = () => {
    if (!isAuthenticated) {
      // Chưa đăng nhập -> Chuyển sang /auth và giữ param redirect
      navigate('/auth?redirect=/become-caregiver');
    } else if (isApprovedCaregiver || account?.role === 'CAREGIVER') {
      navigate('/caregiver/bookings');
    } else {
      // Đã đăng nhập -> Chuyển thẳng sang trang đăng ký đối tác
      navigate('/become-caregiver');
    }
  };

  // Render Thanh Uy Tín (Reputation Bar)
  const renderReputationBar = () => {
    if (!isAuthenticated || !account) return null;

    const score = account.reputationScore ?? 100;

    let badgeClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    let icon = <Shield size={14} className="text-emerald-600" />;
    let text = `${score}/100 Uy tín`;

    if (score < 50) {
      badgeClass = 'bg-rose-50 text-rose-700 border-rose-300 animate-pulse';
      icon = <ShieldX size={14} className="text-rose-600" />;
      text = `${score}/100 Tạm khóa đặt lịch`;
    } else if (score < 70) {
      badgeClass = 'bg-amber-50 text-amber-700 border-amber-300';
      icon = <ShieldAlert size={14} className="text-amber-600" />;
      text = `${score}/100 Cảnh báo`;
    }

    return (
      <div
        className={`hidden md:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${badgeClass}`}
        title={`Điểm uy tín tài khoản: ${score}/100. Bấm để xem chi tiết hồ sơ & lịch sử uy tín.`}
        onClick={() => navigate('/profile')}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 10px',
          borderRadius: '9999px',
          fontSize: '12px',
          fontWeight: 600,
          border: '1px solid',
          cursor: 'pointer',
        }}
      >
        {icon}
        <span>{text}</span>
      </div>
    );
  };

  return (
    <header
      style={{
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}
    >
      <div
        style={{
          maxWidth: '1440px',
          margin: '0 auto',
          padding: '0 24px',
          height: '74px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Brand Logo */}
        <Link
          to="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            textDecoration: 'none',
          }}
        >
          {carelinkLogo ? (
            <img
              src={carelinkLogo}
              alt="CareLink Logo"
              style={{ height: '42px', width: 'auto', objectFit: 'contain' }}
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
          <span
            style={{
              fontSize: '22px',
              fontWeight: 800,
              color: '#0f172a',
              letterSpacing: '-0.5px',
            }}
          >
            Care<span style={{ color: '#2563eb' }}>Link</span>
          </span>
        </Link>

        {/* Desktop Navigation Links */}
        <nav
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '28px',
          }}
          className="hidden lg:flex"
        >
          <NavLink
            to="/"
            end
            style={({ isActive }) => ({
              fontSize: '15px',
              fontWeight: isActive ? 700 : 500,
              color: isActive ? '#2563eb' : '#475569',
              textDecoration: 'none',
              transition: 'color 0.2s',
            })}
          >
            Trang chủ
          </NavLink>
          <NavLink
            to="/services"
            style={({ isActive }) => ({
              fontSize: '15px',
              fontWeight: isActive ? 700 : 500,
              color: isActive ? '#2563eb' : '#475569',
              textDecoration: 'none',
            })}
          >
            Dịch vụ
          </NavLink>
          <NavLink
            to="/caregivers"
            style={({ isActive }) => ({
              fontSize: '15px',
              fontWeight: isActive ? 700 : 500,
              color: isActive ? '#2563eb' : '#475569',
              textDecoration: 'none',
            })}
          >
            Người chăm sóc
          </NavLink>
        </nav>

        {/* Right Section Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
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

          {/* Nút Trở thành đối tác (Luôn hiển thị nổi bật) */}
          <button
            type="button"
            onClick={handleBecomeCaregiverClick}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '9px 18px',
              borderRadius: '9999px',
              backgroundColor: '#eff6ff',
              color: '#1d4ed8',
              border: '1.5px solid #bfdbfe',
              fontSize: '13.5px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#dbeafe';
              e.currentTarget.style.borderColor = '#93c5fd';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#eff6ff';
              e.currentTarget.style.borderColor = '#bfdbfe';
            }}
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
              <Link
                to="/auth?mode=login"
                style={{
                  padding: '9px 18px',
                  borderRadius: '9999px',
                  color: '#334155',
                  fontSize: '14px',
                  fontWeight: 600,
                  textDecoration: 'none',
                }}
              >
                Đăng nhập
              </Link>
              <Link
                to="/auth?mode=register"
                style={{
                  padding: '9px 20px',
                  borderRadius: '9999px',
                  backgroundColor: '#2563eb',
                  color: '#ffffff',
                  fontSize: '14px',
                  fontWeight: 600,
                  textDecoration: 'none',
                  boxShadow: '0 2px 8px rgba(37,99,235,0.25)',
                }}
              >
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
                    <UserIcon size={16} className="text-blue-600" />
                    <span>Xem profile & Điểm uy tín</span>
                  </button>

                  {isApprovedCaregiver && (
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
                      <Calendar size={16} className="text-emerald-600" />
                      <span>Lịch khách đặt</span>
                    </button>
                  )}

                  {account?.role === 'CUSTOMER' && (
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
                      <Bell size={16} className="text-blue-600" />
                      <span>Lịch và thông báo của tôi</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setDropdownOpen(false);
                      logout(navigate);
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
                    <LogOut size={16} />
                    <span>Đăng xuất</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Mobile hamburger button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{
              padding: '8px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: '#f1f5f9',
              color: '#334155',
              cursor: 'pointer',
            }}
            className="lg:hidden"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
