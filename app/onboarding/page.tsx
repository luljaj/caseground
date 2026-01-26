"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { motion, AnimatePresence, type Variants } from "framer-motion";
import Button from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";
import RoleSelector from "@/components/onboarding/RoleSelector";
import RecommendedCollections from "@/components/onboarding/RecommendedCollections";
import { useAuth } from "@/lib/hooks/useAuth";
import { useOnboarding } from "@/lib/hooks/useOnboarding";
import { TARGET_ROLE_LABELS, type Collection, type TargetRole } from "@/types";

const EXPLORING_ROLE = "exploring" as const;
const ONBOARDING_TEST_MODE = true;

type SelectedRole = TargetRole | typeof EXPLORING_ROLE | null;

function sortByOrder(a: Collection, b: Collection) {
  return a.sort_order - b.sort_order;
}

export default function OnboardingPage() {
  const router = useRouter();
  const { user, loading: authLoading, signInWithGoogle } = useAuth();
  const {
    loading: onboardingLoading,
    hasCompletedOnboarding,
    completeOnboarding,
  } = useOnboarding();

  const [step, setStep] = useState<1 | 2>(1);
  const [selectedRole, setSelectedRole] = useState<SelectedRole>(null);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [collectionsLoading, setCollectionsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (authLoading || onboardingLoading || !user) {
      return;
    }
    if (hasCompletedOnboarding && !ONBOARDING_TEST_MODE) {
      router.replace("/dashboard");
    }
  }, [authLoading, onboardingLoading, hasCompletedOnboarding, router, user]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.history.replaceState({ onboardingStep: 1 }, "", window.location.href);
    }
  }, []);

  useEffect(() => {
    const handlePop = () => {
      setStep((current) => (current === 2 ? 1 : current));
    };

    window.addEventListener("popstate", handlePop);
    return () => {
      window.removeEventListener("popstate", handlePop);
    };
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadCollections() {
      setCollectionsLoading(true);
      try {
        const res = await fetch("/api/collections", { cache: "no-store" });
        if (!res.ok) {
          return;
        }
        const payload = await res.json();
        if (isMounted) {
          setCollections(payload.collections ?? []);
        }
      } catch {
        return;
      } finally {
        if (isMounted) {
          setCollectionsLoading(false);
        }
      }
    }

    loadCollections();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!user) {
      return;
    }

    const handleKey = async (event: KeyboardEvent) => {
      if (event.key !== "Escape" || isSaving) {
        return;
      }
      setIsSaving(true);
      await completeOnboarding(null, true);
      setIsSaving(false);
      router.push("/dashboard");
    };

    window.addEventListener("keydown", handleKey);
    return () => {
      window.removeEventListener("keydown", handleKey);
    };
  }, [completeOnboarding, isSaving, router, user]);

  const selectedTargetRole = selectedRole === EXPLORING_ROLE ? null : selectedRole;

  const publishedCollections = useMemo(() => {
    return collections.filter((collection) => collection.is_published);
  }, [collections]);

  const featuredCollections = useMemo(() => {
    return publishedCollections
      .filter((collection) => collection.is_featured)
      .sort(sortByOrder);
  }, [publishedCollections]);

  const roleCollections = useMemo(() => {
    if (!selectedTargetRole) {
      return [];
    }
    return publishedCollections
      .filter((collection) =>
        Array.isArray(collection.target_roles)
          ? collection.target_roles.includes(selectedTargetRole)
          : false
      )
      .sort(sortByOrder);
  }, [publishedCollections, selectedTargetRole]);

  const recommendedCollections = useMemo(() => {
    if (!selectedTargetRole) {
      return featuredCollections.slice(0, 3);
    }

    const primary = roleCollections.slice(0, 3);
    if (primary.length >= 3) {
      return primary;
    }

    const existingIds = new Set(primary.map((collection) => collection.id));
    const padded = featuredCollections.filter(
      (collection) => !existingIds.has(collection.id)
    );

    return [...primary, ...padded.slice(0, 3 - primary.length)];
  }, [featuredCollections, roleCollections, selectedTargetRole]);

  const roleLabel =
    selectedRole === EXPLORING_ROLE
      ? "Explorers"
      : selectedTargetRole
        ? TARGET_ROLE_LABELS[selectedTargetRole]
        : "you";

  const handleContinue = () => {
    if (selectedRole === null) {
      return;
    }
    setStep(2);
    if (typeof window !== "undefined") {
      window.history.pushState({ onboardingStep: 2 }, "", window.location.href);
    }
  };

  const handleBack = () => {
    setStep(1);
  };

  const handleComplete = async (path: string) => {
    if (!user || isSaving) {
      return;
    }
    setIsSaving(true);
    await completeOnboarding(selectedTargetRole ?? null, false);
    setIsSaving(false);
    router.push(path);
  };

  const handleSkip = async (path: string) => {
    if (!user || isSaving) {
      return;
    }
    setIsSaving(true);
    await completeOnboarding(null, true);
    setIsSaving(false);
    router.push(path);
  };

  const handleRoleSkip = () => {
    setSelectedRole(EXPLORING_ROLE);
    setStep(2);
    if (typeof window !== "undefined") {
      window.history.pushState({ onboardingStep: 2 }, "", window.location.href);
    }
  };

  const handleLogoClick = async () => {
    if (!user) {
      router.push("/");
      return;
    }
    await handleSkip("/");
  };

  if (authLoading || onboardingLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner size={28} />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6">
        <div className="w-full max-w-md rounded-2xl border border-white/10 bg-surface/40 p-8 text-center">
          <h1 className="text-xl font-semibold text-text-primary">
            Sign in to start onboarding
          </h1>
          <p className="mt-2 text-sm text-text-secondary">
            Create an account to get tailored collection recommendations.
          </p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Button size="sm" onClick={() => signInWithGoogle()}>
              Sign in with Google
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => router.push("/signin")}
            >
              Use email
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (hasCompletedOnboarding && !ONBOARDING_TEST_MODE) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner size={24} />
      </div>
    );
  }

  const pageVariants: Variants = {
    initial: (direction: number) => ({
      y: direction > 0 ? 50 : -50,
      opacity: 0,
    }),
    animate: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30,
      },
    },
    exit: (direction: number) => ({
      y: direction < 0 ? 50 : -50,
      opacity: 0,
      transition: {
        duration: 0.2,
      },
    }),
  };

  return (
    <div className="relative h-screen w-full overflow-hidden bg-[#0a0a0a] text-white flex flex-col">
      {/* Static Header with Logo */}
      <div className="absolute top-0 w-full z-50 p-4 md:p-6 flex justify-center pointer-events-none">
        <button
          type="button"
          onClick={handleLogoClick}
          className="text-2xl font-semibold italic tracking-tight text-white/90 hover:text-white transition-colors pointer-events-auto"
        >
          caseground
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 w-full h-full">
        <AnimatePresence mode="wait" custom={step}>
          {step === 1 ? (
            <motion.div
              key="step1"
              custom={1}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="h-full w-full"
            >
              <RoleSelector
                selected={selectedRole}
                onSelect={setSelectedRole}
                onContinue={handleContinue}
                onSkip={handleRoleSkip}
                onLogoClick={handleLogoClick}
              />
            </motion.div>
          ) : (
            <motion.div
              key="step2"
              custom={2}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="h-full w-full"
            >
              <RecommendedCollections
                collections={recommendedCollections}
                roleLabel={roleLabel}
                loading={collectionsLoading}
                isSaving={isSaving}
                onBack={handleBack}
                onLogoClick={handleLogoClick}
                onSkip={() => handleSkip("/dashboard")}
                onViewAll={() => handleComplete("/collections")}
                onView={(collection) => handleComplete(`/collections/${collection.slug}`)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
