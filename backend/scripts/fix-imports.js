import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join, extname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const distDir = join(__dirname, '../dist');

// Recursively find all .js files
function findJsFiles(dir, fileList = []) {
  const files = readdirSync(dir);
  
  files.forEach((file) => {
    const filePath = join(dir, file);
    const stat = statSync(filePath);
    
    if (stat.isDirectory()) {
      findJsFiles(filePath, fileList);
    } else if (extname(file) === '.js') {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

const files = findJsFiles(distDir);
let totalFixed = 0;

files.forEach((file) => {
  let content = readFileSync(file, 'utf8');
  let modified = false;

  // Fix all static imports: from './path' or from '../path' to include .js extension
  // This handles: import X from './path', import { X } from './path', import './path'
  // Don't modify if already has .js, .json, or is a package import
  const staticImportRegex = /(?:import\s+(?:(?:\{[^}]*\}|\*\s+as\s+\w+|\w+)(?:\s*,\s*(?:\{[^}]*\}|\*\s+as\s+\w+|\w+))*\s+from\s+)?|from\s+)['"](\.\.?\/[^'"]+)(?<!\.js)(?<!\.json)(?<!\.ts)['"]/g;
  
  content = content.replace(staticImportRegex, (match) => {
    // Extract the path from the match
    const pathMatch = match.match(/['"](\.\.?\/[^'"]+)(?<!\.js)(?<!\.json)(?<!\.ts)['"]/);
    if (pathMatch) {
      const path = pathMatch[1];
      if (!path.endsWith('.js') && !path.endsWith('.json') && !path.endsWith('.ts') && !path.includes('node_modules')) {
        modified = true;
        return match.replace(path, path + '.js');
      }
    }
    return match;
  });

  // Fix dynamic imports: await import('./path')
  content = content.replace(
    /await\s+import\s*\(\s*['"](\.\.?\/[^'"]+)(?<!\.js)(?<!\.json)['"]\s*\)/g,
    (match, path) => {
      if (!path.endsWith('.js') && !path.endsWith('.json') && !path.includes('node_modules')) {
        modified = true;
        return match.replace(path, path + '.js');
      }
      return match;
    }
  );

  // Fix dynamic imports: import('./path')
  content = content.replace(
    /import\s*\(\s*['"](\.\.?\/[^'"]+)(?<!\.js)(?<!\.json)['"]\s*\)/g,
    (match, path) => {
      if (!path.endsWith('.js') && !path.endsWith('.json') && !path.includes('node_modules')) {
        modified = true;
        return match.replace(path, path + '.js');
      }
      return match;
    }
  );

  if (modified) {
    writeFileSync(file, content, 'utf8');
    totalFixed++;
    console.log(`Fixed: ${file.replace(distDir + '\\', '').replace(distDir + '/', '')}`);
  }
});

if (totalFixed > 0) {
  console.log(`\n✅ Fixed imports in ${totalFixed} file(s)`);
} else {
  console.log('✅ No import fixes needed');
}
