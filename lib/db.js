import { MongoClient } from 'mongodb';
import dns from 'dns';

const globalForDb = globalThis;

async function resolveSrvIfNeeded(uri) {
  if (!uri.startsWith('mongodb+srv://')) return uri;
  try {
    const parsed = new URL(uri.replace('mongodb+srv://', 'http://'));
    const hostname = parsed.hostname;
    const resolver = new dns.promises.Resolver();
    resolver.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
    const srvRecords = await resolver.resolveSrv(`_mongodb._tcp.${hostname}`);
    let txtRecords = [];
    try {
      txtRecords = await resolver.resolveTxt(hostname);
    } catch (e) {}

    const hosts = srvRecords.map((r) => `${r.name}:${r.port}`).join(',');
    const txtParams = txtRecords.flat().join('&');
    const auth = parsed.username ? `${parsed.username}:${parsed.password}@` : '';
    const path = parsed.pathname || '/';
    const searchParams = new URLSearchParams(parsed.search);
    if (!searchParams.has('ssl') && !searchParams.has('tls')) {
      searchParams.set('ssl', 'true');
    }
    const combinedQuery = [searchParams.toString(), txtParams].filter(Boolean).join('&');
    return `mongodb://${auth}${hosts}${path}?${combinedQuery}`;
  } catch (e) {
    return uri;
  }
}

export async function getClient() {
  const rawUri = process.env.MONGODB_URI || process.env.DATABASE_URL;
  if (!rawUri) {
    throw new Error('MONGODB_URI સેટ નથી (.env.local અથવા Environment Variables માં ઉમેરો)');
  }
  if (!globalForDb.__mongoClientPromise) {
    const resolvedUri = await resolveSrvIfNeeded(rawUri);
    const client = new MongoClient(resolvedUri, {
      maxPoolSize: 10,
    });
    globalForDb.__mongoClientPromise = client.connect();
  }
  return globalForDb.__mongoClientPromise;
}

let indexesReady = null;

export async function db() {
  const client = await getClient();
  const database = client.db();
  if (!indexesReady) {
    indexesReady = (async () => {
      await Promise.allSettled([
        database.collection('docs').createIndex({ collection: 1, id: 1 }, { unique: true }),
        database.collection('users').createIndex({ username: 1 }, { unique: true }),
        database.collection('users').createIndex({ id: 1 }, { unique: true }),
        database.collection('files').createIndex({ id: 1 }, { unique: true }),
        database.collection('audit_log').createIndex({ at: -1 }),
      ]);
    })();
  }
  return database;
}

export async function audit(user, action, collection, docId, summary) {
  try {
    const database = await db();
    await database.collection('audit_log').insertOne({
      at: new Date(),
      username: user ? user.username : null,
      action,
      collection: collection || null,
      doc_id: docId || null,
      summary: summary || null,
    });
  } catch (e) {
    // the log must never block real work
  }
}
