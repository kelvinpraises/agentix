import { Request, Response } from "express";

import { Policy, PolicyUpdate } from "@/models/Policy";
import { tradespaceService } from "@/services/user/tradespace-service";
import { PolicyDocument } from "@/types/policy";

interface PolicyResponse extends Policy {}

interface CreatePolicyRequestBody {
  policy_document: PolicyDocument;
  ai_critique?: string;
}

interface UpdatePolicyRequestBody extends PolicyUpdate {}

const policyController = {
  async getSectorPolicy(req: Request, res: Response<PolicyResponse | { error: string }>) {
    try {
      const userId = req.user.id;
      const sectorId = parseInt(req.params.sectorId);

      const policy = await tradespaceService.getSectorPolicy(sectorId, userId);
      if (!policy) {
        res.status(404).json({ error: "Policy not found" });
        return;
      }
      res.json(policy);
    } catch (error) {
      console.error("Error fetching policy:", error);
      if (error instanceof Error && error.message === "Sector not found") {
        res.status(404).json({ error: "Sector not found" });
      } else {
        res.status(500).json({ error: "An error occurred while fetching the policy." });
      }
    }
  },

  async getSectorPolicyHistory(req: Request, res: Response<Policy[] | { error: string }>) {
    try {
      const userId = req.user.id;
      const sectorId = parseInt(req.params.sectorId);

      const policies = await tradespaceService.getSectorPolicyHistory(sectorId, userId);
      res.json(policies);
    } catch (error) {
      console.error("Error fetching policy history:", error);
      if (error instanceof Error && error.message === "Sector not found") {
        res.status(404).json({ error: "Sector not found" });
      } else {
        res.status(500).json({ error: "An error occurred while fetching policy history." });
      }
    }
  },

  async createSectorPolicy(
    req: Request<{ sectorId: string }, {}, CreatePolicyRequestBody>,
    res: Response<PolicyResponse | { error: string }>
  ) {
    try {
      const userId = req.user.id;
      const sectorId = parseInt(req.params.sectorId);

      const policy = await tradespaceService.createSectorPolicy(
        sectorId,
        userId,
        req.body.policy_document,
        req.body.ai_critique
      );

      if (!policy) {
        res.status(500).json({ error: "Failed to create policy" });
        return;
      }

      res.status(201).json(policy);
    } catch (error) {
      console.error("Error creating policy:", error);
      if (error instanceof Error && error.message === "Sector not found") {
        res.status(404).json({ error: "Sector not found" });
      } else {
        res.status(500).json({ error: "An error occurred while creating the policy." });
      }
    }
  },

  async updateSectorPolicy(
    req: Request<{ sectorId: string }, {}, UpdatePolicyRequestBody>,
    res: Response<{} | { error: string }>
  ) {
    try {
      const userId = req.user.id;
      const sectorId = parseInt(req.params.sectorId);

      await tradespaceService.updateSectorPolicy(sectorId, userId, req.body);
      res.status(204).send();
    } catch (error) {
      console.error("Error updating policy:", error);
      if (error instanceof Error && error.message === "Sector not found") {
        res.status(404).json({ error: "Sector not found" });
      } else {
        res.status(500).json({ error: "An error occurred while updating the policy." });
      }
    }
  },

  async activatePolicyVersion(
    req: Request<{ sectorId: string; version: string }>,
    res: Response<PolicyResponse | { error: string }>
  ) {
    try {
      const userId = req.user.id;
      const sectorId = parseInt(req.params.sectorId);
      const version = parseInt(req.params.version);

      const policy = await tradespaceService.activatePolicyVersion(
        sectorId,
        userId,
        version
      );
      if (!policy) {
        res.status(404).json({ error: "Policy version not found" });
        return;
      }

      res.json(policy);
    } catch (error) {
      console.error("Error activating policy version:", error);
      if (error instanceof Error && error.message === "Sector not found") {
        res.status(404).json({ error: "Sector not found" });
      } else {
        res
          .status(500)
          .json({ error: "An error occurred while activating policy version." });
      }
    }
  },
};

export default policyController;
