// Main variables
let detector;
const video = document.getElementById('videoDisplay');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
let cameraStream;
let isRealTime = false;
let currentExercise = "ยังไม่พบท่าออกกำลังกาย";

// Initialize MoveNet model
async function initModel() {
  try {
    detector = await poseDetection.createDetector(
      poseDetection.SupportedModels.MoveNet
    );
    console.log('Model loaded successfully');
    document.getElementById('feedback').textContent = '✅ โมเดลพร้อมใช้งานแล้ว';
    
    // Create exercise display element if it doesn't exist
    if (!document.getElementById('exerciseDisplay')) {
      createExerciseDisplay();
    }
  } catch (error) {
    console.error('Error loading model:', error);
    document.getElementById('feedback').textContent = '❌ ไม่สามารถโหลดโมเดลได้';
  }
}

// Calculate angle between three points
function getAngle(A, B, C) {
  if (!A || !B || !C) return 0;
  
  const AB = { x: B.x - A.x, y: B.y - A.y };
  const CB = { x: B.x - C.x, y: B.y - C.y };
  const dot = AB.x * CB.x + AB.y * CB.y;
  const magAB = Math.sqrt(AB.x ** 2 + AB.y ** 2);
  const magCB = Math.sqrt(CB.x ** 2 + CB.y ** 2);
  
  // Avoid division by zero
  if (magAB === 0 || magCB === 0) return 0;
  
  // Clamp the value to avoid NaN from floating point errors
  const cosValue = Math.max(-1, Math.min(1, dot / (magAB * magCB)));
  const angleRad = Math.acos(cosValue);
  return (angleRad * 180) / Math.PI;
}

// Create a map of keypoints for easier access
function createKeypointMap(keypoints) {
  const keypointMap = {};
  const keypointNames = [
    'nose', 'left_eye', 'right_eye', 'left_ear', 'right_ear',
    'left_shoulder', 'right_shoulder', 'left_elbow', 'right_elbow',
    'left_wrist', 'right_wrist', 'left_hip', 'right_hip',
    'left_knee', 'right_knee', 'left_ankle', 'right_ankle'
  ];
  
  for (let i = 0; i < keypoints.length && i < keypointNames.length; i++) {
    if (keypoints[i] && keypoints[i].score > 0.5) {
      keypointMap[keypointNames[i]] = keypoints[i];
    }
  }
  
  return keypointMap;
}

// Recognize exercise pose
function recognizeExercise(keypointMap) {
  try {
    // Check for squat
    if (keypointMap.left_hip && keypointMap.left_knee && keypointMap.left_ankle &&
        keypointMap.right_hip && keypointMap.right_knee && keypointMap.right_ankle) {
      
      const kneeAngleLeft = getAngle(keypointMap.left_hip, keypointMap.left_knee, keypointMap.left_ankle);
      const kneeAngleRight = getAngle(keypointMap.right_hip, keypointMap.right_knee, keypointMap.right_ankle);
      
      if (kneeAngleLeft < 120 && kneeAngleRight < 120) {
        return "สควอท";
      }
    }
    
    // Check for push-up or plank
    if (keypointMap.left_shoulder && keypointMap.left_elbow && keypointMap.left_wrist &&
        keypointMap.right_shoulder && keypointMap.right_elbow && keypointMap.right_wrist &&
        keypointMap.left_hip && keypointMap.right_hip) {
        
      const armAngleLeft = getAngle(keypointMap.left_shoulder, keypointMap.left_elbow, keypointMap.left_wrist);
      const armAngleRight = getAngle(keypointMap.right_shoulder, keypointMap.right_elbow, keypointMap.right_wrist);
      
      // If arms are bent, it's likely a push-up
      if (armAngleLeft < 160 || armAngleRight < 160) {
        return "วิดพื้น";
      }
      
      // If body is horizontal, it might be a plank
      if (keypointMap.left_shoulder && keypointMap.left_hip && keypointMap.left_ankle) {
        const backAngle = getAngle(keypointMap.left_shoulder, keypointMap.left_hip, keypointMap.left_ankle);
        if (backAngle > 160 && backAngle < 200) {
          return "แพลงก์";
        }
      }
    }
    
    // Check for lunge
    if (keypointMap.left_hip && keypointMap.left_knee && keypointMap.left_ankle &&
        keypointMap.right_hip && keypointMap.right_knee && keypointMap.right_ankle) {
      
      const kneeHeightDiff = Math.abs(keypointMap.left_knee.y - keypointMap.right_knee.y);
      if (kneeHeightDiff > 40) {
        return "ลันจ์";
      }
    }
    
    return null;
  } catch (error) {
    console.error("Error in exercise recognition:", error);
    return null;
  }
}

