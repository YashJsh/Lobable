import type { ModelProvider, ReturnedResponse } from "../harness/harness.types";
import { GoogleGenAI } from "@google/genai";

class GeminiProvider implements ModelProvider{
    private client: GoogleGenAI;
    private maxRetries: number;
    public model: string;

  constructor(maxRetries: number, model: string) {
    this.client = new GoogleGenAI({
        apiKey : process.env.GEMINI_API_KEY 
    });
    this.maxRetries = maxRetries;
    this.model = model;
  }

    name(){
        return "GEMINI";
    }

    async chat(): Promise<ReturnedResponse>{
        return {
            content : "Nothing",
            finishReason : "stop",
            role : "assistant",
        }
    }
}