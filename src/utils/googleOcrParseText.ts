interface ReceiptItem {
  name: string;
  quantity: number;
  price: string;
  totalPrice: string;
}

interface ParsedReceipt {
  storeName: string;
  purchaseDate: string | null;
  totalAmount: number;
  items: ReceiptItem[];
  rawLines?: string[];
  error?: string;
}

interface FuzzyMatchResult {
  isMatch: boolean;
  confidence: number;
}

interface ParseOptions {
  includeRaw?: boolean;
  strictMode?: boolean;
  customStoreNames?: string[];
}

class GoogleOCRTextParse {
  private currencySymbol: string;
  private totalKeywords: string[];
  private datePatterns: RegExp[];
  private famousStoreNames: string[];

  constructor() {
    this.currencySymbol = '*';
    this.totalKeywords = ['TOTAL', 'ጠቅላላ', 'sum', 'CASH'];
    this.datePatterns = [
      /(\d{2}\/\d{2}\/\d{4})/,
      /(\d{1,2}\/\d{1,2}\/\d{4})/,
    ];

    // Famous Ethiopian store/Restaurants names for better recognition
    this.famousStoreNames = [
      'chanoly smoothie & noodle',
      'pizza hut',
      'mulu shewa',
      'times coffee',
      'tomoca coffee',
      'bakema cake cookies&bread produ',
      'kfc',
      'burger king',
      'dominos pizza',
      'sheraton addis',
      'hilton addis ababa',
      'dashen bank',
      'commercial bank of ethiopia',
      'awash bank',
      'habesha beer',
      'st. george beer',
      'addis red cross',
      'lion international bank'
    ];
  }

  public cleanText(text: string): string {

    text = text.replace(/\s+/g, ' ').trim();

    text = text.replace(/\*/g, '*');
    text = text.replace(/｜/g, '1');
    text = text.replace(/[^\x00-\x7F]/g, '');
    return text;
  }

  private extractStoreName(lines: string[]): string {

    const famousStore = this.findFamousStoreName(lines);
    if (famousStore) {
      return famousStore;
    }


    const potentialNames: string[] = [];


    for (let i = 0; i < Math.min(lines.length, 8); i++) {
      const line = lines[i].trim();


      if (/TIN:|TEL|MOB:|A\.A S\.C|FS NO|AROUND/i.test(line)) {
        continue;
      }


      if (line.length < 3 || /^\d+$/.test(line)) {
        continue;
      }


      if (/PRODU|BREAD|CAKE|COOKIES/i.test(line)) {
        if (line.split(' ').length > 3) {
          potentialNames.push(line);
        }
        continue;
      }

      potentialNames.push(line);
    }


    return potentialNames.length > 0 ? potentialNames[1] : 'Unknown Store';
  }

  private findFamousStoreName(lines: string[]): string | null {
    const allText = lines.join(' ').toLowerCase();


    for (const storeName of this.famousStoreNames) {
      if (allText.includes(storeName.toLowerCase())) {
        return this.capitalizeStoreName(storeName);
      }
    }


    for (const storeName of this.famousStoreNames) {
      const matchResult = this.fuzzyMatchStoreName(allText, storeName);
      if (matchResult.isMatch) {
        return this.capitalizeStoreName(storeName);
      }
    }


    for (const line of lines.slice(0, 8)) {
      const cleanLine = line.trim().toLowerCase();

      for (const storeName of this.famousStoreNames) {

        const similarity = this.calculateSimilarity(cleanLine, storeName.toLowerCase());
        if (similarity > 0.7) {
          return this.capitalizeStoreName(storeName);
        }


        const storeWords = storeName.toLowerCase().split(' ');
        const lineWords = cleanLine.split(' ');
        let matchedWords = 0;

        for (const storeWord of storeWords) {
          if (lineWords.some(lineWord =>
            lineWord.includes(storeWord) || storeWord.includes(lineWord)
          )) {
            matchedWords++;
          }
        }


        if (matchedWords >= Math.ceil(storeWords.length * 0.6)) {
          return this.capitalizeStoreName(storeName);
        }
      }
    }

    return null;
  }

