import { RentalRepository } from '../repositories/rental.repository';
import { CarRepository } from '../repositories/car.repository';
import { UserRepository } from '../repositories/user.repository';

export class RentalService {
  private rentalRepository: RentalRepository;
  private carRepository: CarRepository;
  private userRepository: UserRepository;

  constructor() {
    this.rentalRepository = new RentalRepository();
    this.carRepository = new CarRepository();
    this.userRepository = new UserRepository();
  }

  async createRental(data: { userId: string; carId: string; startDate: string; endDate: string }) {
    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);

    const user = await this.userRepository.findById(data.userId);
    if (!user) {
      throw new Error('User does not exist');
    }

    const car = await this.carRepository.findById(data.carId);
    if (!car) {
      throw new Error('Car does not exist');
    }
    if (!car.isAvailable) {
      throw new Error('Car is not available for rental');
    }

    const activeUserRental = await this.rentalRepository.findActiveByUserId(data.userId);
    if (activeUserRental) {
      throw new Error('User already has an active rental');
    }

    const differenceInMilliseconds = endDate.getTime() - startDate.getTime();
    const differenceInHours = differenceInMilliseconds / (1000 * 60 * 60);

    if (differenceInHours < 24) {
      throw new Error('Rental period must be at least 24 hours');
    }

    const days = Math.ceil(differenceInHours / 24);
    const totalAmount = days * car.dailyRate;

    const rental = await this.rentalRepository.create({
      userId: data.userId,
      carId: data.carId,
      startDate,
      endDate,
      totalAmount,
    });

    await this.carRepository.updateAvailability(data.carId, false);

    return rental;
  }

  async completeRental(rentalId: string) {
    const rental = await this.rentalRepository.findById(rentalId);
    if (!rental) {
      throw new Error('Rental not found');
    }

    if (rental.status === 'COMPLETED') {
      throw new Error('Rental is already completed');
    }

    await this.rentalRepository.completeRental(rentalId);
    await this.carRepository.updateAvailability(rental.carId, true);

    return { message: 'Rental completed successfully' };
  }
}
