import { NextResponse } from "next/server";
import { returnsApi } from "@/lib/returns-api";

export async function POST(request: Request) {
  try {
    const { fileKey } = await request.json();
    const sessionId = request.headers.get("x-session-id");

    if (!fileKey) {
      return NextResponse.json(
        { error: "fileKey is required" },
        { status: 400 }
      );
    }

    if (!sessionId) {
      return NextResponse.json(
        { error: "x-session-id header is required" },
        { status: 401 }
      );
    }

    // Set session ID and make API call
    returnsApi.setSessionId(sessionId);
    const data = await returnsApi.generateUploadUrl(fileKey);

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Erro ao gerar URL de upload:", error);
    return NextResponse.json(
      { error: error.message || "Erro ao gerar URL de upload" },
      { status: 500 }
    );
  }
}
