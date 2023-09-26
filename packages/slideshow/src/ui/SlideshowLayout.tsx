import type { ReactElement, ReactNode } from "react";
import classNames from "./SlideshowLayout.module.css";

export function SlideshowLayout({
  modeButton,
  pauseResumeButton,
  children,
}: {
  modeButton: ReactElement;
  pauseResumeButton: ReactElement;
  children: ReactNode;
}) {
  return (
    <div className={classNames["slideshow-container"]}>
      <div className={classNames["buttons-container"]}>
        {modeButton}
        {pauseResumeButton}
      </div>

      <div className={classNames["photo-container"]}>{children}</div>
    </div>
  );
}
