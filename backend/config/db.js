import mongoose from "mongoose";

export const connectDB = async () => {
  await mongoose
    .connect(
      "mongodb+srv://RakinVaya:rakin12345@cluster0.bciwcxg.mongodb.net/SD2-PROJECT"
    )
    .then(() => {
      console.log("DB connected");
    });
};
