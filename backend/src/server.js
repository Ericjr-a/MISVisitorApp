import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import guestRoutes from "./routes/guestRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import hostRoutes from "./routes/hostRoutes.js";
import visitorRoutes from "./routes/visitorRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";
import callerRoutes from "./routes/callerRoutes.js";

dotenv.config();
const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    credentials: true,
  })
);

app.use("/css", express.static(path.join(__dirname, "../../frontend/css")));
app.use("/js", express.static(path.join(__dirname, "../../frontend/js")));
app.use("/images", express.static(path.join(__dirname, "../../frontend/images")));
app.use("/html", express.static(path.join(__dirname, "../../frontend/html")));

app.get("/", (req, res) => {
  res.redirect("/html/login.html");
});

app.use("/api/visitors", visitorRoutes);
app.use("/hosts", hostRoutes);
app.use("/guests", guestRoutes);
app.use("/users", userRoutes);
app.use("/api/reports", reportRoutes);
app.use("/calls", callerRoutes);

const PORT = process.env.PORT || 3001;
app.listen(PORT, "0.0.0.0", () => console.log(`Server running on port ${PORT}`));