import express, { urlencoded } from "express";
import agentRouter from "./routes/agent.route";
import cors from "cors";

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());
app.use(urlencoded({ extended: true }));

app.use("/agent", agentRouter);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}` );
})