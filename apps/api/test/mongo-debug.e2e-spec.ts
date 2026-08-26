import { MongoClient } from 'mongodb';

// TEMPORARY: captures the handshake document the driver sends from inside
// Jest in CI (plain node connects fine; under Jest the server rejects the
// client metadata).
describe('mongo debug', () => {
  jest.setTimeout(15000);

  it('connects', async () => {
    const client = new MongoClient(process.env.MONGO_URL as string, {
      serverSelectionTimeoutMS: 10000,
      monitorCommands: true,
    });
    client.on('commandStarted', (event) => {
      console.log('HELLO-COMMAND:', JSON.stringify(event.command).slice(0, 600));
    });
    try {
      await client.connect();
      console.log('CONECTOU');
    } catch (error) {
      console.log(
        'FALHOU:',
        error instanceof Error ? error.message : String(error),
      );
      throw error;
    }
    await client.close();
  });
});
