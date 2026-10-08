"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";

export type Lang = "en" | "fr";

const en = {
  banner: {
    line: "An open-source civic project by Nshipyard. Not affiliated with the Government of Canada or the City of Toronto.",
    badge: "Open source",
  },
  nav: { explorer: "Explorer", showcase: "Showcase", developers: "Developers", data: "Data", back: "All projects" },
  hero: {
    kicker: "Nshipyard Canada · Project 06",
    title: "What 50 million parking tickets look like on a map.",
    sub: "Toronto issues about 2.8 million parking tickets a year. The City publishes every ticket: date, time, infraction code, fine, and street address. This project geocodes three years of tickets (2023-2025) to wards and neighbourhoods, so enforcement patterns become visible instead of anecdotal.",
    cta1: "Explore the tickets",
    cta2: "Read the methodology",
  },
  statsLabels: [
    "tickets geocoded to a ward and neighbourhood, 2023-2025",
    "of tickets in the slice matched to a City address point",
    "wards covered, out of 25",
    "infraction codes documented in the codebook",
  ],
  explorer: {
    kicker: "Explorer",
    title: "Search streets, neighbourhoods, wards, infractions.",
    body: "Type a street name, a neighbourhood, a ward, or an infraction description. Counts come from the geocoded 2023-2025 slice.",
    search: "Search e.g. Yonge, Spadina, fire route…",
    streets: "Streets",
    hoods: "Neighbourhoods",
    wards: "Wards",
    codes: "Infraction codes",
    noResult: "Nothing matches. Try a street name, a ward number, or an infraction keyword.",
    codebookTitle: "The infraction codebook",
    codebookBody: "Every infraction code in the slice, with its official description, ticket count, and average set fine. Toronto's parking rules arrive as unexplained numbers; this is the translation.",
    codebookSearch: "Filter codes…",
    colCode: "Code",
    colDesc: "Description",
    colTickets: "Tickets",
    colAvgFine: "Avg fine",
  },
  showcase: {
    kicker: "Showcase",
    title: "The enforcement map.",
    body: "Every geocoded ticket placed in its neighbourhood. Downtown wards absorb a share of enforcement far beyond their share of streets, and a handful of blocks do most of the work.",
    tickets: "tickets",
    fines: "in set fines",
    topStreets: "The most-ticketed streets",
    topStreetsBody: "Ticket counts by normalized street name, 2023-2025. One address can dominate a whole street.",
    byHour: "Tickets by hour of day",
    byHourBody: "Enforcement follows the workday: it climbs from 7h, peaks mid-morning, and falls off after 18h.",
    byMonth: "Tickets by month",
    byMonthBody: "Summer months run hotter than winter, year after year.",
    byDow: "Tickets by day of week",
    byDowBody: "Weekdays carry enforcement; Sundays are quiet.",
  },
  developers: {
    kicker: "For developers",
    title: "Query it from code, or from an agent.",
    body: "Three consumption paths, same canonical data. REST for applications, OpenAPI for integration, MCP tools over streamable HTTP for AI agents.",
    endpoints: "Endpoints",
    tryIt: "Try it",
    openapi: "OpenAPI spec",
  },
  downloads: {
    kicker: "Data",
    title: "Take the files.",
    body: "Versioned releases, MIT licensed. Aggregated CSVs; the per-ticket source files stay with the City's open data portal.",
    download: "Download",
  },
  methodology: {
    kicker: "Methodology",
    title: "How the tickets were placed on the map.",
    points: [
      "Slice: City of Toronto open data \u201cParking Tickets\u201d, calendar years 2023-2025, retrieved 2026-10-08. About 2.8 million tickets a year.",
      "Geocoding: each ticket's street address was matched to the City's Address Points (Municipal) file on house number plus normalized street name. The address point supplies the ward; the 158-model neighbourhood comes from a point-in-polygon join on official boundary geometries.",
      "Match rate is reported on this page from the computed data. Tickets with no house number (street-only locations, intersections) cannot be address-matched and are counted as unmatched.",
      "What this cannot answer: who was ticketed (tag numbers are masked), whether a ticket was paid or disputed, or why enforcement concentrates where it does. Density reflects where officers write tickets, not only where violations happen.",
    ],
  },
  footer: {
    line: "An open-source civic project by Nshipyard. Not affiliated with the Government of Canada or the City of Toronto.",
    sources: "Ticket source: City of Toronto Open Data (Parking Tickets). Addresses: Address Points (Municipal), Toronto One Address Repository. Boundaries: City of Toronto Open Data (Neighbourhoods, City Wards).",
  },
  mcp: {
    kicker: "Connect your agent",
    title: "Put this data to work inside your AI tools.",
    body: "Pick your harness, copy the prompt, send it to your agent. Your agent runs the setup itself.",
    tabs: { chatgpt: "ChatGPT", claude: "Claude", claudecode: "Claude Code", cli: "CLI", other: "Other" },
    cardTitle: "Copy and send this to {tab}",
    copy: "Copy",
    copied: "Copied",
    chatgptNote: "ChatGPT connects through the documented REST API rather than MCP directly.",
    pChatgpt:
      "I want to use the {displayName} through its API.\n- OpenAPI spec: {origin}/api/openapi.json\n- REST base: {origin}/api/v1\nFirst tell me in two sentences what this API offers, then {exampleLower}, and show me the result.",
    pClaude:
      "In Claude (claude.ai), open Settings, then Connectors, and add a custom connector:\n- Name: {displayName}\n- URL: {origin}/mcp\nThen list the available tools, {exampleLower}, and show me the result.",
    pClaudeCode:
      "Set up the {displayName} MCP server so I can query it from here.\n1. Run: claude mcp add --transport http {slug} {origin}/mcp\n2. Run `claude mcp list` to confirm it connected.\n3. {example}, and show me the result.",
    pCli:
      "# MCP endpoint (streamable HTTP)\n{origin}/mcp\n\n# List the available tools\ncurl -s -X POST {origin}/mcp -H 'Content-Type: application/json' \\\n  -d '{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"tools/list\"}'",
    otherTitle: "Everything else",
    otherBody: "Any harness that speaks MCP over streamable HTTP, or plain REST.",
    mcpEndpoint: "MCP endpoint",
    openapiSpec: "OpenAPI spec",
    restBase: "REST base",
  },
};

