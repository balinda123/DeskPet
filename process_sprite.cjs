const { Jimp } = require('jimp');
const path = require('path');
const fs = require('fs');

async function processSprite() {
  const actionName = process.argv[2];
  const inputFile = process.argv[3];
  
  if (!actionName || !inputFile) {
    console.error('Usage: npm run process-sprite <action_name> <input_image>');
    console.error('Example: npm run process-sprite run public/assets/run_cat.png');
    process.exit(1);
  }

  console.log(`Processing action '${actionName}' from ${inputFile}...`);
  const img = await Jimp.read(inputFile);
  
  const w = img.bitmap.width;
  const h = img.bitmap.height;
  const data = img.bitmap.data;
  
  console.log(`Image size: ${w}x${h}`);
  
  // 1. Remove green screen
  for (let idx = 0; idx < data.length; idx += 4) {
    const r = data[idx];
    const g = data[idx + 1];
    const b = data[idx + 2];
    
    // Green screen detection heuristic
    if (g > 100 && g > r * 1.5 && g > b * 1.5) {
      data[idx + 3] = 0; // Set alpha to 0
    } else if (g > 80 && g > r * 1.2 && g > b * 1.2) {
      // Soft edge
      data[idx + 3] = Math.max(0, data[idx+3] - (g - Math.max(r, b)));
    }
  }
  
  const ext = path.extname(inputFile);
  const outputFile = inputFile.replace(ext, `_transparent${ext}`);
  
  await img.write(outputFile);
  console.log(`Saved transparent image to ${outputFile}`);
  
  // 2. Analyze components
  const visited = new Uint8Array(w * h);
  const components = [];
  
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = y * w + x;
      if (visited[idx]) continue;
      
      const alpha = data[(idx * 4) + 3];
      if (alpha > 50) {
        // Start BFS
        const q = [[x, y]];
        visited[idx] = 1;
        
        let minX = x, maxX = x, minY = y, maxY = y;
        let pixelCount = 0;
        
        let head = 0;
        while (head < q.length) {
          const [cx, cy] = q[head++];
          pixelCount++;
          
          if (cx < minX) minX = cx;
          if (cx > maxX) maxX = cx;
          if (cy < minY) minY = cy;
          if (cy > maxY) maxY = cy;
          
          const neighbors = [
            [cx - 1, cy], [cx + 1, cy], [cx, cy - 1], [cx, cy + 1]
          ];
          
          for (const [nx, ny] of neighbors) {
            if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
              const nIdx = ny * w + nx;
              if (!visited[nIdx]) {
                const nAlpha = data[(nIdx * 4) + 3];
                if (nAlpha > 50) {
                  visited[nIdx] = 1;
                  q.push([nx, ny]);
                }
              }
            }
          }
        }
        
        if (pixelCount > 500) {
          components.push({ minX, maxX, minY, maxY, pixelCount });
        }
      }
    }
  }
  
  components.sort((a, b) => {
    if (Math.abs(a.minY - b.minY) > 200) return a.minY - b.minY;
    return a.minX - b.minX;
  });
  
  console.log(`\nFound ${components.length} distinct frames!`);
  const framesOutput = components.map(c => ({ x: c.minX, y: c.minY, w: c.maxX - c.minX, h: c.maxY - c.minY }));
  
  // 3. Update animations.json
  const configPath = path.join(__dirname, 'src', 'config', 'animations.json');
  let config = {};
  if (fs.existsSync(configPath)) {
    config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  }
  
  // Determine URL path relative to public
  const publicIndex = outputFile.indexOf('public');
  const publicUrl = publicIndex !== -1 
    ? outputFile.substring(publicIndex + 'public'.length).replace(/\\/g, '/') 
    : '/' + path.basename(outputFile);

  if (!config[actionName]) {
    config[actionName] = {
      fps: 12, // default
      speed: 2, // default
      holdLastFrameMs: 0
    };
  }
  
  config[actionName].url = publicUrl;
  config[actionName].framesArray = framesOutput;
  
  fs.mkdirSync(path.dirname(configPath), { recursive: true });
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
  
  console.log(`\nSuccessfully updated src/config/animations.json for action: ${actionName}`);
  console.log(`You can adjust 'fps', 'speed', and 'holdLastFrameMs' manually in animations.json if needed!`);
}

processSprite().catch(console.error);
