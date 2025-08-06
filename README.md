# OCR Backend Service

This is the backend service for an OCR (Optical Character Recognition) application. It uses Node.js, Express, GraphQL (Apollo Server), Prisma, and OCR libraries Tesseract.js and Google Cloud Vision to extract text from images, specifically receipts.

## Prerequisites

Before you begin, ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v18 or later recommended)
- [npm](https://www.npmjs.com/) (comes with Node.js)

## Getting Started

Follow these steps to get the project up and running on your local machine.

### 1. Clone the repository

```bash
git clone https://github.com/natnaelengeda/ocr-backend.git
```
cd ocr-backend
```

### 2. Install dependencies

Install the project dependencies using npm:

```bash
npm install
```

### 3. Set up environment variables

Create a `.env` file in the root of the project by copying the example file:

```bash
cp .env.example .env
```

Now, open the `.env` file and fill in the required environment variables, especially the `DATABASE_URL`.

### 4. Set up the database

This project uses Prisma for database management. Run the following command to apply the existing database migrations:

```bash
npx prisma migrate dev
```

This will create the database schema based on the `prisma/schema.prisma` file.

### 5. Run the application

You can run the application in development mode, which will watch for file changes and automatically restart the server.

```bash
npm run dev
```

For production, first build the TypeScript files:

```bash
npm run build
```

And then start the server:

```bash
npm run start
```

The server will be running at `http://localhost:7454` (or the port specified in your `.env` file). The GraphQL playground will be available at `http://localhost:7454/graphql`.

To improve storeName Scan accuracy you can add more store names to the `storeNames` array in the parseReceipt.ts. This will help the OCR service recognize and categorize receipts more effectively. *You can do the same for items

## Available Scripts

- `npm run build`: Compiles TypeScript to JavaScript.
- `npm run start`: Starts the production server.
- `npm run dev`: Starts the development server with auto-reloading.
- `npm test`: Runs tests (if any are configured).

## Core Technologies

- **Node.js**: JavaScript runtime environment.
- **Express**: Web framework for Node.js.
- **TypeScript**: Superset of JavaScript that adds static typing.
- **Apollo Server**: GraphQL server for Express.
- **Prisma**: Next-generation ORM for Node.js and TypeScript.
- **Google Cloud Vision**: Google's image analysis service for OCR.
- **Tesseract.js**: JavaScript library for OCR.
