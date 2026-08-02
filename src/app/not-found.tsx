"use client";

import { motion } from "motion/react";
import { Manrope } from "next/font/google";
import "@/styles/redef-theme.css";
import {
  Daisy,
  EchoMascot,
  MotionProvider,
  PillButton,
  RedefLogo,
  Sparkle,
  springSmooth,
} from "@/components/new-landing-page-components/shared";

const manrope = Manrope({ subsets: ["latin"], display: "swap" });

export default function NotFound() {
  return (
    <div className={`redef redef-root ${manrope.className}`}>
      <MotionProvider>
        <div
          style={{
            minHeight: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "2rem 1.5rem",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <a
            href="/"
            aria-label="Redef AI home"
            style={{
              position: "absolute",
              top: "1.75rem",
              left: "1.75rem",
              textDecoration: "none",
            }}
          >
            <RedefLogo height={22} />
          </a>

          {/* floating sparkles around the scene */}
          <motion.span
            style={{ position: "absolute", top: "18%", left: "20%" }}
            animate={{ scale: [1, 1.25, 1], opacity: [0.7, 1, 0.7] }}
            transition={{
              repeat: Number.POSITIVE_INFINITY,
              duration: 3.2,
              ease: "easeInOut",
            }}
          >
            <Sparkle size={22} color="var(--rf-amber)" />
          </motion.span>
          <motion.span
            style={{ position: "absolute", top: "24%", right: "18%" }}
            animate={{ scale: [1, 1.3, 1], opacity: [0.6, 1, 0.6] }}
            transition={{
              repeat: Number.POSITIVE_INFINITY,
              duration: 3.8,
              delay: 0.6,
              ease: "easeInOut",
            }}
          >
            <Sparkle size={16} color="var(--g-stone)" />
          </motion.span>
          <motion.span
            style={{ position: "absolute", bottom: "20%", right: "24%" }}
            animate={{ y: [0, -8, 0], rotate: [0, 6, 0] }}
            transition={{
              repeat: Number.POSITIVE_INFINITY,
              duration: 4.4,
              ease: "easeInOut",
            }}
          >
            <Daisy size={56} />
          </motion.span>

          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{
              repeat: Number.POSITIVE_INFINITY,
              duration: 4.4,
              ease: "easeInOut",
            }}
            style={{ marginBottom: "1.5rem" }}
          >
            <EchoMascot size={132} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={springSmooth}
            style={{
              textAlign: "center",
              maxWidth: 480,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "0.6rem",
              position: "relative",
              zIndex: 1,
            }}
          >
            <p className="f-eyebrow" style={{ color: "var(--rf-coral)" }}>
              404
            </p>
            <h1
              className="f-h1"
              style={{ fontSize: "clamp(2rem, 5vw, 2.9rem)" }}
            >
              This page went quiet.
            </h1>
            <p className="f-lede" style={{ margin: "0.4rem 0 1.6rem" }}>
              Echo listened, but there's nothing here. The page you're looking
              for doesn't exist or may have moved.
            </p>
            <div
              style={{
                display: "flex",
                gap: "0.75rem",
                flexWrap: "wrap",
                justifyContent: "center",
              }}
            >
              <PillButton variant="dark" href="/">
                Take me home
              </PillButton>
              <PillButton variant="beige" href="/tools">
                Browse free tools
              </PillButton>
            </div>
          </motion.div>
        </div>
      </MotionProvider>
    </div>
  );
}
