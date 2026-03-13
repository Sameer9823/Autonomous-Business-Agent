import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  image?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name:     { type: String, required: true, trim: true },
    email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6 },
    image:    { type: String },
  },
  { timestamps: true }
);

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
export default User;
