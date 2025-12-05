import dotenv from "dotenv";
dotenv.config();
import express from "express";
import cors from "cors";
import { connectDB } from "./config/db.js";
import foodRouter from "./routes/foodRoute.js";
import userRouter from "./routes/userRoute.js";
import "dotenv/config";
import cartRouter from "./routes/cartRoute.js";
import orderRouter from "./routes/orderRoute.js";

// console.log("MONGO_URL:", process.env.MONGO_URL);
// console.log("JWT_SECRET:", process.env.JWT_SECRET);

//app config
const app = express();
const port = 4000;

// middleware
app.use(express.json());
app.use(cors());

//db connection
connectDB();

//api enddpoints
app.use("/api/food", foodRouter);
app.use("/images", express.static("uploads"));
app.use("/api/user", userRouter);
app.use("/api/cart", cartRouter);
app.use("/api/order", orderRouter);

app.get("/", (req, res) => {
  res.send("API working");
});

app.listen(port, () => {
  console.log(`Server started on http://localhost:${port}`);
});
