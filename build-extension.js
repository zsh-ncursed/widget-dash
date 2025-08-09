#!/usr/bin/env node

import { exec } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';

console.log('🚀 Building Widget Dashboard Extension...');

// Build the app
exec('npm run build', async (error, stdout, stderr) => {
  if (error) {
    console.error('Build failed:', error);
    return;
  }
  
  console.log('✅ Build completed');
  
  try {
    // Create extension directory
    await fs.mkdir('extension-build', { recursive: true });
    
    // Copy built files
    await fs.cp('dist/client', 'extension-build', { recursive: true });
    
    // Copy extension files
    await fs.cp('manifest.json', 'extension-build/manifest.json');
    await fs.cp('src/extension', 'extension-build/src/extension', { recursive: true });
    
    // Copy assets if they exist
    try {
      await fs.cp('assets', 'extension-build/assets', { recursive: true });
    } catch (e) {
      console.log('⚠️  No assets folder found, skipping...');
    }
    
    // Update manifest paths
    const manifestPath = path.join('extension-build', 'manifest.json');
    const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
    
    // Fix paths for extension
    manifest.chrome_url_overrides.newtab = 'index.html';
    manifest.background.page = 'src/extension/background.html';
    
    await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2));
    
    // Fix HTML file paths
    const htmlPath = path.join('extension-build', 'index.html');
    let htmlContent = await fs.readFile(htmlPath, 'utf8');
    htmlContent = htmlContent.replace(/src="\/assets\//g, 'src="./assets/');
    htmlContent = htmlContent.replace(/href="\/assets\//g, 'href="./assets/');
    await fs.writeFile(htmlPath, htmlContent);
    
    console.log('✅ Extension built successfully in extension-build/ directory');
    console.log('📦 Load extension-build/ folder in Firefox as temporary add-on');
    
  } catch (err) {
    console.error('Error building extension:', err);
  }
});
