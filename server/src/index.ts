import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

// Import all schemas
import {
  createGuestInputSchema,
  updateGuestInputSchema,
  deleteInputSchema,
  createBudgetItemInputSchema,
  updateBudgetItemInputSchema,
  createTaskInputSchema,
  updateTaskInputSchema,
  createVendorInputSchema,
  updateVendorInputSchema
} from './schema';

// Import all handlers
import { createGuest } from './handlers/create_guest';
import { getGuests } from './handlers/get_guests';
import { updateGuest } from './handlers/update_guest';
import { deleteGuest } from './handlers/delete_guest';

import { createBudgetItem } from './handlers/create_budget_item';
import { getBudgetItems } from './handlers/get_budget_items';
import { updateBudgetItem } from './handlers/update_budget_item';
import { deleteBudgetItem } from './handlers/delete_budget_item';

import { createTask } from './handlers/create_task';
import { getTasks } from './handlers/get_tasks';
import { updateTask } from './handlers/update_task';
import { deleteTask } from './handlers/delete_task';

import { createVendor } from './handlers/create_vendor';
import { getVendors } from './handlers/get_vendors';
import { updateVendor } from './handlers/update_vendor';
import { deleteVendor } from './handlers/delete_vendor';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  // Health check endpoint
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Guest management endpoints
  createGuest: publicProcedure
    .input(createGuestInputSchema)
    .mutation(({ input }) => createGuest(input)),
  
  getGuests: publicProcedure
    .query(() => getGuests()),
  
  updateGuest: publicProcedure
    .input(updateGuestInputSchema)
    .mutation(({ input }) => updateGuest(input)),
  
  deleteGuest: publicProcedure
    .input(deleteInputSchema)
    .mutation(({ input }) => deleteGuest(input)),

  // Budget management endpoints
  createBudgetItem: publicProcedure
    .input(createBudgetItemInputSchema)
    .mutation(({ input }) => createBudgetItem(input)),
  
  getBudgetItems: publicProcedure
    .query(() => getBudgetItems()),
  
  updateBudgetItem: publicProcedure
    .input(updateBudgetItemInputSchema)
    .mutation(({ input }) => updateBudgetItem(input)),
  
  deleteBudgetItem: publicProcedure
    .input(deleteInputSchema)
    .mutation(({ input }) => deleteBudgetItem(input)),

  // Task management endpoints
  createTask: publicProcedure
    .input(createTaskInputSchema)
    .mutation(({ input }) => createTask(input)),
  
  getTasks: publicProcedure
    .query(() => getTasks()),
  
  updateTask: publicProcedure
    .input(updateTaskInputSchema)
    .mutation(({ input }) => updateTask(input)),
  
  deleteTask: publicProcedure
    .input(deleteInputSchema)
    .mutation(({ input }) => deleteTask(input)),

  // Vendor management endpoints
  createVendor: publicProcedure
    .input(createVendorInputSchema)
    .mutation(({ input }) => createVendor(input)),
  
  getVendors: publicProcedure
    .query(() => getVendors()),
  
  updateVendor: publicProcedure
    .input(updateVendorInputSchema)
    .mutation(({ input }) => updateVendor(input)),
  
  deleteVendor: publicProcedure
    .input(deleteInputSchema)
    .mutation(({ input }) => deleteVendor(input)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`Wedding Planner TRPC server listening at port: ${port}`);
}

start();