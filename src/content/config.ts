import { defineCollection, z } from 'astro:content';

const sectionsCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.date().optional(),
    priority: z.number().optional(),
    phaseId: z.enum(['overview', 'discovery', 'strategy', 'execution', 'scale']).optional(),
    tags: z.array(z.string()).optional(),
    bbox: z.object({
      rMin: z.number(),
      rMax: z.number(),
      tMin: z.number(),
      tMax: z.number(),
    }).optional(),
  }),
});

const casesCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    client: z.string(),
    industry: z.string(),
    projectType: z.enum(['Software', 'Branding', 'Audiovisual', 'Consulting', 'Startups', 'Events']),
    year: z.number(),
    coverImage: z.string().optional(),
    phaseId: z.enum(['overview', 'discovery', 'strategy', 'execution', 'scale']).optional(),
    tags: z.array(z.string()),
    results: z.object({
      metric: z.string(),
      value: z.string(),
      impact: z.string(),
    }).array().optional(),
    featured: z.boolean().default(false),
  }),
});

const postsCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.date(),
    author: z.string().default('Equipo STRTGY'),
    coverImage: z.string().optional(),
    tags: z.array(z.string()),
    phaseId: z.enum(['overview', 'discovery', 'strategy', 'execution', 'scale']).optional(),
    featured: z.boolean().default(false),
    readTime: z.number().optional(), // minutes
  }),
});

const resourcesCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    resourceType: z.enum(['Framework', 'Template', 'Guide', 'Tool', 'Whitepaper']),
    downloadUrl: z.string().optional(),
    externalUrl: z.string().optional(),
    coverImage: z.string().optional(),
    tags: z.array(z.string()),
    phaseId: z.enum(['overview', 'discovery', 'strategy', 'execution', 'scale']).optional(),
    featured: z.boolean().default(false),
    pubDate: z.date().optional(),
  }),
});

export const collections = {
  'sections': sectionsCollection,
  'cases': casesCollection,
  'posts': postsCollection,
  'resources': resourcesCollection,
};