  private fuzzyMatchStoreName(text: string, storeName: string): FuzzyMatchResult {
    const storeNameLower = storeName.toLowerCase();
    const threshold = 0.8;


    let modifiedStoreName = storeNameLower
      .replace(/o/g, '0')
      .replace(/l/g, '1')
      .replace(/s/g, '5')
      .replace(/&/g, 'and');

    if (text.includes(modifiedStoreName)) {
      return { isMatch: true, confidence: 0.9 };
    }


    const similarity = this.calculateSimilarity(text, storeNameLower);
    return {
      isMatch: similarity > threshold,
      confidence: similarity
    };
  }

  private calculateSimilarity(str1: string, str2: string): number {

    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;

    if (longer.length === 0) return 1.0;

    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix: number[][] = Array(str2.length + 1).fill(null).map(() =>
      Array(str1.length + 1).fill(null)
    );

    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j - 1][i] + 1,
          matrix[j][i - 1] + 1,
          matrix[j - 1][i - 1] + cost
        );
      }
    }

    return matrix[str2.length][str1.length];
  }

  private capitalizeStoreName(storeName: string): string {
    return storeName
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  private extractDate(lines: string[]): string | null {
    for (const line of lines) {
      for (const pattern of this.datePatterns) {
        const match = line.match(pattern);
        if (match) {

          const dateParts = match[1].split('/');
          if (dateParts.length === 3) {
            return `${dateParts[2]}-${dateParts[1].padStart(2, '0')}-${dateParts[0].padStart(2, '0')}`;
          }
        }
      }
    }
    return null;
  }

  private extractTotal(lines: string[]): number {
    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i].trim();

      if (this.totalKeywords.some(keyword => line.toUpperCase().includes(keyword))) {

        const priceMatch = line.match(/\*?(\d+\.?\d*)/);
        if (priceMatch) {
          return parseFloat(priceMatch[1]);
        }


        if (i + 1 < lines.length) {
          const nextLine = lines[i + 1];
          const nextPriceMatch = nextLine.match(/\*?(\d+\.?\d*)/);
          if (nextPriceMatch) {
            return parseFloat(nextPriceMatch[1]);
          }
        }
      }
    }
    return 0;
  }

  private extractItems(lines: string[]): ReceiptItem[] {
    const items: ReceiptItem[] = [];
    let inItemSection = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      if (/TIN:|TEL|MOB:|A\.A S\.C|FS NO|AROUND/i.test(line)) {
        continue;
      }


      if (this.totalKeywords.some(keyword => line.toUpperCase().includes(keyword))) {
        break;
      }

      const itemMatch = this.parseItemLine(line);
      if (itemMatch) {
        items.push(itemMatch);
        inItemSection = true;
      } else if (inItemSection && /^\s*$/.test(line)) {
        continue;
      }
    }

    return items;
  }

  private parseItemLine(line: string): ReceiptItem | null {

    const cleanLine = this.cleanText(line);

    let match = cleanLine.match(/^(.+?)\s+\*(\d+\.?\d*)/);
    if (match) {
      const itemName = match[1].trim();
      const price = parseFloat(match[2]);

      const quantityMatch = itemName.match(/(.+?)\/(\w+)\s*\(([^)]+)\)/);
      if (quantityMatch) {
        return {
          name: quantityMatch[1].trim(),
          quantity: 1,
          price: price.toString(),
          totalPrice: price.toString(),
        };
      }

      return {
        name: itemName,
        quantity: 1,
        price: price.toString(),
        totalPrice: price.toString()
      };
    }

    return null;
  }

  public parseReceipt(ocrText: string): ParsedReceipt {
    try {
      const lines = ocrText.split('\n').map(line => line.trim()).filter(line => line.length > 0);

      const result: ParsedReceipt = {
        storeName: this.extractStoreName(lines),
        purchaseDate: this.extractDate(lines),
        totalAmount: this.extractTotal(lines),
        items: this.extractItems(lines)
      };

      return result;
    } catch (error) {
      console.error('Error parsing receipt:', error);
      return {
        storeName: 'Unknown',
        purchaseDate: null,
        totalAmount: 0,
        items: [],
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }


  public parseReceiptEnhanced(ocrText: string, options: ParseOptions = {}): ParsedReceipt {
    const lines = ocrText.split('\n').map(line => line.trim()).filter(line => line.length > 0);


    if (options.customStoreNames && options.customStoreNames.length > 0) {
      this.famousStoreNames = [...this.famousStoreNames, ...options.customStoreNames];
    }

    const items: ReceiptItem[] = [];

    // Add Items That aren't Items but usually appear on the Receipt like tax and stuff
    const skipPatterns = /TIN:|TEL|MOB:|A\.A S\.C|FS NO|AROUND|CASH|ITEM#|FRCA|HOTXBL|NOTXBL|TXBL|TAX 1/i;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (skipPatterns.test(line) || this.totalKeywords.some(kw => line.toUpperCase().includes(kw))) {
        continue;
      }

      if (i + 1 < lines.length) {
        const nextLine = lines[i + 1];

        if (!/\*\d/.test(line) && /^\*\d+\.?\d*/.test(nextLine)) {
          const priceMatch = nextLine.match(/\*(\d+\.?\d*)/);
          if (priceMatch) {
            items.push({
              name: line,
              quantity: 1,
              price: priceMatch[1],
              totalPrice: priceMatch[1]
            });
            i++;
            continue;
          }
        }
      }


      const singleLineItem = this.parseItemLine(line);
      if (singleLineItem) {
        items.push(singleLineItem);
      }
    }

    const result: ParsedReceipt = {
      storeName: this.extractStoreName(lines),
      purchaseDate: this.extractDate(lines),
      totalAmount: this.extractTotal(lines),
      items: items
    };

    if (options.includeRaw) {
      result.rawLines = lines;
    }

    return result;
  }


  public addStoreNames(storeNames: string[]): void {
    this.famousStoreNames.push(...storeNames.map(name => name.toLowerCase()));
  }


  public getStoreNames(): string[] {
    return [...this.famousStoreNames];
  }


  public validateResult(result: ParsedReceipt): { isValid: boolean; issues: string[] } {
    const issues: string[] = [];


    const calculatedTotal = result.items.reduce((sum, item) => sum + parseInt(item.totalPrice), 0);
    if (Math.abs(calculatedTotal - result.totalAmount) > 0.01) {
      issues.push('Total amount does not match sum of items');
    }


    if (!result.storeName || result.storeName === 'Unknown Store') {
      issues.push('Store name not identified');
    }

    if (!result.purchaseDate) {
      issues.push('Purchase date not found');
    }

    if (result.items.length === 0) {
      issues.push('No items found');
    }

    return {
      isValid: issues.length === 0,
      issues
    };
  }
}

const parser = new GoogleOCRTextParse();

// Test with your OCR text
const ocrText = `TIN: 0054095015
KESATIEBIRHAN ARAVA
MOLLA
BAKEMA CAKE COOKIES&BREAD PRODU
BREAD PRODUCS
A.A S.C YEKA W-08 HNO-002
AROUND SUMEYE MESGID
TEL 09114034740929014247
E.MOB:0986302712
FS No. 00086413
07/08/2025
09:21
GryciLin Bread/m2 (N)
*45.00
HOTXBL
*45.00
TOTAL
*45.00
CASH
*45.00
ITEM#
1
FRCA`;

// const result: ParsedReceipt = parser.parseReceiptEnhanced(ocrText, { includeRaw: true });
// console.log(JSON.stringify(result, null, 2));

// const validation = parser.validateResult(result);
// if (!validation.isValid) {
//   console.warn('Validation issues:', validation.issues);
// }

export default GoogleOCRTextParse;
export { ReceiptItem, ParsedReceipt, ParseOptions, FuzzyMatchResult };