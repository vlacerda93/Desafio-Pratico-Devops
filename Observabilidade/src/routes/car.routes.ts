import { Router } from 'express';
import { CarController } from '../controllers/car.controller';

const carRoutes = Router();
const carController = new CarController();

carRoutes.post('/', (req, res) => carController.create(req, res));
carRoutes.get('/', (req, res) => carController.getAll(req, res));

export { carRoutes };
