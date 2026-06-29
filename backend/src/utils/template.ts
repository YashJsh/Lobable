import { defaultBuildLogger, Template, waitForURL } from "e2b";

export const template = Template()
  .fromNodeImage("21-slim")
  .setWorkdir("/home/user/react-app")
  .runCmd(
    'npx create-next-app@latest . --ts --tailwind --no-eslint --import-alias "@/*" --use-npm --no-app --no-src-dir',
  )
  .setStartCmd(
    "npm run dev",
    waitForURL("http://localhost:3000"),
  );

const buildTemplate = async () => {
  await Template.build(template, "react-app", {
    cpuCount: 4,
    memoryMB: 4096,
    onBuildLogs: defaultBuildLogger(),
  });
};

buildTemplate().catch((e) => {
  console.log("Error in building template", e);
});
