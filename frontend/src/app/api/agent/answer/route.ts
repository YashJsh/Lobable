import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const response = await axios.post("http://localhost:3001/agent/answer", body);
    return NextResponse.json(response.data);
  } catch (error: any) {
    const status = error.response?.status || 500;
    const message = error.response?.data || error.message;
    return NextResponse.json({ success: false, message }, { status });
  }
}
