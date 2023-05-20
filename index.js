const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.rjusk2x.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    const toyCollection = client.db("toys-collection").collection("toy");

   
    // get data from database to client side
    app.get("/toys", async (req, res) => {
      const { searchTerm } = req.query;

      let query = {};
      if (searchTerm) {
        query = {
          $or: [
            { name: { $regex: searchTerm, $options: "i" } },
            { category: { $regex: searchTerm, $options: "i" } },
            { subCategory: { $regex: searchTerm, $options: "i" } },
            { description: { $regex: searchTerm, $options: "i" } },
          ],
        };
      }

      const cursor = toyCollection.find(query);
      const toys = await cursor.toArray();
      res.send(toys);
    });

    // post data to database from client side
    app.post("/toys", async (req, res) => {
      const newToy = req.body;
      const result = await toyCollection.insertOne(newToy);
      console.log("Got new toy", req.body);
      console.log("Added toy", result);
      res.json(result);
    });

    // my toys section

    // get data by email from database to client side
    app.get("/myToys/:email", async (req, res) => {
      const toys = await toyCollection
        .find({
          email: req.params.email,
        })
        .toArray();
      res.send(toys);
    });

    // delete data from database from client side
    app.delete("/deleteToys/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id)  };
      const result = await toyCollection.deleteOne(query);
      console.log("Deleted toy", result);
      res.json(result);
    });

    //  update data from database from client side
    app.patch("/updateDetails/:id", async (req, res) => {
      const id = req.params.id;
      const body = req.body;
      const query = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          price: body.price,
          quantity: body.quantity,
          description: body.description,
        },
      };
      const result = await toyCollection.updateOne(query, updateDoc);
      res.status(200).send(result);
    });
    // shorting data from database from client side
    app.get("/myToys/:email/sortByPrice/:sortOrder", async (req, res) => {
      const email = req.params.email;
      const sortOrder = req.params.sortOrder === "desc" ? -1 : 1;

      try {
        const toys = await toyCollection
          .find({ email })
          .sort({ price: sortOrder })
          .toArray();
        res.send(toys);
      } catch (error) {
        console.error("Error fetching sorted toys:", error);
        res.status(500).send("An error occurred while fetching sorted toys.");
      }
    });

    // get categories and delete duplicate categories
    app.get("/categories", async (req, res) => {
      const toys = await toyCollection.find().toArray();
      const categories = toys.map((toy) => toy.category);
      const uniqueCategories = [...new Set(categories)];
      res.send(uniqueCategories);
    });

    app.get("/toys/:category", async (req, res) => {
      const category = req.params.category;
      const toys = await toyCollection.find({ category: category }).toArray();
      res.send(toys);
    });


     // Send a ping to confirm a successful connection
     await client.db("admin").command({ ping: 1 });
     console.log(
       "Pinged your deployment. You successfully connected to MongoDB!"
     );
 
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Toys Market place");
});
app.listen(port, () => {
  console.log(`Toys Market place server is running on port: ${port}`);
});
