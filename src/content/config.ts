import { defineCollection, z } from "astro:content";

const projects = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    summary: z.string().optional(),
    tags: z.array(z.string()).optional(),
    image: z.string().optional(),   // ⬅️ sträng, inte image()
    repo: z.string().url().optional(),
    demo: z.string().url().optional(),
    date: z.string().optional(),
  }),
});

export const collections = { projects };
