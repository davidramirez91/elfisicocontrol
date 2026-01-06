"use client";

import { useEffect, useState } from "react";

type Theme = "blue" | "dark";
const KEY = "fm_theme";

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.dataset.theme = theme;
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("blue");

  useEffect(() => {
    const saved = (localStorage.getItem(KEY) as Theme | null) ?? "blue";
    setTheme(saved);
    applyTheme(saved);
  }, []);

  function toggle() {
    const next: Theme = theme === "dark" ? "blue" : "dark";
    setTheme(next);
    localStorage.setItem(KEY, next);
    applyTheme(next);
  }

  return (
    <button
      onClick={toggle}
      className="rounded-xl border border-sky-200/60 bg-sky-50/70 px-3 py-2 text-xs font-semibold text-sky-900 hover:bg-sky-100/70 dark:border-white/15 dark:bg-white/10 dark:text-white dark:hover:bg-white/15"
      title="Cambiar tema"
      aria-label="Cambiar tema"
    >
      {theme === "dark" ? "💙 Azul" : "🌙 Oscuro"}
    </button>
  );
}
