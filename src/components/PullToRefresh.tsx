"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

const THRESHOLD = 56;  // visual px required to trigger refresh
const MAX_PULL = 80;   // max visual displacement

type Phase = "idle" | "pulling" | "refreshing";

export default function PullToRefresh({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [pull, setPull] = useState(0);
  const [phase, setPhase] = useState<Phase>("idle");

  // Refs so event handlers are stable with no deps churn
  const startY = useRef(0);
  const active = useRef(false);
  const pullRef = useRef(0);
  const phaseRef = useRef<Phase>("idle");

  useEffect(() => {
    const onStart = (e: TouchEvent) => {
      if (window.scrollY > 0 || phaseRef.current === "refreshing") return;
      startY.current = e.touches[0].clientY;
      active.current = true;
    };

    const onMove = (e: TouchEvent) => {
      if (!active.current) return;
      const delta = e.touches[0].clientY - startY.current;

      if (delta <= 0) {
        active.current = false;
        pullRef.current = 0;
        phaseRef.current = "idle";
        setPull(0);
        setPhase("idle");
        return;
      }

      // 0.5× resistance so it feels like pulling against tension
      const visual = Math.min(delta * 0.5, MAX_PULL);
      pullRef.current = visual;
      phaseRef.current = "pulling";
      setPull(visual);
      setPhase("pulling");
      e.preventDefault();
    };

    const onEnd = () => {
      if (!active.current) return;
      active.current = false;

      if (pullRef.current >= THRESHOLD) {
        phaseRef.current = "refreshing";
        setPhase("refreshing");
        setPull(Math.round(THRESHOLD * 0.75)); // settle to a smaller position
        router.refresh();
        setTimeout(() => {
          phaseRef.current = "idle";
          pullRef.current = 0;
          setPhase("idle");
          setPull(0);
        }, 1500);
      } else {
        phaseRef.current = "idle";
        pullRef.current = 0;
        setPhase("idle");
        setPull(0);
      }
    };

    window.addEventListener("touchstart", onStart, { passive: true });
    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("touchend", onEnd);
    return () => {
      window.removeEventListener("touchstart", onStart);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onEnd);
    };
  }, [router]);

  const progress = Math.min(pull / THRESHOLD, 1);
  const triggered = pull >= THRESHOLD;
  const visible = pull > 4 || phase === "refreshing";
  const animating = phase !== "pulling";

  // Indicator sits in the revealed gap above the content.
  // translateY: starts off-screen (-20px), slides in as pull increases.
  const indicatorY = pull * 0.6 - 20;

  return (
    <>
      {/* Indicator — fixed at viewport top, slides into the gap as content shifts down */}
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          top: 0,
          left: "50%",
          transform: `translateX(-50%) translateY(${indicatorY}px)`,
          transition: animating ? "transform 0.3s ease, opacity 0.3s ease" : "none",
          opacity: visible ? Math.min(progress * 2, 1) : 0,
          zIndex: 100,
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            background: "var(--surface-elevated)",
            border: "1px solid var(--border-light)",
            boxShadow: "var(--shadow-md)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {phase === "refreshing" ? (
            <span
              className="btn-spinner"
              style={{
                borderColor: "rgba(225,6,0,0.45)",
                borderTopColor: "transparent",
              }}
            />
          ) : (
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              style={{
                transform: `rotate(${triggered ? 180 : Math.round(progress * 160)}deg)`,
                transition: "transform 0.2s ease",
                color: triggered ? "var(--f1-red)" : "var(--muted)",
              }}
            >
              <path
                d="M8 3v10M4 9l4 4 4-4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </div>
      </div>

      {/* Entire page content (Nav + main) slides down during pull */}
      <div
        style={{
          transform: `translateY(${pull}px)`,
          transition: animating ? "transform 0.3s ease" : "none",
          willChange: "transform",
        }}
      >
        {children}
      </div>
    </>
  );
}
