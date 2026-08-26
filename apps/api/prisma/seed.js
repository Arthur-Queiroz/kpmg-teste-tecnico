// Seed de produção/demo — empresas de exemplo para a listagem não abrir
// vazia para o avaliador (ver docs/08-DEPLOYMENT.md). Idempotente: usa
// upsert por CNPJ, então pode rodar quantas vezes for necessário.
//
// Uso local:   node prisma/seed.js   (com DATABASE_URL no .env)
// Em produção: docker exec kpmg-api node apps/api/prisma/seed.js
/* eslint-disable @typescript-eslint/no-require-imports */
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const companies = [
  {
    name: 'Aurora Tecnologia Ltda',
    cnpj: '12345678000195',
    tradeName: 'Aurora Tech',
    address: {
      zipCode: '01310100',
      street: 'Avenida Paulista',
      number: '1000',
      complement: 'Conjunto 101',
      neighborhood: 'Bela Vista',
      city: 'São Paulo',
      state: 'SP',
    },
  },
  {
    name: 'Boreal Comércio e Serviços Ltda',
    cnpj: '11444777000161',
    tradeName: 'Boreal',
    address: {
      zipCode: '20040020',
      street: 'Rua da Assembleia',
      number: '50',
      neighborhood: 'Centro',
      city: 'Rio de Janeiro',
      state: 'RJ',
    },
  },
  {
    name: 'Cerrado Alimentos S/A',
    cnpj: '19131243000197',
    tradeName: 'Cerrado Alimentos',
    address: {
      zipCode: '70040900',
      street: 'Eixo Monumental',
      number: 'S/N',
      neighborhood: 'Zona Cívico-Administrativa',
      city: 'Brasília',
      state: 'DF',
    },
  },
  {
    name: 'Litoral Logística Ltda',
    cnpj: '34028316000103',
    tradeName: 'Litoral Log',
    address: {
      zipCode: '88015100',
      street: 'Avenida Beira-Mar Norte',
      number: '350',
      complement: 'Sala 12',
      neighborhood: 'Centro',
      city: 'Florianópolis',
      state: 'SC',
    },
  },
];

async function main() {
  for (const company of companies) {
    await prisma.company.upsert({
      where: { cnpj: company.cnpj },
      update: {},
      create: company,
    });
  }
  console.log(`seed: ${companies.length} empresas garantidas`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
