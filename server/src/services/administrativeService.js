const API_BASE_URL = 'https://provinces.open-api.vn/api/v2';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 10000;

let provincesCache = null;
const wardsCache = new Map();

const requestJson = async (url) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(`Administrative API returned ${response.status}`);
    }
    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
};

const getAdministrativeProvinces = async () => {
  if (provincesCache && provincesCache.expiresAt > Date.now()) {
    return provincesCache.items;
  }

  const response = await requestJson(`${API_BASE_URL}/?depth=1`);
  if (!Array.isArray(response)) {
    throw new Error('Administrative API returned an invalid province list');
  }

  const provinces = response.map((province) => {
    if (!province || province.code == null || typeof province.name !== 'string') {
      throw new Error('Administrative API returned an invalid province');
    }
    return {
      code: String(province.code),
      name: province.name,
      shortName: province.name.replace(/^(Tỉnh|Thành phố)\s+/, ''),
    };
  });

  provincesCache = { items: provinces, expiresAt: Date.now() + CACHE_TTL_MS };
  return provinces;
};

const getAdministrativeWards = async (provinceCode) => {
  const code = String(provinceCode || '').trim();
  if (!code) return [];

  const cached = wardsCache.get(code);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.items;
  }

  const response = await requestJson(
    `${API_BASE_URL}/p/${encodeURIComponent(code)}?depth=2`,
  );
  if (!response || !Array.isArray(response.wards)) {
    throw new Error('Administrative API returned an invalid ward list');
  }

  const wards = response.wards.map((ward) => {
    if (!ward || ward.code == null || typeof ward.name !== 'string') {
      throw new Error('Administrative API returned an invalid ward');
    }
    return { code: String(ward.code), name: ward.name };
  });

  wardsCache.set(code, { items: wards, expiresAt: Date.now() + CACHE_TTL_MS });
  return wards;
};

module.exports = {
  getAdministrativeProvinces,
  getAdministrativeWards,
};