// Draw skeleton on canvas
function drawSkeleton(pose) {
  try {
    const keypoints = pose.keypoints;
    const connections = [
      [11, 13], [13, 15],
      [12, 14], [14, 16],
      [5, 7], [7, 9],
      [6, 8], [8, 10],
      [5, 6], [5, 11], [6, 12], [11, 12]
    ];

    ctx.lineWidth = 3;
    ctx.strokeStyle = 'lightblue';

    for (const [startIdx, endIdx] of connections) {
      if (startIdx < keypoints.length && endIdx < keypoints.length) {
        const startPoint = keypoints[startIdx];
        const endPoint = keypoints[endIdx];

        if (startPoint && endPoint && startPoint.score > 0.5 && endPoint.score > 0.5) {
          ctx.beginPath();
          ctx.moveTo(startPoint.x, startPoint.y);
          ctx.lineTo(endPoint.x, endPoint.y);
          ctx.stroke();
        }
      }
    }

    for (const kp of keypoints) {
      if (kp && kp.score > 0.5) {
        ctx.beginPath();
        ctx.arc(kp.x, kp.y, 5, 0, 2 * Math.PI);
        ctx.fillStyle = 'red';
        ctx.fill();
      }
    }
  } catch (error) {
    console.error("Error drawing skeleton:", error);
  }
}

