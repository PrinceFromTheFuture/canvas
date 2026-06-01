export * from "./guardrail";
export * from "./transform";
export * from "./runner";
export * from "./compile";
export * from "./json";
// Server-safe scope builders (no React.createContext is pulled in here:
// scope.ts only type-imports the render context). Exposed via /eval so server
// code never has to import the package root, which re-exports the client-only
// context module.
export { buildScope, buildWebScope } from "../scope";
