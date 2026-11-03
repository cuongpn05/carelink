import React, { useEffect, useState } from 'react';
import { Home, Hospital as HospitalIcon, MapPin, Navigation, BookOpen, AlertCircle, CheckCircle2 } from 'lucide-react';
import {
  getUserAddresses,
  getAdministrativeProvinces,
  getAdministrativeWards,
  UserAddress,
  ProvinceItem,
  WardItem,
} from '../services/userService';
import { getHospitals, HospitalItem } from '../services/hospitalService';
import './LocationPicker.css';

export interface LocationPickerValue {
  placeType: 'home' | 'hospital';
  recipientName: string;
  recipientPhone: string;
  provinceCode: string;
  provinceName: string;
  wardCode: string;
  wardName: string;
  detail: string;
  fullAddress: string;
  hospitalId?: string | null;
  hospitalName?: string;
  department?: string;
  roomNumber?: string;
  bedNumber?: string;
  coordinates?: [number, number]; // [lng, lat]
}

interface LocationPickerProps {
  value: LocationPickerValue;
  onChange: (val: LocationPickerValue) => void;
  caregiverCoords?: [number, number];
  caregiverServiceRadius?: number;
}

// Client-side Haversine helper for instant UI feedback
const calculateDistanceKm = (coord1: [number, number], coord2: [number, number]): number => {
  const [lon1, lat1] = coord1;
  const [lon2, lat2] = coord2;
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
};

