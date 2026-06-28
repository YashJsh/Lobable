import express, { urlencoded } from "express";
import agentRouter from "./routes/agent.route";

const app = express();
const PORT = 3001;

app.use(express.json());
app.use(urlencoded({ extended: true }));

app.use("/agent", agentRouter);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}` );
})