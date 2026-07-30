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
    [title, description, price, quantity, vectorString],
  );
  res.send(result.rows[0]);
});
app.get("/search", async (req, res) => {
  const questions = req.query.q;
  const searchProduct = await embedding(questions);
  const searchVector = JSON.stringify(searchProduct);
  const result = await pool.query(
    "SELECT id, title, description FROM products ORDER BY embedding <=> $1 LIMIT 5",
    [searchVector],
  );
  res.send(result.rows);
});

app.delete("/products/:id", async (req, res) => {
  const { id } = req.params;
  const deleteProduct = await pool.query(
    "DELETE FROM products WHERE id=$1  RETURNING *",
    [id],
  );
  res.send(deleteProduct.rows);
});

app.put("/products/:id", async (req, res) => {
  const { id } = req.params;
  const { title, description, price, quantity } = req.body;
  const updateInfo = await pool.query(
    "UPDATE products SET title=$1,description = $2, price = $3, quantity = $4  WHERE id=$5 RETURNING*",
    [title, description, price, quantity, id],
  );
  res.send(updateInfo.rows);
});

app.listen(3000, () => {
  console.log("server is running at http://localhost:3000");
});
