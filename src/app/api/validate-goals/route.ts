import { createClient } from "@/lib/supabase/server";
import { validateGoals } from "@/lib/ai-validator";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { goals } = body;

    if (!goals || !Array.isArray(goals)) {
      return NextResponse.json(
        { error: "goals array is required" },
        { status: 400 }
      );
    }

    const validation = await validateGoals(goals);
    return NextResponse.json(validation);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Validation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
