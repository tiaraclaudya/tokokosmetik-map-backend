import express from 'express';
import { 
  getAllToko, 
  getTokoById, 
  createToko, 
  deleteToko, 
  getTokoStats 
} from '../controllers/dataTokoController.js';

const router = express.Router();

router.get('/getall', getAllToko);
router.get('/stats', getTokoStats);
router.get('/getbyid/:id', getTokoById);
router.post('/create', createToko);
router.delete('/delete/:id', deleteToko);

export default router;