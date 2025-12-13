const { spawn } = require('child_process');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

console.log('🚀 Running OCR Processing...\n');

// Path to Python virtual environment
const pythonPath = path.join(__dirname, 'python_env', 'bin', 'python3');
const scriptPath = path.join(__dirname, 'ocr_processor.py');

// Check if virtual environment exists
const fs = require('fs');
if (!fs.existsSync(pythonPath)) {
    console.error('❌ Python virtual environment not found!');
    console.error('Please run: bash setup_python_env.sh\n');
    process.exit(1);
}

// Spawn Python process
const python = spawn(pythonPath, [scriptPath], {
    env: {
        ...process.env,
        MONGODB_URI: process.env.MONGODB_URI
    }
});

// Capture stdout
python.stdout.on('data', (data) => {
    process.stdout.write(data.toString());
});

// Capture stderr
python.stderr.on('data', (data) => {
    process.stderr.write(data.toString());
});

// Handle process exit
python.on('close', (code) => {
    if (code === 0) {
        console.log('\n✅ OCR processing completed successfully!');
    } else {
        console.error(`\n❌ OCR processing failed with code ${code}`);
    }
    process.exit(code);
});

// Handle errors
python.on('error', (err) => {
    console.error('❌ Failed to start Python process:', err);
    process.exit(1);
});
