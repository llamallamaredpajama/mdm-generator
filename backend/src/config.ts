import { z } from 'zod'

const ConfigSchema = z.object({
  port: z.coerce.number().default(8080),
  projectId: z.string().default('mdm-generator'),
  vertexLocation: z.string().default('us-central1'),
  credentialsPath: z.string().optional(),
  credentialsJson: z.string().optional(),
  frontendUrl: z.string().optional(),
  nodeEnv: z.string().default('production'),
  llm: z.object({
    model: z.string().default('gemini-2.5-pro'),
    temperature: z.number().default(0.2),
    topP: z.number().default(0.95),
    maxOutputTokens: z.number().default(16384),
    defaultTimeoutMs: z.number().default(55000),
    heavyTimeoutMs: z.number().default(90000),
  }).default({}),
  limits: z.object({
    maxSubmissionsPerSection: z.number().default(2),
    globalRateLimit: z.number().default(60),
    llmRateLimit: z.number().default(10),
    parseRateLimit: z.number().default(5),
    cacheTtlMs: z.number().default(300000),
    bodyLimitMb: z.string().default('1mb'),
    narrativeMaxLength: z.number().default(16000),
  }).default({}),
})

export type Config = z.infer<typeof ConfigSchema>

export const config: Config = ConfigSchema.parse({
  port: process.env.PORT,
  projectId: process.env.PROJECT_ID,
  vertexLocation: process.env.VERTEX_LOCATION,
  credentialsPath: process.env.GOOGLE_APPLICATION_CREDENTIALS,
  credentialsJson: process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON,
  frontendUrl: process.env.FRONTEND_URL,
  nodeEnv: process.env.NODE_ENV,
})
