import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Recalculate and persist reliabilityScore for a worker.
 *
 * Score formula (0–100):
 *   attendance_component = (shiftsCompleted / max(1, shiftsCompleted + noShows)) * 60
 *   rating_component     = (clientRatingAvg / 5) * 40        (if rated at least once)
 *   final                = attendance_component + rating_component
 *
 * A no-show deducts 10 points from the raw score (floored at 0).
 */
export async function recalcReliability(sb: SupabaseClient, workerId: string): Promise<void> {
  const { data: w } = await sb
    .from('Worker')
    .select('"totalShiftsCompleted", "totalNoShows", "clientRatingAvg", "clientRatingCount"')
    .eq('id', workerId)
    .single();

  if (!w) return;

  const completed = (w as any).totalShiftsCompleted ?? 0;
  const noShows   = (w as any).totalNoShows ?? 0;
  const ratingAvg = (w as any).clientRatingAvg ?? 0;
  const ratingCnt = (w as any).clientRatingCount ?? 0;

  const total = completed + noShows;
  const attendanceScore = total > 0 ? (completed / total) * 60 : 30; // default 30 for new workers
  const ratingScore = ratingCnt > 0 ? (ratingAvg / 5) * 40 : 20;    // default 20 for unrated

  const raw = attendanceScore + ratingScore;
  const penalised = Math.max(0, raw - noShows * 10);
  const score = Math.min(100, Math.round(penalised)) / 100; // store as 0–1

  await sb.from('Worker').update({ reliabilityScore: score }).eq('id', workerId);
}
