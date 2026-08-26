import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types';

import type { CompanyRecord } from '@kpmg/shared';

import { AppModule } from '../src/app.module';
import { EmailService } from '../src/email/email.service';
import { PrismaService } from '../src/prisma/prisma.service';

/**
 * E2E do CRUD de Company contra o Postgres de teste real
 * (`kpmg_teste_test`, ver docs/07-TESTING-STRATEGY.md). O EmailService é
 * substituído por um mock — nenhum teste bate no Resend real.
 */

/** Response envelope of GET /companies (docs/03-API-SPEC.md). */
interface CompanyListBody {
  data: CompanyRecord[];
  total: number;
  page: number;
  pageSize: number;
}

/** Global error shape of the HttpExceptionFilter (docs/03-API-SPEC.md). */
interface ErrorBody {
  statusCode: number;
  message: string;
  error: string;
  path: string;
  timestamp: string;
  errors?: Array<{ path: string[]; message: string }>;
}

function bodyAs<T>(response: { body: unknown }): T {
  return response.body as T;
}

const auroraCompany = {
  name: 'Aurora Tecnologia Ltda',
  cnpj: '12.345.678/0001-95',
  tradeName: 'Aurora Tech',
  address: {
    zipCode: '01310-100',
    street: 'Avenida Paulista',
    number: '1000',
    neighborhood: 'Bela Vista',
    city: 'São Paulo',
    state: 'SP',
  },
};

const borealCompany = {
  name: 'Boreal Comércio Ltda',
  cnpj: '11.444.777/0001-61',
  tradeName: 'Boreal',
  address: {
    zipCode: '20040020',
    street: 'Rua da Assembleia',
    number: '50',
    neighborhood: 'Centro',
    city: 'Rio de Janeiro',
    state: 'RJ',
  },
};

