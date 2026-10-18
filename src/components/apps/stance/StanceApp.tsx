"use client";

/*
 *                    ☦
 *      EPISTEMIC STANCE — K-OS III APP
 *
 *  Standalone method reader. Not embedded in NODEMAP.
 *  Dylan Louis Monroe / dsmp.io thanked for research influence only.
 */

import React from "react";
import { EPISTEMIC_STANCE } from "./epistemic";

export function StanceApp() {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        backgroundColor: "#000",
        color: "#fff",
        fontFamily: "var(--dm-font-primary), monospace",
        imageRendering: "pixelated",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <header
        style={{
          flexShrink: 0,
          borderBottom: "2px solid #fff",
          padding: "10px 16px",
        }}
      >
        <div style={{ fontSize: 9, letterSpacing: 2, color: "#666" }}>
          K-OS III · EDUCATION / METHOD
        </div>
        <h1
          style={{
            margin: "6px 0 4px",
            fontSize: 16,
            letterSpacing: 3,
            color: "#00ff00",
            fontWeight: 700,
          }}
        >
          {EPISTEMIC_STANCE.title}
        </h1>
        <p style={{ margin: 0, fontSize: 11, color: "#aaa", lineHeight: 1.45, maxWidth: 640 }}>
          {EPISTEMIC_STANCE.subtitle}
        </p>
      </header>

      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "16px 18px 28px",
        }}
      >
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          {EPISTEMIC_STANCE.sections.map((section, idx) => (
            <section
              key={section.heading}
              style={{
                marginBottom: 18,
                border: "1px solid #333",
                background: "#0a0a0a",
                padding: 14,
              }}
            >
              <div style={{ display: "flex", gap: 10, alignItems: "baseline", marginBottom: 10 }}>
                <span style={{ fontSize: 9, color: "#555", letterSpacing: 1 }}>
                  {String(idx + 1).padStart(2, "0")}
                </span>
                <h2
                  style={{
                    margin: 0,
                    fontSize: 12,
                    letterSpacing: 2,
                    color: "#fff",
                    textTransform: "uppercase",
                  }}
                >
                  {section.heading}
                </h2>
              </div>
              {section.body.map((para) => (
                <p
                  key={para.slice(0, 48)}
                  style={{
                    margin: "0 0 10px",
                    fontSize: 12,
                    lineHeight: 1.55,
                    color: "#bbb",
                  }}
                >
                  {para.includes("https://dsmp.io") ? (
                    <>
                      {para.split("https://dsmp.io").map((part, i) =>
                        i === 0 ? (
                          <span key={i}>{part}</span>
                        ) : (
                          <span key={i}>
                            <a
                              href="https://dsmp.io"
                              target="_blank"
                              rel="noreferrer"
                              style={{ color: "#00ff00" }}
                            >
                              https://dsmp.io
                            </a>
                            {part}
                          </span>
                        ),
                      )}
                    </>
                  ) : (
                    para
                  )}
                </p>
              ))}
            </section>
          ))}

          <section
            style={{
              border: "2px solid #00ff00",
              background: "#0a0a00",
              padding: 14,
              marginBottom: 18,
            }}
          >
            <h2
              style={{
                margin: "0 0 8px",
                fontSize: 11,
                letterSpacing: 2,
                color: "#00ff00",
                textTransform: "uppercase",
              }}
            >
              Further research
            </h2>
            <p style={{ margin: "0 0 12px", fontSize: 12, lineHeight: 1.5, color: "#ccc" }}>
              Dylan Louis Monroe — Deep State Mapping Project. Free PDF downloads
              available for study. NODEMAP is an original tool; this stance is a
              separate K-OS III app.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              <a
                href="https://dsmp.io"
                target="_blank"
                rel="noreferrer"
                style={linkBtn}
              >
                dsmp.io
              </a>
              <a
                href="https://dsmp.io/product-category/downloads/"
                target="_blank"
                rel="noreferrer"
                style={{ ...linkBtn, background: "transparent", color: "#fff", border: "1px solid #fff" }}
              >
                Free PDFs
              </a>
            </div>
          </section>
        </div>
      </div>

      <footer
        style={{
          flexShrink: 0,
          borderTop: "1px solid #444",
          padding: "8px 16px",
          fontSize: 9,
          letterSpacing: 1,
          color: "#666",
          textTransform: "uppercase",
        }}
      >
        {EPISTEMIC_STANCE.footer}
      </footer>
    </div>
  );
}

const linkBtn: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  background: "#00ff00",
  color: "#000",
  border: "none",
  padding: "8px 12px",
  fontFamily: "inherit",
  fontSize: 11,
  letterSpacing: 1,
  textDecoration: "none",
  fontWeight: 700,
  cursor: "pointer",
};

export default StanceApp;
