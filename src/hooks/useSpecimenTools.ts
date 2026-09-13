import { useEffect } from "react";
import { flushSync } from "react-dom";
import { specimens } from "../data/specimens";

type Context = {
  registerTool: (
    tool: {
      name: string;
      description: string;
      inputSchema: object;
      annotations: { readOnlyHint: boolean; untrustedContentHint: boolean };
      execute: (input: unknown) => unknown;
    },
    options: { signal: AbortSignal },
  ) => void | Promise<void>;
};

export function useSpecimenTools(select: (id: string) => void) {
  useEffect(() => {
    const context = (document as Document & { modelContext?: Context })
      .modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    const register = (tool: Parameters<Context["registerTool"]>[0]) => {
      try {
        void Promise.resolve(
          context.registerTool(tool, { signal: lifecycle.signal }),
        ).catch(console.warn);
      } catch (error) {
        console.warn("Specimen tool unavailable", error);
      }
    };
    register({
      name: "list_specimens",
      description:
        "Read the available Microcosmos specimens and current selection.",
      inputSchema: {
        type: "object",
        properties: {},
        additionalProperties: false,
      },
      annotations: { readOnlyHint: true, untrustedContentHint: false },
      execute: () => ({
        selected:
          new URLSearchParams(location.search).get("specimen") ||
          specimens[0].id,
        specimens: specimens.map(({ id, name, group }) => ({
          id,
          name,
          group,
        })),
      }),
    });
    register({
      name: "select_specimen",
      description:
        "Navigate the visible atlas to a specimen. Its 3D model loads asynchronously.",
      inputSchema: {
        type: "object",
        properties: {
          id: { type: "string", enum: specimens.map((s) => s.id) },
        },
        required: ["id"],
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      execute: (input) => {
        if (
          !input ||
          typeof input !== "object" ||
          !("id" in input) ||
          typeof input.id !== "string" ||
          !specimens.some((s) => s.id === input.id) ||
          Object.keys(input).some((key) => key !== "id")
        )
          throw new Error("Provide one valid specimen id.");
        const id = input.id;
        flushSync(() => select(id));
        return { selected: id, viewer: "loading asynchronously" };
      },
    });
    return () => lifecycle.abort();
  }, [select]);
}
