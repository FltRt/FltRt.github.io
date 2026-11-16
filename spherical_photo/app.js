const video = document.getElementById("video");

let photos = [];
let latestOrientation = null;
let latestMotion = null;
let cameraStream = null;

const $ = id => document.getElementById(id);

function message(text) {
  $("message").textContent = text;
}

// Start camera
$("startCamera").addEventListener("click", async () => {
  try {
    cameraStream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: "environment"
      },
      audio: false
    });

    video.srcObject = cameraStream;
    $("cameraStatus").textContent = "Camera active";
    message("Camera started.");
  } catch (error) {
    message("Camera error: " + error.message);
  }
});

// Enable motion sensors
$("startMotion").addEventListener("click", async () => {
  try {
    if (
      typeof DeviceOrientationEvent !== "undefined" &&
      typeof DeviceOrientationEvent.requestPermission === "function"
    ) {
      const permission =
        await DeviceOrientationEvent.requestPermission();

      if (permission !== "granted") {
        throw new Error("Orientation permission denied.");
      }
    }

    window.addEventListener("deviceorientation", event => {
      latestOrientation = {
        alpha: event.alpha,
        beta: event.beta,
        gamma: event.gamma,
        timestamp: performance.now()
      };

      $("alpha").textContent =
        event.alpha?.toFixed(1) ?? "—";

      $("beta").textContent =
        event.beta?.toFixed(1) ?? "—";

      $("gamma").textContent =
        event.gamma?.toFixed(1) ?? "—";
    });

    window.addEventListener("devicemotion", event => {
      latestMotion = {
        acceleration: event.acceleration,
        accelerationIncludingGravity:
          event.accelerationIncludingGravity,
        rotationRate: event.rotationRate,
        timestamp: performance.now()
      };
    });

    $("sensorStatus").textContent = "Motion sensor active";
    message("Motion sensors enabled.");
  } catch (error) {
    message("Sensor error: " + error.message);
  }
});

// Capture photo
$("capture").addEventListener("click", () => {
  if (!video.videoWidth) {
    message("Start the camera first.");
    return;
  }

  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  const context = canvas.getContext("2d");
  context.drawImage(video, 0, 0);

  const photo = {
    id: photos.length + 1,
    capturedAt: new Date().toISOString(),
    orientation: latestOrientation,
    motion: latestMotion,
    width: canvas.width,
    height: canvas.height,
    image: canvas.toDataURL("image/jpeg", 0.95)
  };

  photos.push(photo);

  $("photoCount").textContent = photos.length;
  message("Photo " + photo.id + " captured.");
});

// Export session
$("export").addEventListener("click", () => {
  if (photos.length === 0) {
    message("No photos to export.");
    return;
  }

  const metadata = photos.map(photo => ({
    id: photo.id,
    capturedAt: photo.capturedAt,
    orientation: photo.orientation,
    motion: photo.motion,
    width: photo.width,
    height: photo.height
  }));

  const json = new Blob(
    [JSON.stringify(metadata, null, 2)],
    { type: "application/json" }
  );

  download(json, "spherecapture-session.json");

  photos.forEach(photo => {
    const link = document.createElement("a");
    link.href = photo.image;
    link.download = `spherecapture-${photo.id}.jpg`;
    link.click();
  });

  message("Session exported.");
});

function download(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  link.click();

  URL.revokeObjectURL(url);
}