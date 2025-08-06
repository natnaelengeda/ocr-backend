import vision from '@google-cloud/vision';

const client = new vision.ImageAnnotatorClient({
  keyFilename: process.env.GOOGLE_VISION_API
});

export async function extractWithGoogleOCR(image: string) {
  const [result] = await client.textDetection(image);
  const detections = result.textAnnotations;

  const fullText = detections?.[0]?.description || '';
  return fullText;
}