// IRCTC Tatkal SuperFast Pro - Background Service Worker

const DEFAULT_CONFIG = {
  enabled: true,
  trainNo: "12318",
  trainCoach: "3A",
  travelDate: "",
  sourceStation: "NDLS",
  destinationStation: "CNB",
  boardingStation: "",
  quota: "TATKAL", // TATKAL, PREMIUM_TATKAL, GENERAL, LADIES, SENIOR_CITIZEN
  autoBookAtTatkalTime: true,
  autoUpgrade: true,
  confirmBerthsOnly: true,
  reservationChoice: "99", // 99 = None, 1 = Book only if 1 lower berth allotted, etc.
  travelInsurance: "yes", // yes | no
  mobileNumber: "9876543210",
  username: "",
  password: "",
  autoLogin: true,
  captchaMode: "server", // "server" (EasyOCR port 5000), "client" (Canvas OCR), "manual"
  captchaServerUrl: "http://localhost:5000/extract-text",
  captchaHealthUrl: "http://localhost:5000/health",
  paymentMethod: "bhim_qr", // "bhim_qr" (Fastest), "upi_id", "irctc_ipay", "netbanking"
  upiId: "",
  autoSubmitPayment: true,
  soundAlerts: true,
  passengers: [
    {
      name: "SHIVAM PANDEY",
      age: "26",
      gender: "Male",
      berth: "Side Upper",
      food: "No Food"
    }
  ]
};

// Initialize default storage on install
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(["tatkalConfig"], (result) => {
    if (!result.tatkalConfig) {
      chrome.storage.local.set({ tatkalConfig: DEFAULT_CONFIG });
    }
  });
  updateBadge(true);
});

// Update extension icon badge
function updateBadge(enabled) {
  if (enabled) {
    chrome.action.setBadgeText({ text: "ON" });
    chrome.action.setBadgeBackgroundColor({ color: "#ea580c" });
  } else {
    chrome.action.setBadgeText({ text: "OFF" });
    chrome.action.setBadgeBackgroundColor({ color: "#64748b" });
  }
}

// Listen for messages from popup or content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "UPDATE_BADGE") {
    updateBadge(message.enabled);
    sendResponse({ success: true });
    return true;
  }

  // Check health of Python OCR server
  if (message.action === "CHECK_OCR_HEALTH") {
    const healthUrl = message.url || "http://localhost:5000/health";
    fetch(healthUrl, { method: "GET" })
      .then((res) => {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.json();
      })
      .then((data) => {
        sendResponse({ online: true, data });
      })
      .catch((err) => {
        sendResponse({ online: false, error: err.message });
      });
    return true; // Keep channel open for async response
  }

  // Proxy captcha solving to local python server (bypasses page CORS/Mixed content)
  if (message.action === "SOLVE_CAPTCHA_SERVER") {
    const serverUrl = message.url || "http://localhost:5000/extract-text";
    fetch(serverUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ image: message.image })
    })
      .then((res) => {
        if (!res.ok) throw new Error("HTTP error " + res.status);
        return res.json();
      })
      .then((data) => {
        sendResponse({ success: true, text: data.extracted_text || "" });
      })
      .catch((err) => {
        console.error("Background OCR fetch failed:", err);
        sendResponse({ success: false, error: err.message });
      });
    return true; // Keep channel open for async response
  }

  // Send desktop notification
  if (message.action === "NOTIFY") {
    chrome.notifications.create({
      type: "basic",
      iconUrl: "icons/icon128.png",
      title: message.title || "IRCTC Tatkal Assistant",
      message: message.message || ""
    });
    sendResponse({ success: true });
    return true;
  }
});
