document.getElementById('aiWorkoutForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const formData = {
    goal: document.getElementById('goal').value,
    gender: document.getElementById('gender').value,
    age: document.getElementById('age').value,
    weight: document.getElementById('weight').value,
    height: document.getElementById('height').value,
    experience: document.getElementById('experience').value,
    equipment: document.getElementById('equipment').value,
    daysPerWeek: document.getElementById('days').value,
    duration: document.getElementById('duration').value
  };

  try {
    const resultBox = document.getElementById('aiPlanResult');
    resultBox.innerHTML = `<p>⏳ กำลังวิเคราะห์แผนจาก AI...</p>`;

    const res = await fetch('http://localhost:5000/api/analyze-plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });

    const data = await res.json();

    if (!res.ok || !data.plan) {
      throw new Error(data.message || 'ไม่สามารถสร้างแผนได้');
    }

    resultBox.innerHTML = `
      <h2>✅ แผนที่ได้จาก AI</h2>
      <pre>${data.plan}</pre>
    `;
  } catch (err) {
    console.error(err);
    document.getElementById('aiPlanResult').innerHTML = `<p style="color:red;">❌ เกิดข้อผิดพลาด: ${err.message}</p>`;
  }
});
