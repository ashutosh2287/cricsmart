import { NextResponse } from "next/server";

export async function GET() {
  try {
    const key = process.env.CRICKET_API_KEY;

    const res = await fetch(
      `https://api.cricapi.com/v1/currentMatches?apikey=${key}&offset=0`
    );

    const data = await res.json();

    return NextResponse.json(data);
  } catch (err) {
    console.error(err);

    return NextResponse.json(
      { success: false },
      { status: 500 }
    );
  }
}