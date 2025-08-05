import { mergeTypeDefs, mergeResolvers } from '@graphql-tools/merge';
import gql from 'graphql-tag';

// typeDefs
import { receiptTypeDefs } from './receipt/receipt.typeDefs';

// resolvers
import { receiptResolvers } from './receipt/receipt.resolveres';

const baseTypeDefs = gql`
type Query
type Mutation
`;

export const typeDefs = mergeTypeDefs([baseTypeDefs, receiptTypeDefs]);
export const resolvers = mergeResolvers([receiptResolvers]);