describe('Company (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  const emailServiceMock = {
    sendCompanyCreatedNotification: jest.fn().mockResolvedValue(undefined),
  };

  const http = () => request(app.getHttpServer() as App);

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(EmailService)
      .useValue(emailServiceMock)
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();

    prisma = app.get(PrismaService);
  });

  beforeEach(async () => {
    await prisma.company.deleteMany();
    emailServiceMock.sendCompanyCreatedNotification.mockClear();
  });

  afterAll(async () => {
    // Leaves the test database clean for the next run.
    await prisma.company.deleteMany();
    await app.close();
  });

  async function createCompany(
    payload: typeof auroraCompany,
  ): Promise<CompanyRecord> {
    const response = await http().post('/companies').send(payload).expect(201);
    return bodyAs<CompanyRecord>(response);
  }

  describe('POST /companies', () => {
    it('creates a company and sends the notification e-mail exactly once', async () => {
      const response = await http().post('/companies').send(auroraCompany);
      const body = bodyAs<CompanyRecord>(response);

      expect(response.status).toBe(201);
      expect(body).toMatchObject({
        name: auroraCompany.name,
        // CNPJ and zipCode are stored unmasked, per CompanySchema transforms.
        cnpj: '12345678000195',
        tradeName: auroraCompany.tradeName,
        address: {
          zipCode: '01310100',
          street: 'Avenida Paulista',
          city: 'São Paulo',
          state: 'SP',
        },
      });
      expect(body.id).toEqual(expect.any(String));
      expect(body.createdAt).toEqual(expect.any(String));

      expect(
        emailServiceMock.sendCompanyCreatedNotification,
      ).toHaveBeenCalledTimes(1);
      expect(
        emailServiceMock.sendCompanyCreatedNotification,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          name: auroraCompany.name,
          cnpj: '12345678000195',
          tradeName: auroraCompany.tradeName,
        }),
      );
    });

    it('rejects an invalid CNPJ with 400 and field-level errors', async () => {
      const response = await http()
        .post('/companies')
        .send({ ...auroraCompany, cnpj: '12345678000196' });
      const body = bodyAs<ErrorBody>(response);

      expect(response.status).toBe(400);
      expect(body).toMatchObject({
        statusCode: 400,
        error: 'Bad Request',
        path: '/companies',
      });
      expect(body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ path: ['cnpj'], message: 'CNPJ inválido' }),
        ]),
      );
      expect(
        emailServiceMock.sendCompanyCreatedNotification,
      ).not.toHaveBeenCalled();
    });

    it('rejects a duplicate CNPJ with 409, even masked differently', async () => {
      await createCompany(auroraCompany);

      const response = await http()
        .post('/companies')
        .send({ ...auroraCompany, cnpj: '12345678000195' });
      const body = bodyAs<ErrorBody>(response);

      expect(response.status).toBe(409);
      expect(body.message).toBe('CNPJ já cadastrado');
    });
  });

  describe('GET /companies', () => {
    beforeEach(async () => {
      await createCompany(auroraCompany);
      await createCompany(borealCompany);
    });

    it('returns the pagination envelope honoring pageSize', async () => {
      const response = await http().get('/companies?page=1&pageSize=1');
      const body = bodyAs<CompanyListBody>(response);

      expect(response.status).toBe(200);
      expect(body.total).toBe(2);
      expect(body.page).toBe(1);
      expect(body.pageSize).toBe(1);
      expect(body.data).toHaveLength(1);
    });

    it('filters by search over name and over masked CNPJ', async () => {
      const byName = bodyAs<CompanyListBody>(
        await http().get('/companies?search=boreal').expect(200),
      );
      expect(byName.total).toBe(1);
      expect(byName.data[0].cnpj).toBe('11444777000161');

      const byMaskedCnpj = bodyAs<CompanyListBody>(
        await http()
          .get('/companies')
          .query({ search: '12.345.678' })
          .expect(200),
      );
      expect(byMaskedCnpj.total).toBe(1);
      expect(byMaskedCnpj.data[0].cnpj).toBe('12345678000195');
    });

    it('filters by address state', async () => {
      const body = bodyAs<CompanyListBody>(
        await http().get('/companies?state=RJ').expect(200),
      );

      expect(body.total).toBe(1);
      expect(body.data[0].address.state).toBe('RJ');
    });

    it('combines search and state', async () => {
      const body = bodyAs<CompanyListBody>(
        await http().get('/companies?search=aurora&state=RJ').expect(200),
      );

      expect(body.total).toBe(0);
      expect(body.data).toEqual([]);
    });
  });

  describe('GET /companies/:id', () => {
    it('returns the company', async () => {
      const created = await createCompany(auroraCompany);

      const body = bodyAs<CompanyRecord>(
        await http().get(`/companies/${created.id}`).expect(200),
      );

      expect(body.id).toBe(created.id);
    });

    it('returns 404 for an unknown id', async () => {
      const body = bodyAs<ErrorBody>(
        await http()
          .get('/companies/00000000-0000-4000-8000-000000000000')
          .expect(404),
      );

      expect(body.message).toBe('Empresa não encontrada');
    });
  });

  describe('PATCH /companies/:id', () => {
    it('updates the company without sending any e-mail', async () => {
      const created = await createCompany(auroraCompany);
      emailServiceMock.sendCompanyCreatedNotification.mockClear();

      const body = bodyAs<CompanyRecord>(
        await http()
          .patch(`/companies/${created.id}`)
          .send({ tradeName: 'Aurora' })
          .expect(200),
      );

      expect(body.tradeName).toBe('Aurora');
      expect(body.name).toBe(auroraCompany.name);
      expect(
        emailServiceMock.sendCompanyCreatedNotification,
      ).not.toHaveBeenCalled();
    });

    it('returns 404 for an unknown id', async () => {
      await http()
        .patch('/companies/00000000-0000-4000-8000-000000000000')
        .send({ tradeName: 'Aurora' })
        .expect(404);
    });

    it('rejects an invalid payload with 400', async () => {
      const created = await createCompany(auroraCompany);

      await http()
        .patch(`/companies/${created.id}`)
        .send({ name: 'A' })
        .expect(400);
    });
  });

  describe('DELETE /companies/:id', () => {
    it('deletes the company and returns 204', async () => {
      const created = await createCompany(auroraCompany);

      await http().delete(`/companies/${created.id}`).expect(204);
      await http().get(`/companies/${created.id}`).expect(404);
    });

    it('returns 404 for an unknown id', async () => {
      await http()
        .delete('/companies/00000000-0000-4000-8000-000000000000')
        .expect(404);
    });
  });

  describe('ausência de autenticação (docs/CONSTRAINTS.md)', () => {
    it('GET /companies answers 200 without any authorization header', async () => {
      // Prova deliberada: nenhum header de auth é exigido — requisito do PDF.
      await http().get('/companies').expect(200);
    });

    it('POST /companies also requires no authorization header', async () => {
      await http().post('/companies').send(auroraCompany).expect(201);
    });
  });
});
