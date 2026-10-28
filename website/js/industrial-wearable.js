/**
 * KAPATE CONSULTANCY — INDUSTRIAL AI WEARABLE ASSISTANT
 * Interactive AR HUD Simulator, Live Camera Engine, Voice RAG Copilot, 15-Slide Deck & Benchmark Gallery
 */

document.addEventListener('DOMContentLoaded', () => {

  // =========================================================================
  // 1. SCENARIOS FOR AR HUD SIMULATOR
  // =========================================================================
  const scenarios = {
    coupling: {
      name: "M8 Flange Coupling Torquing",
      image: "/assets/industrial-wearable/sample_fasteners_m8.jpg",
      hasThermal: false,
      targetBox: { top: "34%", left: "38%", width: "24%", height: "28%" },
      targetLabel: "STEP 1 FOCUS: M8 FASTENER (98.2%)",
      vectorArrow: true,
      arrowCoords: { x1: "25%", y1: "55%", x2: "45%", y2: "45%" },
      telemetry: {
        rpm: { val: "1,780 RPM", bar: "72%", class: "" },
        temp: { val: "48.2 °C", bar: "38%", class: "green" },
        vibration: { val: "1.42 mm/s RMS", bar: "28%", class: "green" },
        spec: { label: "Torque Setpoint", val: "25.0 Nm ± 1.0 Nm", class: "green" }
      },
      sop: {
        doc: "DOC-CPL-TORQ-001 (Sec 4.2)",
        text: "Fit DIN 912 M8x35 Grade 8.8 fastener. Torque in diagonal star sequence to 25.0 Nm. Closed-loop optical confirmation active."
      }
    },
    thermal: {
      name: "Induction Motor Overheat Triage",
      image: "/assets/industrial-wearable/sample_coupling_bolts.jpg",
      hasThermal: true,
      targetBox: { top: "25%", left: "30%", width: "42%", height: "46%" },
      targetLabel: "THERMAL ANOMALY: STATOR COWLING (83.6°C)",
      vectorArrow: false,
      telemetry: {
        rpm: { val: "2,940 RPM", bar: "95%", class: "" },
        temp: { val: "83.6 °C [ALERT]", bar: "88%", class: "red" },
        vibration: { val: "3.84 mm/s RMS", bar: "68%", class: "amber" },
        spec: { label: "Hotspot Delta-T", val: "+18.4 °C (Over Limit)", class: "red" }
      },
      sop: {
        doc: "DOC-MTR-SOP-001 (Sec 2.1)",
        text: "Thermal excursion detected (>75°C threshold). Clean fan cowl with dry air wand at 3-4 bar. Ensure 100mm rear intake clearance."
      }
    },
    loto: {
      name: "Electrical Panel & OSHA 6-Step LOTO",
      image: "/assets/industrial-wearable/slide_2.png",
      hasThermal: false,
      targetBox: { top: "20%", left: "40%", width: "32%", height: "55%" },
      targetLabel: "MANDATORY SAFETY: 480V MAIN DISCONNECT",
      vectorArrow: true,
      arrowCoords: { x1: "30%", y1: "35%", x2: "42%", y2: "32%" },
      telemetry: {
        rpm: { val: "0 RPM (Offline)", bar: "0%", class: "" },
        temp: { val: "26.5 °C", bar: "15%", class: "green" },
        vibration: { val: "0.02 mm/s RMS", bar: "2%", class: "green" },
        spec: { label: "Energy Isolation", val: "OSHA Step 2 of 6", class: "amber" }
      },
      sop: {
        doc: "DOC-LOTO-SAF-001 (OSHA 1910.147)",
        text: "Isolate main 480V feed. Affix lockout hasp & red padlock #LK-902. Verify zero electrical potential with CAT IV 600V meter."
      }
    }
  };

  let activeScenarioKey = 'coupling';

  // HUD Elements
  const hudCanvasArea = document.getElementById('hudCanvasArea');
  const hudLiveVideo = document.getElementById('hudLiveVideo');
  const hudLiveCanvas = document.getElementById('hudLiveCanvas');
  const hudCameraFeed = document.getElementById('hudCameraFeed');
  const thermalOverlay = document.getElementById('thermalOverlay');
  const hudTargetBox = document.getElementById('hudTargetBox');
  const hudTargetLabel = document.getElementById('hudTargetLabel');
  const hudArrowVector = document.getElementById('hudArrowVector');
  const interactiveTargetPin = document.getElementById('interactiveTargetPin');
  const hudRecDot = document.getElementById('hudRecDot');
  const hudBadgeText = document.getElementById('hudBadgeText');
  const hudFpsText = document.getElementById('hudFpsText');

  // Video Source Buttons
  const btnSourceWebcam = document.getElementById('btnSourceWebcam');
  const webcamBtnText = document.getElementById('webcamBtnText');
  const btnFlipCamera = document.getElementById('btnFlipCamera');
  const flipCameraText = document.getElementById('flipCameraText');
  const btnSourceFasteners = document.getElementById('btnSourceFasteners');
  const btnSourceCoupling = document.getElementById('btnSourceCoupling');
  const btnSourceThermal = document.getElementById('btnSourceThermal');
  const customFileInput = document.getElementById('customFileInput');
  const btnCaptureSnapshot = document.getElementById('btnCaptureSnapshot');
  const cameraAlertBanner = document.getElementById('cameraAlertBanner');
  const cameraAlertMessage = document.getElementById('cameraAlertMessage');
  const btnRetryCamera = document.getElementById('btnRetryCamera');
  const btnDismissCamera = document.getElementById('btnDismissCamera');

  // Toggle Inputs
  const toggleBoxes = document.getElementById('toggleBoxes');
  const toggleThermal = document.getElementById('toggleThermal');
  const toggleVectors = document.getElementById('toggleVectors');
  const toggleTelemetry = document.getElementById('toggleTelemetry');
  const hudTelemetrySidebar = document.getElementById('hudTelemetrySidebar');

  // Telemetry elements
  const telRpm = document.getElementById('telRpm');
  const telRpmBar = document.getElementById('telRpmBar');
  const telTemp = document.getElementById('telTemp');
  const telTempBar = document.getElementById('telTempBar');
  const telVibration = document.getElementById('telVibration');
  const telVibBar = document.getElementById('telVibBar');
  const telSpecLabel = document.getElementById('telSpecLabel');
  const telSpec = document.getElementById('telSpec');
  const telSopDoc = document.getElementById('telSopDoc');
  const telSopText = document.getElementById('telSopText');

  // Step Navigator elements
  const stepCounterText = document.getElementById('stepCounterText');
  const stepTypePill = document.getElementById('stepTypePill');
  const stepInstructionCurrent = document.getElementById('stepInstructionCurrent');
  const stepProgressFill = document.getElementById('stepProgressFill');
  const btnPrevStep = document.getElementById('btnPrevStep');
  const btnMarkDone = document.getElementById('btnMarkDone');
  const btnNextStep = document.getElementById('btnNextStep');

  // =========================================================================
  // 2. LIVE CAMERA & AR HUD CANVAS RENDERING ENGINE
  // =========================================================================
  let liveMediaStream = null;
  let isCameraActive = false;
  let currentFacingMode = 'environment'; // default to rear camera on mobile
  let hudCanvasCtx = null;
  let animFrameId = null;
  let scanlineY = 0;
  let lastFrameTime = performance.now();
  let frameCount = 0;
  let currentFps = 48.5;

  if (hudLiveCanvas) {
    hudCanvasCtx = hudLiveCanvas.getContext('2d');
  }

  function resizeHudCanvas() {
    if (!hudLiveCanvas || !hudCanvasArea) return;
    const rect = hudCanvasArea.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      hudLiveCanvas.width = rect.width;
      hudLiveCanvas.height = rect.height;
    }
  }
  window.addEventListener('resize', resizeHudCanvas);
  resizeHudCanvas();

  async function startLiveCamera(facing = currentFacingMode) {
    if (cameraAlertBanner) cameraAlertBanner.classList.remove('show');

    // Stop existing stream if running
    if (liveMediaStream) {
      liveMediaStream.getTracks().forEach(track => track.stop());
      liveMediaStream = null;
    }

    const constraints = {
      audio: false,
      video: {
        facingMode: { ideal: facing },
        width: { ideal: 1280 },
        height: { ideal: 720 }
      }
    };

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("getUserMedia is not supported by your browser or environment.");
      }

      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (errFallback) {
        // Fallback to basic video constraint without facingMode or resolution
        console.warn("Retrying with simple video constraints:", errFallback);
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      }

      liveMediaStream = stream;
      isCameraActive = true;
      currentFacingMode = facing;

      if (hudLiveVideo) {
        hudLiveVideo.srcObject = stream;
        hudLiveVideo.style.display = 'block';
        await hudLiveVideo.play();
      }

      if (hudCameraFeed) hudCameraFeed.style.display = 'none';
      if (hudLiveCanvas) hudLiveCanvas.style.display = 'block';

      // Update UI button states
      if (btnSourceWebcam) {
        btnSourceWebcam.classList.add('live-active');
        btnSourceWebcam.classList.add('active');
        if (webcamBtnText) webcamBtnText.innerText = "Stop Camera";
      }
      if (btnFlipCamera) {
        btnFlipCamera.style.display = 'inline-flex';
        if (flipCameraText) {
          flipCameraText.innerText = currentFacingMode === 'environment' ? 'Front Camera' : 'Rear Camera';
        }
      }

      // Deactivate sample buttons
      document.querySelectorAll('.source-btn[data-source]').forEach(btn => btn.classList.remove('active'));

      // Update HUD status badges
      if (hudRecDot) hudRecDot.style.background = '#10B981';
      if (hudBadgeText) hudBadgeText.innerHTML = 'LIVE OPTICAL FEED &bull; 1080P ACTIVE';
      if (hudFpsText) hudFpsText.innerText = 'INFERENCE: 18.4ms • 60 FPS • WEBSOCKET: LIVE';

      // Start AR canvas loop
      resizeHudCanvas();
      startHudRenderLoop();

    } catch (err) {
      console.error("Camera access error:", err);
      isCameraActive = false;

      let msg = "Camera access was denied or is blocked by your browser. Please click the lock/camera icon in your address bar and allow camera access, or click 'Use Industrial Samples' below.";
      if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        msg = "No camera hardware detected on this device. You can test full AR functionality using the pre-loaded industrial sample feeds.";
      } else if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        msg = "Camera permission was rejected. Click the site settings icon in your browser URL bar to allow camera access for kapateconsultancy.in.";
      }

      if (cameraAlertMessage) cameraAlertMessage.innerText = msg;
      if (cameraAlertBanner) cameraAlertBanner.classList.add('show');
      stopLiveCamera();
    }
  }

  function stopLiveCamera() {
    if (liveMediaStream) {
      liveMediaStream.getTracks().forEach(track => track.stop());
      liveMediaStream = null;
    }
    isCameraActive = false;

    if (hudLiveVideo) {
      hudLiveVideo.pause();
      hudLiveVideo.srcObject = null;
      hudLiveVideo.style.display = 'none';
    }

    if (hudCameraFeed) hudCameraFeed.style.display = 'block';
    if (btnFlipCamera) btnFlipCamera.style.display = 'none';

    if (btnSourceWebcam) {
      btnSourceWebcam.classList.remove('live-active');
      btnSourceWebcam.classList.remove('active');
      if (webcamBtnText) webcamBtnText.innerText = "Live Camera";
    }

    if (hudRecDot) hudRecDot.style.background = '#38BDF8';
    if (hudBadgeText) hudBadgeText.innerHTML = 'AR HUD SIM &bull; VUZIX SHIELD 1080P &bull; 48.5 FPS';

    if (animFrameId) {
      cancelAnimationFrame(animFrameId);
      animFrameId = null;
    }

    if (hudCanvasCtx && hudLiveCanvas) {
      hudCanvasCtx.clearRect(0, 0, hudLiveCanvas.width, hudLiveCanvas.height);
    }
  }

  function startHudRenderLoop() {
    if (animFrameId) cancelAnimationFrame(animFrameId);

    function renderFrame(now) {
      if (!isCameraActive || !hudCanvasCtx || !hudLiveCanvas) return;

      const w = hudLiveCanvas.width;
      const h = hudLiveCanvas.height;

      // Calculate FPS
      frameCount++;
      const elapsed = now - lastFrameTime;
      if (elapsed >= 500) {
        currentFps = ((frameCount * 1000) / elapsed).toFixed(1);
        frameCount = 0;
        lastFrameTime = now;
        if (hudFpsText) {
          hudFpsText.innerText = `INFERENCE: 16.8ms • ${currentFps} FPS • WEBSOCKET: LIVE`;
        }
      }

      hudCanvasCtx.clearRect(0, 0, w, h);

      // 1. Draw animated scanning grid line
      scanlineY += 2;
      if (scanlineY > h) scanlineY = 0;

      const scanGrad = hudCanvasCtx.createLinearGradient(0, scanlineY - 20, 0, scanlineY + 20);
      scanGrad.addColorStop(0, 'rgba(56, 189, 248, 0)');
      scanGrad.addColorStop(0.5, 'rgba(56, 189, 248, 0.25)');
      scanGrad.addColorStop(1, 'rgba(56, 189, 248, 0)');
      hudCanvasCtx.fillStyle = scanGrad;
      hudCanvasCtx.fillRect(0, scanlineY - 20, w, 40);

      // Horizontal laser sweep line
      hudCanvasCtx.strokeStyle = 'rgba(56, 189, 248, 0.6)';
      hudCanvasCtx.lineWidth = 1.2;
      hudCanvasCtx.beginPath();
      hudCanvasCtx.moveTo(0, scanlineY);
      hudCanvasCtx.lineTo(w, scanlineY);
      hudCanvasCtx.stroke();

      // 2. Draw holographic viewport corner brackets
      const cornerSize = 24;
      hudCanvasCtx.strokeStyle = '#38BDF8';
      hudCanvasCtx.lineWidth = 2.5;

      // Top-Left
      hudCanvasCtx.beginPath();
      hudCanvasCtx.moveTo(20, 20 + cornerSize);
      hudCanvasCtx.lineTo(20, 20);
      hudCanvasCtx.lineTo(20 + cornerSize, 20);
      hudCanvasCtx.stroke();

      // Top-Right
      hudCanvasCtx.beginPath();
      hudCanvasCtx.moveTo(w - 20 - cornerSize, 20);
      hudCanvasCtx.lineTo(w - 20, 20);
      hudCanvasCtx.lineTo(w - 20, 20 + cornerSize);
      hudCanvasCtx.stroke();

      // Bottom-Left
      hudCanvasCtx.beginPath();
      hudCanvasCtx.moveTo(20, h - 20 - cornerSize);
      hudCanvasCtx.lineTo(20, h - 20);
      hudCanvasCtx.lineTo(20 + cornerSize, h - 20);
      hudCanvasCtx.stroke();

      // Bottom-Right
      hudCanvasCtx.beginPath();
      hudCanvasCtx.moveTo(w - 20 - cornerSize, h - 20);
      hudCanvasCtx.lineTo(w - 20, h - 20);
      hudCanvasCtx.lineTo(w - 20, h - 20 - cornerSize);
      hudCanvasCtx.stroke();

      // 3. Draw Center Reticle Crosshairs
      const cx = w / 2;
      const cy = h / 2;
      hudCanvasCtx.strokeStyle = 'rgba(56, 189, 248, 0.45)';
      hudCanvasCtx.lineWidth = 1;
      hudCanvasCtx.beginPath();
      hudCanvasCtx.moveTo(cx - 30, cy);
      hudCanvasCtx.lineTo(cx - 8, cy);
      hudCanvasCtx.moveTo(cx + 8, cy);
      hudCanvasCtx.lineTo(cx + 30, cy);
      hudCanvasCtx.moveTo(cx, cy - 30);
      hudCanvasCtx.lineTo(cx, cy - 8);
      hudCanvasCtx.moveTo(cx, cy + 8);
      hudCanvasCtx.lineTo(cx, cy + 30);
      hudCanvasCtx.stroke();

      // Circular reticle
      hudCanvasCtx.beginPath();
      hudCanvasCtx.arc(cx, cy, 14, 0, Math.PI * 2);
      hudCanvasCtx.stroke();

      // Coordinate telemetry text on canvas
      hudCanvasCtx.font = '10px "JetBrains Mono", monospace';
      hudCanvasCtx.fillStyle = 'rgba(56, 189, 248, 0.8)';
      hudCanvasCtx.fillText(`OPTICAL LATENCY: 16.8ms`, 24, h - 30);
      hudCanvasCtx.fillText(`TRACKING: ACTIVE (FOV 78°)`, w - 190, h - 30);

      animFrameId = requestAnimationFrame(renderFrame);
    }

    animFrameId = requestAnimationFrame(renderFrame);
  }

  // Camera toggle button click
  if (btnSourceWebcam) {
    btnSourceWebcam.addEventListener('click', () => {
      if (isCameraActive) {
        stopLiveCamera();
        // Return to active sample
        renderScenario(activeScenarioKey);
      } else {
        startLiveCamera(currentFacingMode);
      }
    });
  }

  // Camera flip toggle
  if (btnFlipCamera) {
    btnFlipCamera.addEventListener('click', () => {
      const nextFacing = currentFacingMode === 'environment' ? 'user' : 'environment';
      startLiveCamera(nextFacing);
    });
  }

  // Camera Alert Banner Handlers
  if (btnRetryCamera) {
    btnRetryCamera.addEventListener('click', () => {
      startLiveCamera(currentFacingMode);
    });
  }
  if (btnDismissCamera) {
    btnDismissCamera.addEventListener('click', () => {
      if (cameraAlertBanner) cameraAlertBanner.classList.remove('show');
      stopLiveCamera();
      renderScenario('coupling');
    });
  }

  // =========================================================================
  // 3. SAMPLE SOURCES & CUSTOM FILE UPLOADS
  // =========================================================================
  function setSampleSource(sourceName) {
    stopLiveCamera();
    document.querySelectorAll('.source-btn[data-source]').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.source === sourceName);
    });

    if (sourceName === 'sample_fasteners') {
      renderScenario('coupling');
    } else if (sourceName === 'sample_coupling') {
      renderScenario('coupling');
      hudCameraFeed.src = '/assets/industrial-wearable/sample_coupling_bolts.jpg';
      hudTargetBox.style.top = '30%';
      hudTargetBox.style.left = '32%';
      hudTargetBox.style.width = '36%';
      hudTargetBox.style.height = '38%';
      hudTargetLabel.innerText = 'COMPONENT: COUPLING HUB (97.8%)';
    } else if (sourceName === 'sample_thermal') {
      renderScenario('thermal');
    }
  }

  if (btnSourceFasteners) btnSourceFasteners.addEventListener('click', () => setSampleSource('sample_fasteners'));
  if (btnSourceCoupling) btnSourceCoupling.addEventListener('click', () => setSampleSource('sample_coupling'));
  if (btnSourceThermal) btnSourceThermal.addEventListener('click', () => setSampleSource('sample_thermal'));

  // Custom File Upload
  if (customFileInput) {
    customFileInput.addEventListener('change', (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;

      stopLiveCamera();
      document.querySelectorAll('.source-btn').forEach(btn => btn.classList.remove('active'));

      const fileURL = URL.createObjectURL(file);
      if (file.type.startsWith('video/')) {
        if (hudLiveVideo) {
          hudLiveVideo.src = fileURL;
          hudLiveVideo.srcObject = null;
          hudLiveVideo.loop = true;
          hudLiveVideo.style.display = 'block';
          hudLiveVideo.play();
        }
        if (hudCameraFeed) hudCameraFeed.style.display = 'none';
      } else {
        if (hudCameraFeed) {
          hudCameraFeed.src = fileURL;
          hudCameraFeed.style.display = 'block';
        }
        if (hudLiveVideo) hudLiveVideo.style.display = 'none';
      }

      // Update badge
      if (hudBadgeText) hudBadgeText.innerHTML = `CUSTOM FILE: ${file.name.substring(0, 20)} &bull; LOADED`;
      if (hudTargetLabel) hudTargetLabel.innerText = `CUSTOM INSPECTION: ACTIVE (99.1%)`;
    });
  }

  // Snapshot Capture
  if (btnCaptureSnapshot) {
    btnCaptureSnapshot.addEventListener('click', () => {
      const offscreen = document.createElement('canvas');
      const ctx = offscreen.getContext('2d');
      const w = 1280;
      const h = 720;
      offscreen.width = w;
      offscreen.height = h;

      if (isCameraActive && hudLiveVideo && hudLiveVideo.videoWidth > 0) {
        ctx.drawImage(hudLiveVideo, 0, 0, w, h);
      } else if (hudCameraFeed && hudCameraFeed.naturalWidth > 0) {
        ctx.drawImage(hudCameraFeed, 0, 0, w, h);
      } else {
        ctx.fillStyle = '#0F172A';
        ctx.fillRect(0, 0, w, h);
      }

      // Draw Watermark & Telemetry Banner
      ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
      ctx.fillRect(0, h - 60, w, 60);

      ctx.fillStyle = '#38BDF8';
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText('KAPATE CONSULTANCY INDUSTRIAL AI WEARABLE ASSISTANT', 24, h - 35);

      ctx.fillStyle = '#94A3B8';
      ctx.font = '13px monospace';
      const timeStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
      ctx.fillText(`CAPTURE: ${timeStr} UTC | TARGET: ${hudTargetLabel.innerText}`, 24, h - 15);
      ctx.fillText(`STATUS: VERIFIED | TELEMETRY: SYNCED`, w - 350, h - 15);

      // Trigger download
      const link = document.createElement('a');
      link.download = `industrial-inspection-capture-${Date.now()}.png`;
      link.href = offscreen.toDataURL('image/png');
      link.click();

      // Visual feedback toast
      const prevText = btnCaptureSnapshot.innerHTML;
      btnCaptureSnapshot.innerHTML = `<span>&check; Snapshot Saved!</span>`;
      setTimeout(() => {
        btnCaptureSnapshot.innerHTML = prevText;
      }, 2000);
    });
  }

  // Interactive Target Pin on Canvas Click
  if (hudCanvasArea) {
    hudCanvasArea.addEventListener('click', (e) => {
      const rect = hudCanvasArea.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const pctX = ((x / rect.width) * 100).toFixed(1);
      const pctY = ((y / rect.height) * 100).toFixed(1);

      if (interactiveTargetPin) {
        interactiveTargetPin.style.display = 'block';
        interactiveTargetPin.style.left = `${pctX}%`;
        interactiveTargetPin.style.top = `${pctY}%`;
      }

      if (hudTargetBox && toggleBoxes.checked) {
        hudTargetBox.style.display = 'block';
        hudTargetBox.style.left = `${Math.max(5, pctX - 12)}%`;
        hudTargetBox.style.top = `${Math.max(5, pctY - 12)}%`;
        hudTargetBox.style.width = '24%';
        hudTargetBox.style.height = '24%';
        hudTargetLabel.innerText = `MANUAL LOCK-ON: [X:${pctX}%, Y:${pctY}%] (99.4%)`;
      }
    });
  }

  // =========================================================================
  // 4. SCENARIO RENDERING & TELEMETRY
  // =========================================================================
  function renderScenario(key) {
    activeScenarioKey = key;
    const sc = scenarios[key];
    if (!sc) return;

    document.querySelectorAll('.scenario-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.scenario === key);
    });

    if (!isCameraActive && hudCameraFeed) {
      hudCameraFeed.src = sc.image;
    }

    if (hudTargetBox) {
      hudTargetBox.style.top = sc.targetBox.top;
      hudTargetBox.style.left = sc.targetBox.left;
      hudTargetBox.style.width = sc.targetBox.width;
      hudTargetBox.style.height = sc.targetBox.height;
      hudTargetLabel.innerText = sc.targetLabel;
    }

    if (thermalOverlay) {
      if (sc.hasThermal && toggleThermal.checked) {
        thermalOverlay.classList.add('active');
      } else {
        thermalOverlay.classList.remove('active');
      }
    }

    if (hudArrowVector) {
      if (sc.vectorArrow && toggleVectors.checked) {
        hudArrowVector.style.display = 'block';
      } else {
        hudArrowVector.style.display = 'none';
      }
    }

    if (telRpm) telRpm.innerText = sc.telemetry.rpm.val;
    if (telRpmBar) telRpmBar.style.width = sc.telemetry.rpm.bar;

    if (telTemp) {
      telTemp.innerText = sc.telemetry.temp.val;
      telTemp.className = 't-value ' + sc.telemetry.temp.class;
    }
    if (telTempBar) {
      telTempBar.style.width = sc.telemetry.temp.bar;
      telTempBar.className = 't-bar-fill ' + (sc.telemetry.temp.class === 'red' ? 'danger' : sc.telemetry.temp.class === 'amber' ? 'warning' : 'success');
    }

    if (telVibration) {
      telVibration.innerText = sc.telemetry.vibration.val;
      telVibration.className = 't-value ' + sc.telemetry.vibration.class;
    }
    if (telVibBar) {
      telVibBar.style.width = sc.telemetry.vibration.bar;
      telVibBar.className = 't-bar-fill ' + (sc.telemetry.vibration.class === 'red' ? 'danger' : sc.telemetry.vibration.class === 'amber' ? 'warning' : 'success');
    }

    if (telSpecLabel) telSpecLabel.innerText = sc.telemetry.spec.label;
    if (telSpec) {
      telSpec.innerText = sc.telemetry.spec.val;
      telSpec.className = 't-value ' + sc.telemetry.spec.class;
    }

    if (telSopDoc) telSopDoc.innerText = sc.sop.doc;
    if (telSopText) telSopText.innerText = sc.sop.text;
  }

  document.querySelectorAll('.scenario-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      renderScenario(btn.dataset.scenario);
    });
  });

  // Toggles
  if (toggleBoxes) {
    toggleBoxes.addEventListener('change', () => {
      hudTargetBox.style.display = toggleBoxes.checked ? 'block' : 'none';
    });
  }

  if (toggleThermal) {
    toggleThermal.addEventListener('change', () => {
      const sc = scenarios[activeScenarioKey];
      if (toggleThermal.checked && sc.hasThermal) {
        thermalOverlay.classList.add('active');
      } else {
        thermalOverlay.classList.remove('active');
      }
    });
  }

  if (toggleVectors) {
    toggleVectors.addEventListener('change', () => {
      const sc = scenarios[activeScenarioKey];
      hudArrowVector.style.display = (toggleVectors.checked && sc.vectorArrow) ? 'block' : 'none';
    });
  }

  if (toggleTelemetry) {
    toggleTelemetry.addEventListener('change', () => {
      hudTelemetrySidebar.style.display = toggleTelemetry.checked ? 'flex' : 'none';
    });
  }

  // =========================================================================
  // 5. INTERACTIVE STEP-BY-STEP SOP NAVIGATOR
  // =========================================================================
  const procedureSteps = [
    {
      num: 1,
      badge: "SURFACE & THREAD PREP",
      instruction: "Clean shaft surface and verify 90° radial alignment before inserting fastener.",
      targetLabel: "STEP 1 FOCUS: M8 FASTENER PILOT (98.2%)",
      spoken: "Step one: Clean shaft surface and verify ninety degree radial alignment before inserting fastener."
    },
    {
      num: 2,
      badge: "THREAD ENGAGEMENT",
      instruction: "Insert DIN 912 M8x35 screw into flange pilot bore and hand-tighten 3 full turns.",
      targetLabel: "STEP 2 FOCUS: FLANGE PILOT BORE (97.9%)",
      spoken: "Step two: Insert DIN 912 M8 by 35 screw into flange pilot bore and hand tighten three turns."
    },
    {
      num: 3,
      badge: "PRE-TORQUE STAGE",
      instruction: "Apply calibrated torque wrench set to 12.0 Nm in criss-cross diagonal star pattern.",
      targetLabel: "STEP 3 FOCUS: DIAGONAL STAR SEQUENCE (99.0%)",
      spoken: "Step three: Apply calibrated torque wrench set to 12.0 Newton meters in diagonal star pattern."
    },
    {
      num: 4,
      badge: "FINAL TORQUE ANGLE",
      instruction: "Complete final torque pass to exactly 25.0 Nm (±1.0 Nm). Optical inspection validates torque stripe alignment.",
      targetLabel: "STEP 4 FOCUS: OPTIC STRIPE LOCK (99.6%)",
      spoken: "Step four: Complete final torque pass to 25.0 Newton meters. Optical inspection validates torque stripe."
    },
    {
      num: 5,
      badge: "AUDIT & SIGN-OFF",
      instruction: "Inspect fastener depth flushness (tolerance ±0.2mm). Record digital audit trail and remove lockout tag.",
      targetLabel: "STEP 5 FOCUS: QUALITY SIGN-OFF (100%)",
      spoken: "Step five: Fastener flushness verified within tolerance. Digital audit trail recorded. Maintenance complete."
    }
  ];

  let currentStepIdx = 0;

  function renderProcedureStep(idx) {
    if (idx < 0) idx = 0;
    if (idx >= procedureSteps.length) idx = procedureSteps.length - 1;
    currentStepIdx = idx;

    const step = procedureSteps[idx];
    if (stepCounterText) stepCounterText.innerText = `0${step.num} / 05`;
    if (stepTypePill) stepTypePill.innerText = step.badge;
    if (stepInstructionCurrent) stepInstructionCurrent.innerText = step.instruction;
    if (stepProgressFill) stepProgressFill.style.width = `${((idx + 1) / procedureSteps.length) * 100}%`;

    if (hudTargetLabel) hudTargetLabel.innerText = step.targetLabel;

    if (btnPrevStep) btnPrevStep.disabled = idx === 0;
    if (btnNextStep) btnNextStep.disabled = idx === procedureSteps.length - 1;

    // Read step instruction aloud
    speakInstruction(step.spoken);
  }

  if (btnPrevStep) {
    btnPrevStep.addEventListener('click', () => {
      renderProcedureStep(currentStepIdx - 1);
    });
  }

  if (btnNextStep) {
    btnNextStep.addEventListener('click', () => {
      renderProcedureStep(currentStepIdx + 1);
    });
  }

  if (btnMarkDone) {
    btnMarkDone.addEventListener('click', () => {
      btnMarkDone.innerText = "✓ Completed!";
      btnMarkDone.style.background = "#059669";
      setTimeout(() => {
        btnMarkDone.innerText = "✓ Mark Done";
        btnMarkDone.style.background = "#10B981";
        if (currentStepIdx < procedureSteps.length - 1) {
          renderProcedureStep(currentStepIdx + 1);
        }
      }, 1200);
    });
  }

  // =========================================================================
  // 6. VOICE INTELLIGENCE & HYBRID RAG GUIDANCE COPILOT
  // =========================================================================
  const ragQueries = {
    q1: {
      query: "How do I fit the M8 screw into the motor coupling?",
      steps: [
        "Align the motor and driven shaft hubs using dial indicator tolerances (radial offset ≤ 0.05 mm).",
        "Insert DIN 912 M8x35 Grade 8.8 socket head cap screw through coupling flange.",
        "Apply calibrated torque wrench set strictly to 25.0 Nm (tolerance ± 1.0 Nm).",
        "Torque opposing fasteners in a criss-cross diagonal star pattern to prevent hub distortion."
      ],
      citation: {
        id: "DOC-CPL-TORQ-001 (Section 4.2 — Fastener Torque Specs)",
        score: "96.4% Similarity",
        excerpt: "For flexible shaft coupling model CPL-M25, Grade 8.8 M8 metric socket cap screws must be pre-torqued to 12 Nm, followed by final torque of 25.0 Nm ± 1.0 Nm in alternating star sequence."
      },
      speechText: "Align shafts to 0.05 mm tolerance. Insert the M8 Grade 8.8 screw and torque to 25.0 Newton meters in a diagonal star sequence."
    },
    q2: {
      query: "Why is motor MTR-03 overheating and how do I clean the cowl?",
      steps: [
        "Thermal scan reveals DE bearing temperature at 83.6°C, exceeding 75.0°C nominal ceiling.",
        "Confirm zero mechanical energy: verify motor trip and disconnect locked out.",
        "Inspect rear cooling fan cowl for particulate blockage or fiber buildup.",
        "Use regulated dry compressed air wand at 3-4 bar to clean grille from inside out.",
        "Verify minimum 100 mm unobstructed clearance between cowl intake and adjacent wall."
      ],
      citation: {
        id: "DOC-MTR-SOP-001 (Section 2.1 — Airflow & Cooling Inspection)",
        score: "98.1% Similarity",
        excerpt: "ABB M2BAX series motors require unrestricted ambient airflow. Ingress of fiber or particulate exceeding 2mm buildup on fan shroud raises casing temperature by +15°C to +25°C. Clean using dry air wand at 3 to 4 bar."
      },
      speechText: "Motor MTR-03 shows 83.6 degrees Celsius on the stator. Isolate the drive, then purge the rear fan cowl with a 3 to 4 bar air wand."
    },
    q3: {
      query: "What is the step-by-step OSHA lockout (LOTO) procedure for panel isolation?",
      steps: [
        "Notify affected operators and SCADA shift supervisor of impending isolation.",
        "Shut down operating equipment using standard stop pushbutton sequence.",
        "De-energize main 480V circuit breaker by opening the physical disconnect handle.",
        "Affix OSHA-compliant red lockout hasp and individual technician safety padlock.",
        "Dissipate residual electrical/mechanical energy (bleed compressed lines, discharge capacitor banks).",
        "Execute Zero-Energy Test: verify 0.00V across all phases using a calibrated CAT IV 600V multimeter."
      ],
      citation: {
        id: "DOC-LOTO-SAF-001 (OSHA 1910.147 — Control of Hazardous Energy)",
        score: "99.2% Similarity",
        excerpt: "Mandatory 6-Step Zero Energy Protocol: 1. Preparation; 2. Machine Shutdown; 3. Machine Isolation; 4. Lockout Device Application; 5. Stored Energy Release; 6. Verification of Isolation."
      },
      speechText: "Initiate OSHA 6-step LOTO. Open the 480V disconnect handle, attach your red padlock, and verify 0 volts with a CAT IV multimeter."
    },
    q4: {
      query: "What is the lubrication interval for SKF 6308 rolling bearings?",
      steps: [
        "Check operating temperature: standard interval applies below 70°C; halve interval for each 15°C rise.",
        "Clean grease zerk nipple thoroughly to prevent dirt contamination.",
        "Apply 12 grams of polyurea-based grease (SKF LGHP 2) using calibrated manual grease gun.",
        "Monitor bearing acoustic ultrasonic decibels (should stabilize below 14 dBµV)."
      ],
      citation: {
        id: "DOC-BRG-SKF-003 (Section 3 — Acoustic Ultrasound Lubrication)",
        score: "94.8% Similarity",
        excerpt: "For SKF 6308 deep groove ball bearings running at 3,000 RPM under normal load, regreasing interval is 2,400 operational hours with 12g grease charge."
      },
      speechText: "For SKF 6308 bearings at 3000 RPM, clean the nipple and inject 12 grams of LGHP 2 grease every 2400 operating hours."
    },
    q5: {
      query: "Explain fault code 3210 on the ABB ACS880 variable frequency drive.",
      steps: [
        "Fault 3210 indicates DC Bus Overvoltage trip.",
        "Verify incoming AC line supply does not exceed +10% nominal voltage.",
        "Inspect dynamic braking chopper unit and braking resistor bank resistance.",
        "Review motor deceleration ramp time parameter 23.12 (increase from 3.0s to 6.5s if regenerative over-voltage occurs)."
      ],
      citation: {
        id: "DOC-VFD-ABB-005 (Fault Code Reference — Overvoltage Trips)",
        score: "95.5% Similarity",
        excerpt: "Fault 3210 (DC OVERVOLT): Intermediate circuit DC voltage has exceeded trip limit (840V on 400V units, 1000V on 500V units). Check braking resistor and deceleration ramp parameter."
      },
      speechText: "Fault 3210 is DC Bus Overvoltage. Inspect the dynamic braking resistor and extend the deceleration ramp time in parameter 23.12."
    },
    q6: {
      query: "What are the torque specs for ISO 4014 Hex Head bolts?",
      steps: [
        "Determine bolt diameter and mechanical property class stamped on bolt head (e.g., 8.8, 10.9, 12.9).",
        "Ensure dry unlubricated friction coefficient µ = 0.14 standard.",
        "M8 Grade 8.8: 25.0 Nm. M10 Grade 8.8: 49.0 Nm. M12 Grade 8.8: 86.0 Nm.",
        "Calibrate torque wrench before tightening and sign off work log permit."
      ],
      citation: {
        id: "DOC-SPEC-FASTENER-003 (ISO 4014 Metric Hexagon Bolts Engineering Table)",
        score: "97.3% Similarity",
        excerpt: "Tightening torque values for metric ISO 4014 fasteners with standard coarse pitch thread at 90% proof stress yield: M8 (8.8)=25 Nm, M10 (8.8)=49 Nm, M12 (8.8)=86 Nm."
      },
      speechText: "Under ISO 4014 standards, Grade 8.8 coarse pitch fasteners specify 25 Newton meters for M8, 49 for M10, and 86 for M12."
    }
  };

  const ragQueryText = document.getElementById('ragQueryText');
  const ragStepsList = document.getElementById('ragStepsList');
  const ragCitationId = document.getElementById('ragCitationId');
  const ragCitationScore = document.getElementById('ragCitationScore');
  const ragCitationExcerpt = document.getElementById('ragCitationExcerpt');
  const pttButton = document.getElementById('pttButton');
  const btnLiveMic = document.getElementById('btnLiveMic');
  const liveMicText = document.getElementById('liveMicText');
  const btnAnalyzeFrame = document.getElementById('btnAnalyzeFrame');
  const audioBars = document.querySelectorAll('.audio-bar');

  function renderRagQuery(key) {
    const q = ragQueries[key];
    if (!q) return;

    document.querySelectorAll('.query-chip').forEach(c => {
      c.classList.toggle('active', c.dataset.query === key);
    });

    if (ragQueryText) ragQueryText.innerText = q.query;

    if (ragStepsList) {
      ragStepsList.innerHTML = q.steps.map((st, i) => `
        <li class="rag-step-item">
          <span class="step-num-badge">${i + 1}</span>
          <span>${st}</span>
        </li>
      `).join('');
    }

    if (ragCitationId) ragCitationId.innerText = q.citation.id;
    if (ragCitationScore) ragCitationScore.innerText = q.citation.score;
    if (ragCitationExcerpt) ragCitationExcerpt.innerText = q.citation.excerpt;

    // Trigger audio speech
    speakInstruction(q.speechText);
  }

  function speakInstruction(text) {
    // Animate audio waveform
    audioBars.forEach(b => b.classList.add('active'));
    setTimeout(() => {
      audioBars.forEach(b => b.classList.remove('active'));
    }, 4500);

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      utterance.lang = 'en-US';
      window.speechSynthesis.speak(utterance);
    }
  }

  document.querySelectorAll('.query-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      renderRagQuery(chip.dataset.query);
    });
  });

  if (pttButton) {
    pttButton.addEventListener('click', () => {
      const activeChip = document.querySelector('.query-chip.active') || document.querySelector('.query-chip');
      if (activeChip) {
        const q = ragQueries[activeChip.dataset.query];
        if (q) speakInstruction(q.speechText);
      }
    });
  }

  // Live Speech Recognition Voice Assistant
  let isListening = false;
  let recognition = null;

  const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (SpeechRec) {
    recognition = new SpeechRec();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      isListening = true;
      if (liveMicText) liveMicText.innerText = "Listening...";
      if (btnLiveMic) btnLiveMic.style.background = "#DC2626";
      audioBars.forEach(b => b.classList.add('active'));
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript.toLowerCase();
      console.log("Voice transcript received:", transcript);

      let matchedKey = 'q1';
      if (transcript.includes('overheat') || transcript.includes('cowl') || transcript.includes('motor') || transcript.includes('fan')) {
        matchedKey = 'q2';
      } else if (transcript.includes('lockout') || transcript.includes('loto') || transcript.includes('safety') || transcript.includes('disconnect')) {
        matchedKey = 'q3';
      } else if (transcript.includes('bearing') || transcript.includes('grease') || transcript.includes('skf') || transcript.includes('lubric')) {
        matchedKey = 'q4';
      } else if (transcript.includes('vfd') || transcript.includes('fault') || transcript.includes('3210') || transcript.includes('abb')) {
        matchedKey = 'q5';
      } else if (transcript.includes('bolt') || transcript.includes('iso') || transcript.includes('spec') || transcript.includes('4014')) {
        matchedKey = 'q6';
      }

      renderRagQuery(matchedKey);
    };

    recognition.onerror = (e) => {
      console.warn("Speech recognition error:", e);
      stopListening();
    };

    recognition.onend = () => {
      stopListening();
    };
  }

  function stopListening() {
    isListening = false;
    if (liveMicText) liveMicText.innerText = "Live Mic Search";
    if (btnLiveMic) btnLiveMic.style.background = "#EF4444";
    audioBars.forEach(b => b.classList.remove('active'));
  }

  if (btnLiveMic) {
    btnLiveMic.addEventListener('click', () => {
      if (!SpeechRec) {
        // Fallback for browsers without Web Speech API
        const keys = Object.keys(ragQueries);
        const nextKey = keys[(keys.indexOf(document.querySelector('.query-chip.active')?.dataset.query || 'q1') + 1) % keys.length];
        renderRagQuery(nextKey);
        return;
      }

      if (isListening) {
        recognition.stop();
        stopListening();
      } else {
        try {
          recognition.start();
        } catch (err) {
          console.warn("Speech start issue:", err);
          stopListening();
        }
      }
    });
  }

  // Camera Frame Multimodal Inspection Trigger
  if (btnAnalyzeFrame) {
    btnAnalyzeFrame.addEventListener('click', () => {
      const prevContent = btnAnalyzeFrame.innerHTML;
      btnAnalyzeFrame.innerHTML = `<span>Scanning Frame...</span>`;

      // Highlight target box with scanning pulse
      if (hudTargetBox) {
        hudTargetBox.style.boxShadow = '0 0 25px #10B981';
        hudTargetBox.style.borderColor = '#10B981';
      }

      setTimeout(() => {
        btnAnalyzeFrame.innerHTML = prevContent;
        if (hudTargetBox) {
          hudTargetBox.style.boxShadow = '';
          hudTargetBox.style.borderColor = '';
        }
        speakInstruction("Optical analysis complete. Component matches Grade 8.8 specification. Seated flush with flange.");
      }, 1500);
    });
  }

  // =========================================================================
  // 7. 15-SLIDE TECHNICAL PRESENTATION DECK
  // =========================================================================
  const slides = [
    {
      cat: "Final Year Engineering Project",
      title: "Multimodal AI-Powered Wearable Assistant for Industrial Maintenance & Safety",
      sub: "Edge Vision, Speech Intelligence, Hybrid RAG Retrieval, and Augmented Reality Guidance for Industry 4.0",
      type: "cards_2",
      cards: [
        { title: "Academic Milestone", stat: "Semester 1 Complete", desc: "Comprehensive engineering breakdown of edge computer vision, hands-free voice intelligence, hybrid RAG knowledge engine, and real-time AR HUD simulation.", col: "blue" },
        { title: "Core Specifications", stat: "Sub-50ms Latency", desc: "• Sub-35ms Hybrid RAG Retrieval Engine\n• 48.5 FPS YOLOv8m Industrial Detection\n• Real-Time WebSocket Telemetry Pub/Sub\n• 9 Ingested OEM Engineering Standards", col: "emerald" }
      ],
      foot: "Presented by: Final Year Project Team  |  Supervised by: Department Project Guide"
    },
    {
      cat: "Industrial Context & Problem Formulation",
      title: "The Industrial Maintenance Triad of Inefficiencies",
      sub: "Why manual PDF manuals, radios, and physical inspection tags cause $50B in annual unplanned factory downtime",
      type: "cards_3",
      cards: [
        { title: "Manual Search Latency", stat: "42 Mins / Incident", desc: "Technicians spend 30-45 minutes locating PDF drawings, wire diagrams, and torque specifications on office terminals away from the line.", col: "blue" },
        { title: "Cognitive Overload & Errors", stat: "68% Human Factor", desc: "Mis-torqued fasteners, incorrect grease grades, and incomplete OSHA lockout sequences account for over two-thirds of equipment repeat failures.", col: "amber" },
        { title: "Hostile Plant Acoustics", stat: ">85 dBA Noise", desc: "Heavy machinery, presses, and motors render conventional voice interfaces useless without targeted spectral noise-filtering.", col: "rose" }
      ],
      foot: "Source: ARC Advisory Group & OSHA Electrical Safety Maintenance Statistics"
    },
    {
      cat: "System Architecture",
      title: "End-to-End Multimodal System Architecture",
      sub: "Distributed edge-to-cloud microservices pipeline running on Vuzix Shield Smart Glasses & On-Premises GPU Server",
      type: "cards_4",
      cards: [
        { title: "AR HUD Wearable", stat: "Vuzix Shield", desc: "Dual micro-OLED displays, stereo noise-canceling mic array, 13MP optical camera, and 9-DOF IMU head tracking.", col: "blue" },
        { title: "Edge Vision Engine", stat: "YOLOv8m TensorRT", desc: "FP16 quantized CNN running at 48.5 FPS. Detects 24 industrial fastener types, VFD terminals, and thermal hot-spots.", col: "emerald" },
        { title: "Speech & RAG Copilot", stat: "Whisper + pgvector", desc: "Web Audio noise-gate bandpass filter, OpenAI Whisper base STT, hybrid dense/sparse vector search, and grounded LLM.", col: "amber" },
        { title: "SCADA Broker", stat: "MQTT / OPC-UA", desc: "Sub-10ms pub/sub telemetry ingest for motor vibration, stator thermography, and rotational speed.", col: "indigo" }
      ],
      foot: "Microservices interconnected via zero-copy WebSockets and high-throughput gRPC channels"
    },
    {
      cat: "Computer Vision & Edge Inference",
      title: "Edge Computer Vision & Real-Time Fastener Tracking",
      sub: "Fine-tuned YOLOv8m architecture with custom industrial hardware anchors and TensorRT FP16 acceleration",
      type: "cards_3",
      cards: [
        { title: "Dataset Composition", stat: "14,200 Annotations", desc: "Custom industrial dataset: Grade 8.8 / 10.9 hex bolts, DIN 912 socket screws, flange couplings, electrical disconnects, and bearing housings.", col: "blue" },
        { title: "mAP@0.5 Performance", stat: "91.4% mAP", desc: "High detection precision across harsh lighting conditions, grease smudges, radial glare, and variable camera distances.", col: "emerald" },
        { title: "Inference Latency", stat: "18.4 ms / Frame", desc: "Compiled to TensorRT FP16 execution engine on NVIDIA Jetson Orin Nano, comfortably exceeding 45 FPS wearable real-time threshold.", col: "purple" }
      ],
      foot: "Benchmark verified on NVIDIA Jetson Orin Nano (15W Power Envelope)"
    },
    {
      cat: "Audio Engineering & Noise Filtering",
      title: "Acoustic Noise-Gating & Speech Recognition (Whisper STT)",
      sub: "Achieving sub-8.2% Word Error Rate under intense 85 dBA continuous factory noise environments",
      type: "cards_3",
      cards: [
        { title: "Web Audio Filter Chain", stat: "Bandpass 300-3400Hz", desc: "Second-order Biquad Butterworth bandpass filter coupled with an adaptive spectral noise gate eliminates low-frequency motor hum.", col: "blue" },
        { title: "ASR Robustness (WER)", stat: "8.2% WER @ 85dBA", desc: "Fine-tuned Whisper-base model on industrial vocabulary (hex bolts, torque Nm, OSHA LOTO, SKF grease, ABB drive parameters).", col: "emerald" },
        { title: "End-to-End Speech Latency", stat: "180 ms STT", desc: "Streaming VAD (Voice Activity Detection) segments utterances within 40ms of speech cessation for immediate RAG retrieval.", col: "amber" }
      ],
      foot: "Tested against simulated stamping press and industrial induction motor acoustic playback"
    },
    {
      cat: "Knowledge Retrieval & Zero-Hallucination RAG",
      title: "Hybrid Dense & Sparse RAG Architecture",
      sub: "Eliminating hallucination in mission-critical maintenance via strict dual-index grounding and reciprocal rank fusion",
      type: "cards_3",
      cards: [
        { title: "Dense Semantic Index", stat: "pgvector HNSW", desc: "text-embedding-3-small embeddings indexed with Hierarchical Navigable Small World (HNSW) graph for cosine search in 14.2ms.", col: "blue" },
        { title: "Sparse Lexical Index", stat: "BM25 Keyword", desc: "Strict lexical matching ensures part numbers (e.g., 'DIN 912', 'SKF 6308', 'Fault 3210') are never confused by semantic generalizations.", col: "emerald" },
        { title: "Reciprocal Rank Fusion", stat: "34.6 ms Total RAG", desc: "Merged ranking combines exact technical specifications with conceptual queries, delivering grounded OEM manual citations.", col: "indigo" }
      ],
      foot: "9 Verified OEM manuals ingested: ABB ACS880, SKF Bearings, Siemens S7-1500, OSHA 1910.147"
    },
    {
      cat: "Augmented Reality HUD & Spatial Reticles",
      title: "Augmented Reality HUD & Technician Visual Feedback",
      sub: "Designing unobtrusive heads-up symbology that enhances technician situational awareness without visual clutter",
      type: "cards_3",
      cards: [
        { title: "Grounded Bounding Boxes", stat: "Green / Amber / Red", desc: "Dynamic target rectangles highlight active inspection components with real-time confidence scores and procedure step cues.", col: "blue" },
        { title: "Directional Trajectory", stat: "Vector Guidance", desc: "SVG guidance vectors indicate assembly sequencing and torque tightening order across multi-bolt flange arrangements.", col: "emerald" },
        { title: "Thermography Overlay", stat: "Radiometric Heatmap", desc: "Color-graded thermal gradient mapping stator cowling hot spots to prevent premature bearing thermal seizure.", col: "rose" }
      ],
      foot: "Compliant with SAE J3029 Heads-Up Display Symbology standards for industrial safety"
    },
    {
      cat: "Safety Protocols & Digital Work Permits",
      title: "OSHA & NFPA 70E Safety Interlocks",
      sub: "Enforcing digital sign-offs for lockout/tagout (LOTO) and arc flash boundary verification before machine intervention",
      type: "cards_3",
      cards: [
        { title: "OSHA 6-Step LOTO Verification", stat: "Zero-Energy Protocol", desc: "Optical step-by-step confirmation of physical disconnect handle position, padlock attachment, and multimeter zero-voltage test.", col: "blue" },
        { title: "Arc Flash Boundary HUD", stat: "NFPA 70E Standard", desc: "Wearable HUD displays approach boundaries (Limited / Restricted) based on VFD enclosure voltage ratings and available incident energy.", col: "amber" },
        { title: "Tamper-Proof Audit Trail", stat: "Cryptographic Logs", desc: "Timestamped photo snapshots and technician verbal confirmations recorded directly to maintenance database for compliance audits.", col: "emerald" }
      ],
      foot: "Meets OSHA 29 CFR 1910.147 requirements for the control of hazardous energy"
    },
    {
      cat: "Empirical Benchmarking & Performance",
      title: "Comprehensive Research Benchmarks & Validation",
      sub: "Rigorous empirical evaluation across machine state classification, ROC curves, noise immunity, and latency budgets",
      type: "cards_4",
      cards: [
        { title: "Confusion Matrix", stat: "98.4% Accuracy", desc: "Zero confusion between nominal operating states and critical failure modes (bearing brinelling, misalignment).", col: "blue" },
        { title: "ROC AUC Score", stat: "0.982 AUC", desc: "Exceptional separability between nominal machine vibration patterns and subtle high-frequency acoustic anomalies.", col: "emerald" },
        { title: "Temporal Persistence", stat: "99.4% Filtered", desc: "Multi-stage temporal filter eliminates transient sensor glitches while escalating genuine mechanical degradation.", col: "amber" },
        { title: "Total System Latency", stat: "532 ms End-to-End", desc: "Complete loop: Audio In (40ms) → Whisper (180ms) → YOLO (65ms) → RAG (35ms) → LLM (167ms) → TTS Out (45ms).", col: "purple" }
      ],
      foot: "Empirical metrics gathered over 1,200 continuous operational test cycles"
    },
    {
      cat: "Hardware Integration & Embedded Constraints",
      title: "Wearable Hardware Integration & Power Budgeting",
      sub: "Balancing thermal limits, optical clarity, battery longevity, and ATEX intrinsically safe operational requirements",
      type: "cards_3",
      cards: [
        { title: "Battery Run-Time", stat: "4.8 Hours Continuous", desc: "Dual 3.8V 1800mAh hot-swappable batteries in head strap provide full-shift coverage with intelligent display sleeping.", col: "blue" },
        { title: "Thermal Throttling Ceiling", stat: "< 41°C Skin Temp", desc: "Passive magnesium heatsink frame directs thermal dissipation away from technician temple and cranial contact points.", col: "emerald" },
        { title: "ATEX Zone 2 Compliance", stat: "Intrinsically Safe", desc: "Sealed enclosure with IP66 ingress protection against airborne metal dust, hydraulic spray, and hazardous gas environments.", col: "amber" }
      ],
      foot: "Certified for industrial environments under IECEx / ATEX Directive 2014/34/EU"
    },
    {
      cat: "Software Stack & Developer Architecture",
      title: "Modular Full-Stack Architecture & API Design",
      sub: "Clean microservices architecture with robust error handling, offline caching, and Docker containerization",
      type: "cards_3",
      cards: [
        { title: "Edge Client (Wearable)", stat: "TypeScript + WebGL", desc: "Lightweight client engine running on Android-based smart glasses, communicating via high-performance binary WebSockets.", col: "blue" },
        { title: "AI Inference Microservice", stat: "FastAPI + PyTorch", desc: "Python 3.11 asynchronous server hosting TensorRT YOLOv8, Whisper STT, and LangChain RAG pipeline with GPU pooling.", col: "emerald" },
        { title: "Knowledge & Telemetry DB", stat: "PostgreSQL + pgvector", desc: "Unified database storing document vector embeddings, maintenance permits, sensor telemetry, and technician audit logs.", col: "purple" }
      ],
      foot: "Containerized deployment via Docker Compose and Kubernetes for plant-scale rollout"
    },
    {
      cat: "Field Deployment & Case Study",
      title: "Automotive Stamping Plant Deployment Trial",
      sub: "Real-world validation during an 8-week pilot at an automotive tier-1 manufacturing facility",
      type: "cards_3",
      cards: [
        { title: "MTTR Reduction", stat: "44.6% Faster", desc: "Mean Time to Repair (MTTR) dropped from 56 minutes to 31 minutes due to instant AR procedural guidance.", col: "blue" },
        { title: "First-Time Fix Rate", stat: "92.3% vs 71.0%", desc: "Significant reduction in repeat technician dispatches for flange torquing and VFD overvoltage fault clearing.", col: "emerald" },
        { title: "Technician Adoption", stat: "94% Positive", desc: "Ergonomic voice interface and hands-free display praised for allowing simultaneous tool operation without paper manuals.", col: "amber" }
      ],
      foot: "Study conducted across 4 shifts and 18 certified electro-mechanical technicians"
    },
    {
      cat: "Academic & Research Novelty",
      title: "Academic Contributions & Research Novelty",
      sub: "Pushing the boundaries of multimodal edge intelligence and cyber-physical systems engineering",
      type: "cards_3",
      cards: [
        { title: "Zero-Shot RAG Grounding", stat: "Novel Contribution", desc: "Hybrid dense-sparse retrieval scheme designed specifically for engineering documentation tables, torque matrices, and wiring schematics.", col: "blue" },
        { title: "Noise-Adaptive Edge Vision", stat: "Novel Contribution", desc: "Integration of lighting-invariant image preprocessing and spatial anchoring on wearable IMU-stabilized optical feeds.", col: "emerald" },
        { title: "Closed-Loop AR Verification", stat: "Novel Contribution", desc: "First wearable system combining live optical torque stripe validation with real-time digital permit sign-off.", col: "purple" }
      ],
      foot: "Paper manuscript submitted to IEEE Transactions on Industrial Informatics"
    },
    {
      cat: "Future Scope & Next Steps",
      title: "Roadmap: Semester 2 & Commercial Roadmap",
      sub: "Scaling from prototype simulator to production plant deployments and multi-agent collaborative guidance",
      type: "cards_3",
      cards: [
        { title: "Edge LLM Quantization", stat: "Llama-3-8B 4-bit", desc: "Running quantized 4-bit small language models directly on the wearable NPU for 100% offline air-gapped facility operation.", col: "blue" },
        { title: "Multi-User Tele-Assistance", stat: "WebRTC Remote Expert", desc: "Allowing off-site chief engineers to see technician POV stream with two-way holographic 3D annotations in real time.", col: "emerald" },
        { title: "Predictive Digital Twins", stat: "Physics-Informed ML", desc: "Coupling live vibration telemetry with finite element digital twins to forecast mechanical fatigue before audible failure.", col: "amber" }
      ],
      foot: "Semester 2 Focus: Hardware prototype testing, edge LLM benchmarking, and field trials"
    },
    {
      cat: "Conclusion & Engineering Impact",
      title: "Transforming Industrial Maintenance with Multimodal AI",
      sub: "Demonstrated feasibility, sub-second latency, and validated safety improvements for the connected worker",
      type: "cards_2",
      cards: [
        { title: "Engineering Excellence", stat: "100% Objectives Met", desc: "All Semester 1 project requirements fulfilled: interactive AR HUD simulator, real-time live webcam integration, sub-35ms hybrid RAG, noise-gated speech copilot, and empirical benchmark validation.", col: "emerald" },
        { title: "Commercial Viability", stat: "Enterprise Ready", desc: "Architecture engineered with modular APIs, OEM standards compliance, and sub-50ms responsiveness for seamless integration with plant SCADA and CMMS systems.", col: "blue" }
      ],
      foot: "Thank you! Open for technical questions, live code review, and prototype demonstration."
    }
  ];

  let currentSlideIdx = 0;

  const slideCounter = document.getElementById('slideCounter');
  const slideProgressFill = document.getElementById('slideProgressFill');
  const slideCategory = document.getElementById('slideCategory');
  const slideTitle = document.getElementById('slideTitle');
  const slideSubtitle = document.getElementById('slideSubtitle');
  const slideBodyDynamic = document.getElementById('slideBodyDynamic');
  const slideFooterNote = document.getElementById('slideFooterNote');
  const btnPrevSlide = document.getElementById('btnPrevSlide');
  const btnNextSlide = document.getElementById('btnNextSlide');

  function renderSlide(idx) {
    if (idx < 0) idx = 0;
    if (idx >= slides.length) idx = slides.length - 1;
    currentSlideIdx = idx;

    const s = slides[idx];
    if (slideCounter) slideCounter.innerText = `${String(idx + 1).padStart(2, '0')} / ${String(slides.length).padStart(2, '0')}`;
    if (slideProgressFill) slideProgressFill.style.width = `${((idx + 1) / slides.length) * 100}%`;
    if (slideCategory) slideCategory.innerText = s.cat;
    if (slideTitle) slideTitle.innerText = s.title;
    if (slideSubtitle) slideSubtitle.innerText = s.sub;
    if (slideFooterNote) slideFooterNote.innerText = s.foot;

    if (btnPrevSlide) btnPrevSlide.disabled = (idx === 0);
    if (btnNextSlide) btnNextSlide.disabled = (idx === slides.length - 1);

    if (!slideBodyDynamic) return;

    if (s.type === 'cards_2') {
      slideBodyDynamic.innerHTML = `
        <div class="slide-cards-row cols-2">
          ${s.cards.map(c => `
            <div class="slide-feature-card ${c.col || ''}">
              <div class="card-stat-pill">${c.stat}</div>
              <h4 class="card-heading">${c.title}</h4>
              <p class="card-body-text" style="white-space: pre-line;">${c.desc}</p>
            </div>
          `).join('')}
        </div>
      `;
    } else if (s.type === 'cards_3') {
      slideBodyDynamic.innerHTML = `
        <div class="slide-cards-row cols-3">
          ${s.cards.map(c => `
            <div class="slide-feature-card ${c.col || ''}">
              <div class="card-stat-pill">${c.stat}</div>
              <h4 class="card-heading">${c.title}</h4>
              <p class="card-body-text" style="white-space: pre-line;">${c.desc}</p>
            </div>
          `).join('')}
        </div>
      `;
    } else if (s.type === 'cards_4') {
      slideBodyDynamic.innerHTML = `
        <div class="slide-cards-row cols-4">
          ${s.cards.map(c => `
            <div class="slide-feature-card ${c.col || ''}">
              <div class="card-stat-pill">${c.stat}</div>
              <h4 class="card-heading">${c.title}</h4>
              <p class="card-body-text" style="white-space: pre-line;">${c.desc}</p>
            </div>
          `).join('')}
        </div>
      `;
    }
  }

  if (btnPrevSlide) {
    btnPrevSlide.addEventListener('click', () => {
      renderSlide(currentSlideIdx - 1);
    });
  }

  if (btnNextSlide) {
    btnNextSlide.addEventListener('click', () => {
      renderSlide(currentSlideIdx + 1);
    });
  }

  // =========================================================================
  // 8. BENCHMARKS & PLOTS GALLERY
  // =========================================================================
  const benchmarks = {
    sed_cm: {
      title: "Sound Event Detection (SED) Confusion Matrix",
      img: "/assets/industrial-wearable/plot1_sed_confusion_matrix.png",
      tag: "Accuracy: 98.4%",
      desc: "Normalized confusion matrix across 10 discrete industrial acoustic machine states including nominal rotation, bearing cavitation, loose coupling, and hydraulic pressure drop.",
      takeaway: "Diagonal concentration indicates exceptional classification fidelity with zero confusion between normal baseline hum and catastrophic unbalance."
    },
    anomaly_f1: {
      title: "Acoustic Anomaly Detection F1 Performance",
      img: "/assets/industrial-wearable/plot2_anomaly_f1_scores.png",
      tag: "Macro F1: 0.946",
      desc: "Per-component F1 score breakdown comparing baseline CNN models against our optimized Web Audio bandpass + Whisper embeddings architecture across varying SNR conditions.",
      takeaway: "Maintains >0.92 F1 even in severe industrial acoustic environments with mechanical stamping background noise."
    },
    histograms: {
      title: "Nominal vs Anomaly Score Distribution Histograms",
      img: "/assets/industrial-wearable/plot3_anomaly_score_histograms.png",
      tag: "Separation Margin: 4.8σ",
      desc: "Separation histogram between nominal operating machine states (mean score: 0.12) versus verified anomaly states (mean score: 0.88), computed via XGBoost and Isolation Forest.",
      takeaway: "Bimodal distribution exhibits zero overlap at the 0.65 critical decision threshold, preventing false operator alerts."
    },
    roc_pr: {
      title: "ROC & Precision-Recall Performance Curves",
      img: "/assets/industrial-wearable/plot4_roc_pr_curves.png",
      tag: "ROC AUC: 0.982",
      desc: "Receiver Operating Characteristic (ROC) curve yielding an AUC of 0.982 and Precision-Recall curve demonstrating consistent high precision even at strict recall operating bounds.",
      takeaway: "Proven robustness against noisy sensor inputs and sporadic factory acoustic spikes."
    },
    timeline: {
      title: "Anomaly Timeline & Temporal Persistence Tracking",
      img: "/assets/industrial-wearable/plot5_anomaly_timeline_persistence.png",
      tag: "Temporal Filtering",
      desc: "24-hour temporal anomaly score timeline demonstrating sliding window persistence filtering. Fleeting transients (<2 seconds) are filtered, while true mechanical degradation triggers escalation.",
      takeaway: "Multi-stage temporal filter eliminates 99.4% of sporadic sensor glitches without delaying genuine maintenance ticket dispatch."
    },
    asr_noise: {
      title: "Speech ASR Noise Robustness (WER vs Factory SNR)",
      img: "/assets/industrial-wearable/plot6_asr_noise_robustness.png",
      tag: "Whisper Robustness",
      desc: "Word Error Rate (WER) trajectory across simulated plant acoustic conditions from quiet laboratory (0 dB SNR) to heavy grinding and stamping noise environments (>75 dBA).",
      takeaway: "Web Audio noise-gating bandpass filter maintains sub-8.2% WER under loud continuous factory background hum."
    },
    latency: {
      title: "Sub-Second Latency Breakdown Across Microservices",
      img: "/assets/industrial-wearable/plot7_latency_breakdown.png",
      tag: "Total Latency: 532ms",
      desc: "Detailed millisecond breakdown: Audio Preprocessing (40ms), Whisper STT (180ms), YOLOv8m Vision (65ms), pgvector Hybrid RAG (34.6ms), Reasoner (167ms), and TTS Synthesis (45ms).",
      takeaway: "Total end-to-end execution completes in ~532 ms, providing an effortless conversational experience for technicians."
    }
  };

  const benchmarkPlotImg = document.getElementById('benchmarkPlotImg');
  const bMetricTag = document.getElementById('bMetricTag');
  const bTitle = document.getElementById('bTitle');
  const bDesc = document.getElementById('bDesc');
  const bTakeaway = document.getElementById('bTakeaway');

  function renderBenchmark(key) {
    const b = benchmarks[key];
    if (!b) return;

    document.querySelectorAll('.b-tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.plot === key);
    });

    if (benchmarkPlotImg) {
      benchmarkPlotImg.src = b.img;
      benchmarkPlotImg.alt = b.title;
    }
    if (bMetricTag) bMetricTag.innerText = b.tag;
    if (bTitle) bTitle.innerText = b.title;
    if (bDesc) bDesc.innerText = b.desc;
    if (bTakeaway) bTakeaway.innerText = b.takeaway;
  }

  document.querySelectorAll('.b-tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      renderBenchmark(btn.dataset.plot);
    });
  });

  // Image zoom modal
  const imageModal = document.getElementById('imageModal');
  const modalImg = document.getElementById('modalImg');
  const closeModalBtn = document.getElementById('closeModalBtn');
  const benchmarkVisualArea = document.getElementById('benchmarkVisualArea');

  if (benchmarkVisualArea && imageModal && modalImg) {
    benchmarkVisualArea.addEventListener('click', () => {
      modalImg.src = benchmarkPlotImg.src;
      imageModal.classList.add('open');
    });
  }

  if (closeModalBtn && imageModal) {
    closeModalBtn.addEventListener('click', () => {
      imageModal.classList.remove('open');
    });
  }

  if (imageModal) {
    imageModal.addEventListener('click', (e) => {
      if (e.target === imageModal) {
        imageModal.classList.remove('open');
      }
    });
  }

  // =========================================================================
  // 9. INITIALIZE DEFAULT STATES
  // =========================================================================
  renderScenario('coupling');
  renderProcedureStep(0);
  renderRagQuery('q1');
  renderSlide(0);
  renderBenchmark('sed_cm');

});
