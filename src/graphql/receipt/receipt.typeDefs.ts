import gql from 'graphql-tag';

export const receiptTypeDefs = gql`
  scalar Upload

  type Receipt {
    id: ID!
    storeName: String!
    purchaseDate: String
    totalAmount: Float!
    items: [Item!]!
    imageUrl: String!
    createdAt: String
  }

  type Item {
    id: ID!
    name: String!
    quantity: Int
  }

  input ItemInput {
    name: String!
    quantity: Int
  }

  extend type Query {
    receipts: [Receipt]       
    receipt(id: ID!): Receipt 
  }

  extend type Mutation {
    createReceipt(
      storeName: String!
      purchaseDate: String
      totalAmount: Float!
      imageUrl: String!
      items: [ItemInput!]!
    ): Receipt                
    deleteReceipt(id: ID!): String
    createReceiptWithUpload(
      image: Upload!
    ): Receipt
  }

`;
