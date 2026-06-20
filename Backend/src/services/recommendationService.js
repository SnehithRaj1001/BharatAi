import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const getRecommendations = async (userProfile) => {
  return new Promise((resolve, reject) => {
    // Determine path to the python script
    const scriptPath = path.resolve(__dirname, '../../python_scripts/recommend.py');
    
    // Pass the MongoDB URI and OpenRouter API key as environment variables
    const env = {
      ...process.env,
      MONGODB_URI: process.env.MONGODB_URI,
      OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY
    };

    // Spawn the python process
    // Ensure you have python installed and accessible via 'python' or 'python3'
    const pyProcess = spawn('python', [scriptPath], { env });

    let stdoutData = '';
    let stderrData = '';

    pyProcess.stdout.on('data', (data) => {
      stdoutData += data.toString();
    });

    pyProcess.stderr.on('data', (data) => {
      stderrData += data.toString();
      console.error(`Python Error: ${data}`);
    });

    pyProcess.on('close', (code) => {
      if (code !== 0) {
        return reject(new Error(`Python script exited with code ${code}. Error: ${stderrData}`));
      }
      
      try {
        const result = JSON.parse(stdoutData);
        if (result.error) {
          return reject(new Error(`Error from python script: ${result.error}`));
        }
        resolve(result);
      } catch (err) {
        reject(new Error(`Failed to parse python output. Output: ${stdoutData}. Parse Error: ${err.message}`));
      }
    });

    // Send the user profile JSON to the python script's stdin
    pyProcess.stdin.write(JSON.stringify(userProfile));
    pyProcess.stdin.end();
  });
};
