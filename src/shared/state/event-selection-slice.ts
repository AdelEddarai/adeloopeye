import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

// State for selected events across the application
export type EventSelectionState = {
  selectedEventId: string | null;
  selectedLocation: string | null;
  highlightedEvents: string[]; // Multiple events can be highlighted
  focusMode: 'event' | 'location' | null; // What type of focus
  followSelection: boolean;
  timestamp: number; // For tracking selection changes
};

const initialState: EventSelectionState = {
  selectedEventId: null,
  selectedLocation: null,
  highlightedEvents: [],
  focusMode: null,
  followSelection: true,
  timestamp: Date.now(),
};

const eventSelectionSlice = createSlice({
  name: 'eventSelection',
  initialState,
  reducers: {
    // Select a single event (from network graph or map)
    selectEvent(state, action: PayloadAction<{ eventId: string; location?: string }>) {
      state.selectedEventId = action.payload.eventId;
      state.selectedLocation = action.payload.location || null;
      state.highlightedEvents = [action.payload.eventId];
      state.focusMode = 'event';
      state.timestamp = Date.now();
      console.log('🎯 Event selected:', action.payload.eventId);
    },

    // Select a location (highlights all events at that location)
    selectLocation(state, action: PayloadAction<{ location: string; eventIds: string[] }>) {
      state.selectedLocation = action.payload.location;
      state.selectedEventId = null;
      state.highlightedEvents = action.payload.eventIds;
      state.focusMode = 'location';
      state.timestamp = Date.now();
      console.log('📍 Location selected:', action.payload.location, 'Events:', action.payload.eventIds.length);
    },

    // Highlight multiple events (for hover effects)
    highlightEvents(state, action: PayloadAction<string[]>) {
      state.highlightedEvents = action.payload;
      state.timestamp = Date.now();
    },

    // Clear all selections
    clearSelection(state) {
      state.selectedEventId = null;
      state.selectedLocation = null;
      state.highlightedEvents = [];
      state.focusMode = null;
      state.timestamp = Date.now();
      console.log('🔄 Selection cleared');
    },
    setFollowSelection(state, action: PayloadAction<boolean>) {
      state.followSelection = action.payload;
      state.timestamp = Date.now();
    },
  },
});

export const {
  selectEvent,
  selectLocation,
  highlightEvents,
  clearSelection,
  setFollowSelection,
} = eventSelectionSlice.actions;

export default eventSelectionSlice.reducer;
