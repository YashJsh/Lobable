import type { Message } from "./harness/harness.types";

const userMessage = (input: string): Message => {
    return {
        role: "user",
        content: input,
    };
}

const assistantMessage = (input: string): Message => {
    return {
        role: "assistant",
        content: input,
    };
}

export { userMessage, assistantMessage };
