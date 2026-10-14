import type { CueCardData, SpeakingMode, TargetLevel } from "./speaking.types"

export interface ExamMockTestPreset {
  id: string
  title: string
  examType: "IELTS" | "VSTEP"
  level: TargetLevel
  mode: SpeakingMode
  description: string
  part1Questions: string[]
  part2CueCard: CueCardData
  part3Questions: string[]
}

export const EXAM_MOCK_TESTS: ExamMockTestPreset[] = [
  {
    id: "ielts-mock-01-travel",
    title: "IELTS Speaking Full Mock Test: Travel & Discovery",
    examType: "IELTS",
    level: "B1_B2",
    mode: "IELTS",
    description: "Format chuẩn IELTS 3 Parts: Part 1 (Hometown & Holidays), Part 2 (Describe a memorable journey), Part 3 (Tourism & Globalization).",
    part1Questions: [
      "Good afternoon. Could you tell me where you are currently living?",
      "Do you prefer traveling alone or with friends, and why?",
      "What is the most popular holiday destination in your country?",
    ],
    part2CueCard: {
      topic: "Describe a memorable journey you took by public transport.",
      bulletPoints: [
        "Where you went and who was with you",
        "What type of public transport you used",
        "What happened during the journey",
        "And explain why this journey was so memorable to you.",
      ],
      followUpQuestions: ["Do you still travel by public transport often?"],
    },
    part3Questions: [
      "How has international tourism changed over the last two decades?",
      "What are the environmental consequences of over-tourism in popular destinations?",
      "Do you think governments should invest more in high-speed rail networks?",
    ],
  },
  {
    id: "ielts-mock-02-technology",
    title: "IELTS Speaking Full Mock Test: Technology & Digital Life",
    examType: "IELTS",
    level: "C1",
    mode: "IELTS",
    description: "Chủ đề nâng cao về Trí tuệ nhân tạo, thiết bị thông minh và tác động xã hội số.",
    part1Questions: [
      "How often do you use digital devices for work or study?",
      "What is your favorite mobile application and how does it help you?",
      "Do you think people spend too much time on their phones nowadays?",
    ],
    part2CueCard: {
      topic: "Describe a piece of technology that you find extremely useful in your daily routine.",
      bulletPoints: [
        "What the technology is and when you acquired it",
        "How frequently you use it and for what purposes",
        "How difficult or easy it was to learn how to operate it",
        "And explain how your life would be different without it.",
      ],
      followUpQuestions: ["Would you recommend this technology to others?"],
    },
    part3Questions: [
      "Will artificial intelligence eventually replace human professionals in fields like education or medicine?",
      "How can society protect personal privacy in an increasingly connected world?",
      "Do technological advancements widen or narrow the wealth gap between countries?",
    ],
  },
  {
    id: "vstep-mock-01-daily",
    title: "VSTEP Speaking Full Mock Test: Education & Life Choices",
    examType: "VSTEP",
    level: "B1_B2",
    mode: "VSTEP",
    description: "Format chuẩn VSTEP 3 phần: Part 1 (Tương tác xã hội), Part 2 (Thảo luận giải pháp với 3 lựa chọn), Part 3 (Phát triển chủ đề).",
    part1Questions: [
      "Let's talk about your free time. What activities do you enjoy doing on weekends?",
      "Do you like reading books or watching movies more, and why?",
      "What kind of music helps you relax when you feel stressed?",
    ],
    part2CueCard: {
      topic: "Situation: You are planning a farewell gift for a colleague who is moving to another city. Three options are proposed: A personalized photo album, a high-end smart watch, or a gift voucher for a shopping mall. Which option do you choose and why?",
      bulletPoints: [
        "Option 1: Personalized Photo Album (Sentimental, budget-friendly)",
        "Option 2: Smart Watch (Modern, practical, expensive)",
        "Option 3: Shopping Voucher (Flexible, less personal)",
        "Explain your choice and state why you reject the other two options.",
      ],
    },
    part3Questions: [
      "Topic: Online learning brings numerous benefits to university students (Flexibility, Cost-saving, Wide variety of courses). Develop this topic and state your opinion.",
      "What are the main drawbacks of studying entirely online?",
      "How can universities improve interaction between online lecturers and students?",
    ],
  },
]
