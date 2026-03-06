const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const pngToIco = require('png-to-ico');

const buildDir = path.join(__dirname, '..', 'build');
const pngPath = path.join(buildDir, 'icon.png');
const icoPath = path.join(buildDir, 'icon.ico');

// Windows uses these sizes for taskbar, title bar, desktop, etc. Multi-size ICO prevents blurry/small look.
const SIZES = [16, 32, 48, 256];

async function main() {
  const sizePaths = [];
  for (const size of SIZES) {
    const outPath = path.join(buildDir, `icon-${size}.png`);
    await sharp(pngPath)
      .resize(size, size)
      .toFile(outPath);
    sizePaths.push(outPath);
  }
  const buf = await pngToIco(sizePaths);
  fs.writeFileSync(icoPath, buf);
  sizePaths.forEach((p) => fs.unlinkSync(p));
  console.log('Created build/icon.ico with sizes:', SIZES.join(', '));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
