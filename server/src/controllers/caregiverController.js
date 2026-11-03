const mongoose = require("mongoose");
const CaregiverProfile = require("../models/CaregiverProfile");
const User = require("../models/User");
const { calculateDistancePricing } = require("../services/geoDistanceService");
const { checkCaregiverAvailability } = require("../services/availabilityService");

const getCaregivers = async (req, res) => {
  try {
    const {
      keyword,
      minExperience,
      minPrice,
      maxPrice,
      minRating,
      area,
      skill,
      verificationStatus,
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      order = "desc",
    } = req.query;

    // 1. Tạo điều kiện lọc hồ sơ
    const filter = {
      $or: [
        { approvalStatus: "APPROVED" },
        { verificationStatus: "VERIFIED" },
      ],
    };

    // 2. Lọc theo kinh nghiệm
    if (minExperience !== undefined) {
      const experience = Number(minExperience);

      if (!Number.isFinite(experience) || experience < 0) {
        return res.status(400).json({
          success: false,
          message: "minExperience phải là số lớn hơn hoặc bằng 0",
        });
      }

      filter.experienceYears = {
        $gte: experience,
      };
    }

    // 3. Lọc theo giá
    if (minPrice !== undefined || maxPrice !== undefined) {
      const priceFilter = {};

      if (minPrice !== undefined) {
        const min = Number(minPrice);

        if (!Number.isFinite(min) || min < 0) {
          return res.status(400).json({
            success: false,
            message: "minPrice phải là số lớn hơn hoặc bằng 0",
          });
        }

        priceFilter.$gte = min;
      }

      if (maxPrice !== undefined) {
        const max = Number(maxPrice);

        if (!Number.isFinite(max) || max < 0) {
          return res.status(400).json({
            success: false,
            message: "maxPrice phải là số lớn hơn hoặc bằng 0",
          });
        }

        priceFilter.$lte = max;
      }

      if (
        priceFilter.$gte !== undefined &&
        priceFilter.$lte !== undefined &&
        priceFilter.$gte > priceFilter.$lte
      ) {
        return res.status(400).json({
          success: false,
          message: "minPrice không được lớn hơn maxPrice",
        });
      }

      filter.$and = [
        {
          $or: [
            { "pricing.hourlyRate": priceFilter },
            { hourlyRate: priceFilter },
          ],
        },
      ];
    }

    // 4. Lọc theo đánh giá
    if (minRating !== undefined) {
      const rating = Number(minRating);

      if (!Number.isFinite(rating) || rating < 0 || rating > 5) {
        return res.status(400).json({
          success: false,
          message: "minRating phải nằm trong khoảng từ 0 đến 5",
        });
      }

      filter.ratingAvg = {
        $gte: rating,
      };
    }

    // 5. Lọc theo khu vực (hỗ trợ cả Tỉnh thành và Phường/Xã/Quận)
    if (area) {
      const cleanArea = area.replace(/^(Phường|Xã|Thị trấn|Quận|Huyện|Tỉnh|Thành phố)\s+/i, '').trim();
      const canThoDistricts = ['Ninh Kiều', 'Cái Răng', 'Bình Thủy', 'Phong Điền', 'Ô Môn', 'Thốt Nốt', 'Cờ Đỏ', 'Thới Lai', 'Vĩnh Thạnh'];

      if (/Cần Thơ/i.test(area) || /Can Tho/i.test(area)) {
        filter.serviceAreas = {
          $in: [
            new RegExp('Cần Thơ', 'i'),
            ...canThoDistricts.map((d) => new RegExp(escapeRegex(d), 'i')),
          ],
        };
      } else {
        const searchTerm = cleanArea || area;
        filter.serviceAreas = {
          $regex: escapeRegex(searchTerm),
          $options: "i",
        };
      }
    }

    // 6. Lọc theo kỹ năng
    if (skill) {
      filter.skills = {
        $regex: escapeRegex(skill),
        $options: "i",
      };
    }

    // Chỉ admin mới có thể yêu cầu trạng thái xác minh khác trạng thái đã duyệt.
    if (verificationStatus !== undefined) {
      const userRole = req.account?.role;

      if (userRole !== "ADMIN") {
        return res.status(403).json({
          success: false,
          message: "Chỉ admin được lọc theo trạng thái xác minh",
        });
      }

      const validStatuses = ["PENDING", "APPROVED", "VERIFIED", "REJECTED"];

      if (!validStatuses.includes(verificationStatus)) {
        return res.status(400).json({
          success: false,
          message: "verificationStatus không hợp lệ",
        });
      }

      filter.$or = verificationStatus === "VERIFIED" || verificationStatus === "APPROVED"
        ? [
            { approvalStatus: "APPROVED" },
            { verificationStatus: "VERIFIED" },
          ]
        : [
            { approvalStatus: verificationStatus },
            { verificationStatus },
          ];
    }

    // User stores names but has no caregiver role/isActive fields; approval is on the profile.
    if (keyword) {
      const users = await User.find({
        fullName: {
          $regex: escapeRegex(keyword),
          $options: "i",
        },
      }).select("_id");

      filter.$and = filter.$and || [];
      filter.$and.push({
        $or: [
          { userId: { $in: users.map((user) => user._id) } },
          { fullName: { $regex: escapeRegex(keyword), $options: "i" } },
        ],
      });
    }

    // 10. Phân trang
    const currentPage = Number(page);
    const pageSize = Number(limit);

    if (
      !Number.isInteger(currentPage) ||
      currentPage < 1 ||
      !Number.isInteger(pageSize) ||
      pageSize < 1 ||
      pageSize > 100
    ) {
      return res.status(400).json({
        success: false,
        message: "page phải >= 1 và limit phải từ 1 đến 100",
      });
    }

    // 11. Sắp xếp
    const sortFieldMap = {
      createdAt: "createdAt",
      hourlyRate: "pricing.hourlyRate",
      experienceYears: "experienceYears",
      ratingAvg: "ratingAvg",
      reviewCount: "totalReviews",
    };

    if (!Object.prototype.hasOwnProperty.call(sortFieldMap, sortBy)) {
      return res.status(400).json({
        success: false,
        message: "sortBy không hợp lệ",
      });
    }

    if (!["asc", "desc"].includes(order)) {
      return res.status(400).json({
        success: false,
        message: "order chỉ nhận asc hoặc desc",
      });
    }

    const sortOptions = {
      [sortFieldMap[sortBy]]: order === "asc" ? 1 : -1,
    };

    const skip = (currentPage - 1) * pageSize;

    // 12. Truy vấn database
    const [caregivers, total] = await Promise.all([
      CaregiverProfile.find(filter)
        .populate({
          path: "userId",
          select: "fullName email phone avatarUrl",
        })
        .sort(sortOptions)
        .skip(skip)
        .limit(pageSize)
        .lean(),

      CaregiverProfile.countDocuments(filter),
    ]);
    // 13. Trả kết quả
    return res.status(200).json({
      success: true,
      message: "Lấy danh sách người chăm sóc thành công",
      data: caregivers,
      pagination: {
        page: currentPage,
        limit: pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error("getCaregivers error:", error);

    return res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy danh sách người chăm sóc",
    });
  }
};
const getFeaturedCaregivers = async (req, res) => {
  try {
    const limit = Math.min(
      Math.max(Number.parseInt(req.query.limit, 10) || 4, 1),
      20,
    );

    // Profile schema uses approvalStatus/totalReviews, not User role/isActive.
    const caregivers = await CaregiverProfile.find({
      $and: [
        {
          $or: [
            { approvalStatus: "APPROVED" },
            { verificationStatus: "VERIFIED" },
          ],
        },
        {
          $or: [
            { totalReviews: { $gte: 1 } },
            { reviewCount: { $gte: 1 } },
          ],
        },
      ],
      ratingAvg: { $gte: 4.5 },
    })
      .populate({
        path: "userId",
        select: "fullName avatarUrl",
      })
      .sort({
        ratingAvg: -1,
        totalReviews: -1,
      })
      .limit(limit)
      .lean();

    return res.status(200).json({
      success: true,
      message: "Lấy danh sách người chăm sóc nổi bật thành công",
      data: caregivers,
    });
  } catch (error) {
    console.error("getFeaturedCaregivers error:", error);

    return res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy người chăm sóc nổi bật",
    });
  }
};
// Tránh ký tự đặc biệt trong chuỗi tìm kiếm bị hiểu là regex
function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
const getCaregiverDetail = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Kiểm tra ID hợp lệ
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "ID người chăm sóc không hợp lệ",
      });
    }

    // 2. Tìm hồ sơ người chăm sóc
    const caregiver = await CaregiverProfile.findOne({
      _id: id,
      $or: [
        { approvalStatus: "APPROVED" },
        { verificationStatus: "VERIFIED" },
      ],
    })
      .populate({
        path: "userId",
        select: "fullName avatarUrl phone email",
      })
      .lean();

    // 3. Kiểm tra hồ sơ có tồn tại không
    if (!caregiver) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy người chăm sóc",
      });
    }

    // 4. Trả kết quả
    return res.status(200).json({
      success: true,
      message: "Lấy chi tiết người chăm sóc thành công",
      data: caregiver,
    });
  } catch (error) {
    console.error("getCaregiverDetail error:", error);

    return res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy chi tiết người chăm sóc",
    });
  }
};

