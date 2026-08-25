import { Router } from 'express';
import { userRoutes } from './user.routes';
import { carRoutes } from './car.routes';
import { rentalRoutes } from './rental.routes';

const routes = Router();

routes.use('/users', userRoutes);
routes.use('/cars', carRoutes);
routes.use('/rentals', rentalRoutes);

export { routes };
