import axios from "axios";
import Transaction, {
  TransactionTypeEnum,
} from "../models/Transaction.models";
import { BadRequestException, NotFoundException } from "../utils/AppError";
import { calculatenextOccurence } from "../utils/helper";
import {
  createTransactionType,
  updateTransactionType,
} from "../validator/Transaction.validator";
import { createPartFromBase64, createUserContent } from "@google/genai";
import { receiptPrompt } from "../utils/prompt";
import { genAIModel , genAI } from "../configs/google-ai.config";


export const createTransactionService = async (
  body: createTransactionType,
  userId: string
) => {
  let nextRecurringDate: Date | undefined;
  let currentDate = new Date();

  if (body.isRecurring && body.recurringInterval) {
    const calculateDate = calculatenextOccurence(
      body.date,
      body.recurringInterval
    );

    nextRecurringDate =
      calculateDate < currentDate
        ? calculatenextOccurence(currentDate, body.recurringInterval)
        : calculateDate;
  }

  const transaction = await Transaction.create({
    ...body,
    category: body.category,
    amount: Number(body.amount),
    userId,
    isRecurring: body.isRecurring || false,
    recurringInterval: body.recurringInterval || null,
    nextRecurringDate: nextRecurringDate,
    lastProcessed: null,
  });

  return transaction;
};

export const getTransactionService = async (
  userId: string,
  filters: {
    keyword?: string;
    type?: keyof typeof TransactionTypeEnum;
    recurringStatus?: "RECURRING" | "NO_RECURRING";
  },
  pagination: {
    pageSize: number;
    pageNumber: number;
  }
) => {
  const { keyword, recurringStatus, type } = filters;

  const filterConditions: Record<string, any> = {
    userId,
  };

  if (keyword) {
    filterConditions.$or = [
      {
        title: { $regex: keyword, $options: "i" },
        category: { $regex: keyword, $options: "i" },
      },
    ];
  }

  if (type) {
    filterConditions.type = type;
  }

  if (recurringStatus) {
    if (recurringStatus == "RECURRING") {
      filterConditions.isRecurring = true;
    } else if (recurringStatus == "NO_RECURRING") {
      filterConditions.isRecurring = false;
    }
  }

  const { pageNumber, pageSize } = pagination;
  const skip = (pageNumber - 1) * pageSize;

  const [transactions, totalCount] = await Promise.all([
    Transaction.find(filterConditions)
      .skip(skip)
      .limit(pageSize)
      .sort({ createdAt: -1 }),
    Transaction.countDocuments(filterConditions),
  ]);

  const totalPage = Math.ceil(totalCount / pageSize);
  return {
    transactions,
    pagination: {
      pageSize,
      pageNumber,
      totalCount,
      totalPage,
      skip,
    },
  };
};

export const getTransactionByIdService = async (
  userId: string,
  transactionId: string
) => {
  const transaction = await Transaction.findOne({
    _id: transactionId,
    userId,
  });

  if (!transaction) {
    throw new NotFoundException("Transaction with this id not found");
  }

  return transaction;
};

export const duplicateTransactionService = async (
  userId: string,
  transactionId: string
) => {
  const transaction = await Transaction.findOne({
    _id: transactionId,
    userId,
  });

  if (!transaction) {
    throw new NotFoundException("Transaction with this id not found");
  }

  const duplicate = await Transaction.create({
    ...transaction.toObject(),
    _id: undefined,
    title: `Duplicate - ${transaction.title}`,
    description: transaction.description
      ? `${transaction.description} (duplicate)`
      : `Duplicated Transaction`,
    isRecurring: false,
    recurringInterval: undefined,
    nextRecurringDate: undefined,
    createdAt: undefined,
    updatedAt: undefined,
  });

  return duplicate;
};

