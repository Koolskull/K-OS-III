import { NextResponse } from "next/server";
import { requireUserId, isProjectMember } from "@/lib/api-auth";
import { pool } from "@/lib/db";

/** Project detail: the project row, its members (with display names), and its shots. */
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { id } = await params;
  const projectId = Number(id);
  if (!Number.isInteger(projectId)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!(await isProjectMember(projectId, userId))) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const [project, members, shots] = await Promise.all([
    pool.query(`SELECT id, name, owner_id, blockchain_ref, created_at FROM prodev_projects WHERE id = $1`, [projectId]),
    pool.query(
      `SELECT m.user_id, m.role, COALESCE(p.display_name, u.name) AS display_name
       FROM prodev_members m
       JOIN users u ON u.id = m.user_id
       LEFT JOIN profiles p ON p.user_id = m.user_id
       WHERE m.project_id = $1
       ORDER BY m.role, display_name`,
      [projectId],
    ),
    pool.query(
      `SELECT id, title, sort_order, created_at FROM prodev_shots WHERE project_id = $1 ORDER BY sort_order, id`,
      [projectId],
    ),
  ]);

  if (project.rowCount === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({ ...project.rows[0], members: members.rows, shots: shots.rows });
}

/** Add a member to the project by user id (found via /api/users/search). */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = await requireUserId();
  if (!userId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { id } = await params;
  const projectId = Number(id);
  if (!Number.isInteger(projectId)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (!(await isProjectMember(projectId, userId))) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = (await req.json()) as { userId?: number };
  const newMemberId = Number(body.userId);
  if (!Number.isInteger(newMemberId)) return NextResponse.json({ error: "Invalid userId" }, { status: 400 });

  const userExists = await pool.query(`SELECT 1 FROM users WHERE id = $1`, [newMemberId]);
  if (userExists.rowCount === 0) return NextResponse.json({ error: "No such user" }, { status: 404 });

  await pool.query(
    `INSERT INTO prodev_members (project_id, user_id, role) VALUES ($1, $2, 'contributor')
     ON CONFLICT (project_id, user_id) DO NOTHING`,
    [projectId, newMemberId],
  );
  return NextResponse.json({ ok: true });
}
