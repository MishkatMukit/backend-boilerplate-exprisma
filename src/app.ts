import express, { type Application, type Request, type Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import config from "./config";
import { globalErrorHandler } from "./middleware/globalErrorHandler";
import { routeHandler } from "./middleware/routerHandler";
import { exampleRoutes } from "./modules/example/example.route";

const app: Application = express();

app.use(
  cors({
    origin: config.app_url,
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get("/", async (req: Request, res: Response) => {
  res.json({
    message: "Server is running",
    author : "Mishakt Mahabub"
  });
});

app.use("/api/example", exampleRoutes);

app.use(globalErrorHandler);
app.use(routeHandler);

export default app;
