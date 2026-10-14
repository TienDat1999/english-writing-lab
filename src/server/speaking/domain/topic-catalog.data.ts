import type { SpeakingMode, TargetLevel } from "./speaking.types"

export interface TopicPreset {
  id: string
  title: string
  scenario: string
  category: "Daily Life" | "Work & Career" | "Debate & Society" | "IELTS Speaking" | "VSTEP Speaking"
  level: TargetLevel
  mode: SpeakingMode
  icon: string
  tags: string[]
  suggestedOpeningEn: string
}

export const TOPIC_CATALOG: TopicPreset[] = [
  // --- DAILY LIFE ---
  {
    id: "ordering-food",
    title: "Ordering Food at a Restaurant",
    scenario: "You are having dinner at an authentic Italian restaurant in London. Ask the waiter for wine recommendations and customize your pasta dish.",
    category: "Daily Life",
    level: "A2",
    mode: "FREE_TALK",
    icon: "🍝",
    tags: ["Food", "Ordering", "Dining out"],
    suggestedOpeningEn: "Excuse me, could we see the menu and hear today's chef specials?",
  },
  {
    id: "hotel-checkin",
    title: "Hotel Check-in & Special Requests",
    scenario: "You have just arrived at a boutique hotel in Tokyo. Check in, confirm your booking details, and request a quiet room on a higher floor with extra towels.",
    category: "Daily Life",
    level: "A2",
    mode: "FREE_TALK",
    icon: "🏨",
    tags: ["Travel", "Hotel", "Customer Service"],
    suggestedOpeningEn: "Hello, I have a reservation under the name John for three nights.",
  },
  {
    id: "travel-experience",
    title: "Sharing an Unforgettable Travel Story",
    scenario: "Chat with a friend about your most exciting vacation, sharing funny travel mishaps, memorable local food, and cultural differences.",
    category: "Daily Life",
    level: "B1_B2",
    mode: "FREE_TALK",
    icon: "✈️",
    tags: ["Travel", "Storytelling", "Experiences"],
    suggestedOpeningEn: "You won't believe what happened when I traveled to Da Nang last summer!",
  },
  {
    id: "doctor-appointment",
    title: "Doctor Appointment & Medical Symptoms",
    scenario: "You are visiting a general practitioner in Sydney to describe persistent allergy symptoms, fever, and ask for medical advice.",
    category: "Daily Life",
    level: "B1_B2",
    mode: "FREE_TALK",
    icon: "🩺",
    tags: ["Health", "Medical", "Symptoms"],
    suggestedOpeningEn: "Good morning doctor, I've been feeling quite unwell with a persistent cough for the past four days.",
  },

  // --- WORK & CAREER ---
  {
    id: "job-interview",
    title: "Senior Project Manager Job Interview",
    scenario: "You are interviewing with the HR Director for a Project Manager role at a multinational tech firm. Highlight your leadership and problem-solving skills.",
    category: "Work & Career",
    level: "B1_B2",
    mode: "FREE_TALK",
    icon: "💼",
    tags: ["Interview", "Career", "Leadership"],
    suggestedOpeningEn: "Thank you for inviting me today. I'm excited to discuss how my project management experience aligns with your team's goals.",
  },
  {
    id: "salary-negotiation",
    title: "Annual Review & Salary Negotiation",
    scenario: "Meet with your department manager to discuss your annual accomplishments, present market benchmark data, and negotiate a 15% salary increase.",
    category: "Work & Career",
    level: "C1",
    mode: "FREE_TALK",
    icon: "💰",
    tags: ["Negotiation", "Workplace", "Salary"],
    suggestedOpeningEn: "Thank you for taking the time to meet. Over the past year, our team has exceeded key performance milestones, and I'd like to discuss adjusting my compensation accordingly.",
  },
  {
    id: "product-launch-pitch",
    title: "Pitching a New Feature to Stakeholders",
    scenario: "Deliver an executive elevator pitch proposing a new AI-powered workflow automation tool to internal business executives.",
    category: "Work & Career",
    level: "C1",
    mode: "FREE_TALK",
    icon: "🚀",
    tags: ["Pitch", "Business", "Presentation"],
    suggestedOpeningEn: "Good afternoon everyone. Today, I'm thrilled to present our vision for streamlining customer onboarding through AI automation.",
  },

  // --- DEBATE & SOCIETY ---
  {
    id: "ai-impact",
    title: "The Impact of AI on Future Jobs",
    scenario: "Engage in an analytical debate discussing whether generative AI will displace white-collar professionals or foster higher-value creative opportunities.",
    category: "Debate & Society",
    level: "C1",
    mode: "FREE_TALK",
    icon: "🤖",
    tags: ["Technology", "AI", "Economy"],
    suggestedOpeningEn: "While rapid advancements in AI will inevitably automate routine cognitive tasks, I believe it will simultaneously augment human creativity and create new specialized roles.",
  },
  {
    id: "remote-vs-office",
    title: "Remote Work vs Traditional Office Culture",
    scenario: "Debate the long-term trade-offs between remote working flexibility, team camaraderie, employee productivity, and corporate culture.",
    category: "Debate & Society",
    level: "B1_B2",
    mode: "FREE_TALK",
    icon: "🏠",
    tags: ["Society", "Remote Work", "Lifestyle"],
    suggestedOpeningEn: "From my perspective, hybrid work models strike the optimal balance between personal flexibility and in-person collaboration.",
  },
  {
    id: "climate-change-solutions",
    title: "Renewable Energy & Environmental Policy",
    scenario: "Discuss feasible policy measures for accelerating green energy transitions in developing countries without compromising economic growth.",
    category: "Debate & Society",
    level: "C1",
    mode: "FREE_TALK",
    icon: "🌱",
    tags: ["Environment", "Climate", "Policy"],
    suggestedOpeningEn: "Addressing climate change effectively requires a combination of government subsidies for clean energy and strict carbon pricing mechanisms.",
  },
]
