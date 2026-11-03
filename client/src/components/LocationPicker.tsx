import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  MapPin,
  Navigation,
  BookOpen,
  AlertCircle,
  CheckCircle2,
  Search,
  ChevronDown,
  Check,
  X,
} from 'lucide-react';
import {
  getUserAddresses,
  getAdministrativeProvinces,
  getAdministrativeWards,
  UserAddress,
  ProvinceItem,
  WardItem,
} from '../services/userService';
import './LocationPicker.css';

export interface LocationPickerValue {
  placeType: 'home';
  recipientName: string;
  recipientPhone: string;
  provinceCode: string;
  provinceName: string;
  wardCode: string;
  wardName: string;
  detail: string;
  fullAddress: string;
  coordinates?: [number, number]; // [lng, lat]
  // legacy optional fields for backward compatibility
  hospitalId?: string | null;
  hospitalName?: string;
  department?: string;
  roomNumber?: string;
  bedNumber?: string;
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

const normalizeSearch = (val: string) =>
  val
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();

// Custom Searchable Select Component (No OS Native Overflow, Full Search Support)
interface SearchableSelectProps {
  label: string;
  placeholder: string;
  searchPlaceholder?: string;
  options: Array<{ code: string; name: string }>;
  valueCode: string;
  valueName?: string;
  onChange: (code: string, name: string) => void;
  disabled?: boolean;
  loading?: boolean;
  required?: boolean;
}

const SearchableSelect: React.FC<SearchableSelectProps> = ({
  label,
  placeholder,
  searchPlaceholder = 'Tìm kiếm...',
  options,
  valueCode,
  valueName,
  onChange,
  disabled = false,
  loading = false,
  required = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const menuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = useMemo(() => {
    const q = normalizeSearch(search);
    if (!q) return options;
    return options.filter((opt) => normalizeSearch(opt.name).includes(q));
  }, [options, search]);

  const selectedOption = useMemo(() => {
    return options.find((opt) => opt.code === valueCode);
  }, [options, valueCode]);

  const displayName = valueName || selectedOption?.name || '';

  const handleToggle = () => {
    if (disabled || loading) return;
    const next = !isOpen;
    setIsOpen(next);
    if (next) {
      setTimeout(() => inputRef.current?.focus(), 60);
    } else {
      setSearch('');
    }
  };

  const handleSelect = (code: string, name: string) => {
    onChange(code, name);
    setSearch('');
    setIsOpen(false);
  };

  return (
    <div className="searchable-select-wrap" ref={menuRef}>
      <label className="searchable-select-label">
        {label} {required && <span className="select-required-star">*</span>}
      </label>

      <button
        type="button"
        className={`searchable-select-btn ${isOpen ? 'active' : ''} ${disabled ? 'disabled' : ''}`}
        onClick={handleToggle}
        disabled={disabled || loading}
      >
        <span className={displayName ? 'select-value-text' : 'select-placeholder-text'}>
          {loading ? 'Đang tải...' : displayName || placeholder}
        </span>
        <ChevronDown size={16} className={`select-chevron ${isOpen ? 'open' : ''}`} />
      </button>

      {isOpen && !disabled && !loading && (
        <div className="searchable-select-menu">
          <div className="searchable-search-box">
            <Search size={14} className="search-box-icon" />
            <input
              ref={inputRef}
              type="text"
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="searchable-search-input"
            />
            {search && (
              <button
                type="button"
                className="searchable-clear-btn"
                onClick={() => setSearch('')}
                title="Xóa tìm kiếm"
              >
                <X size={12} />
              </button>
            )}
          </div>

          <div className="searchable-options-list">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => {
                const isSelected = opt.code === valueCode;
                return (
                  <div
                    key={opt.code}
                    className={`searchable-option-item ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleSelect(opt.code, opt.name)}
                  >
                    <span>{opt.name}</span>
                    {isSelected && <Check size={14} className="option-check-icon" />}
                  </div>
                );
              })
            ) : (
              <div className="searchable-empty-msg">
                Không tìm thấy kết quả phù hợp
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
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
  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingWards, setLoadingWards] = useState(false);
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

    setLoadingProvinces(true);
    getAdministrativeProvinces()
      .then((provs) => setProvinces(provs || []))
      .catch(() => {})
      .finally(() => setLoadingProvinces(false));
  }, []);

  // When province changes, reload wards
  useEffect(() => {
    if (value.provinceCode) {
      setLoadingWards(true);
      getAdministrativeWards(value.provinceCode)
        .then((w) => setWards(w || []))
        .catch(() => setWards([]))
        .finally(() => setLoadingWards(false));
    } else {
      setWards([]);
    }
  }, [value.provinceCode]);

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

  // Smart sort provinces with Cần Thơ, TP.HCM, Hà Nội, Đà Nẵng at top
  const sortedProvinces = useMemo(() => {
    const priority = ['92', '79', '01', '48'];
    return [...provinces].sort((a, b) => {
      const aIdx = priority.indexOf(a.code);
      const bIdx = priority.indexOf(b.code);
      if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
      if (aIdx !== -1) return -1;
      if (bIdx !== -1) return 1;
      return a.name.localeCompare(b.name, 'vi');
    });
  }, [provinces]);

  // Default Cần Thơ districts
  const defaultCanThoWards = useMemo<WardItem[]>(
    () => [
      { code: 'NK', name: 'Quận Ninh Kiều' },
      { code: 'CR', name: 'Quận Cái Răng' },
      { code: 'BT', name: 'Quận Bình Thủy' },
      { code: 'PD', name: 'Huyện Phong Điền' },
      { code: 'OM', name: 'Quận Ô Môn' },
      { code: 'TN', name: 'Quận Thốt Nốt' },
      { code: 'TB', name: 'Huyện Thới Lai' },
      { code: 'CD', name: 'Huyện Cờ Đỏ' },
      { code: 'VT', name: 'Huyện Vĩnh Thạnh' },
    ],
    []
  );

  const availableWards = useMemo(() => {
    if (value.provinceCode === '92') {
      const names = new Set(wards.map((w) => w.name));
      const combined = [...defaultCanThoWards];
      wards.forEach((w) => {
        if (!names.has(w.name)) combined.push(w);
      });
      return combined;
    }
    return wards;
  }, [wards, value.provinceCode, defaultCanThoWards]);

  const handleProvinceChange = (pCode: string, pName: string) => {
    onChange({
      ...value,
      placeType: 'home',
      provinceCode: pCode,
      provinceName: pName,
      wardCode: '',
      wardName: '',
      fullAddress: `${value.detail ? value.detail + ', ' : ''}${pName}`,
    });
  };

  const handleWardChange = (wCode: string, wName: string) => {
    onChange({
      ...value,
      placeType: 'home',
      wardCode: wCode,
      wardName: wName,
      fullAddress: `${value.detail ? value.detail + ', ' : ''}${wName ? wName + ', ' : ''}${value.provinceName}`,
    });
  };

  const handleDetailChange = (detailText: string) => {
    const fullAddress = `${detailText ? detailText + ', ' : ''}${value.wardName ? value.wardName + ', ' : ''}${value.provinceName}`;
    onChange({
      ...value,
      detail: detailText,
      fullAddress,
    });
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

      {/* Manual Input: Province first, then Ward appears upon selection */}
      <div className="location-fields-grid">
        {/* 1. Tỉnh / Thành phố */}
        <div className={`location-input-group ${!value.provinceCode ? 'location-field-full' : ''}`}>
          <SearchableSelect
            label="Tỉnh / Thành phố"
            required
            placeholder="-- Chọn Tỉnh / Thành phố --"
            searchPlaceholder="Tìm tỉnh thành..."
            options={sortedProvinces}
            valueCode={value.provinceCode || ''}
            valueName={value.provinceName || ''}
            onChange={handleProvinceChange}
            loading={loadingProvinces}
          />
        </div>

        {/* 2. Phường / Xã / Quận - CHỈ HIỂN THỊ KHI ĐÃ CHỌN TỈNH THÀNH */}
        {value.provinceCode ? (
          <div className="location-input-group location-ward-fade-in">
            <SearchableSelect
              label="Phường / Xã / Quận"
              required
              placeholder="-- Chọn Phường / Xã --"
              searchPlaceholder="Tìm phường xã, quận huyện..."
              options={availableWards}
              valueCode={value.wardCode || ''}
              valueName={value.wardName || ''}
              onChange={handleWardChange}
              loading={loadingWards}
            />
          </div>
        ) : null}

        {/* 3. Số nhà, tên đường */}
        <div className="location-input-group location-field-full">
          <label>Số nhà, tên đường, ngõ hẻm *</label>
          <input
            type="text"
            placeholder="VD: Số 123 đường 30/4"
            value={value.detail || ''}
            onChange={(e) => handleDetailChange(e.target.value)}
            required
          />
        </div>
      </div>

      {/* Mini Interactive Map */}
      <div className="location-map-wrapper">
        <div className="location-map-header">
          <span style={{ fontSize: 13, fontWeight: 700, color: '#334155' }}>
            <MapPin size={14} style={{ display: 'inline', marginRight: 4, color: '#2563eb' }} />
            Vị trí trên bản đồ vệ tinh:
          </span>
          <button
            type="button"
            className="btn-locate-current"
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
