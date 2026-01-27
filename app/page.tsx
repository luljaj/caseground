"use client";

import Link from "next/link";
import {
  Map,
  Zap,
  CheckCircle2,
  ArrowRight
} from "lucide-react";
import ProblemListPreview from "@/components/ui/ProblemListPreview";
import FeatureCard from "@/components/landing/FeatureCard";
import PricingCard from "@/components/landing/PricingCard";
import AIFeedbackDemo from "@/components/landing/AIFeedbackDemo";
import { motion, Variants } from "framer-motion";

const blurIn: Variants = {
  hidden: { opacity: 0, filter: "blur(10px)" },
  visible: { opacity: 1, filter: "blur(0px)", transition: { duration: 0.6, ease: "easeOut" } }
};

const popUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
};

export default function HomePage() {
  return (
    <div className="-mx-6 -my-6 md:-mx-12 md:-my-6">
      {/* Background Atmosphere - Fixed to viewport */}
      <div className="fixed inset-0 bg-atmosphere pointer-events-none z-0" />

      {/* Hero Section */}
      <section className="relative px-6 py-12 md:px-12 md:py-20 min-h-[90vh] flex flex-col justify-center overflow-hidden">
        <div className="relative z-10 mx-auto max-w-5xl w-full">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            {/* Left: Hero Content */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-150px" }}
              className="lg:col-span-7"
            >
              <motion.h1
                variants={blurIn}
                className="text-[40px] font-semibold tracking-tight leading-[1.1] md:text-[64px] text-white max-w-2xl"
              >
                Nail your next case interview with <span className="italic text-white">caseground</span>.
              </motion.h1>
              <motion.p
                variants={blurIn}
                transition={{ delay: 0.2 }}
                className="mt-6 text-[18px] leading-relaxed text-zinc-400 max-w-xl"
              >
                The interview prep platform designed for reps. Drill cases, behaviorals, and logic puzzles to build true skill.
              </motion.p>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <motion.div variants={popUp} transition={{ delay: 0.4 }}>
                  <Link
                    href="/problems"
                    className="bg-white hover:bg-zinc-100 rounded-full transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-white/10 px-8 py-3.5 text-zinc-950 font-medium text-sm md:text-base inline-flex items-center gap-2 group"
                  >
                    Start practicing
                    <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </motion.div>
                <motion.div variants={popUp} transition={{ delay: 0.5 }}>
                  <Link
                    href="/pricing"
                    className="px-8 py-3.5 text-zinc-400 hover:text-white transition-colors text-sm md:text-base font-medium"
                  >
                    View pricing
                  </Link>
                </motion.div>
              </div>
            </motion.div>

            {/* Right: Problem List Preview */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-150px" }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="lg:col-span-5 hidden lg:block"
            >
              <ProblemListPreview />
            </motion.div>
          </div>
        </div>
      </section>



      {/* Collections Section */}
      <section className="relative px-6 py-24 md:px-12 bg-zinc-900/30 overflow-hidden border-y border-zinc-800/50">
        <div className="relative z-10 mx-auto max-w-5xl w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20, filter: "blur(10px)" }}
              whileInView={{ opacity: 1, x: 0, filter: "blur(0px)" }}
              viewport={{ once: true, margin: "-150px" }}
              transition={{ duration: 0.6 }}
              className="order-2 lg:order-1"
            >
              <div className="p-8 rounded-3xl bg-zinc-900 border border-zinc-800 shadow-2xl relative overflow-hidden group">
                {/* Decorative background blocks */}


                <div className="space-y-4">
                  {[
                    { title: "Market Sizing Fundamentals", count: "8 problems", time: "45 min", color: "bg-zinc-500" },
                    { title: "PE Bootcamp", count: "12 problems", time: "60 min", color: "bg-zinc-500" },
                    { title: "Consulting Fit Prep", count: "15 problems", time: "90 min", color: "bg-zinc-500" },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-zinc-800/50 border border-zinc-700/50 hover:bg-zinc-800 transition-colors">
                      <div className={`w-10 h-10 rounded-full ${item.color}/20 flex items-center justify-center shrink-0`}>
                        <Map size={18} className="text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-white font-medium truncate">{item.title}</div>
                        <div className="text-zinc-500 text-xs mt-0.5">{item.count} • {item.time}</div>
                      </div>
                      <div className="text-zinc-600">
                        <ArrowRight size={16} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-150px" }}
              className="order-1 lg:order-2"
            >
              <motion.div variants={blurIn} className="inline-flex items-center gap-2 p-2 pr-4 bg-zinc-800 text-zinc-100 rounded-full text-xs font-medium mb-6 border border-zinc-700">
                <span className="p-1 px-2 bg-zinc-100 text-zinc-900 rounded-full">New</span>
                Collections are here
              </motion.div>
              <motion.h2 variants={blurIn} transition={{ delay: 0.2 }} className="text-3xl md:text-4xl font-semibold text-white tracking-tight mb-6">
                Simulate the pressure
              </motion.h2>
              <motion.p variants={blurIn} transition={{ delay: 0.3 }} className="text-zinc-400 text-lg leading-relaxed mb-8">
                Rapid-fire question sets built to match real interview intensity.
              </motion.p>
              <ul className="space-y-4 mb-4">
                {[
                  "A continuous flow of questions",
                  "Curated variety across topics",
                  "Train to perform under pressure"
                ].map((item, i) => (
                  <motion.li
                    key={i}
                    variants={blurIn}
                    transition={{ delay: 0.4 + (i * 0.1) }}
                    className="flex items-center gap-3 text-zinc-300"
                  >
                    <CheckCircle2 size={18} className="text-white" />
                    {item}
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* AI Feedback Section */}
      <section className="relative px-6 py-24 md:px-12 overflow-hidden">
        <div className="relative z-10 mx-auto max-w-5xl w-full">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-150px" }}
            className="text-center mb-16"
          >
            <motion.h2 variants={blurIn} className="text-3xl md:text-5xl font-semibold text-white tracking-tight mb-4">
              See what&apos;s working. Fix what&apos;s not.
            </motion.h2>
            <motion.p variants={blurIn} transition={{ delay: 0.2 }} className="text-zinc-400 text-lg max-w-2xl mx-auto">
              Get detailed analysis on your responses immediately. Identify patterns, improve structure, and sharpen your communication.
            </motion.p>
          </motion.div>

          <AIFeedbackDemo />
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="relative px-6 py-24 md:px-12 bg-zinc-900/30 border-t border-zinc-800/50">
        <div className="relative z-10 mx-auto max-w-5xl w-full">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-150px" }}
            className="text-center mb-16"
          >
            <motion.h2 variants={blurIn} className="text-3xl md:text-5xl font-semibold text-white tracking-tight mb-4">
              Fair, simple pricing
            </motion.h2>
            <motion.p variants={blurIn} transition={{ delay: 0.2 }} className="text-zinc-400 text-lg max-w-2xl mx-auto">
              Start for free, then upgrade for unlimited practice or buy credits as you go.
            </motion.p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto items-start">
            <PricingCard
              title="Starter"
              price="Free"
              description="Perfect for testing the waters."
              features={["5 AI Feedback Credits", "Access to all problems", "Basic Progress Tracking"]}
              ctaText="Get Started"
              ctaHref="/signin"
              delay={0.1}
            />
            <PricingCard
              title="Pro Monthly"
              price="$3.99"
              description="Unlimited practice for serious prep."
              features={["Unlimited AI Feedback", "Priority Support", "Advanced Analytics", "Cancel anytime"]}
              ctaText="Subscribe"
              ctaHref="/signin?plan=pro"
              popular={true}
              highlight={true}
              delay={0.2}
            />
            <PricingCard
              title="Power Pack"
              price="$5"
              description="Pay-as-you-go credits."
              features={["50 AI Feedback Credits", "Never expires", "One-time payment"]}
              ctaText="Buy Credits"
              ctaHref="/signin?plan=credits"
              delay={0.3}
            />
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative px-6 py-32 md:px-12 text-center overflow-hidden">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="relative z-10 mx-auto max-w-3xl"
        >
          <motion.h2 variants={blurIn} className="text-4xl md:text-6xl font-bold text-white tracking-tight mb-8">
            A smarter way to prep. Start free.
          </motion.h2>
          <motion.div variants={popUp} transition={{ delay: 0.3 }}>
            <Link
              href="/problems"
              className="inline-flex items-center gap-2 bg-white text-zinc-950 px-10 py-5 rounded-full font-semibold text-lg hover:scale-105 transition-transform shadow-2xl hover:shadow-white/20"
            >
              Start Practicing Now
              <ArrowRight size={20} />
            </Link>
          </motion.div>
          <motion.p variants={blurIn} transition={{ delay: 0.5 }} className="mt-8 text-zinc-500 text-sm">
            No credit card required to start.
          </motion.p>
        </motion.div>
      </section>

      {/* Simple Footer */}
      <footer className="relative px-6 py-12 md:px-12 border-t border-zinc-800 text-center text-zinc-600 text-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <p>&copy; 2026 Caseground. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="/terms" className="hover:text-zinc-400">Terms</Link>
            <Link href="/privacy" className="hover:text-zinc-400">Privacy</Link>
            <Link href="mailto:support@caseground.com" className="hover:text-zinc-400">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
