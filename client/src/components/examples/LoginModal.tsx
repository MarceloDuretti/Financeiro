import { useState } from "react";
import LoginModal from "../LoginModal";
import { Button } from "@/components/ui/button";

export default function LoginModalExample() {
  const [open, setOpen] = useState(false);

  return (
    <div className="p-8">
      <Button onClick={() => setOpen(true)}>Open Login Modal</Button>
      <LoginModal open={open} onOpenChange={setOpen} />
    </div>
  );
}
