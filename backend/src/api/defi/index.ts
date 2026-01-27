import { FastifyInstance } from "fastify";
import { DefiService } from "../../application/defi/defiService";
import getDefiRoutes from "./get";

export default function defiRoutes(app: FastifyInstance, {
  defiService
}: {
  defiService: DefiService,
}) {

  app.register(getDefiRoutes, {
    defiService
  });
}
