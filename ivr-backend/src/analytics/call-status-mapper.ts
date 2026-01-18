/**
 * Call Status Mapper
 * Maps Exotel call statuses to user-friendly display statuses
 *
 * IMPORTANT: Exotel's `answeredBy` field is unreliable for inbound calls.
 * It often returns "human" even for unanswered calls that just rang.
 * The presence of `recordingUrl` is the most reliable indicator of whether
 * a call was actually answered and had a conversation.
 */

export interface CallStatusInfo {
  displayStatus: string;
  category: 'success' | 'failed' | 'abandoned' | 'in_progress' | 'unknown';
  description: string;
}

/**
 * Map Exotel call data to display status
 *
 * Exotel Statuses:
 * - completed: Call ended (may or may not have been answered)
 * - no-answer: Call was not picked up
 * - busy: Called party's line was busy
 * - failed: Call failed due to technical error
 * - canceled: Call was canceled before being answered
 * - in-progress: Call is currently ongoing
 * - ringing: Call is ringing
 * - answered: Call has been answered (may still be in progress)
 * - queued: Call is queued to be placed
 * - initiated: Call has been initiated
 */
export function mapCallStatus(
  exotelStatus: string | null | undefined,
  answeredBy?: string | null,
  recordingUrl?: string | null,
  duration?: number | null
): CallStatusInfo {
  const status = (exotelStatus || '').toLowerCase().trim();

  // Handle explicitly unanswered statuses
  if (status === 'no-answer' || status === 'no_answer' || status === 'noanswer') {
    return {
      displayStatus: 'no-answer',
      category: 'abandoned',
      description: 'Call was not answered'
    };
  }

  if (status === 'busy') {
    return {
      displayStatus: 'busy',
      category: 'failed',
      description: 'Line was busy'
    };
  }

  if (status === 'failed') {
    return {
      displayStatus: 'failed',
      category: 'failed',
      description: 'Call failed due to technical error'
    };
  }

  if (status === 'canceled' || status === 'cancelled') {
    return {
      displayStatus: 'canceled',
      category: 'abandoned',
      description: 'Call was canceled before being answered'
    };
  }

  // Handle in-progress statuses
  if (status === 'in-progress' || status === 'in_progress' || status === 'inprogress') {
    return {
      displayStatus: 'in-progress',
      category: 'in_progress',
      description: 'Call is currently ongoing'
    };
  }

  if (status === 'ringing') {
    return {
      displayStatus: 'ringing',
      category: 'in_progress',
      description: 'Call is ringing'
    };
  }

  if (status === 'answered') {
    return {
      displayStatus: 'answered',
      category: 'in_progress',
      description: 'Call has been answered and is in progress'
    };
  }

  if (status === 'queued') {
    return {
      displayStatus: 'queued',
      category: 'in_progress',
      description: 'Call is queued to be placed'
    };
  }

  if (status === 'initiated') {
    return {
      displayStatus: 'initiated',
      category: 'in_progress',
      description: 'Call has been initiated'
    };
  }

  // Handle "completed" status - this is tricky because Exotel marks calls as
  // "completed" even if they just rang and weren't answered
  if (status === 'completed') {
    // RELIABLE INDICATOR: Recording URL presence
    // If there's a recording, the call was definitely answered and had a conversation
    if (recordingUrl) {
      return {
        displayStatus: 'completed',
        category: 'success',
        description: 'Call was answered and completed successfully'
      };
    }

    // Check if answered by machine/voicemail
    if (answeredBy === 'machine' || answeredBy === 'voicemail') {
      return {
        displayStatus: 'voicemail',
        category: 'abandoned',
        description: 'Call went to voicemail'
      };
    }

    // HEURISTIC: Short calls without recording are likely unanswered
    // Calls that just rang typically last 20-45 seconds
    if (duration && duration < 60) {
      return {
        displayStatus: 'missed',
        category: 'abandoned',
        description: 'Call rang but was not answered'
      };
    }

    // Longer calls without recording - unclear status
    // Could be answered but not recorded, or could be a long ring
    if (duration && duration >= 60) {
      return {
        displayStatus: 'completed-unrecorded',
        category: 'success',
        description: 'Call completed (no recording available)'
      };
    }

    // Default for completed with no clear indicators
    return {
      displayStatus: 'completed',
      category: 'unknown',
      description: 'Call completed with unknown outcome'
    };
  }

  // Unknown status
  return {
    displayStatus: status || 'unknown',
    category: 'unknown',
    description: 'Status unknown or not recognized'
  };
}

/**
 * Parse duration string safely
 * Handles various formats: "123", "123.45", null, undefined, empty string
 */
export function parseDuration(duration: string | null | undefined): number | null {
  if (!duration) return null;

  const trimmed = String(duration).trim();
  if (trimmed === '' || trimmed === 'null' || trimmed === 'undefined') return null;

  const parsed = parseFloat(trimmed);
  return isNaN(parsed) || !isFinite(parsed) ? null : Math.floor(parsed);
}

/**
 * Get status badge color for UI
 */
export function getStatusBadgeColor(category: CallStatusInfo['category']): string {
  switch (category) {
    case 'success':
      return 'success'; // Green
    case 'failed':
      return 'destructive'; // Red
    case 'abandoned':
      return 'secondary'; // Gray
    case 'in_progress':
      return 'default'; // Blue
    default:
      return 'outline'; // Neutral
  }
}
