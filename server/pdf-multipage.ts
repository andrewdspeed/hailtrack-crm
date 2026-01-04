import { fromPath } from 'pdf2pic';
import { writeFileSync, unlinkSync, mkdtempSync, readdirSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { readFileSync } from 'fs';

export interface PdfPageImage {
  pageNumber: number;
  imageBase64: string;
}

export async function convertPdfAllPages(pdfBase64: string): Promise<PdfPageImage[]> {
  const tempDir = mkdtempSync(join(tmpdir(), 'pdf-multipage-'));
  const pdfPath = join(tempDir, 'input.pdf');
  
  try {
    // Remove base64 prefix if present
    const base64Data = pdfBase64.replace(/^data:application\/pdf;base64,/, '');
    const pdfBuffer = Buffer.from(base64Data, 'base64');
    
    // Write PDF to temp file
    writeFileSync(pdfPath, pdfBuffer);
    
    // Convert all pages to images
    const converter = fromPath(pdfPath, {
      density: 300,
      saveFilename: 'page',
      savePath: tempDir,
      format: 'png',
      width: 2000,
      height: 2000
    });
    
    const pages: PdfPageImage[] = [];
    let pageNumber = 1;
    let hasMorePages = true;
    
    while (hasMorePages) {
      try {
        const result = await converter(pageNumber, { responseType: 'image' });
        
        if (!result.path) {
          hasMorePages = false;
          break;
        }
        
        // Read the generated image
        const imageBuffer = readFileSync(result.path);
        const imageBase64 = `data:image/png;base64,${imageBuffer.toString('base64')}`;
        
        pages.push({
          pageNumber,
          imageBase64
        });
        
        // Clean up this page's image
        unlinkSync(result.path);
        
        pageNumber++;
      } catch (error) {
        // No more pages
        hasMorePages = false;
      }
    }
    
    // Cleanup PDF
    unlinkSync(pdfPath);
    
    return pages;
  } catch (error: any) {
    // Cleanup on error
    try {
      unlinkSync(pdfPath);
    } catch {}
    throw new Error(`Multi-page PDF conversion failed: ${error.message}`);
  }
}

export async function getPdfPageCount(pdfBase64: string): Promise<number> {
  const pages = await convertPdfAllPages(pdfBase64);
  return pages.length;
}
