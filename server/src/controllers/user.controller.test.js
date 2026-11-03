const {
  updateProfile,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
  getAdministrativeProvinces,
  getAdministrativeWards,
} = require('./user.controller');
const { User, CaregiverProfile } = require('../models');

jest.mock('../models', () => ({
  User: {
    findOne: jest.fn(),
    findOneAndUpdate: jest.fn(),
  },
  Account: {
    findById: jest.fn(),
  },
  CaregiverProfile: {
    findOneAndUpdate: jest.fn(),
  },
  ReputationLog: {
    find: jest.fn(),
  },
}));

describe('User Controller - Profile & Address Management Tests', () => {
  let mockReq;
  let mockRes;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  describe('updateProfile', () => {
    it('returns 400 when fullName is empty or missing', async () => {
      mockReq = {
        account: { _id: 'acc_123', role: 'CUSTOMER' },
        body: { fullName: '', phone: '0901234567' },
      };

      await updateProfile(mockReq, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, message: expect.stringContaining('Họ và tên') })
      );
    });

    it('returns 400 when phone number is invalid format', async () => {
      mockReq = {
        account: { _id: 'acc_123', role: 'CUSTOMER' },
        body: { fullName: 'Nguyễn Văn A', phone: '12345' },
      };

      await updateProfile(mockReq, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, message: expect.stringContaining('Số điện thoại không đúng định dạng') })
      );
    });

    it('successfully updates user profile with valid data', async () => {
      mockReq = {
        account: { _id: 'acc_123', role: 'CUSTOMER' },
        body: {
          fullName: 'Nguyễn Văn A',
          phone: '0901234567',
          gender: 'MALE',
          dateOfBirth: '1990-05-15',
        },
      };

      User.findOneAndUpdate.mockResolvedValue({
        _id: 'user_123',
        fullName: 'Nguyễn Văn A',
        phone: '0901234567',
        gender: 'MALE',
      });

      await updateProfile(mockReq, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true, message: expect.stringContaining('thành công') })
      );
    });
  });

  describe('addAddress', () => {
    it('returns 400 when required fields are missing', async () => {
      mockReq = {
        account: { _id: 'acc_123' },
        body: { label: 'Nhà riêng' },
      };

      User.findOne.mockResolvedValue({
        _id: 'user_123',
        addresses: [],
        save: jest.fn(),
      });

      await addAddress(mockReq, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false })
      );
    });

    it('adds address and marks first address as default', async () => {
      const mockSave = jest.fn().mockResolvedValue(true);
      const mockUser = {
        _id: 'user_123',
        addresses: [],
        save: mockSave,
      };

      User.findOne.mockResolvedValue(mockUser);

      mockReq = {
        account: { _id: 'acc_123' },
        body: {
          label: 'Nhà riêng',
          recipientName: 'Trần Thị B',
          phone: '0912345678',
          provinceCode: '92',
          provinceName: 'Cần Thơ',
          wardCode: '92-01',
          wardName: 'Phường An Khánh',
          detail: '123 Đường 30/4',
        },
      };

      await addAddress(mockReq, mockRes);
      expect(mockSave).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockUser.addresses.length).toBe(1);
      expect(mockUser.addresses[0].isDefault).toBe(true);
      expect(mockUser.addresses[0].fullAddress).toContain('123 Đường 30/4');
    });
  });

  describe('setDefaultAddress', () => {
    it('sets specified address to isDefault and unsets others', async () => {
      const mockSave = jest.fn().mockResolvedValue(true);
      const addr1 = { _id: 'addr_1', isDefault: true, toString: () => 'addr_1' };
      const addr2 = { _id: 'addr_2', isDefault: false, toString: () => 'addr_2' };

      const mockUser = {
        _id: 'user_123',
        addresses: [addr1, addr2],
        save: mockSave,
      };
      mockUser.addresses.id = jest.fn((id) => (id === 'addr_2' ? addr2 : null));

      User.findOne.mockResolvedValue(mockUser);

      mockReq = {
        account: { _id: 'acc_123' },
        params: { addressId: 'addr_2' },
      };

      await setDefaultAddress(mockReq, mockRes);
      expect(mockSave).toHaveBeenCalled();
      expect(addr1.isDefault).toBe(false);
      expect(addr2.isDefault).toBe(true);
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });
  });

  describe('Administrative endpoints', () => {
    it('returns all 63 provinces', async () => {
      await getAdministrativeProvinces({}, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            provinces: expect.arrayContaining([
              expect.objectContaining({ code: '92', shortName: 'Cần Thơ' }),
              expect.objectContaining({ code: '79', shortName: 'TP. Hồ Chí Minh' }),
            ]),
          }),
        })
      );
    });

    it('returns wards for a province', async () => {
      mockReq = { query: { provinceCode: '92' } };
      await getAdministrativeWards(mockReq, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            wards: expect.arrayContaining([
              expect.objectContaining({ name: 'Phường An Khánh' }),
            ]),
          }),
        })
      );
    });
  });
});
