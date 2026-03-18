"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { readJson, writeJson } from "@/lib/storage";
import { supabase } from "@/lib/supabase";

const ONBOARDING_KEY = "cx.onboarding.v1";

export function OnboardingModal() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [userName, setUserName] = useState("");

  useEffect(() => {
    async function check() {
      const dismissed = readJson<boolean>(ONBOARDING_KEY, false);
      if (dismissed) return;
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data: profile } = await supabase
        .from("profiles")
        .select("name, created_at")
        .eq("id", session.user.id)
        .single();
      if (!profile) return;
      // Show onboarding if account was created in the last 5 minutes
      const age = Date.now() - new Date(profile.created_at).getTime();
      if (age < 5 * 60 * 1000) {
        setUserName(profile.name.split(" ")[0]);
        setOpen(true);
      }
    }
    check();
  }, []);

  function dismiss() {
    writeJson(ONBOARDING_KEY, true);
    setOpen(false);
  }

  function handleNext() {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      dismiss();
    }
  }

  const steps = [
    {
      icon: (
        <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-sm shadow-indigo-500/30">
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-7 w-7" aria-hidden="true">
            <path fillRule="evenodd" d="M16.704 4.296a1 1 0 0 1 0 1.414l-7.5 7.5a1 1 0 0 1-1.414 0l-3.5-3.5a1 1 0 0 1 1.414-1.414l2.793 2.793 6.793-6.793a1 1 0 0 1 1.414 0Z" clipRule="evenodd" />
          </svg>
        </div>
      ),
      title: `Welcome to CX App, ${userName}! 🎉`,
      description: "You're all set up. CX App helps your customer success team track health scores, spot churn risk early, and act fast with AI-powered tools.",
      action: "Get started",
    },
    {
      icon: (
        <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-sm shadow-indigo-500/30">
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-7 w-7" aria-hidden="true">
            <path d="M10 9a3 3 0 1 0-3-3 3 3 0 0 0 3 3Zm6.5 9a.75.75 0 0 1-.75-.75 4.75 4.75 0 0 0-9.5 0 .75.75 0 0 1-1.5 0 6.25 6.25 0 0 1 12.5 0 .75.75 0 0 1-.75.75Z" />
          </svg>
        </div>
      ),
      title: "Your customers are ready",
      description: "We've added sample customers so you can explore the app right away. Head to the Customers page to see health scores, risk levels, and activity signals.",
      action: "View customers",
    },
    {
      icon: (
        <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-sm shadow-indigo-500/30">
          <svg viewBox="0 0 20 20" fill="currentColor" className="h-7 w-7" aria-hidden="true">
            <path d="M3 10a7 7 0 1 1 14 0v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-5Zm7-4a.75.75 0 0 1 .75.75V10a.75.75 0 0 1-1.5 0V6.75A.75.75 0 0 1 10 6Z" />
          </svg>
        </div>
      ),
      title: "Explore the dashboard",
      description: "The dashboard gives you a real-time overview of your entire portfolio — who's healthy, who's at risk, and what needs your attention today.",
      action: "Go to dashboard",
    },
  ];

  const current = steps[step];

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white shadow-lg shadow-slate-900/15">

        {/* Progress dots */}
        <div className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <div className="flex items-center gap-1.5">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all ${i === step ? "w-6 bg-indigo-600" : i < step ? "w-3 bg-indigo-300" : "w-3 bg-gray-200"}`}
              />
            ))}
          </div>
          <button
            onClick={dismiss}
            className="text-xs font-semibold text-gray-400 transition hover:text-gray-700"
          >
            Skip
          </button>
        </div>

        {/* Content */}
        <div className="p-6 text-center">
          <div className="flex justify-center">{current.icon}</div>
          <h2 className="mt-4 text-lg font-semibold tracking-tight text-gray-900">{current.title}</h2>
          <p className="mt-2 text-sm text-gray-600 leading-relaxed">{current.description}</p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 border-t border-gray-200 px-5 py-4">
          {step > 0 && (
            <button
              onClick={() => setStep(step - 1)}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-900 shadow-sm transition hover:bg-gray-50 focus:outline-none focus:ring-4 focus:ring-indigo-600/15"
            >
              Back
            </button>
          )}
          <button
            onClick={() => {
              if (step === 1) router.push("/customers");
              if (step === 2) router.push("/dashboard");
              handleNext();
            }}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-indigo-600/20 transition hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-600/20"
          >
            {current.action}
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden="true">
              <path fillRule="evenodd" d="M3 10a.75.75 0 0 1 .75-.75h10.638L10.23 5.29a.75.75 0 1 1 1.04-1.08l5.5 5.25a.75.75 0 0 1 0 1.08l-5.5 5.25a.75.75 0 1 1-1.04-1.08l4.158-3.96H3.75A.75.75 0 0 1 3 10Z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

      </div>
    </div>
  );
}
