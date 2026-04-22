const fs = require('fs');
const path = require('path');

// Source and destination paths
const cesiumSource = path.join(__dirname, '..', 'node_modules', 'cesium', 'Build', 'Cesium');
const cesiumDest = path.join(__dirname, '..', 'public', 'cesium');

// Create public/cesium directory if it doesn't exist
if (!fs.existsSync(cesiumDest)) {
  fs.mkdirSync(cesiumDest, { recursive: true });
  console.log('✓ Created public/cesium directory');
}

// Copy Cesium assets
const itemsToCopy = ['Assets', 'ThirdParty', 'Widgets', 'Workers'];

itemsToCopy.forEach(item => {
  const src = path.join(cesiumSource, item);
  const dest = path.join(cesiumDest, item);
  
  if (fs.existsSync(src)) {
    // Remove existing destination if it exists
    if (fs.existsSync(dest)) {
      fs.rmSync(dest, { recursive: true, force: true });
    }
    
    // Copy directory
    copyRecursive(src, dest);
    console.log(`✓ Copied ${item}`);
  } else {
    console.warn(`⚠ ${item} not found in Cesium build`);
  }
});

console.log('\n✅ Cesium assets copied successfully!');
console.log('You can now run: npm run dev');

// Helper function to copy directories recursively
function copyRecursive(src, dest) {
  const stats = fs.statSync(src);
  
  if (stats.isDirectory()) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    
    const files = fs.readdirSync(src);
    files.forEach(file => {
      copyRecursive(path.join(src, file), path.join(dest, file));
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}
