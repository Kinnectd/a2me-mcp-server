import { z } from 'zod';
import { requireAuth } from '../auth/auth-context.js';
import { A2MeApiClient } from '../client/a2me-api-client.js';
import { config } from '../config.js';
import type { TripSummary } from '../types/index.js';

export const getTripOverviewSchema = z.object({
  tripName: z.string().min(1).optional(),
});

/** A trip is still relevant until its last day has passed. */
function isUpcoming(trip: TripSummary): boolean {
  return trip.endDate >= new Date().toISOString().slice(0, 10);
}

function messageResult(message: string, tripNames: string[] = []) {
  const structuredContent = { message, tripNames };
  return {
    structuredContent,
    content: [{ type: 'text' as const, text: JSON.stringify(structuredContent, null, 2) }],
  };
}

export async function getTripOverview(input: z.infer<typeof getTripOverviewSchema>) {
  requireAuth();
  const client = new A2MeApiClient(config.a2meApiUrl, config.a2meAuthToken);
  const trips = await client.getMyTrips();

  let selected: TripSummary | undefined;
  if (input.tripName) {
    const needle = input.tripName.trim().toLowerCase();
    const matches = trips.filter((t) => t.title.toLowerCase().includes(needle));
    if (matches.length === 0) {
      return messageResult(
        `No trip found matching "${input.tripName}".`,
        trips.map((t) => t.title),
      );
    }
    if (matches.length > 1) {
      return messageResult(
        `Multiple trips match "${input.tripName}" — which one do you mean?`,
        matches.map((t) => t.title),
      );
    }
    selected = matches[0];
  } else {
    const upcoming = trips.filter(isUpcoming);
    if (upcoming.length === 0) {
      return messageResult('No upcoming trips found.');
    }
    if (upcoming.length > 1) {
      return messageResult(
        'You have several upcoming trips — which one do you mean?',
        upcoming.map((t) => t.title),
      );
    }
    selected = upcoming[0];
  }

  const overview = await client.getTripOverview(selected.tripId);
  if (!overview) {
    return messageResult(`Couldn't load the trip "${selected.title}".`);
  }

  return {
    structuredContent: overview as unknown as Record<string, unknown>,
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify(overview, null, 2),
      },
    ],
  };
}

export const getTripOverviewToolDefinition = {
  name: 'get_trip_overview',
  description:
    "Everything about a family trip in one view: dates, destination, who's coming (with RSVP and pending invites), each person's travel details (flights and lodging — e.g. 'when does Marcia land'), and the itinerary of linked events. Omit tripName to use the single upcoming trip.",
  inputSchema: {
    type: 'object' as const,
    properties: {
      tripName: {
        type: 'string',
        description:
          'Trip name to look up (fuzzy, case-insensitive). Omit to use the only upcoming trip.',
      },
    },
  },
};
