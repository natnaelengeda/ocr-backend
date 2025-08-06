import { finished } from 'stream/promises';
import path from 'path';
import fs from 'fs';

// graphql upload
import GraphQLUpload from "graphql-upload/GraphQLUpload.mjs";

// utils
import { prisma } from "../../utils/prisma";
import { parseReceipt } from '../../utils/parseReciept';

// Text Extraction
import { tesseractExtractFunction } from '../../utils/tesseractFunc';
// import { extractWithGoogleOCR } from '../../utils/extractGoogleOCR';

const uploadsDir = './uploads';
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

interface Upload {
  createReadStream: () => NodeJS.ReadableStream;
  filename: string;
  mimetype: string;
  encoding: string;
}

export const receiptResolvers = {
  Upload: GraphQLUpload,

  Query: {
    receipts: async () => {
      return await prisma.receipt.findMany({
        include: {
          items: true,
        },
      });
    },

    receipt: async (_: any, args: { id: string }) => {
      return await prisma.receipt.findUnique({
        where: {
          id: args.id,
        },
        include: {
          items: true,
        },
      });
    },
    getImageBase64: async (_: any, args: { filename: string }) => {
      try {
        console.log("Here")
        const filePath = path.join(process.env.FILE_LOCATION ?? "", args.filename);

        const file = fs.readFileSync(filePath);
        return `data:image/webp;base64,${file.toString("base64")}`;
      } catch (error) {
        console.error(error);
      }
    },
  },

  Mutation: {
    createReceipt: async (_: any, args: any) => {
      const { storeName, purchaseDate, totalAmount, items, imageUrl } = args;

      return await prisma.receipt.create({
        data: {
          storeName,
          purchaseDate: purchaseDate ? new Date(purchaseDate) : new Date(),
          totalAmount,
          imageUrl,
          items: {
            create: items,
          },
        },
        include: {
          items: true,
        },
      });
    },

    deleteAllReceipts: async (_: any) => {
      await prisma.item.deleteMany();
      await prisma.receipt.deleteMany();
      return "receiepts deleted";
    },

    deleteReceipt: async (_: any, args: { id: string }) => {
      await prisma.item.deleteMany({ where: { receiptId: args.id } });
      await prisma.receipt.delete({ where: { id: args.id } });
      return "receipt deleted";
    },

    uploadReceipt: async (_: any, args: { image: any }) => {
      try {
        const file = await args.image;
        const { createReadStream, filename } = file;

        const timestamp = Date.now();
        const extension = path.extname(filename);
        const uniqueFilename = `${timestamp}-${path.basename(filename, extension)}${extension}`;

        const stream = createReadStream();
        const filePath = `./uploads/${uniqueFilename}`;
        const out = fs.createWriteStream(filePath);

        stream.pipe(out);
        await finished(out);

        const rawText = await tesseractExtractFunction(filePath);

        // google-cloud vision not giving accurate test as tesseract.js
        // const rawText = await extractWithGoogleOCR(filePath);

        const recieptData = parseReceipt(rawText);

        // console.log(rawText);
        console.log(recieptData);

        await prisma.receipt.create({
          data: {
            storeName: recieptData.storeName,
            purchaseDate: recieptData.purchaseDate ? new Date(recieptData.purchaseDate) : new Date(),
            totalAmount: recieptData.totalAmount,
            imageUrl: filePath,
            items: {
              create: recieptData.items,
            }
          },
          include: {
            items: true,
          },
        })


        return {
          status: "success",
          message: "File uploaded successfully",
          imageUrl: `/uploads/${uniqueFilename}`
        };

      } catch (error: any) {
        console.error('Upload error:', error);
        return {
          status: "error",
          message: `Upload failed: ${error.message}`
        };
      }
    }
  },


};
