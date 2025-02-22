import { config } from "dotenv";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import fileUpload from "express-fileupload";
import { connection } from "./database/connection.js";
import { errorMiddleware } from "./middlewares/error.js";
import userRouter from "./router/userRoutes.js";
import auctionItemRouter from "./router/auctionItemRoutes.js";
import bidRouter from "./router/bidRoutes.js";
import commissionRouter from "./router/commissionRouter.js";
import superAdminRouter from "./router/superAdminRoutes.js";
import { endedAuctionCron } from "./automation/endedAuctionCron.js";

const app = express();

// Load environment variables from the config file
config({
  path: "./config/config.env",
});

// Serve static files from the 'dist' directory
app.use(express.static("dist"));

// CORS configuration
const allowedOrigins = [
  "http://localhost:5173",
  "https://fe-auctionbidding.netlify.app", // No trailing slash
];

app.use(
  cors({
    origin: function (origin, callback) {
      console.log("Incoming origin:", origin); // Log incoming origin
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.warn(`Blocked by CORS: ${origin}`); // Log blocked origins
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true, // Allow credentials (cookies, authorization headers)
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], // Allowed methods
    allowedHeaders: ["Content-Type", "Authorization"], // Allowed headers
  })
);

// Explicitly handle OPTIONS requests
app.options("*", cors());

// Middleware for parsing cookies
app.use(cookieParser());

// Middleware for parsing JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Middleware for handling file uploads
app.use(
  fileUpload({
    useTempFiles: true,
    tempFileDir: "/tmp/",
  })
);

// Routes
app.use("/api/v1/user", userRouter);
app.use("/api/v1/auctionitem", auctionItemRouter);
app.use("/api/v1/bid", bidRouter);
app.use("/api/v1/commission", commissionRouter);
app.use("/api/v1/superadmin", superAdminRouter);

// Test endpoints
app.get("/me", (req, res) => {
  res.json({ message: "Success" });
});

app.get("/leaderboard", (req, res) => {
  res.json({ message: "Success" });
});

// Start the cron job for ended auctions
endedAuctionCron();

// Connect to the database
connection();

// Error handling middleware
app.use(errorMiddleware);

export default app;
