import { z, defineCollection } from "astro:content";

const projects = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    tags: z.array(z.enum(["React","Vue","Svelte","Vanilla","Node","Design"])),
    image: z.string().optional(),   // t.ex. '/images/xyz.jpg' i /public
    repo: z.string().url().optional(),
    demo: z.string().url().optional(),
    date: z.string().optional(),    // ISO-datum för sortering
  }),
});

export const collections = { projects };