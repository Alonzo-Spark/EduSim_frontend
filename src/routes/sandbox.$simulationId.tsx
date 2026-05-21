import { createFileRoute } from "@tanstack/react-router";
import SandboxPage from "@/sandbox/pages/SandboxPage";

export const Route = createFileRoute("/sandbox/$simulationId")({
  component: SandboxPage,
});
