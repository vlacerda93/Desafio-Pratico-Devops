import { prisma } from '../database/prisma';

export class UserRepository {
  async create(data: { name: string; email: string; driverLicense: string }) {
    return prisma.user.create({ data });
  }

  async findById(id: string) {
    return prisma.user.findUnique({ where: { id } });
  }

  async findByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } });
  }

  async findAll() {
    return prisma.user.findMany();
  }
}
