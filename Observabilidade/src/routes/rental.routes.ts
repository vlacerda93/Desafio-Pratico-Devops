import { Router } from 'express';
import { RentalController } from '../controllers/rental.controller';

const rentalRoutes = Router();
const rentalController = new RentalController();

rentalRoutes.post('/', (req, res) => rentalController.create(req, res));
rentalRoutes.post('/:id/complete', (req, res) => rentalController.complete(req, res));

export { rentalRoutes };
