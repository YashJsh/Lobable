import fs from "fs/promises";
import path from "path";

export async function saveData(data: unknown) {
    try {
        const FILE_PATH = path.join(process.cwd(), "conversation.jsonl");
        await fs.appendFile(
            FILE_PATH,
            JSON.stringify(data) + "\n"
        );
    } catch (err) {
        console.error("Failed to save data:", err);
    }
}