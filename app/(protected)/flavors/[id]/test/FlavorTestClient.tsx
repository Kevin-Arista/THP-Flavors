"use client";

import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

const BASE_URL = "https://api.almostcrackd.ai";

type Flavor = { id: string; slug: string; description: string | null };
type TestImage = { id: string; url: string; image_description: string | null };
type Caption = { id: string; content: string; [key: string]: unknown };

type Stage =
  | "idle"
  | "presigning"
  | "uploading"
  | "registering"
  | "generating"
  | "success"
  | "error";

const STAGE_LABELS: Partial<Record<Stage, string>> = {
  presigning: "Getting upload URL…",
  uploading: "Uploading image…",
  registering: "Registering image…",
  generating: "Generating captions…",
};

export function FlavorTestClient({
  flavor,
  testImages,
}: {
  flavor: Flavor;
  testImages: TestImage[];
}) {
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [mode, setMode] = useState<"pick" | "upload">("pick");
  const [stage, setStage] = useState<Stage>("idle");
  const [captions, setCaptions] = useState<Caption[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [usedImageUrl, setUsedImageUrl] = useState<string | null>(null);
  const previewRef = useRef<string | null>(null);

  const isProcessing = stage === "presigning" || stage === "uploading" || stage === "registering" || stage === "generating";

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    if (!file) {
      setUploadFile(null);
      setUploadPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    previewRef.current = url;
    setUploadFile(file);
    setUploadPreview(url);
    setErrorMsg(null);
    setStage("idle");
    setCaptions([]);
  }

  async function getToken(): Promise<string | null> {
    const supabase = createClient();
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? null;
  }

  async function runWithExistingImage(imageId: string, imageUrl: string) {
    const token = await getToken();
    if (!token) {
      setErrorMsg("Session expired. Please sign in again.");
      setStage("error");
      return;
    }

    setUsedImageUrl(imageUrl);
    setStage("generating");
    setCaptions([]);

    try {
      const res = await fetch(`${BASE_URL}/pipeline/generate-captions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ imageId, humorFlavorId: flavor.id }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Failed to generate captions: ${text}`);
      }

      const result: Caption[] = await res.json();
      setCaptions(result);
      setStage("success");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : String(err));
      setStage("error");
    }
  }

  async function runWithUpload() {
    if (!uploadFile) return;

    const token = await getToken();
    if (!token) {
      setErrorMsg("Session expired. Please sign in again.");
      setStage("error");
      return;
    }

    const authHeaders = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };

    setCaptions([]);
    setErrorMsg(null);

    try {
      // Step 1: Get presigned URL
      setStage("presigning");
      const presignRes = await fetch(`${BASE_URL}/pipeline/generate-presigned-url`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({ contentType: uploadFile.type }),
      });
      if (!presignRes.ok) {
        throw new Error(`Failed to get upload URL: ${await presignRes.text()}`);
      }
      const { presignedUrl, cdnUrl } = await presignRes.json();
      setUsedImageUrl(cdnUrl);

      // Step 2: Upload
      setStage("uploading");
      const putRes = await fetch(presignedUrl, {
        method: "PUT",
        headers: { "Content-Type": uploadFile.type },
        body: uploadFile,
      });
      if (!putRes.ok) throw new Error(`Upload failed: status ${putRes.status}`);

      // Step 3: Register
      setStage("registering");
      const registerRes = await fetch(`${BASE_URL}/pipeline/upload-image-from-url`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({ imageUrl: cdnUrl, isCommonUse: false }),
      });
      if (!registerRes.ok) {
        throw new Error(`Failed to register image: ${await registerRes.text()}`);
      }
      const { imageId } = await registerRes.json();

      // Step 4: Generate
      setStage("generating");
      const captionRes = await fetch(`${BASE_URL}/pipeline/generate-captions`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({ imageId, humorFlavorId: flavor.id }),
      });
      if (!captionRes.ok) {
        throw new Error(`Failed to generate captions: ${await captionRes.text()}`);
      }

      const result: Caption[] = await captionRes.json();
      setCaptions(result);
      setStage("success");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : String(err));
      setStage("error");
    }
  }

  function handleRun() {
    if (mode === "pick" && selectedImageId) {
      const img = testImages.find((i) => i.id === selectedImageId);
      runWithExistingImage(selectedImageId, img?.url ?? "");
    } else if (mode === "upload" && uploadFile) {
      runWithUpload();
    }
  }

  const canRun =
    !isProcessing &&
    ((mode === "pick" && !!selectedImageId) ||
      (mode === "upload" && !!uploadFile));

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 380px",
        gap: "1.5rem",
        alignItems: "start",
      }}
    >
      {/* Left: image selection */}
      <div>
        {/* Mode tabs */}
        <div
          style={{
            display: "flex",
            gap: "0.5rem",
            marginBottom: "1rem",
          }}
        >
          {(["pick", "upload"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              style={{
                padding: "0.4rem 1rem",
                fontSize: "0.82rem",
                fontWeight: mode === m ? 700 : 400,
                color: mode === m ? "var(--accent-fg)" : "var(--text-muted)",
                background: mode === m ? "var(--accent)" : "var(--bg-card)",
                border: "1px solid var(--border)",
                borderRadius: "7px",
                cursor: "pointer",
              }}
            >
              {m === "pick" ? "Pick from test set" : "Upload image"}
            </button>
          ))}
        </div>

        {mode === "pick" ? (
          <div>
            <p
              style={{
                fontSize: "0.82rem",
                color: "var(--text-dim)",
                marginBottom: "0.75rem",
              }}
            >
              Select an image from the common-use test set:
            </p>

            {testImages.length === 0 ? (
              <div
                style={{
                  padding: "2rem",
                  textAlign: "center",
                  color: "var(--text-dim)",
                  background: "var(--bg-card)",
                  border: "1px solid var(--border)",
                  borderRadius: "12px",
                  fontSize: "0.875rem",
                }}
              >
                No common-use test images found.
                <br />
                Switch to "Upload image" to test with a custom image.
              </div>
            ) : (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))",
                  gap: "0.75rem",
                }}
              >
                {testImages.map((img) => {
                  const selected = selectedImageId === img.id;
                  return (
                    <button
                      key={img.id}
                      onClick={() => {
                        setSelectedImageId(img.id);
                        setStage("idle");
                        setCaptions([]);
                        setErrorMsg(null);
                      }}
                      style={{
                        padding: 0,
                        background: "transparent",
                        border: `2px solid ${selected ? "var(--accent)" : "var(--border)"}`,
                        borderRadius: "8px",
                        cursor: "pointer",
                        overflow: "hidden",
                        transition: "border-color 0.15s",
                        outline: selected ? "2px solid var(--accent)" : "none",
                        outlineOffset: "2px",
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={img.url}
                        alt={img.image_description ?? "Test image"}
                        style={{
                          width: "100%",
                          height: "100px",
                          objectFit: "cover",
                          display: "block",
                        }}
                      />
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div>
            <label
              style={{
                position: "relative",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                minHeight: "160px",
                border: "2px dashed var(--border)",
                borderRadius: "12px",
                background: "var(--bg-card)",
                cursor: "pointer",
                padding: "1.5rem",
                textAlign: "center",
              }}
            >
              <span style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>🖼️</span>
              <span style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>
                {uploadFile ? uploadFile.name : "Click to select an image"}
              </span>
              <span
                style={{
                  fontSize: "0.72rem",
                  color: "var(--text-dim)",
                  marginTop: "0.25rem",
                }}
              >
                JPEG · PNG · WebP · GIF
              </span>
              <input
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                onChange={handleFileChange}
                disabled={isProcessing}
                style={{
                  position: "absolute",
                  inset: 0,
                  opacity: 0,
                  cursor: "pointer",
                }}
              />
            </label>

            {uploadPreview && (
              <div
                style={{
                  marginTop: "0.75rem",
                  borderRadius: "10px",
                  overflow: "hidden",
                  border: "1px solid var(--border)",
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={uploadPreview}
                  alt="Preview"
                  style={{
                    width: "100%",
                    maxHeight: "260px",
                    objectFit: "contain",
                    display: "block",
                    background: "var(--bg-input)",
                  }}
                />
              </div>
            )}
          </div>
        )}

        {/* Run button */}
        <button
          onClick={handleRun}
          disabled={!canRun}
          style={{
            width: "100%",
            marginTop: "1.25rem",
            padding: "0.75rem",
            fontSize: "0.95rem",
            fontWeight: 700,
            color: canRun ? "var(--accent-fg)" : "var(--text-dim)",
            background: canRun ? "var(--accent)" : "var(--border)",
            border: "none",
            borderRadius: "10px",
            cursor: canRun ? "pointer" : "not-allowed",
            transition: "all 0.15s",
          }}
        >
          {isProcessing
            ? STAGE_LABELS[stage]
            : `▶ Generate with "${flavor.slug}"`}
        </button>

        {/* Progress bar */}
        {isProcessing && (
          <div style={{ marginTop: "0.75rem" }}>
            <style>{`
              @keyframes sweep {
                0%   { transform: translateX(-100%); }
                100% { transform: translateX(600%); }
              }
            `}</style>
            <div
              style={{
                width: "100%",
                height: "4px",
                background: "var(--border)",
                borderRadius: "999px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: "30%",
                  background:
                    "linear-gradient(90deg, transparent, var(--accent), transparent)",
                  borderRadius: "999px",
                  animation: "sweep 1.4s ease-in-out infinite",
                }}
              />
            </div>
            {stage === "generating" && (
              <p
                style={{
                  marginTop: "0.5rem",
                  fontSize: "0.78rem",
                  color: "var(--text-dim)",
                }}
              >
                AI is processing — this typically takes 15–30 seconds.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Right: results */}
      <div
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border)",
          borderRadius: "12px",
          padding: "1.5rem",
          minHeight: "300px",
        }}
      >
        <h3
          style={{
            fontSize: "0.85rem",
            fontWeight: 700,
            color: "var(--text-muted)",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            marginBottom: "1rem",
          }}
        >
          Results
        </h3>

        {stage === "idle" && (
          <p style={{ fontSize: "0.875rem", color: "var(--text-dim)" }}>
            Select an image and click "Generate" to test this flavor.
          </p>
        )}

        {(stage === "error" && errorMsg) && (
          <div
            style={{
              color: "var(--error)",
              background: "var(--error-bg)",
              border: "1px solid var(--error-border)",
              borderRadius: "8px",
              padding: "0.75rem",
              fontSize: "0.85rem",
              lineHeight: 1.5,
            }}
          >
            {errorMsg}
          </div>
        )}

        {isProcessing && (
          <p
            style={{
              fontSize: "0.875rem",
              color: "var(--text-muted)",
              fontStyle: "italic",
            }}
          >
            {STAGE_LABELS[stage]}
          </p>
        )}

        {stage === "success" && (
          <div>
            {usedImageUrl && (
              <div
                style={{
                  marginBottom: "1rem",
                  borderRadius: "8px",
                  overflow: "hidden",
                  border: "1px solid var(--border)",
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={usedImageUrl}
                  alt="Tested image"
                  style={{
                    width: "100%",
                    maxHeight: "160px",
                    objectFit: "cover",
                    display: "block",
                  }}
                />
              </div>
            )}

            {captions.length === 0 ? (
              <p style={{ fontSize: "0.875rem", color: "var(--text-dim)" }}>
                No captions returned.
              </p>
            ) : (
              <ol style={{ paddingLeft: "1.25rem", margin: 0 }}>
                {captions.map((c, i) => (
                  <li
                    key={c.id ?? i}
                    style={{
                      fontSize: "0.9rem",
                      color: "var(--text)",
                      lineHeight: 1.6,
                      marginBottom: "0.65rem",
                    }}
                  >
                    {c.content}
                  </li>
                ))}
              </ol>
            )}

            <button
              onClick={() => {
                setStage("idle");
                setCaptions([]);
                setUsedImageUrl(null);
              }}
              style={{
                marginTop: "1rem",
                padding: "0.4rem 0.9rem",
                fontSize: "0.8rem",
                color: "var(--text-muted)",
                background: "transparent",
                border: "1px solid var(--border)",
                borderRadius: "7px",
                cursor: "pointer",
              }}
            >
              Clear
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
