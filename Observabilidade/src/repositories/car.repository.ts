import { prisma } from '../database/prisma';

export class CarRepository {
  async create(data: { brand: string; model: string; licensePlate: string; dailyRate: number }) {
    return prisma.car.create({ data });
  }

  async findById(id: string) {
    return prisma.car.findUnique({ where: { id } });
  }

  async findByLicensePlate(licensePlate: string) {
    return prisma.car.findUnique({ where: { licensePlate } });
  }

  async findAll(availableOnly?: boolean) {
    const where = availableOnly ? { isAvailable: true } : {};
    return prisma.car.findMany({ where });
  }

  async updateAvailability(id: string, isAvailable: boolean) {
    return prisma.car.update({
      where: { id },
      data: { isAvailable },
    });
  }
}
