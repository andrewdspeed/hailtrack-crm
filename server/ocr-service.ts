import { ENV } from './_core/env';
import { fromPath } from 'pdf2pic';
import { writeFileSync, unlinkSync, mkdtempSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { readFileSync } from 'fs';

interface FieldConfidence {
  value: string | boolean | null;
  confidence: number; // 0-100
}

interface ExtractedLeadData {
  name?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  year?: string;
  make?: string;
  model?: string;
  color?: string;
  vin?: string;
  glassDamage?: boolean;
  insuranceProvider?: string;
  insurancePhone?: string;
  claimNumber?: string;
  policyNumber?: string;
  adjusterName?: string;
  adjusterPhone?: string;
  adjusterEmail?: string;
  notes?: string;
  confidence?: Record<string, number>; // Field name -> confidence score
}

async function convertPdfToImage(pdfBase64: string): Promise<string> {
  // Create temp directory
  const tempDir = mkdtempSync(join(tmpdir(), 'pdf-convert-'));
  const pdfPath = join(tempDir, 'input.pdf');
  
  try {
    // Remove base64 prefix if present
    const base64Data = pdfBase64.replace(/^data:application\/pdf;base64,/, '');
    const pdfBuffer = Buffer.from(base64Data, 'base64');
    
    // Write PDF to temp file
    writeFileSync(pdfPath, pdfBuffer);
    
    // Convert first page to image
    const converter = fromPath(pdfPath, {
      density: 300,
      saveFilename: 'page',
      savePath: tempDir,
      format: 'png',
      width: 2000,
      height: 2000
    });
    
    const result = await converter(1, { responseType: 'image' });
    
    // Read the generated image
    const imagePath = result.path;
    if (!imagePath) {
      throw new Error('Failed to convert PDF to image');
    }
    
    const imageBuffer = readFileSync(imagePath);
    const imageBase64 = `data:image/png;base64,${imageBuffer.toString('base64')}`;
    
    // Cleanup
    unlinkSync(pdfPath);
    unlinkSync(imagePath);
    
    return imageBase64;
  } catch (error: any) {
    // Cleanup on error
    try {
      unlinkSync(pdfPath);
    } catch {}
    throw new Error(`PDF conversion failed: ${error.message}`);
  }
}

export async function extractLeadDataFromImage(imageBase64: string): Promise<ExtractedLeadData> {
  // Check if input is PDF
  if (imageBase64.startsWith('data:application/pdf')) {
    console.log('Converting PDF to image...');
    imageBase64 = await convertPdfToImage(imageBase64);
  }
  // Use Manus built-in Forge API for vision/OCR
  const apiKey = ENV.BUILT_IN_FORGE_API_KEY;
  const apiUrl = ENV.BUILT_IN_FORGE_API_URL;

  if (!apiKey || !apiUrl) {
    throw new Error("Forge API not configured");
  }

  try {
    const response = await fetch(`${apiUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `You are an expert at extracting structured data from paper forms. Analyze this lead sheet image and extract all visible information.

Extract the following fields if present:
- Customer Information: name, phone, email, address, city, state
- Vehicle Information: year, make, model, color, VIN
- Glass Damage: yes/no
- Insurance Information: provider, phone, claim number, policy number
- Adjuster Information: name, phone, email
- Notes: any additional notes or comments

Return ONLY a valid JSON object with the extracted data. Use null for missing fields. For phone numbers, include area code if visible. For boolean glassDamage, use true if "yes" is checked or mentioned, false if "no" is checked, and null if unclear.

IMPORTANT: Also include a "confidence" object with confidence scores (0-100) for each field based on text clarity and certainty.

Example format:
{
  "name": "John Doe",
  "phone": "(555) 123-4567",
  "email": "john@example.com",
  "address": "123 Main St",
  "city": "Dallas",
  "state": "TX",
  "year": "2020",
  "make": "Honda",
  "model": "Civic",
  "color": "Blue",
  "vin": "1HGBH41JXMN109186",
  "glassDamage": true,
  "insuranceProvider": "State Farm",
  "insurancePhone": "(555) 987-6543",
  "claimNumber": "CLM-123456",
  "policyNumber": "POL-789012",
  "adjusterName": "Jane Smith",
  "adjusterPhone": "(555) 111-2222",
  "adjusterEmail": "jane.smith@statefarm.com",
  "notes": "Hail damage on hood and roof",
  "confidence": {
    "name": 95,
    "phone": 90,
    "email": 85,
    "address": 92,
    "city": 98,
    "state": 100,
    "year": 88,
    "make": 95,
    "model": 90,
    "color": 85,
    "vin": 75,
    "glassDamage": 100,
    "insuranceProvider": 95,
    "insurancePhone": 88,
    "claimNumber": 80,
    "policyNumber": 82,
    "adjusterName": 90,
    "adjusterPhone": 85,
    "adjusterEmail": 88,
    "notes": 70
  }
}`
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageBase64
                }
              }
            ]
          }
        ],
        max_tokens: 1000,
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Forge API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No content in API response");
    }

    // Extract JSON from markdown code blocks if present
    let jsonText = content.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.slice(7);
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.slice(3);
    }
    if (jsonText.endsWith('```')) {
      jsonText = jsonText.slice(0, -3);
    }
    jsonText = jsonText.trim();

    const extractedData = JSON.parse(jsonText);
    
    // Clean up null values
    const cleanedData: ExtractedLeadData = {};
    for (const [key, value] of Object.entries(extractedData)) {
      if (value !== null && value !== undefined && value !== '') {
        cleanedData[key as keyof ExtractedLeadData] = value as any;
      }
    }

    return cleanedData;
  } catch (error: any) {
    console.error('OCR extraction error:', error);
    throw new Error(`Failed to extract data: ${error.message}`);
  }
}
