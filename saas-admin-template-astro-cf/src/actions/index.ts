import { ActionError, defineAction } from "astro:actions";
import { z } from "astro:schema";
import { env } from "cloudflare:workers";
import { CustomerService } from "@/lib/services/customer";
import { SubscriptionService } from "@/lib/services/subscription";

export const server = {
  // Customer actions
  getCustomers: defineAction({
    handler: async () => {
      const customerService = new CustomerService(env.DB);
      const customers = await customerService.getAll();
      return customers;
    },
  }),

  getCustomer: defineAction({
    input: z.object({
      id: z.number(),
    }),
    handler: async (input) => {
      const customerService = new CustomerService(env.DB);
      const customer = await customerService.getById(input.id);
      
      if (!customer) {
        throw new ActionError({
          code: "NOT_FOUND",
          message: "Customer not found",
        });
      }
      
      return customer;
    },
  }),

  createCustomer: defineAction({
    input: z.object({
      name: z.string().min(2, "Name must be at least 2 characters"),
      email: z.string().email("Invalid email address"),
      notes: z.string().optional(),
      subscription: z.object({
        id: z.number(),
        status: z.string(),
      }).optional(),
    }),
    handler: async (input) => {
      const customerService = new CustomerService(env.DB);
      
      try {
        const result = await customerService.create(input);
        return result;
      } catch (error) {
        throw new ActionError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Failed to create customer",
        });
      }
    },
  }),

  // Subscription actions
  getSubscriptions: defineAction({
    handler: async () => {
      const subscriptionService = new SubscriptionService(env.DB);
      const subscriptions = await subscriptionService.getAll();
      return subscriptions;
    },
  }),

  getSubscription: defineAction({
    input: z.object({
      id: z.number(),
    }),
    handler: async (input) => {
      const subscriptionService = new SubscriptionService(env.DB);
      const subscription = await subscriptionService.getById(input.id);
      
      if (!subscription) {
        throw new ActionError({
          code: "NOT_FOUND",
          message: "Subscription not found",
        });
      }
      
      return subscription;
    },
  }),

  createSubscription: defineAction({
    input: z.object({
      name: z.string().min(2, "Name must be at least 2 characters"),
      description: z.string().min(10, "Description must be at least 10 characters"),
      price: z.number().min(0, "Price must be a positive number"),
      features: z.array(
        z.object({
          name: z.string().min(2, "Feature name must be at least 2 characters"),
          description: z.string().optional(),
        })
      ).optional(),
    }),
    handler: async (input) => {
      const subscriptionService = new SubscriptionService(env.DB);
      
      try {
        const result = await subscriptionService.create(input);
        return result;
      } catch (error) {
        throw new ActionError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Failed to create subscription",
        });
      }
    },
  }),

  // Workflow actions
  // Note: Workflows require additional configuration with workerEntryPoint
  // See: https://docs.astro.build/en/guides/integrations-guide/cloudflare/#workerentrypoint
  runCustomerWorkflow: defineAction({
    input: z.object({
      customerId: z.string(),
    }),
    handler: async (input) => {
      if (!('CUSTOMER_WORKFLOW' in env)) {
        throw new ActionError({
          code: "NOT_FOUND",
          message: "Workflow binding not configured. Add CUSTOMER_WORKFLOW to wrangler config.",
        });
      }
      
      try {
        await (env as any).CUSTOMER_WORKFLOW.create({ params: { id: input.customerId } });
        return { success: true };
      } catch (error) {
        throw new ActionError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : "Failed to run workflow",
        });
      }
    },
  }),
};
