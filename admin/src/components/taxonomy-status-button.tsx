"use client";

import type { ComponentProps } from "react";

export function TaxonomyStatusButton({
  confirmation,
  ...props
}: ComponentProps<"button"> & { confirmation: string }) {
  return (
    <button
      {...props}
      onClick={(event) => {
        if (!window.confirm(confirmation)) event.preventDefault();
      }}
    />
  );
}
