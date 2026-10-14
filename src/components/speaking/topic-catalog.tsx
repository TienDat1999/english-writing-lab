"use client"

import React, { useState } from "react"
import {
  BubbleChatIcon,
  Search01Icon,
  ArrowRight01Icon,
  FilterIcon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { Button } from "@/components/ui/button"
import { TOPIC_CATALOG, type TopicPreset } from "@/server/speaking/domain/topic-catalog.data"
import { EXAM_MOCK_TESTS, type ExamMockTestPreset } from "@/server/speaking/domain/exam-prompts.data"
import type { TargetLevel, SpeakingMode, CueCardData } from "@/server/speaking/domain/speaking.types"

export interface TopicCatalogProps {
  onSelectTopic: (topic: {
    title: string
    scenario?: string
    level: TargetLevel
    mode: SpeakingMode
    examPart?: import("@/server/speaking/domain/speaking.types").ExamPart
    cueCard?: CueCardData
  }) => void
  disabled?: boolean
}

export function TopicCatalog({ onSelectTopic, disabled = false }: TopicCatalogProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL")
  const [selectedLevel, setSelectedLevel] = useState<string>("ALL")
  const [searchQuery, setSearchQuery] = useState<string>("")

  const categories = [
    { id: "ALL", label: "Tất cả chủ đề" },
    { id: "Daily Life", label: "Đời sống hàng ngày" },
    { id: "Work & Career", label: "Công việc & Sự nghiệp" },
    { id: "Debate & Society", label: "Tranh luận & Xã hội" },
    { id: "EXAM_SIMULATOR", label: "🏆 Thi thử IELTS / VSTEP" },
  ]

  const levels = [
    { id: "ALL", label: "Mọi trình độ" },
    { id: "A2", label: "A2 (Cơ bản)" },
    { id: "B1_B2", label: "B1-B2 (Trung cấp)" },
    { id: "C1", label: "C1 (Nâng cao)" },
  ]

  const isExamTab = selectedCategory === "EXAM_SIMULATOR"

  const filteredTopics = TOPIC_CATALOG.filter((topic) => {
    if (isExamTab) return false
    const matchCat = selectedCategory === "ALL" || topic.category === selectedCategory
    const matchLevel = selectedLevel === "ALL" || topic.level === selectedLevel
    const matchSearch =
      !searchQuery.trim() ||
      topic.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      topic.scenario.toLowerCase().includes(searchQuery.toLowerCase()) ||
      topic.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()))

    return matchCat && matchLevel && matchSearch
  })

  const filteredExams = EXAM_MOCK_TESTS.filter((exam) => {
    if (!isExamTab && selectedCategory !== "ALL") return false
    const matchLevel = selectedLevel === "ALL" || exam.level === selectedLevel
    const matchSearch =
      !searchQuery.trim() ||
      exam.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exam.description.toLowerCase().includes(searchQuery.toLowerCase())

    return matchLevel && matchSearch
  })

  return (
    <div className="space-y-5">
      {/* Category Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Category Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                selectedCategory === cat.id
                  ? "bg-card text-foreground shadow-xs font-bold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search Box */}
        <div className="relative min-w-[200px]">
          <HugeiconsIcon
            icon={Search01Icon}
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="text"
            placeholder="Tìm chủ đề, từ khóa..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-9 pl-8 pr-3 rounded-xl bg-background border border-input text-xs focus:outline-hidden focus:ring-2 focus:ring-primary/40"
          />
        </div>
      </div>

      {/* Level Filters */}
      <div className="flex items-center gap-2 text-xs">
        <span className="text-muted-foreground flex items-center gap-1">
          <HugeiconsIcon icon={FilterIcon} size={12} />
          <span>Trình độ:</span>
        </span>
        {levels.map((lvl) => (
          <button
            key={lvl.id}
            type="button"
            onClick={() => setSelectedLevel(lvl.id)}
            className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors ${
              selectedLevel === lvl.id
                ? "bg-primary text-primary-foreground font-semibold"
                : "bg-card border border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {lvl.label}
          </button>
        ))}
      </div>

      {/* Topics & Exam Mock Tests Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Render Exam Mock Tests */}
        {filteredExams.map((exam) => (
          <div
            key={exam.id}
            className="group relative rounded-2xl bg-linear-to-br from-amber-500/5 via-card to-card border-2 border-amber-500/20 p-5 shadow-xs hover:border-amber-500/50 hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-2xl">🏆</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 uppercase">
                    {exam.examType} Mock Test
                  </span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-primary/10 text-primary">
                    {exam.level}
                  </span>
                </div>
              </div>

              <div>
                <h3 className="font-bold text-foreground group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors text-base">
                  {exam.title}
                </h3>
                <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed mt-1">
                  {exam.description}
                </p>
              </div>

              <div className="text-[11px] text-amber-700/80 dark:text-amber-300/80 bg-amber-500/10 p-2 rounded-lg font-medium">
                🎯 Part 2 Cue Card: "{exam.part2CueCard.topic.slice(0, 70)}..."
              </div>
            </div>

            <div className="pt-4 mt-3 border-t border-border/60 flex items-center justify-end">
              <Button
                type="button"
                size="sm"
                disabled={disabled}
                onClick={() =>
                  onSelectTopic({
                    title: exam.title,
                    scenario: exam.description,
                    level: exam.level,
                    mode: exam.mode,
                    examPart: "PART_2",
                    cueCard: exam.part2CueCard,
                  })
                }
                className="gap-1.5 text-xs rounded-lg h-8 bg-amber-500 hover:bg-amber-600 text-white font-medium"
              >
                <span>Vào phòng thi thử</span>
                <HugeiconsIcon icon={ArrowRight01Icon} size={14} />
              </Button>
            </div>
          </div>
        ))}

        {/* Render Free-talk Topics */}
        {filteredTopics.map((topic) => (
          <div
            key={topic.id}
            className="group relative rounded-2xl bg-card border border-border p-5 shadow-xs hover:border-primary/50 hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-2xl">{topic.icon}</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    {topic.category}
                  </span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-primary/10 text-primary">
                    {topic.level}
                  </span>
                </div>
              </div>

              <div>
                <h3 className="font-bold text-foreground group-hover:text-primary transition-colors text-base">
                  {topic.title}
                </h3>
                <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed mt-1">
                  {topic.scenario}
                </p>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-1 pt-1">
                {topic.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="text-[10px] text-muted-foreground bg-slate-100 dark:bg-slate-800/80 px-1.5 py-0.5 rounded"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-4 mt-3 border-t border-border/60 flex items-center justify-end">
              <Button
                type="button"
                size="sm"
                disabled={disabled}
                onClick={() => onSelectTopic(topic)}
                className="gap-1.5 text-xs rounded-lg h-8"
              >
                <span>Luyện nói ngay</span>
                <HugeiconsIcon icon={ArrowRight01Icon} size={14} />
              </Button>
            </div>
          </div>
        ))}

        {filteredTopics.length === 0 && filteredExams.length === 0 && (
          <div className="col-span-full py-12 text-center text-muted-foreground space-y-2">
            <p className="text-sm font-semibold">Không tìm thấy chủ đề phù hợp</p>
            <p className="text-xs">Hãy thử đổi bộ lọc hoặc từ khóa tìm kiếm khác.</p>
          </div>
        )}
      </div>
    </div>
  )
}