export const LocationPicker: React.FC<LocationPickerProps> = ({
  value,
  onChange,
  caregiverCoords,
  caregiverServiceRadius = 15,
}) => {
  const [savedAddresses, setSavedAddresses] = useState<UserAddress[]>([]);
  const [provinces, setProvinces] = useState<ProvinceItem[]>([]);
  const [wards, setWards] = useState<WardItem[]>([]);
  const [hospitals, setHospitals] = useState<HospitalItem[]>([]);
  const [loadingHospitals, setLoadingHospitals] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);

  // Load saved addresses and provinces
  useEffect(() => {
    getUserAddresses()
      .then((addrs) => {
        setSavedAddresses(addrs || []);
        // If empty value and user has default address, auto-populate
        if (!value.detail && addrs && addrs.length > 0) {
          const defaultAddr = addrs.find((a) => a.isDefault) || addrs[0];
          applySavedAddress(defaultAddr);
        }
      })
      .catch(() => {});

    getAdministrativeProvinces()
      .then((provs) => setProvinces(provs || []))
      .catch(() => {});

    setLoadingHospitals(true);
    getHospitals()
      .then((hosps) => setHospitals(hosps || []))
      .catch(() => {})
      .finally(() => setLoadingHospitals(false));
  }, []);

  // When province changes in home mode, reload wards
  useEffect(() => {
    if (value.placeType === 'home' && value.provinceCode) {
      getAdministrativeWards(value.provinceCode)
        .then((w) => setWards(w || []))
        .catch(() => setWards([]));
    }
  }, [value.provinceCode, value.placeType]);

  const applySavedAddress = (addr: UserAddress) => {
    setSelectedAddressId(addr._id);
    onChange({
      ...value,
      placeType: 'home',
      recipientName: addr.recipientName || value.recipientName,
      recipientPhone: addr.phone || value.recipientPhone,
      provinceCode: addr.provinceCode,
      provinceName: addr.provinceName,
      wardCode: addr.wardCode,
      wardName: addr.wardName,
      detail: addr.detail,
      fullAddress: addr.fullAddress,
      coordinates: addr.location?.coordinates || [105.7825, 10.0342],
    });
  };

  const handlePlaceTypeChange = (type: 'home' | 'hospital') => {
    if (type === 'hospital') {
      const firstHosp = hospitals[0];
      onChange({
        ...value,
        placeType: 'hospital',
        hospitalId: firstHosp?._id || null,
        hospitalName: firstHosp?.name || '',
        provinceCode: firstHosp?.provinceCode || 'CT',
        provinceName: firstHosp?.provinceName || 'Cần Thơ',
        wardCode: firstHosp?.wardCode || '',
        wardName: firstHosp?.wardName || '',
        detail: firstHosp?.address || '',
        fullAddress: firstHosp?.address || '',
        department: firstHosp?.departments?.[0] || 'Khoa Lão khoa',
        roomNumber: 'Phòng 201',
        bedNumber: 'Giường 01',
        coordinates: firstHosp?.location?.coordinates || [105.7828, 10.0321],
      });
    } else {
      onChange({
        ...value,
        placeType: 'home',
        hospitalId: null,
        hospitalName: '',
        department: '',
        roomNumber: '',
        bedNumber: '',
      });
    }
  };

  const handleHospitalSelect = (hospId: string) => {
    const hosp = hospitals.find((h) => h._id === hospId);
    if (!hosp) return;
    onChange({
      ...value,
      hospitalId: hosp._id,
      hospitalName: hosp.name,
      provinceCode: hosp.provinceCode,
      provinceName: hosp.provinceName,
      wardCode: hosp.wardCode || '',
      wardName: hosp.wardName || '',
      detail: hosp.address,
      fullAddress: hosp.address,
      department: hosp.departments?.[0] || 'Khoa Lão khoa',
      coordinates: hosp.location?.coordinates || [105.7828, 10.0321],
    });
  };

  const handleUseCurrentLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords: [number, number] = [pos.coords.longitude, pos.coords.latitude];
          onChange({
            ...value,
            coordinates: coords,
          });
        },
        () => {
          // Default to Can Tho center if geolocation blocked
          onChange({
            ...value,
            coordinates: [105.7825, 10.0342],
          });
        }
      );
    }
  };

  // Distance computation
  const currentCoords = value.coordinates || [105.7825, 10.0342];
  const distanceKm = caregiverCoords ? calculateDistanceKm(caregiverCoords, currentCoords) : null;
  const isOutOfRange = distanceKm !== null && distanceKm > caregiverServiceRadius;
  const surchargeFee =
    distanceKm !== null
      ? distanceKm <= 5
        ? 0
        : Math.ceil(distanceKm - 5) * 10000
      : 0;

  return (
    <div className="location-picker-container">
      {/* Visual Tabs */}
      <div className="location-tabs">
        <button
          type="button"
          className={`location-tab-btn ${value.placeType === 'home' ? 'active' : ''}`}
          onClick={() => handlePlaceTypeChange('home')}
        >
          <Home size={18} />
          <span>Chăm sóc tại Nhà riêng</span>
        </button>
        <button
          type="button"
          className={`location-tab-btn ${value.placeType === 'hospital' ? 'active' : ''}`}
          onClick={() => handlePlaceTypeChange('hospital')}
        >
          <HospitalIcon size={18} />
          <span>Chăm sóc tại Bệnh viện</span>
        </button>
      </div>

      {/* Recipient Details */}
      <div className="location-fields-grid">
        <div className="location-input-group">
          <label>Họ tên người nhận / liên hệ *</label>
          <input
            type="text"
            placeholder="VD: Lê Văn B (Con trai)"
            value={value.recipientName || ''}
            onChange={(e) => onChange({ ...value, recipientName: e.target.value })}
            required
          />
        </div>
        <div className="location-input-group">
          <label>Số điện thoại liên hệ *</label>
          <input
            type="tel"
            placeholder="VD: 0912345678"
            value={value.recipientPhone || ''}
            onChange={(e) => onChange({ ...value, recipientPhone: e.target.value })}
            required
          />
        </div>
      </div>

      {/* Tab 1: Home Mode */}
      {value.placeType === 'home' && (
        <>
          {/* Quick selection from address book */}
          {savedAddresses.length > 0 && (
            <div className="saved-addresses-section">
              <div className="saved-addresses-header">
                <span className="saved-addresses-title">
                  <BookOpen size={14} style={{ display: 'inline', marginRight: 4 }} />
                  Chọn nhanh từ Sổ địa chỉ:
                </span>
              </div>
              <div className="saved-addresses-grid">
                {savedAddresses.map((addr) => (
                  <div
                    key={addr._id}
                    className={`saved-address-card ${selectedAddressId === addr._id ? 'selected' : ''}`}
                    onClick={() => applySavedAddress(addr)}
                  >
                    <div className="saved-address-top">
                      <span className="saved-address-label">{addr.label || 'Địa chỉ'}</span>
                      {addr.isDefault && <span className="saved-address-default">Mặc định</span>}
                    </div>
                    <div className="saved-address-text" title={addr.fullAddress}>
                      {addr.fullAddress}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Manual Input */}
          <div className="location-fields-grid">
            <div className="location-input-group">
              <label>Tỉnh / Thành phố *</label>
              <select
                value={value.provinceCode || ''}
                onChange={(e) => {
                  const pCode = e.target.value;
                  const prov = provinces.find((p) => p.code === pCode);
                  onChange({
                    ...value,
                    provinceCode: pCode,
                    provinceName: prov?.name || '',
                    wardCode: '',
                    wardName: '',
                    fullAddress: `${value.detail ? value.detail + ', ' : ''}${prov?.name || ''}`,
                  });
                }}
              >
                <option value="">-- Chọn Tỉnh / Thành phố --</option>
                {provinces.map((p) => (
                  <option key={p.code} value={p.code}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="location-input-group">
              <label>Phường / Xã *</label>
              <select
                value={value.wardCode || ''}
                onChange={(e) => {
                  const wCode = e.target.value;
                  const ward = wards.find((w) => w.code === wCode);
                  onChange({
                    ...value,
                    wardCode: wCode,
                    wardName: ward?.name || '',
                    fullAddress: `${value.detail ? value.detail + ', ' : ''}${ward?.name ? ward.name + ', ' : ''}${value.provinceName}`,
                  });
                }}
                disabled={!value.provinceCode}
              >
                <option value="">-- Chọn Phường / Xã --</option>
                {wards.map((w) => (
                  <option key={w.code} value={w.code}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="location-input-group location-field-full">
              <label>Số nhà, tên đường, ngõ hẻm *</label>
              <input
                type="text"
                placeholder="VD: Số 123 đường 30/4"
                value={value.detail || ''}
                onChange={(e) => {
                  const detail = e.target.value;
                  const fullAddress = `${detail ? detail + ', ' : ''}${value.wardName ? value.wardName + ', ' : ''}${value.provinceName}`;
                  onChange({
                    ...value,
                    detail,
                    fullAddress,
                  });
                }}
              />
            </div>
          </div>
        </>
      )}

      {/* Tab 2: Hospital Mode */}
      {value.placeType === 'hospital' && (
        <>
          <div className="location-input-group">
            <label>Chọn Bệnh viện điều trị *</label>
            <select
              value={value.hospitalId || ''}
              onChange={(e) => handleHospitalSelect(e.target.value)}
              disabled={loadingHospitals}
            >
              {hospitals.map((h) => (
                <option key={h._id} value={h._id}>
                  {h.name} - ({h.address})
                </option>
              ))}
            </select>
          </div>

          <div className="hospital-notice-box">
            <CheckCircle2 size={16} style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <strong>Địa chỉ cố định:</strong> {value.fullAddress || 'Đang cập nhật'}
              <br />
              <small>Hệ thống tự động sử dụng tọa độ GPS chuẩn của bệnh viện để tính cự ly di chuyển cho người chăm sóc.</small>
            </div>
          </div>

          {/* 3 Hospital specific inputs */}
          <div className="location-fields-grid">
            <div className="location-input-group">
              <label>Khoa điều trị *</label>
              <input
                type="text"
                placeholder="VD: Khoa Hồi sức tích cực, Nội tim mạch..."
                value={value.department || ''}
                onChange={(e) => onChange({ ...value, department: e.target.value })}
                required
              />
            </div>

            <div className="location-input-group">
              <label>Số phòng / Tầng lầu *</label>
              <input
                type="text"
                placeholder="VD: Phòng 402 - Lầu 4"
                value={value.roomNumber || ''}
                onChange={(e) => onChange({ ...value, roomNumber: e.target.value })}
                required
              />
            </div>

            <div className="location-input-group location-field-full">
              <label>Số giường / Vị trí nằm *</label>
              <input
                type="text"
                placeholder="VD: Giường 05 - Dãy bên phải"
                value={value.bedNumber || ''}
                onChange={(e) => onChange({ ...value, bedNumber: e.target.value })}
                required
              />
            </div>
          </div>
        </>
      )}

      {/* Mini Interactive Map */}
      <div className="location-map-wrapper">
        <div className="location-map-header">
          <span style={{ fontSize: 13, fontWeight: 700, color: '#334155' }}>
            <MapPin size={14} style={{ display: 'inline', marginRight: 4, color: '#2563eb' }} />
            Vị trí trên bản đồ vệ tinh:
          </span>
          <button
            type="button"
            className="location-tab-btn"
            style={{ padding: '4px 10px', fontSize: 12 }}
            onClick={handleUseCurrentLocation}
          >
            <Navigation size={13} />
            Định vị hiện tại
          </button>
        </div>

        <div className="location-map-canvas">
          <iframe
            title="Location Map"
            className="location-map-iframe"
            src={`https://www.openstreetmap.org/export/embed.html?bbox=${currentCoords[0] - 0.01}%2C${currentCoords[1] - 0.01}%2C${currentCoords[0] + 0.01}%2C${currentCoords[1] + 0.01}&layer=mapnik&marker=${currentCoords[1]}%2C${currentCoords[0]}`}
          />
          <div className="location-map-overlay-badge">
            📍 Tọa độ GPS: [{currentCoords[0].toFixed(4)}, {currentCoords[1].toFixed(4)}]
          </div>
        </div>
      </div>

      {/* Distance & Surcharge Badge */}
      {distanceKm !== null && (
        <div className={`distance-badge-row ${isOutOfRange ? 'distance-badge-out-of-range' : ''}`}>
          <div className="distance-badge-info">
            {isOutOfRange ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
            <span>
              📍 Cách người chăm sóc: <strong>{distanceKm} km</strong>{' '}
              {isOutOfRange
                ? `(Vượt quá bán kính phục vụ ${caregiverServiceRadius} km)`
                : `(Trong bán kính phục vụ ${caregiverServiceRadius} km)`}
            </span>
          </div>
          <div className={`distance-badge-fee ${surchargeFee > 0 ? 'surcharge' : ''}`}>
            {surchargeFee === 0 ? (
              'Miễn phí di chuyển (cự ly ≤ 5 km)'
            ) : (
              `Phụ phí: +${new Intl.NumberFormat('vi-VN').format(surchargeFee)} đ`
            )}
          </div>
        </div>
      )}
    </div>
  );
};
