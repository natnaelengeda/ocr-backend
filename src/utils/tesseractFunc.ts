import Tesseract from 'tesseract.js';


export async function tesseractExtractFunction(image: any) {
  const result = await Tesseract.recognize(image, 'eng', {
    // logger: (m) => console.log(m), // Optional progress logging
  });
  return result.data.text;
}
