document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const statusBox = document.getElementById('loginStatus');
  statusBox.textContent = '⏳ กำลังเข้าสู่ระบบ...';

  try {
    const res = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (!res.ok) throw new Error(data.message || 'เข้าสู่ระบบไม่สำเร็จ');

    // ✅ บันทึก token และ redirect ไปหน้าหลัก
    localStorage.setItem('token', data.token);
    localStorage.setItem('userEmail', data.user.email);
    statusBox.style.color = 'green';
    statusBox.textContent = '✅ เข้าสู่ระบบสำเร็จ! กำลังไปหน้า Dashboard...';

    setTimeout(() => {
      window.location.href = 'dashboard.html'; // หรือ workout.html ได้เลย
    }, 1000);

  } catch (err) {
    statusBox.style.color = 'red';
    statusBox.textContent = `❌ ${err.message}`;
    console.error('Login error:', err);
  }
});
