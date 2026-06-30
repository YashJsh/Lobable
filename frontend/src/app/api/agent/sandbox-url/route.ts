import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export async function GET() {
  try {
    const response = await axios.get("http://localhost:3001/agent/sandbox-url");
    return NextResponse.json(response.data);
  } catch (error: any) {
    const status = error.response?.status || 500;
    const message = error.response?.data || error.message;
    return NextResponse.json({ success: false, message }, { status });
  }
}
