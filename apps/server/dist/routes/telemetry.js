import { telemetryEventSchema } from "@sudoku/contracts";
export async function telemetryRoutes(app) {
    app.post("/api/v1/telemetry", async (request, reply) => {
        const parsed = telemetryEventSchema.safeParse(request.body);
        if (!parsed.success) {
            return reply.status(400).send({ message: "Invalid telemetry event" });
        }
        app.log.info({ event: parsed.data.event, guestId: request.guestId, payload: parsed.data.payload }, "telemetry");
        return reply.status(204).send();
    });
}
//# sourceMappingURL=telemetry.js.map