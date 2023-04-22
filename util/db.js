import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const USER = process.env.DB_USER;
const PASSWORD = process.env.DB_PASSWORD;

const URL = `mongodb+srv://${USER}:${PASSWORD}@cluster0.d1e6zhy.mongodb.net/?retryWrites=true&w=majority`;
mongoose.connect(URL, { dbName: "COMMON_DB" });

const db = mongoose.connection;

db.on("error", (err) => {
  console.log("Error connecting to database", err);
});

db.once("open", function () {
  console.log("Connected to database...");
});

export default db;
