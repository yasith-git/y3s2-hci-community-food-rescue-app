/**
 * Date and Time Formatting Utilities for Donations & Routes
 * Community Food Rescue App
 */

export function formatTime(isoString?: string): string {
  if (!isoString) return '--:--';
  const date = new Date(isoString);
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

export function formatDate(isoString?: string): string {
  if (!isoString) return '--';
  const date = new Date(isoString);
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export function formatDateTime(isoString?: string): string {
  if (!isoString) return '--';
  const date = new Date(isoString);
  return `${formatDate(isoString)}, ${formatTime(isoString)}`;
}

export function formatTimeWindow(startIso?: string, endIso?: string): string {
  if (!startIso && !endIso) return 'Flexible';
  if (!startIso) return `Until ${formatTime(endIso)}`;
  if (!endIso) return `From ${formatTime(startIso)}`;
  return `${formatTime(startIso)} – ${formatTime(endIso)}`;
}

export function formatTimeRemaining(targetIsoString?: string): string {
  if (!targetIsoString) return '--';
  const now = new Date().getTime();
  const target = new Date(targetIsoString).getTime();
  const diffMs = target - now;

  if (diffMs <= 0) {
    return 'Expired';
  }

  const diffMin = Math.round(diffMs / (1000 * 60));
  if (diffMin < 60) {
    return `${diffMin}m`;
  }

  const diffHrs = Math.floor(diffMin / 60);
  const remainingMin = diffMin % 60;
  if (diffHrs < 24) {
    return remainingMin > 0 ? `${diffHrs}h ${remainingMin}m` : `${diffHrs}h`;
  }

  const diffDays = Math.round(diffHrs / 24);
  return `${diffDays}d`;
}

/**
 * Generates human-friendly relative time for pickup windows and expirations
 */
export function getRelativeTimeString(
  targetIsoString: string,
  prefix: string = 'Pickup in'
): string {
  if (!targetIsoString) return '';
  const now = new Date().getTime();
  const target = new Date(targetIsoString).getTime();
  const diffMs = target - now;

  if (diffMs <= 0) {
    const passedMin = Math.abs(Math.round(diffMs / (1000 * 60)));
    if (passedMin < 60) return `Expired ${passedMin}m ago`;
    const passedHrs = Math.round(passedMin / 60);
    return `Expired ${passedHrs}h ago`;
  }

  const diffMin = Math.round(diffMs / (1000 * 60));
  if (diffMin < 60) {
    return `${prefix} ${diffMin} min`;
  }

  const diffHrs = Math.floor(diffMin / 60);
  const remainingMin = diffMin % 60;
  if (diffHrs < 24) {
    return remainingMin > 0
      ? `${prefix} ${diffHrs}h ${remainingMin}m`
      : `${prefix} ${diffHrs}h`;
  }

  const diffDays = Math.round(diffHrs / 24);
  return `${prefix} ${diffDays} day${diffDays > 1 ? 's' : ''}`;
}

/**
 * Returns a short human-readable relative time string (e.g. "Just now", "5m ago", "2h ago", "3d ago")
 */
export function formatRelativeTime(isoString?: string): string {
  if (!isoString) return '--';
  const time = new Date(isoString).getTime();
  const now = Date.now();
  const diffMs = now - time;

  if (diffMs < 60 * 1000) {
    return 'Just now';
  }

  const diffMin = Math.floor(diffMs / (60 * 1000));
  if (diffMin < 60) {
    return `${diffMin}m ago`;
  }

  const diffHrs = Math.floor(diffMin / 60);
  if (diffHrs < 24) {
    return `${diffHrs}h ago`;
  }

  const diffDays = Math.floor(diffHrs / 24);
  if (diffDays < 7) {
    return `${diffDays}d ago`;
  }

  return formatDate(isoString);
}
