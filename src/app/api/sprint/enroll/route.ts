import { NextResponse } from "next/server";
import { getSession } from "@/server/auth/session";
import { enrollSprint } from "@/server/sprint/sprint.service";

export async function POST() {
  const session = await getSession();

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: { message: "Bạn cần đăng nhập để nhận lộ trình này." } },
      { status: 401 }
    );
  }

  try {
    const result = await enrollSprint(session.user.id);
    return NextResponse.json({ data: result });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Lỗi kích hoạt lộ trình.";
    return NextResponse.json({ error: { message } }, { status: 500 });
  }
}
