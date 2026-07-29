import express from "express";
import pg from "pg";
import "dotenv/config";
import OpenAI from "openai";

const openai = new OpenAI();
async function embedding(text) {
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
  });
  return response.data[0].embedding;
}

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
  const embed = await embedding(description);
  const vectorString = JSON.stringify(embed);
  // pgvector doesn't accept arrays,so I convert "embed" to string style
  const result = await pool.query(
    "INSERT INTO products (title, description, price, quantity,embedding) VALUES ($1, $2, $3, $4, $5) RETURNING *",
    [title, description, price, quantity, embed],
  );
  res.send(result.rows[0]);
});

app.listen(3000, () => {
  console.log("server is running at http://localhost:3000");
});
