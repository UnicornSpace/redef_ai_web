import Image from "next/image";
import type { ToolConfig } from "@/lib/tools-config";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { StarHalfIcon, StarIcon } from "lucide-react";

interface SocialProofProps {
  tool: ToolConfig;
}

export function SocialProof({ tool }: SocialProofProps) {
  if (
    !tool.userCount &&
    !tool.rating &&
    (!tool.testimonials || tool.testimonials.length === 0)
  ) {
    return null;
  }

  return (
    <section
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "1.5rem",
        padding: "2rem",
        borderRadius: "16px",
        background: "var(--paper)",
        border: "1px solid var(--line)",
      }}
    >
      {/* Stats row */}
      {/* {(tool.userCount || tool.rating) && (
        <div
          style={{
            display: "flex",
            gap: "2rem",
            flexWrap: "wrap",
          }}
        >
          {tool.userCount && (
            <div>
              <div
                style={{
                  fontSize: "1.4rem",
                  fontWeight: 700,
                  color: "var(--ink)",
                }}
              >
                {tool.userCount}
              </div>
              <div
                style={{
                  fontSize: "0.85rem",
                  color: "var(--body-muted)",
                  marginTop: "0.3rem",
                }}
              >
                Active users
              </div>
            </div>
          )}
          {tool.rating && (
            <div>
              <div
                style={{
                  fontSize: "1.4rem",
                  fontWeight: 700,
                  color: "var(--ink)",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                {tool.rating.toFixed(1)}{" "}
                <span style={{ fontSize: "1rem" }}>⭐</span>
              </div>
              <div
                style={{
                  fontSize: "0.85rem",
                  color: "var(--body-muted)",
                  marginTop: "0.3rem",
                }}
              >
                Average rating
              </div>
            </div>
          )}
        </div>
      )} */}
      {/* Testimonials grid */}
      {tool.testimonials && tool.testimonials.length > 0 && (
        <div
          style={{
            display: "grid",
            gap: "1rem",
            gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
            marginTop: "1rem",
          }}
        >
          {tool.testimonials.map((testimonial, idx) => (
            <div
              key={idx}
              style={{
                padding: "1.2rem",
                borderRadius: "12px",
                background: "#fff",
                border: "1px solid var(--line)",
              }}
            >
              <p
                style={{
                  fontSize: "0.9rem",
                  color: "var(--body)",
                  marginBottom: "1rem",
                  lineHeight: 1.6,
                }}
              >
                "{testimonial.text}"
              </p>
              <div className="flex -gap-1">
                <StarIcon className="fill-black size-4" />
                <StarIcon className="fill-black size-4" />
                <StarIcon className="fill-black size-4" />
                <StarIcon className="fill-black size-4" />
                <StarHalfIcon className="fill-black size-4" />
              </div>
              <div
                style={{
                  display: "flex",
                  gap: "0.75rem",
                  alignItems: "flex-start",
                }}
              >
                <div className="flex w">
                  <Avatar>
                    <AvatarImage src={testimonial.image} alt="User avatar" />
                    <AvatarFallback>
                      {testimonial.author
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  {/* <Image
                      src={testimonial.image}
                      alt={testimonial.author}
                      width={32}
                      height={32}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    /> */}
                </div>

                <div>
                  <div
                    style={{
                      fontSize: "0.9rem",
                      fontWeight: 600,
                      color: "var(--ink)",
                    }}
                  >
                    {testimonial.author}
                  </div>
                  {testimonial.role && (
                    <div
                      style={{
                        fontSize: "0.8rem",
                        color: "var(--body-muted)",
                      }}
                    >
                      {testimonial.role}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
