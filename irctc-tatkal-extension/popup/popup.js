// IRCTC Tatkal SuperFast Pro - Popup Controller

document.addEventListener("DOMContentLoaded", async () => {
  // Tab Switching
  const tabButtons = document.querySelectorAll(".tab-btn");
  const tabContents = document.querySelectorAll(".tab-content");

  tabButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      tabButtons.forEach((b) => b.classList.remove("active"));
      tabContents.forEach((c) => c.classList.remove("active"));
      btn.classList.add("active");
      const target = document.getElementById(btn.dataset.tab);
      if (target) target.classList.add("active");
    });
  });

  // State
  let config = {};
  let passengers = [];

  // DOM Elements
  const masterToggle = document.getElementById("master-toggle");
  const toggleStatusText = document.getElementById("toggle-status-text");
  const ocrDot = document.getElementById("ocr-dot");
  const ocrStatusText = document.getElementById("ocr-status-text");
  const tatkalBadge = document.getElementById("tatkal-time-badge");

  const sourceStation = document.getElementById("source-station");
  const destStation = document.getElementById("dest-station");
  const travelDatePicker = document.getElementById("travel-date-picker");
  const trainNo = document.getElementById("train-no");
  const trainCoach = document.getElementById("train-coach");
  const quota = document.getElementById("quota");
  const boardingStation = document.getElementById("boarding-station");

  const btnAddPassenger = document.getElementById("btn-add-passenger");
  const passengerContainer = document.getElementById("passenger-list-container");
  const passengerCountSpan = document.getElementById("passenger-count");
  const confirmBerthsOnly = document.getElementById("confirm-berths-only");
  const autoUpgrade = document.getElementById("auto-upgrade");
  const mobileNumber = document.getElementById("mobile-number");

  const autoLoginToggle = document.getElementById("auto-login-toggle");
  const irctcUsername = document.getElementById("irctc-username");
  const irctcPassword = document.getElementById("irctc-password");
  const captchaMode = document.getElementById("captcha-mode");
  const captchaServerUrl = document.getElementById("captcha-server-url");
  const soundAlerts = document.getElementById("sound-alerts");
  const btnTestOcr = document.getElementById("btn-test-ocr");

  const paymentMethod = document.getElementById("payment-method");
  const upiId = document.getElementById("upi-id");
  const autoSubmitPayment = document.getElementById("auto-submit-payment");

  const btnOpenIrctc = document.getElementById("btn-open-irctc");
  const btnSave = document.getElementById("btn-save");
  const btnDateTomorrow = document.getElementById("btn-date-tomorrow");
  const toast = document.getElementById("toast");

  // Show Toast
  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 2500);
  }

  // Load Saved Config
  chrome.storage.local.get(["tatkalConfig"], (result) => {
    if (result && result.tatkalConfig) {
      config = result.tatkalConfig;
    } else {
      // Defaults
      config = {
        enabled: true,
        sourceStation: "NDLS",
        destStation: "MFP",
        trainNo: "12566",
        trainCoach: "3A",
        travelDate: "2026-09-27",
        quota: "TATKAL",
        boardingStation: "",
        confirmBerthsOnly: true,
        autoUpgrade: true,
        mobileNumber: "9876543210",
        autoLogin: true,
        username: "gotiamps",
        password: "",
        captchaMode: "server",
        captchaServerUrl: "http://localhost:5000/extract-text",
        soundAlerts: true,
        paymentMethod: "bhim_qr",
        upiId: "",
        autoSubmitPayment: true,
        passengers: [
          {
            name: "GAUTAM SINGH",
            age: "26",
            gender: "Male",
            berth: "Lower",
            food: "No Food"
          }
        ]
      };
    }
    populateUI();
    checkOcrHealth();
  });

  // Populate UI from config
  function populateUI() {
    masterToggle.checked = config.enabled !== false;
    toggleStatusText.textContent = masterToggle.checked ? "ACTIVE" : "DISABLED";
    toggleStatusText.style.color = masterToggle.checked ? "var(--success)" : "var(--danger)";

    sourceStation.value = config.sourceStation || "";
    destStation.value = config.destStation || "";
    if (config.travelDate) {
      travelDatePicker.value = config.travelDate;
    } else {
      setTomorrowDate();
    }

    trainNo.value = config.trainNo || "";
    trainCoach.value = config.trainCoach || "3A";
    quota.value = config.quota || "TATKAL";
    boardingStation.value = config.boardingStation || "";

    confirmBerthsOnly.checked = config.confirmBerthsOnly !== false;
    autoUpgrade.checked = config.autoUpgrade !== false;
    mobileNumber.value = config.mobileNumber || "";

    autoLoginToggle.checked = config.autoLogin !== false;
    irctcUsername.value = config.username || "";
    irctcPassword.value = config.password || "";
    captchaMode.value = config.captchaMode || "server";
    captchaServerUrl.value = config.captchaServerUrl || "http://localhost:5000/extract-text";
    soundAlerts.checked = config.soundAlerts !== false;

    paymentMethod.value = config.paymentMethod || "bhim_qr";
    upiId.value = config.upiId || "";
    autoSubmitPayment.checked = config.autoSubmitPayment !== false;

    passengers = Array.isArray(config.passengers) && config.passengers.length > 0 ? config.passengers : [
      { name: "", age: "", gender: "Male", berth: "No Preference", food: "No Food" }
    ];

    renderPassengers();
    updateTatkalBadge();
  }

  // Update Tatkal Time Badge according to AC vs Non-AC class
  function updateTatkalBadge() {
    const isAC = ["1A", "2A", "3A", "3E", "CC", "EC"].includes(trainCoach.value);
    tatkalBadge.textContent = isAC ? "10:00 AM (AC)" : "11:00 AM (Non-AC)";
  }

  trainCoach.addEventListener("change", updateTatkalBadge);

  // Set date to tomorrow
  function setTomorrowDate() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const yyyy = tomorrow.getFullYear();
    const mm = String(tomorrow.getMonth() + 1).padStart(2, "0");
    const dd = String(tomorrow.getDate()).padStart(2, "0");
    travelDatePicker.value = `${yyyy}-${mm}-${dd}`;
  }

  btnDateTomorrow.addEventListener("click", () => {
    setTomorrowDate();
    showToast("Date set to tomorrow for Tatkal!");
  });

  // Master Toggle Change
  masterToggle.addEventListener("change", () => {
    const active = masterToggle.checked;
    toggleStatusText.textContent = active ? "ACTIVE" : "DISABLED";
    toggleStatusText.style.color = active ? "var(--success)" : "var(--danger)";
    chrome.runtime.sendMessage({ action: "UPDATE_BADGE", enabled: active });
  });

  // Render Passengers
  function renderPassengers() {
    passengerContainer.innerHTML = "";
    passengerCountSpan.textContent = passengers.length;

    passengers.forEach((p, idx) => {
      const card = document.createElement("div");
      card.className = "passenger-card";
      card.innerHTML = `
        <div class="passenger-card-header">
          <span>Passenger #${idx + 1}</span>
          ${passengers.length > 1 ? `<button type="button" class="btn-remove-pass" data-index="${idx}">✕</button>` : ""}
        </div>
        <div class="form-grid">
          <div class="form-group col-12">
            <input type="text" class="pass-name" data-index="${idx}" placeholder="Full Name" value="${p.name || ''}" uppercase>
          </div>
          <div class="form-group col-6">
            <input type="number" class="pass-age" data-index="${idx}" placeholder="Age" min="1" max="120" value="${p.age || ''}">
          </div>
          <div class="form-group col-6">
            <select class="pass-gender" data-index="${idx}">
              <option value="Male" ${p.gender === 'Male' ? 'selected' : ''}>Male</option>
              <option value="Female" ${p.gender === 'Female' ? 'selected' : ''}>Female</option>
              <option value="Transgender" ${p.gender === 'Transgender' ? 'selected' : ''}>Transgender</option>
            </select>
          </div>
          <div class="form-group col-6">
            <select class="pass-berth" data-index="${idx}">
              <option value="No Preference" ${p.berth === 'No Preference' ? 'selected' : ''}>No Preference</option>
              <option value="Lower" ${p.berth === 'Lower' ? 'selected' : ''}>Lower</option>
              <option value="Middle" ${p.berth === 'Middle' ? 'selected' : ''}>Middle</option>
              <option value="Upper" ${p.berth === 'Upper' ? 'selected' : ''}>Upper</option>
              <option value="Side Lower" ${p.berth === 'Side Lower' ? 'selected' : ''}>Side Lower</option>
              <option value="Side Upper" ${p.berth === 'Side Upper' ? 'selected' : ''}>Side Upper</option>
              <option value="Window Side" ${p.berth === 'Window Side' ? 'selected' : ''}>Window Side</option>
            </select>
          </div>
          <div class="form-group col-6">
            <select class="pass-food" data-index="${idx}">
              <option value="No Food" ${p.food === 'No Food' ? 'selected' : ''}>No Food</option>
              <option value="Veg" ${p.food === 'Veg' ? 'selected' : ''}>Veg</option>
              <option value="Non Veg" ${p.food === 'Non Veg' ? 'selected' : ''}>Non Veg</option>
            </select>
          </div>
        </div>
      `;
      passengerContainer.appendChild(card);
    });

    // Attach listeners
    document.querySelectorAll(".pass-name").forEach((input) => {
      input.addEventListener("input", (e) => {
        passengers[e.target.dataset.index].name = e.target.value.toUpperCase();
      });
    });
    document.querySelectorAll(".pass-age").forEach((input) => {
      input.addEventListener("input", (e) => {
        passengers[e.target.dataset.index].age = e.target.value;
      });
    });
    document.querySelectorAll(".pass-gender").forEach((sel) => {
      sel.addEventListener("change", (e) => {
        passengers[e.target.dataset.index].gender = e.target.value;
      });
    });
    document.querySelectorAll(".pass-berth").forEach((sel) => {
      sel.addEventListener("change", (e) => {
        passengers[e.target.dataset.index].berth = e.target.value;
      });
    });
    document.querySelectorAll(".pass-food").forEach((sel) => {
      sel.addEventListener("change", (e) => {
        passengers[e.target.dataset.index].food = e.target.value;
      });
    });
    document.querySelectorAll(".btn-remove-pass").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const idx = parseInt(e.target.dataset.index, 10);
        passengers.splice(idx, 1);
        renderPassengers();
      });
    });
  }

  // Add Passenger Button
  btnAddPassenger.addEventListener("click", () => {
    if (passengers.length >= 6) {
      showToast("Maximum 6 passengers allowed on IRCTC!");
      return;
    }
    passengers.push({
      name: "",
      age: "",
      gender: "Male",
      berth: "No Preference",
      food: "No Food"
    });
    renderPassengers();
  });

  // Check OCR Server Health
  function checkOcrHealth() {
    ocrDot.className = "status-dot";
    ocrStatusText.textContent = "OCR: Checking...";

    chrome.runtime.sendMessage({ action: "CHECK_OCR_HEALTH", url: "http://localhost:5000/health" }, (res) => {
      if (res && res.online) {
        ocrDot.className = "status-dot online";
        ocrStatusText.textContent = "OCR: Online (Port 5000)";
      } else {
        ocrDot.className = "status-dot offline";
        ocrStatusText.textContent = "OCR: Offline";
      }
    });
  }

  btnTestOcr.addEventListener("click", () => {
    checkOcrHealth();
    showToast("Testing connection to OCR server...");
  });

  // Save Settings
  btnSave.addEventListener("click", () => {
    const updatedConfig = {
      enabled: masterToggle.checked,
      sourceStation: sourceStation.value.trim().toUpperCase(),
      destStation: destStation.value.trim().toUpperCase(),
      travelDate: travelDatePicker.value,
      trainNo: trainNo.value.trim(),
      trainCoach: trainCoach.value,
      quota: quota.value,
      boardingStation: boardingStation.value.trim(),
      confirmBerthsOnly: confirmBerthsOnly.checked,
      autoUpgrade: autoUpgrade.checked,
      mobileNumber: mobileNumber.value.trim(),
      autoLogin: autoLoginToggle.checked,
      username: irctcUsername.value.trim(),
      password: irctcPassword.value,
      captchaMode: captchaMode.value,
      captchaServerUrl: captchaServerUrl.value.trim(),
      soundAlerts: soundAlerts.checked,
      paymentMethod: paymentMethod.value,
      upiId: upiId.value.trim(),
      autoSubmitPayment: autoSubmitPayment.checked,
      passengers: passengers
    };

    chrome.storage.local.set({ tatkalConfig: updatedConfig }, () => {
      config = updatedConfig;
      chrome.runtime.sendMessage({ action: "UPDATE_BADGE", enabled: updatedConfig.enabled });
      showToast("✓ All Settings Saved Successfully!");
    });
  });

  // Open IRCTC
  btnOpenIrctc.addEventListener("click", () => {
    chrome.tabs.create({ url: "https://www.irctc.co.in/nget/train-search" });
  });

});
