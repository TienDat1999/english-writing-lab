import { NextResponse } from "next/server";
import { getSession } from "@/server/auth/session";
import {
  getDayDetail,
  updateDayStationProgress,
  completeDayAndUnlockNext,
} from "@/server/sprint/sprint.service";
import type { SprintStationType } from "@/server/sprint/sprint.types";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ dayNumber: string }> }
) {
  const { dayNumber: dayParam } = await params;
  const dayNumber = parseInt(dayParam, 10);

  if (isNaN(dayNumber) || dayNumber < 1 || dayNumber > 30) {
    return NextResponse.json(
      { error: { message: "Ngày học không hợp lệ (1-30)." } },
      { status: 400 }
    );
  }

  const session = await getSession();
  const userId = session?.user?.id || null;

  const result = await getDayDetail(userId, dayNumber);
  if (!result) {
    return NextResponse.json(
      { error: { message: "Không tìm thấy dữ liệu ngày học." } },
      { status: 404 }
    );
  }

  return NextResponse.json({ data: result });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ dayNumber: string }> }
) {
  const session = await getSession();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: { message: "Bạn cần đăng nhập." } },
      { status: 401 }
    );
  }

  const { dayNumber: dayParam } = await params;
  const dayNumber = parseInt(dayParam, 10);
  if (isNaN(dayNumber) || dayNumber < 1 || dayNumber > 30) {
    return NextResponse.json(
      { error: { message: "Ngày học không hợp lệ." } },
      { status: 400 }
    );
  }

  const body = await req.json();
  const { action, station, payload } = body;

  if (action === "UPDATE_STATION") {
    if (!station) {
      return NextResponse.json(
        { error: { message: "Thiếu tên trạm học (station)." } },
        { status: 400 }
      );
    }
    const updated = await updateDayStationProgress(
      session.user.id,
      dayNumber,
      station as SprintStationType,
      payload || {}
    );
    return NextResponse.json({ data: updated });
  }

  if (action === "COMPLETE_DAY") {
    const result = await completeDayAndUnlockNext(session.user.id, dayNumber);
    return NextResponse.json({ data: result });
  }

  return NextResponse.json(
    { error: { message: "Action không hợp lệ." } },
    { status: 400 }
  );
}
