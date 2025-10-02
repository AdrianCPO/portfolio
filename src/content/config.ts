// src/content/config.ts
import { defineCollection, z } from "astro:content";

const projects = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    summary: z.string().optional(),
    tags: z.array(z.string()).optional(),
    image: z.string().optional(),
    repo: z.string().url().optional(),
    demo: z.string().url().optional(),
    date: z.string().optional(),
  }),
});

const backgrounds = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    image: z.string().optional(),   // relativ path till bild under /public
    summary: z.string().optional(),
    order: z.number().optional(),   // för sortering på startsidan
  }),
});

export const collections = { projects, backgrounds };
