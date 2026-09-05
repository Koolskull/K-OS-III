"use client";

import React from "react";

const font = "var(--dm-font-primary)";

export function TabBar({
  tabs,
  current,
  onChange,
}: {
  tabs: { id: string; label: string }[];
  current: string;
  onChange: (id: string) => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        borderBottom: "2px solid #333",
        flexShrink: 0,
        overflowX: "auto",
      }}
    >
      {tabs.map((t) => {
        const on = t.id === current;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => onChange(t.id)}
            style={{
              ...btnBase,
              border: "none",
              borderRight: "1px solid #333",
              background: on ? "#1a1a1a" : "#000",
              color: on ? "#fff" : "#888",
              height: 28,
            }}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}

const btnBase: React.CSSProperties = {
  fontFamily: font,
  fontSize: 9,
  letterSpacing: 1,
  color: "#fff",
  background: "#000",
  border: "2px solid #555",
  borderRadius: 0,
  cursor: "pointer",
  padding: "0 10px",
  height: 26,
  imageRendering: "pixelated",
};

export function Btn({
  children,
  onClick,
  disabled,
  danger,
  type = "button",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  danger?: boolean;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      style={{
        ...btnBase,
        borderColor: danger ? "#aa2222" : "#555",
        color: disabled ? "#555" : danger ? "#ff6666" : "#fff",
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {children}
    </button>
  );
}

export function Field({
  label,
  value,
  onChange,
  placeholder,
  mono,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  mono?: boolean;
}) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 0 }}>
      <span
        style={{
          fontFamily: font,
          fontSize: 8,
          color: "#888",
          letterSpacing: 1,
        }}
      >
        {label}
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        spellCheck={false}
        style={{
          fontFamily: font,
          fontSize: mono ? 9 : 10,
          color: "#fff",
          background: "#000",
          border: "1px solid #444",
          borderRadius: 0,
          padding: "6px 8px",
          outline: "none",
          width: "100%",
          boxSizing: "border-box",
        }}
      />
    </label>
  );
}

export function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 0 }}>
      <span
        style={{
          fontFamily: font,
          fontSize: 8,
          color: "#888",
          letterSpacing: 1,
        }}
      >
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          fontFamily: font,
          fontSize: 10,
          color: "#fff",
          background: "#000",
          border: "1px solid #444",
          borderRadius: 0,
          padding: "6px 8px",
          outline: "none",
        }}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function Grid({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        gap: 10,
      }}
    >
      {children}
    </div>
  );
}

export function Note({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        fontFamily: font,
        fontSize: 10,
        color: "#888",
        lineHeight: 1.5,
        margin: 0,
      }}
    >
      {children}
    </p>
  );
}

export function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ border: "1px solid #333", padding: 10 }}>
      <div
        style={{
          fontFamily: font,
          fontSize: 8,
          color: "#888",
          letterSpacing: 1,
          marginBottom: 6,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: font,
          fontSize: 12,
          color: "#fff",
          wordBreak: "break-all",
        }}
      >
        {value}
      </div>
    </div>
  );
}

export function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <h2
        style={{
          fontFamily: font,
          fontSize: 11,
          color: "#fff",
          letterSpacing: 2,
          margin: 0,
          borderBottom: "1px solid #333",
          paddingBottom: 6,
        }}
      >
        {title}
      </h2>
      {children}
    </section>
  );
}
