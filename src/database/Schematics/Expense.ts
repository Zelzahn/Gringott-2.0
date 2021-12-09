import { Schema, model, Types } from "mongoose";
import { Item } from "./Item";
import { User } from "./User";
import { reqString, itemValue } from "./Common";

export interface IExpense {
  guildId: String;
  from: Types.ObjectId;
  to: Types.ObjectId;
  item: Object;
  description: String;
  isDeleted: boolean;
}

const expenseSchema = new Schema<IExpense>({
  guildId: reqString,
  from: { type: Schema.Types.ObjectId, ref: User, required: true },
  to: { type: Schema.Types.ObjectId, ref: User, required: true },
  item: {
    type: {
      type: String,
      enum: ["item", "custom"],
      required: true,
    },
    custom: {
      type: Number,
      value: itemValue,
      required: function () {
        this.type === "custom";
      },
    },
    item: {
      type: Schema.Types.ObjectId,
      ref: Item,
      required: function () {
        this.type === "item";
      },
    },
  },
  description: reqString,
  isDeleted: { type: Boolean, required: false, default: false },
});

export const Expense = model<IExpense>("expense", expenseSchema);
