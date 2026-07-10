/**
 * System Configuration Settings Component
 * REQ-0024: shell-first — action bar + category cards always visible; field values pulse while loading.
 */

"use client";

import React, { useEffect, useState } from "react";
import { Save, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  GLASS_ACTION_BUTTON,
  GLASS_BUTTON_ICON_HOVER,
  GLASS_GHOST_BUTTON,
} from "@/lib/ui/glass-button-styles";
import { cn } from "@/lib/utils";
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
import { DataSlotPulse } from "@/components/shared";
import { useSystemConfigs, useUpdateSystemConfigs } from "@/hooks/queries";
import { isDataSlotLoading } from "@/lib/react-query";
import type {
  SystemConfig,
  ConfigCategory,
  UpdateSystemConfigInput,
} from "@/types";
import { CATEGORY_LABELS } from "@/types";
import type { SystemConfigForPage } from "@/lib/server/system-config-data";

const categoryIcons: Record<ConfigCategory, string> = {
  general: "🏢",
  email: "📧",
  shipping: "🚚",
  payment: "💳",
  notifications: "🔔",
  inventory: "📦",
};

const ALL_CATEGORIES = Object.keys(CATEGORY_LABELS) as ConfigCategory[];

type SystemConfigSettingsProps = {
  initialConfigs?: SystemConfigForPage | null;
};

export default function SystemConfigSettings({
  initialConfigs,
}: SystemConfigSettingsProps) {
  const configsQuery = useSystemConfigs(initialConfigs ?? undefined);
  const data = configsQuery.data ?? initialConfigs ?? null;
  const dataLoading = isDataSlotLoading(configsQuery, initialConfigs);
  const updateMutation = useUpdateSystemConfigs();

  const [editedValues, setEditedValues] = useState<Record<string, string>>({});
  const [hasChanges, setHasChanges] = useState(false);

  const actionsDisabled = dataLoading || !data?.configs;

  useEffect(() => {
    if (data?.configs) {
      const initialValues: Record<string, string> = {};
      data.configs.forEach((config) => {
        initialValues[config.key] = config.value;
      });
      queueMicrotask(() => setEditedValues(initialValues));
    }
  }, [data?.configs]);

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

  const groupedConfigs = data?.configs
    ? data.configs.reduce(
        (acc, config) => {
          const category = config.category;
          if (!acc[category]) {
            acc[category] = [];
          }
          acc[category].push(config);
          return acc;
        },
        {} as Record<ConfigCategory, SystemConfig[]>,
      )
    : ({} as Record<ConfigCategory, SystemConfig[]>);

  const categoriesToRender = dataLoading
    ? ALL_CATEGORIES
    : (Object.keys(groupedConfigs) as ConfigCategory[]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => configsQuery.refetch()}
            disabled={actionsDisabled || updateMutation.isPending}
            className={cn(
              GLASS_BUTTON_ICON_HOVER,
              "gap-2",
              GLASS_ACTION_BUTTON.sky,
            )}
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
              disabled={actionsDisabled || updateMutation.isPending}
              className={cn(GLASS_BUTTON_ICON_HOVER, GLASS_GHOST_BUTTON, "h-9")}
            >
              Reset
            </Button>
          )}
          <Button
            size="sm"
            onClick={handleSave}
            disabled={!hasChanges || actionsDisabled || updateMutation.isPending}
            className={cn(
              GLASS_BUTTON_ICON_HOVER,
              "gap-2",
              GLASS_ACTION_BUTTON.emerald,
            )}
          >
            <Save className="h-4 w-4 mr-2" />
            {updateMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>

      {categoriesToRender.map((category) => {
        const configs = groupedConfigs[category] ?? [];
        const categoryLabel =
          data?.categories?.[category] ?? CATEGORY_LABELS[category] ?? category;

        return (
          <Card key={category}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <span>{categoryIcons[category] || "⚙️"}</span>
                {categoryLabel}
              </CardTitle>
              <CardDescription>
                Configure {category.toLowerCase()} settings for your application
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {dataLoading ? (
                <>
                  <ConfigFieldPulse />
                  <Separator />
                  <ConfigFieldPulse />
                </>
              ) : configs.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No settings in this category.
                </p>
              ) : (
                configs.map((config, index) => (
                  <React.Fragment key={config.key}>
                    {index > 0 && <Separator />}
                    <ConfigField
                      config={config}
                      value={editedValues[config.key] ?? config.value}
                      onChange={(value) => handleValueChange(config.key, value)}
                      isChanged={editedValues[config.key] !== config.value}
                      disabled={updateMutation.isPending}
                    />
                  </React.Fragment>
                ))
              )}
            </CardContent>
          </Card>
        );
      })}

      {!dataLoading && categoriesToRender.length === 0 && (
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

function ConfigFieldPulse() {
  return (
    <div className="space-y-2">
      <DataSlotPulse variant="text-md" className="w-40" />
      <DataSlotPulse variant="text-sm" className="w-64" />
      <DataSlotPulse variant="text-md" className="max-w-xs h-10" />
    </div>
  );
}

interface ConfigFieldProps {
  config: SystemConfig;
  value: string;
  onChange: (value: string) => void;
  isChanged: boolean;
  disabled?: boolean;
}

function ConfigField({
  config,
  value,
  onChange,
  isChanged,
  disabled,
}: ConfigFieldProps) {
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
          disabled={disabled}
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
          disabled={disabled}
        />
      </div>
    );
  }

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
        disabled={disabled}
      />
    </div>
  );
}
