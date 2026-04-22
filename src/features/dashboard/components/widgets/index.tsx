import dynamic from 'next/dynamic';
import type React from 'react';

import type { WidgetKey } from '@/features/dashboard/state/presets';

const ActorsWidget = dynamic(() => import('./ActorsWidget').then(m => m.ActorsWidget));
const AITechWidget = dynamic(() => import('./AITechWidget').then(m => m.AITechWidget));
const BriefWidget = dynamic(() => import('./BriefWidget').then(m => m.BriefWidget));
const CasualtiesWidget = dynamic(() => import('./CasualtiesWidget').then(m => m.CasualtiesWidget));
const CommandersWidget = dynamic(() => import('./CommandersWidget').then(m => m.CommandersWidget));
const CommodityPricesWidget = dynamic(() => import('./CommodityPricesWidget').then(m => m.CommodityPricesWidget));
const CriticalNewsWidget = dynamic(() => import('./CriticalNewsWidget').then(m => m.CriticalNewsWidget));
const CyberThreatsWidget = dynamic(() => import('./CyberThreatsWidget').then(m => m.CyberThreatsWidget));
const IntelAnalyticsWidget = dynamic(() => import('./IntelAnalyticsWidget').then(m => m.IntelAnalyticsWidget));
const KeyFactsWidget = dynamic(() => import('./KeyFactsWidget').then(m => m.KeyFactsWidget));
const LatestEventsWidget = dynamic(() => import('./LatestEventsWidget').then(m => m.LatestEventsWidget));
const LiveCryptoWidget = dynamic(() => import('./LiveCryptoWidget').then(m => m.LiveCryptoWidget));
const LiveFlightsWidget = dynamic(() => import('./LiveFlightsWidget').then(m => m.LiveFlightsWidget));
const LiveNewsWidget = dynamic(() => import('./LiveNewsWidget').then(m => m.LiveNewsWidget));
const LiveThreatsWidget = dynamic(() => import('./LiveThreatsWidget').then(m => m.LiveThreatsWidget));
const MapWidget = dynamic(() => import('./MapWidget').then(m => m.MapWidget));
const MarketsWidget = dynamic(() => import('./MarketsWidget').then(m => m.MarketsWidget));
const MoroccoWidget = dynamic(() => import('./MoroccoWidget').then(m => m.MoroccoWidget));
const MoroccoKPIDashboard = dynamic(() => import('./MoroccoKPIDashboard').then(m => m.MoroccoKPIDashboard));
const MoroccoMapWidget = dynamic(() => import('./MoroccoMapWidget').then(m => m.MoroccoMapWidget));
const PredictionsWidget = dynamic(() => import('./PredictionsWidget').then(m => m.PredictionsWidget));
const SignalsWidget = dynamic(() => import('./SignalsWidget').then(m => m.SignalsWidget));
const SituationWidget = dynamic(() => import('./SituationWidget').then(m => m.SituationWidget));

export function widgetComponents(): Record<WidgetKey, () => React.ReactNode> {
  return {
    situation:   () => <SituationWidget />,
    latest:      () => <LatestEventsWidget />,
    actors:      () => <ActorsWidget />,
    signals:     () => <SignalsWidget />,
    map:         () => <MapWidget />,
    keyfacts:    () => <KeyFactsWidget />,
    casualties:  () => <CasualtiesWidget />,
    commanders:  () => <CommandersWidget />,
    predictions: () => <PredictionsWidget />,
    brief:       () => <BriefWidget />,
    livenews:    () => <LiveNewsWidget />,
    liveflights: () => <LiveFlightsWidget />,
    livethreats: () => <LiveThreatsWidget />,
    livecrypto:  () => <LiveCryptoWidget />,
    markets:     () => <MarketsWidget />,
    cyberthreats: () => <CyberThreatsWidget />,
    commodities: () => <CommodityPricesWidget />,
    aitech:      () => <AITechWidget />,
    morocco:     () => <MoroccoWidget />,
    moroccokpi:  () => <MoroccoKPIDashboard />,
    moroccomap:  () => <MoroccoMapWidget />,
    intelanalytics: () => <IntelAnalyticsWidget />,
    criticalnews: () => <CriticalNewsWidget />,
  };
}
