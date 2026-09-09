"use server";

export async function scanImageText(
  base64Image: string,
  mimeType: string,
  mode: "auto" | "handwriting" = "auto"
) {
  const apiKey = process.env.NVIDIA_API_KEY;
  if (!apiKey) {
    return { success: false, error: "NVIDIA API key not configured." };
  }

  const dataUrl = `data:${mimeType};base64,${base64Image}`;

  const prompt =
    mode === "handwriting"
      ? `This image contains handwritten text. It may be written in Sinhala (සිංහල) script, English, or both.
Your task: Carefully read every handwritten character and word in the image and output the exact text as written.
- For Sinhala handwriting: recognize each Sinhala letter, vowel sign (ශ්‍රී, ා, ි, ී, ු, ූ, ෙ, ේ, ො, ෝ, etc.), and conjunct correctly.
- For English handwriting: read each letter carefully.
- Preserve line breaks exactly as they appear in the image.
- Output ONLY the raw transcribed text. No descriptions, no commentary, no explanations — just the text.`
      : `Extract all text from this image exactly as it appears. Return only the raw text content, nothing else. Do not describe the image, do not mention what kind of image it is, do not add any introduction, commentary, or explanation. Just output the text found in the image, preserving line breaks and spacing.`;

  try {
    const response = await fetch(
      "https://integrate.api.nvidia.com/v1/chat/completions",
      {
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
                { type: "text", text: prompt },
                { type: "image_url", image_url: { url: dataUrl } },
              ],
            },
          ],
          max_tokens: 4096,
          temperature: 0.05,
        }),
      }
    );

    if (!response.ok) {
      const err = await response.text();
      return { success: false, error: `API error: ${response.status} — ${err}` };
    }

    const data = await response.json();
    const text: string = data.choices?.[0]?.message?.content ?? "";

    return { success: true, text };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { success: false, error: message };
  }
}
