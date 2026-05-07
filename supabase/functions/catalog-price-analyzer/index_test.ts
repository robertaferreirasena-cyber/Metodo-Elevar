import {
  assertEquals,
  assertThrows,
  assert,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import { parseAnalysisResponse, filterValidProducts } from "./index.ts";

Deno.test("parseAnalysisResponse: keeps all products even with null fields", () => {
  const raw = JSON.stringify({
    products: [
      { name: "Esmalte Vermelho", detected_price: 12, estimated_cost: null, freight_estimate: null, margin_percent: null, expected_monthly_units: null },
      { name: "Tintura Loira", detected_price: null, estimated_cost: 25, freight_estimate: 4, margin_percent: 35, expected_monthly_units: 8 },
      { name: "Shampoo", detected_price: null, estimated_cost: null, freight_estimate: null, packaging_estimate: null, margin_percent: null, expected_monthly_units: null },
    ],
    insights: [],
    pricing_recommendations: [],
  });
  const parsed = parseAnalysisResponse(raw);
  assertEquals(parsed.products.length, 3);
  assertEquals(parsed.products[0].estimated_cost, null);
  assertEquals(parsed.products[2].margin_percent, null);
});

Deno.test("parseAnalysisResponse: strips markdown fences", () => {
  const raw = "```json\n" + JSON.stringify({ products: [{ name: "X" }], insights: [], pricing_recommendations: [] }) + "\n```";
  const parsed = parseAnalysisResponse(raw);
  assertEquals(parsed.products.length, 1);
});

Deno.test("parseAnalysisResponse: recovers truncated array", () => {
  // Truncated AI output — last product object cut mid-string
  const truncated =
    `{"products":[{"name":"A","detected_price":10},{"name":"B","detected_price":20},{"name":"C","detected_pri`;
  const parsed = parseAnalysisResponse(truncated, "length");
  assert(Array.isArray(parsed.products));
  assertEquals(parsed.products.length, 2);
  assertEquals(parsed.products[0].name, "A");
  assertEquals(parsed.products[1].name, "B");
});

Deno.test("parseAnalysisResponse: throws clear message on length truncation with nothing salvageable", () => {
  const raw = "not even json";
  assertThrows(
    () => parseAnalysisResponse(raw, "length"),
    Error,
    "cortada por excesso",
  );
});

Deno.test("filterValidProducts: drops only nameless / invalid entries, keeps null fields", () => {
  const list = [
    { name: "Produto Válido", estimated_cost: null, freight_estimate: null },
    { name: "", detected_price: 10 },
    { name: "   ", detected_price: 15 },
    null,
    undefined,
    { detected_price: 20 }, // missing name
    { name: "Outro Válido", margin_percent: null, expected_monthly_units: null },
  ];
  const result = filterValidProducts(list as any);
  assertEquals(result.length, 2);
  assertEquals(result[0].name, "Produto Válido");
  assertEquals(result[1].name, "Outro Válido");
  // null fields preserved (not dropped)
  assertEquals(result[0].estimated_cost, null);
  assertEquals(result[1].margin_percent, null);
});

Deno.test("filterValidProducts: returns [] for non-array input", () => {
  assertEquals(filterValidProducts(null as any), []);
  assertEquals(filterValidProducts(undefined as any), []);
  assertEquals(filterValidProducts({} as any), []);
});

Deno.test("end-to-end tolerance: parse + filter never silently drops a named product with all nulls", () => {
  const raw = JSON.stringify({
    products: [
      { name: "Catálogo Mínimo", estimated_cost: null, detected_price: null, suggested_price: null, freight_estimate: null, packaging_estimate: null, margin_percent: null, expected_monthly_units: null, cost_source: "missing" },
    ],
    insights: [],
    pricing_recommendations: [],
  });
  const parsed = parseAnalysisResponse(raw);
  const products = filterValidProducts(parsed.products);
  assertEquals(products.length, 1);
  assertEquals(products[0].name, "Catálogo Mínimo");
});
