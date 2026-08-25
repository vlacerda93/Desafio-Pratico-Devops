import { prisma } from '../database/prisma';

export class RentalRepository {
  async create(data: {
    userId: string;
    carId: string;
    startDate: Date;
    endDate: Date;
    totalAmount: number;
  }) {
    return prisma.rental.create({ data });
  }

  async findActiveByUserId(userId: string) {
    return prisma.rental.findFirst({
      where: {
        userId,
        status: 'ACTIVE',
      },
    });
  }

  async findActiveByCarId(carId: string) {
    return prisma.rental.findFirst({
      where: {
        carId,
        status: 'ACTIVE',
      },
    });
  }

  async findById(id: string) {
    return prisma.rental.findUnique({
      where: { id },
      include: { car: true, user: true },
    });
  }

  async completeRental(id: string) {
    return prisma.rental.update({
      where: { id },
      data: { status: 'COMPLETED' },
    });
  }
}
