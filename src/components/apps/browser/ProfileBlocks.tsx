"use client";

import { youtubeEmbedUrl } from "@/lib/profile-sanitize";

export interface PublicProfileBlock {
  id?: number;
  block_type: string;
  payload: Record<string, unknown>;
  sort_order?: number;
}

const box: React.CSSProperties = {
  border: "1px solid #333",
  background: "#0a0a0a",
  marginTop: 8,
  overflow: "hidden",
};

export function ProfileBlocksView({ blocks }: { blocks: PublicProfileBlock[] }) {
  if (!blocks?.length) return null;
  return (
    <div style={{ marginTop: 12 }}>
      {blocks.map((b, i) => (
        <ProfileBlockView key={b.id ?? i} block={b} />
      ))}
    </div>
  );
}

function NftCard({
  name,
  image,
  contractAddress,
  tokenId,
}: {
  name?: string | null;
  image?: string | null;
  contractAddress?: string;
  tokenId?: string;
}) {
  return (
    <div style={{ border: "1px solid #333", background: "#000", padding: 4 }}>
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={image}
          alt={name ?? ""}
          referrerPolicy="no-referrer"
          style={{ width: "100%", aspectRatio: "1", objectFit: "cover", display: "block" }}
        />
      ) : (
        <div style={{ width: "100%", aspectRatio: "1", background: "#111" }} />
      )}
      <div style={{ fontSize: 7, color: "#ccc", marginTop: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {name || "NFT"}
      </div>
      {contractAddress && (
        <div style={{ fontSize: 5, color: "#555", wordBreak: "break-all" }}>
          {contractAddress.slice(0, 8)}…#{tokenId}
        </div>
      )}
    </div>
  );
}

function ProfileBlockView({ block }: { block: PublicProfileBlock }) {
  const p = block.payload ?? {};
  switch (block.block_type) {
    case "text":
      return (
        <div style={{ ...box, padding: 8, fontSize: 8, color: "#ccc", whiteSpace: "pre-wrap", lineHeight: 1.5 }}>
          {typeof p.body === "string" ? p.body : ""}
        </div>
      );
    case "image":
    case "gif":
      return typeof p.url === "string" ? (
        <div style={box}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={p.url}
            alt=""
            referrerPolicy="no-referrer"
            style={{ display: "block", width: "100%", maxHeight: 280, objectFit: "contain", background: "#000" }}
          />
        </div>
      ) : null;
    case "youtube": {
      const videoId = typeof p.videoId === "string" ? p.videoId : "";
      if (!videoId) return null;
      let src: string;
      try {
        src = youtubeEmbedUrl(videoId);
      } catch {
        return null;
      }
      return (
        <div style={{ ...box, position: "relative", paddingTop: "56.25%" }}>
          <iframe
            src={src}
            title="YouTube"
            loading="lazy"
            referrerPolicy="no-referrer"
            allow="accelerometer; encrypted-media; picture-in-picture"
            sandbox="allow-scripts allow-same-origin allow-presentation"
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0 }}
          />
        </div>
      );
    }
    case "iframe": {
      const url = typeof p.url === "string" ? p.url : "";
      if (!url) return null;
      return (
        <div style={{ ...box, position: "relative", paddingTop: "56.25%" }}>
          <iframe
            src={url}
            title="Embed"
            loading="lazy"
            referrerPolicy="no-referrer"
            sandbox="allow-scripts allow-same-origin allow-presentation"
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0 }}
          />
        </div>
      );
    }
    case "nft":
      return (
        <div style={{ ...box, padding: 6, maxWidth: 160 }}>
          <NftCard
            name={typeof p.name === "string" ? p.name : null}
            image={typeof p.image === "string" ? p.image : null}
            contractAddress={typeof p.contractAddress === "string" ? p.contractAddress : undefined}
            tokenId={typeof p.tokenId === "string" ? p.tokenId : undefined}
          />
        </div>
      );
    case "nft_gallery": {
      const items = Array.isArray(p.items) ? p.items : [];
      return (
        <div style={{ ...box, padding: 6 }}>
          <div style={{ fontSize: 6, color: "#666", letterSpacing: 1, marginBottom: 6 }}>NFT GALLERY</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 4 }}>
            {items.map((item, i) => {
              const n = item as Record<string, unknown>;
              return (
                <NftCard
                  key={i}
                  name={typeof n.name === "string" ? n.name : null}
                  image={typeof n.image === "string" ? n.image : null}
                  contractAddress={typeof n.contractAddress === "string" ? n.contractAddress : undefined}
                  tokenId={typeof n.tokenId === "string" ? n.tokenId : undefined}
                />
              );
            })}
          </div>
        </div>
      );
    }
    default:
      return null;
  }
}
