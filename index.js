import express from "express";
import { MongoClient, ObjectId } from "mongodb";
import "dotenv/config";
import cors from "cors";
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
const mongoClient = await connectToMongoDB();
const db = await mongoClient.db("BookNook");

const AllBooks = db.collection("Books");

app.use(cors());
app.use(express.json());

//http://localhost:800/
//http://localhost:8000/add-book
//http://localhost:8000/books
//http://localhost:8000/books/:id
//http://localhost:8000/my-books
//http://localhost:8000/my-borrows

// const verifyToken = async (req, res, next) => {
//   const authHeader = req.headers.authorization;
//   if (!authHeader) {
//     return res.status(401).send({ msg: "Unauthorized!" });
//   }
//   const token = authHeader.split(" ")[1];
//   if (!token) {
//     return res.status(401).send({ msg: "Unauthorized!" });
//   }

//   const JWKS = createRemoteJWKSet(
//     new URL(`${process.env.CLIENT_URL}/api/auth/jwks`),
//   );

//   try {
//     const { payload } = await jwtVerify(token, JWKS);
//     next();
//   } catch (error) {
//     return res.status(500).send({ msg: "Server Error!" });
//   }
// };

app.post("/add-book", async (req, res) => {
  const data = req.body;
  const result = await AllBooks.insertOne(data);
  res.send(result);
});

app.get("/books", async (req, res) => {
try {
    const result = await AllBooks.find().toArray();
    res.send(result);
  } catch (error) {
    res.status(500).send({ message: "Failed to fetch books" });
  }
});

app.get("/books/:id", async (req,res)=>{
  const {id}  = req.params;
  const result = await AllBooks.findOne({
    _id : new ObjectId(id)
  })
  res.send(result)
})




app.listen(port, () => {
  console.log(`server is running at http://localhost:${port}/`);
});
