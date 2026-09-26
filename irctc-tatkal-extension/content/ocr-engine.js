// IRCTC Tatkal SuperFast Pro - Client-side Image Preprocessing & Fallback OCR Engine

const OCREngine = {
  /**
   * Preprocesses an image element (or image URL) to clean contrast and noise
   * for IRCTC Captchas.
   * @param {HTMLImageElement|string} imgSource - Image DOM element or base64 URL
   * @returns {Promise<{cleanBase64: string, canvas: HTMLCanvasElement}>}
   */
  async preprocessImage(imgSource) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";

      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d", { willReadFrequently: true });
          canvas.width = img.naturalWidth || img.width || 180;
          canvas.height = img.naturalHeight || img.height || 60;

          // Draw original image
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imgData.data;

          // Calculate average luminance
          let totalLum = 0;
          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            totalLum += 0.299 * r + 0.587 * g + 0.114 * b;
          }
          const avgLum = totalLum / (data.length / 4);
          const threshold = Math.max(110, Math.min(170, avgLum - 15));

          // Grayscale & Adaptive Thresholding
          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const lum = 0.299 * r + 0.587 * g + 0.114 * b;

            // Make dark text sharp black, background pure white
            if (lum < threshold) {
              data[i] = 0;
              data[i + 1] = 0;
              data[i + 2] = 0;
            } else {
              data[i] = 255;
              data[i + 1] = 255;
              data[i + 2] = 255;
            }
          }

          // Simple salt-and-pepper / line noise reduction:
          // Remove lone black pixels surrounded by white
          const w = canvas.width;
          const h = canvas.height;
          const cleaned = new Uint8ClampedArray(data);

          for (let y = 1; y < h - 1; y++) {
            for (let x = 1; x < w - 1; x++) {
              const idx = (y * w + x) * 4;
              if (data[idx] === 0) {
                // If it's black, check 4-neighborhood
                let whiteNeighbors = 0;
                if (data[((y - 1) * w + x) * 4] === 255) whiteNeighbors++;
                if (data[((y + 1) * w + x) * 4] === 255) whiteNeighbors++;
                if (data[(y * w + (x - 1)) * 4] === 255) whiteNeighbors++;
                if (data[(y * w + (x + 1)) * 4] === 255) whiteNeighbors++;
                if (whiteNeighbors >= 4) {
                  cleaned[idx] = 255;
                  cleaned[idx + 1] = 255;
                  cleaned[idx + 2] = 255;
                }
              }
            }
          }

          for (let i = 0; i < data.length; i++) {
            data[i] = cleaned[i];
          }

          ctx.putImageData(imgData, 0, 0);
          const cleanBase64 = canvas.toDataURL("image/png");
          resolve({ cleanBase64, canvas });
        } catch (err) {
          reject(err);
        }
      };

      img.onerror = (e) => reject(new Error("Failed to load image for OCR preprocessing: " + e));

      if (typeof imgSource === "string") {
        img.src = imgSource;
      } else if (imgSource && imgSource.src) {
        img.src = imgSource.src;
      } else {
        reject(new Error("Invalid imgSource provided"));
      }
    });
  },

  /**
   * Solve captcha using the preferred mode:
   * 1. Python Server (EasyOCR) - high accuracy
   * 2. Browser Fallback
   */
  async solve(imgElement, mode = "server", serverUrl = "http://localhost:5000/extract-text") {
    try {
      const src = imgElement.src || (imgElement.getAttribute && imgElement.getAttribute("src"));
      if (!src) throw new Error("Captcha image src not found");

      let cleanBase64 = src;
      try {
        const preprocessed = await this.preprocessImage(imgElement);
        cleanBase64 = preprocessed.cleanBase64;
      } catch (err) {
        console.warn("[IRCTC Pro] Preprocessing warning, using raw image src:", err);
      }

      if (mode === "server") {
        // Send message to background script to call local python server (bypassing CORS)
        return new Promise((resolve, reject) => {
          chrome.runtime.sendMessage(
            {
              action: "SOLVE_CAPTCHA_SERVER",
              image: cleanBase64,
              url: serverUrl
            },
            (response) => {
              if (chrome.runtime.lastError) {
                return reject(chrome.runtime.lastError);
              }
              if (response && response.success && response.text) {
                resolve(response.text.trim());
              } else {
                reject(new Error(response?.error || "Server failed to extract text"));
              }
            }
          );
        });
      }

      throw new Error("No other OCR mode configured");
    } catch (e) {
      console.error("[IRCTC Pro] OCR solve error:", e);
      throw e;
    }
  }
};

window.OCREngine = OCREngine;
