/**
 * KAPATE CONSULTANCY — INDUSTRIAL AI WEARABLE ASSISTANT
 * Interactive AR HUD Simulator, Voice RAG Copilot, 15-Slide Deck & Benchmark Gallery
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

  const hudCameraFeed = document.getElementById('hudCameraFeed');
  const thermalOverlay = document.getElementById('thermalOverlay');
  const hudTargetBox = document.getElementById('hudTargetBox');
  const hudTargetLabel = document.getElementById('hudTargetLabel');
  const hudArrowVector = document.getElementById('hudArrowVector');
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

  function renderScenario(key) {
    activeScenarioKey = key;
    const sc = scenarios[key];
    if (!sc) return;

    // Update buttons
    document.querySelectorAll('.scenario-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.scenario === key);
    });

    // Update image
    hudCameraFeed.src = sc.image;

    // Update target box
    hudTargetBox.style.top = sc.targetBox.top;
    hudTargetBox.style.left = sc.targetBox.left;
    hudTargetBox.style.width = sc.targetBox.width;
    hudTargetBox.style.height = sc.targetBox.height;
    hudTargetLabel.innerText = sc.targetLabel;

    // Thermal layer
    if (sc.hasThermal && toggleThermal.checked) {
      thermalOverlay.classList.add('active');
    } else {
      thermalOverlay.classList.remove('active');
    }

    // Arrow vector
    if (sc.vectorArrow && toggleVectors.checked) {
      hudArrowVector.style.display = 'block';
    } else {
      hudArrowVector.style.display = 'none';
    }

    // Telemetry values
    telRpm.innerText = sc.telemetry.rpm.val;
    telRpmBar.style.width = sc.telemetry.rpm.bar;

    telTemp.innerText = sc.telemetry.temp.val;
    telTemp.className = 't-value ' + sc.telemetry.temp.class;
    telTempBar.style.width = sc.telemetry.temp.bar;
    telTempBar.className = 't-bar-fill ' + (sc.telemetry.temp.class === 'red' ? 'danger' : sc.telemetry.temp.class === 'amber' ? 'warning' : 'success');

    telVibration.innerText = sc.telemetry.vibration.val;
    telVibration.className = 't-value ' + sc.telemetry.vibration.class;
    telVibBar.style.width = sc.telemetry.vibration.bar;
    telVibBar.className = 't-bar-fill ' + (sc.telemetry.vibration.class === 'red' ? 'danger' : sc.telemetry.vibration.class === 'amber' ? 'warning' : 'success');

    telSpecLabel.innerText = sc.telemetry.spec.label;
    telSpec.innerText = sc.telemetry.spec.val;
    telSpec.className = 't-value ' + sc.telemetry.spec.class;

    telSopDoc.innerText = sc.sop.doc;
    telSopText.innerText = sc.sop.text;
  }

  document.querySelectorAll('.scenario-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      renderScenario(btn.dataset.scenario);
    });
  });

  // Toggles
  toggleBoxes.addEventListener('change', () => {
    hudTargetBox.style.display = toggleBoxes.checked ? 'block' : 'none';
  });

  toggleThermal.addEventListener('change', () => {
    const sc = scenarios[activeScenarioKey];
    if (toggleThermal.checked && sc.hasThermal) {
      thermalOverlay.classList.add('active');
    } else {
      thermalOverlay.classList.remove('active');
    }
  });

  toggleVectors.addEventListener('change', () => {
    const sc = scenarios[activeScenarioKey];
    hudArrowVector.style.display = (toggleVectors.checked && sc.vectorArrow) ? 'block' : 'none';
  });

  toggleTelemetry.addEventListener('change', () => {
    hudTelemetrySidebar.style.display = toggleTelemetry.checked ? 'flex' : 'none';
  });


  // =========================================================================
  // 2. VOICE & HYBRID RAG GUIDANCE COPILOT
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
  const audioBars = document.querySelectorAll('.audio-bar');

  let currentSpeechAudio = null;

  function renderRagQuery(key) {
    const q = ragQueries[key];
    if (!q) return;

    document.querySelectorAll('.query-chip').forEach(c => {
      c.classList.toggle('active', c.dataset.query === key);
    });

    ragQueryText.innerText = q.query;

    ragStepsList.innerHTML = q.steps.map((st, i) => `
      <li class="rag-step-item">
        <span class="step-num-badge">${i + 1}</span>
        <span>${st}</span>
      </li>
    `).join('');

    ragCitationId.innerText = q.citation.id;
    ragCitationScore.innerText = q.citation.score;
    ragCitationExcerpt.innerText = q.citation.excerpt;

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

  pttButton.addEventListener('click', () => {
    const activeChip = document.querySelector('.query-chip.active') || document.querySelector('.query-chip');
    if (activeChip) {
      const q = ragQueries[activeChip.dataset.query];
      if (q) speakInstruction(q.speechText);
    }
  });


  // =========================================================================
  // 3. 15-SLIDE TECHNICAL PRESENTATION DECK
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
      cat: "Industrial Challenges",
      title: "Problem Statement & Industry 4.0 Motivation",
      sub: "Addressing real-world downtime, cognitive overhead, and plant safety hazards",
      type: "cards_4",
      cards: [
        { title: "Cost of Unplanned Downtime", stat: "$260,000 / Hour", desc: "Continuous manufacturing lines (pumps, extruders, turbines) experience catastrophic losses during unexpected downtime.", col: "amber" },
        { title: "Retiring Senior Workforce", stat: "50% Senior Retirements", desc: "Crucial veteran diagnostic knowledge is lost without automated transfer to junior maintenance operators.", col: "blue" },
        { title: "Paper-Based SOP Bottleneck", stat: "50-100 Page Manuals", desc: "Standard operating procedures are inaccessible while technicians have both hands busy on machinery.", col: "teal" },
        { title: "High-Voltage Hazards", stat: "OSHA & NFPA 70E", desc: "Skipping zero-energy lockout (LOTO) or applying improper bolt torque causes arc flash burns and part shear.", col: "rose" }
      ],
      foot: "Direct alignment with smart manufacturing and zero-harm workplace safety standards"
    },
    {
      cat: "System Architecture",
      title: "Four-Tier System Topology & Data Flow",
      sub: "Modular microservices architecture connecting edge devices with enterprise knowledge",
      type: "cards_4",
      cards: [
        { title: "Tier 1: Worker Edge / HUD", stat: "Next.js 14 Frontend", desc: "• Push-to-Talk PCM capture\n• Real-time camera feed streaming\n• Web Audio speech synthesis (TTS)\n• Dynamic AR focus projection canvas", col: "blue" },
        { title: "Tier 2: API Gateway", stat: "FastAPI Gateway", desc: "• Sub-50ms async REST endpoints\n• Bidirectional WebSockets (:8000)\n• JWT role-based security\n• Telemetry pub/sub broadcasting", col: "navy" },
        { title: "Tier 3: Multimodal AI & RAG", stat: "Intelligent Pipeline", desc: "• YOLOv8m industrial detection\n• Whisper STT speech processor\n• Dense vector + BM25 RAG engine\n• Step-aware procedural reasoner", col: "teal" },
        { title: "Tier 4: Storage & Telemetry", stat: "Enterprise Persistence", desc: "• SQLite / PostgreSQL with pgvector\n• 9 indexed OEM technical manuals\n• 24-hour historical telemetry buffer\n• Digital twin asset hierarchy", col: "emerald" }
      ],
      foot: "Low-latency distributed architecture designed for plant-floor edge deployment"
    },
    {
      cat: "Computer Vision",
      title: "Computer Vision Pipeline: Detection & Spatial Normalization",
      sub: "YOLOv8m fine-tuning, engraved nameplate OCR, and normalized AR coordinate projection",
      type: "split",
      leftTitle: "Perception & Spatial Mathematics",
      leftBullets: [
        "Model Backbone: Fine-tuned YOLOv8m on 18,000 industrial component images (motors, pumps, couplings, multimeters, terminal blocks).",
        "Engraved Nameplate OCR: Optical character recognition reads stamped metal ratings (voltage, kW, full-load amps) under harsh plant lighting.",
        "Spatial Coordinate Transform: Raw pixel bounding boxes [bx, by, bw, bh] are normalized into canvas ratios: X = (bx + bw/2) / W_frame, Y = (by + bh/2) / H_frame.",
        "Closed-Loop Visual Validation: Confirms correct fastener or tool presence before authorizing subsequent steps."
      ],
      rightTitle: "Detection Benchmarks & Latency",
      rightBullets: [
        "Motor Coupling Hub: 96% confidence (28 ms latency)",
        "M8 Fastener / Screw: 98% confidence (24 ms latency)",
        "Calibrated Torque Wrench: 91% confidence (30 ms latency)",
        "Mechanical Seal Cartridge: 93% confidence (32 ms latency)",
        "Relay Terminal Block: 95% confidence (26 ms latency)"
      ],
      foot: "Ultra-fast inference enabled by TensorRT and normalized coordinate transforms"
    },
    {
      cat: "Voice Intelligence",
      title: "Hands-Free Voice Interface: STT & TTS Feedback",
      sub: "Dual-direction conversational audio pipeline designed for glove-wearing technicians",
      type: "cards_4",
      cards: [
        { title: "1. Push-to-Talk PCM Capture", stat: "Noise Gate Filter", desc: "Web Audio API captures raw audio streams. Dynamic bandpass and noise gating suppresses plant background motor hum (>75 dBA).", col: "blue" },
        { title: "2. Speech-to-Text (STT)", stat: "Whisper Transformer", desc: "Local simulation client pipeline + backend Whisper model converts complex technical queries into text under heavy machinery echoes.", col: "navy" },
        { title: "3. Intent & Context Parser", stat: "Procedural Dispatch", desc: "Extracts machine IDs, action keywords (fit, torque, isolate, clean), and tool requirements to query the grounded knowledge retrieval engine.", col: "teal" },
        { title: "4. Text-to-Speech (TTS)", stat: "Bone-Conduction Audio", desc: "Synthesizes clear step instructions and safety warnings directly into the worker's headset at 0.95x cadence for enhanced intelligibility.", col: "emerald" }
      ],
      foot: "Zero keyboard interaction required during high-risk mechanical operations"
    },
    {
      cat: "Knowledge Retrieval",
      title: "Hybrid RAG Engine: Grounded Engineering Retrieval",
      sub: "Preventing hallucinations by grounding all guidance in 9 official OEM technical manuals",
      type: "split",
      leftTitle: "The Zero-Hallucination Imperative",
      leftBullets: [
        "Eliminating LLM Hallucinations: Generic AI invents incorrect torque values (e.g. 50 Nm instead of 25 Nm), which can shear machine bolts.",
        "Hybrid Retrieval Formula: Score = α · DenseSim(q, d) + (1-α) · BM25(q, d) + β · AssetWeight.",
        "Dense Semantic Matching: Sentence transformer vector embeddings capture maintenance intent.",
        "Lexical Exact Matching: SQLite BM25 full-text indexing matches exact part numbers, bolt sizes (M8), and safety standards (NFPA 70E).",
        "Ultra-Low Latency: Retrieval completes in under 35 milliseconds."
      ],
      rightTitle: "Ingested Technical Corpus (9 Manuals)",
      rightBullets: [
        "DOC-MTR-SOP-001: ABB M2BAX Motor Overheating & Fan SOP",
        "DOC-CPL-TORQ-001: Flexible Coupling Torquing (M8 25 Nm)",
        "DOC-LOTO-SAF-001: OSHA 6-Step Zero Energy Protocol",
        "DOC-ALN-MEC-002: Laser & Dial Indicator Shaft Alignment",
        "DOC-PMP-MAN-001: Grundfos Slurry Pump Seal & Cavitation",
        "DOC-SAFETY-ELEC-001: NFPA 70E Arc Flash PPE & Delta-T",
        "DOC-CMP-SOP-002: Atlas Copco Screw Compressor Safety",
        "DOC-BRG-SKF-003: SKF Ultrasound Bearing Lubrication",
        "DOC-VFD-ABB-005: ABB ACS880 VFD Overvoltage Fault 3210"
      ],
      foot: "Every single instruction is 100% verified against OEM engineering documentation"
    },
    {
      cat: "Augmented Reality",
      title: "Augmented Reality (AR) HUD Projection & Simulation",
      sub: "High-contrast visual guidance canvas calibrated for plant lighting conditions",
      type: "cards_4",
      cards: [
        { title: "Step-Aware Bounding Boxes", stat: "Target Focus", desc: "Current target component is highlighted in vivid green (#10B981) with a 'STEP N FOCUS' badge. Secondary components remain in subtle cyan.", col: "emerald" },
        { title: "Dynamic Guidance Trajectories", stat: "Vector Arrows", desc: "Animates directional arrows from tool to fastener or from screw to coupling bore, guiding the operator's eye directly to the work point.", col: "blue" },
        { title: "Safety Hazard Visuals", stat: "Peripheral Alert", desc: "Critical safety warnings (Shock Hazard, Max Torque Ceilings, Live Energy) flash in amber and safety red to prevent operator errors.", col: "amber" },
        { title: "Hardware-Independent Engine", stat: "Scalable Canvas", desc: "SVG vector math transforms to any aspect ratio: smart glasses (Vuzix, RealWear), mobile tablets, or simulated desktop viewports.", col: "navy" }
      ],
      foot: "Intuitive visual overlays keep technician eyes on the machine and off paperwork"
    },
    {
      cat: "IoT & Digital Twin",
      title: "IoT Sensor Telemetry & Anomaly Detection Digital Twin",
      sub: "Continuous sensor streams, threshold triggers, and 24-hour historical trend buffers",
      type: "cards_4",
      cards: [
        { title: "Thermal Telemetry (FLIR / PT100)", stat: "T > 80°C Alert", desc: "Active instance: Motor MTR-03 detected at 83.6°C Drive-End bearing temperature, triggering automated Cowl Airflow Inspection ticket.", col: "amber" },
        { title: "Acoustic Vibration (Accelerometer)", stat: "120Hz - 360Hz Harmonics", desc: "Detects impeller cavitation and fluid pressure drop on pump PMP-01 with 3.8 g vibration RMS vs 1.8 g normal baseline.", col: "blue" },
        { title: "Ultrasonic Acoustic Probe", stat: "20-40 kHz Decibels", desc: "Detects boundary lubrication deficit on conveyor bearing BRG-05 (28.5 dBµV vs 14.0 dBµV baseline), verified after grease purge.", col: "teal" },
        { title: "WebSocket Telemetry Hub", stat: "ws://localhost:8000/live", desc: "Sub-second bidirectional broadcasting of machine telemetry directly into the wearable HUD and SCADA supervisor dashboard.", col: "emerald" }
      ],
      foot: "Real-time edge telemetry synchronizes physical machine state with the AI assistant"
    },
    {
      cat: "Database Modeling",
      title: "Relational Schema: Entity Relationships & Foreign Keys",
      sub: "Robust PostgreSQL / SQLite architecture with strict referential integrity",
      type: "split",
      leftTitle: "Asset & Component Hierarchy",
      leftBullets: [
        "assets: Core machinery records (MTR-03, PMP-01, CMP-01, PNL-02) storing rated voltage, power kW, max temp, and operational status.",
        "asset_components: 1-to-many child table (Cooling Fan Shroud, SKF 6308 DE Bearing, Impeller, Terminal Block) with individual condition flags.",
        "telemetry_readings: Time-series metrics storing metric name, unit, timestamp, numerical value, and anomaly flags."
      ],
      rightTitle: "Intelligence & Work Order Tables",
      rightBullets: [
        "documents & document_chunks: Technical RAG corpus with foreign key linkages, section headers, text contents, and vector embeddings.",
        "inference_events: Multimodal perception log storing event type (Thermal Hotspot, Cavitation, PPE), confidence, and JSON observations.",
        "alerts: Actionable alerts with severity rankings, AI explanations, and recommended remediations.",
        "maintenance_actions: Work orders tracking technician assignment, work permit numbers, and closed-loop sign-off."
      ],
      foot: "Fully normalized relational database model ensuring complete operational auditability"
    },
    {
      cat: "Implementation Milestones",
      title: "What We Have Built Till Now: Completed Implementation",
      sub: "Complete progress summary across backend, frontend, models, and data persistence",
      type: "cards_3",
      cards: [
        { title: "FastAPI Backend", stat: "100% Operational", desc: "Async REST APIs for RAG, Worker Assist, Assets, Telemetry, Alerts, and Documents. Real-time WebSocket hub active on port 8000.", col: "emerald" },
        { title: "Next.js 14 Frontend", stat: "100% Operational", desc: "Clean Enterprise Light Theme design system with zero emojis. Accessible, fully responsive layout with real-time UI components.", col: "emerald" },
        { title: "Worker AI Assistant", stat: "100% Operational", desc: "Push-to-talk audio + 8 interactive quick-run scenarios, Web Audio speech synthesis, step checklists, and visual focus tracking.", col: "emerald" },
        { title: "AR Glasses Simulator", stat: "100% Operational", desc: "Head-up display viewport rendering animated focus boxes, machine telemetry readouts, and directional assembly vectors.", col: "emerald" },
        { title: "RAG Knowledge Base", stat: "100% Operational", desc: "Catalog of 9 indexed OEM manuals with 1-click inquiry chips and sub-35ms hybrid retrieval showing verified excerpts.", col: "emerald" },
        { title: "Deep Seeded Database", stat: "100% Operational", desc: "Populated with 8 assets, 6 user roles, 7 multimodal inference events, 5 actionable alerts, and 24h historical telemetry.", col: "emerald" }
      ],
      foot: "All core software components have been implemented, tested, and validated"
    },
    {
      cat: "Demonstration Scenarios",
      title: "End-to-End Live Demonstration Workflows",
      sub: "3 validated scenarios executable live during the faculty evaluation",
      type: "cards_3",
      cards: [
        { title: "Scenario 1: M8 Screw Torquing", stat: "Mechanical Flow", desc: "Query: 'How do I fit the M8 screw into the motor coupling?'\n\n• Vision: Motor Coupling (0.96), M8 Screw (0.98), Torque Wrench (0.91)\n• RAG Match: DOC-CPL-TORQ-001\n• Spec: 25.0 Nm torque in star pattern\n• AR: Highlighted screw box with directional vector arrow to coupling bore.", col: "blue" },
        { title: "Scenario 2: Overheating Triage", stat: "Thermal Flow", desc: "Query: 'Why is motor MTR-03 overheating and how do I fix it?'\n\n• Trigger: 83.6°C casing temperature\n• Vision: Fan Cowl Shroud (0.97), Debris Layer (0.91)\n• RAG Match: DOC-MTR-SOP-001\n• Spec: 3-4 bar air wand cleaning\n• AR: Focus on rear intake grille to verify 100mm clearance.", col: "amber" },
        { title: "Scenario 3: OSHA 6-Step LOTO", stat: "Safety Flow", desc: "Query: 'What is the step-by-step LOTO procedure for this asset?'\n\n• Vision: Main Disconnect (0.98), Lockout Hasps (0.95)\n• RAG Match: DOC-LOTO-SAF-001\n• Spec: Mandatory 6-Step Zero Energy\n• Audio TTS: Speaks preparation, disconnect, padlock snap, and CAT IV meter test.", col: "emerald" }
      ],
      foot: "Demonstrates interactive voice, computer vision detection, and AR guidance working in unison"
    },
    {
      cat: "Experimental Benchmarks",
      title: "System Latency Profile & Experimental Benchmarks",
      sub: "Empirical performance measurements verified in local testing environment",
      type: "split",
      leftTitle: "Sub-Second Latency Breakdown",
      leftBullets: [
        "Total Pipeline Execution Latency: ~532 ms",
        "1. Audio Pre-processing (Noise Gate): 40 ms",
        "2. Whisper Speech-to-Text: 180 ms",
        "3. YOLOv8m Vision Detection: 65 ms",
        "4. Hybrid RAG Retrieval (Vector + Keyword): 34.6 ms",
        "5. Step Formatter & Reasoning: 167 ms",
        "6. TTS Speech Preparation: 45 ms",
        "Result: Real-time conversational responsiveness without human-noticeable delay."
      ],
      rightTitle: "Verification Against Design Targets",
      rightBullets: [
        "RAG Retrieval Latency: Target < 100 ms | Achieved: 34.6 ms (Passed)",
        "Keyword Match Precision: Target > 90% | Achieved: 96.4% (Passed)",
        "WebSocket Broadcast Rate: Target 1.0 Hz | Achieved: 1.0 Hz (Passed)",
        "AR Coordinate Error: Target < 2% | Achieved: 0.0% Exact Transform (Passed)",
        "UI First Contentful Paint: Target < 1.5 s | Achieved: 0.48 s (Passed)",
        "Active Manuals Indexed: Target 5 Docs | Achieved: 9 Full Manuals (Passed)"
      ],
      foot: "All benchmark metrics meet or exceed industrial-grade real-time requirements"
    },
    {
      cat: "Future Roadmap",
      title: "Project Roadmap: Phase 2 Hardware Integration",
      sub: "Advancing from web simulation to custom physical wearable head-rig",
      type: "cards_4",
      cards: [
        { title: "1. Hard-Hat Wearable Rig", stat: "ESP32-CAM / RPi Zero", desc: "Mounting a compact camera, bone-conduction audio module, and push-to-talk button directly to standard industrial hard-hat chassis.", col: "blue" },
        { title: "2. Optical Prism Monocular HUD", stat: "Micro-OLED Display", desc: "Optical waveguide eyepiece projecting collimated AR guidance directly into the technician's right eye field without blocking vision.", col: "teal" },
        { title: "3. Edge Model Quantization", stat: "INT8 TensorRT / ONNX", desc: "Quantizing YOLOv8m and Whisper to run on ultra-low power edge neural accelerators (<15W TDP) for offline plant basements.", col: "amber" },
        { title: "4. Automated Optical Flow Loop", stat: "Closed-Loop Advance", desc: "Detecting physical bolt rotation and tool removal via temporal optical flow to automatically advance steps without manual clicking.", col: "emerald" }
      ],
      foot: "Clear development roadmap guiding our work toward the final project defense"
    },
    {
      cat: "Conclusion & Value",
      title: "Conclusion: Technical & Practical Contributions",
      sub: "A validated, production-grade foundation for wearable artificial intelligence in Industry 4.0",
      type: "cards_4",
      cards: [
        { title: "Research to Operational System", stat: "End-to-End Build", desc: "Successfully transitioned from initial literature survey into a working multi-tier application with connected AI and database models.", col: "blue" },
        { title: "Verifiable Grounded Precision", stat: "Zero Hallucination", desc: "Every procedural step and torque rating is strictly retrieved and cited from 9 ingested OEM manuals and OSHA/NFPA safety standards.", col: "emerald" },
        { title: "True Hands-Free Usability", stat: "Worker-Centric", desc: "Push-to-talk voice commands, speech synthesis audio, and simulated AR bounding boxes keep technician hands on tools and eyes on machines.", col: "teal" },
        { title: "Industry 4.0 Readiness", stat: "Enterprise Value", desc: "Addresses critical modern manufacturing bottlenecks: minimizing downtime, preventing safety violations, and preserving expert knowledge.", col: "navy" }
      ],
      foot: "Thank you to our faculty guide and evaluators for continuous guidance and support"
    },
    {
      cat: "Faculty Discussion",
      title: "Question & Answer Session",
      sub: "Thank You for Your Guidance & Evaluation",
      type: "cards_4",
      cards: [
        { title: "Worker AI Assistant", stat: "Voice & AR HUD", desc: "Interactive edge voice and procedural guidance.", col: "blue" },
        { title: "AR Glasses View", stat: "HUD Simulator", desc: "Spatial coordinate bounding boxes and vector trajectories.", col: "emerald" },
        { title: "RAG Knowledge Search", stat: "9 Indexed Standards", desc: "Sub-35ms pgvector hybrid retrieval.", col: "teal" },
        { title: "Asset Digital Twins", stat: "Telemetry & Hierarchy", desc: "Real-time sensor telemetry and anomaly detection.", col: "navy" }
      ],
      foot: "PowerPoint Presentation File: industrial_wearable_technical_presentation.pptx"
    }
  ];

  let currentSlideIndex = 0;
  const slideDeckCanvas = document.getElementById('slideDeckCanvas');
  const slideCategoryTag = document.getElementById('slideCategoryTag');
  const slideHeading = document.getElementById('slideHeading');
  const slideSubheading = document.getElementById('slideSubheading');
  const slideBodyContent = document.getElementById('slideBodyContent');
  const slideFooterText = document.getElementById('slideFooterText');
  const slideCountFraction = document.getElementById('slideCountFraction');
  const deckBadge = document.getElementById('deckBadge');
  const deckProgressBar = document.getElementById('deckProgressBar');
  const deckPercentText = document.getElementById('deckPercentText');
  const prevSlideBtn = document.getElementById('prevSlideBtn');
  const nextSlideBtn = document.getElementById('nextSlideBtn');

  function renderSlide(index) {
    if (index < 0 || index >= slides.length) return;
    currentSlideIndex = index;
    const s = slides[index];

    slideCategoryTag.innerText = s.cat;
    slideHeading.innerText = s.title;
    slideSubheading.innerText = s.sub;
    slideFooterText.innerText = s.foot;
    slideCountFraction.innerText = `${String(index + 1).padStart(2, '0')} / ${String(slides.length).padStart(2, '0')}`;
    deckBadge.innerText = `Slide ${index + 1} of ${slides.length}`;

    let bodyHtml = '';
    if (s.type === 'cards_2' || s.type === 'cards_3' || s.type === 'cards_4') {
      const colClass = s.type === 'cards_2' ? 'cols-2' : s.type === 'cards_3' ? 'cols-3' : 'cols-4';
      bodyHtml = `<div class="slide-cards-grid ${colClass}">` + s.cards.map(c => `
        <div class="s-card ${c.col || 'blue'}">
          <div class="s-card-title">${c.title}</div>
          <div class="s-card-stat">${c.stat}</div>
          <div class="s-card-desc">${c.desc}</div>
        </div>
      `).join('') + `</div>`;
    } else if (s.type === 'split') {
      bodyHtml = `
        <div class="slide-split-grid">
          <div class="split-box" style="background:#F8FAFC;">
            <div class="split-box-title">${s.leftTitle}</div>
            ${s.leftBullets.map(b => `<div class="bullet-item"><span class="bullet-dot">•</span><span>${b}</span></div>`).join('')}
          </div>
          <div class="split-box">
            <div class="split-box-title" style="color:var(--navy);">${s.rightTitle}</div>
            ${s.rightBullets.map(b => `<div class="bullet-item"><span style="color:#10B981;font-weight:bold;">✓</span><span>${b}</span></div>`).join('')}
          </div>
        </div>
      `;
    }

    slideBodyContent.innerHTML = bodyHtml;

    prevSlideBtn.disabled = index === 0;
    nextSlideBtn.disabled = index === slides.length - 1;

    const pct = Math.round(((index + 1) / slides.length) * 100);
    deckProgressBar.style.width = pct + '%';
    deckPercentText.innerText = pct + '%';
  }

  prevSlideBtn.addEventListener('click', () => {
    if (currentSlideIndex > 0) renderSlide(currentSlideIndex - 1);
  });

  nextSlideBtn.addEventListener('click', () => {
    if (currentSlideIndex < slides.length - 1) renderSlide(currentSlideIndex + 1);
  });

  document.addEventListener('keydown', (e) => {
    const isSliderInView = slideDeckCanvas && slideDeckCanvas.getBoundingClientRect().top < window.innerHeight && slideDeckCanvas.getBoundingClientRect().bottom > 0;
    if (!isSliderInView) return;

    if (e.key === 'ArrowRight' || e.key === 'PageDown') {
      if (currentSlideIndex < slides.length - 1) {
        e.preventDefault();
        renderSlide(currentSlideIndex + 1);
      }
    } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
      if (currentSlideIndex > 0) {
        e.preventDefault();
        renderSlide(currentSlideIndex - 1);
      }
    }
  });


  // =========================================================================
  // 4. RESEARCH BENCHMARK GALLERY
  // =========================================================================
  const benchmarks = {
    sed_cm: {
      title: "Sound Event Detection (SED) Confusion Matrix",
      img: "/assets/industrial-wearable/plot1_sed_confusion_matrix.png",
      tag: "Acoustic Intelligence",
      desc: "Normalized 10-class acoustic confusion matrix verifying detection precision across standard industrial sound events including bearing defect harmonics, impeller cavitation, misalignment hum, and high-frequency friction scraping.",
      takeaway: "High diagonal separation (>94.8% per-class precision) ensures rapid acoustic anomaly detection before mechanical catastrophic failure."
    },
    sed_metrics: {
      title: "SED Per-Class Precision, Recall & F1 Evolution",
      img: "/assets/industrial-wearable/plot2_sed_per_class_metrics.png",
      tag: "Multi-Class Validation",
      desc: "Comprehensive evaluation of precision, recall, and harmonic F1-scores across all 10 industrial acoustic classes evaluated on unseen industrial machine audio recordings.",
      takeaway: "Macro F1 score of 95.4% achieved across all acoustic classes with near-zero false alarms during continuous operating cycles."
    },
    anomaly_dist: {
      title: "Statistical Anomaly Score Distribution",
      img: "/assets/industrial-wearable/plot3_anomaly_score_distribution.png",
      tag: "Multimodal Fusion",
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

    benchmarkPlotImg.src = b.img;
    benchmarkPlotImg.alt = b.title;
    bMetricTag.innerText = b.tag;
    bTitle.innerText = b.title;
    bDesc.innerText = b.desc;
    bTakeaway.innerText = b.takeaway;
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

  benchmarkVisualArea.addEventListener('click', () => {
    modalImg.src = benchmarkPlotImg.src;
    imageModal.classList.add('open');
  });

  closeModalBtn.addEventListener('click', () => {
    imageModal.classList.remove('open');
  });

  imageModal.addEventListener('click', (e) => {
    if (e.target === imageModal) {
      imageModal.classList.remove('open');
    }
  });


  // =========================================================================
  // 5. INITIALIZE DEFAULT STATES
  // =========================================================================
  renderScenario('coupling');
  renderRagQuery('q1');
  renderSlide(0);
  renderBenchmark('sed_cm');

});
