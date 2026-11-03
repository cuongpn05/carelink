describe('administrativeService', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('loads provinces from the post-merger v2 API and normalizes their codes', async () => {
    const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => [
        { code: 1, name: 'Thành phố Hà Nội' },
        { code: 8, name: 'Tỉnh Tuyên Quang' },
      ],
    });
    const { getAdministrativeProvinces } = require('./administrativeService');

    await expect(getAdministrativeProvinces()).resolves.toEqual([
      { code: '1', name: 'Thành phố Hà Nội', shortName: 'Hà Nội' },
      { code: '8', name: 'Tỉnh Tuyên Quang', shortName: 'Tuyên Quang' },
    ]);
    expect(fetchMock).toHaveBeenCalledWith(
      'https://provinces.open-api.vn/api/v2/?depth=1',
      expect.objectContaining({ signal: expect.any(AbortSignal) }),
    );
  });

  it('loads the wards belonging to the selected province', async () => {
    const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => ({
        code: 79,
        wards: [{ code: 25747, name: 'Phường Thủ Dầu Một' }],
      }),
    });
    const { getAdministrativeWards } = require('./administrativeService');

    await expect(getAdministrativeWards('79')).resolves.toEqual([
      { code: '25747', name: 'Phường Thủ Dầu Một' },
    ]);
    expect(fetchMock).toHaveBeenCalledWith(
      'https://provinces.open-api.vn/api/v2/p/79?depth=2',
      expect.any(Object),
    );
  });

  it('does not silently replace an upstream error with stale local data', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({ ok: false, status: 503 });
    const { getAdministrativeProvinces } = require('./administrativeService');

    await expect(getAdministrativeProvinces()).rejects.toThrow(
      'Administrative API returned 503',
    );
  });
});
