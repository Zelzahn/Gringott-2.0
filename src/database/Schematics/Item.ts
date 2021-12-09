import { Schema, model } from "mongoose";
import { reqString, itemValue } from "./Common";

export interface IItem {
  guildId: string;
  title: string;
  value: number;
  description: string;
  isDeleted: boolean;
}

const itemSchema = new Schema<IItem>({
  guildId: reqString,
  title: reqString,
  value: itemValue,
  description: { type: String },
  isDeleted: { type: Boolean, default: false },
});
itemSchema.index({ title: 1 }, { unique: true });

export const Item = model<IItem>("item", itemSchema);
