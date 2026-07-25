"use client";

/**
 * REQ-0119 — shared shipping/billing address grid for OrderDialog create mode.
 * Keep 2-col layout (street|city, state|zip, country full width) — do not stack.
 */

import { FormField } from "@/components/forms";
import {
  DIALOG_FORM_FIELD_VIOLET,
  DIALOG_FORM_SUB_LABEL,
} from "@/components/shared";

export type OrderAddressPrefix = "shippingAddress" | "billingAddress";

export type OrderAddressFieldsProps = {
  prefix: OrderAddressPrefix;
};

export function OrderAddressFields({ prefix }: OrderAddressFieldsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      <FormField
        name={`${prefix}.street`}
        label="Street Address"
        placeholder="123 Main St"
        labelClassName={DIALOG_FORM_SUB_LABEL}
        inputClassName={DIALOG_FORM_FIELD_VIOLET}
      />
      <FormField
        name={`${prefix}.city`}
        label="City"
        placeholder="New York"
        labelClassName={DIALOG_FORM_SUB_LABEL}
        inputClassName={DIALOG_FORM_FIELD_VIOLET}
      />
      <FormField
        name={`${prefix}.state`}
        label="State/Province"
        placeholder="NY"
        labelClassName={DIALOG_FORM_SUB_LABEL}
        inputClassName={DIALOG_FORM_FIELD_VIOLET}
      />
      <FormField
        name={`${prefix}.zipCode`}
        label="Zip Code"
        placeholder="10001"
        labelClassName={DIALOG_FORM_SUB_LABEL}
        inputClassName={DIALOG_FORM_FIELD_VIOLET}
      />
      <FormField
        name={`${prefix}.country`}
        label="Country"
        placeholder="United States"
        labelClassName={DIALOG_FORM_SUB_LABEL}
        className="sm:col-span-2"
        inputClassName={DIALOG_FORM_FIELD_VIOLET}
      />
    </div>
  );
}
