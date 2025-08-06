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
    price: String!
  }

  type MutationResponse {
    status: String!
    message: String
    imageUrl: String
  }

  input ItemInput {
    name: String!
    quantity: Int
    price: String!
    totalPrice: String!
  }
  
  extend type Query {
    receipts: [Receipt]       
    receipt(id: ID!): Receipt 
    getImageBase64(filename: String!): String!
  }

  extend type Mutation {
    createReceipt(
      storeName: String!
      purchaseDate: String
      totalAmount: Float!
      imageUrl: String!
      items: [ItemInput!]!
    ): Receipt                
    deleteAllReceipts: String
    deleteReceipt(id: ID!): String
    uploadReceipt(image: Upload!): MutationResponse
  }
`;