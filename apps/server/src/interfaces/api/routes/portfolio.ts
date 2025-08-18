import { Router } from "express";

import portfolioController from "@/interfaces/api/controllers/portfolioController";
import { protect } from "@/interfaces/api/middleware/auth";

const router = Router();

router.use(protect);

router.get("/", portfolioController.getSnapshots);

export default router;