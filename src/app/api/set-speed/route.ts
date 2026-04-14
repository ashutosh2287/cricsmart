import { setSimulationSpeed } from "@/services/simulation/matchSimulator";

export async function POST(req: Request) {
  const { speed } = await req.json();

  console.log("⚡ Speed set to:", speed);

  setSimulationSpeed(speed);

  return Response.json({ success: true });
}