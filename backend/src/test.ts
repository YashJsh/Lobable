import fs from "fs/promises";

let read = await fs.readFile("./index.ts", "utf-8");
const oldText = "const PORT = 4000";
const replacewith = "const PORT = 3000";
read = read.replace(oldText, replacewith);
fs.writeFile("./index.ts", read);
console.log("Read");

const replace = async (path : string, old_str : string, new_str : string) => {
  let read = await fs.readFile(path, "utf-8");
  let old_str_new = old_str.trim();
  console.log(old_str_new);
  console.log(read.match(new RegExp(old_str, "g")));
  let m = (read.match(new RegExp(old_str, "g"))|| []).length;
  console.log(m);
  if (m == 1) {
    read = read.replace(old_str, new_str);
    fs.writeFile(path, read);
    console.log("replaced");
    return;
  } else if (m == 0) {
    console.log("No data found");
    return;
  } else {
    console.log("Argument is present more than once");
  }
}

replace("./index.ts", "app", "apps")