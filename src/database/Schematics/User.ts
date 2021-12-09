import { Schema, model } from "mongoose";
import { reqString } from "./Common";

export interface IUser {
  guildId: string;
  userId: string;
  paymentInformation?: string;
}

const userSchema = new Schema<IUser>({
  guildId: reqString,
  userId: reqString,
  paymentInformation: { type: String },
});
userSchema.index({ guildId: 1, userId: 1 }, { unique: true });

export const User = model<IUser>("user", userSchema);
