import type { Harness } from "../ai/harness/harness";

const harnesses = new Map<string, Harness>();

export const getHarness = (projectId: string): Harness | undefined =>
  harnesses.get(projectId);

export const setHarness = (projectId: string, harness: Harness): void => {
  harnesses.set(projectId, harness);
};

export const evictHarness = (projectId: string): void => {
  harnesses.delete(projectId);
};
