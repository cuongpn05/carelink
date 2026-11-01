const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const { Account, User, CareRequest } = require('../models');

async function seedCareRequests() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB:', mongoose.connection.name);

    // Find or create customer
    let customer = await Account.findOne({ role: 'CUSTOMER' });
    if (!customer) {
      console.log('No customer found, finding any account...');
      customer = await Account.findOne();
    }

    if (!customer) {
      console.log('No account found to seed care requests.');
      process.exit(0);
    }

    const customerUser = await User.findOne({ accountId: customer._id });
    console.log(`Using customer: ${customer.email} (${customerUser?.fullName || 'User'})`);

    const existingCount = await CareRequest.countDocuments();
    if (existingCount > 0) {
      console.log(`CareRequest already has ${existingCount} records. Ensuring at least some OPEN requests exist...`);
    }

    const sampleRequests = [
      {
        customerId: customer._id,
        serviceCategory: 'elderly-care',
        title: 'Cần người hỗ trợ chăm sóc mẹ 78 tuổi tại nhà (Quận Ninh Kiều)',
        description: 'Mẹ tôi 78 tuổi, đi lại chậm và vừa mổ đục thủy tinh thể cần người trò chuyện, hỗ trợ ăn uống nhẹ, nhắc uống thuốc đúng giờ và dìu đi bộ trong sân mỗi chiều.',
        recipient: {
          name: 'Bà Nguyễn Thị Huệ',
          age: 78,
          gender: 'FEMALE',
          relationship: 'Mẹ',
          conditionNotes: 'Mắt nhìn còn mờ sau phẫu thuật, huyết áp ổn định, ăn uống nhẹ nhàng.',
        },
        location: {
          address: '45 Đường 30 Tháng 4, Phường Hưng Lợi',
          area: 'Ninh Kiều',
          city: 'Cần Thơ',
        },
        schedule: {
          startDate: new Date(Date.now() + 24 * 3600 * 1000),
          endDate: new Date(Date.now() + 15 * 24 * 3600 * 1000),
          timeSlot: '07:30 - 11:30 (Ca sáng)',
          dailyHours: 4,
          frequency: 'DAILY',
        },
        expectedBudget: 350000,
        specialRequirements: ['Biết sơ cứu cơ bản', 'Giao tiếp nhẹ nhàng', 'Có kinh nghiệm người cao tuổi'],
        status: 'OPEN',
      },
      {
        customerId: customer._id,
        serviceCategory: 'post-treatment-care',
        title: 'Chăm sóc người bệnh sau mổ dây chằng gối tại nhà',
        description: 'Tôi cần một điều dưỡng hoặc chuyên viên phục hồi chức năng hỗ trợ thay băng vết thương, tập co duỗi khớp gối theo hướng dẫn bác sĩ và hỗ trợ sinh hoạt buổi chiều.',
        recipient: {
          name: 'Trần Văn Phong',
          age: 42,
          gender: 'MALE',
          relationship: 'Bản thân',
          conditionNotes: 'Mổ nội soi tái tạo dây chằng chéo trước tuần thứ 2, chân còn nẹp cố định.',
        },
        location: {
          address: '128 Nguyễn Trãi, Phường An Hội',
          area: 'Ninh Kiều',
          city: 'Cần Thơ',
        },
        schedule: {
          startDate: new Date(Date.now() + 48 * 3600 * 1000),
          endDate: new Date(Date.now() + 30 * 24 * 3600 * 1000),
          timeSlot: '14:00 - 18:00 (Ca chiều)',
          dailyHours: 4,
          frequency: 'WEEKDAYS',
        },
        expectedBudget: 450000,
        specialRequirements: ['Có chứng chỉ điều dưỡng', 'Kỹ năng thay băng vô trùng', 'Biết tập vật lý trị liệu cơ bản'],
        status: 'OPEN',
      },
      {
        customerId: customer._id,
        serviceCategory: 'child-care',
        title: 'Chăm sóc bé 3 tuổi và hỗ trợ rèn luyện phát triển kỹ năng',
        description: 'Gia đình cần tìm cô chăm sóc bé 3 tuổi trong lúc bố mẹ đi làm. Bé ngoan, thích vẽ và đọc sách thiếu nhi. Cần người có tâm, sạch sẽ và yêu trẻ nhỏ.',
        recipient: {
          name: 'Bé Lê Bảo Nam',
          age: 3,
          gender: 'MALE',
          relationship: 'Con',
          conditionNotes: 'Khỏe mạnh, hiếu động, không dị ứng thức ăn.',
        },
        location: {
          address: '88 Võ Văn Kiệt, Phường An Hòa',
          area: 'Bình Thủy',
          city: 'Cần Thơ',
        },
        schedule: {
          startDate: new Date(Date.now() + 72 * 3600 * 1000),
          endDate: new Date(Date.now() + 60 * 24 * 3600 * 1000),
          timeSlot: '08:00 - 17:00 (Cả ngày)',
          dailyHours: 8,
          frequency: 'WEEKDAYS',
        },
        expectedBudget: 600000,
        specialRequirements: ['Yêu trẻ, trung thực', 'Không dùng điện thoại trong giờ chăm sóc bé', 'Biết chuẩn bị thức ăn dặm'],
        status: 'OPEN',
      },
      {
        customerId: customer._id,
        serviceCategory: 'home-care',
        title: 'Chăm sóc tại nhà toàn diện cho người ốm mệt',
        description: 'Hỗ trợ sinh hoạt hàng ngày, chuẩn bị bữa ăn dinh dưỡng, dọn dẹp phòng ngủ người bệnh và đồng hành đi dạo buổi sáng.',
        recipient: {
          name: 'Cô Trần Kim Loan',
          age: 65,
          gender: 'FEMALE',
          relationship: 'Mẹ',
          conditionNotes: 'Mệt mỏi sau đợt sốt xuất huyết, cần bồi bổ dinh dưỡng và theo dõi sinh hiệu.',
        },
        location: {
          address: '24 Đường Cách Mạng Tháng 8, Phường Cái Khế',
          area: 'Ninh Kiều',
          city: 'Cần Thơ',
        },
        schedule: {
          startDate: new Date(Date.now() + 24 * 3600 * 1000),
          endDate: new Date(Date.now() + 7 * 24 * 3600 * 1000),
          timeSlot: '08:00 - 12:00',
          dailyHours: 4,
          frequency: 'DAILY',
        },
        expectedBudget: 380000,
        specialRequirements: ['Đo huyết áp, nhiệt độ', 'Biết nấu các món cháo súp dinh dưỡng'],
        status: 'OPEN',
      },
    ];

    if (existingCount === 0) {
      await CareRequest.insertMany(sampleRequests);
      console.log(`Successfully seeded ${sampleRequests.length} Care Requests!`);
    } else {
      // Check if open requests exist
      const openCount = await CareRequest.countDocuments({ status: 'OPEN' });
      if (openCount === 0) {
        await CareRequest.insertMany(sampleRequests);
        console.log(`Added ${sampleRequests.length} open Care Requests!`);
      } else {
        console.log(`Already has ${openCount} OPEN requests.`);
      }
    }

    process.exit(0);
  } catch (error) {
    console.error('Lỗi khi seed care requests:', error);
    process.exit(1);
  }
}

seedCareRequests();
