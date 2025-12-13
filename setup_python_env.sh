#!/bin/bash

echo "🔧 Setting up Python environment for OCR processing..."

# Check if Tesseract is installed
if ! command -v tesseract &> /dev/null; then
    echo "❌ Tesseract OCR not found. Please install it first:"
    echo "   brew install tesseract"
    exit 1
fi

echo "✅ Tesseract version: $(tesseract --version | head -n 1)"

# Check if poppler is installed (needed for pdf2image)
if ! command -v pdfinfo &> /dev/null; then
    echo "❌ Poppler not found. Please install it first:"
    echo "   brew install poppler"
    exit 1
fi

echo "✅ Poppler installed"

# Create virtual environment
if [ -d "python_env" ]; then
    echo "📁 Python environment already exists. Removing old one..."
    rm -rf python_env
fi

echo "🐍 Creating Python virtual environment..."
python3 -m venv python_env

# Activate virtual environment
source python_env/bin/activate

# Upgrade pip
echo "⬆️  Upgrading pip..."
pip install --upgrade pip

# Install requirements
echo "📦 Installing Python packages..."
pip install -r requirements.txt

echo ""
echo "✅ Setup complete!"
echo ""
echo "To activate the environment, run:"
echo "   source python_env/bin/activate"
echo ""
echo "To run OCR processing, use:"
echo "   node run_ocr_processing.js"
