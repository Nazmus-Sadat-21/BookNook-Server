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
//http://localhost:8000//featured-books

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

app.get("/my-books/:email", async (req,res)=>{
  const {email} = req.params;
  const result = await AllBooks.find({contributorEmail: email}).toArray()
  res.send(result)
})

app.delete("/books/:id", async (req,res)=>{
  const { id } = req.params;
  const result = await AllBooks.deleteOne({
    _id: new ObjectId(id),
  });
  res.json(result);
})

// app.patch("/books/:id",  async (req, res) => {
//   const { id } = req.params;
//   const data = req.body;
//   const result = await AllBooks.updateOne(
//     { _id: new ObjectId(id) },
//     { $set: data },
//   );
//   res.json(result);
// });

app.patch("/books/:id", async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid book ID format" });
    }

    const { _id, ...updatedData } = req.body;

    const result = await AllBooks.updateOne(
      { _id: new ObjectId(id) },
      { $set: updatedData }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ success: false, message: "Book not found" });
    }

    res.status(200).json({ success: true, result });
  } catch (error) {
    console.error("Backend error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

app.get("/featured-books", async (req,res)=>{
  const result = await AllBooks.find().sort({ createdAt: -1 }).limit(6).toArray()
  res.send(result)
})


app.listen(port, () => {
  console.log(`server is running at http://localhost:${port}/`);
});
