const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '..', 'dist-electron');
if (fs.existsSync(dir)) {
  fs.rmSync(dir, { recursive: true, force: true });
  console.log('Cleaned dist-electron');
}
