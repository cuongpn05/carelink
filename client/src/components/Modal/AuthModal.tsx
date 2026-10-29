import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { X, Mail, Lock, User as UserIcon, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import './AuthModal.css';

interface AuthModalProps {
  isOpen: boolean;
  initialMode?: 'login' | 'register';
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  initialMode = 'login',
  onClose,
}) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<'patient' | 'caregiver'>('patient');

  const { login, register } = useAuth();

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Vui lòng nhập đầy đủ thông tin');
      return;
    }

    if (mode === 'login') {
      login(email, role);
      toast.success('Đăng nhập thành công! Chào mừng bạn quay trở lại.');
    } else {
      register(name || 'Người dùng CareLink', email, role);
      toast.success('Đăng ký tài khoản thành công!');
    }
    onClose();
  };

  const handleQuickDemo = (demoRole: 'patient' | 'caregiver') => {
    if (demoRole === 'patient') {
      login('phuong.dang@carelink.vn', 'patient');
      toast.success('Đăng nhập mẫu với vai trò Khách hàng thành công!');
    } else {
      login('minh.nguyen@carelink.vn', 'caregiver');
      toast.success('Đăng nhập mẫu với vai trò Người chăm sóc thành công!');
    }
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-container auth-modal-box animate-fade-in"
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="modal-close-btn"
          onClick={onClose}
          aria-label="Đóng cửa sổ đăng nhập (Phím ESC)"
          title="Đóng (ESC)"
        >
          <X size={20} aria-hidden="true" />
        </button>

        {/* Tab switch */}
        <div className="auth-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'login'}
            className={`auth-tab ${mode === 'login' ? 'active' : ''}`}
            onClick={() => setMode('login')}
          >
            Đăng nhập
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'register'}
            className={`auth-tab ${mode === 'register' ? 'active' : ''}`}
            onClick={() => setMode('register')}
          >
            Đăng ký
          </button>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-form-header">
            <h3 id="auth-modal-title" className="auth-title">
              {mode === 'login' ? 'Chào mừng bạn quay lại!' : 'Tạo tài khoản mới'}
            </h3>
            <p className="auth-subtitle">
              {mode === 'login'
                ? 'Đăng nhập để theo dõi lịch hẹn và dịch vụ chăm sóc'
                : 'Đăng ký nhanh chóng để kết nối cùng người chăm sóc phù hợp'}
            </p>
          </div>

          {/* Role Choice */}
          <div className="role-selector">
            <label className="input-label">Bạn là:</label>
            <div className="role-options">
              <button
                type="button"
                className={`role-btn ${role === 'patient' ? 'selected' : ''}`}
                onClick={() => setRole('patient')}
              >
                {role === 'patient' && <Check size={14} />}
                <span>Khách hàng / Gia đình</span>
              </button>
              <button
                type="button"
                className={`role-btn ${role === 'caregiver' ? 'selected' : ''}`}
                onClick={() => setRole('caregiver')}
              >
                {role === 'caregiver' && <Check size={14} />}
                <span>Người chăm sóc</span>
              </button>
            </div>
          </div>

          {mode === 'register' && (
            <div className="form-group">
              <label className="input-label">Họ và tên</label>
              <div className="input-with-icon">
                <UserIcon size={18} className="input-icon" />
                <input
                  type="text"
                  placeholder="Ví dụ: Nguyễn Văn An"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="auth-input"
                  required
                />
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="input-label">Địa chỉ Email</label>
            <div className="input-with-icon">
              <Mail size={18} className="input-icon" />
              <input
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="auth-input"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="input-label">Mật khẩu</label>
            <div className="input-with-icon">
              <Lock size={18} className="input-icon" />
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="auth-input"
                required
              />
            </div>
          </div>

          <button type="submit" className="btn-auth-submit">
            {mode === 'login' ? 'Đăng nhập ngay' : 'Đăng ký tài khoản'}
          </button>

          {/* Quick Demo Fill Buttons */}
          <div className="demo-fill-box">
            <p className="demo-fill-title">Hoặc trải nghiệm nhanh với:</p>
            <div className="demo-fill-actions">
              <button
                type="button"
                className="btn-demo-quick"
                onClick={() => handleQuickDemo('patient')}
              >
                Khách hàng mẫu
              </button>
              <button
                type="button"
                className="btn-demo-quick"
                onClick={() => handleQuickDemo('caregiver')}
              >
                Người chăm sóc mẫu
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

