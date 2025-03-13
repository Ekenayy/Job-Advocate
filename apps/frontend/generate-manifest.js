#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Hardcoded values for testing
const clientId = '807605227538-58ddgsc8s8prmso6e8laaddp8q949hvg.apps.googleusercontent.com';
const env = 'development';
const apiUrl = 'https://inreach-staging.onrender.com';

try {
  // Read the template file
  const templatePath = path.resolve(__dirname, 'manifest.template.json');
  const manifestContent = fs.readFileSync(templatePath, 'utf8');
  
  console.log('Template loaded successfully');
  
  // Replace placeholders
  const processedManifest = manifestContent
    .replace(/__ENV__/g, env)
    .replace(/__OAUTH_CLIENT_ID__/g, clientId)
    .replace(/__API_URL__/g, apiUrl ? ` ${apiUrl}` : '');
  
  // Ensure output directory exists
  const outputDir = path.resolve(__dirname, 'dist');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // Write the processed manifest
  fs.writeFileSync(
    path.resolve(outputDir, 'manifest.json'),
    processedManifest
  );
  
  // Parse and log the oauth2 section for debugging
  try {
    const parsedManifest = JSON.parse(processedManifest);
    console.log('Generated manifest oauth2 section:', JSON.stringify(parsedManifest.oauth2, null, 2));
  } catch (parseError) {
    console.error('Error parsing manifest for debug:', parseError);
  }
  
  console.log(`✅ Manifest generated successfully with client_id: ${clientId}`);
} catch (error) {
  console.error('❌ Error generating manifest:', error);
} 