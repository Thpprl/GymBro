async function init() {
    try {
        const detector = await poseDetection.createDetector(poseDetection.SupportedModels.MoveNet);
        document.getElementById('analyzeButton').addEventListener('click', async () => {
            const video = document.getElementById('videoUpload').files[0];
            if (!video) {
                alert('Please select a video file.');
                return;
            }

            const videoElement = document.getElementById('videoDisplay');
            const videoURL = URL.createObjectURL(video);
            videoElement.src = videoURL;

            videoElement.onloadedmetadata = async () => {
                try {
                    const poses = await analyzeVideoEverySecond(videoElement, detector);
                    const feedback = analyzeExercises(poses);
                    document.getElementById('results').innerHTML = `<pre>${formatResults(poses)}</pre>`;
                    document.getElementById('feedback').innerText = feedback;
                } catch (error) {
                    alert('Error analyzing video: ' + error.message);
                }
            };

            videoElement.onerror = () => {
                alert('Error loading video. Please try a different file.');
            };
        });
    } catch (error) {
        alert('Error initializing detector: ' + error.message);
    }
}

async function analyzeVideoEverySecond(videoElement, detector) {
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');

    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;

    const poses = [];

    videoElement.play();

    videoElement.addEventListener('timeupdate', async () => {
        if (Math.floor(videoElement.currentTime) !== Math.floor(videoElement.currentTime - videoElement.playbackRate)) {
            const [pose] = await detector.estimatePoses(videoElement);
            if (pose.keypoints) {
                poses.push(pose);
                drawSkeleton(ctx, pose);
            }
        }
    });

    return new Promise((resolve) => {
        videoElement.onended = () => {
            resolve(poses);
        };
    });
}

function drawSkeleton(ctx, pose) {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    pose.keypoints.forEach(point => {
        if (point.score > 0.5) {
            ctx.beginPath();
            ctx.arc(point.x, point.y, 5, 0, 2 * Math.PI);
            ctx.fillStyle = 'red';
            ctx.fill();
        }
    });

    const adjacentKeyPoints = poseDetection.util.getAdjacentKeyPoints(pose.keypoints, 0.5);
    adjacentKeyPoints.forEach(keypoints => {
        ctx.beginPath();
        ctx.moveTo(keypoints[0].x, keypoints[0].y);
        ctx.lineTo(keypoints[1].x, keypoints[1].y);
        ctx.strokeStyle = 'green';
        ctx.stroke();
    });
}

function analyzeExercises(poses) {
    const feedback = [];
    feedback.push(analyzeSquatForm(poses));
    feedback.push(analyzeLateralLunge(poses));
    feedback.push(analyzePushUpForm(poses));
    feedback.push(analyzeLungeForm(poses));
    return feedback.join('\n');
}

function analyzeSquatForm(poses) {
    let feedback = "Squat Form:\n";
    poses.forEach(pose => {
        const keypoints = pose.keypoints;
        const kneeAngle = calculateAngle(keypoints[11], keypoints[13], keypoints[15]);
        if (kneeAngle < 90) {
            feedback += 'Your squat knee angle is less than 90 degrees. Try to go deeper.\n';
        } else {
            feedback += 'Great form! Your squat knee angle is perfect.\n';
        }
    });
    return feedback;
}

function analyzeLateralLunge(poses) {
    let feedback = "Lateral Lunge Form:\n";
    poses.forEach(pose => {
        const keypoints = pose.keypoints;
        const kneeAngle = calculateAngle(keypoints[11], keypoints[13], keypoints[15]);
        if (kneeAngle < 90) {
            feedback += 'Your lateral lunge knee angle is less than 90 degrees. Try to step further.\n';
        } else {
            feedback += 'Great form! Your lateral lunge knee angle is perfect.\n';
        }
    });
    return feedback;
}

function analyzePushUpForm(poses) {
    let feedback = "Push-Up Form:\n";
    poses.forEach(pose => {
        const keypoints = pose.keypoints;
        const elbowAngle = calculateAngle(keypoints[11], keypoints[13], keypoints[15]);
        if (elbowAngle < 90) {
            feedback += 'Your push-up elbow angle is less than 90 degrees. Lower your body more.\n';
        } else {
            feedback += 'Great form! Your push-up elbow angle is perfect.\n';
        }
    });
    return feedback;
}

function analyzeLungeForm(poses) {
    let feedback = "Lunge Form:\n";
    poses.forEach(pose => {
        const keypoints = pose.keypoints;
        const kneeAngle = calculateAngle(keypoints[11], keypoints[13], keypoints[15]);
        if (kneeAngle < 90) {
            feedback += 'Your lunge knee angle is less than 90 degrees. Try to step further.\n';
        } else {
            feedback += 'Great form! Your lunge knee angle is perfect.\n';
        }
    });
    return feedback;
}

function calculateAngle(pointA, pointB, pointC) {
    const radians = Math.atan2(pointC.y - pointB.y, pointC.x - pointB.x) - Math.atan2(pointA.y - pointB.y, pointA.x - pointB.x);
    return Math.abs(radians * 180.0 / Math.PI);
}

function formatResults(poses) {
    return poses.map(pose => {
        return pose.keypoints.map(keypoint => `**${keypoint.name}**: (${Math.round(keypoint.x)}, ${Math.round(keypoint.y)})`).join('\n');
    }).join('\n\n');
}

init();
