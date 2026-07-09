/**
 * Dialog form control styling — same glow pattern as ProductFormDialog form-fields;
 * accent color per feature (product rose, category sky, supplier emerald, order violet).
 */

const DIALOG_FORM_FIELD_BASE =
  "bg-white/10 dark:bg-white/5 backdrop-blur-md text-white placeholder:text-white/40";

/** Product / shared rose dialogs */
export const DIALOG_FORM_FIELD_ROSE = `${DIALOG_FORM_FIELD_BASE} border border-rose-400/30 dark:border-white/20 focus-visible:border-rose-400 focus-visible:ring-rose-500/50 shadow-[0_10px_30px_rgba(225,29,72,0.15)]`;

/** Category dialog — sky accent */
export const DIALOG_FORM_FIELD_SKY = `${DIALOG_FORM_FIELD_BASE} border border-sky-400/30 dark:border-white/20 focus-visible:border-sky-400 focus-visible:ring-sky-500/50 shadow-[0_10px_30px_rgba(2,132,199,0.15)]`;

/** Supplier dialog — emerald accent */
export const DIALOG_FORM_FIELD_EMERALD = `${DIALOG_FORM_FIELD_BASE} border border-emerald-400/30 dark:border-white/20 focus-visible:border-emerald-400 focus-visible:ring-emerald-500/50 shadow-[0_10px_30px_rgba(16,185,129,0.15)]`;

/** Order dialog — violet accent (matches OrderDialog inputClassName) */
export const DIALOG_FORM_FIELD_VIOLET = `${DIALOG_FORM_FIELD_BASE} border border-violet-400/30 dark:border-white/20 focus-visible:border-violet-400 focus-visible:ring-violet-500/50 shadow-[0_10px_30px_rgba(139,92,246,0.15)]`;
