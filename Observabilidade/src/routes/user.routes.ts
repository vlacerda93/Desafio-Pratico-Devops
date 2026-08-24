import { Router } from 'express';
import { UserController } from '../controllers/user.controller';

const userRoutes = Router();
const userController = new UserController();

userRoutes.post('/', (req, res) => userController.create(req, res));
userRoutes.get('/', (req, res) => userController.getAll(req, res));

export { userRoutes };
