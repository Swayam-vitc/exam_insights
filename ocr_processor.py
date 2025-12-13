#!/usr/bin/env python3
"""
OCR-based Question Paper Processor
Extracts text from PDFs using Tesseract OCR, cleans text, extracts metadata and topics
"""

import os
import re
import sys
import json
from datetime import datetime
from pathlib import Path
import pytesseract
from pdf2image import convert_from_path
from PIL import Image
from pymongo import MongoClient
from dotenv import load_dotenv
import yake

# Load environment variables
load_dotenv()

# MongoDB connection
MONGODB_URI = os.getenv('MONGODB_URI', 'mongodb://localhost:27017/student-examination')

class OCRProcessor:
    def __init__(self):
        self.client = MongoClient(MONGODB_URI)
        self.db = self.client.get_database()
        self.papers_collection = self.db['questionpapers']
        
        # Initialize YAKE keyword extractor
        self.keyword_extractor = yake.KeywordExtractor(
            lan="en",
            n=3,  # max n-gram size
            dedupLim=0.7,
            top=15,  # top N keywords
            features=None
        )
        
    def pdf_to_images(self, pdf_path, output_folder='temp_images'):
        """Convert PDF pages to PNG images"""
        print(f"📄 Converting PDF to images: {pdf_path}")
        
        # Create temp folder if it doesn't exist
        Path(output_folder).mkdir(exist_ok=True)
        
        try:
            # Convert PDF to images (300 DPI for better OCR)
            images = convert_from_path(pdf_path, dpi=300)
            
            image_paths = []
            for i, image in enumerate(images):
                image_path = os.path.join(output_folder, f'page_{i+1}.png')
                image.save(image_path, 'PNG')
                image_paths.append(image_path)
                print(f"   ✅ Converted page {i+1}")
            
            return image_paths
        except Exception as e:
            print(f"   ❌ Error converting PDF: {e}")
            return []
    
    def extract_text_from_image(self, image_path):
        """Extract text from image using Tesseract OCR"""
        try:
            # Open image
            image = Image.open(image_path)
            
            # Perform OCR
            text = pytesseract.image_to_string(image, lang='eng')
            
            return text
        except Exception as e:
            print(f"   ❌ Error in OCR: {e}")
            return ""
    
    def clean_text(self, text):
        """Clean extracted text using regex"""
        # Remove excessive whitespace
        text = re.sub(r'\n\s*\n', '\n\n', text)
        text = re.sub(r' +', ' ', text)
        
        # Remove common headers/footers patterns
        text = re.sub(r'Page \d+ of \d+', '', text, flags=re.IGNORECASE)
        text = re.sub(r'^\d+\s*$', '', text, flags=re.MULTILINE)  # Remove standalone page numbers
        
        # Remove university/college headers (common patterns)
        text = re.sub(r'VIT[- ]?VELLORE', '', text, flags=re.IGNORECASE)
        text = re.sub(r'VELLORE INSTITUTE OF TECHNOLOGY', '', text, flags=re.IGNORECASE)
        text = re.sub(r'SCHOOL OF.*', '', text, flags=re.IGNORECASE)
        
        # Remove watermark-like text
        text = re.sub(r'INTERNAL USE ONLY', '', text, flags=re.IGNORECASE)
        text = re.sub(r'CONFIDENTIAL', '', text, flags=re.IGNORECASE)
        
        # Clean up extra newlines
        text = re.sub(r'\n{3,}', '\n\n', text)
        
        return text.strip()
    
    def extract_exam_date(self, text):
        """Extract exam date from text"""
        # Common date patterns
        date_patterns = [
            r'(\d{1,2}[-/]\d{1,2}[-/]\d{4})',  # DD-MM-YYYY or DD/MM/YYYY
            r'(\d{4}[-/]\d{1,2}[-/]\d{1,2})',  # YYYY-MM-DD
            r'(\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4})',  # DD Month YYYY
        ]
        
        for pattern in date_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                return match.group(1)
        
        return None
    
    def extract_exam_type(self, text):
        """Identify exam type (IA1, IA2, SEE)"""
        text_lower = text.lower()
        
        # Check for IA1
        if re.search(r'internal\s+assessment\s*[-:]?\s*1|ia\s*[-:]?\s*1|ia1', text_lower):
            return 'IA1'
        
        # Check for IA2
        if re.search(r'internal\s+assessment\s*[-:]?\s*2|ia\s*[-:]?\s*2|ia2', text_lower):
            return 'IA2'
        
        # Check for SEE
        if re.search(r'semester\s+end|end\s+semester|see|final\s+exam', text_lower):
            return 'SEE'
        
        # Default to SEE if not found
        return 'SEE'
    
    def extract_subject(self, text, filename):
        """Extract subject name"""
        # First try filename
        filename_lower = filename.lower()
        
        if 'dsa' in filename_lower:
            return 'DSA Basics'
        elif 'java' in filename_lower:
            return 'Java Basics'
        elif 'sed' in filename_lower:
            return 'SED Basics'
        
        # Try to extract from text
        subject_patterns = [
            r'(?:subject|course)\s*[:-]?\s*([A-Z][A-Za-z\s]+)',
            r'([A-Z][A-Z\s]+)\s+(?:question paper)',
        ]
        
        for pattern in subject_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                subject = match.group(1).strip()
                if len(subject) > 3:
                    return subject
        
        return 'Unknown Subject'
    
    def extract_year(self, text):
        """Extract year from text"""
        # Look for 4-digit year
        year_match = re.search(r'20\d{2}', text)
        if year_match:
            return int(year_match.group(0))
        
        return datetime.now().year
    
    def extract_semester(self, text, filename):
        """Extract semester number"""
        # Try filename first
        if 'sem3' in filename.lower() or 'semester 3' in filename.lower():
            return 3
        elif 'sem2' in filename.lower() or 'semester 2' in filename.lower():
            return 2
        elif 'sem4' in filename.lower() or 'semester 4' in filename.lower():
            return 4
        
        # Try text
        sem_match = re.search(r'semester\s*[:-]?\s*(\d)', text, re.IGNORECASE)
        if sem_match:
            return int(sem_match.group(1))
        
        return 3  # Default
    
    def extract_sections(self, text):
        """Extract sections from the question paper"""
        sections = []
        
        # Common section patterns
        section_pattern = r'(?:^|\n)\s*(?:PART|SECTION)\s*[-:]?\s*([A-Z])\s*(?:\n|$)'
        matches = re.finditer(section_pattern, text, re.IGNORECASE | re.MULTILINE)
        
        section_positions = [(m.group(1), m.start()) for m in matches]
        
        if section_positions:
            for i, (section_name, start_pos) in enumerate(section_positions):
                # Get end position (start of next section or end of text)
                end_pos = section_positions[i + 1][1] if i + 1 < len(section_positions) else len(text)
                
                section_content = text[start_pos:end_pos].strip()
                sections.append({
                    'name': f'Section {section_name}',
                    'content': section_content[:500]  # First 500 chars
                })
        
        return sections
    
    def extract_keywords(self, text):
        """Extract keywords/topics using YAKE"""
        try:
            keywords = self.keyword_extractor.extract_keywords(text)
            # Return just the keyword strings (not scores)
            return [kw[0] for kw in keywords]
        except Exception as e:
            print(f"   ⚠️ Keyword extraction error: {e}")
            return []
    
    def process_pdf(self, pdf_path):
        """Main processing function for a single PDF"""
        filename = os.path.basename(pdf_path)
        print(f"\n{'='*60}")
        print(f"📋 Processing: {filename}")
        print(f"{'='*60}")
        
        # Convert PDF to images
        image_paths = self.pdf_to_images(pdf_path)
        
        if not image_paths:
            print(f"❌ Failed to convert PDF to images")
            return None
        
        # Extract text from all pages
        print(f"🔍 Extracting text from {len(image_paths)} pages...")
        full_text = ""
        for i, img_path in enumerate(image_paths, 1):
            print(f"   Page {i}...", end=" ")
            page_text = self.extract_text_from_image(img_path)
            full_text += f"\n--- Page {i} ---\n" + page_text
            print(f"✅ ({len(page_text)} chars)")
        
        # Clean up temp images
        for img_path in image_paths:
            try:
                os.remove(img_path)
            except:
                pass
        
        print(f"\n📊 Total extracted text: {len(full_text)} characters")
        
        # Clean text
        print(f"🧹 Cleaning text...")
        cleaned_text = self.clean_text(full_text)
        print(f"   Cleaned text: {len(cleaned_text)} characters")
        
        # Extract metadata
        print(f"📝 Extracting metadata...")
        metadata = {
            'subject': self.extract_subject(full_text, filename),
            'examType': self.extract_exam_type(full_text),
            'year': self.extract_year(full_text),
            'semester': self.extract_semester(full_text, filename),
            'examDate': self.extract_exam_date(full_text),
            'sections': self.extract_sections(cleaned_text)
        }
        
        print(f"   Subject: {metadata['subject']}")
        print(f"   Exam Type: {metadata['examType']}")
        print(f"   Year: {metadata['year']}")
        print(f"   Semester: {metadata['semester']}")
        print(f"   Date: {metadata['examDate']}")
        print(f"   Sections: {len(metadata['sections'])}")
        
        # Extract keywords/topics
        print(f"🔑 Extracting keywords/topics...")
        keywords = self.extract_keywords(cleaned_text)
        print(f"   Found {len(keywords)} keywords")
        if keywords:
            print(f"   Top keywords: {', '.join(keywords[:5])}")
        
        metadata['keywords'] = keywords
        metadata['extractedText'] = full_text
        metadata['cleanedText'] = cleaned_text
        
        return metadata
    
    def save_to_database(self, pdf_path, metadata):
        """Save processed data to MongoDB"""
        filename = os.path.basename(pdf_path)
        
        # Copy PDF to uploads folder with standardized name
        uploads_dir = 'uploads'
        Path(uploads_dir).mkdir(exist_ok=True)
        
        new_filename = f"{metadata['subject'].replace(' ', '_')}_{metadata['examType']}_{metadata['year']}_Sem{metadata['semester']}.pdf"
        new_filepath = os.path.join(uploads_dir, new_filename)
        
        # Copy file
        import shutil
        shutil.copy2(pdf_path, new_filepath)
        
        # Create database document
        paper_doc = {
            'subject': metadata['subject'],
            'year': metadata['year'],
            'semester': metadata['semester'],
            'examType': metadata['examType'],
            'examDate': metadata['examDate'],
            'filePath': f'uploads/{new_filename}',
            'extractedText': metadata['extractedText'],
            'cleanedText': metadata['cleanedText'],
            'keywords': metadata['keywords'],
            'sections': metadata['sections'],
            'uploadedAt': datetime.now()
        }
        
        # Insert into database
        result = self.papers_collection.insert_one(paper_doc)
        print(f"✅ Saved to database with ID: {result.inserted_id}")
        
        return result.inserted_id
    
    def process_all_pdfs(self, directory='quepaper'):
        """Process all PDFs in the directory"""
        print(f"\n{'='*60}")
        print(f"🚀 Starting OCR Processing")
        print(f"{'='*60}\n")
        
        # Clear existing papers
        print("🗑️  Clearing existing papers from database...")
        deleted = self.papers_collection.delete_many({})
        print(f"   Deleted {deleted.deleted_count} papers\n")
        
        # Get all PDF files
        pdf_files = list(Path(directory).glob('*.pdf'))
        print(f"📂 Found {len(pdf_files)} PDF files in '{directory}'/\n")
        
        if not pdf_files:
            print(f"❌ No PDF files found in '{directory}/'")
            return
        
        # Process each PDF
        processed_count = 0
        for pdf_path in pdf_files:
            try:
                metadata = self.process_pdf(str(pdf_path))
                if metadata:
                    self.save_to_database(str(pdf_path), metadata)
                    processed_count += 1
            except Exception as e:
                print(f"❌ Error processing {pdf_path.name}: {e}")
                import traceback
                traceback.print_exc()
        
        print(f"\n{'='*60}")
        print(f"✅ Processing Complete!")
        print(f"{'='*60}")
        print(f"📊 Processed: {processed_count}/{len(pdf_files)} PDFs")
        print(f"📚 Total papers in database: {self.papers_collection.count_documents({})}")
        
    def close(self):
        """Close MongoDB connection"""
        self.client.close()

def main():
    processor = OCRProcessor()
    
    try:
        if len(sys.argv) > 1 and sys.argv[1] == '--test':
            # Test mode - process single PDF
            if len(sys.argv) > 2:
                pdf_path = sys.argv[2]
                metadata = processor.process_pdf(pdf_path)
                if metadata:
                    print(f"\n📋 Extracted Metadata:")
                    print(json.dumps(metadata, indent=2, default=str))
            else:
                print("Usage: python ocr_processor.py --test <pdf_path>")
        else:
            # Process all PDFs
            processor.process_all_pdfs()
    
    finally:
        processor.close()

if __name__ == '__main__':
    main()
