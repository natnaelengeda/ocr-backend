import express from 'express';
import dotenv from 'dotenv';
import http from 'http';
import cors from 'cors';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@as-integrations/express4';
import graphqlUploadExpress from 'graphql-upload/graphqlUploadExpress.mjs';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { resolvers, typeDefs } from './graphql';

const test = require('./test/test');
import { urlList } from './utils/urlList';

dotenv.config();

async function startServer() {
  const app = express();
  const port = process.env.PORT || 3000;
  const httpServer = http.createServer(app);

  const server = new ApolloServer({
    typeDefs,
    resolvers,
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
  });

  await server.start();

  // Apply CORS globally or specifically to /graphql endpoint
  app.use(cors({
    origin: urlList,
    optionsSuccessStatus: 200,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  }));

  // Other routes
  app.use("/", test);

  // Upload middleware must come before Apollo middleware
  app.use(
    '/graphql',
    // graphqlUploadExpress({ maxFileSize: 3 * 1024 * 1024, maxFiles: 1 }), // 3MB limit
    express.json(),
    express.urlencoded({ extended: true }),
    expressMiddleware(server)
  );

  httpServer.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
  });
}

startServer();
