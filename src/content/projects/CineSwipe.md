---
title: "CineSwipe"
slug: "cineswipe"
summary: "Ett grupprojekt i React där användaren kan swipa bland trendande filmer och serier och spara favoriter i en personlig watchlist."
tags: ["React", "JavaScript", "Vite"]
poster: "/images/CineSwipe.png"
previewVideo: "/videos/CineSwipe.mp4"
repo: "https://github.com/AdrianCPO/CineSwipe"
date: "2025-09-01"
---

## Problem

Under ett skolprojekt ville vi undersöka hur ett välkänt interaktionsmönster, swipe-beteendet, kunde användas i ett annat sammanhang än dejtingappar. Målet var att skapa en mobil- och läsplatteanpassad webbapp där användaren snabbt och intuitivt kan upptäcka filmer och serier utan att behöva navigera genom stora mängder information.

## Lösning

Tillsammans i en grupp på tre personer byggde vi CineSwipe, en React-baserad webbapp som hämtar trendande titlar från TMDB och presenterar dem i ett kortbaserat gränssnitt. Användaren kan svepa höger eller trycka på hjärtat för att spara en titel i sin watchlist, eller svepa vänster för att hoppa över den. Vi byggde också en detaljvy i modal, lokal lagring av watchlist och tydlig felhantering med möjlighet att försöka igen vid misslyckade API-anrop.

## Fokus i projektet

- skapa ett tydligt och responsivt gränssnitt för mobil och läsplatta
- bygga en interaktiv swipe-upplevelse med kortstack
- integrera extern data från TMDB
- hantera lokalt sparad data med LocalStorage och SessionStorage
- skapa tydliga tillstånd för loading, error och ready
- bygga en bättre användarupplevelse med toast-notiser och modaler

## Stack

React, React Router, Vite, JavaScript, CSS, TMDB API, Sonner, Cypress, Vitest, Testing Library

## Lärdomar

Projektet gav mig praktisk erfarenhet av att arbeta i team med både struktur, ansvarsfördelning och gemensamma kodbeslut. Jag fick fördjupa mig i API-integration, komponentstruktur, state-hantering och hur man bygger ett interaktivt gränssnitt som fungerar bra på mindre skärmar. Jag fick också bättre förståelse för värdet av testning, tydlig felhantering och hur små UX-detaljer kan göra stor skillnad i den totala användarupplevelsen.