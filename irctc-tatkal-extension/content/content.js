// IRCTC Tatkal SuperFast Pro - Master Content Automation Engine

(function () {
  console.log("%c[IRCTC Tatkal Pro] Automation Script Loaded", "color: #ea580c; font-weight: bold; font-size: 14px;");

  let config = null;
  let isAutomationPaused = false;
  let currentStep = "INIT"; // INIT, LOGIN, SEARCH, SELECT_TRAIN, PASSENGERS, REVIEW, PAYMENT
  let audioCtx = null;

  // Sound Synthesizer via Web Audio API
  function playBeep(freq = 880, duration = 150, type = "sine") {
    if (!config || !config.soundAlerts) return;
    try {
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration / 1000);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + duration / 1000);
    } catch (e) {
      console.warn("Audio play error:", e);
    }
  }

  function playSuccessChime() {
    playBeep(523.25, 100);
    setTimeout(() => playBeep(659.25, 100), 100);
    setTimeout(() => playBeep(783.99, 200), 200);
  }

  function playAlertChime() {
    playBeep(440, 150, "square");
    setTimeout(() => playBeep(880, 200, "square"), 150);
  }

  // Load configuration from Chrome storage
  function loadConfig() {
    return new Promise((resolve) => {
      chrome.storage.local.get(["tatkalConfig"], (res) => {
        if (res && res.tatkalConfig) {
          config = res.tatkalConfig;
        }
        resolve(config);
      });
    });
  }

  // Helper: Sleep
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  // Angular-safe Input Value Setter
  function setAngularInput(element, value) {
    if (!element) return;
    element.focus();
    element.value = value;
    element.dispatchEvent(new Event("input", { bubbles: true }));
    element.dispatchEvent(new Event("change", { bubbles: true }));
    element.dispatchEvent(new KeyboardEvent("keyup", { bubbles: true }));
    element.dispatchEvent(new Event("blur", { bubbles: true }));
  }

  // Angular-safe Select Value Setter
  function setSelectValue(element, textOrValue) {
    if (!element) return;
    for (let i = 0; i < element.options.length; i++) {
      const opt = element.options[i];
      if (opt.text.toLowerCase().includes(textOrValue.toLowerCase()) || opt.value === textOrValue) {
        element.selectedIndex = i;
        element.dispatchEvent(new Event("change", { bubbles: true }));
        element.dispatchEvent(new Event("input", { bubbles: true }));
        break;
      }
    }
  }

  // Click simulator
  function simulateClick(element) {
    if (!element) return;
    element.dispatchEvent(new MouseEvent("mousedown", { bubbles: true, cancelable: true }));
    element.dispatchEvent(new MouseEvent("mouseup", { bubbles: true, cancelable: true }));
    element.click();
  }

  // ---------------- HUD (Heads-Up Display) ---------------- //
  let hudEl = null;

  function createHUD() {
    if (document.getElementById("irctc-tatkal-hud")) return;

    hudEl = document.createElement("div");
    hudEl.id = "irctc-tatkal-hud";
    hudEl.innerHTML = `
      <div class="hud-header" id="hud-header">
        <div class="hud-title">⚡ Tatkal Pro Assistant</div>
        <div class="hud-controls">
          <button class="hud-btn-icon" id="hud-min-btn" title="Minimize">_</button>
        </div>
      </div>
      <div class="hud-body">
        <div class="hud-timer-card">
          <div class="hud-timer-label">Tatkal Opening Countdown</div>
          <div class="hud-timer-val" id="hud-timer">--:--:--</div>
        </div>
        <div class="hud-status-row">
          <span>Status:</span>
          <span class="hud-status-badge active" id="hud-status-badge">Ready</span>
        </div>
        <div class="hud-pipeline">
          <div class="hud-step current" id="step-login"><div class="hud-step-dot"></div><span>Login</span></div>
          <div class="hud-step" id="step-train"><div class="hud-step-dot"></div><span>Train</span></div>
          <div class="hud-step" id="step-pass"><div class="hud-step-dot"></div><span>Pass.</span></div>
          <div class="hud-step" id="step-review"><div class="hud-step-dot"></div><span>Review</span></div>
          <div class="hud-step" id="step-pay"><div class="hud-step-dot"></div><span>Pay</span></div>
        </div>
        <div class="hud-log" id="hud-log">Assistant initialized. Waiting for trigger...</div>
        <div class="hud-actions">
          <button class="hud-btn primary" id="hud-btn-autofill">⚡ Auto-Fill Now</button>
          <button class="hud-btn" id="hud-btn-captcha">🔄 Solve Captcha</button>
        </div>
      </div>
    `;

    document.body.appendChild(hudEl);

    // Event listeners
    document.getElementById("hud-min-btn").addEventListener("click", () => {
      hudEl.classList.toggle("minimized");
    });

    document.getElementById("hud-btn-autofill").addEventListener("click", () => {
      logHUD("Manual Auto-Fill Triggered!");
      runActivePageAutomation();
    });

    document.getElementById("hud-btn-captcha").addEventListener("click", () => {
      logHUD("Manual Captcha Solve Triggered!");
      solveAnyVisibleCaptcha();
    });

    // Make HUD draggable
    makeDraggable(hudEl, document.getElementById("hud-header"));
  }

  function logHUD(text) {
    console.log("[Tatkal Pro]", text);
    const logBox = document.getElementById("hud-log");
    if (logBox) {
      logBox.innerHTML = `<div>[${new Date().toLocaleTimeString()}] ${text}</div>` + logBox.innerHTML;
    }
  }

  function updateHUDStep(step) {
    currentStep = step;
    const steps = ["login", "train", "pass", "review", "pay"];
    const stepMap = {
      LOGIN: "login",
      SEARCH: "train",
      SELECT_TRAIN: "train",
      PASSENGERS: "pass",
      REVIEW: "review",
      PAYMENT: "pay"
    };
    const active = stepMap[step] || "login";
    let found = false;
    steps.forEach((s) => {
      const el = document.getElementById(`step-${s}`);
      if (!el) return;
      el.classList.remove("current", "completed");
      if (s === active) {
        el.classList.add("current");
        found = true;
      } else if (!found) {
        el.classList.add("completed");
      }
    });
  }

  function makeDraggable(element, handle) {
    let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
    handle.onmousedown = dragMouseDown;

    function dragMouseDown(e) {
      e = e || window.event;
      e.preventDefault();
      pos3 = e.clientX;
      pos4 = e.clientY;
      document.onmouseup = closeDragElement;
      document.onmousemove = elementDrag;
    }

    function elementDrag(e) {
      e = e || window.event;
      e.preventDefault();
      pos1 = pos3 - e.clientX;
      pos2 = pos4 - e.clientY;
      pos3 = e.clientX;
      pos4 = e.clientY;
      element.style.top = (element.offsetTop - pos2) + "px";
      element.style.left = (element.offsetLeft - pos1) + "px";
      element.style.right = "auto";
    }

    function closeDragElement() {
      document.onmouseup = null;
      document.onmousemove = null;
    }
  }

  // Live Tatkal Opening Countdown
  function startTatkalClock() {
    setInterval(() => {
      const timerEl = document.getElementById("hud-timer");
      if (!timerEl || !config) return;

      const now = new Date();
      const isAC = ["1A", "2A", "3A", "3E", "CC", "EC"].includes(config.trainCoach);
      const targetHour = isAC ? 10 : 11;

      const target = new Date();
      target.setHours(targetHour, 0, 0, 0);

      const diff = target - now;

      if (diff <= 0 && diff > -1800000) {
        // Within 30 minutes after opening
        timerEl.innerText = "⚡ TATKAL IS LIVE!";
        timerEl.classList.add("live");
      } else if (diff > 0) {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        timerEl.innerText = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
        timerEl.classList.remove("live");
      } else {
        timerEl.innerText = "OPEN (GENERAL)";
        timerEl.classList.remove("live");
      }
    }, 1000);
  }

  // ---------------- CAPTCHA AUTOMATION ---------------- //

  let isSolvingCaptcha = false;

  async function solveAnyVisibleCaptcha() {
    if (isSolvingCaptcha) return;
    const captchaImg = document.querySelector(".captcha-img") || document.querySelector("img[src*='captcha']");
    const captchaInput = document.querySelector("#captcha") || document.querySelector("input[formcontrolname='captcha']");

    if (!captchaImg || !captchaInput) {
      logHUD("No visible captcha detected on screen.");
      return;
    }

    try {
      isSolvingCaptcha = true;
      logHUD("Captcha detected! Extracting & solving...");

      const captchaText = await window.OCREngine.solve(
        captchaImg,
        config.captchaMode || "server",
        config.captchaServerUrl
      );

      if (captchaText) {
        setAngularInput(captchaInput, captchaText);
        logHUD(`Solved Captcha: [${captchaText}]`);
        playSuccessChime();

        // Check if there is an Enter or Submit action needed
        // If login dialog is active, we can submit
        const loginBtn = document.querySelector(".search_btn.loginText") || document.querySelector("button[type='submit']");
        if (loginBtn && document.querySelector("input[placeholder='User Name']")) {
          await sleep(250);
          simulateClick(loginBtn);
        }
      }
    } catch (err) {
      logHUD("Captcha solve failed: " + err.message);
      captchaInput.focus();
      playAlertChime();
    } finally {
      isSolvingCaptcha = false;
    }
  }

  // ---------------- AUTO-LOGIN HANDLER ---------------- //

  async function handleAutoLogin() {
    if (!config || !config.autoLogin || !config.username || !config.password) return;

    const usernameInput = document.querySelector("input[placeholder='User Name']") || document.querySelector("input[formcontrolname='userid']");
    const passwordInput = document.querySelector("input[placeholder='Password']") || document.querySelector("input[formcontrolname='password']");

    if (usernameInput && passwordInput) {
      updateHUDStep("LOGIN");
      logHUD("Auto-filling login credentials...");
      setAngularInput(usernameInput, config.username);
      setAngularInput(passwordInput, config.password);

      // Dismiss any overlay ads
      const dishaClose = document.getElementById("disha-banner-close");
      if (dishaClose) simulateClick(dishaClose);

      // Solve Captcha
      await sleep(300);
      await solveAnyVisibleCaptcha();
    }

    // Check for "Your Last Transaction" modal
    const lastTxnBtn = document.querySelector(".ui-dialog-footer .btn");
    if (lastTxnBtn && document.body.innerText.includes("Your Last Transaction")) {
      simulateClick(lastTxnBtn);
    }
  }

  // ---------------- TRAIN SEARCH & AVAILABILITY ---------------- //

  async function handleTrainSearchPage() {
    if (!window.location.href.includes("train-search")) return;
    updateHUDStep("SEARCH");

    // Close any advisory popups
    const alertOk = document.querySelector(".ui-dialog-content .btn-primary") || document.querySelector(".ui-dialog-footer button");
    if (alertOk && (document.body.innerText.includes("COVID") || document.body.innerText.includes("Advisory"))) {
      simulateClick(alertOk);
    }

    // Station inputs
    const originInput = document.querySelector(".ui-autocomplete input[placeholder*='From']") || document.querySelector(".ui-autocomplete > input");
    if (originInput && config.sourceStation && originInput.value !== config.sourceStation) {
      logHUD(`Setting Origin: ${config.sourceStation}`);
      setAngularInput(originInput, config.sourceStation);
      await sleep(500);
      const firstOpt = document.querySelector("#p-highlighted-option") || document.querySelector(".ui-autocomplete-list-item");
      if (firstOpt) simulateClick(firstOpt);
    }

    const destInput = document.querySelectorAll(".ui-autocomplete input")[1];
    if (destInput && config.destinationStation && destInput.value !== config.destinationStation) {
      logHUD(`Setting Destination: ${config.destinationStation}`);
      setAngularInput(destInput, config.destinationStation);
      await sleep(500);
      const firstOpt = document.querySelector("#p-highlighted-option") || document.querySelector(".ui-autocomplete-list-item");
      if (firstOpt) simulateClick(firstOpt);
    }

    // Quota Dropdown
    if (config.quota) {
      const quotaDropdown = document.querySelector("#journeyQuota .ui-dropdown");
      if (quotaDropdown) {
        simulateClick(quotaDropdown);
        await sleep(300);
        const quotaItems = document.querySelectorAll(".ui-dropdown-item");
        quotaItems.forEach((item) => {
          if (item.innerText.toUpperCase().includes(config.quota.replace("_", " "))) {
            simulateClick(item);
          }
        });
      }
    }
  }

  // ---------------- PASSENGER AUTOFILL ---------------- //

  async function handlePassengerDetails() {
    const isPassengerPage = document.querySelector("input[formcontrolname='passengerAge']") ||
      document.body.innerText.includes("Passenger Details") && document.body.innerText.includes("Contact Details");

    if (!isPassengerPage) return;
    updateHUDStep("PASSENGERS");

    const passengers = config.passengers || [];
    if (!passengers.length) return;

    logHUD(`Filling ${passengers.length} passenger details...`);

    // Ensure we have enough passenger slots
    for (let i = 1; i < passengers.length; i++) {
      const currentNameInputs = document.querySelectorAll(".ui-autocomplete input");
      if (currentNameInputs.length <= i) {
        const addBtn = document.querySelector(".pull-left > a") || document.querySelector("a[title*='Add Passenger']");
        if (addBtn) {
          simulateClick(addBtn);
          await sleep(300);
        }
      }
    }

    // Fill each passenger
    const nameInputs = document.querySelectorAll(".ui-autocomplete input");
    const ageInputs = document.querySelectorAll("input[formcontrolname='passengerAge']");
    const genderSelects = document.querySelectorAll("select[formcontrolname='passengerGender']");
    const berthSelects = document.querySelectorAll("select[formcontrolname='passengerBerthChoice']");
    const foodSelects = document.querySelectorAll("select[formcontrolname='passengerFoodChoice']");

    passengers.forEach((p, idx) => {
      if (nameInputs[idx] && p.name) setAngularInput(nameInputs[idx], p.name);
      if (ageInputs[idx] && p.age) setAngularInput(ageInputs[idx], p.age);
      if (genderSelects[idx] && p.gender) setSelectValue(genderSelects[idx], p.gender);
      if (berthSelects[idx] && p.berth) setSelectValue(berthSelects[idx], p.berth);
      if (foodSelects[idx] && p.food) setSelectValue(foodSelects[idx], p.food);
    });

    // Checkboxes: Auto Upgradation & Confirm Berths Only
    if (config.confirmBerthsOnly) {
      const confirmLabel = Array.from(document.querySelectorAll("label")).find(el => el.innerText.includes("Book only if confirm berths are allotted"));
      if (confirmLabel) {
        const cb = confirmLabel.querySelector("input") || confirmLabel.previousElementSibling;
        if (cb && !cb.checked) simulateClick(confirmLabel);
      }
    }

    if (config.autoUpgrade) {
      const autoUpLabel = Array.from(document.querySelectorAll("label")).find(el => el.innerText.includes("Consider for Auto Upgradation"));
      if (autoUpLabel) {
        const cb = autoUpLabel.querySelector("input") || autoUpLabel.previousElementSibling;
        if (cb && !cb.checked) simulateClick(autoUpLabel);
      }
    }

    // Mobile Number
    if (config.mobileNumber) {
      const mobInput = document.querySelector("input[formcontrolname='mobileNumber']") || document.querySelector("input[placeholder*='Mobile']");
      if (mobInput) setAngularInput(mobInput, config.mobileNumber);
    }

    // Payment Option in Passenger page (BHIM UPI vs Cards)
    // IRCTC gives ₹10 + GST for BHIM UPI vs ₹15 + GST for Cards
    const upiRadio = document.querySelector("#\\32  > .ui-radiobutton") || document.querySelector("p-radiobutton[ng-reflect-value='2'] .ui-radiobutton-box");
    if (upiRadio) {
      simulateClick(upiRadio);
    }

    logHUD("Passenger details populated! Ready to proceed.");
    playSuccessChime();

    // Auto-click Continue button
    await sleep(400);
    const continueBtn = document.querySelector(".train_Search") || document.querySelector("button[type='submit']");
    if (continueBtn && continueBtn.innerText.includes("Continue")) {
      simulateClick(continueBtn);
    }
  }

  // ---------------- REVIEW BOOKING & 2ND STAGE CAPTCHA ---------------- //

  async function handleReviewBookingPage() {
    const isReview = document.body.innerText.includes("Your ticket will be sent to") &&
      document.body.innerText.includes("Enter Captcha");

    if (!isReview) return;
    updateHUDStep("REVIEW");
    logHUD("Review Booking page detected. Solving 2nd Stage Captcha...");

    await solveAnyVisibleCaptcha();

    // After captcha solved, click Continue
    const continueBtn = document.querySelector(".train_Search") || document.querySelector("button.btn-primary");
    if (continueBtn && continueBtn.innerText.includes("Continue")) {
      await sleep(400);
      simulateClick(continueBtn);
    }
  }

  // ---------------- PAYMENT AUTOMATION ---------------- //

  async function handlePaymentPage() {
    const isPayment = document.body.innerText.includes("Payment Methods") || document.body.innerText.includes("Payment Mode");
    if (!isPayment) return;
    updateHUDStep("PAYMENT");
    logHUD("Payment Gateway Selection detected!");

    // Preferred payment mode: BHIM UPI QR Code or IRCTC iPay
    if (config.paymentMethod === "bhim_qr" || config.paymentMethod === "upi_id") {
      // Select BHIM / UPI
      const bhimTab = document.querySelector(":nth-child(3) > .col-pad") ||
        Array.from(document.querySelectorAll(".col-pad")).find(el => el.innerText.includes("BHIM") || el.innerText.includes("UPI"));

      if (bhimTab) simulateClick(bhimTab);

      await sleep(250);
      const bankOption = document.querySelector(".col-sm-9 > app-bank > #bank-type") || document.querySelector("#bank-type");
      if (bankOption) simulateClick(bankOption);

      await sleep(250);
      const payAndBookBtn = document.querySelector(".btn.btn-primary") || document.querySelector(".btn");
      if (payAndBookBtn && payAndBookBtn.innerText.includes("Pay & Book")) {
        logHUD("Clicking Pay & Book...");
        playAlertChime();
        simulateClick(payAndBookBtn);
      }
    }

    // Handling third-party PG (e.g. Paytm / IRCTC iPay)
    handleThirdPartyGateway();
  }

  async function handleThirdPartyGateway() {
    const url = window.location.href;

    // Paytm Gateway automation
    if (url.includes("paytm.in") || url.includes("paytm.com")) {
      logHUD("Paytm Payment Gateway detected!");
      if (config.paymentMethod === "upi_id" && config.upiId) {
        const upiTab = document.querySelector("#ptm-upi") || document.querySelector("a[href*='upi']");
        if (upiTab) simulateClick(upiTab);

        await sleep(300);
        const upiInput = document.querySelector("input[name='upi-id']") || document.querySelector("._Mzth > .form-ctrl");
        if (upiInput) {
          setAngularInput(upiInput, config.upiId);
          logHUD(`Entered UPI ID: ${config.upiId}`);
          const payBtn = document.querySelector("section > .btn") || document.querySelector("button[type='submit']");
          if (payBtn) simulateClick(payBtn);
        }
      } else {
        // QR Code mode - make sure QR code tab is open
        const qrTab = document.querySelector("._2N2Z") || document.querySelector("a[href*='qr']");
        if (qrTab) simulateClick(qrTab);
        playAlertChime();
        logHUD("Scan UPI QR Code with PhonePe/GPay/Paytm now!");
      }
    }
  }

  // ---------------- MASTER DISPATCHER LOOP ---------------- //

  async function runActivePageAutomation() {
    if (!config || !config.enabled || isAutomationPaused) return;

    try {
      await handleAutoLogin();
      await handleTrainSearchPage();
      await handlePassengerDetails();
      await handleReviewBookingPage();
      await handlePaymentPage();
    } catch (e) {
      console.error("[Tatkal Pro Error]", e);
    }
  }

  // Initialize Extension Content Script
  async function init() {
    await loadConfig();
    if (!config || !config.enabled) {
      console.log("[IRCTC Tatkal Pro] Automation is disabled in settings.");
      return;
    }

    createHUD();
    startTatkalClock();

    // Periodic observer for SPA route changes & dynamic element updates
    setInterval(() => {
      runActivePageAutomation();
    }, 1200);

    // Initial check
    setTimeout(runActivePageAutomation, 500);
  }

  // Run when DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }

  // Listen for storage changes from popup
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "local" && changes.tatkalConfig) {
      config = changes.tatkalConfig.newValue;
      logHUD("Settings updated from extension popup.");
    }
  });

})();
