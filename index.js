import express from "express";
import { MongoClient } from "mongodb";
import "dotenv/config";
import cors from "cors"
const app = express();
const port = process.env.PORT;


const client = new MongoClient(process.env.MONGO_URI);

export async function connectToMongoDB() {
  try {
    await client.connect();
    console.log("You successfully connected to MongoDB!");
    return client;
  } catch (err) {
    console.dir(err);
  }
}

connectToMongoDB();

app.use(cors());
app.use(express.json())



app.get("/", (req, res) => {
  console.log("hello");
  res.send("hello");
});

app.listen(port, () => {
  console.log(`server is running at http://localhost:${port}/`);
});
