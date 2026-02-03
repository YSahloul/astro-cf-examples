import { actions } from "astro:actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Workflow } from "lucide-react";
import { useState } from "react";

export function RunCustomerWorkflowButton({
  customerId,
}: {
  customerId: string;
}) {
  const [open, setOpen] = useState(false);

  const onSubmit = async () => {
    const { error } = await actions.runCustomerWorkflow({ customerId });

    if (error) {
      console.error("Error running workflow:", error);
      return;
    }

    setOpen(false);
    window.location.reload();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Workflow className="mr-2 size-4" />
          Run Customer Workflow
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Run Customer Workflow</DialogTitle>
        </DialogHeader>

        <DialogDescription>
          This will run a workflow for the customer. This is completely
          customizable and can be used to do whatever you want. Check out{" "}
          <code>src/workflows/customer.ts</code> to get started!
        </DialogDescription>

        <form onSubmit={onSubmit} className="space-y-4">
          <Button type="submit" className="w-full">
            Run Customer Workflow
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
