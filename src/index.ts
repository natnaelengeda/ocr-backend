import express from 'express';
import dotenv from 'dotenv';
import http from 'http';
import cors from 'cors';
import graphqlUploadExpress from 'graphql-upload/graphqlUploadExpress.mjs'

// apollo
import { resolvers, typeDefs } from './graphql';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@as-integrations/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';

import { urlList } from './utils/urlList';
import path from 'node:path';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;
const httpServer = http.createServer(app);

const server = new ApolloServer({
  typeDefs,
  resolvers,
  plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
});

app.use(cors({
  origin: urlList,
  optionsSuccessStatus: 200,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
}));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

async function startServer() {
  await server.start();

  app.use(
    '/graphql',
    (req, res, next) => {
      const contentType = req.get('Content-Type') || '';
      if (contentType.startsWith('multipart/form-data')) {
        return graphqlUploadExpress({
          maxFileSize: 10000000, // 10 MB
          maxFiles: 1
        })(req, res, next);
      }
      next();
    }
  );

  app.use(
    '/graphql',
    express.json(),
    express.urlencoded({ extended: true }),
    expressMiddleware(server)
  );
}

app.get('/uploads/:imageName', (req, res) => {
  const { imageName } = req.params;
  if (!imageName) {
    return res.status(400).json({ error: 'No image name provided.' });
  }
  const absolutePath = path.join(__dirname, '../uploads', imageName);
  console.log(absolutePath)
  res.sendFile(absolutePath, err => {
    if (err) {
      res.status(404).json({ error: 'File not found.' });
    }
  });
});

startServer();

httpServer.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});