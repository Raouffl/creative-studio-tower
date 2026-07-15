import "server-only";

const BASE = "https://api.figma.com/v1";

/** Matches frames named exactly "Version <number>" (case-insensitive). */
const VERSION_FRAME = /^version\s+\d+$/i;

/** Thrown when the Figma integration is misconfigured or the API rejects us. */
export class FigmaError extends Error {
  constructor(
    message: string,
    readonly kind: "config" | "auth" | "http" | "link",
    readonly status?: number,
  ) {
    super(message);
    this.name = "FigmaError";
  }
}

/** A node as returned by the Figma files endpoint (only fields we use). */
interface FigmaNode {
  type: string;
  name: string;
  children?: FigmaNode[];
}

interface FigmaFileResponse {
  name: string;
  document: FigmaNode;
  err?: string;
}

/**
 * Extract the file key from a Figma link. Handles both `/file/`, `/design/`
 * and `/board/` URLs, e.g.
 *   https://www.figma.com/design/8XYPd2DXpPITZa64Jt78Ij/47--Zenpur...
 * returns `8XYPd2DXpPITZa64Jt78Ij`.
 */
export function parseFileKey(link: string): string {
  const match = link.match(/figma\.com\/(?:file|design|board)\/([^/?#]+)/i);
  if (!match)
    throw new FigmaError(`Not a recognizable Figma file link: ${link}`, "link");
  return match[1];
}

/** Depth-first walk yielding every node in the document tree. */
function* walk(node: FigmaNode): Generator<FigmaNode> {
  yield node;
  for (const child of node.children ?? []) yield* walk(child);
}

/**
 * Count the frames named "Version <number>" in a Figma file.
 *
 * @param link  A Figma file/design/board URL (the file key is parsed from it).
 * @returns     The number of FRAME nodes whose name matches "Version X".
 */
export async function countVersions(link: string): Promise<number> {
  const token = process.env.FIGMA_TOKEN;
  if (!token) throw new FigmaError("FIGMA_TOKEN is not set.", "config");

  const key = parseFileKey(link);
  const res = await fetch(`${BASE}/files/${key}`, {
    headers: { "X-Figma-Token": token },
    next: { revalidate: 60 },
  });

  if (res.status === 401 || res.status === 403)
    throw new FigmaError("Figma rejected the API token.", "auth", res.status);
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new FigmaError(
      `Figma API error ${res.status}: ${body.slice(0, 200)}`,
      "http",
      res.status,
    );
  }

  const data = (await res.json()) as FigmaFileResponse;
  if (data.err) throw new FigmaError(`Figma API error: ${data.err}`, "http");
  if (!data.document)
    throw new FigmaError("Figma response had no document tree.", "http");

  let count = 0;
  for (const node of walk(data.document))
    if (node.type === "FRAME" && VERSION_FRAME.test(node.name.trim())) count++;
  return count;
}
