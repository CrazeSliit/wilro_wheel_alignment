"use client";

import { useEffect, useState } from "react";

interface GreetingProps {
  name: string;
}

export default function Greeting({ name }: GreetingProps) {
  const [greeting, setGreeting] = useState("Hello");
  const [today, setToday] = useState("");

  useEffect(() => {
    const now = new Date();
    const hour = now.getHours();
    setGreeting(
      hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening"
    );
    setToday(
      now.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    );
  }, []);

  return (
    <>
      <p className="text-primary-foreground/60 text-xs font-medium uppercase tracking-widest mb-1">
        {today}
      </p>
      <h1 className="text-2xl font-bold text-primary-foreground leading-tight">
        {greeting}, {name} 👋
      </h1>
    </>
  );
}
