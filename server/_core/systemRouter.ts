import { z } from "zod";
import { notifyOwner } from "./notification";
import { adminProcedure, publicProcedure, router } from "./trpc";
import { getModelStatus, resetModelHealth } from "./modelRouter";
import { getEnabledModelConfigs, ENV } from "./env";

export const systemRouter = router({
  health: publicProcedure
    .input(
      z.object({
        timestamp: z.number().min(0, "timestamp cannot be negative"),
      })
    )
    .query(() => ({
      ok: true,
    })),

  notifyOwner: adminProcedure
    .input(
      z.object({
        title: z.string().min(1, "title is required"),
        content: z.string().min(1, "content is required"),
      })
    )
    .mutation(async ({ input }) => {
      const delivered = await notifyOwner(input);
      return {
        success: delivered,
      } as const;
    }),

  /**
   * 获取模型状态（公开接口）
   */
  modelStatus: publicProcedure.query(() => {
    const models = getModelStatus();
    const enabledCount = models.filter(m => m.enabled).length;
    const healthyCount = models.filter(m => m.healthy).length;

    return {
      defaultModel: ENV.defaultModel,
      autoFailoverEnabled: ENV.enableAutoFailover,
      totalModels: models.length,
      enabledModels: enabledCount,
      healthyModels: healthyCount,
      models: models.map(m => ({
        name: m.name,
        provider: m.provider,
        enabled: m.enabled,
        healthy: m.healthy,
        inCooldown: m.inCooldown,
        priority: m.priority,
      })),
    };
  }),

  /**
   * 重置模型健康状态（管理员接口）
   */
  resetModelHealth: adminProcedure.mutation(() => {
    resetModelHealth();
    return {
      success: true,
      message: "Model health status has been reset",
    };
  }),
});
