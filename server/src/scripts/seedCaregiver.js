const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

async function seedCaregiverAccounts() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB:', mongoose.connection.name);

    const caregivers = [
      {
        email: 'caregiver@carelink.vn',
        password: 'password123',
        fullName: 'Nguyễn Văn An',
        phone: '0901234567',
        avatarUrl: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=300&q=80',
        idCardNumber: '079198001234',
        bio: 'Điều dưỡng viên có 5 năm kinh nghiệm chăm sóc người cao tuổi và phục hồi chức năng.',
        experienceYears: 5,
        skills: ['Chăm sóc người cao tuổi', 'Chăm bệnh nhân tại viện', 'Vật lý trị liệu & Phục hồi chức năng'],
        serviceAreas: ['Ninh Kiều', 'Cái Răng', 'Bình Thủy'],
        hourlyRate: 100000,
        dailyRate: 700000,
        weeklyRate: 4500000,
        monthlyRate: 18000000,
        ratingAvg: 4.9,
        reviewCount: 32,
      },
      {
        email: 'hoa.caregiver@carelink.vn',
        password: 'password123',
        fullName: 'Trần Thị Hoa',
        phone: '0901234568',
        avatarUrl: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=300&q=80',
        idCardNumber: '079199002345',
        bio: 'Y sĩ đa khoa tận tâm, chuyên chăm sóc bệnh nhân sau phẫu thuật và người lớn tuổi.',
        experienceYears: 4,
        skills: ['Chăm sóc người cao tuổi', 'Chăm bệnh nhân tại viện', 'Chăm sóc vết thương & Thay băng'],
        serviceAreas: ['Ninh Kiều', 'Ô Môn'],
        hourlyRate: 90000,
        dailyRate: 650000,
        weeklyRate: 4200000,
        monthlyRate: 17000000,
        ratingAvg: 4.8,
        reviewCount: 24,
      },
      {
        email: 'an.caregiver@example.com',
        password: '123456',
        fullName: 'Nguyen Van An',
        phone: '0901234567',
        avatarUrl: 'https://i.pravatar.cc/300?img=12',
        idCardNumber: '079198009999',
        bio: 'Có 5 năm kinh nghiệm chăm sóc người cao tuổi và hỗ trợ sinh hoạt hàng ngày.',
        experienceYears: 5,
        skills: ['Chăm sóc người cao tuổi', 'Hỗ trợ sinh hoạt', 'Hỗ trợ đi lại'],
        serviceAreas: ['Ninh Kiều', 'Cần Thơ'],
        hourlyRate: 100000,
        dailyRate: 700000,
        weeklyRate: 4500000,
        monthlyRate: 18000000,
        ratingAvg: 4.8,
        reviewCount: 25,
      },
    ];

    for (const c of caregivers) {
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(c.password, salt);

      // 1. Tạo hoặc cập nhật Account
      let acc = await mongoose.connection.db.collection('accounts').findOne({ email: c.email });
      if (!acc) {
        const res = await mongoose.connection.db.collection('accounts').insertOne({
          email: c.email,
          passwordHash,
          role: 'CAREGIVER',
          isEmailVerified: true,
          reputationScore: 100,
          status: 'ACTIVE',
          otpCode: null,
          otpExpiresAt: null,
          refreshToken: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        acc = { _id: res.insertedId, ...c };
        console.log('✅ Đã tạo Account Caregiver mới:', c.email);
      } else {
        await mongoose.connection.db.collection('accounts').updateOne(
          { _id: acc._id },
          {
            $set: {
              passwordHash,
              role: 'CAREGIVER',
              isEmailVerified: true,
              status: 'ACTIVE',
              updatedAt: new Date(),
            },
          }
        );
        console.log('🔄 Đã cập nhật quyền CAREGIVER cho:', c.email);
      }

      // 2. Tạo hoặc cập nhật User
      let u = await mongoose.connection.db.collection('users').findOne({ accountId: acc._id });
      if (!u) {
        const res = await mongoose.connection.db.collection('users').insertOne({
          accountId: acc._id,
          fullName: c.fullName,
          phone: c.phone,
          avatarUrl: c.avatarUrl,
          gender: 'OTHER',
          dateOfBirth: null,
          role: 'caregiver',
          isActive: true,
          defaultAddress: { city: 'Cần Thơ', district: 'Ninh Kiều', ward: '', detail: '' },
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        u = { _id: res.insertedId };
        console.log('✅ Đã tạo hồ sơ User cho:', c.fullName);
      } else {
        await mongoose.connection.db.collection('users').updateOne(
          { _id: u._id },
          {
            $set: {
              fullName: c.fullName,
              phone: c.phone,
              avatarUrl: c.avatarUrl,
              role: 'caregiver',
              isActive: true,
              updatedAt: new Date(),
            },
          }
        );
      }

      // 3. Tạo hoặc cập nhật CaregiverProfile
      await mongoose.connection.db.collection('caregiverprofiles').updateOne(
        { accountId: acc._id },
        {
          $set: {
            accountId: acc._id,
            userId: u._id,
            fullName: c.fullName,
            phone: c.phone,
            avatarUrl: c.avatarUrl,
            idCardNumber: c.idCardNumber,
            idCardImages: [],
            bio: c.bio,
            approvalStatus: 'APPROVED',
            verificationStatus: 'VERIFIED',
            gender: 'OTHER',
            experienceYears: c.experienceYears,
            skills: c.skills,
            serviceAreas: c.serviceAreas,
            pricing: {
              hourlyRate: c.hourlyRate,
              dailyRate: c.dailyRate,
              weeklyRate: c.weeklyRate,
              monthlyRate: c.monthlyRate,
            },
            hourlyRate: c.hourlyRate,
            ratingAvg: c.ratingAvg,
            reviewCount: c.reviewCount,
            priorityScore: 100,
            updatedAt: new Date(),
          },
          $setOnInsert: {
            createdAt: new Date(),
          },
        },
        { upsert: true }
      );
      console.log('✅ Đã cập nhật CaregiverProfile (APPROVED) cho:', c.fullName);
    }

    console.log('\n🎉 Hoàn tất khởi tạo tài khoản Caregiver trong MongoDB!');
  } catch (err) {
    console.error('Lỗi khi seed Caregiver:', err);
  } finally {
    await mongoose.disconnect();
  }
}

seedCaregiverAccounts();
