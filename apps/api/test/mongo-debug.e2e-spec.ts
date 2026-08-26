import { MongoClient } from 'mongodb';

// TEMPORARY: measures whether the mongodb driver can connect from inside
// Jest in CI (plain node connects in ~160ms; the app boot hangs).
describe('mongo debug', () => {
  jest.setTimeout(15000);

  it('connects', async () => {
    const startedAt = Date.now();
    const client = new MongoClient(process.env.MONGO_URL as string, {
      serverSelectionTimeoutMS: 10000,
    });
    await client.connect();
    console.log('CONECTOU EM', Date.now() - startedAt, 'ms');
    await client.db().admin().ping();
    console.log('PING OK');
    await client.close();
  });
});
