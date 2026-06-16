const fs = require('fs');
const path = require('path');

const files = [
  'frontend/src/app/dashboard/toolkit/rubric-generator/page.tsx',
  'frontend/src/app/dashboard/toolkit/lesson-summary/page.tsx',
  'frontend/src/app/dashboard/toolkit/difficulty-analyzer/page.tsx'
];

files.forEach(file => {
  const fullPath = path.join(__dirname, file);
  let content = fs.readFileSync(fullPath, 'utf8');

  // Add Suspense import if not present
  if (!content.includes('Suspense')) {
    content = content.replace("import React, { useState, useEffect } from 'react';", "import React, { useState, useEffect, Suspense } from 'react';");
    content = content.replace("import React, { useState } from 'react';", "import React, { useState, Suspense } from 'react';");
  }

  // Rename export default function Name to function NameContent
  const functionMatch = content.match(/export default function ([A-Za-z0-9_]+)\s*\(\)/);
  if (functionMatch) {
    const originalName = functionMatch[1];
    const newName = originalName + 'Content';
    
    content = content.replace(`export default function ${originalName}()`, `function ${newName}()`);
    
    // Add the wrapper at the bottom
    content += `\n\nexport default function ${originalName}() {\n  return (\n    <Suspense>\n      <${newName} />\n    </Suspense>\n  );\n}\n`;
    
    fs.writeFileSync(fullPath, content);
    console.log(`Patched ${file}`);
  }
});
