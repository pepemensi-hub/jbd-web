import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const blog = defineCollection({
  loader: glob({ pattern: '**/[^_]*.md', base: './src/content/blog' }),
  schema: z.object({
    titulo: z.string().max(60),
    descripcion: z.string().max(155),
    fecha: z.date(),
    actualizado: z.date().optional(),
    cluster: z.enum(['mantenimiento', 'diagnostico', 'local', 'clasicos']),
    keyword: z.string(),
    imagen: z.string().optional(),
    relacionados: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
    faqs: z.array(z.object({ pregunta: z.string(), respuesta: z.string() })).default([]),
  }),
});

export const collections = { blog };
