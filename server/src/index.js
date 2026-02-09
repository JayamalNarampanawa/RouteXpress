import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import locationRoutes from "./routes/locationRoutes.js";
import roadRoutes from "./routes/roadRoutes.js";
import routeRoutes from "./routes/routeRoutes.js";




dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/locations", locationRoutes);
app.use("/api/roads", roadRoutes);
app.use("/api/routes", routeRoutes);


app.get("/", (req, res) => {
  res.json({ message: "RouteXpress API is running" });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

startServer();