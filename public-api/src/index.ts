import express from "express";
import cors from "cors";
import { config } from "dotenv";
import { collectRouter } from "./routes/collect";
import { formsRouter } from "./routes/forms";
import { submissionsRouter } from "./routes/submissions";
import { healthRouter } from "./routes/health";
import { authMiddleware } from "./middleware/auth";

config();

const app = express();
const PORT = process.env.PORT || 1400;

// Middleware
app.use(cors({ origin: "*" }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Public routes (no auth required)
app.use("/", healthRouter);
app.use("/f", collectRouter);

// Protected routes (auth required)
app.use("/forms", authMiddleware, formsRouter);
app.use("/", authMiddleware, submissionsRouter);

app.listen(PORT, () => {
  console.log(`FormDrop API running on port ${PORT}`);
});
