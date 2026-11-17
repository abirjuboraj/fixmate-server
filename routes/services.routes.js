import { Router } from 'express';

import {
  addService,
  getAllServices,
  getMyServices,
  getSingleService,
  updateService,
  deleteService
} from '../controllers/services.controller.js';
import { verifyToken, verifyTechnician, optionalAuth } from '../middlewares/auth.middleware.js';

const router = Router();

router.get('/', getAllServices);


router.post('/', verifyToken, verifyTechnician, addService);

router.get('/mine', verifyToken, verifyTechnician, getMyServices);

router.patch('/:id', verifyToken, verifyTechnician, updateService);
router.delete('/:id', verifyToken, verifyTechnician, deleteService);

router.get('/:id', optionalAuth, getSingleService);

export default router;
