
import { v4 as uuidv4 } from "uuid";

export function parseReceipt(ocrText: string) {
  // Helper to clean text
  const cleanText = (text: string) => text.replace(/\s+/g, ' ').trim();

  // Extract items with prices
  const extractItemsWithPrices = (text: string) => {
    const items = [];
    const lines = text.split('\n');

    for (const line of lines) {
      const cleanLine = line.trim();

      // Skip headers, totals, and metadata
      if (!cleanLine ||
        cleanLine.length < 3 ||
        /^[\-=_\*\.]+$/.test(cleanLine) ||
        /receipt|store|thank|total|subtotal|tax|cash|card|visa|payment/i.test(cleanLine)) {
        continue;
      }

      // Pattern matching for items with prices
      let matched = false;

      // Pattern 1: "Item Name $9.99" or "Item Name 9.99"
      let match = cleanLine.match(/^(.+?)\s+\$?([\d,]+\.?\d{0,2})$/);
      if (match && !matched) {
        const name = cleanText(match[1]);
        const price = parseFloat(match[2].replace(/,/g, ''));

        if (name.length > 2 && !isNaN(price) && price > 0 && price < 1000) {
          items.push({
            name: name,
            quantity: 1,
            price: price.toString() ?? "",
            totalPrice: price.toString() ?? "",
          });
          matched = true;
        }
      }

      // Pattern 2: "2x Item Name $9.99" or "Item Name x2 $9.99"
      if (!matched) {
        match = cleanLine.match(/(\d+)\s*[xX]\s+(.+?)\s+\$?([\d,]+\.?\d{0,2})$/);
        if (match) {
          const quantity = parseInt(match[1]) || 1;
          const name = cleanText(match[2]);
          const price = parseFloat(match[3].replace(/,/g, ''));

          if (name.length > 2 && !isNaN(price) && price > 0) {
            items.push({
              name: name,
              quantity: quantity,
              price: (price / quantity).toString(),
              totalPrice: price.toString()
            });
            matched = true;
          }
        }
      }

      // Pattern 3: "Item Name @ $4.99 x 3"
      if (!matched) {
        match = cleanLine.match(/^(.+?)\s+@\s*\$?([\d,]+\.?\d{0,2})\s*[xX]?\s*(\d+)?/i);
        if (match) {
          const name = cleanText(match[1]);
          const unitPrice = parseFloat(match[2].replace(/,/g, ''));
          const quantity = parseInt(match[3]) || 1;

          if (name.length > 2 && !isNaN(unitPrice) && unitPrice > 0) {
            items.push({
              name: name,
              quantity: quantity,
              price: unitPrice.toString(),
              totalPrice: (unitPrice * quantity).toString()
            });
            matched = true;
          }
        }
      }
    }

    return items;
  };

  // Extract total
  const extractTotal = (text: string) => {
    const patterns = [
      /(?:total|amount due|balance)[\s:]*\$?([\d,]+\.?\d*)/i,
      /\$?([\d,]+\.?\d*)\s*(?:total)/i
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        const amount = parseFloat(match[1].replace(/,/g, ''));
        if (!isNaN(amount) && amount > 0) {
          return amount;
        }
      }
    }
    return 0;
  };

  const lines = ocrText
    .split("\n")
    .map(line => line.trim())
    .filter(Boolean);


  const dateRegex = /\b(\d{2,4}[-/.]\d{2}[-/.]\d{2,4})\b/;

  const purchaseDate =
    lines.find(line => dateRegex.test(line))?.match(dateRegex)?.[1] ?? "";
  const storeName = ocrText[0] || "Unknown Store";
  const items = extractItemsWithPrices(ocrText);
  const total = extractTotal(ocrText);

  return {
    id: uuidv4(),
    storeName,
    purchaseDate,
    items: items,
    totalAmount: total,
  };
}