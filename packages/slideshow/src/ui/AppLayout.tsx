import type { ReactNode } from "react";
import classNames from "./AppLayout.module.css";

export function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div>
      <header className={classNames["header"]}>
        <h1 className={classNames["app-title"]}>Randolphins</h1>
        <p className={classNames["app-subtitle"]}>Random photos of dolphins</p>
      </header>

      {children}
    </div>
  );
}
