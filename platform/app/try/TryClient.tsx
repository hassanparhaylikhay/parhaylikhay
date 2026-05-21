"use client"

import "katex/dist/katex.min.css"
import HeroSection from "./sections/HeroSection"
import ContrastSection from "./sections/ContrastSection"
import InteractiveMomentSection from "./sections/InteractiveMomentSection"
import LessonModePreviewSection from "./sections/LessonModePreviewSection"
import QuizzesSection from "./sections/QuizzesSection"
import MarkSchemeSection from "./sections/MarkSchemeSection"
import VisualShowcasesSection from "./sections/VisualShowcasesSection"
import PracticeAtScaleSection from "./sections/PracticeAtScaleSection"
import TeacherModeSection from "./sections/TeacherModeSection"
import RoadmapSection from "./sections/RoadmapSection"
import TestimonialSection from "./sections/TestimonialSection"
import FounderSection from "./sections/FounderSection"
import OfferSection from "./sections/OfferSection"

/**
 * TryClient — orchestrates all nine sections of the demo. Each section
 * is independent and self-pinning where the choreography requires it.
 *
 * The page intentionally has no top nav. The first thing the visitor
 * sees is the headline; the wordmark appears only in the hero and in
 * Section 9. Apple-style focus.
 */
export default function TryClient() {
  return (
    <main className="bg-[#07090d] text-[#c8c6be] min-h-screen overflow-x-hidden">
      <HeroSection />
      <ContrastSection />
      <InteractiveMomentSection />
      <LessonModePreviewSection />
      <QuizzesSection />
      <MarkSchemeSection />
      <VisualShowcasesSection />
      <PracticeAtScaleSection />
      <TeacherModeSection />
      <RoadmapSection />
      <TestimonialSection />
      <FounderSection />
      <OfferSection />
    </main>
  )
}
