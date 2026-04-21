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
const VALID_MOTION = ["gate", "motion_a", "motion_b", "motion_c"] as const;
const VALID_HORIZON = ["this_week", "next_2_weeks", "ongoing"] as const;
const VALID_EFFORT = ["low", "medium", "high"] as const;
const VALID_IMPACT = ["low", "medium", "high"] as const;

function isStatus(s: unknown): s is TaskStatus {
  return typeof s === "string" && (VALID_STATUS as readonly string[]).includes(s);
}
function isVisibility(s: unknown): s is Visibility {
  return (
    typeof s === "string" && (VALID_VISIBILITY as readonly string[]).includes(s)
  );
}
function isMotion(s: unknown): s is (typeof VALID_MOTION)[number] {
  return typeof s === "string" && (VALID_MOTION as readonly string[]).includes(s);
}
function isHorizon(s: unknown): s is (typeof VALID_HORIZON)[number] {
  return typeof s === "string" && (VALID_HORIZON as readonly string[]).includes(s);
}
function isEffort(s: unknown): s is (typeof VALID_EFFORT)[number] {
  return typeof s === "string" && (VALID_EFFORT as readonly string[]).includes(s);
}
function isImpact(s: unknown): s is (typeof VALID_IMPACT)[number] {
  return typeof s === "string" && (VALID_IMPACT as readonly string[]).includes(s);
}

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!user || !adminEmail || user.email !== adminEmail) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
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

  const project_id = typeof raw.project_id === "string" ? raw.project_id : null;
  const title = typeof raw.title === "string" ? raw.title.trim() : "";
  if (!project_id) {
    return NextResponse.json(
      { error: "project_id_required" },
      { status: 400 }
    );
  }
  if (!title) {
    return NextResponse.json({ error: "title_required" }, { status: 400 });
  }

  const status: TaskStatus = isStatus(raw.status) ? raw.status : "backlog";
  const visibility: Visibility = isVisibility(raw.visibility)
    ? raw.visibility
    : "private";
  const motion = isMotion(raw.motion) ? raw.motion : null;
  const description =
    typeof raw.description === "string" && raw.description.trim()
      ? raw.description
      : null;
  const short_id =
    typeof raw.short_id === "string" && raw.short_id.trim()
      ? raw.short_id.trim()
      : null;
  const horizon = isHorizon(raw.horizon) ? raw.horizon : null;
  const effort = isEffort(raw.effort) ? raw.effort : null;
  const impact = isImpact(raw.impact) ? raw.impact : null;
  const is_gate = typeof raw.is_gate === "boolean" ? raw.is_gate : false;

  const { data, error } = await supabase
    .from("tasks")
    .insert({
      project_id,
      title,
      short_id,
      description,
      motion,
      status,
      visibility,
      horizon,
      effort,
      impact,
      is_gate,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ task: data }, { status: 201 });
}
