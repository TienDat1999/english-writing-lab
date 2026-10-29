import { notFound, redirect } from "next/navigation";
import { getSession } from "@/server/auth/session";
import { getDayDetail } from "@/server/sprint/sprint.service";
import { DailyStationView } from "./daily-station-view";

interface DayPageProps {
  params: Promise<{ dayNumber: string }>;
}

export default async function SprintDayPage({ params }: DayPageProps) {
  const { dayNumber: dayParam } = await params;
  const dayNumber = parseInt(dayParam, 10);

  if (isNaN(dayNumber) || dayNumber < 1 || dayNumber > 30) {
    notFound();
  }

  const session = await getSession();
  const userId = session?.user?.id || null;

  const dayData = await getDayDetail(userId, dayNumber);
  if (!dayData?.plan) {
    notFound();
  }

  return (
    <DailyStationView
      dayPlan={dayData.plan}
      dayNumber={dayNumber}
      isLoggedIn={!!userId}
      initialProgress={dayData.progress ? JSON.parse(JSON.stringify(dayData.progress)) : null}
    />
  );
}
