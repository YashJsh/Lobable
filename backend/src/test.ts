import { sandbox } from "./utils/e2b";

const url = sandbox.getHost(3000);
console.log(url);

const result = await sandbox.commands.run(
    "cat /home/user/react-app/pages/index.tsx"
);

console.log(result.stdout);