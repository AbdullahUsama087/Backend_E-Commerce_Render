import mongoose from "mongoose";

async function DbConnection() {
  return await mongoose
    .connect(process.env.CONNECTION_DB_CLOUD)
    .then((res) => console.log("Database connection established successfully"))
    .catch((err) => console.error("Fail to connect to Database", err));
}

export default DbConnection;
