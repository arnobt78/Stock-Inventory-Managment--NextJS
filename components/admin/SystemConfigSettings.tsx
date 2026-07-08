/**
 * System Configuration Settings Component
 * Admin interface for managing system settings
 */

"use client";

import React, { useEffect, useState } from "react";
import { Save, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useSystemConfigs, useUpdateSystemConfigs } from "@/hooks/queries";
import type {
  SystemConfig,
  ConfigCategory,
  UpdateSystemConfigInput,
} from "@/types";
import { cn } from "@/lib/utils";

// Icons for categories
const categoryIcons: Record<ConfigCategory, string> = {
  general: "🏢",
  email: "📧",
  shipping: "🚚",
  payment: "💳",
  notifications: "🔔",
  inventory: "📦",
};

export default function SystemConfigSettings() {
  const { data, isLoading, refetch } = useSystemConfigs();
  const updateMutation = useUpdateSystemConfigs();

  const [editedValues, setEditedValues] = useState<Record<string, string>>({});
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize edited values when data loads
  useEffect(() => {
    if (data?.configs) {
      const initialValues: Record<string, string> = {};
      data.configs.forEach((config) => {
        initialValues[config.key] = config.value;
      });
      queueMicrotask(() => setEditedValues(initialValues));
    }
  }, [data?.configs]);

  // Check for changes
  useEffect(() => {
    if (data?.configs) {
      const changed = data.configs.some(
        (config) => editedValues[config.key] !== config.value,
      );
      queueMicrotask(() => setHasChanges(changed));
    }
  }, [editedValues, data?.configs]);

  const handleValueChange = (key: string, value: string) => {
    setEditedValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    if (!data?.configs) return;

    const changedConfigs: UpdateSystemConfigInput[] = data.configs
      .filter((config) => editedValues[config.key] !== config.value)
      .map((config) => ({
        key: config.key,
        value: editedValues[config.key] ?? config.value,
      }));

    if (changedConfigs.length > 0) {
      updateMutation.mutate(changedConfigs);
    }
  };

  const handleReset = () => {
    if (data?.configs) {
      const initialValues: Record<string, string> = {};
      data.configs.forEach((config) => {
        initialValues[config.key] = config.value;
      });
      setEditedValues(initialValues);
    }
  };

  // Group configs by category; data?.configs in deps for initial load when data is undefined
  // eslint-disable-next-line react-hooks/preserve-manual-memoization -- optional chaining in deps is intentional
  const groupedConfigs = React.useMemo(() => {
    if (!data?.configs) return {};

    return data.configs.reduce(
      (acc, config) => {
        const category = config.category;
        if (!acc[category]) {
          acc[category] = [];
        }
        acc[category].push(config);
        return acc;
      },
      {} as Record<ConfigCategory, SystemConfig[]>,
    );
  }, [data?.configs]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-6 w-40 bg-muted rounded" />
              <div className="h-4 w-60 bg-muted rounded" />
            </CardHeader>
            <CardContent className="space-y-4">
              {[1, 2].map((j) => (
                <div key={j} className="h-10 bg-muted rounded" />
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={updateMutation.isPending}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
        <div className="flex items-center gap-2">
          {hasChanges && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              disabled={updateMutation.isPending}
            >
              Reset
            </Button>
          )}
          <Button
            size="sm"
            onClick={handleSave}
            disabled={!hasChanges || updateMutation.isPending}
          >
            <Save className="h-4 w-4 mr-2" />
            {updateMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      {/* Config Categories */}
      {(
        Object.entries(groupedConfigs) as [ConfigCategory, SystemConfig[]][]
      ).map(([category, configs]) => (
        <Card key={category}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>{categoryIcons[category as ConfigCategory] || "⚙️"}</span>
              {data?.categories?.[category] || category}
            </CardTitle>
            <CardDescription>
              Configure {category.toLowerCase()} settings for your application
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {configs.map((config, index) => (
              <React.Fragment key={config.key}>
                {index > 0 && <Separator />}
                <ConfigField
                  config={config}
                  value={editedValues[config.key] ?? config.value}
                  onChange={(value) => handleValueChange(config.key, value)}
                  isChanged={editedValues[config.key] !== config.value}
                />
              </React.Fragment>
            ))}
          </CardContent>
        </Card>
      ))}

      {/* Empty state */}
      {Object.keys(groupedConfigs).length === 0 && (
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-muted-foreground">
              No configuration settings found.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

interface ConfigFieldProps {
  config: SystemConfig;
  value: string;
  onChange: (value: string) => void;
  isChanged: boolean;
}

function ConfigField({ config, value, onChange, isChanged }: ConfigFieldProps) {
  if (config.type === "boolean") {
    return (
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label
            htmlFor={config.key}
            className={cn("font-medium", isChanged && "text-blue-600")}
          >
            {config.label}
            {isChanged && <span className="ml-2 text-xs">(changed)</span>}
          </Label>
          {config.description && (
            <p className="text-sm text-muted-foreground">
              {config.description}
            </p>
          )}
        </div>
        <Switch
          id={config.key}
          checked={value === "true"}
          onCheckedChange={(checked) => onChange(checked ? "true" : "false")}
        />
      </div>
    );
  }

  if (config.type === "number") {
    return (
      <div className="space-y-2">
        <Label
          htmlFor={config.key}
          className={cn("font-medium", isChanged && "text-blue-600")}
        >
          {config.label}
          {isChanged && <span className="ml-2 text-xs">(changed)</span>}
        </Label>
        {config.description && (
          <p className="text-sm text-muted-foreground">{config.description}</p>
        )}
        <Input
          id={config.key}
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="max-w-xs"
        />
      </div>
    );
  }

  // Default: string
  return (
    <div className="space-y-2">
      <Label
        htmlFor={config.key}
        className={cn("font-medium", isChanged && "text-blue-600")}
      >
        {config.label}
        {isChanged && <span className="ml-2 text-xs">(changed)</span>}
      </Label>
      {config.description && (
        <p className="text-sm text-muted-foreground">{config.description}</p>
      )}
      <Input
        id={config.key}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="max-w-md"
      />
    </div>
  );
}
