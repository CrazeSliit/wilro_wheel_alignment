import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60;

const PROMPTS = {
  handwriting: `This image contains handwritten text. It may be written in Sinhala (සිංහල) script, English, or both.
Your task: Carefully read every handwritten character and word in the image and output the exact text as written.
- For Sinhala handwriting: recognize each Sinhala letter, vowel sign (ශ්‍රී, ා, ි, ී, ු, ූ, ෙ, ේ, ො, ෝ, etc.), and conjunct correctly.
- For English handwriting: read each letter carefully.
- Preserve line breaks exactly as they appear in the image.
- Output ONLY the raw transcribed text. No descriptions, no commentary, no explanations — just the text.`,
  auto: `Extract all text from this image exactly as it appears. Return only the raw text content, nothing else. Do not describe the image, do not mention what kind of image it is, do not add any introduction, commentary, or explanation. Just output the text found in the image, preserving line breaks and spacing.`,
};

export async function POST(req: NextRequest) {
  const apiKey = process.env.NVIDIA_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "NVIDIA API key not configured." }, { status: 500 });
  }

  let body: { base64Image: string; mimeType: string; mode?: "auto" | "handwriting" };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { base64Image, mimeType, mode = "auto" } = body;
  if (!base64Image || !mimeType) {
    return NextResponse.json({ error: "base64Image and mimeType are required." }, { status: 400 });
  }

  const nvidiaRes = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "meta/llama-3.2-90b-vision-instruct",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: PROMPTS[mode] },
            { type: "image_url", image_url: { url: `data:${mimeType};base64,${base64Image}` } },
          ],
        },
      ],
      max_tokens: 4096,
      temperature: 0.05,
      stream: true,
    }),
  });

  if (!nvidiaRes.ok || !nvidiaRes.body) {
    const err = await nvidiaRes.text();
    return NextResponse.json(
      { error: `NVIDIA API error ${nvidiaRes.status}: ${err}` },
      { status: 502 }
    );
  }

  // Pipe the SSE stream directly to the client — keeps connection alive, no timeout
  return new Response(nvidiaRes.body, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "X-Accel-Buffering": "no",
    },
  });
}
