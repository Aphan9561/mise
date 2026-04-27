import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { importRecipeFromUrl } from "@/lib/cooking/import-url";

export async function POST(request: Request) {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    url?: string;
  };

  if (!body.url) {
    return NextResponse.json({ error: "Missing URL" }, { status: 400 });
  }

  try {
    const recipe = await importRecipeFromUrl(body.url);

    return NextResponse.json({
      recipe,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json({ error: message }, { status: 422 });
  }
}
