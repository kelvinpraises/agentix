import { Router } from "express";

import portfolioController from "@/controllers/portfolioController";
import { protect } from "@/middleware/auth";

const router = Router();

router.use(protect);

router.get("/", portfolioController.getSnapshots);

export default router;
