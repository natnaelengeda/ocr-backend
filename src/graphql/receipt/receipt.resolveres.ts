import { v4 as uuidv4 } from 'uuid';
import { createWriteStream } from 'fs';
import { mkdir } from 'fs/promises';
import { finished } from 'stream/promises';
import path from 'path';
import GraphQLUpload from "graphql-upload/GraphQLUpload.mjs";
import { prisma } from "../../utils/prisma";


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

    deleteReceipt: async (_: any, args: { id: string }) => {
      await prisma.item.deleteMany({ where: { receiptId: args.id } });
      await prisma.receipt.delete({ where: { id: args.id } });
      return "Receipt deleted";
    },

    createReceiptWithUpload: async (_: any, args: any) => {
      try {
        console.log('🔍 Starting upload process...');
        console.log('📝 Args received:', args);

        // Check if image exists
        if (!args.image) {
          console.error('❌ No image provided in args');
          throw new Error('No image file provided');
        }

        const { image } = args;
        console.log('📷 Image object:', typeof image);

        // Await the image promise and destructure
        let createReadStream, filename, mimetype;
        try {
          const imageData = await image;
          console.log('📊 Image data:', imageData);

          createReadStream = imageData.createReadStream;
          filename = imageData.filename;
          mimetype = imageData.mimetype;

          console.log('📝 File details:', { filename, mimetype });
        } catch (error: any) {
          console.error('❌ Error awaiting image:', error);
          throw new Error(`Failed to process image: ${error.message}`);
        }

        // Validate mimetype
        if (!mimetype || !mimetype.startsWith('image/')) {
          console.error('❌ Invalid mimetype:', mimetype);
          throw new Error(`File must be an image. Received: ${mimetype}`);
        }

        // Generate unique filename
        const uniqueFilename = `${uuidv4()}-${filename}`;
        const uploadDir = path.join(__dirname, "../../../upload/reciepts");
        const filePath = path.join(uploadDir, uniqueFilename);

        console.log('📁 Upload paths:', { uploadDir, filePath });

        // Create directory
        try {
          await mkdir(uploadDir, { recursive: true });
          console.log('✅ Directory created/verified');
        } catch (error: any) {
          console.error('❌ Error creating directory:', error);
          throw new Error(`Failed to create upload directory: ${error.message}`);
        }

        // Handle file stream
        try {
          console.log('💾 Starting file write...');

          const stream = createReadStream();
          const out = createWriteStream(filePath);

          // Add error handlers to streams
          stream.on('error', (error: any) => {
            console.error('❌ Read stream error:', error);
          });

          out.on('error', (error) => {
            console.error('❌ Write stream error:', error);
          });

          stream.pipe(out);
          await finished(out);

          console.log('✅ File saved successfully:', filePath);
        } catch (error: any) {
          console.error('❌ Error saving file:', error);
          throw new Error(`Failed to save file: ${error!.message}`);
        }

        // Create receipt data
        const imageUrl = `/uploads/receipts/${uniqueFilename}`;
        const storeName = "Placeholder Store";
        const totalAmount = 0.0;
        const items = [{ name: "Placeholder Item", quantity: 1 }];

        console.log('💾 Creating receipt in database...');

        // Create receipt in database
        try {
          const receipt = await prisma.receipt.create({
            data: {
              storeName,
              purchaseDate: new Date(),
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

          console.log('✅ Receipt created successfully:', receipt.id);
          return receipt;

        } catch (error: any) {
          console.error('❌ Database error:', error);
          throw new Error(`Failed to create receipt in database: ${error.message}`);
        }

      } catch (error: any) {
        console.error('❌ Overall error in createReceiptWithUpload:', error);

        // Re-throw with more context
        if (error.message) {
          throw new Error(`Upload failed: ${error.message}`);
        } else {
          throw new Error(`Upload failed: ${JSON.stringify(error)}`);
        }
      }
    }

  },
};
