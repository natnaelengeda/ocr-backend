import express from 'express';
import dotenv from 'dotenv';
import http from 'http';
import cors from 'cors';

// apollo
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@as-integrations/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer'
import { resolvers, typeDefs } from './graphql';

dotenv.config();

// Data 
import { urlList } from './utils/urlList';

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

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(expressMiddleware(server));

  app.use(cors({
    origin: urlList,
    optionsSuccessStatus: 200,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  }));

  httpServer.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
  });
}

startServer();

