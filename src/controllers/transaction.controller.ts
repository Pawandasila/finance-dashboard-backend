import { Request, Response } from "express";
import { AsyncHandler } from "../middleware/AsyncHandler.middleware";
import { HTTPSTATUS } from "../configs/Https.config";
import { bulkDeleteTransactionSchema, bulkTransactionSchema, createTransactionSchema, transactionIdSchema, updateTransactionSchema } from "../validator/Transaction.validator";
import { bulkDeleteTransactionService, bulkTransactionService, createTransactionService, deleteTransactionService, duplicateTransactionService, getTransactionByIdService, getTransactionService, scanReceiptService, updateTransactionService } from "../services/transaction.service";
import { TransactionTypeEnum } from "../models/Transaction.models";

export const createTransaction = AsyncHandler(
    async(req : Request , res : Response) => {
        const body = createTransactionSchema.parse(req.body)
        const userId = req.user?._id;

        const result = await createTransactionService(body , userId);


        return res.status(HTTPSTATUS.CREATED).json({
            message : "Transaction created Successfully",
            data : result
        })
    }
)

export const getTransactions = AsyncHandler
(
    async(req : Request , res : Response) => {
        const usreId = req?.user?._id;

        const filters = {
            keyword : req.query.keyword as string | undefined,
            type : req.query.type as keyof typeof TransactionTypeEnum | undefined,
            recurringStatus : req.query.recurringStatus as "RECURRING" | "NO_RECURRING" | undefined
        }

        const pagination = {
            pageSize : parseInt(req.query.pageSize as string) || 20,
            pageNumber : parseInt(req.query.pageNumber as string) || 1,
        }

        const result = await getTransactionService(usreId , filters , pagination);

        return res.status(HTTPSTATUS.OK).json({
            message : "Transaction fetched successfully",
            data : result
        })
    }
)

export const getTransactionsById = AsyncHandler(
    async(req : Request , res : Response) => {
        const userId = req?.user?._id;
        const transactionId = transactionIdSchema.parse(req.params.id)

        const transaction = await getTransactionByIdService(userId , transactionId);


        return res.status(HTTPSTATUS.OK).json({
            message : "Transaction fetched successfully",
            data : transaction
        })
    }
)

export const duplicateTransaction = AsyncHandler(
    async(req : Request , res : Response) => {
        const userId = req?.user?._id;
        const transactionId = transactionIdSchema.parse(req.params.id)

        const transaction = await duplicateTransactionService(userId , transactionId);


        return res.status(HTTPSTATUS.OK).json({
            message : "Transaction duplicated successfully",
            data : transaction
        })
    }
)

export const updateTransaction = AsyncHandler(
    async(req : Request , res : Response) => {
        const userId = req?.user?._id;
        const transactionId = transactionIdSchema.parse(req.params.id)
        const body = updateTransactionSchema.parse( req.body)

        await updateTransactionService(userId , transactionId , body);


        return res.status(HTTPSTATUS.OK).json({
            message : "Transaction duplicated successfully",
        })
    }
)

export const deleteTransactionController = AsyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;
    const transactionId = transactionIdSchema.parse(req.params.id);

    await deleteTransactionService(userId, transactionId);

    return res.status(HTTPSTATUS.OK).json({
      message: "Transaction deleted successfully",
    });
  }
);

export const bulkDeleteTransactionController = AsyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;
    const { transactionIds } = bulkDeleteTransactionSchema.parse(req.body);

    const result = await bulkDeleteTransactionService(userId, transactionIds);

    return res.status(HTTPSTATUS.OK).json({
      message: "Transaction deleted successfully",
      ...result,
    });
  }
);

export const bulkTransactionController = AsyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user?._id;
    const { transactions } = bulkTransactionSchema.parse(req.body);

    const result = await bulkTransactionService(userId, transactions);

    return res.status(HTTPSTATUS.OK).json({
      message: "Bulk transaction inserted successfully",
      ...result,
    });
  }
);

export const scanReceiptController = AsyncHandler(
  async (req: Request, res: Response) => {
    const file = req?.file;

    const result = await scanReceiptService(file);

    return res.status(HTTPSTATUS.OK).json({
      message: "Reciept scanned successfully",
      data: result,
    });
  }
);