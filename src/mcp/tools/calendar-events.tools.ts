import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { McpContext } from '../mcp-context';
import { serializeCalendarEvent } from '../serializers';
import { textResult, errorResult } from '../result-helpers';

const DEFAULT_RANGE_DAYS = 7;
// note: offset wajib biar AI nggak diam-diam menganggap jam lokal user sebagai UTC
const DATETIME_SHAPE = z.iso
  .datetime({ offset: true })
  .describe("ISO 8601 with offset, e.g. '2026-10-10T09:00:00+07:00'");

function errorMessage(err: unknown, fallback: string) {
  return err instanceof Error ? err.message : fallback;
}

function formatRange(startAt: Date, endAt: Date, allDay: boolean) {
  return `${startAt.toISOString()} - ${endAt.toISOString()}${allDay ? ' (all day)' : ''}`;
}

export function registerCalendarEventTools(server: McpServer, ctx: McpContext) {
  server.registerTool(
    'list_events',
    {
      title: 'List calendar events',
      description: `List the user's calendar events overlapping [from, to), ordered by start. Multi-day events that started before \`from\` are included. Without from/to it returns the next ${DEFAULT_RANGE_DAYS} days from now.`,
      inputSchema: {
        from: DATETIME_SHAPE.optional(),
        to: DATETIME_SHAPE.optional(),
      },
    },
    async ({ from, to }) => {
      const fromDate = from ? new Date(from) : new Date();
      const toDate = to
        ? new Date(to)
        : from
          ? null
          : new Date(Date.now() + DEFAULT_RANGE_DAYS * 24 * 60 * 60 * 1000);

      const events = await ctx.calendarEventsService.findAll(
        ctx.userId,
        fromDate,
        toDate,
      );
      const items = events.map(serializeCalendarEvent);

      const summary = items.length
        ? events
            .map(
              (event) =>
                `- ${event.title}: ${formatRange(event.startAt, event.endAt, event.allDay)} (${event.id})`,
            )
            .join('\n')
        : 'No events in this range.';

      return textResult(summary, { events: items });
    },
  );

  server.registerTool(
    'create_event',
    {
      title: 'Create calendar event',
      description:
        "Create a calendar event, optionally linked to a todo (todoId). title defaults to the linked todo's title. endAt is exclusive and must be after startAt - a one-day all-day event runs from midnight to the next midnight.",
      inputSchema: {
        title: z.string().min(1).optional(),
        description: z.string().optional(),
        startAt: DATETIME_SHAPE,
        endAt: DATETIME_SHAPE,
        allDay: z.boolean().optional(),
        color: z.string().optional(),
        todoId: z.string().optional().describe('Link the event to this todo'),
      },
      annotations: { destructiveHint: false },
    },
    async ({ title, description, startAt, endAt, allDay, color, todoId }) => {
      try {
        const event = await ctx.calendarEventsService.create(ctx.userId, {
          title,
          description,
          startAt: new Date(startAt),
          endAt: new Date(endAt),
          allDay,
          color,
          todoId,
        });
        return textResult(
          `Created "${event.title}" (${event.id})`,
          serializeCalendarEvent(event),
        );
      } catch (err) {
        return errorResult(errorMessage(err, 'Failed to create event'));
      }
    },
  );

  server.registerTool(
    'update_event',
    {
      title: 'Update calendar event',
      description:
        'Update fields on an existing calendar event. Only pass the fields you want to change; todoId null unlinks the todo.',
      inputSchema: {
        id: z.string(),
        title: z.string().min(1).optional(),
        description: z.string().nullable().optional(),
        startAt: DATETIME_SHAPE.optional(),
        endAt: DATETIME_SHAPE.optional(),
        allDay: z.boolean().optional(),
        color: z.string().nullable().optional(),
        todoId: z.string().nullable().optional(),
      },
      annotations: { idempotentHint: true },
    },
    async ({
      id,
      title,
      description,
      startAt,
      endAt,
      allDay,
      color,
      todoId,
    }) => {
      try {
        const updated = await ctx.calendarEventsService.update(ctx.userId, {
          id,
          title,
          description,
          startAt: startAt ? new Date(startAt) : undefined,
          endAt: endAt ? new Date(endAt) : undefined,
          allDay,
          color,
          todoId,
        });
        if (!updated) return errorResult(`Event ${id} tidak ditemukan`);
        return textResult(
          `Updated "${updated.title}"`,
          serializeCalendarEvent(updated),
        );
      } catch (err) {
        return errorResult(errorMessage(err, 'Failed to update event'));
      }
    },
  );

  server.registerTool(
    'delete_event',
    {
      title: 'Delete calendar event',
      description:
        'Permanently delete a calendar event. A linked todo is left untouched.',
      inputSchema: { id: z.string() },
      annotations: { destructiveHint: true, idempotentHint: false },
    },
    async ({ id }) => {
      const deleted = await ctx.calendarEventsService.remove(id, ctx.userId);
      if (!deleted) return errorResult(`Event ${id} tidak ditemukan`);
      return textResult(`Deleted "${deleted.title}"`, { id: deleted.id });
    },
  );
}
