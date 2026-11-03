const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const Account = require('../models/Account');
const User = require('../models/User');
const CaregiverProfile = require('../models/CaregiverProfile');
const caregiversData = require('../data/caregivers.json');

const seedCaregiverList = async () => {
  try {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('Carelink@2026', salt);

    console.log(`Bắt đầu đồng bộ ${caregiversData.length} Caregiver vào database...`);

    let insertedCount = 0;
    let updatedCount = 0;

    for (const item of caregiversData) {
      const targetProfileId = new mongoose.Types.ObjectId(item._id.$oid);
      const email = `caregiver.${item.phone}@carelink.vn`;

      // 1. Account
      let account = await Account.findOne({
        $or: [{ email }, { phone: item.phone }],
      });

      if (!account) {
        account = await Account.create({
          email,
          passwordHash,
          role: 'CAREGIVER',
          isEmailVerified: true,
          reputationScore: 100,
          status: 'ACTIVE',
        });
        console.log(`[Account] Tạo mới: ${email}`);
      } else {
        account.role = 'CAREGIVER';
        account.isEmailVerified = true;
        account.status = 'ACTIVE';
        if (account.reputationScore < 70) account.reputationScore = 100;
        await account.save();
      }

      // 2. User
      let user = await User.findOne({
        $or: [{ accountId: account._id }, { phone: item.phone }],
      });

      if (!user) {
        user = await User.create({
          accountId: account._id,
          fullName: item.fullName,
          phone: item.phone,
          avatarUrl: item.avatarUrl,
          gender: item.gender || 'OTHER',
          role: 'caregiver',
          isActive: true,
        });
        console.log(`[User] Tạo mới profile User: ${item.fullName}`);
      } else {
        user.accountId = account._id;
        user.fullName = item.fullName;
        user.phone = item.phone;
        user.avatarUrl = item.avatarUrl;
        user.gender = item.gender || user.gender || 'OTHER';
        user.role = 'caregiver';
        user.isActive = true;
        await user.save();
      }

      // 3. CaregiverProfile
      // Đảm bảo không trùng unique accountId ở document khác
      await CaregiverProfile.deleteMany({
        accountId: account._id,
        _id: { $ne: targetProfileId },
      });

      const profilePayload = {
        _id: targetProfileId,
        accountId: account._id,
        userId: user._id,
        fullName: item.fullName,
        gender: item.gender,
        phone: item.phone,
        avatarUrl: item.avatarUrl,
        bio: item.bio,
        idCardNumber: item.idCardNumber,
        idCardImages: item.idCardImages || [],
        experienceYears: item.experienceYears,
        approvalStatus: item.approvalStatus || 'APPROVED',
        verificationStatus: item.verificationStatus || 'VERIFIED',
        hourlyRate: item.hourlyRate,
        pricing: item.pricing,
        serviceAreas: item.serviceAreas,
        skills: item.skills,
        serviceLocation: item.serviceLocation,
        serviceRadius: item.serviceRadius || 15,
        priorityScore: item.priorityScore || 100,
        ratingAvg: item.ratingAvg || 5.0,
        reviewCount: item.reviewCount || 0,
        totalReviews: item.totalReviews || item.reviewCount || 0,
        totalCompletedBookings: item.totalCompletedBookings || 0,
        createdAt: new Date(item.createdAt.$date),
        updatedAt: new Date(item.updatedAt.$date),
      };

      const existingProfile = await CaregiverProfile.findById(targetProfileId);
      if (existingProfile) {
        await CaregiverProfile.findByIdAndUpdate(targetProfileId, { $set: profilePayload });
        updatedCount++;
        console.log(`[CaregiverProfile] Cập nhật: ${item.fullName} (${targetProfileId})`);
      } else {
        await CaregiverProfile.create(profilePayload);
        insertedCount++;
        console.log(`[CaregiverProfile] Thêm mới: ${item.fullName} (${targetProfileId})`);
      }
    }

    console.log(`\n🎉 Hoàn thành! Đã thêm mới: ${insertedCount}, Cập nhật: ${updatedCount} Caregiver.`);
    return { insertedCount, updatedCount, total: caregiversData.length };
  } catch (err) {
    console.error('Lỗi khi seed CaregiverList:', err);
    throw err;
  }
};

if (require.main === module) {
  const run = async () => {
    try {
      const connStr = process.env.MONGODB_URI;
      if (!connStr) {
        throw new Error('MONGODB_URI không tìm thấy trong file .env');
      }
      await mongoose.connect(connStr);
      console.log('MongoDB connected:', mongoose.connection.name);

      await seedCaregiverList();
      await mongoose.disconnect();
      console.log('MongoDB disconnected cleanly.');
      process.exit(0);
    } catch (error) {
      console.error('Lỗi chạy seeder:', error.message);
      process.exit(1);
    }
  };
  run();
}

module.exports = { seedCaregiverList, caregiversData };

