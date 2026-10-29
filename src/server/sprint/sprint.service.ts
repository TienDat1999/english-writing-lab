import "server-only";

import { Types } from "mongoose";
import { connectMongoose } from "@/server/db/mongoose";
import { sprint30DaysCurriculum } from "./sprint.data";
import { UserSprintEnrollment } from "./sprint-enrollment.schema";
import { UserDayProgress } from "./user-day-progress.schema";
import type { SprintStationType } from "./sprint.types";

const SPRINT_SLUG = "vstep-b2-30-day-sprint";

export async function getSprintOverview(userId?: string | null) {
  await connectMongoose();

  let enrollment = null;
  const progressMap = new Map<number, string>();

  if (userId && Types.ObjectId.isValid(userId)) {
    enrollment = await UserSprintEnrollment.findOne({
      userId: new Types.ObjectId(userId),
      sprintSlug: SPRINT_SLUG,
    }).lean();

    const progressRecords = await UserDayProgress.find({
      userId: new Types.ObjectId(userId),
      sprintSlug: SPRINT_SLUG,
    }).lean();

    for (const pr of progressRecords) {
      progressMap.set(pr.dayNumber, pr.status);
    }
  }

  const isEnrolled = !!enrollment && enrollment.status === "ACTIVE";
  const currentDay = enrollment?.currentDay || 1;
  const completedDays = enrollment?.completedDays || [];
  const streak = enrollment?.streak || 0;

  const daysWithStatus = sprint30DaysCurriculum.map((day) => {
    let dayStatus: "LOCKED" | "IN_PROGRESS" | "COMPLETED" = "LOCKED";

    if (!isEnrolled) {
      // Khi chưa enroll, Day 1 cho phép xem trước/học thử
      dayStatus = day.dayNumber === 1 ? "IN_PROGRESS" : "LOCKED";
    } else {
      if (completedDays.includes(day.dayNumber)) {
        dayStatus = "COMPLETED";
      } else if (progressMap.get(day.dayNumber) === "IN_PROGRESS" || day.dayNumber === currentDay) {
        dayStatus = "IN_PROGRESS";
      } else {
        dayStatus = progressMap.get(day.dayNumber) === "COMPLETED" ? "COMPLETED" : "LOCKED";
      }
    }

    return {
      dayNumber: day.dayNumber,
      weekNumber: day.weekNumber,
      title: day.title,
      focusBadge: day.focusBadge,
      dailyGoal: day.dailyGoal,
      status: dayStatus,
    };
  });

  return {
    sprintSlug: SPRINT_SLUG,
    title: "Lộ trình 30 Ngày Bứt Phá VSTEP B2 (Writing & Speaking Sprint)",
    isEnrolled,
    currentDay,
    completedDaysCount: completedDays.length,
    streak,
    days: daysWithStatus,
  };
}

export async function enrollSprint(userId: string) {
  await connectMongoose();
  const userObjId = new Types.ObjectId(userId);

  let enrollment = await UserSprintEnrollment.findOne({
    userId: userObjId,
    sprintSlug: SPRINT_SLUG,
  });

  if (!enrollment) {
    enrollment = await UserSprintEnrollment.create({
      userId: userObjId,
      sprintSlug: SPRINT_SLUG,
      currentDay: 1,
      completedDays: [],
      streak: 0,
      status: "ACTIVE",
      startedAt: new Date(),
      lastActiveAt: new Date(),
    });
  } else {
    enrollment.status = "ACTIVE";
    enrollment.lastActiveAt = new Date();
    await enrollment.save();
  }

  // Khởi tạo Ngày 1 IN_PROGRESS
  await UserDayProgress.findOneAndUpdate(
    { userId: userObjId, sprintSlug: SPRINT_SLUG, dayNumber: 1 },
    { $setOnInsert: { status: "IN_PROGRESS" } },
    { upsert: true }
  );

  return { success: true, currentDay: enrollment.currentDay };
}

