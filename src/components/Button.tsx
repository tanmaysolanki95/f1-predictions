"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  href?: string;
  loading?: boolean;
};

const SIZE_CLASSES: Record<string, string> = {
  sm: "btn--size-sm",
  md: "btn--size-md",
  lg: "btn--size-lg",
};

const VARIANT_CLASSES: Record<string, string> = {
  primary: "btn--variant-primary",
  secondary: "btn--variant-secondary",
  ghost: "btn--variant-ghost",
};

function Spinner() {
  return <span className="btn-spinner" aria-hidden />;
}

const NAV_TIMEOUT_MS = 8000;

export default function Button({
  variant = "primary",
  size = "md",
  href,
  children,
  className = "",
  loading = false,
  disabled,
  type = "button",
  ...rest
}: ButtonProps) {
  const pathname = usePathname();
  const [navigating, setNavigating] = useState(false);

  useEffect(() => {
    setNavigating(false);
  }, [pathname]);

  useEffect(() => {
    if (!navigating) return;
    const timer = setTimeout(() => setNavigating(false), NAV_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [navigating]);

  const isLink = !!href;
  const showSpinner = isLink ? navigating || loading : loading;
  const isDisabled = disabled || showSpinner;

  const classes = [
    "btn",
    VARIANT_CLASSES[variant],
    SIZE_CLASSES[size],
    isDisabled ? "btn--disabled" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const content = (
    <>
      {showSpinner && <Spinner />}
      {children}
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className={classes}
        aria-disabled={isDisabled || undefined}
        tabIndex={isDisabled ? -1 : undefined}
        onClick={(e) => {
          if (isDisabled) {
            e.preventDefault();
            return;
          }
          setNavigating(true);
        }}
      >
        {content}
      </Link>
    );
  }

  return (
    <button type={type} className={classes} disabled={isDisabled} {...rest}>
      {content}
    </button>
  );
}
