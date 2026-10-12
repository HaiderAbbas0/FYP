import fs from 'fs';
import { PNG } from 'pngjs';

const inputPath = 'C:/Users/ayesh/.gemini/antigravity-ide/brain/acf2d84f-a161-4ff9-8738-2f555dd20737/.user_uploaded/media_1791657181096.png';

fs.createReadStream(inputPath)
  .pipe(new PNG())
  .on('parsed', function() {
    console.log(`Original dimensions: ${this.width}x${this.height}`);

    // First find bounding box of non-white pixels
    let minX = this.width, maxX = 0, minY = this.height, maxY = 0;

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const idx = (this.width * y + x) << 2;
        const r = this.data[idx];
        const g = this.data[idx + 1];
        const b = this.data[idx + 2];

        // If not white background
        if (!(r > 230 && g > 230 && b > 230)) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }

    // Add slight padding (e.g. 10px)
    minX = Math.max(0, minX - 10);
    maxX = Math.min(this.width - 1, maxX + 10);
    minY = Math.max(0, minY - 10);
    maxY = Math.min(this.height - 1, maxY + 10);

    const cropW = maxX - minX + 1;
    const cropH = maxY - minY + 1;
    console.log(`Cropped bounding box: ${cropW}x${cropH} at (${minX},${minY})`);

    // Create transparent cropped image for dark theme (white M + white Medi, lime dot, lime SOC)
    const whiteLogo = new PNG({ width: cropW, height: cropH });
    // Create transparent cropped image for light theme (dark M + dark Medi, lime dot, lime SOC)
    const darkLogo = new PNG({ width: cropW, height: cropH });

    for (let y = 0; y < cropH; y++) {
      for (let x = 0; x < cropW; x++) {
        const srcIdx = (this.width * (minY + y) + (minX + x)) << 2;
        const dstIdx = (cropW * y + x) << 2;

        const r = this.data[srcIdx];
        const g = this.data[srcIdx + 1];
        const b = this.data[srcIdx + 2];
        const a = this.data[srcIdx + 3];

        // Is white background?
        const isWhiteBg = (r > 235 && g > 235 && b > 235);

        if (isWhiteBg) {
          // Transparent
          whiteLogo.data[dstIdx] = 0;
          whiteLogo.data[dstIdx + 1] = 0;
          whiteLogo.data[dstIdx + 2] = 0;
          whiteLogo.data[dstIdx + 3] = 0;

          darkLogo.data[dstIdx] = 0;
          darkLogo.data[dstIdx + 1] = 0;
          darkLogo.data[dstIdx + 2] = 0;
          darkLogo.data[dstIdx + 3] = 0;
        } else {
          // Check if pixel is lime green (dot or SOC)
          // Lime green has high green (g > 160) and g > r and g > b
          const isLime = (g > 140 && g > r * 0.8 && g > b * 1.5);

          if (isLime) {
            // Lime green accent
            whiteLogo.data[dstIdx] = r;
            whiteLogo.data[dstIdx + 1] = g;
            whiteLogo.data[dstIdx + 2] = b;
            whiteLogo.data[dstIdx + 3] = 255;

            darkLogo.data[dstIdx] = r;
            darkLogo.data[dstIdx + 1] = g;
            darkLogo.data[dstIdx + 2] = b;
            darkLogo.data[dstIdx + 3] = 255;
          } else {
            // Dark navy/black mark or text
            // In whiteLogo: make it pure bright white #FFFFFF
            whiteLogo.data[dstIdx] = 255;
            whiteLogo.data[dstIdx + 1] = 255;
            whiteLogo.data[dstIdx + 2] = 255;
            // Anti-aliasing alpha
            const brightness = (r + g + b) / 3;
            // darker = more opaque
            const alpha = Math.min(255, Math.max(0, Math.round((255 - brightness) * 1.2)));
            whiteLogo.data[dstIdx + 3] = Math.max(alpha, 200);

            // In darkLogo: keep original dark navy color
            darkLogo.data[dstIdx] = r;
            darkLogo.data[dstIdx + 1] = g;
            darkLogo.data[dstIdx + 2] = b;
            darkLogo.data[dstIdx + 3] = 255;
          }
        }
      }
    }

    whiteLogo.pack().pipe(fs.createWriteStream('public/medisoc-logo-white.png')).on('finish', () => {
      console.log('Saved public/medisoc-logo-white.png successfully!');
    });

    darkLogo.pack().pipe(fs.createWriteStream('public/medisoc-logo.png')).on('finish', () => {
      console.log('Saved public/medisoc-logo.png successfully!');
    });
  });
