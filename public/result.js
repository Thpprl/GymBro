document.addEventListener('DOMContentLoaded', () => {
    const resultDiv = document.getElementById('result');
    const workoutResults = JSON.parse(localStorage.getItem('workoutResults'));

    if (!workoutResults) {
        resultDiv.innerHTML = '<p>No workout plan found. Please create a workout plan first.</p>';
        return;
    }

    workoutResults.forEach(day => {
        const dayDiv = document.createElement('div');
        dayDiv.classList.add('day-plan');
        dayDiv.innerHTML = `<h3>${day.day}</h3>`;
        
        const exercisesList = document.createElement('ul');
        day.exercises.forEach(exercise => {
            const listItem = document.createElement('li');
            listItem.innerText = exercise;
            exercisesList.appendChild(listItem);
        });

        dayDiv.appendChild(exercisesList);
        resultDiv.appendChild(dayDiv);
    });
});
