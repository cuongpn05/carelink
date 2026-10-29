const mongoose = require("mongoose");
const CaregiverProfile = require("../models/CaregiverProfile");
const User = require("../models/User");

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
    const filter = {};

    // Mặc định chỉ hiển thị người đã xác minh
    filter.verificationStatus = "VERIFIED";

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

      filter.hourlyRate = priceFilter;
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

    // 5. Lọc theo khu vực
    if (area) {
      filter.serviceAreas = {
        $regex: escapeRegex(area),
        $options: "i",
      };
    }

    // 6. Lọc theo kỹ năng
    if (skill) {
      filter.skills = {
        $regex: escapeRegex(skill),
        $options: "i",
      };
    }

    // 7. Cho phép chọn trạng thái xác minh
    // Chỉ admin mới có thể tìm theo trạng thái khác VERIFIED.
    // Người dùng công khai luôn chỉ xem VERIFIED.
    if (verificationStatus !== undefined) {
      const userRole = req.user?.role;

      if (userRole !== "admin") {
        return res.status(403).json({
          success: false,
          message: "Chỉ admin được lọc theo trạng thái xác minh",
        });
      }

      const validStatuses = ["PENDING", "VERIFIED", "REJECTED"];

      if (!validStatuses.includes(verificationStatus)) {
        return res.status(400).json({
          success: false,
          message: "verificationStatus không hợp lệ",
        });
      }

      filter.verificationStatus = verificationStatus;
    }

    // 8. Tìm người chăm sóc theo tên tài khoản
    let userIds = [];

    if (keyword) {
      const users = await User.find({
        fullName: {
          $regex: escapeRegex(keyword),
          $options: "i",
        },
        role: "caregiver",
        isActive: true,
      }).select("_id");

      userIds = users.map((user) => user._id);

      filter.userId = {
        $in: userIds,
      };
    }

    // 9. Lấy thông tin các tài khoản caregiver đang hoạt động
    const activeUsers = await User.find({
      role: "caregiver",
      isActive: true,
    }).select("_id");

    const activeUserIds = activeUsers.map((user) => user._id);

    if (filter.userId) {
      const keywordIds = filter.userId.$in;

      filter.userId = {
        $in: keywordIds.filter((id) =>
          activeUserIds.some(
            (activeId) => activeId.toString() === id.toString(),
          ),
        ),
      };
    } else {
      filter.userId = {
        $in: activeUserIds,
      };
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
    const allowedSortFields = [
      "createdAt",
      "hourlyRate",
      "experienceYears",
      "ratingAvg",
      "reviewCount",
    ];

    if (!allowedSortFields.includes(sortBy)) {
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
      [sortBy]: order === "asc" ? 1 : -1,
    };

    const skip = (currentPage - 1) * pageSize;

    // 12. Truy vấn database
    const [caregivers, total] = await Promise.all([
      CaregiverProfile.find(filter)
        .populate({
          path: "userId",
          select: "fullName email phone avatar",
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

    // Lấy các tài khoản caregiver đang hoạt động
    const activeUsers = await User.find({
      role: "caregiver",
      isActive: true,
    }).select("_id");

    const activeUserIds = activeUsers.map((user) => user._id);

    // Tìm người chăm sóc nổi bật
    const caregivers = await CaregiverProfile.find({
      userId: { $in: activeUserIds },
      verificationStatus: "VERIFIED",
      ratingAvg: { $gte: 4.5 },
      reviewCount: { $gte: 1 },
    })
      .populate({
        path: "userId",
        select: "fullName avatar",
      })
      .sort({
        ratingAvg: -1,
        reviewCount: -1,
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
      verificationStatus: "VERIFIED",
    })
      .populate({
        path: "userId",
        select: "fullName avatar phone email isActive role",
        match: {
          role: "caregiver",
          isActive: true,
        },
      })
      .lean();

    // 3. Kiểm tra hồ sơ có tồn tại không
    if (!caregiver || !caregiver.userId) {
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
module.exports = {
  getCaregivers,
  getFeaturedCaregivers,
  getCaregiverDetail,
};
