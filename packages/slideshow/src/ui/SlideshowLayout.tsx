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
        <div className={classNames["left-button"]}>{modeButton}</div>
        <div className={classNames["right-button"]}>{pauseResumeButton}</div>
      </div>

      <div className={classNames["photo-container"]}>{children}</div>
    </div>
  );
}
