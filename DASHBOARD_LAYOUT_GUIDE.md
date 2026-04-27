# Dashboard Layout System - User Guide

## 🎯 Overview

The dashboard uses a flexible widget-based layout system with automatic localStorage persistence. Users can customize their workspace and their preferences are saved automatically.

## 📦 Default Layout (NEW)

When users first visit the dashboard, they see:

### Column 1 (50% width): Intel Map
- Interactive map with flight tracking
- Click airplanes to track them with trails
- Toggle layers: STRIKES, MISSILES, TARGETS, ASSETS, FLIGHTS, ZONES, HEAT

### Column 2 (50% width): Morocco KPI Dashboard
- Real-time Morocco intelligence metrics
- Weather, traffic, commodities, fires
- Infrastructure and event monitoring

## 🔧 Customization Features

### Adding Widgets
1. Click **"EDIT LAYOUT"** button
2. Select widget from dropdown
3. Choose which column to add it to
4. Or click **"+ col"** to create a new column

### Available Widgets
- **Intel Map** - Interactive intelligence map
- **Morocco KPI Dashboard** - Morocco metrics
- **Intelligence Analytics** - Data analysis
- **Critical News Intel** - Breaking news
- **Live News** - Real-time news feed
- **Live Flights** - Flight tracking list
- **Threat Intelligence** - Security threats
- **Cyber Threats** - Cyber attack monitoring
- **Global & Morocco Markets** - Financial data
- **AI & Tech News** - Technology updates
- **Situation Summary** - Conflict overview
- **Latest Events** - Recent incidents
- **Actor Positions** - Military assets
- **Field Signals** - Intelligence signals
- **Key Facts** - Important information
- **Casualties** - Casualty reports
- **Prediction Markets** - Forecasting
- **Daily Brief** - Intelligence briefing
- **Live Crypto** - Cryptocurrency prices
- **Morocco Intel** - Morocco-specific data
- **Morocco 3D Map** - 3D terrain visualization

### Removing Widgets
1. Enable **"EDIT LAYOUT"** mode
2. Click **X** button on widget header
3. Widget is removed from layout

### Moving Widgets
1. Enable **"EDIT LAYOUT"** mode
2. Use **← →** arrows on widget header
3. Move widgets between columns

### Resizing
1. Enable **"EDIT LAYOUT"** mode
2. Drag the splitters between columns/rows
3. Adjust sizes to your preference

### Zoom Control
1. Enable **"EDIT LAYOUT"** mode
2. Use **-** and **+** buttons in toolbar
3. Zoom range: 50% - 150%

## 💾 Automatic Persistence

### What Gets Saved
- Widget layout (which widgets in which columns)
- Column sizes (width percentages)
- Row sizes (height percentages)
- Active preset selection
- Edit mode state

### Storage Location
```
localStorage key: "adeloopeye:workspace:v4"
```

### When It Saves
Automatically saves after:
- Adding/removing widgets
- Moving widgets between columns
- Resizing columns or rows
- Switching presets
- Toggling edit mode

### Privacy
- Requires user consent for "Preferences" cookies
- No data sent to server
- Stored only in browser localStorage
- Cleared when user clears browser data

## 🎨 Preset Layouts

### DEFAULT (Analyst)
**Description:** Intelligence map with Morocco KPI dashboard
- Column 1: Intel Map (50%)
- Column 2: Morocco KPI Dashboard (50%)

### PRESET 2 (Commander)
**Description:** Operational intelligence with analytics
- Column 1: Intel Map (40%)
- Column 2: Intelligence Analytics + Live Flights (30%)
- Column 3: Critical News + Cyber Threats (30%)

### PRESET 3 (Executive)
**Description:** Executive dashboard with analytics
- Column 1: Daily Brief + Prediction Markets (33%)
- Column 2: Intelligence Analytics + Critical News (33%)
- Column 3: Situation Summary + Key Facts (34%)

### PRESET 4 (Live Data)
**Description:** Real-time streaming data
- Column 1: Live News + Live Flights (35%)
- Column 2: Threat Intelligence + Cyber Threats (35%)
- Column 3: Markets + AI & Tech News (30%)

## 🔄 Switching Presets

1. Click preset button in toolbar (DEFAULT, PRESET 2, PRESET 3, LIVE DATA)
2. Layout changes immediately
3. New layout is saved to localStorage
4. Custom modifications mark layout as "CUSTOM"

## 🔙 Reset to Default

1. Enable **"EDIT LAYOUT"** mode
2. Click **"Reset"** button
3. Returns to DEFAULT preset (Intel Map + Morocco KPI)
4. Clears all custom sizes

## 🛠️ Technical Details

