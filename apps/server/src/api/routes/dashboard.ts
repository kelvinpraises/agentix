import { Router } from "express";

const router = Router();

const snapshots = [
  {
    id: 1,
    total_value: 1247.83,
    total_pnl: 28.5,
    pnl_percentage: 2.3,
    vs_inflation_performance: 1.5,
    snapshot_date: "2025-07-14",
  },
  {
    id: 2,
    total_value: 1219.33,
    total_pnl: -10.2,
    pnl_percentage: -0.8,
    vs_inflation_performance: -1.6,
    snapshot_date: "2025-07-13",
  },
  {
    id: 3,
    total_value: 1229.53,
    total_pnl: 15.7,
    pnl_percentage: 1.3,
    vs_inflation_performance: 0.5,
    snapshot_date: "2025-07-12",
  },
];

router.get("/dashboard", (_req, res) => {
  res.json({ snapshots });
});

export default router;
