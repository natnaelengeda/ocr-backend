import express, { Request, Response, Router } from 'express';
import path from 'path';


import Tesseract from 'tesseract.js';
import vision from '@google-cloud/vision';


const router: Router = express.Router();

const jsonPath = path.join(__dirname, "../../account-json.json");

// images
const imagePath = path.join(__dirname, "../../upload/test/1.jpg");
const imagePath2 = path.join(__dirname, "../../upload/test/2.webp");

const client = new vision.ImageAnnotatorClient({
  keyFilename: process.env.GOOGLE_VISION_API
});

router.get('/test-tessaract', async (req: Request, res: Response) => {

  try {
    const rawText = await extractTextFromImage(imagePath2);
    const parsedData = parseReceiptText(rawText);
    const formattedText = rawText.replace(/\\n/g, '\n');
    res.type('text/plain').send(rawText);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      msg: "Internal Server Error",
      error
    })
  }
});

export async function extractTextFromImage(image: any) {

  const result = await Tesseract.recognize(image, 'eng', {
    // logger: (m) => console.log(m), // Optional progress logging
  });

  return result.data.text;
}

function parseReceiptText(rawText: string) {
  const lines = rawText.split('\n').map(line => line.trim()).filter(Boolean);

  const storeName = lines[0]; // naive assumption: first line is store name
  let purchaseDate = '';
  let totalAmount = 0;
  const items: { name: string, quantity?: number, price?: number }[] = [];

  for (const line of lines) {
    // Date
    const dateMatch = line.match(/(date|Date)[:\s]*([\d\-\/]+)/);
    if (dateMatch) {
      purchaseDate = new Date(dateMatch[2]).toISOString();
    }

    // Total
    const totalMatch = line.match(/(total|Total)[:\s]*([\d\.]+)/);
    if (totalMatch) {
      totalAmount = parseFloat(totalMatch[2]);
    }

    // Items (very basic assumption: name + price)
    const itemMatch = line.match(/^([A-Za-z\s]+)\s+([\d\.]+)$/);
    if (itemMatch) {
      items.push({
        name: itemMatch[1].trim(),
        price: parseFloat(itemMatch[2]),
      });
    }
  }

  return {
    storeName,
    purchaseDate,
    totalAmount,
    items,
  };
}

async function extractWithGoogleOCR(image: string) {
  const [result] = await client.textDetection(image);
  const detections = result.textAnnotations;

  const fullText = detections?.[0]?.description || '';
  return fullText;
}

router.get('/test-google-vision', async (req: Request, res: Response) => {
  try {

    const text = await extractWithGoogleOCR(imagePath);
    const data = parseReceiptText(text);

    res.status(200).json({
      text,
      data
    })
  } catch (error) {
    console.error(error);
    res.status(500).json({
      msg: "Internal Server Error",
      error
    })
  }
})

module.exports = router;