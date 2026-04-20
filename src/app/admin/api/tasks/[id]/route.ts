import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import type { TaskStatus, Visibility } from "@/lib/types";

const VALID_STATUS: readonly TaskStatus[] = [
  "backlog",
  "this_week",
  "in_progress",
  "blocked",
  "done",
  "killed",
];
const VALID_VISIBILITY: readonly Visibility[] = ["public", "private"];
const ALLOWED_FIELDS = ["title", "description", "status", "visibility"] as const;
type AllowedField = (typeof ALLOWED_FIELDS)[number];

function isAllowedField(k: string): k is AllowedField {
  return (ALLOWED_FIELDS as readonly string[]).includes(k);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!user || !adminEmail || user.email !== adminEmail) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "id_required" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }
  const raw = body as Record<string, unknown>;

  for (const key of Object.keys(raw)) {
    if (!isAllowedField(key)) {
      return NextResponse.json(
        { error: `field_not_allowed: ${key}` },
        { status: 400 }
      );
    }
  }

  const update: Record<string, unknown> = {};

  if ("title" in raw) {
    if (typeof raw.title !== "string" || !raw.title.trim()) {
      return NextResponse.json({ error: "title_empty" }, { status: 400 });
    }
    update.title = raw.title.trim();
  }
  if ("description" in raw) {
    if (raw.description === null) {
      update.description = null;
    } else if (typeof raw.description === "string") {
      update.description = raw.description.trim() === "" ? null : raw.description;
    } else {
      return NextResponse.json({ error: "invalid_description" }, { status: 400 });
    }
  }
  if ("status" in raw) {
    if (
      typeof raw.status !== "string" ||
      !(VALID_STATUS as readonly string[]).includes(raw.status)
    ) {
      return NextResponse.json({ error: "invalid_status" }, { status: 400 });
    }
    update.status = raw.status;
  }
  if ("visibility" in raw) {
    if (
      typeof raw.visibility !== "string" ||
      !(VALID_VISIBILITY as readonly string[]).includes(raw.visibility)
    ) {
      return NextResponse.json({ error: "invalid_visibility" }, { status: 400 });
    }
    update.visibility = raw.visibility;
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "no_fields" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("tasks")
    .update(update)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ task: data });
}
