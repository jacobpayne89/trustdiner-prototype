import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    environment: "production",
    version: "3.0.0-prototype",
    message: "TrustDiner Prototype API is running",
    prototype_mode: true
  });
}
