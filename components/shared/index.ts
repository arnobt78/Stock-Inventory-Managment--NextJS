/**
 * Shared Components - Centralized Exports
 * Reusable components across features
 */

export { default as PaginationSelector } from "./PaginationSelector";
export type {
  PaginationType,
  PaginationSelectorLayout,
  PaginationSelectorProps,
} from "./PaginationSelector";
export type { PaginationSelectVariant } from "./pagination-select-styles";
export { useDeferredRadixSelect } from "@/hooks/use-deferred-radix-select";
export type {
  UseDeferredRadixSelectOptions,
  UseDeferredRadixSelectResult,
} from "@/hooks/use-deferred-radix-select";
export { DeferredSelectGate } from "./DeferredSelectGate";
export type {
  DeferredSelectGateProps,
  DeferredSelectGateRenderProps,
} from "./DeferredSelectGate";
export { NotificationBell } from "./NotificationBell";
export { NotificationDropdown } from "./NotificationDropdown";
export { HelpTooltip } from "./HelpTooltip";
export type { HelpTooltipProps } from "./HelpTooltip";
export { CopyCodeButton } from "./CopyCodeButton";
export type { CopyCodeButtonProps } from "./CopyCodeButton";
export { CopyableText } from "./CopyableText";
export type { CopyableTextProps } from "./CopyableText";
export { AvatarInlineLink } from "./AvatarInlineLink";
export type { AvatarInlineLinkProps } from "./AvatarInlineLink";
export { ProductLineItemsList } from "./ProductLineItemsList";
export type { ProductLineItemsListProps } from "./ProductLineItemsList";
export {
  ProportionalPriceDisplay,
  shouldShowAdjustedPrice,
  PROPORTIONAL_PRICE_FINAL_CLASS,
  PROPORTIONAL_PRICE_STRIKE_CLASS,
} from "./ProportionalPriceDisplay";
export type { ProportionalPriceDisplayProps } from "./ProportionalPriceDisplay";
export {
  DIALOG_FORM_FIELD_AMBER,
  DIALOG_FORM_FIELD_BLUE,
  DIALOG_FORM_FIELD_CYAN,
  DIALOG_FORM_FIELD_EMERALD,
  DIALOG_FORM_FIELD_INDIGO,
  DIALOG_FORM_FIELD_ROSE,
  DIALOG_FORM_FIELD_SKY,
  DIALOG_FORM_FIELD_TEAL,
  DIALOG_FORM_FIELD_VIOLET,
} from "./dialog-form-field";
export {
  DIALOG_EDGE_SCROLL_BODY,
  DIALOG_EDGE_SCROLL_HEADER,
  DIALOG_EDGE_SCROLL_INNER,
  DIALOG_EDGE_SCROLL_SHELL,
  DIALOG_TABLE_FRAME_EMERALD,
  DIALOG_TABLE_FRAME_SKY,
  DIALOG_TABLE_HEAD_ROW,
  DIALOG_TABLE_HEAD_TEXT,
  DIALOG_TABLE_LINK,
  DIALOG_TABLE_ACTION_ICON,
  DIALOG_TABLE_ROW_EVEN,
  DIALOG_TABLE_ROW_HOVER,
  DIALOG_TABLE_ROW_ODD,
  DIALOG_TABLE_SECTION,
  DIALOG_TABLE_SECTION_TITLE,
  DIALOG_TABLE_SURFACE,
  DIALOG_TABLE_TEXT,
  DIALOG_TABLE_TEXT_MUTED,
  DIALOG_FORM_FEEDBACK_ROW,
  DIALOG_FORM_HINT_TEXT,
  DIALOG_FORM_ERROR_TEXT,
  DIALOG_FORM_SUCCESS_TEXT,
  DIALOG_FORM_WARN_TEXT,
  DIALOG_FORM_LABEL,
  DIALOG_FORM_LABEL_ROW,
  DIALOG_FORM_SUB_LABEL,
  DIALOG_FORM_REQUIRED_MARK,
  DIALOG_SELECT_CONTENT_CLASS,
  DIALOG_SELECT_ITEM_CLASS,
  TABLE_CATALOG_LINK_CLASS,
} from "./dialog-edge-scroll";
export { DetailInfoRowGroup } from "./DetailInfoRowGroup";
export type { DetailInfoRowGroupProps } from "./DetailInfoRowGroup";
export { DialogFormLabel } from "./dialog-form-label";
export type { DialogFormLabelProps } from "./dialog-form-label";
export { DialogDateField } from "./DialogDateField";
export type { DialogDateFieldProps } from "./DialogDateField";
export { DialogHeaderBrand } from "./DialogHeaderBrand";
export type {
  DialogHeaderBrandProps,
  DialogHeaderBrandTone,
} from "./DialogHeaderBrand";
export {
  READABLE_POPOVER_CONTENT_CLASS,
  READABLE_POPOVER_ITEM_CLASS,
  filterCommandPopoverClass,
  paginationPopoverContentClass,
  FILTER_COMMAND_INPUT_WRAPPER_CLASS,
} from "@/lib/ui/popover-readability-styles";
export type { PopoverHue } from "@/lib/ui/popover-readability-styles";
export { DialogTableScrollArea } from "./DialogTableScrollArea";
export type { DialogTableScrollAreaProps } from "./DialogTableScrollArea";
export { PageContentWrapper } from "./PageContentWrapper";
export type { PageContentWrapperProps } from "./PageContentWrapper";
export {
  ClientRelativeTime,
  ClientDateTime,
  ClientDate,
} from "./ClientDateDisplay";
export type {
  ClientRelativeTimeProps,
  ClientDateTimeProps,
  ClientDateProps,
} from "./ClientDateDisplay";
export {
  ClientCurrency,
  ClientCompactDateTime,
} from "./ClientFormatDisplay";
export type {
  ClientCurrencyProps,
  ClientCompactDateTimeProps,
} from "./ClientFormatDisplay";
export {
  semanticDateClass,
  statusAtSemanticKind,
  dueDateSemanticKind,
} from "@/lib/ui/semantic-date-styles";
export type { SemanticDateKind } from "@/lib/ui/semantic-date-styles";
export { DataSlotPulse } from "./DataSlotPulse";
export type { DataSlotPulseProps, DataSlotPulseVariant } from "./DataSlotPulse";
export { SectionCardHeader } from "./SectionCardHeader";
export type { SectionCardHeaderProps } from "./SectionCardHeader";
export { AuditUserDetailRow } from "./AuditUserDetailRow";
export type {
  AuditUserDetail,
  AuditUserDetailRowProps,
} from "./AuditUserDetailRow";
export { PersonInlineRow } from "./PersonInlineRow";
export type { PersonInlineRowProps } from "./PersonInlineRow";
export { RecentOrderStatusColumn } from "./RecentOrderStatusColumn";
export type { RecentOrderStatusColumnProps } from "./RecentOrderStatusColumn";
export { SemanticEventDate } from "./SemanticEventDate";
export type { SemanticEventDateProps } from "./SemanticEventDate";
export {
  GlassCard,
  GlassCardBody,
  GLASS_CARD_VARIANT_CONFIG,
  variantConfig,
} from "@/lib/ui/glass-card";
export type { GlassCardVariant, GlassCardProps, CardVariant } from "@/lib/ui/glass-card";
export { PageSectionHeader } from "./PageSectionHeader";
export type { PageSectionHeaderProps } from "./PageSectionHeader";
export { AuthSessionToasts, clearAuthToastMarkers } from "./AuthSessionToasts";
export { CatalogActiveInactiveSelect } from "./CatalogActiveInactiveSelect";
export type { CatalogActiveInactiveSelectProps } from "./CatalogActiveInactiveSelect";
export { ActiveInactiveFilterChips } from "./ActiveInactiveFilterChips";
export type { ActiveInactiveFilterChipsProps } from "./ActiveInactiveFilterChips";
export { DismissibleFilterChips } from "./DismissibleFilterChips";
export type {
  DismissibleFilterChipsProps,
  FilterChipGroup,
} from "./DismissibleFilterChips";
export { ExportMenuButton } from "./ExportMenuButton";
export type { ExportMenuButtonProps } from "./ExportMenuButton";
export {
  GLASS_ACTION_BUTTON,
  GLASS_BUTTON_DISABLED,
  GLASS_BUTTON_ICON_HOVER,
  GLASS_BUTTON_SHELL_RESET,
  GLASS_COMPACT_AMBER_BUTTON,
  GLASS_GHOST_BUTTON,
  DETAIL_HEADER_BACK_ICON_CLASS,
  GLASS_PRIMARY_BUTTON,
  glassActionButtonClass,
  glassDetailFooterButtonClass,
  glassDetailBackButtonClass,
  glassPrimaryButtonClass,
} from "@/lib/ui/glass-button-styles";
export { DialogSubmitButton } from "./DialogSubmitButton";
export type { DialogSubmitButtonProps } from "./DialogSubmitButton";
export {
  StockQuantityField,
  getStockQuantityValidation,
} from "./StockQuantityField";
export type {
  StockQuantityFieldProps,
  StockQuantityMode,
} from "./StockQuantityField";
export {
  SectionTitleRow,
  SECTION_TITLE_ROW_CLASS,
} from "@/lib/ui/section-title-row";
export type { SectionTitleRowProps } from "@/lib/ui/section-title-row";
export { SectionCountBadge } from "./SectionCountBadge";
export type { SectionCountBadgeProps } from "./SectionCountBadge";
export { ListIndexBadge } from "./ListIndexBadge";
export type { ListIndexBadgeProps } from "./ListIndexBadge";
export { PaymentMoneyBreakdown } from "./PaymentMoneyBreakdown";
export type { PaymentMoneyBreakdownProps } from "./PaymentMoneyBreakdown";
export { CatalogInsightsSection } from "./CatalogInsightsSection";
export type { CatalogInsightsSectionProps } from "./CatalogInsightsSection";
export { CatalogSnapshotCompanion } from "./CatalogSnapshotCompanion";
export type {
  CatalogSnapshotCompanionProps,
  CatalogSnapshotStats,
  CatalogSnapshotStockSignals,
} from "./CatalogSnapshotCompanion";
export { CatalogAllocationSummaryText } from "./CatalogAllocationSummaryText";
export type { CatalogAllocationSummaryTextProps } from "./CatalogAllocationSummaryText";
export { WarehouseInsightsSection } from "./WarehouseInsightsSection";
export type { WarehouseInsightsSectionProps } from "./WarehouseInsightsSection";
export { CatalogDetailProductGrid } from "./catalog-detail/CatalogDetailProductGrid";
export type { CatalogDetailProductGridProps } from "./catalog-detail/CatalogDetailProductGrid";
export { CatalogDetailRecentOrdersList } from "./catalog-detail/CatalogDetailRecentOrdersList";
export type { CatalogDetailRecentOrdersListProps } from "./catalog-detail/CatalogDetailRecentOrdersList";
