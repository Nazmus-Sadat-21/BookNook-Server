import express from "express";
import { MongoClient, ObjectId } from "mongodb";
import "dotenv/config";
import cors from "cors";
import { createRemoteJWKSet, jwtVerify } from "jose";

const app = express();
const port = process.env.PORT || 8000;

const client = new MongoClient(process.env.MONGO_URI);

export async function connectToMongoDB() {
  try {
    await client.connect();
    console.log("You successfully connected to MongoDB!");
    return client;
  } catch (err) {
    console.error("MongoDB connection error:", err);
  }
}

const mongoClient = await connectToMongoDB();
const db = mongoClient ? mongoClient.db("BookNook") : null;

const AllBooks = db ? db.collection("Books") : null;
const AllBorrows = db ? db.collection("Borrows") : null;

app.use(cors({
  origin: true, // Or specify your frontend production URL
  credentials: true,
}));
app.use(express.json());

// Token verification middleware
const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ msg: "Unauthorized! No token provided." });
  }
  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).send({ msg: "Unauthorized! Invalid token format." });
  }

  const clientUrl = process.env.CLIENT_URL;
  if (!clientUrl) {
    console.error("CLIENT_URL environment variable is missing on the backend!");
    return res.status(500).send({ msg: "Server configuration error: CLIENT_URL missing." });
  }

  try {
    const JWKS = createRemoteJWKSet(new URL(`${clientUrl}/api/auth/jwks`));
    const { payload } = await jwtVerify(token, JWKS);
    req.user = payload; // Attach user info if needed
    next();
  } catch (error) {
    console.error("JWT Verification failed:", error);
    return res.status(401).send({ msg: "Unauthorized! Token verification failed." });
  }
};

app.get("/", (req, res) => {
  res.send("BookNook Backend Server is running!");
});

app.post("/add-book", verifyToken, async (req, res) => {
  try {
    const data = req.body;
    const result = await AllBooks.insertOne(data);
    res.status(201).send(result);
  } catch (error) {
    res.status(500).send({ message: "Failed to add book" });
  }
});

app.get("/books", async (req, res) => {
  try {
    const result = await AllBooks.find().toArray();
    res.send(result);
  } catch (error) {
    res.status(500).send({ message: "Failed to fetch books" });
  }
});

app.get("/books/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
      return res.status(400).send({ message: "Invalid book ID" });
    }
    const result = await AllBooks.findOne({ _id: new ObjectId(id) });
    if (!result) return res.status(404).send({ message: "Book not found" });
    res.send(result);
  } catch (error) {
    res.status(500).send({ message: "Failed to fetch book details" });
  }
});

app.get("/my-books/:email", verifyToken, async (req, res) => {
  try {
    const { email } = req.params;
    const result = await AllBooks.find({ contributorEmail: email }).toArray();
    res.send(result);
  } catch (error) {
    res.status(500).send({ message: "Failed to fetch user books" });
  }
});

app.delete("/books/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
      return res.status(400).send({ message: "Invalid book ID" });
    }
    const result = await AllBooks.deleteOne({ _id: new ObjectId(id) });
    res.json(result);
  } catch (error) {
    res.status(500).send({ message: "Failed to delete book" });
  }
});

app.patch("/books/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid book ID format" });
    }

    const { _id, ...updatedData } = req.body;

    const result = await AllBooks.updateOne(
      { _id: new ObjectId(id) },
      { $set: updatedData },
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

app.get("/featured-books", async (req, res) => {
  try {
    const result = await AllBooks.find()
      .sort({ createdAt: -1 })
      .limit(6)
      .toArray();
    res.send(result);
  } catch (error) {
    res.status(500).send({ message: "Failed to fetch featured books" });
  }
});

app.post("/add-borrows", verifyToken, async (req, res) => {
  try {
    const {
      bookId,
      bookTitle,
      bookCover,
      userEmail,
      userName,
      borrowDate,
      returnDate,
    } = req.body;

    if (!bookId || !userEmail) {
      return res.status(400).json({ message: "Book ID and User Email are required." });
    }

    // FIXED: Check against AllBorrows collection instead of AllBooks
    const existingBorrow = await AllBorrows.findOne({ bookId, userEmail });
    if (existingBorrow) {
      return res.status(400).json({ message: "You have already borrowed this book." });
    }

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

    await AllBooks.updateOne(
      { _id: new ObjectId(bookId) },
      { $inc: { copies: -1 } },
    );

    res.status(201).json({ success: true, result });
  } catch (error) {
    console.error("Error adding borrow record:", error);
    res.status(500).json({ message: "Server error while creating borrow record." });
  }
});

app.get("/my-borrows/:email", verifyToken, async (req, res) => {
  try {
    const { email } = req.params;
    const result = await AllBorrows.find({ userEmail: email }).toArray();
    res.send(result);
  } catch (error) {
    res.status(500).send({ message: "Failed to fetch borrows" });
  }
});

app.delete("/borrows/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid borrow ID" });
    }

    const borrowRecord = await AllBorrows.findOne({ _id: new ObjectId(id) });
    if (!borrowRecord) {
      return res.status(404).json({ success: false, message: "Borrow record not found" });
    }

    const result = await AllBorrows.deleteOne({ _id: new ObjectId(id) });

    if (borrowRecord.bookId) {
      await AllBooks.updateOne(
        { _id: new ObjectId(borrowRecord.bookId) },
        { $inc: { copies: 1 } },
      );
    }

    res.status(200).json({ success: true, result });
  } catch (error) {
    console.error("Error returning book:", error);
    res.status(500).json({ success: false, message: "Server error while returning book" });
  }
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}/`);
});

export default app;