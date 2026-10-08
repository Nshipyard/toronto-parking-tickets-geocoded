import { NextResponse } from "next/server";

const spec = {
  openapi: "3.1.0",
  info: {
    title: "Toronto Parking Tickets Geocoded API",
    version: "1.0.0",
    description:
      "City of Toronto parking tickets, calendar years 2023-2025, geocoded to wards and 158-model neighbourhoods by matching ticket addresses to the City's Address Points file. Aggregated responses only. MIT licensed.",
  },
  servers: [{ url: "https://parking.canada.nshipyard.com/api/v1" }],
  paths: {
    "/tickets/summary": {
      get: {
        summary: "Dataset summary: slice, totals, match rate, top findings",
        responses: { "200": { description: "Summary object" } },
      },
    },
    "/tickets/by_ward": {
      get: {
        summary: "Ticket stats per ward",
        parameters: [{ name: "ward", in: "query", required: false, schema: { type: "string" }, example: "10" }],
        responses: { "200": { description: "Ward list or single ward" }, "404": { description: "Unknown ward" } },
      },
    },
    "/tickets/by_neighbourhood": {
      get: {
        summary: "Ticket stats per 158-model neighbourhood",
        parameters: [{ name: "code", in: "query", required: false, schema: { type: "string" }, example: "166" }],
        responses: { "200": { description: "Neighbourhood list or single neighbourhood" }, "404": { description: "Unknown code" } },
      },
    },
    "/tickets/infractions": {
      get: {
        summary: "Infraction codebook with counts and average fines",
        parameters: [
          { name: "code", in: "query", required: false, schema: { type: "string" }, example: "5" },
          { name: "q", in: "query", required: false, schema: { type: "string" }, example: "fire route" },
          { name: "limit", in: "query", required: false, schema: { type: "integer" }, example: 60 },
        ],
        responses: { "200": { description: "Infraction list or single code" }, "404": { description: "Unknown code" } },
      },
    },
    "/tickets/streets": {
      get: {
        summary: "Most-ticketed streets",
        parameters: [
          { name: "q", in: "query", required: false, schema: { type: "string" }, example: "king" },
          { name: "limit", in: "query", required: false, schema: { type: "integer" }, example: 20 },
        ],
        responses: { "200": { description: "Street list" } },
      },
    },
    "/tickets/search": {
      get: {
        summary: "Combined search across streets, wards, neighbourhoods, infractions",
        parameters: [{ name: "q", in: "query", required: true, schema: { type: "string" }, example: "yonge" }],
        responses: { "200": { description: "Grouped matches" } },
      },
    },
  },
};

export async function GET() {
  return NextResponse.json(spec);
}
