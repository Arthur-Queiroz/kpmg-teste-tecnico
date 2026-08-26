import { ConflictException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import type { Company, CompanyRecord } from '@kpmg/shared';

import type { PrismaService } from '../../prisma/prisma.service';

import { CompanyService } from './company.service';

const companyInput: Company = {
  name: 'Aurora Tecnologia',
  cnpj: '12345678000195',
  tradeName: 'Aurora Tech',
  address: {
    zipCode: '01310100',
    street: 'Avenida Paulista',
    number: '1000',
    neighborhood: 'Bela Vista',
    city: 'São Paulo',
    state: 'SP',
  },
};

const companyRecord: CompanyRecord = {
  id: 'b3f1c2d4-0000-4000-8000-000000000001',
  ...companyInput,
  createdAt: '2026-08-24T12:00:00.000Z',
  updatedAt: '2026-08-24T12:00:00.000Z',
};

/** Prisma-shaped row: dates as Date, address as Json. */
const prismaCompany = {
  ...companyRecord,
  createdAt: new Date(companyRecord.createdAt),
  updatedAt: new Date(companyRecord.updatedAt),
};

function buildPrismaMock() {
  return {
    company: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    $transaction: jest.fn((promises: Promise<unknown>[]) =>
      Promise.all(promises),
    ),
  };
}

describe('CompanyService', () => {
  let prisma: ReturnType<typeof buildPrismaMock>;
  let emailService: { sendCompanyCreatedNotification: jest.Mock };
  let service: CompanyService;

  beforeEach(() => {
    prisma = buildPrismaMock();
    emailService = {
      sendCompanyCreatedNotification: jest.fn().mockResolvedValue(undefined),
    };
    service = new CompanyService(
      prisma as unknown as PrismaService,
      emailService,
    );
  });

  describe('create', () => {
    it('persists the company and notifies exactly once', async () => {
      prisma.company.create.mockResolvedValue(prismaCompany);

      const result = await service.create(companyInput);

      const createCalls = prisma.company.create.mock.calls as Array<
        [{ data: { cnpj: string } }]
      >;
      expect(createCalls[0][0].data.cnpj).toBe(companyInput.cnpj);
      expect(result).toEqual(companyRecord);
      expect(emailService.sendCompanyCreatedNotification).toHaveBeenCalledTimes(
        1,
      );
      expect(emailService.sendCompanyCreatedNotification).toHaveBeenCalledWith(
        companyRecord,
      );
    });

    it('does not propagate e-mail failures', async () => {
      prisma.company.create.mockResolvedValue(prismaCompany);
      emailService.sendCompanyCreatedNotification.mockRejectedValue(
        new Error('Resend fora do ar'),
      );

      await expect(service.create(companyInput)).resolves.toEqual(
        companyRecord,
      );
      // Flush the rejected promise so Jest does not flag it as unhandled.
      await new Promise((resolve) => setImmediate(resolve));
    });

    it('maps duplicate CNPJ (P2002) to 409', async () => {
      // P2002 must be a real PrismaClientKnownRequestError for the guard.
      const p2002 = new Prisma.PrismaClientKnownRequestError(
        'Unique constraint failed on the fields: (`cnpj`)',
        { code: 'P2002', clientVersion: '6.19.3' },
      );
      prisma.company.create.mockRejectedValue(p2002);

      await expect(service.create(companyInput)).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(
        emailService.sendCompanyCreatedNotification,
      ).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('returns the page envelope with filtered total', async () => {
      prisma.company.findMany.mockResolvedValue([prismaCompany]);
      prisma.company.count.mockResolvedValue(1);

      const result = await service.findAll({
        page: 1,
        pageSize: 10,
        search: 'aurora',
        state: 'SP',
      });

      expect(result).toEqual({
        data: [companyRecord],
        total: 1,
        page: 1,
        pageSize: 10,
      });
      expect(prisma.company.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 0, take: 10 }),
      );
    });

    it('matches a masked CNPJ search against the stored digits', async () => {
      prisma.company.findMany.mockResolvedValue([]);
      prisma.company.count.mockResolvedValue(0);

      await service.findAll({ page: 1, pageSize: 10, search: '12.345.678' });

      const findManyCalls = prisma.company.findMany.mock.calls as Array<
        [{ where: { OR?: unknown[] } }]
      >;
      expect(findManyCalls[0][0].where.OR).toContainEqual({
        cnpj: { contains: '12345678' },
      });
    });
  });

  describe('findOne', () => {
    it('throws 404 when the company does not exist', async () => {
      prisma.company.findUnique.mockResolvedValue(null);

      await expect(service.findOne('missing-id')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('updates without firing any e-mail', async () => {
      prisma.company.findUnique.mockResolvedValue(prismaCompany);
      prisma.company.update.mockResolvedValue(prismaCompany);

      const result = await service.update(companyRecord.id, {
        tradeName: 'Aurora',
      });

      expect(result).toEqual(companyRecord);
      expect(
        emailService.sendCompanyCreatedNotification,
      ).not.toHaveBeenCalled();
    });

    it('throws 404 when the company does not exist', async () => {
      prisma.company.findUnique.mockResolvedValue(null);

      await expect(
        service.update('missing-id', { tradeName: 'Aurora' }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('remove', () => {
    it('deletes an existing company', async () => {
      prisma.company.findUnique.mockResolvedValue(prismaCompany);
      prisma.company.delete.mockResolvedValue(prismaCompany);

      await expect(service.remove(companyRecord.id)).resolves.toBeUndefined();
      expect(prisma.company.delete).toHaveBeenCalledWith({
        where: { id: companyRecord.id },
      });
    });

    it('throws 404 when the company does not exist', async () => {
      prisma.company.findUnique.mockResolvedValue(null);

      await expect(service.remove('missing-id')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });
});
