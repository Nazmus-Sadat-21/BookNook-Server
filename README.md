<div align="center">

  # ⚙️ BookNook Server — RESTful API Engine

  *Lightweight, high-performance Node.js / Express backend powering the BookNook digital library.*

  [Frontend Client Repository](https://github.com/your-username/booknook-client)

</div>

---

## 🛠️ Overview

The **BookNook Server** provides secure, protected API endpoints for catalog management, user borrow tracking, and inventory concurrency control. Built with Express.js and MongoDB, it implements strict JWT authorization checks and atomic `$inc` updates to maintain real-time copy availability.

---

## ⚡ Core API Features

- 🔐 **JWT Route Protection**: Secured header authorization (`Bearer <token>`) verifying requests issued by Better Auth.
- 📦 **Atomic Inventory Decrements**: Prevents race conditions during borrowing using MongoDB `$inc` operators (`copies: -1` on borrow, `copies: 1` on return).
- 🛡️ **No Double Borrow Guard**: Rejects duplicate borrow attempts for identical volumes by the same user.
- 📑 **Dynamic MongoDB Queries**: Optimized sorting and limits for `New Arrivals` and single-document population.

---

## 📡 API Reference & Endpoints

| Method | Endpoint | Protection | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/books` | Public | Fetch all archived books |
| `GET` | `/books/:id` | Public / Auth | Fetch complete details for a single volume |
| `POST` | `/add-book` | **Protected** | Catalog a new book into the database |
| `PATCH` | `/books/:id` | **Protected** | Update title, author, category, or synopsis of an owned volume |
| `DELETE` | `/books/:id` | **Protected** | Remove a volume permanently from the archive |
| `POST` | `/borrows` | **Protected** | Request a 7-day loan (decrements `copies` by 1) |
| `GET` | `/borrows` | **Protected** | Fetch all active borrows for the logged-in user |
| `DELETE` | `/borrows/:id` | **Protected** | Return a volume (increments `copies` by 1 & deletes borrow record) |

---

## 🚀 Server Installation & Setup

### Prerequisites
- Node.js `v18.x` or higher
- MongoDB connection string (Atlas or local instance)

### Setup Steps

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/booknook-server.git
   cd booknook-server
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Create a `.env` file in the root directory:
   ```env
   PORT=8000
   MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/BookNook?retryWrites=true&w=majority
   JWT_SECRET=your_jwt_secret_key
   CLIENT_URL=http://localhost:3000
   ```

4. **Start the server:**
   ```bash
   # Development mode with auto-reload
   npm run dev

   # Production mode
   npm start
   ```

---

## 📂 Project Structure

```text
server/
├── config/
│   └── db.js               # MongoDB connection client setup
├── middleware/
│   └── verifyJWT.js        # Bearer token validation middleware
├── routes/
│   ├── books.js            # Book CRUD endpoints
│   └── borrows.js          # Borrow & Return workflow logic
├── index.js                # Express app entry point & CORS configuration
└── package.json
```

---

## 📝 License

Distributed under the MIT License. See `LICENSE` for more information.