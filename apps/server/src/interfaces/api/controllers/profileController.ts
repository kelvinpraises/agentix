import { Request, Response } from "express";

import { User, UserUpdate } from "@/models/User";
import { profileService } from "@/services/user/profile-service";
import { sanitizeUser } from "@/utils/user";

interface ProfileResponse extends Omit<User, "password_hash"> {}

interface UpdateProfileRequestBody extends UserUpdate {}

const profileController = {
  async getProfile(req: Request, res: Response<ProfileResponse | { error: string }>) {
    try {
      if (!req.user || !req.user.id) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }
      const profile = await profileService.getUserProfile(req.user.id);
      if (!profile) {
        res.status(404).json({ error: "Profile not found" });
        return;
      }
      res.json(sanitizeUser(profile));
    } catch (error) {
      res.status(500).json({ error: "An error occurred while fetching the profile." });
    }
  },

  async getFullProfile(req: Request, res: Response) {
    try {
      if (!req.user || !req.user.id) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }
      const profile = await profileService.getUserProfileWithSectors(req.user.id);
      if (!profile) {
        res.status(404).json({ error: "Profile not found" });
        return;
      }
      const { password_hash, ...safeProfile } = profile;
      res.json(safeProfile);
    } catch (error) {
      res.status(500).json({ error: "An error occurred while fetching the full profile." });
    }
  },

  async updateProfile(
    req: Request<{}, {}, UpdateProfileRequestBody>,
    res: Response<{} | { error: string }>
  ) {
    try {
      if (!req.user || !req.user.id) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }
      await profileService.updateUserProfile(req.user.id, req.body);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "An error occurred while updating the profile." });
    }
  },
};

export default profileController;
