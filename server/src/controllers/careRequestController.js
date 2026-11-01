const mongoose = require('mongoose');
const { CareRequest, Account, User, CaregiverProfile } = require('../models');

/**
 * Helper: Bổ sung thông tin chi tiết người dùng và người chăm sóc vào CareRequest
 */
const enrichCareRequest = async (doc, viewerAccountId = null) => {
  if (!doc) return null;
  const reqObj = typeof doc.toObject === 'function' ? doc.toObject() : { ...doc };

  const customerAccountId = reqObj.customerId?._id || reqObj.customerId;
  const acceptedCaregiverId = reqObj.acceptedCaregiverId?._id || reqObj.acceptedCaregiverId;
  const acceptedProfileId = reqObj.acceptedCaregiverProfileId?._id || reqObj.acceptedCaregiverProfileId;

  let customerUser = null;
  let customerAccount = null;
  let caregiverProfile = null;
  let caregiverUser = null;
  let caregiverAccount = null;

  try {
    const [cUser, cAcc, cgProf, cgUser, cgAcc] = await Promise.all([
      customerAccountId ? User.findOne({ accountId: customerAccountId }) : null,
      customerAccountId ? Account.findById(customerAccountId) : null,
      acceptedProfileId || acceptedCaregiverId
        ? CaregiverProfile.findOne({
            $or: [
              ...(acceptedProfileId ? [{ _id: acceptedProfileId }] : []),
              ...(acceptedCaregiverId ? [{ accountId: acceptedCaregiverId }] : []),
            ],
          })
        : null,
      acceptedCaregiverId ? User.findOne({ accountId: acceptedCaregiverId }) : null,
      acceptedCaregiverId ? Account.findById(acceptedCaregiverId) : null,
    ]);

    customerUser = cUser && typeof cUser.toObject === 'function' ? cUser.toObject() : cUser;
    customerAccount = cAcc && typeof cAcc.toObject === 'function' ? cAcc.toObject() : cAcc;
    caregiverProfile = cgProf && typeof cgProf.toObject === 'function' ? cgProf.toObject() : cgProf;
    caregiverUser = cgUser && typeof cgUser.toObject === 'function' ? cgUser.toObject() : cgUser;
    caregiverAccount = cgAcc && typeof cgAcc.toObject === 'function' ? cgAcc.toObject() : cgAcc;
  } catch (enrichErr) {
    console.warn('Cảnh báo enrichCareRequest:', enrichErr.message);
  }

  const isCustomerViewer = viewerAccountId && customerAccountId?.toString() === viewerAccountId.toString();
  const isAcceptedCaregiverViewer = viewerAccountId && acceptedCaregiverId?.toString() === viewerAccountId.toString();
  const isRevealed = isCustomerViewer || isAcceptedCaregiverViewer || ['ACCEPTED', 'IN_PROGRESS', 'COMPLETED'].includes(reqObj.status);

  return {
    ...reqObj,
    customer: {
      accountId: customerAccount?._id || customerAccountId,
      fullName: customerUser?.fullName || 'Khách hàng',
      avatarUrl: customerUser?.avatarUrl || '',
      phone: isRevealed ? (customerUser?.phone || '') : '09********',
      email: isRevealed ? (customerAccount?.email || '') : '',
      reputationScore: customerAccount?.reputationScore ?? 100,
    },
    acceptedCaregiver: caregiverProfile || caregiverAccount
      ? {
          accountId: caregiverAccount?._id || acceptedCaregiverId,
          profileId: caregiverProfile?._id,
          fullName: caregiverProfile?.fullName || caregiverUser?.fullName || 'Người chăm sóc',
          avatarUrl: caregiverProfile?.avatarUrl || caregiverUser?.avatarUrl || '',
          phone: caregiverProfile?.phone || caregiverUser?.phone || '',
          ratingAvg: caregiverProfile?.ratingAvg ?? 5,
          totalReviews: caregiverProfile?.totalReviews ?? 0,
          experienceYears: caregiverProfile?.experienceYears ?? 1,
          bio: caregiverProfile?.bio || '',
          reputationScore: caregiverAccount?.reputationScore ?? 100,
        }
      : null,
  };
};

