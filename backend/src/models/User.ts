import { Schema, model, type HydratedDocument } from 'mongoose'
import bcrypt from 'bcryptjs'

export interface UserDoc {
  email: string
  passwordHash: string
  createdAt: Date
}

const userSchema = new Schema<UserDoc>({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  createdAt: { type: Date, default: () => new Date() },
})

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10)
}

export async function comparePassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash)
}

export type UserDocument = HydratedDocument<UserDoc>

export const User = model<UserDoc>('User', userSchema)
