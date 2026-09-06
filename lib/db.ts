// Native require bypasses Webpack bundle cache
const getPrismaConstructor = () => {
  try {
    const req = eval('require');
    return req('@prisma/client').PrismaClient;
  } catch (e) {
    return require('@prisma/client').PrismaClient;
  }
};

const PrismaClientClass = getPrismaConstructor();

const globalForPrisma = global as unknown as { prisma?: any };

export const prisma =
  globalForPrisma.prisma ||
  (globalForPrisma.prisma = new PrismaClientClass({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  }));

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

