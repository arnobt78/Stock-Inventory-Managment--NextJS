"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { DETAIL_PAGE_HEADER_SPACING_CLASS } from "@/lib/ui/shell-layout-styles";
import {
  GLASS_BUTTON_ICON_HOVER,
  GLASS_PRIMARY_BUTTON,
} from "@/lib/ui/glass-button-styles";
import React, { useEffect, useState } from "react";
import {
  FiActivity,
  FiAlertCircle,
  FiCheckCircle,
  FiDatabase,
  FiMail,
  FiPackage,
  FiRefreshCw,
  FiServer,
  FiXCircle,
  FiImage,
  FiCloud,
  FiTrendingUp,
  FiClock,
  FiCpu,
  FiHardDrive,
} from "react-icons/fi";
import Navbar from "@/components/layouts/Navbar";
import {
  PageContentWrapper,
  PageSectionHeader,
  SectionCardHeader,
  GlassCard,
  GLASS_CARD_VARIANT_CONFIG as variantConfig,
} from "@/components/shared";
import type { GlassCardVariant } from "@/lib/ui/glass-card";
import { GlassCardBody } from "@/lib/ui/glass-card";
import {
  getApiStatusEndpointsForRole,
  type ApiStatusRole,
} from "@/lib/monitoring/api-status-endpoints";
import {
  probeApiEndpointsBatched,
  type EndpointProbeResult,
} from "@/lib/monitoring/api-status-probe";
import {
  Activity,
  Cloud,
  Cpu,
  Package,
  Server,
  TrendingUp,
} from "lucide-react";

type EndpointStatus = EndpointProbeResult;

interface ApiStatusPageProps {
  /** SSR role — scopes probes + admin-only metrics (REQ-0093). */
  userRole: ApiStatusRole | string;
}

interface ServiceHealth {
  status: "OK" | "ERROR" | "NOT_CONFIGURED";
  responseTime: number;
  message: string;
}

interface HealthCheckResponse {
  data: {
    status: "HEALTHY" | "DEGRADED" | "DOWN";
    timestamp: string;
    uptime: string;
    services: {
      database: ServiceHealth;
      redis: ServiceHealth;
      imagekit: ServiceHealth;
      brevo: ServiceHealth;
    };
    environment: string;
  };
}

interface PerformanceSummary {
  totalEndpoints: number;
  totalRequests: number;
  averageResponseTime: number;
  overallErrorRate: number;
  topSlowEndpoints: Array<{
    endpoint: string;
    method: string;
    averageResponseTime: number;
    totalRequests: number;
  }>;
  topErrorEndpoints: Array<{
    endpoint: string;
    method: string;
    errorRate: number;
    totalRequests: number;
  }>;
}

interface SystemMetrics {
  cache: {
    hits: number;
    misses: number;
    hitRate: number;
    totalRequests: number;
  };
  database: {
    totalQueries: number;
    averageQueryTime: number;
    slowQueries: number;
  };
  resources: {
    memoryUsage: {
      rss: number;
      heapTotal: number;
      heapUsed: number;
      external: number;
    };
    cpuUsage: {
      user: number;
      system: number;
    };
    uptime: number;
    nodeVersion: string;
    platform: string;
  };
}

interface SystemStatus {
  project: string;
  environment: string;
  currentTime: string;
  uptime: string;
  apiHealth: "HEALTHY" | "DEGRADED" | "DOWN";
  endpoints: EndpointStatus[];
  services: {
    database: ServiceHealth;
    redis: ServiceHealth;
    imagekit: ServiceHealth;
    brevo: ServiceHealth;
  };
  performance?: PerformanceSummary;
  systemMetrics?: SystemMetrics;
  deployment: string;
  lastChecked: string;
}

