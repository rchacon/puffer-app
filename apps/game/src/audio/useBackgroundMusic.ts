import { useEffect } from "react";
import { pauseMusic, startMusic, stopMusic } from "./player";

/**
 * Plays `url` on loop while `active` (level gameplay), unless `muted`.
 * Muting pauses in place so unmuting resumes mid-track; leaving gameplay
 * (back to start / result screen) rewinds so the next game starts from the top.
 */
export function useBackgroundMusic(url: string, volume: number, active: boolean, muted: boolean) {
  useEffect(() => {
    if (!active) stopMusic();
    else if (muted) pauseMusic(url);
    else void startMusic(url, volume);
  }, [url, volume, active, muted]);

  useEffect(() => stopMusic, []);
}
