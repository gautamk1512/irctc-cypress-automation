# ⚡ IRCTC Tatkal SuperFast Pro Automation Suite

[![Author: Gautam Singh](https://img.shields.io/badge/Author-Gautam%20Singh-orange.svg)](https://github.com/gautamk1512)
[![GitHub Profile](https://img.shields.io/badge/GitHub-gautamk1512-blue.svg)](https://github.com/gautamk1512)
[![Manifest V3](https://img.shields.io/badge/Chrome%20Extension-Manifest%20V3-success.svg)](https://developer.chrome.com/docs/extensions/mv3/intro/)
[![Python 3](https://img.shields.io/badge/Python-3.10%20%7C%203.11%20%7C%203.12%20%7C%203.13-blue.svg)](https://www.python.org/)
[![License: ISC](https://img.shields.io/badge/License-ISC-brightgreen.svg)](https://opensource.org/licenses/ISC)

> **Maintained & Enhanced by [Gautam Singh](https://github.com/gautamk1512)**  
> Complete dual-engine automation suite for IRCTC Tatkal, Premium Tatkal, and General ticket bookings with **Zero-Bot-Detection Google Chrome Extension**, **EasyOCR AI Captcha Solver**, **Multi-Passenger Autofill**, and **Instant UPI/QR Payment Automation**.

---

## 📑 Table of Contents

- [🌟 Features Overview](#-features-overview)
- [🏎️ Why the Chrome Extension is Better than Cypress/Selenium](#-why-the-chrome-extension-is-better-than-cypressselenium)
- [📦 Quick Installation Guide](#-quick-installation-guide)
  - [Option A: Google Chrome Extension (Recommended)](#option-a-google-chrome-extension-recommended)
  - [Option B: Cypress E2E Automation Mode](#option-b-cypress-e2e-automation-mode)
- [🤖 AI Captcha Solver Server Setup](#-ai-captcha-solver-server-setup)
- [💳 Automated Payment Gateway Integration](#-automated-payment-gateway-integration)
- [⏰ Tatkal Timings & Strategy Guide](#-tatkal-timings--strategy-guide)
- [⚙️ Configuration Reference](#-configuration-reference)
- [🛠️ Troubleshooting & FAQs](#-troubleshooting--faqs)
- [⚖️ Legal & Educational Disclaimer](#-legal--educational-disclaimer)

---

## 🌟 Features Overview

- 🚄 **Dual Booking Engines**:
  - **Chrome Extension (Manifest V3)**: Runs natively in your regular Google Chrome browser. Bypasses all bot detection (Akamai, Cloudflare) with zero browser automation flags.
  - **Cypress E2E Script**: Standalone automation script with headed browser runner.
- ⚡ **Auto Captcha Solver (Login & Review Stage)**:
  - High-accuracy OCR powered by **EasyOCR** and **PIL/Canvas Preprocessing**.
  - Automatically reads and types distorted characters on both the **Login Modal** and the **Review Booking Page**.
  - Automatic error retry if IRCTC returns *"Invalid Captcha"*.
- 👥 **Multi-Passenger Instant Autofill**:
  - Populates up to 6 passengers simultaneously in less than 300ms (Name, Age, Gender, Berth Preference, Food Choice).
  - Automatically selects:
    - *"Book only if confirm berths are allotted"*
    - *"Consider for Auto Upgradation"*
    - Mobile number & Travel Insurance options.
- 💳 **Instant Payment Gateway Automation**:
  - **BHIM UPI QR Code (Fastest - 2 Seconds)**: Automatically switches to the QR Code tab on Paytm / IRCTC iPay so you can scan and pay instantly with PhonePe, Google Pay, or Paytm.
  - **UPI ID (Collect Request)**: Automatically inputs your UPI ID (`user@okhdfcbank`, `9876543210@paytm`) and triggers the collect request.
- ⏱️ **Synchronized Tatkal Countdown Clock**:
  - Floating on-page Heads-Up Display (HUD) showing millisecond-accurate countdown to 10:00:00 AM (AC) or 11:00:00 AM (Non-AC/Sleeper).
  - Audio chimes for key milestones (Captcha solved, Tatkal opened, Payment screen ready).

---

## 🏎️ Why the Chrome Extension is Better than Cypress/Selenium

| Factor | Standard Cypress / Selenium | Gautam Singh's Chrome Extension (`irctc-tatkal-extension`) |
| :--- | :--- | :--- |
| **Bot Detection** | High risk (`--enable-automation` flag detected by IRCTC) | **Zero risk** (Runs inside your normal Chrome session) |
| **User Cookies & Tokens** | Starts clean session every time; re-authenticates | Keeps your existing browser login cookies, history, and active sessions |
| **Speed** | 1.5 - 3.0 seconds per page transition | **Instant (< 250ms)** DOM injection via native content scripts |
| **Ease of Use** | Requires terminal commands & node processes | **1-Click popup interface** with intuitive tabs and profiles |
| **Payment Handling** | Rigid browser hooks often fail on 3rd-party PG redirects | Seamlessly handles payment gateway pages (Paytm, iPay, PhonePe) |

---

## 📦 Quick Installation Guide

### Option A: Google Chrome Extension (Recommended)

#### Step 1: Open Chrome Extensions
1. Open Google Chrome.
2. In the URL address bar, enter:
   ```
   chrome://extensions
   ```
3. In the top-right corner of the page, turn **Developer mode** toggle **ON**.

#### Step 2: Load the Unpacked Extension
1. Click the **Load unpacked** button in the top-left corner.
2. Select the [`irctc-tatkal-extension`](file:///c:/Users/gauta/OneDrive/Desktop/irctc-cypress-automation/irctc-tatkal-extension) folder located in this repository:
   ```
   c:\Users\gauta\OneDrive\Desktop\irctc-cypress-automation\irctc-tatkal-extension
   ```
3. Click **Select Folder**.
4. The extension **IRCTC Tatkal SuperFast Pro** will appear in your Chrome toolbar. Pin it for quick access!

#### Step 3: Configure Your Booking Profile
1. Click the **Tatkal Pro (⚡)** icon in your Chrome toolbar.
2. Fill out:
   - **Journey Tab**: From Station, To Station, Travel Date, Train Number, Coach Class (`3A`, `SL`, etc.), Quota (`TATKAL`).
   - **Passengers Tab**: Passenger names, ages, gender, berth choice, and preferences.
   - **Login & OCR Tab**: IRCTC Username & Password.
   - **Payment Tab**: Select **BHIM UPI QR Code** or enter your **UPI ID**.
3. Click **💾 Save Settings**.

---

### Option B: Cypress E2E Automation Mode

If you prefer to run the headless/headed Cypress automation script:

1. Clone or open the repository:
   ```bash
   cd irctc-cypress-automation
   ```
2. Install Node dependencies:
   ```bash
   npm install
   ```
3. Configure your passenger and travel details in:
   [`cypress/fixtures/passenger_data.json`](file:///c:/Users/gauta/OneDrive/Desktop/irctc-cypress-automation/cypress/fixtures/passenger_data.json)
4. Configure your IRCTC login credentials in:
   [`cypress.env.json`](file:///c:/Users/gauta/OneDrive/Desktop/irctc-cypress-automation/cypress.env.json)
5. Start booking with one command:
   ```bash
   npm run start-booking
   ```

---

## 🤖 AI Captcha Solver Server Setup

The local EasyOCR server provides high-accuracy, offline optical character recognition for IRCTC's distorted captchas.

### 1. Install Python Dependencies
```bash
pip install -r irctc-captcha-solver/requirements.txt
```
*(Requires: `pillow`, `easyocr`, `flask`, `flask-cors`, `numpy`, `torch`)*

### 2. Start the OCR Server
```bash
npm run start-ocr
```
*Or directly via Python:*
```bash
python irctc-captcha-solver/app-server.py --host 0.0.0.0 --port 5000
```

### 3. Verify Server Status
Open your browser and navigate to:
```
http://localhost:5000/health
```
You should see:
```json
{
  "ocr_engine": "EasyOCR",
  "service": "IRCTC Captcha Solver",
  "status": "online"
}
```

---

## 💳 Automated Payment Gateway Integration

IRCTC Tatkal booking speed depends heavily on how fast you complete the payment:

### Method 1: BHIM UPI QR Code (Fastest - Recommended)
1. The extension automatically chooses the **BHIM/UPI** payment option on IRCTC.
2. It clicks **Pay & Book** to reach the payment gateway.
3. It automatically clicks the **QR Code** tab on Paytm / IRCTC iPay.
4. The QR code appears on screen in under 2 seconds.
5. Open your mobile UPI app (PhonePe, Google Pay, Paytm, or BHIM) -> Scan -> Enter PIN -> **Ticket Booked!**

### Method 2: UPI ID (Collect Request)
1. Enter your UPI ID (e.g. `9876543210@paytm` or `yourname@okhdfcbank`) in the extension popup.
2. When the payment gateway loads, the extension types your UPI ID and submits the request.
3. Accept the collect prompt on your smartphone immediately.

---

## ⏰ Tatkal Timings & Strategy Guide

| Quota / Class | Opening Time | Strategy |
| :--- | :--- | :--- |
| **AC Classes** (`1A`, `2A`, `3A`, `3E`, `CC`, `EC`) | **10:00:00 AM IST** | Log in at 09:57 AM. Keep search page open. Let the extension trigger availability at 09:59:59. |
| **Non-AC Classes** (`SL`, `2S`) | **11:00:00 AM IST** | Log in at 10:57 AM. Extension clock automatically switches to 11:00 AM countdown. |
| **General Quota** | 120 Days in Advance (08:00 AM) | Works anytime 24x7 for regular ticket booking. |

> [!TIP]
> **Golden Rule for Confirmed Tatkal**:
> 1. Ensure you have high-speed internet (broadband/5G).
> 2. Keep your mobile UPI app open on your phone with the QR scanner active at 10:01 AM.
> 3. Have *"Book only if confirm berths are allotted"* checked to avoid getting stuck with a Waitlisted (WL) Tatkal ticket which cannot be cancelled automatically.

---

## ⚙️ Configuration Reference

### Passenger Data Schema (`passenger_data.json` & Extension Storage)

```json
{
  "TRAIN_NO": "12318",
  "TRAIN_COACH": "3A",
  "TRAVEL_DATE": "28/09/2026",
  "SOURCE_STATION": "NDLS",
  "DESTINATION_STATION": "CNB",
  "BOARDING_STATION": null,
  "TATKAL": true,
  "PREMIUM_TATKAL": false,
  "UPI_ID_CONFIG": "yourname@okhdfcbank",
  "PASSENGER_DETAILS": [
    {
      "NAME": "GAUTAM SINGH",
      "AGE": 26,
      "GENDER": "Male",
      "SEAT": "Lower",
      "FOOD": "No Food"
    }
  ]
}
```

### Valid Values

- **Coaches**: `SL` | `2A` | `3A` | `3E` | `1A` | `CC` | `EC` | `2S`
- **Berth Choices**: `Lower` | `Middle` | `Upper` | `Side Lower` | `Side Upper` | `Window Side` | `No Preference`
- **Genders**: `Male` | `Female` | `Transgender`
- **Food Choices**: `Veg` | `Non Veg` | `No Food`

---

## 🛠️ Troubleshooting & FAQs

### Q1: The extension says "OCR: Offline" in the popup.
- Make sure you started the local server by running `npm run start-ocr` in your terminal.
- Test the endpoint at `http://localhost:5000/health`.

### Q2: What if IRCTC captcha changes or fails?
- The extension automatically clicks the captcha refresh button and re-runs the OCR engine.
- You can also click the **🔄 Solve Captcha** button on the floating HUD widget anytime.

### Q3: Can I book multiple passengers?
- Yes! The extension supports up to 6 passengers (the IRCTC maximum). In the extension popup, click **+ Add Passenger** to configure all travelers.

---

## ⚖️ Legal & Educational Disclaimer

```
This project and Chrome Extension are developed strictly for educational, research,
and testing purposes to demonstrate browser automation, OCR engineering, and user experience
enhancements. 

Users must adhere to all terms of service, guidelines, and legal regulations set forth by
IRCTC (Indian Railway Catering and Tourism Corporation). The author (Gautam Singh) and
contributors assume no liability for misuse, unauthorized activities, or consequences
resulting from the use of this software.
```

---

## 👨‍💻 Author & Maintainer

- **Author**: **[Gautam Singh](https://github.com/gautamk1512)**
- **GitHub**: [@gautamk1512](https://github.com/gautamk1512)
- **Email**: `gautamk1512@gmail.com`

---
*⭐ If you find this project helpful, please star the repository on GitHub!*
