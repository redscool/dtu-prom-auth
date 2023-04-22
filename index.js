import express from "express";
import cors from "cors";
import _db from "./util/db.js";
import router from "./router/index.js";

const app = express();

const PORT = process.env.PORT || 5000;

app.use(express.json({ limit: "1mb", extended: true }));
app.use(express.urlencoded({ limit: "1mb", extended: true }));

app.use(cors());

app.use(router);

app.listen(PORT, () => {
  console.log(`Server starting in port: ${PORT}`);
});
