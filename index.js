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

app.get("/products", async (req, res, next) => {
  try {
    // pagination to manage the number of results returned.
    const limitation = Number(req.query.limit) || 20;
    const offset = Number(req.query.offset) || 0;

    // sorting
    const allowSorts = ["id", "title", "quantity", "price"];
    const sort = allowSorts.includes(req.query.sort) ? req.query.sort : "id";
    const result = await pool.query(
      `SELECT id, title, description, price, quantity FROM products ORDER BY ${sort} LIMIT $1 OFFSET $2`,
      [limitation, offset],
    );
    res.send(result.rows);
  } catch (err) {
    next(err);
  }
});

app.get("/products/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      "SELECT id, title, description, price, quantity FROM products WHERE id = $1",
      [id],
    );
    if (!result.rows[0]) {
      res.status(404).send({ error: "couldn't find the product" });
    } else {
      res.send(result.rows[0]);
    }
  } catch (err) {
    next(err);
  }
});

app.post("/products/bulk", async (req, res, next) => {
  try {
    const products = req.body;
    // check the error first(validation check);avoid half-inserts.
    for (const p of products) {
      if (!p.title || !p.description || !p.price || !p.quantity) {
        return res.status(400).send({
          error:
            "Please fill in all important information,such as title, price, etc.",
        });
      }
    }

    const inserted = [];
    for (const p of products) {
      const embed = await embedding(p.description);
      const vectorString = JSON.stringify(embed);
      // pgvector doesn't accept arrays,so I convert "embed" to string style
      const result = await pool.query(
        "INSERT INTO products (title, description, price, quantity,embedding) VALUES ($1, $2, $3, $4, $5) RETURNING *",
        [p.title, p.description, p.price, p.quantity, vectorString],
      );
      inserted.push(result.rows[0]);
    }
    res.send(inserted);
  } catch (err) {
    next(err);
  }
});

app.get("/search", async (req, res, next) => {
  try {
    const questions = req.query.q;
    const searchProduct = await embedding(questions);
    const searchVector = JSON.stringify(searchProduct);
    const result = await pool.query(
      "SELECT id, title, description FROM products ORDER BY embedding <=> $1 LIMIT 5",
      [searchVector],
    );
    res.send(result.rows);
  } catch (err) {
    next(err);
  }
});

app.delete("/products/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const deleteProduct = await pool.query(
      "DELETE FROM products WHERE id=$1  RETURNING *",
      [id],
    );
    res.send(deleteProduct.rows);
  } catch (err) {
    next(err);
  }
});

app.put("/products/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, price, quantity } = req.body;
    const updateInfo = await pool.query(
      "UPDATE products SET title=$1,description = $2, price = $3, quantity = $4  WHERE id=$5 RETURNING*",
      [title, description, price, quantity, id],
    );
    res.send(updateInfo.rows);
  } catch (err) {
    next(err);
  }
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).send({ error: "something went wrong" });
});
app.listen(3000, () => {
  console.log("server is running at http://localhost:3000");
});
