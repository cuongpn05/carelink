import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axiosClient from '../api/axiosClient';
import toast from 'react-hot-toast';
import {
  Mail,
  Lock,
  User,
  Phone,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

export const AuthPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { saveAuthData, isAuthenticated } = useAuth();

  // Đọc query parameters (mode: login/register, redirect URL)
  const queryParams = new URLSearchParams(location.search);
  const initialMode = queryParams.get('mode') === 'register' ? 'REGISTER' : 'LOGIN';
  const redirectUrl = queryParams.get('redirect') || '/';

  // State quản lý luồng 3 bước: 'LOGIN' | 'REGISTER' | 'VERIFY_OTP'
  const [step, setStep] = useState(initialMode);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');

  // UI / Logic states
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [suspendedWarning, setSuspendedWarning] = useState('');
  const [countdown, setCountdown] = useState(0);
  
  // Nếu đã đăng nhập thì tự động chuyển hướng về trang chủ hoặc redirect
  useEffect(() => {
    if (isAuthenticated) {
      navigate(redirectUrl, { replace: true });
    }
  }, [isAuthenticated, navigate, redirectUrl]);

  // Bộ đếm ngược 60 giây khi gửi mã OTP
  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  // 1. Xử lý ĐĂNG KÝ
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!fullName || !phone || !email || !password) {
      setErrorMessage('Vui lòng điền đầy đủ tất cả các trường.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Mật khẩu phải chứa ít nhất 6 ký tự.');
      return;
    }

    try {
      setLoading(true);
      const res = await axiosClient.post('/auth/register', {
        fullName: fullName.trim(),
        phone: phone.trim(),
        email: email.trim().toLowerCase(),
        password,
      });

      if (res.success) {
        toast.success(res.message || 'Mã OTP đã được gửi tới email!');
        // Chuyển sang bước nhập OTP và bắt đầu đếm ngược 60s
                setStep('VERIFY_OTP');
        setCountdown(60);
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Đăng ký thất bại. Vui lòng thử lại.';
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // 2. Xử lý XÁC THỰC MÃ OTP
  const handleVerifyOtpSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!otpCode || otpCode.trim().length !== 6) {
      setErrorMessage('Vui lòng nhập đúng 6 chữ số mã OTP.');
      return;
    }

    try {
      setLoading(true);
      const res = await axiosClient.post('/auth/verify-otp', {
        email: email.trim().toLowerCase(),
        otpCode: otpCode.trim(),
      });

      if (res.success && res.data) {
        toast.success('Xác thực tài khoản thành công!');
        saveAuthData(res.data);
        navigate(redirectUrl, { replace: true });
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Mã OTP không hợp lệ hoặc đã hết hạn.';
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // 3. Xử lý GỬI LẠI MÃ OTP
  const handleResendOtp = async () => {
    if (countdown > 0) return;
    setErrorMessage('');

    try {
      setLoading(true);
      const res = await axiosClient.post('/auth/resend-otp', {
        email: email.trim().toLowerCase(),
      });

      if (res.success) {
        toast.success('Mã OTP mới đã được gửi tới email của bạn!');
                setCountdown(60);
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Không thể gửi lại mã OTP. Vui lòng thử lại.';
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // 4. Xử lý ĐĂNG NHẬP (Bắt lỗi phân nhánh nghiêm ngặt)
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuspendedWarning('');

    if (!email || !password) {
      setErrorMessage('Vui lòng nhập email và mật khẩu.');
      return;
    }

    try {
      setLoading(true);
      const res = await axiosClient.post('/auth/login', {
        email: email.trim().toLowerCase(),
        password,
      });

      if (res.success && res.data) {
        // Lưu thông tin đăng nhập
        saveAuthData(res.data);

        // Phân nhánh 3: Nếu tài khoản bị SUSPENDED (uy tín < 50)
        if (res.isSuspended || res.data.account?.status === 'SUSPENDED') {
          const warnText = `Điểm uy tín của bạn hiện tại là ${res.data.account?.reputationScore}/100 (dưới 50 do hủy lịch nhiều lần). Bạn chỉ có thể xem lịch sử, tính năng Đặt/Nhận lịch mới đang bị tạm khóa.`;
          setSuspendedWarning(warnText);
          toast.error(warnText, { duration: 6000 });
          // Vẫn cho phép điều hướng sau 2 giây để người dùng đọc cảnh báo
          setTimeout(() => {
            navigate(redirectUrl, { replace: true });
          }, 2000);
          return;
        }

        toast.success('Đăng nhập thành công!');
        navigate(redirectUrl, { replace: true });
      }
    } catch (err) {
      const resData = err.response?.data;
      const status = err.response?.status;

      // Phân nhánh 1: Chưa xác thực OTP (403 needVerification)
      if (status === 403 && resData?.needVerification) {
        toast.error('Tài khoản chưa được kích hoạt. Đang chuyển tới màn hình xác thực OTP...');
        // Tự động gửi lại OTP và chuyển sang bước VERIFY_OTP
        try {
          await axiosClient.post('/auth/resend-otp', { email: email.trim().toLowerCase() });
          setCountdown(60);
        } catch {
          // Bỏ qua lỗi nếu vừa gửi gần đây
        }
        setStep('VERIFY_OTP');
        return;
      }

      // Phân nhánh 2: Tài khoản bị BANNED vĩnh viễn
      if (status === 403 && resData?.isBanned) {
        const banMsg = 'Tài khoản của bạn đã bị khóa vĩnh viễn do vi phạm điều khoản của CareLink.';
        setErrorMessage(banMsg);
        toast.error(banMsg, { duration: 6000 });
        return;
      }

      // Các lỗi thông thường khác (sai pass, không tìm thấy...)
      const msg = resData?.message || 'Đăng nhập không thành công. Vui lòng kiểm tra lại thông tin.';
      setErrorMessage(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#f8fafc',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 16px',
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '460px',
          backgroundColor: '#ffffff',
          borderRadius: '24px',
          boxShadow: '0 20px 40px -15px rgba(0,0,0,0.07), 0 1px 3px rgba(0,0,0,0.05)',
          border: '1px solid #e2e8f0',
          padding: '40px 36px',
        }}
      >
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <Link
            to="/"
            style={{
              fontSize: '28px',
              fontWeight: 800,
              color: '#0f172a',
              textDecoration: 'none',
              letterSpacing: '-0.5px',
            }}
          >
            Care<span style={{ color: '#2563eb' }}>Link</span>
          </Link>
          <p style={{ color: '#64748b', fontSize: '14.5px', marginTop: '6px' }}>
            {step === 'LOGIN' && 'Đăng nhập để kết nối dịch vụ chăm sóc'}
            {step === 'REGISTER' && 'Tạo tài khoản thành viên CareLink mới'}
            {step === 'VERIFY_OTP' && 'Xác thực địa chỉ email của bạn'}
          </p>
        </div>

        {/* Tab chuyển đổi Đăng nhập / Đăng ký (chỉ hiện khi chưa ở bước OTP) */}
        {step !== 'VERIFY_OTP' && (
          <div
            style={{
              display: 'flex',
              backgroundColor: '#f1f5f9',
              borderRadius: '12px',
              padding: '4px',
              marginBottom: '26px',
            }}
          >
            <button
              type="button"
              onClick={() => {
                setStep('LOGIN');
                setErrorMessage('');
              }}
              style={{
                flex: 1,
                padding: '10px 0',
                border: 'none',
                borderRadius: '9px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                backgroundColor: step === 'LOGIN' ? '#ffffff' : 'transparent',
                color: step === 'LOGIN' ? '#1d4ed8' : '#64748b',
                boxShadow: step === 'LOGIN' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.2s',
              }}
            >
              Đăng nhập
            </button>
            <button
              type="button"
              onClick={() => {
                setStep('REGISTER');
                setErrorMessage('');
              }}
              style={{
                flex: 1,
                padding: '10px 0',
                border: 'none',
                borderRadius: '9px',
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                backgroundColor: step === 'REGISTER' ? '#ffffff' : 'transparent',
                color: step === 'REGISTER' ? '#1d4ed8' : '#64748b',
                boxShadow: step === 'REGISTER' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.2s',
              }}
            >
              Đăng ký
            </button>
          </div>
        )}

        {/* Cảnh báo lỗi nếu có */}
        {errorMessage && (
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              padding: '12px 14px',
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '10px',
              color: '#dc2626',
              fontSize: '13.5px',
              marginBottom: '20px',
              lineHeight: '1.45',
            }}
          >
            <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Cảnh báo SUSPENDED */}
        {suspendedWarning && (
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              padding: '12px 14px',
              backgroundColor: '#fffbeb',
              border: '1px solid #fde68a',
              borderRadius: '10px',
              color: '#b45309',
              fontSize: '13.5px',
              marginBottom: '20px',
              lineHeight: '1.45',
            }}
          >
            <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>{suspendedWarning}</span>
          </div>
        )}

        {/* ======================================================== */}
        {/* STEP 1: ĐĂNG KÝ (REGISTER) */}
        {/* ======================================================== */}
        {step === 'REGISTER' && (
          <form onSubmit={handleRegisterSubmit}>
            
            <div style={{ marginBottom: '16px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '13.5px',
                  fontWeight: 600,
                  color: '#334155',
                  marginBottom: '6px',
                }}
              >
                Họ và tên
              </label>
              <div style={{ position: 'relative' }}>
                <User
                  size={18}
                  style={{
                    position: 'absolute',
                    left: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#94a3b8',
                  }}
                />
                <input
                  type="text"
                  placeholder="Ví dụ: Nguyễn Văn An"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '12px 14px 12px 42px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '13.5px',
                  fontWeight: 600,
                  color: '#334155',
                  marginBottom: '6px',
                }}
              >
                Số điện thoại
              </label>
              <div style={{ position: 'relative' }}>
                <Phone
                  size={18}
                  style={{
                    position: 'absolute',
                    left: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#94a3b8',
                  }}
                />
                <input
                  type="tel"
                  placeholder="0901234567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '12px 14px 12px 42px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '13.5px',
                  fontWeight: 600,
                  color: '#334155',
                  marginBottom: '6px',
                }}
              >
                Địa chỉ Email
              </label>
              <div style={{ position: 'relative' }}>
                <Mail
                  size={18}
                  style={{
                    position: 'absolute',
                    left: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#94a3b8',
                  }}
                />
                <input
                  type="email"
                  placeholder="email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '12px 14px 12px 42px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '13.5px',
                  fontWeight: 600,
                  color: '#334155',
                  marginBottom: '6px',
                }}
              >
                Mật khẩu
              </label>
              <div style={{ position: 'relative' }}>
                <Lock
                  size={18}
                  style={{
                    position: 'absolute',
                    left: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#94a3b8',
                  }}
                />
                <input
                  type="password"
                  placeholder="Ít nhất 6 ký tự"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '12px 14px 12px 42px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '13px',
                backgroundColor: loading ? '#93c5fd' : '#2563eb',
                color: '#ffffff',
                border: 'none',
                borderRadius: '10px',
                fontSize: '15px',
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'background-color 0.2s',
              }}
            >
              <span>{loading ? 'Đang xử lý...' : 'Tiếp tục nhận mã OTP'}</span>
              {!loading && <ArrowRight size={18} />}
            </button>
          </form>
        )}

        {/* ======================================================== */}
        {/* STEP 2: XÁC THỰC MÃ OTP (VERIFY_OTP) */}
        {/* ======================================================== */}
        {step === 'VERIFY_OTP' && (
          <form onSubmit={handleVerifyOtpSubmit}>
            <div
              style={{
                backgroundColor: '#eff6ff',
                borderRadius: '12px',
                padding: '14px',
                textAlign: 'center',
                marginBottom: '22px',
                border: '1px solid #bfdbfe',
              }}
            >
              <ShieldCheck size={28} className="text-blue-600" style={{ margin: '0 auto 6px' }} />
              <div style={{ fontSize: '13.5px', color: '#1e3a8a' }}>
                Mã xác thực gồm 6 số đã được gửi tới:
              </div>
              <div style={{ fontWeight: 700, color: '#1d4ed8', fontSize: '14.5px', marginTop: '2px' }}>
                {email}
              </div>
              <button
                type="button"
                onClick={() => setStep('REGISTER')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#2563eb',
                  fontSize: '12px',
                  textDecoration: 'underline',
                  cursor: 'pointer',
                  marginTop: '6px',
                }}
              >
                Đổi địa chỉ email khác
              </button>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '13.5px',
                  fontWeight: 600,
                  color: '#334155',
                  marginBottom: '8px',
                  textAlign: 'center',
                }}
              >
                Nhập mã OTP (6 chữ số)
              </label>
              <input
                type="text"
                maxLength={6}
                placeholder="------"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                autoFocus
                required
                style={{
                  width: '100%',
                  textAlign: 'center',
                  fontSize: '26px',
                  fontWeight: 'bold',
                  letterSpacing: '8px',
                  padding: '12px',
                  borderRadius: '12px',
                  border: '2px solid #3b82f6',
                  color: '#1d4ed8',
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading || otpCode.length !== 6}
              style={{
                width: '100%',
                padding: '13px',
                backgroundColor: loading || otpCode.length !== 6 ? '#93c5fd' : '#2563eb',
                color: '#ffffff',
                border: 'none',
                borderRadius: '10px',
                fontSize: '15px',
                fontWeight: 600,
                cursor: loading || otpCode.length !== 6 ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                marginBottom: '16px',
              }}
            >
              <CheckCircle2 size={18} />
              <span>{loading ? 'Đang xác thực...' : 'Xác nhận OTP & Đăng nhập'}</span>
            </button>

            {/* Nút gửi lại OTP kèm bộ đếm ngược */}
            <div style={{ textAlign: 'center' }}>
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={countdown > 0 || loading}
                style={{
                  background: 'none',
                  border: 'none',
                  color: countdown > 0 ? '#94a3b8' : '#2563eb',
                  fontSize: '13.5px',
                  fontWeight: 600,
                  cursor: countdown > 0 ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                <span>
                  {countdown > 0
                    ? `Gửi lại mã sau (${countdown}s)`
                    : 'Gửi lại mã OTP'}
                </span>
              </button>
            </div>
          </form>
        )}

        {/* ======================================================== */}
        {/* STEP 3: ĐĂNG NHẬP (LOGIN) */}
        {/* ======================================================== */}
        {step === 'LOGIN' && (
          <form onSubmit={handleLoginSubmit}>
            <div style={{ marginBottom: '16px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '13.5px',
                  fontWeight: 600,
                  color: '#334155',
                  marginBottom: '6px',
                }}
              >
                Địa chỉ Email
              </label>
              <div style={{ position: 'relative' }}>
                <Mail
                  size={18}
                  style={{
                    position: 'absolute',
                    left: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#94a3b8',
                  }}
                />
                <input
                  type="email"
                  placeholder="email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '12px 14px 12px 42px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '22px' }}>
              <label
                style={{
                  display: 'block',
                  fontSize: '13.5px',
                  fontWeight: 600,
                  color: '#334155',
                  marginBottom: '6px',
                }}
              >
                Mật khẩu
              </label>
              <div style={{ position: 'relative' }}>
                <Lock
                  size={18}
                  style={{
                    position: 'absolute',
                    left: '14px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#94a3b8',
                  }}
                />
                <input
                  type="password"
                  placeholder="Nhập mật khẩu"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{
                    width: '100%',
                    padding: '12px 14px 12px 42px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    fontSize: '14px',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '13px',
                backgroundColor: loading ? '#93c5fd' : '#2563eb',
                color: '#ffffff',
                border: 'none',
                borderRadius: '10px',
                fontSize: '15px',
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'background-color 0.2s',
              }}
            >
              <span>{loading ? 'Đang đăng nhập...' : 'Đăng nhập'}</span>
              {!loading && <ArrowRight size={18} />}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default AuthPage;

