import { CarRepository } from '../repositories/car.repository';

export class CarService {
  private carRepository: CarRepository;

  constructor() {
    this.carRepository = new CarRepository();
  }

  async createCar(data: { brand: string; model: string; licensePlate: string; dailyRate: number }) {
    const carExists = await this.carRepository.findByLicensePlate(data.licensePlate);

    if (carExists) {
      throw new Error('Car with this license plate already exists');
    }

    return this.carRepository.create(data);
  }

  async getAllCars(availableOnly?: boolean) {
    return this.carRepository.findAll(availableOnly);
  }

  async getCarById(id: string) {
    const car = await this.carRepository.findById(id);
    if (!car) {
      throw new Error('Car not found');
    }
    return car;
  }
}
