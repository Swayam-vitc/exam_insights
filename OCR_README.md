# OCR Question Paper Processing - Quick Reference

## Prerequisites
- Tesseract OCR: `brew install tesseract`
- Poppler: `brew install poppler`
- Python 3.x (already installed)

## First Time Setup
```bash
bash setup_python_env.sh
```

## Processing Question Papers

### Add PDFs to Process
Place your PDF question papers in the `quepaper/` directory.

### Run OCR Processing
```bash
node run_ocr_processing.js
```

This will:
1. Clear existing papers from database
2. Process all PDFs in `quepaper/`
3. Extract text using OCR
4. Clean text (remove headers/footers)
5. Extract metadata (date, exam type, subject, year, semester)
6. Extract keywords/topics using YAKE
7. Save to MongoDB
8. Copy PDFs to `uploads/` with standardized naming

### Verify Results
```bash
node verify_ocr_data.js
```

Shows all extracted data including metadata, keywords, and text preview.

## What Gets Extracted

### Metadata
- **Subject**: Extracted from filename or PDF content
- **Exam Type**: IA1, IA2, or SEE
- **Year**: 4-digit year
- **Semester**: Semester number
- **Exam Date**: In various formats (DD-MM-YYYY, DD/MM/YYYY, etc.)

### Content
- **Extracted Text**: Raw OCR output
- **Cleaned Text**: After removing headers, footers, page numbers
- **Keywords**: Top 15 relevant keywords/topics
- **Sections**: Question paper sections (Part A, Part B, etc.)

## File Naming Convention
Processed files are saved as:
```
{Subject}_{ExamType}_{Year}_Sem{Semester}.pdf
```

Example: `DSA_Basics_SEE_2024_Sem3.pdf`

## Troubleshooting

### "Unable to get page count" Error
- Install poppler: `brew install poppler`

### "Tesseract not found" Error
- Install tesseract: `brew install tesseract`

### Python Environment Issues
- Remove old environment: `rm -rf python_env/`
- Run setup again: `bash setup_python_env.sh`

## Database Schema

```javascript
{
  subject: String,
  year: Number,
  semester: Number,
  examType: String,        // 'IA1', 'IA2', 'SEE'
  examDate: String,        // Extracted date
  filePath: String,
  extractedText: String,   // Raw OCR text
  cleanedText: String,     // Cleaned text
  keywords: [String],      // Extracted keywords
  sections: [{             // Question sections
    name: String,
    content: String
  }],
  uploadedAt: Date
}
```

## Example Output

```
📊 Total papers in database: 3

📄 Paper: DSA_Basics_SEE_2024_Sem3.pdf
   Subject: DSA Basics
   Exam Type: SEE
   Year: 2024
   Semester: 3
   Exam Date: 15/11/2024
   Keywords: tree, Node, struct Node, current, NULL...
```