/**
 * 1. Customer: Đăng yêu cầu chăm sóc mới (Status: OPEN)
 */
const createCareRequest = async (req, res) => {
  try {
    const {
      serviceCategory,
      title,
      description,
      recipient,
      location,
      schedule,
      expectedBudget,
      specialRequirements,
    } = req.body;

    // Validation cơ bản
    if (!serviceCategory || !title || !description) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp danh mục dịch vụ, tiêu đề và mô tả chi tiết.',
      });
    }

    if (!recipient || !recipient.name || recipient.age === undefined || !recipient.relationship) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng điền đầy đủ thông tin người được chăm sóc (Họ tên, tuổi, mối quan hệ).',
      });
    }

    if (!location || !location.address || !location.area) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập địa chỉ cụ thể và khu vực / quận cần chăm sóc.',
      });
    }

    if (!schedule || !schedule.startDate || !schedule.timeSlot || !schedule.dailyHours) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng chọn ngày bắt đầu, khung giờ và số giờ chăm sóc mỗi ngày.',
      });
    }

    if (expectedBudget === undefined || Number(expectedBudget) < 0) {
      return res.status(400).json({
        success: false,
        message: 'Ngân sách dự kiến không hợp lệ.',
      });
    }

    const validCategories = ['elderly-care', 'child-care', 'home-care', 'post-treatment-care'];
    if (!validCategories.includes(serviceCategory)) {
      return res.status(400).json({
        success: false,
        message: 'Loại dịch vụ chăm sóc không hợp lệ.',
      });
    }

    // Tạo bản ghi mới với trạng thái OPEN
    const newRequest = new CareRequest({
      customerId: req.account._id,
      serviceCategory,
      title: title.trim(),
      description: description.trim(),
      recipient: {
        name: recipient.name.trim(),
        age: Number(recipient.age),
        gender: recipient.gender || 'FEMALE',
        relationship: recipient.relationship.trim(),
        conditionNotes: recipient.conditionNotes ? recipient.conditionNotes.trim() : '',
      },
      location: {
        address: location.address.trim(),
        area: location.area.trim(),
        city: location.city ? location.city.trim() : 'TP. Hồ Chí Minh',
      },
      schedule: {
        startDate: new Date(schedule.startDate),
        endDate: schedule.endDate ? new Date(schedule.endDate) : null,
        timeSlot: schedule.timeSlot.trim(),
        dailyHours: Number(schedule.dailyHours),
        frequency: schedule.frequency || 'DAILY',
      },
      expectedBudget: Number(expectedBudget),
      specialRequirements: Array.isArray(specialRequirements)
        ? specialRequirements.filter(Boolean).map((s) => String(s).trim())
        : [],
      status: 'OPEN',
    });

    await newRequest.save();

    const enriched = await enrichCareRequest(newRequest, req.account._id);

    return res.status(201).json({
      success: true,
      message: 'Đăng yêu cầu chăm sóc thành công! Yêu cầu của bạn đã được đưa lên bảng tin tìm người chăm sóc.',
      data: enriched,
    });
  } catch (error) {
    console.error('Lỗi khi tạo yêu cầu chăm sóc:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi đăng yêu cầu chăm sóc.',
      error: error.message,
    });
  }
};

/**
 * 2. Customer: Lấy danh sách yêu cầu do chính mình đăng
 */
