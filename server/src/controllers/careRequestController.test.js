const {
  createCareRequest,
  acceptCareRequest,
  cancelCareRequest,
  updateCareRequestStatus,
} = require('./careRequestController');
const { CareRequest, CaregiverProfile } = require('../models');

jest.mock('../models', () => ({
  CareRequest: {
    find: jest.fn(),
    findById: jest.fn(),
    findOneAndUpdate: jest.fn(),
    countDocuments: jest.fn(),
    aggregate: jest.fn(),
  },
  Account: {
    findById: jest.fn(),
  },
  User: {
    findOne: jest.fn(),
  },
  CaregiverProfile: {
    findOne: jest.fn(),
  },
}));

describe('CareRequest Controller Unit Tests', () => {
  let mockReq;
  let mockRes;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  describe('createCareRequest validation', () => {
    it('returns 400 when missing serviceCategory, title or description', async () => {
      mockReq = {
        account: { _id: 'customer_123', role: 'CUSTOMER' },
        body: { title: 'Test' },
      };

      await createCareRequest(mockReq, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false })
      );
    });

    it('returns 400 when missing recipient info', async () => {
      mockReq = {
        account: { _id: 'customer_123', role: 'CUSTOMER' },
        body: {
          serviceCategory: 'elderly-care',
          title: 'Cần người chăm sóc',
          description: 'Mô tả chi tiết hơn 10 ký tự',
          recipient: { name: '' },
        },
      };

      await createCareRequest(mockReq, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('thông tin người được chăm sóc'),
        })
      );
    });
  });

  describe('acceptCareRequest Concurrency & Atomic Control', () => {
    it('successfully accepts care request when status is OPEN', async () => {
      const caregiverAccountId = 'caregiver_acc_1';
      const requestId = 'request_1';

      mockReq = {
        params: { id: '507f1f77bcf86cd799439011' },
        account: { _id: caregiverAccountId, role: 'CAREGIVER', reputationScore: 90 },
        caregiverProfile: { _id: 'profile_1', fullName: 'Nguyễn Thị Mai' },
      };

      const mockUpdated = {
        _id: '507f1f77bcf86cd799439011',
        title: 'Chăm sóc người già',
        status: 'ACCEPTED',
        acceptedCaregiverId: caregiverAccountId,
        acceptedCaregiverProfileId: 'profile_1',
        acceptedAt: new Date(),
        toObject: () => ({
          _id: '507f1f77bcf86cd799439011',
          title: 'Chăm sóc người già',
          status: 'ACCEPTED',
          acceptedCaregiverId: caregiverAccountId,
          acceptedCaregiverProfileId: 'profile_1',
          acceptedAt: new Date(),
        }),
      };

      CareRequest.findOneAndUpdate.mockResolvedValue(mockUpdated);

      await acceptCareRequest(mockReq, mockRes);

      expect(CareRequest.findOneAndUpdate).toHaveBeenCalledWith(
        {
          _id: '507f1f77bcf86cd799439011',
          status: 'OPEN',
        },
        expect.objectContaining({
          $set: expect.objectContaining({
            status: 'ACCEPTED',
            acceptedCaregiverId: caregiverAccountId,
          }),
        }),
        { new: true }
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.stringContaining('thành công'),
        })
      );
    });

    it('returns 409 Conflict when another caregiver already accepted the request (race condition handled)', async () => {
      mockReq = {
        params: { id: '507f1f77bcf86cd799439011' },
        account: { _id: 'caregiver_acc_2', role: 'CAREGIVER', reputationScore: 85 },
        caregiverProfile: { _id: 'profile_2', fullName: 'Trần Văn Minh' },
      };

      // findOneAndUpdate with status: 'OPEN' returns null because status is already ACCEPTED
      CareRequest.findOneAndUpdate.mockResolvedValue(null);
      CareRequest.findById.mockReturnValue({
        lean: jest.fn().mockResolvedValue({
          _id: '507f1f77bcf86cd799439011',
          status: 'ACCEPTED',
          acceptedCaregiverId: 'caregiver_acc_1',
        }),
      });

      await acceptCareRequest(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(409);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('đã được tiếp nhận bởi người chăm sóc khác'),
          currentStatus: 'ACCEPTED',
        })
      );
    });
    it('rejects accept when user has no caregiver profile', async () => {
      mockReq = {
        params: { id: '507f1f77bcf86cd799439011' },
        account: { _id: 'acc_no_profile', role: 'CAREGIVER', reputationScore: 80 },
        caregiverProfile: null,
      };
      CaregiverProfile.findOne.mockResolvedValue(null);

      await acceptCareRequest(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('chưa tạo hồ sơ người chăm sóc'),
        })
      );
    });
  });

  describe('cancelCareRequest', () => {
    it('rejects cancellation when requested by non-owner user', async () => {
      const customerId = 'customer_other';
      mockReq = {
        params: { id: '507f1f77bcf86cd799439011' },
        account: { _id: customerId, role: 'CUSTOMER' },
        body: { reason: 'Cố tình hủy của người khác' },
      };

      CareRequest.findOneAndUpdate.mockResolvedValue(null);
      CareRequest.findById.mockReturnValue({
        lean: jest.fn().mockResolvedValue({
          _id: '507f1f77bcf86cd799439011',
          customerId: 'customer_owner',
          status: 'OPEN',
        }),
      });

      await cancelCareRequest(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('không có quyền'),
        })
      );
    });
    it('cancels OPEN care request for owner customer', async () => {
      const customerId = 'customer_1';
      mockReq = {
        params: { id: '507f1f77bcf86cd799439011' },
        account: { _id: customerId, role: 'CUSTOMER' },
        body: { reason: 'Thay đổi kế hoạch' },
      };

      const mockCancelled = {
        _id: '507f1f77bcf86cd799439011',
        status: 'CANCELLED',
        cancellationReason: 'Thay đổi kế hoạch',
        toObject: () => ({
          _id: '507f1f77bcf86cd799439011',
          status: 'CANCELLED',
        }),
      };

      CareRequest.findOneAndUpdate.mockResolvedValue(mockCancelled);

      await cancelCareRequest(mockReq, mockRes);

      expect(CareRequest.findOneAndUpdate).toHaveBeenCalledWith(
        {
          _id: '507f1f77bcf86cd799439011',
          customerId,
          status: 'OPEN',
        },
        expect.objectContaining({
          $set: expect.objectContaining({
            status: 'CANCELLED',
          }),
        }),
        { new: true }
      );
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: true })
      );
    });

    it('rejects cancellation when request is already ACCEPTED', async () => {
      const customerId = 'customer_1';
      mockReq = {
        params: { id: '507f1f77bcf86cd799439011' },
        account: { _id: customerId, role: 'CUSTOMER' },
        body: { reason: 'Muốn hủy' },
      };

      CareRequest.findOneAndUpdate.mockResolvedValue(null);
      CareRequest.findById.mockReturnValue({
        lean: jest.fn().mockResolvedValue({
          _id: '507f1f77bcf86cd799439011',
          customerId,
          status: 'ACCEPTED',
        }),
      });

      await cancelCareRequest(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          currentStatus: 'ACCEPTED',
        })
      );
    });
  });

  describe('updateCareRequestStatus', () => {
    it('allows progression ACCEPTED -> IN_PROGRESS', async () => {
      const caregiverId = 'caregiver_1';
      const mockReqDoc = {
        _id: '507f1f77bcf86cd799439011',
        customerId: 'customer_1',
        acceptedCaregiverId: caregiverId,
        status: 'ACCEPTED',
        save: jest.fn().mockResolvedValue(true),
        toObject: () => ({
          _id: '507f1f77bcf86cd799439011',
          status: 'IN_PROGRESS',
        }),
      };

      CareRequest.findById.mockResolvedValue(mockReqDoc);

      mockReq = {
        params: { id: '507f1f77bcf86cd799439011' },
        account: { _id: caregiverId },
        body: { newStatus: 'IN_PROGRESS' },
      };

      await updateCareRequestStatus(mockReq, mockRes);

      expect(mockReqDoc.status).toBe('IN_PROGRESS');
      expect(mockReqDoc.save).toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });
  });
});
