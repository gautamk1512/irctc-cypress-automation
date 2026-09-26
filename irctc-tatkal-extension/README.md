# ⚡ IRCTC Tatkal SuperFast Pro - Chrome Extension

> **Ultra-Fast Tatkal & General Ticket Booking Chrome Extension (Manifest V3)**  
> Built for Indian Railways (IRCTC) with Auto-Login, Real-Time EasyOCR Captcha Solving, Multi-Passenger Autofill, and Instant UPI/QR Payment Automation.

---

## 🌟 Key Features

1. **Anti-Detection (Normal Chrome Session)**:
   - Unlike Cypress or Selenium which open a robot-controlled browser with `--enable-automation` flags, this extension runs directly inside your standard, everyday Google Chrome browser. IRCTC will not flag you as an automated bot.
2. **Instant Automatic Captcha Solver**:
   - Automatically detects both **Login Captcha** and **Review Booking (2nd Stage) Captcha**.
   - Connects directly to the local EasyOCR server (`http://localhost:5000/extract-text`) to read distorted text with high accuracy.
   - Auto-types text, dispatches Angular input events, and submits.
   - If an "Invalid Captcha" prompt occurs, it automatically refreshes and retries.
3. **Multi-Passenger Instant Autofill**:
   - Pre-fills up to 6 passengers simultaneously in milliseconds (Name, Age, Gender, Berth preference, Food choice).
   - Automatically checks:
     - *"Book only if confirm berths are allotted"*
     - *"Consider for Auto Upgradation"*
     - Mobile number & Travel insurance preference.
4. **Automated Payment (Scan & Pay in 2 Seconds)**:
   - **BHIM UPI QR Code (Fastest)**: Automatically selects BHIM UPI on IRCTC, navigates to the payment gateway, and switches directly to the QR Code tab so you can scan it instantly with PhonePe, Google Pay, or Paytm.
   - **UPI ID (Collect Request)**: Automatically inputs your UPI ID (`user@okhdfcbank`, `mobile@paytm`) and submits the collect request.
5. **Exact Tatkal Countdown Clock & HUD**:
   - Floating on-page widget showing the countdown to 10:00:00 AM (AC) or 11:00:00 AM (Non-AC/Sleeper).
   - Plays chime sounds on Captcha solved and when Payment screen is reached.

---

## 🚀 How to Install in Google Chrome (Developer Mode)

### Step 1: Open Chrome Extensions
1. Open Google Chrome.
2. In the URL address bar, enter:
   ```
   chrome://extensions
   ```
3. In the top-right corner, toggle **Developer mode** to **ON**.

### Step 2: Load Unpacked Extension
1. Click the **Load unpacked** button in the top-left corner.
2. Navigate to and select this folder:
   ```
   c:\Users\gauta\OneDrive\Desktop\irctc-cypress-automation\irctc-tatkal-extension
   ```
3. Click **Select Folder**.
4. The extension **IRCTC Tatkal SuperFast Pro** will now appear in your extensions list! Pin it to your Chrome toolbar for quick access.

---

## ⚙️ How to Use

### 1. Start the Local Captcha Server (Optional but Recommended for Auto Captcha)
In your terminal, run:
```bash
npm run start-ocr
```
*(Or `python irctc-captcha-solver/app-server.py --host 0.0.0.0 --port 5000`)*  
Open the extension popup and verify the status says **● OCR: Online (Port 5000)**.

### 2. Configure Your Journey & Passenger Details
1. Click the **Tatkal Pro** icon in your Chrome toolbar.
2. In the **Journey** tab:
   - Enter From & To station codes (e.g. `NDLS`, `CNB`, `BSB`).
   - Pick your travel date or click **Tomorrow (Tatkal)**.
   - Enter Train Number and select Coach Class (`3A`, `SL`, etc.).
   - Quota will default to `TATKAL`.
3. In the **Passengers** tab:
   - Add your passenger details (Name, Age, Gender, Berth).
   - Ensure *"Book only if confirm berths are allotted"* is checked.
4. In the **Login & OCR** tab:
   - Enter your IRCTC Username & Password.
5. In the **Payment** tab:
   - Choose **BHIM UPI QR Code** (recommended) or enter your **UPI ID**.
6. Click **💾 Save Settings**.

### 3. Booking Time Workflow
- Open IRCTC at 09:57 AM (for AC) or 10:57 AM (for Sleeper).
- Click **🌐 Open IRCTC** from the extension or go to `https://www.irctc.co.in/nget/train-search`.
- The on-screen assistant will handle login and auto-fill captcha.
- At exactly 10:00:00 AM / 11:00:00 AM, select the train coach and click Book Now.
- Passenger details will be populated in under 500 milliseconds.
- Second-stage captcha will be auto-solved.
- On the payment screen, scan the QR code with your mobile UPI app and complete payment!
