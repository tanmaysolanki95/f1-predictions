"use client";

import React from "react";
import Link from "next/link";

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
  const isDisabled = disabled || loading;
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
      {loading && <Spinner />}
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
