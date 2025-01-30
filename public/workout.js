document.getElementById('workoutForm').addEventListener('submit', function(event) {
    event.preventDefault();

    const requiredFields = ['gender', 'goal', 'experience', 'equipment', 'days', 'length', 'age', 'email', 'name'];
    let allFieldsFilled = true;

    requiredFields.forEach(field => {
        const fieldValue = document.getElementById(field).value;
        if (!fieldValue) {
            allFieldsFilled = false;
            document.getElementById(field).classList.add('error');
        } else {
            document.getElementById(field).classList.remove('error');
        }
    });

    if (!allFieldsFilled) {
        alert('Please fill out all the required fields.');
        return;
    }

    const formData = {
        gender: document.getElementById('gender').value,
        goal: document.getElementById('goal').value,
        experience: document.getElementById('experience').value,
        equipment: document.getElementById('equipment').value,
        days: document.getElementById('days').value,
        length: document.getElementById('length').value,
        age: document.getElementById('age').value,
        email: document.getElementById('email').value,
        name: document.getElementById('name').value
    };

    console.log('Form Data:', formData);

    const workoutPlan = generateWorkoutPlan(formData);
    localStorage.setItem('workoutResults', JSON.stringify(workoutPlan));
    window.location.href = 'resultplan.html';
});

function generateWorkoutPlan(formData) {
    const plan = [];
    for (let i = 0; i < formData.days; i++) {
        plan.push({
            day: `Day ${i + 1}`,
            exercises: ['Push-Ups', 'Squats', 'Lunges', 'Planks']
        });
    }
    return plan;
}