/**
 * Tìm kiếm & Khớp người chăm sóc người già theo tọa độ (Geospatial & Distance Pricing Engine)
 * GET /api/caregivers/match-elderly
 */
const matchElderlyCaregivers = async (req, res) => {
  try {
    const { lng, lat, packageType = 'HOURLY', durationValue, startTime, endTime } = req.query;

    if (lng === undefined || lat === undefined || lng === '' || lat === '') {
      return res.status(400).json({
        success: false,
        message: 'Tọa độ lng và lat là bắt buộc.',
      });
    }

    const longitude = parseFloat(lng);
    const latitude = parseFloat(lat);

    if (
      Number.isNaN(longitude) ||
      Number.isNaN(latitude) ||
      longitude < -180 ||
      longitude > 180 ||
      latitude < -90 ||
      latitude > 90
    ) {
      return res.status(400).json({
        success: false,
        message: 'Tọa độ lng (-180 đến 180) hoặc lat (-90 đến 90) không hợp lệ.',
      });
    }

    const pipeline = [
      {
        $geoNear: {
          near: {
            type: 'Point',
            coordinates: [longitude, latitude],
          },
          distanceField: 'distanceMeters',
          spherical: true,
          query: {
            approvalStatus: 'APPROVED',
            skills: { $in: ['Chăm sóc người cao tuổi', /người cao tuổi/i, /người già/i] },
          },
        },
      },
      {
        $addFields: {
          distanceKm: { $round: [{ $divide: ['$distanceMeters', 1000] }, 1] },
        },
      },
      {
        $match: {
          $expr: {
            $lte: ['$distanceKm', { $ifNull: ['$serviceRadius', 15] }],
          },
        },
      },
      {
        $sort: {
          distanceKm: 1,
          priorityScore: -1,
          ratingAvg: -1,
        },
      },
    ];

    const matchedCaregivers = await CaregiverProfile.aggregate(pipeline);

    const normPackageType = (packageType || 'HOURLY').toUpperCase();
    const normDuration = Number(durationValue) || (normPackageType === 'DAILY' ? 1 : 4);

    let parsedStart = null;
    let parsedEnd = null;
    if (startTime && endTime) {
      parsedStart = new Date(startTime);
      parsedEnd = new Date(endTime);
      if (Number.isNaN(parsedStart.getTime()) || Number.isNaN(parsedEnd.getTime())) {
        parsedStart = null;
        parsedEnd = null;
      }
    }

    const results = [];
    for (const caregiver of matchedCaregivers) {
      if (parsedStart && parsedEnd && caregiver.accountId) {
        const isFree = await checkCaregiverAvailability(caregiver.accountId, parsedStart, parsedEnd);
        if (!isFree) {
          continue;
        }
      }

      const hourlyRate = caregiver.pricing?.hourlyRate || caregiver.hourlyRate || 100000;
      const dailyRate = caregiver.pricing?.dailyRate || hourlyRate * 10 || 800000;
      const baseRate = normPackageType === 'DAILY' ? dailyRate : hourlyRate;
      const basePrice = baseRate * normDuration;

      const distancePricing = calculateDistancePricing(caregiver.distanceKm);
      const distanceFee = distancePricing.surchargeAmount;
      const totalEstimatedPrice = basePrice + distanceFee;

      results.push({
        ...caregiver,
        distancePricing: {
          distanceKm: caregiver.distanceKm,
          isFree: distancePricing.isFree,
          surchargeAmount: distanceFee,
        },
        calculatedPricing: {
          packageType: normPackageType,
          durationValue: normDuration,
          baseRate,
          basePrice,
          distanceKm: caregiver.distanceKm,
          distanceFee,
          totalEstimatedPrice,
        },
      });
    }

    const populated = await CaregiverProfile.populate(results, {
      path: 'userId',
      select: 'fullName avatarUrl phone email',
    });

    return res.status(200).json({
      success: true,
      count: populated.length,
      data: populated,
    });
  } catch (error) {
    console.error('matchElderlyCaregivers error:', error);
    return res.status(500).json({
      success: false,
      message: 'Lỗi server khi tìm kiếm người chăm sóc theo vị trí.',
    });
  }
};

module.exports = {
  matchElderlyCaregivers,
  getCaregivers,
  getFeaturedCaregivers,
  getCaregiverDetail,
};
