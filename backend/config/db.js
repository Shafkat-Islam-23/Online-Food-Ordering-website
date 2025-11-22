import mongoose from "mongoose";

export const connectDB = async () => {
  await mongoose
    .connect(
     //  db connection string 
    )
    .then(() => {
      console.log("DB connected");
    });
};
