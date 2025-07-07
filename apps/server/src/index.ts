import cors from "cors";
import dotenv from "dotenv";
import express from "express";


dotenv.config();

const app = express();

app.use(cors({ origin: true }));
app.use(express.json());

const BACKEND_PORT = 4848;

if (!process.env.BACKEND_PORT) {
  console.warn(`⚠️ [agentix-server]: BACKEND_PORT is not set, using default port ${BACKEND_PORT}`);
}

app.listen(BACKEND_PORT, () => {
  console.log(`🤖 [agentix-server]: running at http://localhost:${BACKEND_PORT}`);
});
