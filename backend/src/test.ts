import { getSandbox } from "./utils/e2b";

const sandbox = await getSandbox();

const getUrl = sandbox.getHost(3000);
console.log("URl iS : ", getUrl);

const result = await sandbox.commands.run(
    "cat /home/user/react-app/pages/index.tsx"
);

console.log(result.stdout);