### State Management
- **Redux Toolkit** for state management
- **Redux Listener Middleware** for persistence
- **Automatic serialization** to localStorage

### Data Structure
```typescript
{
  columns: [
    { id: 'col-a', widgets: ['map', 'moroccokpi'] }
  ],
  activePreset: 'analyst',
  editing: false,
  columnSizes: { 'col-a': 50, 'col-b': 50 },
  rowSizes: { 'col-a': { 'col-a-map': 50, 'col-a-moroccokpi': 50 } }
}
```

### Migration
- Automatically migrates from v3 to v4 format
- Cleans up duplicate widgets
- Preserves user customizations

## 🐛 Troubleshooting

### Layout Not Saving
1. Check browser console for errors
2. Verify localStorage is enabled
3. Check cookie consent settings
4. Clear localStorage and refresh: `localStorage.removeItem('adeloopeye:workspace:v4')`

### Widgets Duplicated
- System automatically deduplicates on load
- If persists, clear localStorage and reset

### Layout Looks Wrong
1. Click **"Reset"** button in edit mode
2. Or manually clear: `localStorage.removeItem('adeloopeye:workspace:v4')`
3. Refresh page to load default layout

### Performance Issues
- Reduce number of widgets
- Disable unused layers in Intel Map
- Use zoom control to reduce widget size

## 📊 Usage Analytics

When analytics consent is given, the system tracks:
- Preset changes
- Widget additions/removals
- Day selector changes
- Navigation clicks

**No personal data is collected.**

## 🔐 Privacy & Security

### Data Storage
- All layout data stored locally in browser
- No server-side storage
- No cross-device sync

### Cookie Consent
- Requires "Preferences" consent
- Respects user privacy choices
- Can be revoked anytime

### Data Deletion
Users can delete their layout data:
1. Browser Settings → Clear Browsing Data → Cookies and Site Data
2. Or manually: `localStorage.removeItem('adeloopeye:workspace:v4')`

## 🚀 Future Enhancements

Potential features:
- [ ] Cloud sync across devices
- [ ] Share layouts with team
- [ ] Export/import layout configurations
- [ ] More preset templates
- [ ] Widget-specific settings
- [ ] Drag-and-drop widget reordering
- [ ] Collapsible widgets
- [ ] Full-screen widget mode

## 📝 Developer Notes

### Adding New Widgets

1. **Create Widget Component:**
   ```typescript
   // src/features/dashboard/components/widgets/MyWidget.tsx
   export function MyWidget() {
     return <div>My Widget Content</div>;
   }
   ```

2. **Register in widgets/index.tsx:**
   ```typescript
   const MyWidget = dynamic(() => import('./MyWidget').then(m => m.MyWidget));
   
   export function widgetComponents(): Record<WidgetKey, () => React.ReactNode> {
     return {
       // ... existing widgets
       mywidget: () => <MyWidget />,
     };
   }
   ```

3. **Add to presets.ts:**
   ```typescript
   export type WidgetKey = 
     | 'situation' | 'latest' 
     | 'mywidget'; // Add here
   
   export const WIDGET_LABELS: Record<WidgetKey, string> = {
     // ... existing labels
     mywidget: 'My Widget Label',
   };
   ```

4. **Widget is now available** in the dropdown and can be added to layouts!

### Modifying Presets

Edit `src/features/dashboard/state/presets.ts`:

```typescript
export const PRESETS: Record<PresetId, PresetDefinition> = {
  analyst: {
    label: 'DEFAULT',
    description: 'Your description',
    columns: [
      { id: 'col-a', widgets: ['widget1', 'widget2'] },
      { id: 'col-b', widgets: ['widget3'] },
    ],
    columnSizes: { 'col-a': 60, 'col-b': 40 },
  },
};
```

### Testing Persistence

```javascript
// In browser console:

// View current layout
JSON.parse(localStorage.getItem('adeloopeye:workspace:v4'))

// Clear layout (will reset to default)
localStorage.removeItem('adeloopeye:workspace:v4')

// Manually set layout
localStorage.setItem('adeloopeye:workspace:v4', JSON.stringify({
  columns: [{ id: 'col-a', widgets: ['map'] }],
  activePreset: 'custom',
  editing: false,
  columnSizes: {},
  rowSizes: {}
}))
```

## 📚 Related Files

- `src/features/dashboard/state/presets.ts` - Widget definitions and presets
- `src/features/dashboard/state/workspace-slice.ts` - Redux state management
- `src/shared/state/index.ts` - Store configuration and persistence
- `src/features/dashboard/components/WorkspaceDashboard.tsx` - Main dashboard UI
- `src/features/dashboard/components/widgets/` - Individual widget components
