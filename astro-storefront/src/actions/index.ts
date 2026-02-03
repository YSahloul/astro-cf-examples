import { defineAction, ActionError } from 'astro:actions';
import { z } from 'astro/zod';
import { createPayload } from '../lib/payload';

const CART_COOKIE = 'cart';

// Helper to get payload SDK from action context
function getPayload(context: any) {
  return createPayload(context.locals?.runtime?.env?.PAYLOAD_CMS);
}

export const server = {
  // Add item to cart
  addToCart: defineAction({
    accept: 'form',
    input: z.object({
      productId: z.coerce.number(),
      variantId: z.coerce.number().optional(),
      quantity: z.coerce.number().min(1).default(1),
    }),
    handler: async (input, context) => {
      const payload = getPayload(context);
      let cartId = context.cookies.get(CART_COOKIE)?.value;
      let cart;

      if (cartId) {
        try {
          cart = await payload.findByID({
            collection: 'carts',
            id: cartId,
            depth: 2,
          });
        } catch {
          cart = null;
        }
      }

      // Create cart if doesn't exist
      if (!cart) {
        cart = await payload.create({
          collection: 'carts',
          data: {
            items: [],
            currency: 'USD',
          },
        });
        context.cookies.set(CART_COOKIE, String(cart.id), {
          path: '/',
          httpOnly: true,
          secure: true,
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 30, // 30 days
        });
      }

      // Find existing item or add new
      const existingItemIndex = cart.items?.findIndex(
        (i: any) => {
          const productId = typeof i.product === 'number' ? i.product : i.product?.id;
          const variantId = typeof i.variant === 'number' ? i.variant : i.variant?.id;
          return productId === input.productId && variantId === input.variantId;
        }
      ) ?? -1;

      let newItems: any[];
      if (existingItemIndex >= 0 && cart.items) {
        newItems = cart.items.map((i: any, idx: number) =>
          idx === existingItemIndex
            ? { ...i, quantity: i.quantity + input.quantity }
            : i
        );
      } else {
        newItems = [
          ...(cart.items || []),
          {
            id: crypto.randomUUID(),
            product: input.productId,
            variant: input.variantId,
            quantity: input.quantity,
          },
        ];
      }

      const updatedCart = await payload.update({
        collection: 'carts',
        id: cart.id,
        data: { items: newItems },
      });

      return {
        success: true,
        cart: updatedCart,
        itemCount: updatedCart.items?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 0,
      };
    },
  }),

  // Remove item from cart
  removeFromCart: defineAction({
    accept: 'form',
    input: z.object({
      itemId: z.string(),
    }),
    handler: async (input, context) => {
      const payload = getPayload(context);
      const cartId = context.cookies.get(CART_COOKIE)?.value;

      if (!cartId) {
        throw new ActionError({
          code: 'NOT_FOUND',
          message: 'Cart not found',
        });
      }

      const cart = await payload.findByID({
        collection: 'carts',
        id: cartId,
        depth: 2,
      });

      const newItems = cart.items?.filter((i: any) => i.id !== input.itemId) || [];

      const updatedCart = await payload.update({
        collection: 'carts',
        id: cart.id,
        data: { items: newItems },
      });

      return {
        success: true,
        cart: updatedCart,
        itemCount: updatedCart.items?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 0,
      };
    },
  }),

  // Update item quantity
  updateQuantity: defineAction({
    accept: 'form',
    input: z.object({
      itemId: z.string(),
      quantity: z.coerce.number().min(0),
    }),
    handler: async (input, context) => {
      const payload = getPayload(context);
      const cartId = context.cookies.get(CART_COOKIE)?.value;

      if (!cartId) {
        throw new ActionError({
          code: 'NOT_FOUND',
          message: 'Cart not found',
        });
      }

      const cart = await payload.findByID({
        collection: 'carts',
        id: cartId,
        depth: 2,
      });

      // If quantity is 0, remove the item
      if (input.quantity === 0) {
        const newItems = cart.items?.filter((i: any) => i.id !== input.itemId) || [];
        const updatedCart = await payload.update({
          collection: 'carts',
          id: cart.id,
          data: { items: newItems },
        });
        return {
          success: true,
          cart: updatedCart,
          itemCount: updatedCart.items?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 0,
        };
      }

      const newItems = cart.items?.map((i: any) =>
        i.id === input.itemId ? { ...i, quantity: input.quantity } : i
      ) || [];

      const updatedCart = await payload.update({
        collection: 'carts',
        id: cart.id,
        data: { items: newItems },
      });

      return {
        success: true,
        cart: updatedCart,
        itemCount: updatedCart.items?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 0,
      };
    },
  }),

  // Get cart
  getCart: defineAction({
    handler: async (_input, context) => {
      const payload = getPayload(context);
      const cartId = context.cookies.get(CART_COOKIE)?.value;

      if (!cartId) {
        return { cart: null, itemCount: 0 };
      }

      try {
        const cart = await payload.findByID({
          collection: 'carts',
          id: cartId,
          depth: 2,
        });

        return {
          cart,
          itemCount: cart.items?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 0,
        };
      } catch {
        return { cart: null, itemCount: 0 };
      }
    },
  }),

  // Clear cart
  clearCart: defineAction({
    handler: async (_input, context) => {
      context.cookies.delete(CART_COOKIE, { path: '/' });
      return { success: true };
    },
  }),
};