export async function getDayDetail(userId: string | null | undefined, dayNumber: number) {
  await connectMongoose();

  const plan = sprint30DaysCurriculum.find((d) => d.dayNumber === dayNumber);
  if (!plan) return null;

  let dayProgress = null;

  if (userId && Types.ObjectId.isValid(userId)) {
    const record = await UserDayProgress.findOne({
      userId: new Types.ObjectId(userId),
      sprintSlug: SPRINT_SLUG,
      dayNumber,
    }).lean();

    if (record) {
      dayProgress = record;
    }
  }

  return {
    plan,
    progress: dayProgress,
  };
}

export async function updateDayStationProgress(
  userId: string,
  dayNumber: number,
  station: SprintStationType,
  payload: Record<string, unknown>
) {
  await connectMongoose();
  const userObjId = new Types.ObjectId(userId);

  const updateFields: Record<string, unknown> = {
    status: "IN_PROGRESS",
    [`stations.${station.toLowerCase()}.isCompleted`]: true,
    [`stations.${station.toLowerCase()}.completedAt`]: new Date(),
  };

  if (station === "WRITING") {
    if (typeof payload.submissionText === "string") {
      updateFields["stations.writing.submissionText"] = payload.submissionText;
    }
    if (typeof payload.wordCount === "number") {
      updateFields["stations.writing.wordCount"] = payload.wordCount;
    }
    if (typeof payload.timeSpentSeconds === "number") {
      updateFields["stations.writing.timeSpentSeconds"] = payload.timeSpentSeconds;
    }
  } else if (station === "SPEAKING") {
    if (typeof payload.durationSeconds === "number") {
      updateFields["stations.speaking.durationSeconds"] = payload.durationSeconds;
    }
    if (typeof payload.deadAirCount === "number") {
      updateFields["stations.speaking.deadAirCount"] = payload.deadAirCount;
    }
    if (typeof payload.notes === "string") {
      updateFields["stations.speaking.notes"] = payload.notes;
    }
  } else if (station === "AUDIT") {
    if (Array.isArray(payload.checkedItems)) {
      updateFields["stations.audit.checkedItems"] = payload.checkedItems;
    }
    if (typeof payload.mistakesNote === "string") {
      updateFields["stations.audit.mistakesNote"] = payload.mistakesNote;
    }
  }

  const updatedProgress = await UserDayProgress.findOneAndUpdate(
    { userId: userObjId, sprintSlug: SPRINT_SLUG, dayNumber },
    { $set: updateFields },
    { upsert: true, new: true }
  );

  return updatedProgress;
}

export async function completeDayAndUnlockNext(userId: string, dayNumber: number) {
  await connectMongoose();
  const userObjId = new Types.ObjectId(userId);

  // Đánh dấu ngày hiện tại hoàn thành
  await UserDayProgress.findOneAndUpdate(
    { userId: userObjId, sprintSlug: SPRINT_SLUG, dayNumber },
    {
      $set: {
        status: "COMPLETED",
        completedAt: new Date(),
      },
    },
    { upsert: true }
  );

  // Cập nhật Enrollment
  const enrollment = await UserSprintEnrollment.findOne({
    userId: userObjId,
    sprintSlug: SPRINT_SLUG,
  });

  const nextDay = Math.min(dayNumber + 1, 30);

  if (enrollment) {
    if (!enrollment.completedDays.includes(dayNumber)) {
      enrollment.completedDays.push(dayNumber);
      enrollment.streak += 1;
    }
    if (dayNumber < 30) {
      enrollment.currentDay = Math.max(enrollment.currentDay, nextDay);
    } else {
      enrollment.status = "COMPLETED";
    }
    enrollment.lastActiveAt = new Date();
    await enrollment.save();
  }

  // Mở khóa Ngày tiếp theo
  if (dayNumber < 30) {
    await UserDayProgress.findOneAndUpdate(
      { userId: userObjId, sprintSlug: SPRINT_SLUG, dayNumber: nextDay },
      { $setOnInsert: { status: "IN_PROGRESS" } },
      { upsert: true }
    );
  }

  return { success: true, nextDay };
}
