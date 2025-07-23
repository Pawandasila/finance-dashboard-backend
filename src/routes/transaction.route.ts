import {Router} from 'express';
import { bulkDeleteTransactionController, createTransaction, deleteTransactionController, duplicateTransaction, getTransactions, getTransactionsById, scanReceiptController, updateTransaction } from '../controllers/transaction.controller';
import { upload } from '../configs/cloudinary.config';

const transactionRouter = Router();

transactionRouter.post('/create' , createTransaction);
transactionRouter.post(
  "/scan-receipt",
  upload.single("receipt"),
  scanReceiptController
);
transactionRouter.get('/duplicate/:id' , duplicateTransaction);
transactionRouter.get('/all', getTransactions);
transactionRouter.get('/:id' , getTransactionsById);
transactionRouter.put('/update/:id', updateTransaction);
transactionRouter.delete("/delete/:id", deleteTransactionController);
transactionRouter.delete("/bulk-delete", bulkDeleteTransactionController);


export default transactionRouter;