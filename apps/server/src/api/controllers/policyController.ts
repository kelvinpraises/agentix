import { Request, Response } from "express";

import { Policy, PolicyUpdate } from "@/models/Policy";
import { policyService } from "@/services/user/policy-service";

interface PolicyResponse extends Policy {}

interface UpdatePolicyRequestBody extends PolicyUpdate {}

const policyController = {
  async getPolicy(req: Request, res: Response<PolicyResponse | { error: string }>) {
    try {
      if (!req.user || !req.user.id) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }
      const policy = await policyService.getUserPolicy(req.user.id);
      if (!policy) {
        res.status(404).json({ error: "Policy not found" });
        return;
      }
      res.json(policy);
    } catch (error) {
      res.status(500).json({ error: "An error occurred while fetching the policy." });
    }
  },

  async updatePolicy(
    req: Request<{}, {}, UpdatePolicyRequestBody>,
    res: Response<{} | { error: string }>
  ) {
    try {
      if (!req.user || !req.user.id) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }
      await policyService.updateUserPolicy(req.user.id, req.body);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "An error occurred while updating the policy." });
    }
  },
};

export default policyController;