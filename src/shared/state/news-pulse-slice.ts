import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export type NewsPulse = {
  id: string;
  title: string;
  description: string;
  url: string;
  source: string;
  publishedAt: string;
  position: [number, number] | null;
  receivedAt: string;
};

type NewsPulseState = {
  pulses: NewsPulse[];
  lastFetchedAt: string | null;
};

const MAX_PULSES = 50;
const PRUNE_AGE_MS = 5 * 60 * 1000;

const initialState: NewsPulseState = {
  pulses: [],
  lastFetchedAt: null,
};

function prune(pulses: NewsPulse[]): NewsPulse[] {
  const cutoff = Date.now() - PRUNE_AGE_MS;
  return pulses.filter((p) => new Date(p.receivedAt).getTime() > cutoff).slice(-MAX_PULSES);
}

const newsPulseSlice = createSlice({
  name: 'newsPulses',
  initialState,
  reducers: {
    addPulses(state, action: PayloadAction<NewsPulse[]>) {
      const existing = new Set(state.pulses.map((p) => p.id));
      const newOnes = action.payload.filter((p) => !existing.has(p.id));
      state.pulses = prune([...state.pulses, ...newOnes]);
      state.lastFetchedAt = new Date().toISOString();
    },
    clearPulses(state) {
      state.pulses = [];
    },
    prunePulses(state) {
      state.pulses = prune(state.pulses);
    },
  },
});

export const { addPulses, clearPulses, prunePulses } = newsPulseSlice.actions;
export default newsPulseSlice.reducer;
