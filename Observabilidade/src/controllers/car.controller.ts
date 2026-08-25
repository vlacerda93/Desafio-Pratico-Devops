import { Request, Response } from 'express';
import { CarService } from '../services/car.service';

export class CarController {
  private carService: CarService;

  constructor() {
    this.carService = new CarService();
  }

  async create(req: Request, res: Response) {
    try {
      const { brand, model, licensePlate, dailyRate } = req.body;
      const car = await this.carService.createCar({ brand, model, licensePlate, dailyRate });
      return res.status(201).json(car);
    } catch (error: any) {
      return res.status(400).json({ error: error.message });
    }
  }

  async getAll(req: Request, res: Response) {
    try {
      const { availableOnly } = req.query;
      const cars = await this.carService.getAllCars(availableOnly === 'true');
      return res.json(cars);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }
}
