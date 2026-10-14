import { z } from 'zod';

export type RuleType =
  | 'numeric_max'
  | 'numeric_min'
  | 'equals'
  | 'one_of'
  | 'boolean_true'
  | 'all'
  | 'any';

export interface BaseRule {
  description?: string;
}

export interface NumericMaxRule extends BaseRule {
  type: 'numeric_max';
  field: string;
  value: number;
}

export interface NumericMinRule extends BaseRule {
  type: 'numeric_min';
  field: string;
  value: number;
}

export interface EqualsRule extends BaseRule {
  type: 'equals';
  field: string;
  value: string | number | boolean;
}

export interface OneOfRule extends BaseRule {
  type: 'one_of';
  field: string;
  values: (string | number)[];
}

export interface BooleanTrueRule extends BaseRule {
  type: 'boolean_true';
  field: string;
}

export interface AllRule extends BaseRule {
  type: 'all';
  rules: RuleDefinition[];
}

export interface AnyRule extends BaseRule {
  type: 'any';
  rules: RuleDefinition[];
}

export type RuleDefinition =
  | NumericMaxRule
  | NumericMinRule
  | EqualsRule
  | OneOfRule
  | BooleanTrueRule
  | AllRule
  | AnyRule;

export const RuleDefinitionSchema: z.ZodType<RuleDefinition> = z.lazy(() =>
  z.discriminatedUnion('type', [
    z.object({
      type: z.literal('numeric_max'),
      field: z.string(),
      value: z.number(),
      description: z.string().optional(),
    }),
    z.object({
      type: z.literal('numeric_min'),
      field: z.string(),
      value: z.number(),
      description: z.string().optional(),
    }),
    z.object({
      type: z.literal('equals'),
      field: z.string(),
      value: z.union([z.string(), z.number(), z.boolean()]),
      description: z.string().optional(),
    }),
    z.object({
      type: z.literal('one_of'),
      field: z.string(),
      values: z.array(z.union([z.string(), z.number()])),
      description: z.string().optional(),
    }),
    z.object({
      type: z.literal('boolean_true'),
      field: z.string(),
      description: z.string().optional(),
    }),
    z.object({
      type: z.literal('all'),
      rules: z.array(RuleDefinitionSchema),
      description: z.string().optional(),
    }),
    z.object({
      type: z.literal('any'),
      rules: z.array(RuleDefinitionSchema),
      description: z.string().optional(),
    }),
  ]),
);
