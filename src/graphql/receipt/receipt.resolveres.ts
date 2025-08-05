import { prisma } from "../../utils/prisma";

export const receiptResolvers = {
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
  },
};
