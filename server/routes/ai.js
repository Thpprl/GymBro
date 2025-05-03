const express = require('express');
const router = express.Router();
const axios = require('axios');

// 🧠 ฟังก์ชันแปลงค่า goal
function mapGoal(goal) {
  switch (goal) {
    case 'lose_weight': return 'ลดน้ำหนัก';
    case 'build_muscle': return 'เพิ่มกล้ามเนื้อ';
    case 'increase_endurance': return 'เพิ่มความทนทาน';
    default: return goal;
  }
}

// 🧠 ฟังก์ชันแปลงค่า gender
function map(gender) {
  switch (gender) {
    case 'male': return 'ชาย';
    case 'female': return 'หญิง';
    case 'other': return 'อื่นๆ';
    default: return gender;
  }
}

// 🧠 ฟังก์ชันแปลงระดับประสบการณ์
function mapExperience(level) {
  switch (level) {
    case 'beginner': return 'มือใหม่';
    case 'intermediate': return 'ระดับกลาง';
    case 'advanced': return 'เชี่ยวชาญ';
    default: return level;
  }
}

router.post('/analyze-plan', async (req, res) => {
  const { goal, gender, age, weight, height, experience, equipment, daysPerWeek, duration } = req.body;

  const prompt = `
คุณคือโค้ชฟิตเนสมืออาชีพ โปรดสร้างแผนออกกำลังกายสำหรับผู้ใช้โดยอ้างอิงข้อมูลต่อไปนี้:

- เป้าหมาย: ${mapGoal(goal)}
- เพศ: ${map(gender)}
- อายุ: ${age} ปี
- น้ำหนัก: ${weight} กิโลกรัม
- ส่วนสูง: ${height} เซนติเมตร
- ระดับความชำนาญ: ${mapExperience(experience)}
- อุปกรณ์ที่มี: ${equipment || 'ไม่มี'}
- จำนวนวันที่ออกกำลังกายต่อสัปดาห์: ${daysPerWeek} วัน
- ระยะเวลาต่อวัน: ${duration} นาที

โปรดจัดแผนออกกำลังกายเป็นรายวัน เช่น Day 1, Day 2, พร้อมคำแนะนำที่เข้าใจง่ายและใช้ภาษาไทยทั้งหมด
`;

  try {
    const response = await axios.post('http://localhost:11434/api/generate', {
      model: 'llama3',
      prompt: prompt,
      stream: false
    });

    const result = response.data?.response?.trim();
    if (!result) throw new Error('ไม่ได้รับแผนจาก Ollama');

    res.json({ plan: result });
  } catch (err) {
    console.error('❌ Ollama error:', err.message);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดจากระบบ AI (Ollama)' });
  }
});

module.exports = router;
