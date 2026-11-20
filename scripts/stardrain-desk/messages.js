export const DESK_EDITOR = "koolskull.eth";
export const DESK_HOST = "stardrain.app";

export function approvalMessage(articleId, note) {
  return [
    "Stardrain wiki",
    `Host: ${DESK_HOST}`,
    `Editor: ${DESK_EDITOR}`,
    `Article: ${articleId}`,
    "Action: approve",
    "Note:",
    String(note ?? "").trim(),
  ].join("\n");
}

export function loginMessage(address) {
  return [
    "Stardrain wiki",
    `Host: ${DESK_HOST}`,
    `Editor: ${DESK_EDITOR}`,
    `Address: ${address}`,
    "Action: login",
  ].join("\n");
}
