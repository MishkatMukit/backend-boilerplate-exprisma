import { Router } from "express";
import { exampleController } from "./example.controller";

const router = Router();

router.get("/", exampleController.getAll);

export const exampleRoutes = router;
