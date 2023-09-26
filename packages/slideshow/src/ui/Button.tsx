import type { ComponentProps, ReactNode } from "react";
import classNames from "./Button.module.css";

export function Button({
  ...props
}: {
  onClick: ComponentProps<"button">["onClick"];
  disabled?: boolean;
  children: ReactNode;
}) {
  return <button {...props} className={classNames["button"]} />;
}
