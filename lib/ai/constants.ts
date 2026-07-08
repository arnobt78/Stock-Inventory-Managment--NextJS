/**
 * Shared LLM token limits for insights routes (REQ-0019).
 * Forecasting auto-insights and POST /api/ai/insights use the same cap.
 */
export const LLM_INSIGHTS_MAX_TOKENS = 512;
