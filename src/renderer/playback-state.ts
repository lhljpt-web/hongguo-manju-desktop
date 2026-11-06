import type { Episode } from '../shared/types';
export function resumeTime(time: number, duration: number): number {
  if (!Number.isFinite(time) || time < 0) return 0;
  if (Number.isFinite(duration) && duration > 0 && time >= duration - 2) return 0;
  return time;
}
export function formatTime(time: number): string {
  const seconds = Number.isFinite(time) ? Math.max(0, Math.floor(time)) : 0;
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor(seconds / 60) % 60;
  const tail = `${String(minutes).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  return hours ? `${hours}:${tail}` : tail;
}
export function selectEpisode(episodes: Episode[], id?: string): Episode | undefined {
  return id ? episodes.find(episode => episode.id === id) : episodes[0];
}
