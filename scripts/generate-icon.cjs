const sharp = require('sharp');
const { encodeIco } = require('icojs');
const fs = require('fs');
const path = require('path');

async function main() {
  const svgPath = path.join(__dirname, '..', 'build-assets', 'icon.svg');
  const icoPath = path.join(__dirname, '..', 'build-assets', 'icon.ico');

  const sizes = [16, 32, 48, 64, 128, 256];
  const buffers = await Promise.all(
    sizes.map((s) => sharp(svgPath).resize(s, s).png().toBuffer())
  );

  const ico = await encodeIco(buffers);
  fs.writeFileSync(icoPath, Buffer.from(ico));
  console.log('Generated', icoPath);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
