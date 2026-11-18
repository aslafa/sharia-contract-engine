import type { AuditAction } from "@/types";
import { DBRepository } from "@/lib/db/repository";

export interface LogAuditParams {
  organizationId?: string;
  userId?: string;
  action: AuditAction;
  entityName: string;
  entityId: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

export interface InMemoryAuditEntry {
  id: string;
  organizationId?: string;
  userId?: string;
  action: AuditAction;
  entityName: string;
  entityId: string;
  details: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
}

// Resilient in-memory audit trail buffer (for development & offline fallback)
const inMemoryAuditBuffer: InMemoryAuditEntry[] = [];

export function getRecentAuditLogs(limit: number = 50): InMemoryAuditEntry[] {
  return inMemoryAuditBuffer.slice(0, limit);
}

export async function createAuditLog(params: LogAuditParams) {
  const entry: InMemoryAuditEntry = {
    id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    organizationId: params.organizationId,
    userId: params.userId,
    action: params.action,
    entityName: params.entityName,
    entityId: params.entityId,
    details: params.details || {},
    ipAddress: params.ipAddress,
    userAgent: params.userAgent,
    timestamp: new Date().toISOString(),
  };

  // Buffer in-memory for fast read & resilience
  inMemoryAuditBuffer.unshift(entry);
  if (inMemoryAuditBuffer.length > 500) {
    inMemoryAuditBuffer.pop();
  }

  // Persist directly to operational JSON repository (data/sce_database.json)
  try {
    DBRepository.createAuditLogEntry({
      organizationId: params.organizationId,
      userId: params.userId,
      action: params.action,
      entity: params.entityName,
      entityId: params.entityId,
      details: params.details ? JSON.stringify(params.details) : undefined,
      ipAddress: params.ipAddress,
    });
  } catch (error) {
    console.warn(
      `[AUDIT_LOG_BUFFER] Stored audit action ${params.action} on ${params.entityName}:${params.entityId} in memory buffer.`
    );
  }

  return entry;
}

/**
 * Convenience helper to log auth session events
 */
export async function logAuthEvent(
  action: "LOGIN" | "LOGOUT",
  userId: string,
  organizationId: string,
  details: Record<string, unknown> = {},
  ipAddress?: string
) {
  return createAuditLog({
    organizationId,
    userId,
    action,
    entityName: "UserSession",
    entityId: userId,
    details,
    ipAddress,
  });
}

/**
 * Convenience helper to log registration status transitions
 */
export async function logRegistrationEvent(
  registrationId: string,
  action: "REGISTRATION_SUBMIT" | "REGISTRATION_STATUS_CHANGE",
  details: Record<string, unknown> = {},
  userId?: string
) {
  return createAuditLog({
    userId,
    action,
    entityName: "InstitutionRegistration",
    entityId: registrationId,
    details,
  });
}

/**
 * Convenience helper to log cross-tenant security blocks
 */
export async function logCrossTenantViolation(
  userOrgId: string,
  targetOrgId: string,
  userId: string,
  entityName: string,
  entityId: string,
  ipAddress?: string
) {
  return createAuditLog({
    organizationId: userOrgId,
    userId,
    action: "CROSS_TENANT_VIOLATION_BLOCKED",
    entityName,
    entityId,
    details: {
      alert: "SECURITY_CROSS_TENANT_VIOLATION",
      userOrgId,
      targetOrgId,
    },
    ipAddress,
  });
}
