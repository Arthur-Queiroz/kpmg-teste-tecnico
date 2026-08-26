import type { Db } from 'mongodb';

import type { MongoService } from '../../mongo/mongo.service';

import { AuditLogService } from './audit-log.service';

const entry = {
  action: 'created' as const,
  companyId: 'b3f1c2d4-0000-4000-8000-000000000001',
  companyName: 'Aurora Tecnologia',
  cnpj: '12345678000195',
  details: { tradeName: 'Aurora Tech' },
};

/** Fluent chain mock: find().sort().skip().limit().toArray(). */
function buildFindChain(documents: unknown[]) {
  const chain = {
    sort: jest.fn(),
    skip: jest.fn(),
    limit: jest.fn(),
    toArray: jest.fn<Promise<unknown[]>, []>().mockResolvedValue(documents),
  };
  chain.sort.mockReturnValue(chain);
  chain.skip.mockReturnValue(chain);
  chain.limit.mockReturnValue(chain);
  return chain;
}

function buildCollectionMock(documents: unknown[] = [], total = 0) {
  const findChain = buildFindChain(documents);
  return {
    insertOne: jest.fn<Promise<unknown>, [unknown]>().mockResolvedValue({}),
    find: jest.fn().mockReturnValue(findChain),
    countDocuments: jest
      .fn<Promise<number>, [unknown?]>()
      .mockResolvedValue(total),
    findChain,
  };
}

function buildMongoMock(
  collection: ReturnType<typeof buildCollectionMock>,
): MongoService {
  const database = {
    collection: jest.fn().mockReturnValue(collection),
  } as unknown as Db;
  return { database } as MongoService;
}

describe('AuditLogService', () => {
  describe('record', () => {
    it('inserts the event document with a server-side timestamp', async () => {
      const collection = buildCollectionMock();
      const service = new AuditLogService(buildMongoMock(collection));

      await service.record(entry);

      const inserted = collection.insertOne.mock.calls[0][0] as Record<
        string,
        unknown
      >;
      expect(inserted).toMatchObject({
        action: 'created',
        companyId: entry.companyId,
      });
      expect(inserted.createdAt).toBeInstanceOf(Date);
    });

    it('degrades to a warning when MongoDB is not configured', async () => {
      const service = new AuditLogService({ database: null } as MongoService);

      await expect(service.record(entry)).resolves.toBeUndefined();
    });
  });

  describe('findAll', () => {
    it('returns the paginated envelope with ISO timestamps', async () => {
      const documents = [
        { ...entry, createdAt: new Date('2026-08-26T12:00:00.000Z') },
      ];
      const collection = buildCollectionMock(documents, 1);
      const service = new AuditLogService(buildMongoMock(collection));

      const result = await service.findAll({ page: 1, pageSize: 10 });

      expect(result).toEqual({
        data: [
          expect.objectContaining({
            action: 'created',
            createdAt: '2026-08-26T12:00:00.000Z',
          }),
        ],
        total: 1,
        page: 1,
        pageSize: 10,
      });
    });

    it('filters by action when provided', async () => {
      const collection = buildCollectionMock();
      const service = new AuditLogService(buildMongoMock(collection));

      await service.findAll({ page: 1, pageSize: 10, action: 'deleted' });

      expect(collection.find).toHaveBeenCalledWith({ action: 'deleted' });
    });

    it('answers 503-shaped error when MongoDB is not configured', async () => {
      const service = new AuditLogService({ database: null } as MongoService);

      await expect(service.findAll({ page: 1, pageSize: 10 })).rejects.toThrow(
        'Log de auditoria indisponível no momento',
      );
    });
  });
});
