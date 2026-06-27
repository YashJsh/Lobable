import express, { urlencoded } from "express";
import agentRouter from "./routes/agent.route";

const app = express();

app.use(express.json());
app.use(urlencoded({ extended: true }));

app.use("/agent", agentRouter);

app.listen(() => {
  console.log("Server is running on port 3000");
})