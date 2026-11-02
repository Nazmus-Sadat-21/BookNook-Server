import express from "express";
import { MongoClient, ObjectId } from "mongodb";
import "dotenv/config";
import cors from "cors";
import { createRemoteJWKSet, jwtVerify } from "jose";
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
const AllBorrows = db.collection("Borrows");

app.use(cors());
app.use(express.json());

//http://localhost:800/
//http://localhost:8000/add-book
//http://localhost:8000/books
//http://localhost:8000/books/:id
//http://localhost:8000/my-books:email
//http://localhost:8000/my-borrows
//http://localhost:8000/my-borrows/:email
//http://localhost:8000/add-borrows
//http://localhost:8000//borrows/:id
//http://localhost:8000//featured-books

const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ msg: "Unauthorized!" });
  }
  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).send({ msg: "Unauthorized!" });
  }

  const JWKS = createRemoteJWKSet(
    new URL(`${process.env.CLIENT_URL}/api/auth/jwks`),
  );

  try {
    const { payload } = await jwtVerify(token, JWKS);
    console.log(payload)
    next();
  } catch (error) {
    return res.status(500).send({ msg: "Server Error!" });
  }
};

app.post("/add-book", verifyToken, async (req, res) => {
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

app.get("/books/:id", verifyToken, async (req,res)=>{
  const {id}  = req.params;
  const result = await AllBooks.findOne({
    _id : new ObjectId(id)
  })
  res.send(result)
})

app.get("/my-books/:email", verifyToken, async (req,res)=>{
  const {email} = req.params;
  const result = await AllBooks.find({contributorEmail: email}).toArray()
  res.send(result)
})

app.delete("/books/:id",verifyToken, async (req,res)=>{
  const { id } = req.params;
  const result = await AllBooks.deleteOne({
    _id: new ObjectId(id),
  });
  res.json(result);
})




app.patch("/books/:id", verifyToken,  async (req, res) => {
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



app.post("/add-borrows", verifyToken, async (req, res) => {
  try {
    const { bookId, bookTitle, bookCover, userEmail, userName, borrowDate, returnDate } = req.body;

    if (!bookId || !userEmail) {
      return res.status(400).json({ message: "Book ID and User Email are required." });
    }

    // 1. Prevent duplicate borrow by the same user
    const existingBorrow = await AllBooks.findOne({ bookId, userEmail });
    if (existingBorrow) {
      return res.status(400).json({ message: "You have already borrowed this book." });
    }

    // 2. Insert into borrows collection
    const newBorrow = {
      bookId,
      bookTitle,
      bookCover,
      userEmail,
      userName,
      borrowDate: new Date(borrowDate),
      returnDate: new Date(returnDate),
      createdAt: new Date(),
    };

    const result = await AllBorrows.insertOne(newBorrow);

    // 3. Optional: Decrement available copies count in the AllBooks collection
    await AllBooks.updateOne(
      { _id: new ObjectId(bookId) },
      { $inc: { copies: -1 } }
    );

    res.status(201).json({ success: true, result });
  } catch (error) {
    console.error("Error adding borrow record:", error);
    res.status(500).json({ message: "Server error while creating borrow record." });
  }
});

app.get("/my-borrows/:email", verifyToken,async (req,res)=>{
  const {email} = req.params;
  const result = await AllBorrows.find({userEmail: email}).toArray()
  res.send(result)
})

app.delete("/borrows/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    const borrowRecord = await AllBorrows.findOne({ _id: new ObjectId(id) });
    
    const result = await AllBorrows.deleteOne({ _id: new ObjectId(id) });

    if (borrowRecord.bookId) {
      await AllBooks.updateOne(
        { _id: new ObjectId(borrowRecord.bookId) },
        { $inc: { copies: 1 } }
      );
    }

    res.status(200).json({ success: true, result });
  } catch (error) {
    console.error("Error returning book:", error);
    res.status(500).json({ success: false, message: "Server error while returning book" });
  }
});


app.listen(port, () => {
  console.log(`server is running at http://localhost:${port}/`);
});
