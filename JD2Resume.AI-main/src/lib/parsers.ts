import mammoth from 'mammoth';
import * as pdfjsLib from 'pdfjs-dist';
import { createWorker } from 'tesseract.js';

// The pdf.js worker was failing to load from a CDN. We now import it directly
// from the installed package. Vite's `?url` suffix provides a stable URL to the worker file.
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

/**
 * Convert PDF page to canvas for OCR processing
 */
const pdfPageToCanvas = async (page: any): Promise<HTMLCanvasElement> => {
  const viewport = page.getViewport({ scale: 2.0 }); // Higher scale for better OCR accuracy
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d')!;

  canvas.width = viewport.width;
  canvas.height = viewport.height;

  await page.render({
    canvasContext: context,
    viewport: viewport
  }).promise;

  return canvas;
};

/**
 * Extract text using OCR from a PDF page
 */
const extractTextFromPDFPageWithOCR = async (page: any): Promise<string> => {
  try {
    // Skip OCR entirely on mobile devices to prevent crashes
    if (isMobileDevice()) {
      console.warn('OCR skipped on mobile device to prevent crashes');
      return '';
    }

    const canvas = await pdfPageToCanvas(page);
    const worker = await createWorker('eng'); // English language model

    const { data: { text } } = await worker.recognize(canvas);
    await worker.terminate();

    return text.trim();
  } catch (error) {
    console.error('OCR failed for page:', error);
    return '';
  }
};

/**
 * Check if extracted text is meaningful (not just empty or minimal content)
 */
const isMeaningfulText = (text: string): boolean => {
  const cleanText = text.trim();
  return cleanText.length >= 50 && /\w/.test(cleanText); // At least 50 characters and some letters
};

/**
 * Check if device is mobile/low-powered (skip heavy OCR on these devices)
 */
const isMobileDevice = (): boolean => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

/**
 * Extract text from PDF using both text extraction and OCR as fallback (mobile-friendly)
 */
const extractTextFromPDF = async (arrayBuffer: ArrayBuffer): Promise<string> => {
  const isMobile = isMobileDevice();

  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const numPages = Math.min(pdf.numPages, 10); // Limit to first 10 pages to avoid excessive processing
  const textPromises = [];
  let hasTextContent = false;

  // First pass: try to extract text from all pages
  for (let i = 1; i <= numPages; i++) {
    try {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();

      const pageText = textContent.items
        .map(item => ('str' in item ? item.str : ''))
        .join(' ')
        .trim();

      if (pageText.length > 0) {
        hasTextContent = true;
        textPromises.push(Promise.resolve(pageText));
      }
    } catch (error) {
      console.warn(`Failed to process page ${i}:`, error);
      continue; // Skip failed pages instead of crashing
    }
  }

  // Wait for all text extraction promises
  const textResults = await Promise.all(textPromises);
  const allExtractedText = textResults.join('\n');

  // If we have meaningful text content, return it
  if (isMeaningfulText(allExtractedText)) {
    return allExtractedText;
  }

  // Skip OCR on mobile devices to prevent crashes
  if (isMobile) {
    console.log('Mobile device detected, skipping OCR to prevent crashes');
    return allExtractedText || 'Unable to extract text from this PDF. Please try uploading a DOCX or TXT file instead, or ensure your PDF contains selectable text.';
  }

  // Desktop: try OCR as fallback (with error handling)
  console.log('No meaningful text found, attempting OCR...');
  try {
    const ocrPromises = [];
    for (let i = 1; i <= numPages; i++) {
      if (ocrPromises.length >= 3) break; // Limit OCR to first 3 pages to prevent memory issues

      try {
        const page = await pdf.getPage(i);
        ocrPromises.push(extractTextFromPDFPageWithOCR(page));
      } catch (error) {
        console.warn(`Failed to prepare page ${i} for OCR:`, error);
      }
    }

    const ocrResults = await Promise.all(ocrPromises);
    const ocrText = ocrResults.join('\n').trim();

    if (isMeaningfulText(ocrText)) {
      console.log('OCR extraction successful');
      return ocrText;
    }
  } catch (ocrError) {
    console.error('OCR processing failed:', ocrError);
  }

  return allExtractedText || 'No text could be extracted from this PDF. Please ensure it contains readable text or try a different format.';
};

export const extractTextFromFile = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    // Validate file before reading
    if (file.size === 0) {
      reject(new Error('File appears to be empty. Please select a valid file.'));
      return;
    }

    if (file.size > 50 * 1024 * 1024) { // 50MB limit
      reject(new Error('File is too large. Please select a file smaller than 50MB.'));
      return;
    }

    const reader = new FileReader();

    reader.onload = async (event) => {
      try {
        const arrayBuffer = event.target?.result as ArrayBuffer;
        if (!arrayBuffer) {
          throw new Error('Could not read file content.');
        }

        if (file.type === 'application/pdf') {
          try {
            const extractedText = await extractTextFromPDF(arrayBuffer);
            resolve(extractedText);
          } catch (pdfError: any) {
            console.error('PDF parsing error:', pdfError);
            let errorMessage = 'Failed to parse PDF file.';

            if (pdfError.name === 'InvalidPDFException') {
              errorMessage += ' The file appears to be corrupted or not a valid PDF.';
            } else if (pdfError.name === 'PasswordException') {
              errorMessage += ' The PDF is password-protected. Please remove the password and try again.';
            } else if (pdfError.name === 'MissingPDFException') {
              errorMessage += ' The PDF file seems incomplete or damaged.';
            } else if (pdfError.message && pdfError.message.includes('corrupt')) {
              errorMessage += ' The PDF file may be corrupted.';
            } else {
              errorMessage += ' Please ensure it\'s a valid PDF file and try uploading again.';
            }

            reject(new Error(errorMessage));
          }
        } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
          try {
            const result = await mammoth.extractRawText({ arrayBuffer });
            const trimmedText = result.value.trim();
            if (trimmedText.length === 0) {
              reject(new Error('The DOCX file appears to have no extractable text content.'));
              return;
            }
            resolve(trimmedText);
          } catch (docxError) {
            console.error('DOCX parsing error:', docxError);
            reject(new Error('Failed to parse DOCX file. Please ensure it\'s a valid Word document.'));
          }
        } else {
          try {
            const decoder = new TextDecoder();
            const decoded = decoder.decode(arrayBuffer);
            const trimmedText = decoded.trim();
            if (trimmedText.length === 0) {
              reject(new Error('The text file appears to be empty or has no readable content.'));
              return;
            }
            resolve(trimmedText);
          } catch (textError) {
            console.error('Text file parsing error:', textError);
            reject(new Error('Failed to parse text file. Please ensure it\'s a valid text file.'));
          }
        }
      } catch (error) {
        console.error('General parsing error:', error);
        reject(new Error('Failed to process file. This may be due to file corruption or an unsupported format.'));
      }
    };

    reader.onerror = (error) => {
      console.error('FileReader error:', error);
      reject(new Error('Error reading file. Please try again or select a different file.'));
    };

    reader.readAsArrayBuffer(file);
  });
};
