const express = require('express');
const router = express.Router();
const User = require('../models/User');

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;

    // ตรวจสอบอีเมลซ้ำ
    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: 'อีเมลนี้มีอยู่แล้ว' });

    const newUser = new User({ email, password });
    await newUser.save();
    res.status(201).json({ message: 'สมัครสมาชิกสำเร็จ' });
  } catch (error) {
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการสมัครสมาชิก' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'ไม่พบผู้ใช้' });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(401).json({ message: 'รหัสผ่านไม่ถูกต้อง' });

    res.status(200).json({ message: 'เข้าสู่ระบบสำเร็จ' });
  } catch (error) {
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ' });
  }
});

module.exports = router;