const getMyCareRequests = async (req, res) => {
  try {
    const customerId = req.account._id;
    const { status } = req.query;

    const filter = { customerId };
    if (status && status !== 'ALL') {
      filter.status = status;
    }

    const [requests, statsAgg] = await Promise.all([
      CareRequest.find(filter).sort({ createdAt: -1 }).lean(),
      CareRequest.aggregate([
        { $match: { customerId } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
    ]);

    // Thống kê số lượng theo trạng thái
    const stats = {
      ALL: 0,
      OPEN: 0,
      ACCEPTED: 0,
      IN_PROGRESS: 0,
      COMPLETED: 0,
      CANCELLED: 0,
    };

    statsAgg.forEach((item) => {
      if (stats[item._id] !== undefined) {
        stats[item._id] = item.count;
      }
      stats.ALL += item.count;
    });

    const enrichedList = await Promise.all(
      requests.map((r) => enrichCareRequest(r, customerId))
    );

    return res.status(200).json({
      success: true,
      data: {
        requests: enrichedList,
        stats,
      },
    });
  } catch (error) {
    console.error('Lỗi khi lấy yêu cầu của tôi:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi lấy danh sách yêu cầu.',
      error: error.message,
    });
  }
};

/**
 * 3. Caregiver Marketplace: Bảng tin các yêu cầu OPEN dành cho Caregiver
 */
const getOpenCareRequests = async (req, res) => {
  try {
    const {
      serviceCategory,
      area,
      budgetMin,
      budgetMax,
      frequency,
      keyword,
      page = 1,
      limit = 12,
    } = req.query;

    const query = { status: 'OPEN' };

    if (serviceCategory && serviceCategory !== 'ALL') {
      query.serviceCategory = serviceCategory;
    }

    if (area && area !== 'ALL') {
      query['location.area'] = new RegExp(area.trim(), 'i');
    }

    if (frequency && frequency !== 'ALL') {
      query['schedule.frequency'] = frequency;
    }

    if (budgetMin || budgetMax) {
      query.expectedBudget = {};
      if (budgetMin) query.expectedBudget.$gte = Number(budgetMin);
      if (budgetMax) query.expectedBudget.$lte = Number(budgetMax);
    }

    if (keyword) {
      const escaped = keyword.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      query.$or = [
        { title: new RegExp(escaped, 'i') },
        { description: new RegExp(escaped, 'i') },
        { 'location.address': new RegExp(escaped, 'i') },
        { 'location.area': new RegExp(escaped, 'i') },
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 12));
    const skip = (pageNum - 1) * limitNum;

    const [total, requests] = await Promise.all([
      CareRequest.countDocuments(query),
      CareRequest.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
    ]);

    const viewerId = req.account?._id || null;
    const enrichedList = await Promise.all(
      requests.map((r) => enrichCareRequest(r, viewerId))
    );

    return res.status(200).json({
      success: true,
      data: {
        requests: enrichedList,
        total,
        page: pageNum,
        totalPages: Math.ceil(total / limitNum) || 1,
      },
    });
  } catch (error) {
    console.error('Lỗi khi lấy bảng tin yêu cầu chăm sóc:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi lấy bảng tin yêu cầu.',
      error: error.message,
    });
  }
};

/**
 * 4. Chi tiết một yêu cầu chăm sóc theo ID
 */
const getCareRequestById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Mã yêu cầu không hợp lệ.',
      });
    }

    const request = await CareRequest.findById(id).lean();
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy yêu cầu chăm sóc này.',
      });
    }

    const viewerId = req.account?._id || null;
    const enriched = await enrichCareRequest(request, viewerId);

    return res.status(200).json({
      success: true,
      data: enriched,
    });
  } catch (error) {
    console.error('Lỗi khi xem chi tiết yêu cầu:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi xem chi tiết yêu cầu.',
      error: error.message,
    });
  }
};

/**
 * 5. Caregiver: Tiếp nhận yêu cầu chăm sóc (ATOMIC CONDITIONAL UPDATE)
 * Ngăn chặn tuyệt đối Race Condition khi nhiều Caregiver cùng bấm tiếp nhận cùng một thời điểm.
 */
const acceptCareRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const caregiverAccountId = req.account._id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Mã yêu cầu không hợp lệ.',
      });
    }

    // 1. Kiểm tra vai trò & hồ sơ Caregiver
    const caregiverProfile =
      req.caregiverProfile ||
      (await CaregiverProfile.findOne({
        $or: [{ accountId: caregiverAccountId }, { userId: req.user?._id }],
      }));

    if (!caregiverProfile) {
      return res.status(403).json({
        success: false,
        message: 'Bạn chưa tạo hồ sơ người chăm sóc hoặc hồ sơ chưa được kích hoạt.',
      });
    }

    // Kiểm tra điểm uy tín tối thiểu
    if ((req.account.reputationScore ?? 100) < 50) {
      return res.status(403).json({
        success: false,
        message: 'Điểm uy tín của bạn dưới 50, không thể tiếp nhận thêm ca mới.',
      });
    }

    // 2. ATOMIC CONDITIONAL UPDATE: Chỉ update nếu status ĐANG LÀ 'OPEN'
    const updatedRequest = await CareRequest.findOneAndUpdate(
      {
        _id: id,
        status: 'OPEN',
      },
      {
        $set: {
          status: 'ACCEPTED',
          acceptedCaregiverId: caregiverAccountId,
          acceptedCaregiverProfileId: caregiverProfile._id,
          acceptedAt: new Date(),
          customerNotificationReadAt: null, // Bật cờ để khách hàng nhận được thông báo mới
        },
      },
      {
        new: true,
      }
    );

    // 3. Nếu không tìm thấy hoặc cập nhật thất bại -> Phân loại nguyên nhân
    if (!updatedRequest) {
      const existing = await CareRequest.findById(id).lean();
      if (!existing) {
        return res.status(404).json({
          success: false,
          message: 'Yêu cầu chăm sóc không tồn tại.',
        });
      }

      return res.status(409).json({
        success: false,
        message: 'Rất tiếc! Yêu cầu chăm sóc này đã được tiếp nhận bởi người chăm sóc khác hoặc không còn ở trạng thái mở.',
        currentStatus: existing.status,
      });
    }

    const enriched = await enrichCareRequest(updatedRequest, caregiverAccountId);

    return res.status(200).json({
      success: true,
      message: 'Tiếp nhận yêu cầu chăm sóc thành công! Khách hàng sẽ nhận được thông tin liên hệ của bạn.',
      data: enriched,
    });
  } catch (error) {
    console.error('Lỗi khi tiếp nhận yêu cầu chăm sóc:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi tiếp nhận yêu cầu.',
      error: error.message,
    });
  }
};

/**
 * 6. Customer: Hủy yêu cầu chăm sóc (Chỉ được hủy khi trạng thái còn là OPEN)
 */
const cancelCareRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const customerId = req.account._id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Mã yêu cầu không hợp lệ.',
      });
    }

    // Atomic update: Chỉ chủ sở hữu và chỉ khi status === 'OPEN'
    const cancelled = await CareRequest.findOneAndUpdate(
      {
        _id: id,
        customerId,
        status: 'OPEN',
      },
      {
        $set: {
          status: 'CANCELLED',
          cancellationReason: reason ? reason.trim() : 'Khách hàng hủy yêu cầu',
          cancelledAt: new Date(),
          cancelledBy: customerId,
        },
      },
      { new: true }
    );

    if (!cancelled) {
      const existing = await CareRequest.findById(id).lean();
      if (!existing) {
        return res.status(404).json({
          success: false,
          message: 'Yêu cầu không tồn tại.',
        });
      }

      if (existing.customerId?.toString() !== customerId.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Bạn không có quyền hủy yêu cầu của người khác.',
        });
      }

      return res.status(400).json({
        success: false,
        message: `Không thể hủy vì yêu cầu hiện đang ở trạng thái "${existing.status}".`,
        currentStatus: existing.status,
      });
    }

    const enriched = await enrichCareRequest(cancelled, customerId);

    return res.status(200).json({
      success: true,
      message: 'Đã hủy yêu cầu chăm sóc thành công.',
      data: enriched,
    });
  } catch (error) {
    console.error('Lỗi khi hủy yêu cầu:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi hủy yêu cầu.',
      error: error.message,
    });
  }
};

/**
 * 7. Cập nhật tiến độ yêu cầu (ACCEPTED -> IN_PROGRESS -> COMPLETED)
 */
const updateCareRequestStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { newStatus } = req.body;
    const accountId = req.account._id;

    if (!['IN_PROGRESS', 'COMPLETED'].includes(newStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Trạng thái chuyển đổi không hợp lệ (chỉ cho phép IN_PROGRESS hoặc COMPLETED).',
      });
    }

    const request = await CareRequest.findById(id);
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Yêu cầu không tồn tại.',
      });
    }

    // Chỉ Caregiver đã nhận hoặc Customer mới được cập nhật tiến độ
    const isCustomer = request.customerId?.toString() === accountId.toString();
    const isCaregiver = request.acceptedCaregiverId?.toString() === accountId.toString();

    if (!isCustomer && !isCaregiver) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền cập nhật trạng thái yêu cầu này.',
      });
    }

    // Kiểm tra quy trình chuyển đổi hợp lệ
    if (newStatus === 'IN_PROGRESS' && request.status !== 'ACCEPTED') {
      return res.status(400).json({
        success: false,
        message: `Chỉ có thể chuyển sang "Đang thực hiện" khi yêu cầu đang ở trạng thái ACCEPTED (hiện tại: ${request.status}).`,
      });
    }

    if (newStatus === 'COMPLETED' && request.status !== 'IN_PROGRESS') {
      return res.status(400).json({
        success: false,
        message: `Chỉ có thể hoàn thành khi yêu cầu đang ở trạng thái IN_PROGRESS (hiện tại: ${request.status}).`,
      });
    }

    request.status = newStatus;
    await request.save();

    const enriched = await enrichCareRequest(request, accountId);

    return res.status(200).json({
      success: true,
      message: `Đã cập nhật trạng thái thành ${newStatus}`,
      data: enriched,
    });
  } catch (error) {
    console.error('Lỗi khi cập nhật trạng thái yêu cầu:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi cập nhật trạng thái.',
      error: error.message,
    });
  }
};

/**
 * 8. Customer: Lấy danh sách thông báo khi có Caregiver nhận yêu cầu
 */
const getCustomerCareRequestNotifications = async (req, res) => {
  try {
    const customerId = req.account._id;

    const acceptedRequests = await CareRequest.find({
      customerId,
      status: { $in: ['ACCEPTED', 'IN_PROGRESS'] },
      acceptedAt: { $ne: null },
    })
      .sort({ acceptedAt: -1 })
      .limit(10)
      .lean();

    const enriched = await Promise.all(
      acceptedRequests.map((r) => enrichCareRequest(r, customerId))
    );

    const notifications = enriched.map((r) => ({
      requestId: r._id,
      title: r.title,
      message: `Người chăm sóc ${r.acceptedCaregiver?.fullName || 'đối tác'} đã tiếp nhận yêu cầu "${r.title}" của bạn!`,
      acceptedAt: r.acceptedAt,
      isRead: Boolean(r.customerNotificationReadAt),
      caregiver: r.acceptedCaregiver,
    }));

    return res.status(200).json({
      success: true,
      data: notifications,
    });
  } catch (error) {
    console.error('Lỗi lấy thông báo care request:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi lấy thông báo.',
      error: error.message,
    });
  }
};

/**
 * 9. Đánh dấu đã đọc thông báo care request
 */
const markCustomerCareRequestNotificationRead = async (req, res) => {
  try {
    const { id } = req.params;
    const customerId = req.account._id;

    await CareRequest.findOneAndUpdate(
      { _id: id, customerId },
      { $set: { customerNotificationReadAt: new Date() } }
    );

    return res.status(200).json({
      success: true,
      message: 'Đã đánh dấu đọc thông báo.',
    });
  } catch (error) {
    console.error('Lỗi đánh dấu đã đọc thông báo:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ.',
      error: error.message,
    });
  }
};

module.exports = {
  createCareRequest,
  getMyCareRequests,
  getOpenCareRequests,
  getCareRequestById,
  acceptCareRequest,
  cancelCareRequest,
  updateCareRequestStatus,
  getCustomerCareRequestNotifications,
  markCustomerCareRequestNotificationRead,
};
