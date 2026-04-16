import dotenv from "dotenv";
import app from "./app.js";
import connectDB from "./db/db.js";
dotenv.config({
  path: "./.env",
});

const port = process.env.PORT || 8000;

connectDB()
  .then(() => {
    app.listen(port, () => {
      console.log(`listening on the port: http://localhost:${port}`);
    });
  })
  .catch((err) => {
    console.error("MONGODB error: ", err);
  });
