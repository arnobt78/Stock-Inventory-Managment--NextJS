/**
 * Support Ticket type definitions
 */

export type SupportTicketStatus =
  | "open"
  | "in_progress"
  | "resolved"
  | "closed";

export type SupportTicketPriority = "low" | "medium" | "high" | "urgent";

export interface SupportTicket {
  id: string;
  subject: string;
  description: string;
  status: SupportTicketStatus;
  priority: SupportTicketPriority;
  userId: string;
  assignedToId: string | null;
  productId: string | null;
  orderId: string | null;
  supplierId: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string | null;
  /** Display ticket number (e.g. TKT-20260224-abc123). Present when API includes it. */
  ticketNumber?: string;
  /** Creator display name. Present when API includes it. */
  creatorName?: string | null;
  /** Creator email. Present when API includes it. */
  creatorEmail?: string | null;
  /** Assigned-to (product owner) display name. Present when API includes it. */
  assignedToName?: string | null;
  /** Assigned-to email. Present when API includes it. */
  assignedToEmail?: string | null;
  /** REQ-0185 — creator avatar (Google or null → robohash via seed). */
  creatorImage?: string | null;
  /** REQ-0185 — assignee avatar. */
  assignedToImage?: string | null;
  /** Number of replies/messages on this ticket. Present when API includes it. */
  replyCount?: number;
  /** REQ-0191 — related catalog/order densify on detail */
  relatedProductName?: string | null;
  relatedProductSku?: string | null;
  relatedOrderNumber?: string | null;
  relatedOrderStatus?: string | null;
  relatedOrderPaymentStatus?: string | null;
  relatedSupplierName?: string | null;
}

export interface CreateSupportTicketInput {
  subject: string;
  description: string;
  priority?: SupportTicketPriority;
  /** Product owner user id to assign ticket to (Send to) */
  assignedToId?: string | null;
  productId?: string;
  orderId?: string;
  supplierId?: string;
}

export interface SupportTicketReply {
  id: string;
  ticketId: string;
  userId: string;
  body: string;
  createdAt: string;
  /** Reply author display name. Present when API includes it. */
  userName?: string | null;
  /** Reply author email. Present when API includes it. */
  userEmail?: string | null;
  /** Reply author avatar URL. Present when API includes it. */
  userImage?: string | null;
}

export interface CreateSupportTicketReplyInput {
  body: string;
}

export interface UpdateSupportTicketInput {
  /** REQ-0185 — edit dialog subject/description */
  subject?: string;
  description?: string;
  status?: SupportTicketStatus;
  priority?: SupportTicketPriority;
  assignedToId?: string | null;
  notes?: string | null;
}

export interface SupportTicketFilters {
  status?: SupportTicketStatus | SupportTicketStatus[];
  priority?: SupportTicketPriority | SupportTicketPriority[];
  userId?: string;
  assignedToId?: string;
  search?: string;
}

/** REQ-0185 — Send-to (product owner) picker densify */
export type ProductOwnerOption = {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  productCount?: number;
};
