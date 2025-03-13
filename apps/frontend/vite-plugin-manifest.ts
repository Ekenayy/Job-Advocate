import type { Plugin } from 'vite';
import fs from 'fs';
import path from 'path';

export function manifestPlugin(): Plugin {
  // Store config values
  let clientId = '';
  let apiUrl = '';
  let env = 'development';

  return {
    name: 'vite-plugin-manifest',
    
    configResolved(config) {
      // Get environment variables from the resolved config
      env = config.mode || process.env.NODE_ENV || 'development';
      clientId = config.env?.VITE_OAUTH_CLIENT_ID || '';
      apiUrl = config.env?.VITE_BACKEND_URL || '';
      
      // Remove quotes from client ID
      clientId = clientId.replace(/["']/g, '');
      
      console.log('Vite config resolved:');
      console.log('Mode:', env);
      console.log('Client ID:', clientId);
      console.log('API URL:', apiUrl);
    },
    
    closeBundle() {
      try {
        // If client ID is still empty, use a fallback for testing
        if (!clientId) {
          console.warn('⚠️ Client ID not found in environment variables, using fallback for testing');
          clientId = '807605227538-58ddgsc8s8prmso6e8laaddp8q949hvg.apps.googleusercontent.com';
        }
        
        // Read the template file
        const templatePath = path.resolve(__dirname, 'manifest.template.json');
        const manifestContent = fs.readFileSync(templatePath, 'utf8');
        
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
        
        // Ensure assets directory exists
        const assetsDir = path.resolve(outputDir, 'assets');
        if (!fs.existsSync(assetsDir)) {
          fs.mkdirSync(assetsDir, { recursive: true });
        }
        
        // Copy favicon if it doesn't exist in the assets directory
        const faviconDest = path.resolve(assetsDir, 'favicon.svg');
        if (!fs.existsSync(faviconDest)) {
          const faviconSrc = path.resolve(__dirname, 'src/assets/favicon.svg');
          if (fs.existsSync(faviconSrc)) {
            fs.copyFileSync(faviconSrc, faviconDest);
            console.log('✅ Copied favicon.svg to assets directory');
          } else {
            console.warn('⚠️ Source favicon.svg not found at', faviconSrc);
          }
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
    }
  };
}