export const updateTransactionService = async (
  userId: string,
  transactionId: string,
  body: updateTransactionType
) => {
  const existingTransaction = await Transaction.findOne({
    _id: transactionId,
    userId,
  });

  if (!existingTransaction) {
    throw new NotFoundException("Transaction with this id not found");
  }

  const now = new Date();
  const isRecurring = body.isRecurring ?? existingTransaction.isRecurring;

  const date =
    body.date !== undefined ? new Date(body.date) : existingTransaction.date;

  const recurringInterval =
    body.recurringInterval || existingTransaction.recurringInterval;

  let nextRecurringDate: Date | undefined;
  if (isRecurring && recurringInterval) {
    const calculateDate = calculatenextOccurence(date, recurringInterval);

    nextRecurringDate =
      calculateDate < now
        ? calculatenextOccurence(now, recurringInterval)
        : calculateDate;
  }

  existingTransaction.set({
    ...(body.title && { title: body.title }),
    ...(body.description && { description: body.description }),
    ...(body.category && { category: body.category }),
    ...(body.type && { type: body.type }),
    ...(body.paymentMethod && { paymentMethod: body.paymentMethod }),
    ...(body.amount !== undefined && { amount: Number(body.amount) }),
    date,
    isRecurring,
    recurringInterval,
    nextRecurringDate,
  });

  await existingTransaction.save();

  return;
};

export const deleteTransactionService = async (
  userId: string,
  transactionId: string
) => {
  const deleted = await Transaction.findByIdAndDelete({
    _id: transactionId,
    userId,
  });
  if (!deleted) throw new NotFoundException("Transaction not found");

  return;
};

export const bulkDeleteTransactionService = async (
  userId: string,
  transactionIds: string[]
) => {
  const result = await Transaction.deleteMany({
    _id: { $in: transactionIds },
    userId,
  });

  if (result.deletedCount === 0)
    throw new NotFoundException("No transations found");

  return {
    sucess: true,
    deletedCount: result.deletedCount,
  };
};

export const bulkTransactionService = async (
  userId: string,
  transactions: createTransactionType[]
) => {
  try {
    const bulkOps = transactions.map((tx) => ({
      insertOne: {
        document: {
          ...tx,
          userId,
          isRecurring: false,
          nextRecurringDate: null,
          recurringInterval: null,
          lastProcesses: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      },
    }));

    const result = await Transaction.bulkWrite(bulkOps, {
      ordered: true,
    });

    return {
      insertedCount: result.insertedCount,
      success: true,
    };
  } catch (error) {
    throw error;
  }
};

export const scanReceiptService = async (
  file: Express.Multer.File | undefined
) => {
  if (!file) throw new BadRequestException("No file uploaded");

  try {
    if (!file.path) throw new BadRequestException("failed to upload file");

    console.log(file.path);

    const responseData = await axios.get(file.path, {
      responseType: "arraybuffer",
    });
    const base64String = Buffer.from(responseData.data).toString("base64");

    if (!base64String) throw new BadRequestException("Could not process file");

    const result = await genAI.models.generateContent({
      model: genAIModel,
      contents: [
        createUserContent([
          receiptPrompt,
          createPartFromBase64(base64String, file.mimetype),
        ]),
      ],
      config: {
        temperature: 0,
        topP: 1,
        responseMimeType: "application/json",
      },
    });

    const response = result.text;
    const cleanedText = response?.replace(/```(?:json)?\n?/g, "").trim();

    if (!cleanedText)
      return {
        error: "Could not read reciept  content",
      };

    const data = JSON.parse(cleanedText);

    if (!data.amount || !data.date) {
      return { error: "Reciept missing required information" };
    }

    return {
      title: data.title || "Receipt",
      amount: data.amount,
      date: data.date,
      description: data.description,
      category: data.category,
      paymentMethod: data.paymentMethod,
      type: data.type,
      receiptUrl: file.path,
    };
  } catch (error) {
    return { error: "Reciept scanning  service unavailable" };
  }
};