const fr: Dict = {
  banner: {
    line: "Un projet civique à code source ouvert par Nshipyard. Sans affiliation avec le gouvernement du Canada ni la Ville de Toronto.",
    badge: "Code source ouvert",
  },
  nav: { explorer: "Explorateur", showcase: "Vitrine", developers: "D\u00e9veloppeurs", data: "Donn\u00e9es", back: "Tous les projets" },
  hero: {
    kicker: "Nshipyard Canada · Projet 06",
    title: "À quoi ressemblent 50 millions de contraventions sur une carte.",
    sub: "Toronto émet environ 2,8 millions de contraventions de stationnement par année. La Ville publie chaque contravention : date, heure, code d'infraction, amende et adresse. Ce projet géocode trois années de contraventions (2023-2025) par arrondissement et quartier, pour rendre les patterns d'application visibles au lieu d'anecdotiques.",
    cta1: "Explorer les contraventions",
    cta2: "Lire la méthodologie",
  },
  statsLabels: [
    "contraventions géocodées par arrondissement et quartier, 2023-2025",
    "des contraventions de la tranche appariées à un point d'adresse de la Ville",
    "arrondissements couverts, sur 25",
    "codes d'infraction documentés dans le codebook",
  ],
  explorer: {
    kicker: "Explorateur",
    title: "Recherchez rues, quartiers, arrondissements, infractions.",
    body: "Tapez un nom de rue, un quartier, un arrondissement ou une description d'infraction. Les comptes viennent de la tranche géocodée 2023-2025.",
    search: "Rechercher, p. ex. Yonge, Spadina, borne-incendie…",
    streets: "Rues",
    hoods: "Quartiers",
    wards: "Arrondissements",
    codes: "Codes d'infraction",
    noResult: "Aucun résultat. Essayez un nom de rue, un numéro d'arrondissement ou un mot-clé d'infraction.",
    codebookTitle: "Le codebook des infractions",
    codebookBody: "Chaque code d'infraction de la tranche, avec sa description officielle, son nombre de contraventions et son amende moyenne. Les règles de stationnement de Toronto arrivent sous forme de numéros inexpliqués; voici la traduction.",
    codebookSearch: "Filtrer les codes…",
    colCode: "Code",
    colDesc: "Description",
    colTickets: "Contraventions",
    colAvgFine: "Amende moy.",
  },
  showcase: {
    kicker: "Vitrine",
    title: "La carte de l'application des règlements.",
    body: "Chaque contravention géocodée placée dans son quartier. Les arrondissements du centre-ville absorbent une part de l'application bien au-delà de leur part des rues, et une poignée de pâtés de maisons font l'essentiel du travail.",
    tickets: "contraventions",
    fines: "d'amendes prévues",
    topStreets: "Les rues les plus verbalisées",
    topStreetsBody: "Comptes de contraventions par nom de rue normalisé, 2023-2025. Une seule adresse peut dominer toute une rue.",
    byHour: "Contraventions par heure du jour",
    byHourBody: "L'application suit la journée de travail : elle grimpe dès 7h, culmine en milieu de matinée et retombe après 18h.",
    byMonth: "Contraventions par mois",
    byMonthBody: "Les mois d'été sont systématiquement plus actifs que l'hiver, année après année.",
    byDow: "Contraventions par jour de semaine",
    byDowBody: "Les jours ouvrables portent l'application; les dimanches sont calmes.",
  },
  developers: {
    kicker: "Pour les développeurs",
    title: "Interrogez-les depuis du code, ou depuis un agent.",
    body: "Trois façons de consommer les mêmes données canoniques. REST pour les applications, OpenAPI pour l'intégration, outils MCP en HTTP continu pour les agents IA.",
    endpoints: "Points de terminaison",
    tryIt: "Essayer",
    openapi: "Spécification OpenAPI",
  },
  downloads: {
    kicker: "Données",
    title: "Prenez les fichiers.",
    body: "Versions numérotées, licence MIT. CSV agrégés; les fichiers sources par contravention restent sur le portail de données ouvertes de la Ville.",
    download: "Télécharger",
  },
  methodology: {
    kicker: "Méthodologie",
    title: "Comment les contraventions ont été placées sur la carte.",
    points: [
      "Tranche : données ouvertes \u201cParking Tickets\u201d de la Ville de Toronto, années civiles 2023-2025, récupérées le 2026-10-08. Environ 2,8 millions de contraventions par année.",
      "Géocodage : l'adresse de chaque contravention a été appariée au fichier Points d'adresse (municipal) de la Ville sur le numéro civique plus le nom de rue normalisé. Le point d'adresse fournit l'arrondissement; le quartier du modèle 158 vient d'une jointure point-dans-polygone sur les géométries officielles.",
      "Le taux d'appariement est calculé à partir des données et affiché sur cette page. Les contraventions sans numéro civique (rues seules, intersections) ne peuvent pas être appariées à une adresse et sont comptées comme non appariées.",
      "Ce que cela ne peut pas répondre : qui a été verbalisé (les numéros sont masqués), si une contravention a été payée ou contestée, ni pourquoi l'application se concentre où elle le fait. La densité reflète où les agents verbalisent, pas seulement où les infractions ont lieu.",
    ],
  },
  footer: {
    line: "Un projet civique à code source ouvert par Nshipyard. Sans affiliation avec le gouvernement du Canada ni la Ville de Toronto.",
    sources: "Source des contraventions : Données ouvertes de la Ville de Toronto (Parking Tickets). Adresses : Points d'adresse (municipal), Toronto One Address Repository. Limites : Données ouvertes de la Ville de Toronto (quartiers, arrondissements).",
  },
  mcp: {
    kicker: "Connectez votre agent",
    title: "Exploitez ces données dans vos outils d'IA.",
    body: "Choisissez votre plateforme, copiez l'invite, envoyez-la à votre agent. Votre agent exécute la configuration lui-même.",
    tabs: { chatgpt: "ChatGPT", claude: "Claude", claudecode: "Claude Code", cli: "CLI", other: "Autre" },
    cardTitle: "Copiez et envoyez ceci à {tab}",
    copy: "Copier",
    copied: "Copié",
    chatgptNote: "ChatGPT se connecte via l'API REST documentée plutôt que directement en MCP.",
    pChatgpt:
      "Je veux utiliser {displayName} via son API.\n- Spécification OpenAPI : {origin}/api/openapi.json\n- Base REST : {origin}/api/v1\nD'abord, dis-moi en deux phrases ce que cette API offre, puis {exampleLower}, et montre-moi le résultat.",
    pClaude:
      "Dans Claude (claude.ai), ouvre les paramètres, puis Connecteurs, et ajoute un connecteur personnalisé :\n- Nom : {displayName}\n- URL : {origin}/mcp\nEnsuite, liste les outils disponibles, {exampleLower}, et montre-moi le résultat.",
    pClaudeCode:
      "Configure le serveur MCP {displayName} pour que je puisse l'interroger d'ici.\n1. Exécute : claude mcp add --transport http {slug} {origin}/mcp\n2. Exécute `claude mcp list` pour confirmer la connexion.\n3. {example}, et montre-moi le résultat.",
    pCli:
      "# Point de terminaison MCP (HTTP continu)\n{origin}/mcp\n\n# Lister les outils disponibles\ncurl -s -X POST {origin}/mcp -H 'Content-Type: application/json' \\\n  -d '{\"jsonrpc\":\"2.0\",\"id\":1,\"method\":\"tools/list\"}'",
    otherTitle: "Tout le reste",
    otherBody: "Toute plateforme qui parle MCP en HTTP continu, ou REST tout court.",
    mcpEndpoint: "Point de terminaison MCP",
    openapiSpec: "Spécification OpenAPI",
    restBase: "Base REST",
  },
};

export type Dict = typeof en;

const dicts: Record<Lang, Dict> = { en, fr };

const LangCtx = createContext<{ lang: Lang; setLang: (l: Lang) => void; t: Dict }>({
  lang: "en",
  setLang: () => {},
  t: en,
});

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>("en");
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);
  return <LangCtx.Provider value={{ lang, setLang, t: dicts[lang] }}>{children}</LangCtx.Provider>;
}

export function useLang() {
  return useContext(LangCtx);
}
