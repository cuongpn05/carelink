/**
 * Migration helper: Chuyển đổi dữ liệu địa chỉ cũ (defaultAddress) sang sổ địa chỉ mới (addresses).
 * Đảm bảo:
 * 1. Không làm mất dữ liệu cũ.
 * 2. Đánh dấu isLegacyMigrated: true.
 * 3. Chạy idempotent (chạy nhiều lần không sinh trùng lặp).
 */

const { formatFullAddress } = require('../data/vietnamAdministrative');

const migrateSingleUserAddresses = async (user) => {
  if (!user) return false;

  const hasAddresses = Array.isArray(user.addresses) && user.addresses.length > 0;
  if (hasAddresses) {
    return false; // Đã có sổ địa chỉ, không cần migrate
  }

  const legacy = user.defaultAddress;
  const hasLegacyData = Boolean(
    legacy && (legacy.city || legacy.district || legacy.ward || legacy.detail)
  );

  if (!hasLegacyData) {
    return false;
  }

  const provinceName = (legacy.city || '').trim() || 'Chưa cập nhật tỉnh/thành';
  const wardName = (legacy.ward || legacy.district || '').trim() || 'Chưa cập nhật phường/xã';
  const detail = (legacy.detail || '').trim() || 'Địa chỉ liên hệ';
  const fullAddress = formatFullAddress({ detail, wardName, provinceName });

  user.addresses = [
    {
      label: 'Nhà riêng',
      recipientName: user.fullName || 'Người nhận',
      phone: user.phone || '0901234567',
      provinceCode: '',
      provinceName,
      wardCode: '',
      wardName,
      detail,
      fullAddress,
      isDefault: true,
      isLegacyMigrated: true,
    },
  ];

  await user.save();
  return true;
};

module.exports = {
  migrateSingleUserAddresses,
};
