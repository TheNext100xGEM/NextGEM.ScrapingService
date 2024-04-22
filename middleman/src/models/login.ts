import mongoose, { Document, Schema } from 'mongoose';

// Define the interface for User document
interface LoginDoc extends Document {
  username: string;
  password: string;
}

// Define the schema for User
const LoginSchema = new Schema<LoginDoc>({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true }
});

// Define and export the User model
const LoginModel = mongoose.model<LoginDoc>('Login', LoginSchema);

export default LoginModel;
