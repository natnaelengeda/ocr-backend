
import { v4 as uuidv4 } from "uuid";

export function parseReceipt(ocrText: string) {

  const cleanText = (text: string) => text.replace(/\s+/g, ' ').trim();

  const extractItemsWithPrices = (text: string) => {
    const items = [];
    const lines = text.split('\n');

    for (const line of lines) {
      const cleanLine = line.trim();

      if (!cleanLine ||
        cleanLine.length < 3 ||
        /^[\-=_\*\.]+$/.test(cleanLine) ||
        /receipt|store|thank|total|subtotal|tax|cash|card|visa|payment/i.test(cleanLine)) {
        continue;
      }

      let matched = false;


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

  // Add most known restaurants/burger places, same can be done for items
  const famousStoreNames = ['chanoly amoothie & noodle', 'pizza hut', 'mulu shewa', 'times coffee', 'tomoca coffee', 'bakema cake cookies&bread produ'];

  const ocrLines = ocrText
    .split('\n')
    .map(line => line.toLowerCase().replace(/\s+/g, ' ').trim())
    .filter(Boolean);

  const matchedStore = famousStoreNames.find(store =>
    ocrLines.some(line => line.includes(store))
  );

  const storeName = matchedStore ||
    ocrLines[1] || // Most Reciepts in Ethiopia have TIN Number on the fisrt line then Store name on the second one.
    "Unknown Store";

  const dateRegex = /\b(\d{2,4}[-/.]\d{2}[-/.]\d{2,4})\b/;
  const purchaseDate =
    lines.find(line => dateRegex.test(line))?.match(dateRegex)?.[1] ?? "";
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