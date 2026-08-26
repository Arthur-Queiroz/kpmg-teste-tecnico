import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import type { Company as PrismaCompany } from '@prisma/client';

import { unmaskCnpj } from '@kpmg/shared';
import type { Address, Company, CompanyRecord } from '@kpmg/shared';

import { EmailService } from '../../email/email.service';
import { PrismaService } from '../../prisma/prisma.service';

import type { ListCompaniesQueryDto } from './dto/list-companies-query.dto';
import type { UpdateCompanyDto } from './dto/update-company.dto';

/** Response shape of GET /companies — see docs/03-API-SPEC.md. */
export interface CompanyListResult {
  data: CompanyRecord[];
  total: number;
  page: number;
  pageSize: number;
}

@Injectable()
export class CompanyService {
  private readonly logger = new Logger(CompanyService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  async create(input: Company): Promise<CompanyRecord> {
    try {
      const company = await this.prisma.company.create({
        data: {
          name: input.name,
          cnpj: input.cnpj,
          tradeName: input.tradeName,
          address: input.address,
        },
      });

      // Best-effort notification: the HTTP response never waits for the
      // e-mail, and a send failure is logged, not propagated — see
      // docs/06-EMAIL-NOTIFICATIONS.md.
      this.emailService
        .sendCompanyCreatedNotification(toCompanyRecord(company))
        .catch((error: unknown) => {
          this.logger.error(
            `Failed to send creation e-mail for company ${company.id}`,
            error instanceof Error ? error.stack : String(error),
          );
        });

      return toCompanyRecord(company);
    } catch (error) {
      throwConflictOnDuplicateCnpj(error);
      throw error;
    }
  }

  async findAll(query: ListCompaniesQueryDto): Promise<CompanyListResult> {
    const { page, pageSize, search, state } = query;
    const where = buildListWhere(search, state);

    const [companies, total] = await this.prisma.$transaction([
      this.prisma.company.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.company.count({ where }),
    ]);

    return { data: companies.map(toCompanyRecord), total, page, pageSize };
  }

  async findOne(id: string): Promise<CompanyRecord> {
    const company = await this.prisma.company.findUnique({ where: { id } });
    if (!company) {
      throw new NotFoundException('Empresa não encontrada');
    }
    return toCompanyRecord(company);
  }

  async update(id: string, input: UpdateCompanyDto): Promise<CompanyRecord> {
    await this.findOne(id);

    const { address, ...scalarFields } = input;

    try {
      const company = await this.prisma.company.update({
        where: { id },
        data: {
          ...scalarFields,
          ...(address ? { address: address } : {}),
        },
      });
      return toCompanyRecord(company);
    } catch (error) {
      throwConflictOnDuplicateCnpj(error);
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.prisma.company.delete({ where: { id } });
  }
}

/**
 * `search` matches name, tradeName or CNPJ — with or without mask, since the
 * digits-only variant is also compared against the unmasked stored CNPJ.
 */
function buildListWhere(
  search: string | undefined,
  state: string | undefined,
): Prisma.CompanyWhereInput {
  const where: Prisma.CompanyWhereInput = {};

  if (state) {
    where.address = { path: ['state'], equals: state };
  }

  if (search) {
    const or: Prisma.CompanyWhereInput[] = [
      { name: { contains: search, mode: 'insensitive' } },
      { tradeName: { contains: search, mode: 'insensitive' } },
      { cnpj: { contains: search } },
    ];

    const searchDigits = unmaskCnpj(search);
    if (searchDigits.length > 0 && searchDigits !== search) {
      or.push({ cnpj: { contains: searchDigits } });
    }

    where.OR = or;
  }

  return where;
}

function throwConflictOnDuplicateCnpj(error: unknown): void {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2002'
  ) {
    throw new ConflictException('CNPJ já cadastrado');
  }
}

function toCompanyRecord(company: PrismaCompany): CompanyRecord {
  return {
    id: company.id,
    name: company.name,
    cnpj: company.cnpj,
    tradeName: company.tradeName,
    address: company.address as unknown as Address,
    createdAt: company.createdAt.toISOString(),
    updatedAt: company.updatedAt.toISOString(),
  };
}
