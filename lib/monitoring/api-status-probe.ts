/**
 * Client-side API endpoint probes for /api-status.
 * Batched parallel GETs — avoids sequential 16× round-trips on page load.
 */

import type { ApiStatusEndpointDef } from "./api-status-endpoints";

export type EndpointProbeResult = {
  name: string;
  path: string;
  status: "OK" | "ERROR" | "TIMEOUT";
  responseTime?: number;
  lastChecked: string;
};

const PROBE_TIMEOUT_MS = 5000;
const PROBE_BATCH_SIZE = 4;

export async function probeApiEndpoint(
  path: string,
): Promise<{ status: "OK" | "ERROR" | "TIMEOUT"; responseTime?: number }> {
  const startTime = Date.now();
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);

    const response = await fetch(path, {
      method: "GET",
      signal: controller.signal,
      credentials: "include",
    });

    clearTimeout(timeoutId);
    const responseTime = Date.now() - startTime;

    if (response.ok) {
      return { status: "OK", responseTime };
    }
    return { status: "ERROR", responseTime };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    if (error instanceof Error && error.name === "AbortError") {
      return { status: "TIMEOUT", responseTime };
    }
    return { status: "ERROR", responseTime };
  }
}

/** Probe endpoints in parallel batches (default 4 concurrent). */
export async function probeApiEndpointsBatched(
  endpoints: readonly ApiStatusEndpointDef[],
  batchSize = PROBE_BATCH_SIZE,
): Promise<EndpointProbeResult[]> {
  const results: EndpointProbeResult[] = [];
  const checkedAt = new Date().toLocaleString();

  for (let i = 0; i < endpoints.length; i += batchSize) {
    const batch = endpoints.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(async (endpoint) => {
        const { status, responseTime } = await probeApiEndpoint(endpoint.path);
        return {
          name: endpoint.name,
          path: endpoint.path,
          status,
          responseTime,
          lastChecked: checkedAt,
        } satisfies EndpointProbeResult;
      }),
    );
    results.push(...batchResults);
  }

  return results;
}
