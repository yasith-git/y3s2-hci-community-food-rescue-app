/**
 * Issue Management Service Layer
 * Allows coordinators to review, manage, and resolve rescue issues and quantity discrepancies.
 * Community Food Rescue App (Supabase Backend)
 */

import { supabase, isSupabaseConfigured } from '../supabase/client';
import { RescueIssue, RescueIssueStatus, RescueIssueType } from '../../types/rescue';
import { createInAppNotification } from '../notifications/notification.service';

export type Unsubscribe = () => void;

function mapRowToIssue(row: any): RescueIssue {
  return {
    id: row.id,
    donationId: row.donation_id,
    reportedBy: row.reported_by_id,
    reporterName: row.reported_by_name,
    reporterRole: (row.reported_by_role as any) || 'VOLUNTEER',
    issueType: row.issue_type as RescueIssueType,
    description: row.description,
    status: row.status as RescueIssueStatus,
    resolutionNotes: row.resolution_notes || undefined,
    resolvedBy: row.resolved_by_id || undefined,
    resolvedAt: row.resolved_at || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Updates the status and resolution notes of a rescue issue.
 */
export async function updateRescueIssueStatus(
  issueId: string,
  coordinatorId: string,
  newStatus: RescueIssueStatus,
  resolutionNotes?: string
): Promise<void> {
  if (!isSupabaseConfigured || !supabase) throw new Error('Supabase is not configured.');

  const now = new Date().toISOString();
  const updates: Record<string, any> = {
    status: newStatus,
    resolution_notes: resolutionNotes || null,
    updated_at: now,
  };

  if (newStatus === 'RESOLVED') {
    updates.resolved_by_id = coordinatorId;
    updates.resolved_at = now;
  }

  const { data, error } = await supabase
    .from('rescue_issues')
    .update(updates)
    .eq('id', issueId)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  if (data?.reported_by_id && data.reported_by_id !== coordinatorId) {
    createInAppNotification(data.reported_by_id, {
      userId: data.reported_by_id,
      type: 'ISSUE_RESOLVED',
      title: `Issue ${newStatus === 'RESOLVED' ? 'Resolved' : 'Updated'}`,
      body: `The coordinator updated the reported issue (${(data.issue_type || '').replace(/_/g, ' ')}) to ${newStatus}.`,
      resourceType: 'issue',
      resourceId: issueId,
      deepLinkRoute: `/(volunteer)/activity`,
      priority: 'HIGH',
    }).catch((err) => console.warn('[IssueService] Notification error:', err));
  }
}

/**
 * Checks if there are active open issues that block final receipt / completion.
 */
export function isIssueBlockingCompletion(issues: RescueIssue[]): {
  isBlocked: boolean;
  blockingReason?: string;
  blockingIssue?: RescueIssue;
} {
  const unresolved = issues.filter(
    (i) => i.status === 'OPEN' || i.status === 'REVIEWING'
  );

  if (unresolved.length === 0) {
    return { isBlocked: false };
  }

  const critical = unresolved.find(
    (i) =>
      i.issueType === 'QUANTITY_MISMATCH' ||
      i.issueType === 'PACKAGING_CONCERN' ||
      i.issueType === 'FOOD_INFORMATION_MISMATCH'
  );

  if (critical) {
    return {
      isBlocked: true,
      blockingReason: `Unresolved critical issue: ${critical.issueType.replace(/_/g, ' ')}. Please review and resolve before completing delivery.`,
      blockingIssue: critical,
    };
  }

  return { isBlocked: false };
}

/**
 * Subscribes in real-time to all issues.
 */
export function subscribeToAllIssues(
  onUpdate: (issues: RescueIssue[]) => void
): Unsubscribe {
  if (!isSupabaseConfigured || !supabase) {
    onUpdate([]);
    return () => {};
  }

  const fetchIssues = async () => {
    try {
      const { data, error } = await supabase
        .from('rescue_issues')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('[IssueService] Fetch error:', error);
        return;
      }

      onUpdate((data || []).map(mapRowToIssue));
    } catch (e) {
      console.warn('[IssueService] Exception fetching all issues:', e);
    }
  };

  fetchIssues();

  const channel = supabase
    .channel('realtime:all_rescue_issues')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'rescue_issues' },
      () => fetchIssues()
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Subscribes in real-time to open issues for a coordinator or donation.
 */
export function subscribeToOpenRescueIssues(
  onUpdate: (issues: RescueIssue[]) => void
): Unsubscribe {
  if (!isSupabaseConfigured || !supabase) {
    onUpdate([]);
    return () => {};
  }

  const fetchIssues = async () => {
    try {
      const { data, error } = await supabase
        .from('rescue_issues')
        .select('*')
        .in('status', ['OPEN', 'REVIEWING'])
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('[IssueService] Fetch error:', error);
        return;
      }

      onUpdate((data || []).map(mapRowToIssue));
    } catch (e) {
      console.warn('[IssueService] Exception fetching issues:', e);
    }
  };

  fetchIssues();

  const channel = supabase
    .channel('realtime:rescue_issues')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'rescue_issues' },
      () => fetchIssues()
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Subscribes to issues for a specific donation.
 */
export function subscribeToDonationIssues(
  donationId: string,
  onUpdate: (issues: RescueIssue[]) => void
): Unsubscribe {
  if (!isSupabaseConfigured || !supabase) {
    onUpdate([]);
    return () => {};
  }

  const fetchIssues = async () => {
    try {
      const { data, error } = await supabase
        .from('rescue_issues')
        .select('*')
        .eq('donation_id', donationId)
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('[IssueService] Fetch donation issues error:', error);
        return;
      }

      onUpdate((data || []).map(mapRowToIssue));
    } catch (e) {
      console.warn('[IssueService] Exception fetching donation issues:', e);
    }
  };

  fetchIssues();

  const channel = supabase
    .channel(`realtime:donation_issues:${donationId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'rescue_issues', filter: `donation_id=eq.${donationId}` },
      () => fetchIssues()
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