// Analyze pose and provide feedback
function analyzePose(pose) {
  try {
    const keypoints = pose.keypoints;
    let feedback = [];
    const keypointMap = createKeypointMap(keypoints);
    const detectedExercise = recognizeExercise(keypointMap);
    if (detectedExercise) {
      currentExercise = detectedExercise;
      feedback.push(`🏋️ กำลังทำท่า: ${currentExercise}`);

      if (currentExercise === "สควอท") {
        const kneeAngleLeft = getAngle(keypointMap.left_hip, keypointMap.left_knee, keypointMap.left_ankle);
        const kneeAngleRight = getAngle(keypointMap.right_hip, keypointMap.right_knee, keypointMap.right_ankle);
        if (kneeAngleLeft < 70 || kneeAngleRight < 70) {
          feedback.push("⚠️ ย่อลึกเกินไป อาจเพิ่มแรงกดบนเข่า");
        }
        if (keypointMap.left_knee && keypointMap.left_ankle && keypointMap.left_knee.x > keypointMap.left_ankle.x + 30) {
          feedback.push("📐 เข่าซ้ายเลยปลายเท้ามากเกินไป");
        }
        if (keypointMap.right_knee && keypointMap.right_ankle && keypointMap.right_knee.x < keypointMap.right_ankle.x - 30) {
          feedback.push("📐 เข่าขวาเลยปลายเท้ามากเกินไป");
        }
      }

      else if (currentExercise === "แพลงก์") {
        const hipHeight = keypointMap.left_hip?.y;
        const shoulderHeight = keypointMap.left_shoulder?.y;
        if (hipHeight && shoulderHeight) {
          if (hipHeight < shoulderHeight - 20) {
            feedback.push("⬆️ สะโพกสูงเกินไป");
          } else if (hipHeight > shoulderHeight + 20) {
            feedback.push("⬇️ สะโพกต่ำเกินไป");
          }
        }
        const backAngle = getAngle(keypointMap.left_shoulder, keypointMap.left_hip, keypointMap.left_ankle);
        if (backAngle < 160 || backAngle > 200) {
          feedback.push("📏 ลำตัวไม่อยู่ในแนวตรง");
        }
      }

      else if (currentExercise === "วิดพื้น") {
        const backAngle = getAngle(keypointMap.left_shoulder, keypointMap.left_hip, keypointMap.left_knee);
        if (backAngle < 160) {
          feedback.push("📏 หลังโค้งเกินไป");
        }
        const elbowAngle = getAngle(keypointMap.left_shoulder, keypointMap.left_elbow, keypointMap.left_wrist);
        if (elbowAngle < 90) {
          feedback.push("💪 งอศอกมากเกินไป");
        }
        const hipHeight = keypointMap.left_hip?.y;
        const shoulderHeight = keypointMap.left_shoulder?.y;
        if (hipHeight > shoulderHeight + 40) {
          feedback.push("⬇️ สะโพกต่ำเกินไป");
        }
      }

      else if (currentExercise === "ลันจ์") {
        const frontKnee = keypointMap.left_knee.y > keypointMap.right_knee.y ? "left_knee" : "right_knee";
        const frontAnkle = frontKnee === "left_knee" ? "left_ankle" : "right_ankle";
        const frontHip = frontKnee === "left_knee" ? "left_hip" : "right_hip";
        const kneeAngle = getAngle(keypointMap[frontHip], keypointMap[frontKnee], keypointMap[frontAnkle]);
        if (kneeAngle < 80 || kneeAngle > 100) {
          feedback.push("📐 พยายามให้เข่าหน้าทำมุม 90 องศา");
        }
        if (keypointMap[frontKnee] && keypointMap[frontAnkle] && keypointMap[frontKnee].x > keypointMap[frontAnkle].x + 30) {
          feedback.push("⚠️ เข่าหน้ายื่นเกินปลายเท้า");
        }
        const torsoAngle = getAngle(keypointMap.left_shoulder, keypointMap.left_hip, keypointMap.left_knee);
        if (torsoAngle < 150) {
          feedback.push("🧍‍♀️ ลำตัวเอนไปด้านหน้าเกินไป");
        }
      }

    } else {
      currentExercise = "ยังไม่พบท่าออกกำลังกาย";
      feedback.push(`⚠️ ${currentExercise} หรือกำลังอยู่ระหว่างท่า`);
    }

    const exerciseDisplay = document.getElementById('exerciseDisplay');
    if (exerciseDisplay) {
      exerciseDisplay.textContent = `ท่าออกกำลังกาย: ${currentExercise}`;
    }

    return feedback.length > 0
      ? `<ul style="padding-left: 20px;">${feedback.map(f => `<li>${f}</li>`).join('')}</ul>`
      : "✅ ท่าทางดูดีแล้ว";
  } catch (error) {
    console.error("Error analyzing pose:", error);
    return "❌ เกิดข้อผิดพลาดในการวิเคราะห์ท่าทาง";
  }
}


// Create exercise display element
function createExerciseDisplay() {
  try {
    // Find container or create one if needed
    let container = document.querySelector('.container');
    if (!container) {
      container = document.getElementById('videoDisplay').parentElement;
    }
    
    // Create exercise display element
    const exerciseDisplay = document.createElement('div');
    exerciseDisplay.id = 'exerciseDisplay';
    exerciseDisplay.style.backgroundColor = '#333';
    exerciseDisplay.style.color = '#fff';
    exerciseDisplay.style.padding = '10px';
    exerciseDisplay.style.margin = '10px 0';
    exerciseDisplay.style.borderRadius = '5px';
    exerciseDisplay.style.fontWeight = 'bold';
    exerciseDisplay.textContent = `ท่าออกกำลังกาย: ${currentExercise}`;
    
    // Insert after video or at the top of container
    const feedbackElement = document.getElementById('feedback');
    if (feedbackElement) {
      container.insertBefore(exerciseDisplay, feedbackElement);
    } else {
      container.appendChild(exerciseDisplay);
    }
    
    return exerciseDisplay;
  } catch (error) {
    console.error("Error creating exercise display:", error);
    return null;
  }
}

