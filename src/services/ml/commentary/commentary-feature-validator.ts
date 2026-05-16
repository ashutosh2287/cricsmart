import { getRuntimeFeatureContract } from "./commentary-runtime-contract";

export type FeatureValidationResult = {
  valid: boolean;
  errors: string[];
  orderedFeatures: Array<string | number>;
};

const CONTRACT = getRuntimeFeatureContract();

export function validateCommentaryFeatures(input: {
  featureMap: Record<string, string | number | null | undefined>;
  expectedOrder: string[];
}): FeatureValidationResult {
  const errors: string[] = [];

  const expected = input.expectedOrder;
  const available = Object.keys(input.featureMap);

  const missing = expected.filter((name) => !(name in input.featureMap));
  if (missing.length) {
    errors.push(...missing.map((name) => `missing_feature:${name}`));
  }

  const unknown = available.filter((name) => !CONTRACT.classifierFeatures.includes(name) && !CONTRACT.rankerFeatures.includes(name));
  if (unknown.length) {
    errors.push(...unknown.map((name) => `unknown_feature:${name}`));
  }

  const canonicalOrder =
    expected.length === CONTRACT.classifierFeatures.length ? CONTRACT.classifierFeatures : CONTRACT.rankerFeatures;
  if (expected.join(",") !== canonicalOrder.join(",")) {
    errors.push("feature_order_mismatch");
  }

  const categorical = new Set(CONTRACT.categoricalFeatures);
  const orderedFeatures = expected.map((name) => {
    const raw = input.featureMap[name];

    if (raw === null || raw === undefined) {
      errors.push(`missing_feature:${name}`);
      return categorical.has(name) ? "" : 0;
    }

    if (categorical.has(name)) {
      if (typeof raw !== "string") {
        errors.push(`invalid_type:${name}:expected_string`);
      }
      const value = String(raw);
      if (name === "phase_of_match" && !["POWERPLAY", "MIDDLE_OVERS", "DEATH_OVERS"].includes(value)) {
        errors.push(`invalid_category:${name}:${value}`);
      }
      return value;
    }

    if (typeof raw !== "number" && typeof raw !== "string") {
      errors.push(`invalid_type:${name}:expected_numeric`);
      return 0;
    }

    const numeric = Number(raw);
    if (Number.isNaN(numeric)) {
      errors.push(`nan_feature:${name}`);
      return 0;
    }

    if (!Number.isFinite(numeric)) {
      errors.push(`invalid_numeric:${name}`);
      return 0;
    }

    return numeric;
  });

  return {
    valid: errors.length === 0,
    errors,
    orderedFeatures,
  };
}
