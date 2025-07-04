import {
    HandLandmarker,
    FilesetResolver
  } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0";
import { handleInput} from "./script.js";

// Add this at the top with other variables
let isPinching = false;
let lastPinchTime = 0;
const PINCH_START_THRESHOLD = 0.07;  // Must be THIS close to start
const PINCH_END_THRESHOLD = 0.23;    // Must be THIS far to end
const PINCH_COOLDOWN_MS = 700;       // Minimum time between changes
let pinchStartPosition = null;
let moveRegistered = false; // New flag to track if move was made
const MIN_SWIPE_DISTANCE_X = 0.10; // 30% smaller than before (was ~0.15)
const MIN_SWIPE_DISTANCE_Y = 0.15; // Kept Y-axis same
const SWIPE_RATIO = 1.3; // X-axis multiplier for sensitivity
  
  // const demosSection = document.getElementById("demos");
  
  let handLandmarker = undefined;
  let runningMode = "IMAGE";
  let enableWebcamButton;
  let webcamRunning = false;

  const flip_btn = document.getElementById('flip_webcam');
  const webcam = document.getElementById('webcam');
  const output_canvas = document.getElementById('output_canvas');

  flip_btn.addEventListener('click',()=>{
    webcam.classList.toggle('flip');
    output_canvas.classList.toggle('flip');
  })

  // Before we can use HandLandmarker class we must wait for it to finish
  // loading. Machine Learning models can be large and take a moment to
  // get everything needed to run.
  const createHandLandmarker = async () => {
    const vision = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm"
    );
    handLandmarker = await HandLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: `https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task`,
        delegate: "GPU"
      },
      runningMode: runningMode,
      numHands: 1
    });
    // demosSection.classList.remove("invisible");
  };
  createHandLandmarker();
  
  /********************************************************************
  // Demo 1: Grab a bunch of images from the page and detection them
  // upon click.
  ********************************************************************/
  
  // In this demo, we have put all our clickable images in divs with the
  // CSS class 'detectionOnClick'. Lets get all the elements that have
  // this class.
  // const imageContainers = document.getElementsByClassName("detectOnClick");
  
  // // Now let's go through all of these and add a click event listener.
  // for (let i = 0; i < imageContainers.length; i++) {
  //   // Add event listener to the child element whichis the img element.
  //   imageContainers[i].children[0].addEventListener("click", handleClick);
  // }
  
  // When an image is clicked, let's detect it and display results!
  // async function handleClick(event) {
  //   if (!handLandmarker) {
  //     console.log("Wait for handLandmarker to load before clicking!");
  //     return;
  //   }
  
  //   if (runningMode === "VIDEO") {
  //     runningMode = "IMAGE";
  //     await handLandmarker.setOptions({ runningMode: "IMAGE" });
  //   }
  //   // Remove all landmarks drawed before
  //   const allCanvas = event.target.parentNode.getElementsByClassName("canvas");
  //   for (var i = allCanvas.length - 1; i >= 0; i--) {
  //     const n = allCanvas[i];
  //     n.parentNode.removeChild(n);
  //   }
  
  //   // We can call handLandmarker.detect as many times as we like with
  //   // different image data each time. This returns a promise
  //   // which we wait to complete and then call a function to
  //   // print out the results of the prediction.
  //   const handLandmarkerResult = handLandmarker.detect(event.target);
  //   console.log(handLandmarkerResult.handednesses[0][0]);
  //   const canvas = document.createElement("canvas");
  //   canvas.setAttribute("class", "canvas");
  //   canvas.setAttribute("width", event.target.naturalWidth + "px");
  //   canvas.setAttribute("height", event.target.naturalHeight + "px");
  //   canvas.style =
  //     "left: 0px;" +
  //     "top: 0px;" +
  //     "width: " +
  //     event.target.width +
  //     "px;" +
  //     "height: " +
  //     event.target.height +
  //     "px;";
  
  //   event.target.parentNode.appendChild(canvas);
  //   const cxt = canvas.getContext("2d");
  //   for (const landmarks of handLandmarkerResult.landmarks) {
  //     drawConnectors(cxt, landmarks, HAND_CONNECTIONS, {
  //       color: "#00FF00",
  //       lineWidth: 5
  //     });
  //     drawLandmarks(cxt, landmarks, { color: "#FF0000", lineWidth: 1 });
  //   }
  // }
  
  /********************************************************************
  // Demo 2: Continuously grab image from webcam stream and detect it.
  ********************************************************************/
  
  const video = document.getElementById("webcam") //as HTMLVideoElement;
  const canvasElement = document.getElementById(
    "output_canvas"
  ) // as HTMLCanvasElement;
  const canvasCtx = canvasElement.getContext("2d");
  
  // Check if webcam access is supported.
  const hasGetUserMedia = () => !!navigator.mediaDevices?.getUserMedia;
  
  // If webcam supported, add event listener to button for when user
  // wants to activate it.
  if (hasGetUserMedia()) {
    enableWebcamButton = document.getElementById("webcamButton");
    enableWebcamButton.addEventListener("click", enableCam);
  } else {
    console.warn("getUserMedia() is not supported by your browser");
  }
  
  // Enable the live webcam view and start detection.
  function enableCam(event) {
    if (!handLandmarker) {
      console.log("Wait! objectDetector not loaded yet.");
      return;
    }
  
    if (webcamRunning === true) {
      webcamRunning = false;
      enableWebcamButton.innerText = "ENABLE WEBCAM";
    } else {
      webcamRunning = true;
      
      // enableWebcamButton.innerText = "DISABLE WEBCAM";
      enableWebcamButton.classList.add("hide");
    }
  
    // getUsermedia parameters.
    const constraints = {
      video: true
    };
  
    // Activate the webcam stream.
    navigator.mediaDevices.getUserMedia(constraints).then((stream) => {
      video.srcObject = stream;
      video.addEventListener("loadeddata", predictWebcam);
    });
  }
  
  let lastVideoTime = -1;
  let results = undefined;
  // console.log(video);
  async function predictWebcam() {
    canvasElement.style.width = video.videoWidth;;
    canvasElement.style.height = video.videoHeight;
    canvasElement.width = video.videoWidth;
    canvasElement.height = video.videoHeight;
    
    // Now let's start detecting the stream.
    if (runningMode === "IMAGE") {
      runningMode = "VIDEO";
      await handLandmarker.setOptions({ runningMode: "VIDEO" });
    }
    let startTimeMs = performance.now();
    if (lastVideoTime !== video.currentTime) {
      lastVideoTime = video.currentTime;
      results = handLandmarker.detectForVideo(video, startTimeMs);
    }

    // Inside your predictWebcam() function, add this right after getting results:
if (results.landmarks && results.landmarks.length > 0) {
  const now = Date.now();
  const landmarks = results.landmarks[0];
  const thumbTip = landmarks[4];
  const indexTip = landmarks[8];
  
  const dx = thumbTip.x - indexTip.x;
  const dy = thumbTip.y - indexTip.y;
  const distance = Math.sqrt(dx * dx + dy * dy);

  // Only check for changes if cooldown has passed
  if (now - lastPinchTime > PINCH_COOLDOWN_MS) {
    if (!isPinching && distance < PINCH_START_THRESHOLD) {
      isPinching = true;
      lastPinchTime = now;
      console.log("PINCH STARTED 👌");
    } 
    else if (isPinching && distance > PINCH_END_THRESHOLD) {
      isPinching = false;
      lastPinchTime = now;
      console.log("PINCH RELEASED 🖐️");
    }
  }

  // Inside your detection logic (after pinch detection):
if (isPinching) {
  const currentPos = results.landmarks[0][0];
  
  if (!pinchStartPosition) {
    pinchStartPosition = { x: currentPos.x, y: currentPos.y };
    moveRegistered = false; // Reset on new pinch
  }
  
  if (!moveRegistered) {
    const dx = currentPos.x - pinchStartPosition.x;
    const dy = currentPos.y - pinchStartPosition.y;
    const distanceX = Math.abs(dx) * SWIPE_RATIO; // Boost X-axis
    const distanceY = Math.abs(dy);
    
    // Check if either axis exceeds threshold
    if (distanceX > MIN_SWIPE_DISTANCE_X || distanceY > MIN_SWIPE_DISTANCE_Y) {
      determineSwipeDirection(dx, dy);
      moveRegistered = true; // Block further moves until release
      pinchStartPosition = null; // Force new pinch start
    }
  }
} else {
  pinchStartPosition = null; // Reset when hand opens
}

// New function to determine direction
// function determineSwipeDirection(dx, dy) {
//   const angle = Math.atan2(dy, dx) * 180 / Math.PI;
  
//   if (Math.abs(dx) > Math.abs(dy)) { // Horizontal swipe
//     if (angle > -45 && angle < 45) {
//       console.log("SWIPE RIGHT →");
//       // Call your 2048 moveRight() function here
//     } else {
//       console.log("SWIPE LEFT ←");
//       // moveLeft()
//     }
//   } else { // Vertical swipe
//     if (angle > 0) {
//       console.log("SWIPE DOWN ↓");
//       // moveDown()
//     } else {
//       console.log("SWIPE UP ↑");
//       // moveUp()
//     }
//   }
// }
 function determineSwipeDirection(dx, dy) {
  // Apply sensitivity boost to X-axis (Issue #2)
  dx *= SWIPE_RATIO;
  
  const angle = Math.atan2(dy, dx) * 180 / Math.PI;
  
  // Flipped left/right conditions (Issue #1)
  // CONTROLS
  if (Math.abs(dx) > Math.abs(dy)) {
    if (angle > -45 && angle < 45) {
      console.log("SWIPE LEFT ←"); // Now correctly shows left
      // moveLeft(); 
      handleInput("ArrowLeft");
    } else {
      console.log("SWIPE RIGHT →"); // Now correctly shows right
      // moveRight();
      handleInput("ArrowRight");
    }
  } else {
    if (angle > 0) {
      console.log("SWIPE DOWN ↓");
      // moveDown();
      handleInput("ArrowDown");
    } else {
      console.log("SWIPE UP ↑");
      // moveUp();
      handleInput("ArrowUp");
    }
  }
}



// Modified detection logic (Issue #3 - single move per pinch)
if (isPinching) {
  const currentPos = results.landmarks[0][0];
  
  if (!pinchStartPosition) {
    pinchStartPosition = { x: currentPos.x, y: currentPos.y };
    moveRegistered = false; // Reset on new pinch
  }
  
  if (!moveRegistered) {
    const dx = currentPos.x - pinchStartPosition.x;
    const dy = currentPos.y - pinchStartPosition.y;
    const distanceX = Math.abs(dx) * SWIPE_RATIO; // Boost X-axis
    const distanceY = Math.abs(dy);
    
    // Check if either axis exceeds threshold
    if (distanceX > MIN_SWIPE_DISTANCE_X || distanceY > MIN_SWIPE_DISTANCE_Y) {
      determineSwipeDirection(dx, dy);
      moveRegistered = true; // Block further moves until release
      pinchStartPosition = null; // Force new pinch start
    }
  }
} else {
  pinchStartPosition = null; // Reset when hand opens
}
}
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    if (results.landmarks) {
      for (const landmarks of results.landmarks) {
        drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, {
          color: "#00FF00",
          lineWidth: 5
        });
        drawLandmarks(canvasCtx, landmarks, { color: "#FFFF", lineWidth: 2 });
      }
    }
    canvasCtx.restore();
  
    // Call this function again to keep predicting when the browser is ready.
    if (webcamRunning === true) {
      window.requestAnimationFrame(predictWebcam);
    }
  }
  