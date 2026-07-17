import express from "express";
import pg from "pg";
import "dotenv/config";

const app = express();
app.use(express.json());

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

app.get("/", (req, res) => {
  res.send("hello - my api is working");
});

app.get("/products", async (req, res) => {
  const result = await pool.query("select*from products");
  res.send(result.rows);
});
app.get("/products/:id", async (req, res) => {
  const { id } = req.params;
  const result = await pool.query("SELECT * FROM products WHERE id = $1", [id]);
  res.send(result.rows[0]);
});

app.post("/products", async (req, res) => {
  const { title, description, price, quantity } = req.body;
  const result = await pool.query(
    "INSERT INTO products (title, description, price, quantity) VALUES ($1, $2, $3, $4) RETURNING *",
    [title, description, price, quantity],
  );
  res.send(result.rows[0]);
});

app.listen(3000, () => {
  console.log("server is running at http://localhost:3000");
});
