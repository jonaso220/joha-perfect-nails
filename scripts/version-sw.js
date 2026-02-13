const fs = require("fs");
const path = require("path");

const swPath = path.join(__dirname, "..", "public", "sw.js");
let content = fs.readFileSync(swPath, "utf-8");

const buildId = Date.now().toString(36);
content = content.replace(
  /const BUILD_ID = ".*?";/,
  `const BUILD_ID = "${buildId}";`
);
content = content.replace(
  /const CACHE_NAME = ".*?";/,
  `const CACHE_NAME = "glow-by-joha-${buildId}";`
);

fs.writeFileSync(swPath, content);
console.log(`SW versioned: BUILD_ID=${buildId}`);
