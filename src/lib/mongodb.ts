import { MongoClient } from 'mongodb';

// Add TypeScript global declaration
declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient>;
}

// Connection URI - Primero intenta usar la variable de entorno, luego usa una URL de MongoDB Atlas gratuita
const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/acmes_dictaminador';

// Opciones de conexión para evitar timeouts
const options = {
  connectTimeoutMS: 30000, // 30 segundos
  socketTimeoutMS: 45000,  // 45 segundos
  serverSelectionTimeoutMS: 30000, // 30 segundos
};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

// Check if we're running on the server
if (typeof window === 'undefined') {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  if (process.env.NODE_ENV === 'development') {
    if (!global._mongoClientPromise) {
      client = new MongoClient(uri, options);
      global._mongoClientPromise = client.connect();
    }
    clientPromise = global._mongoClientPromise;
  } else {
    // In production mode, it's best to not use a global variable.
    client = new MongoClient(uri, options);
    clientPromise = client.connect();
  }
} else {
  // Create a mock promise for client-side to avoid errors
  clientPromise = Promise.resolve({} as MongoClient);
}

// Export a module-scoped MongoClient promise. By doing this in a
// separate module, the client can be shared across functions.
export default clientPromise; 