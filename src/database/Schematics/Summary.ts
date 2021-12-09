import { Schema, model, Types } from "mongoose";
import { User } from "./User";

export interface Record {
  user: Types.ObjectId;
  amount: Number;
}

const summarySchema = new Schema<Record[]>([
  {
    user: { type: Schema.Types.ObjectId, ref: User, required: true },
    amount: { type: Number, required: true },
  },
]);

export const Summary = model<Record[]>("summary", summarySchema);