export default function ApiStatusPage({ userRole }: ApiStatusPageProps) {
  const roleEndpoints = getApiStatusEndpointsForRole(userRole);
  const isAdminMetricsRole =
    userRole === "admin" || userRole === "user";
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { toast } = useToast();

  const loadSystemStatus = async (opts?: { isCancelled?: () => boolean }) => {
    const isCancelled = () => opts?.isCancelled?.() ?? false;
    try {
      // Health once; role-scoped batched probes; admin metrics only for admin/user
      const [healthResponse, endpointStatuses, performanceResponse, systemMetricsResponse] =
        await Promise.all([
          fetch("/api/health", {
            method: "GET",
            credentials: "include",
          }).then((res) => res.json() as Promise<HealthCheckResponse>),
          probeApiEndpointsBatched(roleEndpoints),
          isAdminMetricsRole
            ? fetch("/api/performance", {
                method: "GET",
                credentials: "include",
              })
                .then((res) => res.json())
                .catch(() => null)
            : Promise.resolve(null),
          isAdminMetricsRole
            ? fetch("/api/system-metrics", {
                method: "GET",
                credentials: "include",
              })
                .then((res) => res.json())
                .catch(() => null)
            : Promise.resolve(null),
        ]);

      if (isCancelled()) return;

      const healthData = healthResponse.data;
      const performanceData = performanceResponse?.data?.summary as
        | PerformanceSummary
        | undefined;
      const systemMetricsData = systemMetricsResponse?.data as
        | SystemMetrics
        | undefined;

      const status: SystemStatus = {
        project: "Stockly Inventory Management",
        environment: healthData.environment,
        currentTime: new Date(healthData.timestamp).toLocaleString(),
        uptime: healthData.uptime,
        apiHealth: healthData.status,
        endpoints: endpointStatuses,
        services: healthData.services,
        performance: performanceData,
        systemMetrics: systemMetricsData,
        deployment: "Local / Custom",
        lastChecked: new Date().toLocaleString(),
      };

      setSystemStatus(status);
    } catch (error) {
      if (isCancelled()) return;
      toast({
        title: "Error Loading Status",
        description: "Failed to load system status. Please try again.",
        variant: "destructive",
      });
    } finally {
      if (!isCancelled()) {
        setIsLoading(false);
      }
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadSystemStatus();
    setIsRefreshing(false);
    toast({
      title: "Status Updated",
      description: "System status has been refreshed.",
    });
  };

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    void loadSystemStatus({ isCancelled: () => cancelled });
    return () => {
      cancelled = true;
    };
  }, [userRole]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "OK":
      case "HEALTHY":
        return <FiCheckCircle className="h-4 w-4 text-green-500" />;
      case "ERROR":
      case "DOWN":
        return <FiXCircle className="h-4 w-4 text-red-500" />;
      case "TIMEOUT":
      case "DEGRADED":
        return <FiAlertCircle className="h-4 w-4 text-yellow-500" />;
      case "NOT_CONFIGURED":
        return <FiAlertCircle className="h-4 w-4 text-gray-500" />;
      default:
        return <FiAlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "OK":
      case "HEALTHY":
        return "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-400/30";
      case "ERROR":
      case "DOWN":
        return "bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-400/30";
      case "TIMEOUT":
      case "DEGRADED":
        return "bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-400/30";
      case "NOT_CONFIGURED":
        return "bg-gray-500/20 text-gray-700 dark:text-gray-300 border border-gray-400/30";
      default:
        return "bg-gray-500/20 text-gray-700 dark:text-gray-300 border border-gray-400/30";
    }
  };

  return (
    <Navbar>
      <PageContentWrapper>
        <div className="flex flex-col gap-6">
          {/* Header — PageSectionHeader parity (REQ-0075 AC3) */}
          <PageSectionHeader
            as="h1"
            className={DETAIL_PAGE_HEADER_SPACING_CLASS}
            icon={Activity}
            tone="emerald"
            title="API & Project Status"
            description="Real-time monitoring of Stockly's API endpoints and system health"
            trailing={
              <Button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className={cn(
                  GLASS_BUTTON_ICON_HOVER,
                  "gap-2",
                  GLASS_PRIMARY_BUTTON.emerald,
                )}
              >
                <FiRefreshCw
                  className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
                />
                <span>{isRefreshing ? "Refreshing..." : "Refresh"}</span>
              </Button>
            }
          />

          {/* System Overview - Show skeletons while loading, data when available */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
              {[1, 2, 3, 4].map((i) => (
                <GlassCard
                  key={i}
                  variant={
                    ["blue", "violet", "amber", "teal"][i - 1] as GlassCardVariant
                  }
                >
                  <GlassCardBody>
                    <Skeleton className="h-4 w-24 mb-2" />
                    <Skeleton className="h-8 w-32" />
                  </GlassCardBody>
                </GlassCard>
              ))}
            </div>
          ) : systemStatus ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
              <GlassCard variant="blue">
                <GlassCardBody>
                  <p className="text-xs uppercase tracking-[0.2em] text-gray-600 dark:text-white/60 mb-2">
                    Project
                  </p>
                  <p className="text-sm sm:text-base font-medium text-gray-700 dark:text-white">
                    {systemStatus.project}
                  </p>
                </GlassCardBody>
              </GlassCard>

              <GlassCard variant="violet">
                <GlassCardBody>
                  <p className="text-xs uppercase tracking-[0.2em] text-gray-600 dark:text-white/60 mb-2">
                    Environment
                  </p>
                  <p className="text-sm sm:text-base font-medium text-gray-700 dark:text-white capitalize">
                    {systemStatus.environment}
                  </p>
                </GlassCardBody>
              </GlassCard>

              <GlassCard variant="amber">
                <GlassCardBody>
                  <p className="text-xs uppercase tracking-[0.2em] text-gray-600 dark:text-white/60 mb-2">
                    Current Time
                  </p>
                  <p className="text-sm sm:text-base font-medium text-gray-700 dark:text-white">
                    {systemStatus.currentTime}
                  </p>
                </GlassCardBody>
              </GlassCard>

              <GlassCard variant="teal">
                <GlassCardBody>
                  <p className="text-xs uppercase tracking-[0.2em] text-gray-600 dark:text-white/60 mb-2">
                    Uptime
                  </p>
                  <p className="text-sm sm:text-base font-medium text-gray-700 dark:text-white">
                    {systemStatus.uptime}
                  </p>
                </GlassCardBody>
              </GlassCard>
            </div>
          ) : null}

          {/* API Health Status */}
          <GlassCard variant="emerald">
            <GlassCardBody>
              <React.Fragment
                key={isLoading ? "api-health-loading" : "api-health-content"}
              >
                {isLoading ? (
                  <>
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-4 w-48 mt-2" />
                  </>
                ) : (
                  <SectionCardHeader
                    icon={Activity}
                    tone="emerald"
                    title="API Health"
                    description="Overall health status of all API endpoints"
                    className="mb-4"
                  />
                )}
              </React.Fragment>
              {isLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : systemStatus ? (
                <div className="flex items-center gap-2">
                  {getStatusIcon(systemStatus.apiHealth)}
                  <Badge className={getStatusColor(systemStatus.apiHealth)}>
                    API is {systemStatus.apiHealth.toLowerCase()}.
                  </Badge>
                </div>
              ) : null}
            </GlassCardBody>
          </GlassCard>

          {/* Endpoints Status */}
          <GlassCard variant="sky">
            <GlassCardBody>
              <React.Fragment
                key={isLoading ? "endpoints-loading" : "endpoints-content"}
              >
                {isLoading ? (
                  <>
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-4 w-48 mt-2" />
                  </>
                ) : (
                  <SectionCardHeader
                    icon={Server}
                    tone="sky"
                    title="Endpoints"
                    description="Individual endpoint health and response times"
                    className="mb-4"
                  />
                )}
              </React.Fragment>
              <div className="space-y-2">
                {isLoading
                  ? roleEndpoints.map((_, i) => (
                      <div
                        key={`skeleton-ep-${i}`}
                        className="flex items-center justify-between p-4 rounded-xl border border-gray-300/20 dark:border-white/10 bg-white/30 dark:bg-white/5 backdrop-blur-md"
                      >
                        <Skeleton className="h-6 w-48" />
                        <Skeleton className="h-6 w-20" />
                      </div>
                    ))
                  : systemStatus
                    ? systemStatus.endpoints.map((endpoint) => (
                        <div
                          key={endpoint.path}
                          className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-gray-300/20 dark:border-white/10 bg-white/30 dark:bg-white/5 backdrop-blur-md gap-2"
                        >
                          <div className="flex items-center gap-2">
                            {getStatusIcon(endpoint.status)}
                            <div>
                              <h4 className="font-medium text-gray-700 dark:text-white">
                                {endpoint.name}
                              </h4>
                              <p className="text-sm text-gray-600 dark:text-white/60">
                                {endpoint.path}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={getStatusColor(endpoint.status)}>
                              {endpoint.status}
                            </Badge>
                            {endpoint.responseTime && (
                              <span className="text-sm text-gray-600 dark:text-white/60">
                                {endpoint.responseTime}ms
                              </span>
                            )}
                          </div>
                        </div>
                      ))
                    : null}
              </div>
            </GlassCardBody>
          </GlassCard>

          {/* External Services Health */}
          <GlassCard variant="violet">
            <GlassCardBody>
              <React.Fragment
                key={isLoading ? "services-loading" : "services-content"}
              >
                {isLoading ? (
                  <>
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-4 w-48 mt-2" />
                  </>
                ) : (
                  <SectionCardHeader
                    icon={Cloud}
                    tone="violet"
                    title="External Services"
                    description="Health status of external APIs and services"
                    className="mb-4"
                  />
                )}
              </React.Fragment>
              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="space-y-2 p-2 rounded-xl border border-gray-300/20 dark:border-white/10"
                    >
                      <Skeleton className="h-6 w-full" />
                      <Skeleton className="h-4 w-full" />
                    </div>
                  ))}
                </div>
              ) : systemStatus ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {/* Database */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between p-2 rounded-xl border border-emerald-400/20 bg-gradient-to-r from-emerald-500/10 to-transparent backdrop-blur-md gap-2">
                    <div className="flex items-center gap-2">
                      <FiDatabase className="h-5 w-5 text-gray-700 dark:text-white" />
                      <div>
                        <h4 className="font-medium text-sm text-gray-700 dark:text-white">
                          Database
                        </h4>
                        <p className="text-xs text-gray-600 dark:text-white/60">
                          {systemStatus.services.database.message}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(systemStatus.services.database.status)}
                      <Badge
                        className={getStatusColor(
                          systemStatus.services.database.status,
                        )}
                      >
                        {systemStatus.services.database.status}
                      </Badge>
                      {systemStatus.services.database.responseTime > 0 && (
                        <span className="text-xs text-gray-600 dark:text-white/60">
                          {systemStatus.services.database.responseTime}ms
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Redis */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between p-2 rounded-xl border border-amber-400/20 bg-gradient-to-r from-amber-500/10 to-transparent backdrop-blur-md gap-2">
                    <div className="flex items-center gap-2">
                      <FiActivity className="h-5 w-5 text-gray-700 dark:text-white" />
                      <div>
                        <h4 className="font-medium text-sm text-gray-700 dark:text-white">
                          Redis Cache
                        </h4>
                        <p className="text-xs text-gray-600 dark:text-white/60">
                          {systemStatus.services.redis.message}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(systemStatus.services.redis.status)}
                      <Badge
                        className={getStatusColor(
                          systemStatus.services.redis.status,
                        )}
                      >
                        {systemStatus.services.redis.status === "NOT_CONFIGURED"
                          ? "N/A"
                          : systemStatus.services.redis.status}
                      </Badge>
                      {systemStatus.services.redis.responseTime > 0 && (
                        <span className="text-xs text-gray-600 dark:text-white/60">
                          {systemStatus.services.redis.responseTime}ms
                        </span>
                      )}
                    </div>
                  </div>

                  {/* ImageKit */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between p-2 rounded-xl border border-sky-400/20 bg-gradient-to-r from-sky-500/10 to-transparent backdrop-blur-md gap-2">
                    <div className="flex items-center gap-2">
                      <FiImage className="h-5 w-5 text-gray-700 dark:text-white" />
                      <div>
                        <h4 className="font-medium text-sm text-gray-700 dark:text-white">
                          ImageKit
                        </h4>
                        <p className="text-xs text-gray-600 dark:text-white/60">
                          {systemStatus.services.imagekit.message}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(systemStatus.services.imagekit.status)}
                      <Badge
                        className={getStatusColor(
                          systemStatus.services.imagekit.status,
                        )}
                      >
                        {systemStatus.services.imagekit.status ===
                        "NOT_CONFIGURED"
                          ? "N/A"
                          : systemStatus.services.imagekit.status}
                      </Badge>
                      {systemStatus.services.imagekit.responseTime > 0 && (
                        <span className="text-xs text-gray-600 dark:text-white/60">
                          {systemStatus.services.imagekit.responseTime}ms
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Brevo */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between p-2 rounded-xl border border-rose-400/20 bg-gradient-to-r from-rose-500/10 to-transparent backdrop-blur-md gap-2">
                    <div className="flex items-center gap-2">
                      <FiMail className="h-5 w-5 text-gray-700 dark:text-white" />
                      <div>
                        <h4 className="font-medium text-sm text-gray-700 dark:text-white">
                          Brevo Email
                        </h4>
                        <p className="text-xs text-gray-600 dark:text-white/60">
                          {systemStatus.services.brevo.message}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(systemStatus.services.brevo.status)}
                      <Badge
                        className={getStatusColor(
                          systemStatus.services.brevo.status,
                        )}
                      >
                        {systemStatus.services.brevo.status === "NOT_CONFIGURED"
                          ? "N/A"
                          : systemStatus.services.brevo.status}
                      </Badge>
                      {systemStatus.services.brevo.responseTime > 0 && (
                        <span className="text-xs text-gray-600 dark:text-white/60">
                          {systemStatus.services.brevo.responseTime}ms
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ) : null}
            </GlassCardBody>
          </GlassCard>

          {/* Performance Metrics */}
          {systemStatus?.performance && (
            <GlassCard variant="orange">
              <GlassCardBody>
                <SectionCardHeader
                  icon={TrendingUp}
                  tone="orange"
                  title="Performance Metrics"
                  description="API endpoint performance statistics and trends"
                  className="mb-4"
                />
                <div className="space-y-4">
                  {/* Summary Stats */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <div className="p-4 rounded-xl border border-blue-400/20 bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent backdrop-blur-md">
                      <div className="text-sm text-gray-600 dark:text-white/60 mb-1">
                        Total Endpoints
                      </div>
                      <div className="text-sm sm:text-base font-medium text-gray-700 dark:text-white">
                        {systemStatus.performance.totalEndpoints}
                      </div>
                    </div>
                    <div className="p-4 rounded-xl border border-emerald-400/20 bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent backdrop-blur-md">
                      <div className="text-sm text-gray-600 dark:text-white/60 mb-1">
                        Total Requests
                      </div>
                      <div className="text-sm sm:text-base font-medium text-gray-700 dark:text-white">
                        {systemStatus.performance.totalRequests.toLocaleString()}
                      </div>
                    </div>
                    <div className="p-4 rounded-xl border border-amber-400/20 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent backdrop-blur-md">
                      <div className="text-sm text-gray-600 dark:text-white/60 mb-1 flex items-center gap-1">
                        <FiClock className="h-3 w-3" />
                        Avg Response
                      </div>
                      <div className="text-sm sm:text-base font-medium text-gray-700 dark:text-white">
                        {systemStatus.performance.averageResponseTime}ms
                      </div>
                    </div>
                    <div className="p-4 rounded-xl border border-rose-400/20 bg-gradient-to-br from-rose-500/10 via-rose-500/5 to-transparent backdrop-blur-md">
                      <div className="text-sm text-gray-600 dark:text-white/60 mb-1">
                        Error Rate
                      </div>
                      <div className="text-sm sm:text-base font-medium text-gray-700 dark:text-white">
                        {systemStatus.performance.overallErrorRate}%
                      </div>
                    </div>
                  </div>

                  {/* Top Slow Endpoints */}
                  {systemStatus.performance.topSlowEndpoints.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-3 text-sm text-gray-700 dark:text-white">
                        Slowest Endpoints
                      </h4>
                      <div className="space-y-2">
                        {systemStatus.performance.topSlowEndpoints.map(
                          (endpoint, index) => (
                            <div
                              key={`slow-${endpoint.method}-${endpoint.endpoint}-${index}`}
                              className="flex items-center justify-between p-2 rounded-xl border border-gray-300/20 dark:border-white/10 bg-white/30 dark:bg-white/5 backdrop-blur-md"
                            >
                              <div>
                                <div className="font-medium text-sm text-gray-700 dark:text-white">
                                  {endpoint.method} {endpoint.endpoint}
                                </div>
                                <div className="text-xs text-gray-600 dark:text-white/60">
                                  {endpoint.totalRequests.toLocaleString()}{" "}
                                  requests
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-medium text-rose-600 dark:text-rose-400">
                                  {endpoint.averageResponseTime}ms
                                </div>
                              </div>
                            </div>
                          ),
                        )}
                      </div>
                    </div>
                  )}

                  {/* Top Error Endpoints */}
                  {systemStatus.performance.topErrorEndpoints.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-3 text-sm text-gray-700 dark:text-white">
                        Highest Error Rates
                      </h4>
                      <div className="space-y-2">
                        {systemStatus.performance.topErrorEndpoints.map(
                          (endpoint, index) => (
                            <div
                              key={`error-${endpoint.method}-${endpoint.endpoint}-${index}`}
                              className="flex items-center justify-between p-2 rounded-xl border border-gray-300/20 dark:border-white/10 bg-white/30 dark:bg-white/5 backdrop-blur-md"
                            >
                              <div>
                                <div className="font-medium text-sm text-gray-700 dark:text-white">
                                  {endpoint.method} {endpoint.endpoint}
                                </div>
                                <div className="text-xs text-gray-600 dark:text-white/60">
                                  {endpoint.totalRequests.toLocaleString()}{" "}
                                  requests
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-medium text-rose-600 dark:text-rose-400">
                                  {endpoint.errorRate}%
                                </div>
                              </div>
                            </div>
                          ),
                        )}
                      </div>
                    </div>
                  )}

                  {systemStatus.performance.totalEndpoints === 0 && (
                    <div className="text-center py-8 text-gray-600 dark:text-white/60">
                      <p>No performance data available yet.</p>
                      <p className="text-sm mt-2">
                        Performance metrics will appear as API endpoints are
                        used.
                      </p>
                    </div>
                  )}
                </div>
              </GlassCardBody>
            </GlassCard>
          )}

          {/* System Metrics */}
          {systemStatus?.systemMetrics && (
            <GlassCard variant="teal">
              <GlassCardBody>
                <SectionCardHeader
                  icon={Cpu}
                  tone="teal"
                  title="System Metrics"
                  description="Cache statistics, database performance, and system resources"
                  className="mb-4"
                />
                <div className="space-y-4">
                  {/* Cache Statistics */}
                  <div>
                    <h4 className="font-medium mb-3 text-sm flex items-center gap-2 text-gray-700 dark:text-white">
                      <FiHardDrive className="h-4 w-4" />
                      Cache Statistics
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      <div className="p-2 rounded-xl border border-emerald-400/20 bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent backdrop-blur-md">
                        <div className="text-xs text-gray-600 dark:text-white/60 mb-1">
                          Cache Hits
                        </div>
                        <div className="text-sm sm:text-lg font-medium text-emerald-600 dark:text-emerald-400">
                          {systemStatus.systemMetrics.cache.hits.toLocaleString()}
                        </div>
                      </div>
                      <div className="p-2 rounded-xl border border-orange-400/20 bg-gradient-to-br from-orange-500/10 via-orange-500/5 to-transparent backdrop-blur-md">
                        <div className="text-xs text-gray-600 dark:text-white/60 mb-1">
                          Cache Misses
                        </div>
                        <div className="text-sm sm:text-lg font-medium text-orange-600 dark:text-orange-400">
                          {systemStatus.systemMetrics.cache.misses.toLocaleString()}
                        </div>
                      </div>
                      <div className="p-2 rounded-xl border border-blue-400/20 bg-gradient-to-br from-blue-500/10 via-blue-500/5 to-transparent backdrop-blur-md">
                        <div className="text-xs text-gray-600 dark:text-white/60 mb-1">
                          Hit Rate
                        </div>
                        <div className="text-sm sm:text-lg font-medium text-gray-700 dark:text-white">
                          {systemStatus.systemMetrics.cache.hitRate}%
                        </div>
                      </div>
                      <div className="p-2 rounded-xl border border-violet-400/20 bg-gradient-to-br from-violet-500/10 via-violet-500/5 to-transparent backdrop-blur-md">
                        <div className="text-xs text-gray-600 dark:text-white/60 mb-1">
                          Total Requests
                        </div>
                        <div className="text-sm sm:text-lg font-medium text-gray-700 dark:text-white">
                          {systemStatus.systemMetrics.cache.totalRequests.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Database Performance */}
                  <div>
                    <h4 className="font-medium mb-3 text-sm flex items-center gap-2 text-gray-700 dark:text-white">
                      <FiDatabase className="h-4 w-4" />
                      Database Performance
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      <div className="p-2 rounded-xl border border-sky-400/20 bg-gradient-to-br from-sky-500/10 via-sky-500/5 to-transparent backdrop-blur-md">
                        <div className="text-xs text-gray-600 dark:text-white/60 mb-1">
                          Total Queries
                        </div>
                        <div className="text-sm sm:text-lg font-medium text-gray-700 dark:text-white">
                          {systemStatus.systemMetrics.database.totalQueries.toLocaleString()}
                        </div>
                      </div>
                      <div className="p-2 rounded-xl border border-emerald-400/20 bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent backdrop-blur-md">
                        <div className="text-xs text-gray-600 dark:text-white/60 mb-1 flex items-center gap-1">
                          <FiClock className="h-3 w-3" />
                          Avg Query Time
                        </div>
                        <div className="text-sm sm:text-lg font-medium text-gray-700 dark:text-white">
                          {systemStatus.systemMetrics.database.averageQueryTime}
                          ms
                        </div>
                      </div>
                      <div className="p-2 rounded-xl border border-amber-400/20 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-transparent backdrop-blur-md">
                        <div className="text-xs text-gray-600 dark:text-white/60 mb-1">
                          Slow Queries (&gt;1s)
                        </div>
                        <div className="text-sm sm:text-lg font-medium text-amber-600 dark:text-amber-400">
                          {systemStatus.systemMetrics.database.slowQueries.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* System Resources */}
                  <div>
                    <h4 className="font-medium mb-3 text-sm flex items-center gap-2 text-gray-700 dark:text-white">
                      <FiCpu className="h-4 w-4" />
                      System Resources
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <div className="p-4 rounded-xl border border-rose-400/20 bg-gradient-to-br from-rose-500/10 via-rose-500/5 to-transparent backdrop-blur-md">
                        <h5 className="font-medium mb-3 text-sm text-gray-700 dark:text-white">
                          Memory Usage
                        </h5>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-white/60">
                              RSS:
                            </span>
                            <span className="font-medium text-gray-700 dark:text-white">
                              {
                                systemStatus.systemMetrics.resources.memoryUsage
                                  .rss
                              }{" "}
                              MB
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-white/60">
                              Heap Total:
                            </span>
                            <span className="font-medium text-gray-700 dark:text-white">
                              {
                                systemStatus.systemMetrics.resources.memoryUsage
                                  .heapTotal
                              }{" "}
                              MB
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-white/60">
                              Heap Used:
                            </span>
                            <span className="font-medium text-gray-700 dark:text-white">
                              {
                                systemStatus.systemMetrics.resources.memoryUsage
                                  .heapUsed
                              }{" "}
                              MB
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-white/60">
                              External:
                            </span>
                            <span className="font-medium text-gray-700 dark:text-white">
                              {
                                systemStatus.systemMetrics.resources.memoryUsage
                                  .external
                              }{" "}
                              MB
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="p-4 rounded-xl border border-violet-400/20 bg-gradient-to-br from-violet-500/10 via-violet-500/5 to-transparent backdrop-blur-md">
                        <h5 className="font-medium mb-3 text-sm text-gray-700 dark:text-white">
                          Process Info
                        </h5>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-white/60">
                              Node.js:
                            </span>
                            <span className="font-medium text-gray-700 dark:text-white">
                              {systemStatus.systemMetrics.resources.nodeVersion}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-white/60">
                              Platform:
                            </span>
                            <span className="font-medium capitalize text-gray-700 dark:text-white">
                              {systemStatus.systemMetrics.resources.platform}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-white/60">
                              Process Uptime:
                            </span>
                            <span className="font-medium text-gray-700 dark:text-white">
                              {Math.floor(
                                systemStatus.systemMetrics.resources.uptime /
                                  3600,
                              )}
                              h{" "}
                              {Math.floor(
                                (systemStatus.systemMetrics.resources.uptime %
                                  3600) /
                                  60,
                              )}
                              m
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-white/60">
                              CPU Time:
                            </span>
                            <span className="font-medium text-gray-700 dark:text-white">
                              {
                                systemStatus.systemMetrics.resources.cpuUsage
                                  .user
                              }
                              ms user,{" "}
                              {
                                systemStatus.systemMetrics.resources.cpuUsage
                                  .system
                              }
                              ms sys
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </GlassCardBody>
            </GlassCard>
          )}

          {/* Deployment Info */}
          <GlassCard variant="rose">
            <GlassCardBody>
              {isLoading ? (
                <Skeleton className="h-6 w-32 mb-4" />
              ) : (
                <SectionCardHeader
                  icon={Package}
                  tone="rose"
                  title="Deployment Information"
                  className="mb-4"
                />
              )}
              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div>
                    <Skeleton className="h-6 w-24 mb-2" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <div>
                    <Skeleton className="h-6 w-24 mb-2" />
                    <Skeleton className="h-4 w-48" />
                  </div>
                </div>
              ) : systemStatus ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div className="p-2 rounded-xl border border-gray-300/20 dark:border-white/10 bg-white/30 dark:bg-white/5 backdrop-blur-md">
                    <h4 className="font-medium mb-2 text-xs sm:text-sm text-gray-700 dark:text-white">
                      Deployment
                    </h4>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-white/70">
                      {systemStatus.deployment}
                    </p>
                  </div>
                  <div className="p-2 rounded-xl border border-gray-300/20 dark:border-white/10 bg-white/30 dark:bg-white/5 backdrop-blur-md">
                    <h4 className="font-medium mb-2 text-xs sm:text-sm text-gray-700 dark:text-white">
                      Last checked
                    </h4>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-white/70">
                      {systemStatus.lastChecked}
                    </p>
                  </div>
                </div>
              ) : null}
            </GlassCardBody>
          </GlassCard>
        </div>
      </PageContentWrapper>
    </Navbar>
  );
}