// Real-time pose detection
async function detectRealTimePose() {
  if (!detector || !isRealTime) return;
  try {
    const poses = await detector.estimatePoses(video);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    if (poses.length > 0) {
      const pose = poses[0];
      drawSkeleton(pose);
      document.getElementById('feedback').innerHTML = analyzePose(pose);
    } else {
      document.getElementById('feedback').textContent = "⚠️ ไม่พบคนในภาพ";
      
      // Reset exercise display
      const exerciseDisplay = document.getElementById('exerciseDisplay');
      if (exerciseDisplay) {
        exerciseDisplay.textContent = "ท่าออกกำลังกาย: ไม่พบคนในภาพ";
      }
    }
    
    if (isRealTime) {
      // Use setTimeout instead of requestAnimationFrame to reduce CPU usage
      setTimeout(() => {
        requestAnimationFrame(detectRealTimePose);
      }, 100); // Throttle to 10 FPS
    }
  } catch (error) {
    console.error('Error in pose detection:', error);
    document.getElementById('feedback').textContent = "❌ เกิดข้อผิดพลาดในการวิเคราะห์";
    isRealTime = false;
  }
}

// Start camera
document.getElementById('startCameraButton').addEventListener('click', async () => {
  try {
    if (cameraStream) cameraStream.getTracks().forEach(track => track.stop());
    
    cameraStream = await navigator.mediaDevices.getUserMedia({ 
      video: { 
        width: { ideal: 640 }, 
        height: { ideal: 480 },
        facingMode: 'user' 
      } 
    });
    
    video.srcObject = cameraStream;
    video.onloadedmetadata = () => {
      video.play();
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      document.getElementById('feedback').textContent = '📡 เริ่มวิเคราะห์...';
      
      // Create exercise display if it doesn't exist
      if (!document.getElementById('exerciseDisplay')) {
        createExerciseDisplay();
      }
      
      isRealTime = true;
      detectRealTimePose();
    };
  } catch (error) {
    console.error('Camera error:', error);
    document.getElementById('feedback').textContent = `⚠️ ไม่สามารถเปิดกล้องได้: ${error.message}`;
  }
});

// Stop camera
document.getElementById('stopCameraButton').addEventListener('click', () => {
  try {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      video.srcObject = null;
    }
    isRealTime = false;
    document.getElementById('feedback').textContent = '🛑 กล้องถูกปิดแล้ว';
  } catch (error) {
    console.error('Error stopping camera:', error);
  }
});

// Handle video file upload
document.getElementById('videoFileInput').addEventListener('change', (event) => {
  try {
    const file = event.target.files[0];
    if (!file) return;
    
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      video.srcObject = null;
    }
    
    isRealTime = false;
    const videoURL = URL.createObjectURL(file);
    video.src = videoURL;
    
    video.onloadedmetadata = () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      document.getElementById('feedback').textContent = '📁 วิดีโอพร้อมเล่น กดปุ่มเล่นเพื่อวิเคราะห์';
      
      // Create exercise display if it doesn't exist
      if (!document.getElementById('exerciseDisplay')) {
        createExerciseDisplay();
      }
      
      video.play();
      
      // Process video frames at a lower rate
      let lastFrameTime = 0;
      const frameInterval = 100; // Process at 10 fps
      
      function analyzeFrame(timestamp) {
        if (video.paused || video.ended) return;
        
        // Throttle frame processing
        if (timestamp - lastFrameTime >= frameInterval) {
          lastFrameTime = timestamp;
          
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          
          detector.estimatePoses(video).then(poses => {
            if (poses.length > 0) {
              const pose = poses[0];
              drawSkeleton(pose);
              document.getElementById('feedback').innerHTML = analyzePose(pose);
            }
          }).catch(error => {
            console.error('Error analyzing video frame:', error);
          });
        }
        
        requestAnimationFrame(analyzeFrame);
      }
      
      requestAnimationFrame(analyzeFrame);
    };
  } catch (error) {
    console.error('Error handling video file:', error);
    document.getElementById('feedback').textContent = `❌ เกิดข้อผิดพลาดในการโหลดวิดีโอ: ${error.message}`;
  }
});

// Initialize model
initModel();