import type { SyncBootstrapResponseDto, SyncPushRequestDto, SyncPushResultDto } from "@sudoku/contracts";

export async function fetchBootstrap(): Promise<SyncBootstrapResponseDto> {
  const res = await fetch("/api/v1/sync/bootstrap");
  if (!res.ok) throw new Error(`Sync bootstrap failed: ${res.status}`);
  return res.json() as Promise<SyncBootstrapResponseDto>;
}

export async function pushChanges(body: SyncPushRequestDto): Promise<SyncPushResultDto> {
  const res = await fetch("/api/v1/sync/push", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error(`Sync push failed: ${res.status}`);
  return res.json() as Promise<SyncPushResultDto>;
}
