import mongoose from "mongoose";
import { Expense } from "./Schematics/Expense";
import { Item } from "./Schematics/Item";
import { User } from "./Schematics/User";

mongoose.connect(process.env.MONGODB_URL ?? "");
// .then(() => logger.log("info", "Connected to DB"))
// .catch((err) => {
//   logger.log("error", `Cannot connect to DB: ${err}`);
// });

//#region User
export const getUsers = async (guildId: string) => await User.find({ guildId });

export const getUserId = async (userId: string, guildId: string) => {
  const user = await User.findOne({ guildId, userId }, "_id");

  if (user === null) return await User.create({ guildId, userId });

  return user;
};

export const doesUserExist = async (guildId: string, userId: string) =>
  await User.exists({ guildId, userId });
//#endregion

//#region Items
export const doesItemExist = async (guildId: string, title: string) =>
  await Item.exists({ guildId, title });

export const getItems = async (guildId: string) =>
  await Item.find({ guildId, isDeleted: false });

export const getAllItems = async (guildId: string) =>
  await Item.find({ guildId });

export const getItem = async (guildId: string, title: string) =>
  await Item.findOne({ guildId, title });

const getItemById = async (_id: string) => await Item.findOne({ _id });

export const createItem = async (
  guildId: string,
  title: string,
  value: Number,
  description: string
) => {
  return await Item.create({ guildId, title, value, description }).catch(
    (e) => {
      throw new Error(e);
    }
  );
};

export const updateItem = async (
  guildId: string,
  title?: string,
  value?: number,
  description?: string
) => {
  return await Item.updateOne({ guildId, title, value, description }).catch(
    (e) => {
      throw new Error(e);
    }
  );
};

export const deleteItem = async (guildId: string, title: string) =>
  await Item.findOneAndUpdate(
    { guildId, title },
    { isDeleted: true },
    { upsert: true }
  ).catch((e: string) => {
    console.log("e :>> ", e);
    throw new Error(e);
  });
//#endregion

//#region Expenses
export const createExpense = async (
  guildId: string,
  recipient: string,
  payers: string[],
  item: { type: string; custom?: Number; item?: string },
  description: string
) => {
  payers.forEach(
    async (payer: string) =>
      await Expense.create({
        guildId,
        from: recipient,
        to: payer,
        item,
        description,
      }).catch((e: string) => {
        console.log("e :>> ", e);
        throw new Error(e);
      })
  );
};

export const getAllExpenses = async (guildId: string) => {
  const expenses = await Expense.find({ guildId, isDeleted: false })
    .populate("from")
    .populate("to");

  const items = await getAllItems(guildId);
  return await Promise.all(
    expenses.map(async (expense: any) => ({
      ...expense.toObject(),
      ...(expense.item.type === "item" &&
        items.some((item) => item._id === expense.item!.item) && {
          item: {
            type: "item",
            title: items.filter((item) => item._id === expense.item!.item)[0]
              .title,
          },
        }),
    }))
  );
};

export const payBack = async (guildId: string, userId: string) =>
  await Expense.updateMany(
    { guildId, from: userId },
    { isDeleted: true },
    { upsert: true }
  ).catch((e: string) => {
    console.log("e :>> ", e);
    throw new Error(e);
  });
//#region
