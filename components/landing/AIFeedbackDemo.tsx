"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Loader2 } from "lucide-react";

export default function AIFeedbackDemo() {
    const [showFeedback, setShowFeedback] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const handleGetFeedback = () => {
        setIsAnalyzing(true);
        // Simulate API delay
        setTimeout(() => {
            setIsAnalyzing(false);
            setShowFeedback(true);
        }, 1500);
    };

    return (
        <div className="relative max-w-4xl mx-auto w-full">
            <div className="p-8 md:p-10 rounded-3xl bg-zinc-900 border border-zinc-800 shadow-2xl overflow-hidden min-h-[300px] flex flex-col relative group">

                <AnimatePresence mode="wait">
                    {!showFeedback && !isAnalyzing && (
                        <motion.div
                            key="fake-response"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="relative h-full flex flex-col"
                        >
                            <div className="mb-4 flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-sm font-medium text-white">
                                    U
                                </div>
                                <div className="text-sm text-zinc-400">You submitted</div>
                            </div>

                            <div className="p-6 rounded-2xl bg-zinc-950/30 border border-zinc-800/50 text-zinc-300 font-mono text-sm leading-relaxed mb-16">
                                <p>&quot;To estimate the market size, I&apos;ll start with the US population of 330 million. Assuming an average household size of 2.5, that gives us roughly 130 million households. Since this is a premium product...&quot;</p>
                                <div className="h-4 w-2/3 bg-zinc-800/50 rounded mt-2 animate-pulse" />
                            </div>

                            {/* Get Feedback Button - Positioned in bottom right ("corner") of the response area */}
                            <div className="absolute bottom-0 right-0">
                                <button
                                    onClick={handleGetFeedback}
                                    className="flex items-center gap-2 bg-white text-zinc-950 px-6 py-2.5 rounded-full font-medium text-sm hover:bg-zinc-100 transition-all hover:scale-105 shadow-lg shadow-white/5"
                                >
                                    <Zap size={14} className="fill-current" />
                                    Get Feedback
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {isAnalyzing && (
                        <motion.div
                            key="analyzing"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900 z-10"
                        >
                            <div className="relative">
                                <div className="absolute inset-0 bg-white/20 blur-xl rounded-full animate-pulse" />
                                <Loader2 size={48} className="text-white animate-spin relative z-10" />
                            </div>
                            <p className="mt-6 text-zinc-400 font-mono text-sm animate-pulse">
                                Analyzing structure and logic...
                            </p>
                        </motion.div>
                    )}

                    {showFeedback && (
                        <motion.div
                            key="feedback"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                            className="w-full"
                        >
                            <div className="flex items-start gap-4 mb-8">
                                <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center shrink-0 text-white animate-bounce-subtle">
                                    <Zap size={20} fill="currentColor" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-medium text-white">AI Analysis</h3>
                                    <p className="text-zinc-500 text-sm">Generated just now</p>
                                </div>
                                <button
                                    onClick={() => setShowFeedback(false)}
                                    className="ml-auto text-xs text-zinc-500 hover:text-white transition-colors"
                                >
                                    Reset Demo
                                </button>
                            </div>

                            <div className="space-y-4 font-mono text-sm leading-relaxed text-zinc-300">
                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.2 }}
                                    className="p-4 rounded-xl bg-zinc-950/50 border border-zinc-800/50"
                                >
                                    <strong className="text-emerald-400 block mb-2">
                                        Strengths
                                    </strong>
                                    <p>Your structure for the market sizing was logical (Household &#8594; Penetration &#8594; Frequency). Good use of round numbers to simplify calculations.</p>
                                </motion.div>

                                <motion.div
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.4 }}
                                    className="p-4 rounded-xl bg-zinc-950/50 border border-zinc-800/50"
                                >
                                    <strong className="text-amber-400 block mb-2">
                                        Areas for Improvement
                                    </strong>
                                    <p>You missed a key segmentation step: differentiate between residential and commercial usage, as this significantly impacts volume.</p>
                                </motion.div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}


