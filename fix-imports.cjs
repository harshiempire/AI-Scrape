#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function fixImportsInFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;

    // Fix relative imports that are missing .js extension
    const importRegex = /from\s+['"](\.\/[^'"]*?)['"]/g;
    const importMatches = content.match(importRegex);
    
    if (importMatches) {
      importMatches.forEach(match => {
        const importPath = match.match(/from\s+['"](\.\/[^'"]*?)['"]/)[1];
        if (!importPath.endsWith('.js') && !importPath.endsWith('.json')) {
          const newImport = match.replace(importPath, importPath + '.js');
          content = content.replace(match, newImport);
          modified = true;
        }
      });
    }

    // Fix relative imports with ../
    const parentImportRegex = /from\s+['"](\.\.\/[^'"]*?)['"]/g;
    const parentImportMatches = content.match(parentImportRegex);
    
    if (parentImportMatches) {
      parentImportMatches.forEach(match => {
        const importPath = match.match(/from\s+['"](\.\.\/[^'"]*?)['"]/)[1];
        if (!importPath.endsWith('.js') && !importPath.endsWith('.json')) {
          const newImport = match.replace(importPath, importPath + '.js');
          content = content.replace(match, newImport);
          modified = true;
        }
      });
    }

    if (modified) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Fixed imports in: ${filePath}`);
    }
  } catch (error) {
    console.error(`Error fixing imports in ${filePath}:`, error.message);
  }
}

function walkDirectory(dir) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      walkDirectory(filePath);
    } else if (file.endsWith('.js')) {
      fixImportsInFile(filePath);
    }
  });
}

// Start fixing from the dist directory
const distDir = path.join(__dirname, 'dist');
if (fs.existsSync(distDir)) {
  console.log('Fixing ES module imports in dist directory...');
  walkDirectory(distDir);
  console.log('✅ Import fixing completed!');
} else {
  console.log('❌ dist directory not found. Run "npx tsc" first.');
}
