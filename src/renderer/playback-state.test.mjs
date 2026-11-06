import assert from 'node:assert/strict';
import test from 'node:test';
import { resumeTime, formatTime, selectEpisode } from './playback-state.ts';

test('resume is bounded and completed videos restart from the beginning', () => {
  assert.equal(resumeTime(42, 100), 42);
  assert.equal(resumeTime(99, 100), 0);
  assert.equal(resumeTime(-5, 100), 0);
  assert.equal(resumeTime(Number.NaN, 100), 0);
  assert.equal(resumeTime(42, 0), 42);
});
test('episode selection never replaces an unavailable saved episode with another episode', () => {
  const episodes = [{ id: 'a', order: 1 }, { id: 'b', order: 2 }];
  assert.equal(selectEpisode(episodes, 'b')?.id, 'b');
  assert.equal(selectEpisode(episodes, 'missing'), undefined);
  assert.equal(selectEpisode(episodes)?.id, 'a');
  assert.equal(selectEpisode([], 'b'), undefined);
});
test('time formatting handles unavailable durations and hours', () => {
  assert.equal(formatTime(0), '00:00');
  assert.equal(formatTime(75), '01:15');
  assert.equal(formatTime(3661), '1:01:01');
  assert.equal(formatTime(Number.POSITIVE_INFINITY), '00:00');
});
