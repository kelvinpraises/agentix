import { Router } from 'express';
import {
  getStorage,
  setStorage,
  deleteStorage,
} from '../controllers/internalStorageController.js';
import { walletRpc } from '../controllers/internalWalletController.js';

const router = Router();

// Storage endpoints
router.get('/storage/:scope', getStorage);
router.put('/storage/:scope', setStorage);
router.delete('/storage/:scope', deleteStorage);

// Wallet RPC endpoint
router.post('/wallet/rpc', walletRpc);

export default router;
