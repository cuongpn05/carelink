import React from 'react';
import { CalendarDays, CircleUserRound, Heart, LogOut, Search } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import carelinkLogo from '../assets/images/carelink-logo.png';
import './CaregiverHeader.css';

export const CaregiverHeader: React.FC = () => {
  const { account, caregiverProfile, user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="caregiver-header">
      <div className="caregiver-header-inner">
        <NavLink
          to="/caregiver/marketplace"
          className="caregiver-brand"
          aria-label="CareLink - yêu cầu chăm sóc"
        >
          <img className="caregiver-brand-logo" src={carelinkLogo} alt="CareLink" />
          <span className="caregiver-brand-name">
            Care<span>Link</span>
          </span>
        </NavLink>

        <nav className="caregiver-nav" aria-label="Điều hướng người chăm sóc">
          <NavLink
            to="/caregiver/marketplace"
            className={({ isActive }) => `caregiver-nav-link${isActive ? ' active' : ''}`}
          >
            <Search size={17} />
            <span>Yêu cầu chăm sóc</span>
          </NavLink>
          <NavLink
            to="/caregiver/bookings"
            className={({ isActive }) => `caregiver-nav-link${isActive ? ' active' : ''}`}
          >
            <CalendarDays size={17} />
            <span>Lịch nhận việc</span>
          </NavLink>
        </nav>

        <div className="caregiver-account">
          <span className="caregiver-account-name">
            {user?.fullName || caregiverProfile?.fullName || account?.email}
          </span>
          <NavLink
            to="/profile"
            className={({ isActive }) =>
              `caregiver-profile-link${isActive ? ' active' : ''}`
            }
          >
            {user?.avatarUrl || caregiverProfile?.avatarUrl ? (
              <img
                src={user?.avatarUrl || caregiverProfile?.avatarUrl}
                alt=""
                className="caregiver-profile-avatar"
              />
            ) : (
              <CircleUserRound size={17} />
            )}
            <span>Hồ sơ</span>
          </NavLink>
          <button
            type="button"
            className="caregiver-logout"
            onClick={() => void logout(navigate)}
          >
            <LogOut size={16} />
            <span>Đăng xuất</span>
          </button>
        </div>
      </div>
    </header>
  );
};
